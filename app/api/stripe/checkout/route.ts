// @ts-nocheck
/**
 * app/api/stripe/checkout/route.ts
 *
 * .env.local:
 *   STRIPE_SECRET_KEY=sk_test_...
 *   NEXT_PUBLIC_APP_URL=http://localhost:3000
 *   STRIPE_PRICE_FREELANCER=price_1TGsBeQoXngqrNXZlVvmcsEW
 *   STRIPE_PRICE_BUSINESS=price_1TGsCGQoXngqrNXZPZn362p2
 *   STRIPE_PRICE_STUDENT=price_...  ← create $9/mo product in Stripe dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const PRICE_IDS: Record<string, string> = {
  personal: process.env.STRIPE_PRICE_FREELANCER ?? '',
  business: process.env.STRIPE_PRICE_BUSINESS   ?? '',
  student:  process.env.STRIPE_PRICE_STUDENT    ?? '',
};

const SUCCESS_URLS: Record<string, string> = {
  personal: '/confirm?plan=individual',
  business: '/confirm?plan=enterprise',
  student:  '/confirm?plan=individual',
};

const PLAN_LABELS: Record<string, string> = {
  personal: 'Personal',
  business: 'Business',
  student:  'Student',
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
        plan: 'personal' | 'business' | 'student';
      };

    const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const priceId = PRICE_IDS[plan];

    if (!priceId) {
      return NextResponse.json(
        { message: `Stripe price not configured for plan "${plan}". Add STRIPE_PRICE_${plan.toUpperCase()} to .env.local` },
        { status: 500 }
      );
    }

    // Student .edu validation server-side (defense in depth — client also checks)
    if (plan === 'student' && !email.toLowerCase().endsWith('.edu')) {
      return NextResponse.json(
        { message: 'Student plan requires a .edu email address.' },
        { status: 400 }
      );
    }

    // ── 1. Create Supabase account ────────────────────────────
    // emailRedirectTo sends the confirmation link to the onboarding page
    // so after confirming email the user lands directly in their setup wizard
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const onboardingPath = plan === 'business'
      ? '/onboarding/enterprise'
      : '/onboarding/individual';

    const emailRedirectTo = `${appUrl}${onboardingPath}`;

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);

    let supabaseUserId: string | null = null;

    if (!userExists) {
      const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // requires email confirmation
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          company_name: bizName ?? '',
          plan,
        },
      });

      if (signUpError) {
        // If user already exists with a different method, ignore
        if (!signUpError.message.includes('already')) {
          console.error('Supabase signup error:', signUpError.message);
        }
      } else {
        supabaseUserId = newUser.user?.id ?? null;

        // Send confirmation email with correct redirect
        await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email,
          options: { redirectTo: emailRedirectTo },
        });
      }
    }

    // ── 2. Find or create Stripe customer ─────────────────────
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({
          email,
          name: `${firstName} ${lastName}`.trim(),
          metadata: { plan, bizName: bizName ?? '', firstName, lastName },
        });

    await stripe.customers.update(customer.id, {
      metadata: {
        plan,
        firstName,
        lastName,
        bizName: bizName ?? '',
        supabaseUserId: supabaseUserId ?? '',
      },
    });

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
      success_url: `${appUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      metadata: { plan, email },
      custom_text: {
        submit: {
          message: `${PLAN_LABELS[plan]} plan — 7 days free. Cancel before day 8 and pay nothing.`,
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