// app/api/stripe/webhook/route.ts — Stripe is the source of truth for paid access.
// Every subscription change re-syncs module_access from the subscription's items:
//   live subscription (active / trialing / past_due) → each priced module on; other paid modules off
//   canceled / unpaid / deleted → all paid modules off
// Comped rows (comp = true, e.g. admins) are never touched. Free modules are never touched.
// Replaces the old has_solutions / has_intelligence flipping.
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL,
//      STRIPE_PRICE_PROTECT, STRIPE_PRICE_VAULT, STRIPE_PRICE_BARTER

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { PAID_MODULES, moduleForPrice } from '@/lib/modules';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const LIVE = ['active', 'trialing', 'past_due'];

async function userIdFor(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.user_id) return sub.metadata.user_id;
  const cid = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const { data } = await admin.from('profiles').select('id').eq('stripe_customer_id', cid).maybeSingle();
  return data?.id || null;
}

async function syncFromSubscription(sub: Stripe.Subscription) {
  const userId = await userIdFor(sub);
  if (!userId) { console.warn('webhook: no user for subscription', sub.id); return; }
  const live = LIVE.includes(sub.status);
  const onModules = new Set<string>();
  if (live) for (const it of sub.items.data) { const m = moduleForPrice(it.price.id); if (m) onModules.add(m); }

  const { data: rows } = await admin.from('module_access').select('module,comp').eq('user_id', userId);
  const comped = new Set((rows || []).filter(r => r.comp).map(r => r.module));
  const now = new Date().toISOString();
  for (const module of PAID_MODULES) {
    if (comped.has(module)) continue;
    const active = onModules.has(module);
    await admin.from('module_access').upsert({ user_id: userId, module, active, ended_at: active ? null : now, updated_at: now }, { onConflict: 'user_id,module' });
  }
  await admin.from('profiles').update({
    stripe_subscription_id: live ? sub.id : null,
    plan_status: sub.status,
  }).eq('id', userId);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    console.error('webhook signature failed:', e.message);
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.subscription) await syncFromSubscription(await stripe.subscriptions.retrieve(s.subscription as string));
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncFromSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case 'invoice.payment_failed': {
        // Stripe moves the subscription to past_due and retries; we keep access during retries.
        // When Stripe finally cancels / marks it unpaid, subscription.updated/deleted turns modules off.
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('webhook handler error:', e);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}