// app/api/stripe/webhook/route.ts
// Stripe calls THIS when things happen. It's the source of truth for "no pay, no access":
// entitlement flags flip ONLY here, based on real Stripe events — never trust the client.
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { TIERS, tierFromPrice } from '@/lib/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Next.js: need the raw body to verify the Stripe signature
export const config = { api: { bodyParser: false } };

async function grantFor(userId: string, tier: string, status: string, trialEnd: number | null, subId: string) {
  const t = TIERS[tier];
  if (!t) return;
  const active = ['trialing', 'active'].includes(status);
  await admin.from('profiles').update({
    plan: tier === 'bundle' ? 'bundle' : tier,
    plan_status: status,
    trial_ends_at: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
    stripe_subscription_id: subId,
    has_solutions: active ? t.grants.solutions : false,
    has_intelligence: active ? t.grants.intelligence : false,
  }).eq('id', userId);
}

async function revoke(userId: string, status: string) {
  await admin.from('profiles').update({
    plan_status: status, has_solutions: false, has_intelligence: false,
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
        const userId = s.metadata?.user_id;
        const tier = s.metadata?.tier;
        if (userId && tier && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          await grantFor(userId, tier, sub.status, sub.trial_end, sub.id);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const priceId = sub.items.data[0]?.price?.id || '';
        const tier = sub.metadata?.tier || tierFromPrice(priceId);
        if (userId && tier) await grantFor(userId, tier, sub.status, sub.trial_end, sub.id);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) await revoke(userId, 'canceled');   // no pay, no access
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        const sub = inv.subscription ? await stripe.subscriptions.retrieve(inv.subscription as string) : null;
        const userId = sub?.metadata?.user_id;
        if (userId) await revoke(userId, 'past_due');   // failed payment → lock out
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('webhook handler error:', e);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}