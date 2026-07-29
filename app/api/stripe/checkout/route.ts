import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Server-side Supabase client with service role (can create users)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRICE_IDS: Record<string, string> = {
  personal: process.env.STRIPE_PRICE_FREELANCER ?? '',
  business: process.env.STRIPE_PRICE_BUSINESS ?? '',
};

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName, bizName, password, plan } =
      await req.json() as {
        email: string; firstName: string; lastName: string;
        bizName?: string; password: string; plan: 'personal' | 'business';
      };

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gratiacore.com';
    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ message: `Stripe price not set for plan: ${plan}` }, { status: 500 });
    }

    // ── CREATE THE ACCOUNT NOW, before Stripe ──
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,          // auto-confirm so they can log in immediately
    });

    if (createErr && !createErr.message.includes('already been registered')) {
      return NextResponse.json({ message: createErr.message }, { status: 400 });
    }

    // get the user id (whether just created or already existed)
    let userId = created?.user?.id;
    if (!userId) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      userId = list?.users.find(u => u.email === email)?.id;
    }

    // set their profile: plan + name, status starts as incomplete until payment
    if (userId) {
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        business_name: bizName ?? null,
        plan: plan === 'business' ? 'enterprise' : 'individual',
        plan_status: 'trialing',    // trial starts now
        onboarded: false,
      }, { onConflict: 'id' });
    }

    // ── Stripe customer + checkout ──
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({ email, name: `${firstName} ${lastName}`.trim() });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7, metadata: { plan } },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      // ── send them to ONBOARDING, not the dashboard ──
      success_url: `${appUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?signup=cancelled`,
      metadata: { plan, email, userId: userId ?? '' },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    console.error('[stripe/checkout]', err);
    return NextResponse.json({ message }, { status: 500 });
  }
}