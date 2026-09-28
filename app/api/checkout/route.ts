// app/api/checkout/route.ts
// Creates a hosted Stripe Checkout Session with a 7-day trial for the chosen tier+cycle.
// Returns { url } — the client redirects to Stripe's payment page.
// Env: STRIPE_SECRET_KEY, NEXT_PUBLIC_SITE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { TIERS, TRIAL_DAYS } from '@/lib/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { tier, cycle } = await req.json();
    const t = TIERS[tier];
    if (!t) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    const priceId = cycle === 'annual' ? t.stripe.annual : t.stripe.monthly;
    if (!priceId) return NextResponse.json({ error: 'Price not configured for this tier' }, { status: 400 });

    // Reuse or create a Stripe customer for this user
    const { data: prof } = await admin.from('profiles').select('stripe_customer_id, email').eq('id', user.id).single();
    let customerId = prof?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email || prof?.email, metadata: { user_id: user.id } });
      customerId = customer.id;
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gratiacore.com';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { user_id: user.id, tier },
      },
      metadata: { user_id: user.id, tier },
      success_url: `${base}/checkout/success?tier=${tier}`,
      cancel_url: `${base}/checkout?tier=${tier}&cycle=${cycle}`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('checkout error:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}