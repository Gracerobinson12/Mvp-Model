// app/api/modules/checkout/route.ts
// Start payment for SEVERAL modules at once (used at signup). Body: { modules: ['vault','barter',...] }
//   live subscription  → add the missing items (prorated), no Checkout
//   card on file       → create the subscription directly
//   otherwise          → ONE hosted Stripe Checkout session with a line item per module
// Access is granted by the webhook (it syncs module_access from the subscription's items).
// Env: STRIPE_SECRET_KEY, NEXT_PUBLIC_SITE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL,
//      STRIPE_PRICE_PROTECT, STRIPE_PRICE_VAULT, STRIPE_PRICE_BARTER

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { MODULES, isModuleId, priceIdFor } from '@/lib/modules';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const LIVE = ['active', 'trialing', 'past_due'];

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const body = await req.json();
    const requested: string[] = Array.isArray(body?.modules) ? body.modules : [];
    const picks = Array.from(new Set(requested)).filter(m => isModuleId(m) && MODULES[m].price > 0 && priceIdFor(m));
    if (picks.length === 0) return NextResponse.json({ ok: false, error: 'No purchasable modules selected.' }, { status: 400 });
    const lines = picks.map(m => ({ module: m, price: priceIdFor(m) as string }));

    const { data: prof } = await admin.from('profiles').select('stripe_customer_id, stripe_subscription_id, email').eq('id', user.id).maybeSingle();
    let customerId = prof?.stripe_customer_id as string | null;
    if (!customerId) {
      const c = await stripe.customers.create({ email: user.email || prof?.email || undefined, metadata: { user_id: user.id } });
      customerId = c.id;
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    let sub: Stripe.Subscription | null = null;
    if (prof?.stripe_subscription_id) {
      try { const s = await stripe.subscriptions.retrieve(prof.stripe_subscription_id); if (LIVE.includes(s.status)) sub = s; } catch {}
    }
    if (!sub) {
      const list = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
      sub = list.data.find(s => LIVE.includes(s.status)) || null;
      if (sub) await admin.from('profiles').update({ stripe_subscription_id: sub.id }).eq('id', user.id);
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gratiacore.com';

    // Already subscribed: add whatever is missing.
    if (sub) {
      const have = new Set(sub.items.data.map(i => i.price.id));
      for (const l of lines) {
        if (!have.has(l.price)) await stripe.subscriptionItems.create({ subscription: sub.id, price: l.price, quantity: 1, proration_behavior: 'create_prorations' });
      }
      return NextResponse.json({ ok: true, mode: 'added' });
    }

    // Card on file: create the subscription directly.
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const pm = customer.invoice_settings?.default_payment_method;
    if (pm) {
      const created = await stripe.subscriptions.create({
        customer: customerId, items: lines.map(l => ({ price: l.price, quantity: 1 })),
        default_payment_method: typeof pm === 'string' ? pm : pm.id,
        metadata: { user_id: user.id }, payment_behavior: 'error_if_incomplete',
      });
      await admin.from('profiles').update({ stripe_subscription_id: created.id, plan_status: created.status }).eq('id', user.id);
      return NextResponse.json({ ok: true, mode: 'created' });
    }

    // First purchase: one hosted Checkout for everything they picked.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', customer: customerId,
      line_items: lines.map(l => ({ price: l.price, quantity: 1 })),
      subscription_data: { metadata: { user_id: user.id } },
      metadata: { user_id: user.id, modules: picks.join(',') },
      payment_method_collection: 'always',
      success_url: `${base}/dashboard?on=${picks.join(',')}`,
      cancel_url: `${base}/dashboard/modules`,
      allow_promotion_codes: true,
    });
    return NextResponse.json({ ok: true, mode: 'checkout', url: session.url });
  } catch (e: any) {
    console.error('modules/checkout error:', e);
    return NextResponse.json({ ok: false, error: 'Could not start checkout right now. Nothing was charged.' }, { status: 500 });
  }
}