/**
 * app/api/verify-session/route.ts
 *
 * Called by the dashboard after Stripe redirects back with ?session_id=
 * Verifies the session with Stripe, then updates the profile in Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userId } = await req.json();
    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
    }

    // Verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.payment_status !== 'unpaid' && session.status === 'complete') {
      const subscription = session.subscription as Stripe.Subscription;
      const plan = (session.metadata?.plan ?? 'personal') as string;

      // Trial end from Stripe
      const trialEnd = subscription?.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Update profile
      await supabaseAdmin
        .from('profiles')
        .update({
          plan_status:            'trialing',
          selected_plan:          plan,
          stripe_customer_id:     session.customer as string,
          stripe_subscription_id: subscription?.id ?? null,
          trial_ends_at:          trialEnd,
          onboarded:              true,
        })
        .eq('id', userId);

      return NextResponse.json({ ok: true, plan, trialEnd });
    }

    return NextResponse.json({ ok: false, status: session.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('[verify-session]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}