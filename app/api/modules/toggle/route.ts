// app/api/modules/toggle/route.ts
// Turn a module on or off. One Stripe subscription per user; each paid module is a subscription item.
//   on  → add the item (prorated). No subscription yet? Card on file → create one directly; else → Stripe Checkout.
//   off → remove the item (prorated credit). Last item? Cancel the subscription.
// module_access is written here immediately AND re-synced by the webhook (webhook wins on conflict).
// Env: STRIPE_SECRET_KEY, NEXT_PUBLIC_SITE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL,
//      STRIPE_PRICE_PROTECT, STRIPE_PRICE_VAULT, STRIPE_PRICE_BARTER

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { MODULES, isModuleId, priceIdFor } from '@/lib/modules';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const LIVE = ['active', 'trialing', 'past_due'];

async function setAccess(userId: string, module: string, active: boolean) {
  await admin.from('module_access').upsert({
    user_id: userId, module, active,
    started_at: active ? new Date().toISOString() : undefined,
    ended_at: active ? null : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,module' });
}

export async function POST(req: NextRequest) {
  let step = 'init';
  try {
    step = 'auth';
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    step = 'parse';
    const { module, on } = await req.json();
    if (!isModuleId(module)) return NextResponse.json({ ok: false, error: 'Unknown module' }, { status: 400 });
    step = `module=${module},on=${on}`;
    const def = MODULES[module];

    // Free modules: just record it.
    if (def.price === 0) { await setAccess(user.id, module, !!on); return NextResponse.json({ ok: true, mode: 'free' }); }

    const priceId = priceIdFor(module);
    if (!priceId) return NextResponse.json({ ok: false, error: 'This module is not available for purchase yet.' }, { status: 400 });

    const { data: prof } = await admin.from('profiles').select('stripe_customer_id, stripe_subscription_id, email').eq('id', user.id).maybeSingle();
    let customerId = prof?.stripe_customer_id as string | null;
    if (customerId) {
      // Verify the customer exists in this Stripe mode (catches live-ID-with-test-key)
      try {
        const c = await stripe.customers.retrieve(customerId);
        if ((c as any).deleted) throw new Error('deleted');
      } catch {
        // Stale — clear and fall through to create a fresh one
        customerId = null;
        await admin.from('profiles').update({ stripe_customer_id: null, stripe_subscription_id: null }).eq('id', user.id);
      }
    }
    if (!customerId) {
      const c = await stripe.customers.create({ email: user.email || prof?.email || undefined, metadata: { user_id: user.id } });
      customerId = c.id;
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    // Find a live subscription for this customer (prefer the one we stored).
    let sub: Stripe.Subscription | null = null;
    if (prof?.stripe_subscription_id) {
      try { const s = await stripe.subscriptions.retrieve(prof.stripe_subscription_id); if (LIVE.includes(s.status)) sub = s; } catch {}
    }
    if (!sub) {
      const list = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
      sub = list.data.find(s => LIVE.includes(s.status)) || null;
      if (sub) await admin.from('profiles').update({ stripe_subscription_id: sub.id }).eq('id', user.id);
    }
    const item = sub?.items.data.find(i => i.price.id === priceId) || null;
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gratiacore.com';

    if (on) {
      if (item) { await setAccess(user.id, module, true); return NextResponse.json({ ok: true, mode: 'already' }); }
      if (sub) {
        await stripe.subscriptionItems.create({ subscription: sub.id, price: priceId, quantity: 1, proration_behavior: 'create_prorations' });
        await setAccess(user.id, module, true);
        return NextResponse.json({ ok: true, mode: 'added' });
      }
      // No live subscription. Card on file? Create the subscription directly.
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const pm = customer.invoice_settings?.default_payment_method;
      if (pm) {
        const created = await stripe.subscriptions.create({
          customer: customerId, items: [{ price: priceId, quantity: 1 }],
          default_payment_method: typeof pm === 'string' ? pm : pm.id,
          metadata: { user_id: user.id }, payment_behavior: 'error_if_incomplete',
        });
        await admin.from('profiles').update({ stripe_subscription_id: created.id, plan_status: created.status }).eq('id', user.id);
        await setAccess(user.id, module, true);
        return NextResponse.json({ ok: true, mode: 'created' });
      }
      // First purchase: hosted Checkout collects the card and starts the subscription.
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription', customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: { metadata: { user_id: user.id } },
        metadata: { user_id: user.id, module },
        payment_method_collection: 'always',
        success_url: `${base}/dashboard?on=${module}`,
        cancel_url: `${base}/dashboard/modules`,
        allow_promotion_codes: true,
      });
      return NextResponse.json({ ok: true, mode: 'checkout', url: session.url });
    }

    // OFF
    if (sub && item) {
      if (sub.items.data.length <= 1) {
        await stripe.subscriptions.cancel(sub.id, { prorate: true, invoice_now: true });
        await admin.from('profiles').update({ stripe_subscription_id: null, plan_status: 'canceled' }).eq('id', user.id);
      } else {
        await stripe.subscriptionItems.del(item.id, { proration_behavior: 'create_prorations' });
      }
    }
    await setAccess(user.id, module, false);
    return NextResponse.json({ ok: true, mode: 'removed' });
  } catch (e: any) {
    const msg = e?.message || String(e);
    const hint =
      !process.env.NEXT_PUBLIC_SUPABASE_URL     ? 'NEXT_PUBLIC_SUPABASE_URL missing' :
      !process.env.SUPABASE_SERVICE_ROLE_KEY    ? 'SUPABASE_SERVICE_ROLE_KEY missing' :
      !process.env.STRIPE_SECRET_KEY            ? 'STRIPE_SECRET_KEY missing' :
      msg;
    console.error('modules/toggle error:', hint, e);
    return NextResponse.json({ ok: false, error: msg, hint }, { status: 500 });
  }
}