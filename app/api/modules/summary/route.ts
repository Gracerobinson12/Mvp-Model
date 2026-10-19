// app/api/modules/summary/route.ts — this month's bill, next invoice date, card on file, recent invoices.
// Read-only. Env: STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { MODULES, moduleForPrice } from '@/lib/modules';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const { data: prof } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle();
    const out: any = { ok: true, total: 0, items: [], next_invoice: null, card: null, invoices: [] };
    if (!prof?.stripe_customer_id) return NextResponse.json(out);

    const cid = prof.stripe_customer_id;
    const [subs, customer, invoices] = await Promise.all([
      stripe.subscriptions.list({ customer: cid, status: 'all', limit: 10 }),
      stripe.customers.retrieve(cid, { expand: ['invoice_settings.default_payment_method'] }) as Promise<Stripe.Customer>,
      stripe.invoices.list({ customer: cid, limit: 6 }),
    ]);
    const live = subs.data.find(s => ['active', 'trialing', 'past_due'].includes(s.status));
    if (live) {
      out.next_invoice = new Date(live.current_period_end * 1000).toISOString();
      out.status = live.status;
      for (const it of live.items.data) {
        const m = moduleForPrice(it.price.id);
        const amount = (it.price.unit_amount || 0) / 100;
        out.items.push({ module: m, name: m ? MODULES[m].name : it.price.nickname || 'Module', amount });
        out.total += amount;
      }
    }
    const pm: any = customer.invoice_settings?.default_payment_method;
    if (pm && typeof pm === 'object' && pm.card) out.card = { brand: pm.card.brand, last4: pm.card.last4 };
    out.invoices = invoices.data.map(inv => ({
      id: inv.id, date: new Date(inv.created * 1000).toISOString(), total: (inv.total || 0) / 100,
      status: inv.status, url: inv.hosted_invoice_url || inv.invoice_pdf || null,
      lines: inv.lines.data.map(l => l.description).filter(Boolean).slice(0, 4),
    }));
    return NextResponse.json(out);
  } catch (e: any) {
    console.error('modules/summary error:', e);
    return NextResponse.json({ ok: false, error: 'Billing summary unavailable' }, { status: 500 });
  }
}