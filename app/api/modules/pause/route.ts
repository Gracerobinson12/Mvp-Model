// app/api/modules/pause/route.ts — "Pause everything": cancel the subscription now (prorated)
// and mark every paid module off. Data stays; comped (admin) modules stay on.
// Env: STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { PAID_MODULES } from '@/lib/modules';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const { data: prof } = await admin.from('profiles').select('stripe_customer_id, stripe_subscription_id').eq('id', user.id).maybeSingle();
    if (prof?.stripe_customer_id) {
      const list = await stripe.subscriptions.list({ customer: prof.stripe_customer_id, status: 'all', limit: 10 });
      for (const s of list.data) {
        if (['active', 'trialing', 'past_due', 'unpaid'].includes(s.status)) {
          try { await stripe.subscriptions.cancel(s.id, { prorate: true, invoice_now: true }); } catch (e) { console.error('cancel failed', s.id, (e as any)?.message); }
        }
      }
    }
    await admin.from('profiles').update({ stripe_subscription_id: null, plan_status: 'canceled' }).eq('id', user.id);
    const now = new Date().toISOString();
    for (const module of PAID_MODULES) {
      await admin.from('module_access').upsert({ user_id: user.id, module, active: false, ended_at: now, updated_at: now }, { onConflict: 'user_id,module' });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('modules/pause error:', e);
    return NextResponse.json({ ok: false, error: 'Could not pause right now. Email intel@gratiacore.com and we will do it by hand.' }, { status: 500 });
  }
}