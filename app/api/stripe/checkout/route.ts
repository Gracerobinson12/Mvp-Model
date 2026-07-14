/**
 * app/api/stripe/checkout/route.ts
 *
 * .env.local:
 *   STRIPE_SECRET_KEY=sk_test_...
 *   NEXT_PUBLIC_APP_URL=https://yourdomain.com   (or http://localhost:3000)
 *   STRIPE_PRICE_FREELANCER=price_1TGsBeQoXngqrNXZlVvmcsEW
 *   STRIPE_PRICE_BUSINESS=price_1TGsCGQoXngqrNXZPZn362p2
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Maps plan name → your Stripe price IDs
const PRICE_IDS: Record<string, string> = {
  personal: process.env.STRIPE_PRICE_FREELANCER ?? '',
  business: process.env.STRIPE_PRICE_BUSINESS ?? '',
};

const SUCCESS_URLS: Record<string, string> = {
  personal: '/dashboard/personal',
  business: '/dashboard/enterprise',
};

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName, bizName, password, plan } =
      await req.json() as {
        email: string;
        firstName: string;
        lastName: string;
        bizName?: string;
        password: string;
        plan: 'personal' | 'business';
      };

const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gratiacore.com';
const priceId = PRICE_IDS[plan];

    if (!priceId) {
      return NextResponse.json(
        { message: `Stripe price not set for plan: ${plan}. Add STRIPE_PRICE_FREELANCER or STRIPE_PRICE_BUSINESS to .env.local` },
        { status: 500 }
      );
    }

    // Find or create Stripe customer
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({
          email,
          name: `${firstName} ${lastName}`.trim(),
          metadata: { plan, bizName: bizName ?? '', firstName, lastName },
        });

    // Store pending account info in customer metadata
    // so we can create the user after Stripe confirms payment.
    // ⚠️ In production: hash the password with bcrypt before storing.
    await stripe.customers.update(customer.id, {
      metadata: {
        plan,
        firstName,
        lastName,
        bizName: bizName ?? '',
        pendingPassword: password,
      },
    });

    // Create hosted Checkout Session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { plan },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${appUrl}${SUCCESS_URLS[plan]}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?signup=cancelled`,
      metadata: { plan, email },
      custom_text: {
        submit: {
          message: `Your ${plan === 'personal' ? 'Personal' : 'Business'} plan — 7 days free. Cancel before day 8 and pay nothing.`,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    console.error('[stripe/checkout]', err);
    return NextResponse.json({ message }, { status: 500 });
  }
}