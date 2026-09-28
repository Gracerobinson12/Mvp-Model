// app/api/billing/portal/route.ts
// Opens the Stripe Customer Portal so users manage/cancel their plan, update card, etc.
// Env: STRIPE_SECRET_KEY, NEXT_PUBLIC_SITE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: prof } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
    if (!prof?.stripe_customer_id) return NextResponse.json({ error: 'No billing account yet' }, { status: 400 });

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gratiacore.com';
    const portal = await stripe.billingPortal.sessions.create({
      customer: prof.stripe_customer_id,
      return_url: `${base}/dashboard/settings`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (e: any) {
    console.error('portal error:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}