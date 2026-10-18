// app/api/advisory/route.ts
// Saves an Advisory lead to Supabase and emails YOU (the admin) the new lead.
//
// Env: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN = process.env.ADMIN_EMAIL || 'gracer@gratiacore.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const lead = {
      first_name: String(body.first_name || '').slice(0, 120),
      last_name: body.last_name ? String(body.last_name).slice(0, 120) : null,
      email: String(body.email || '').toLowerCase().slice(0, 200),
      business: body.business ? String(body.business).slice(0, 200) : null,
      stage: String(body.stage || '').slice(0, 40),
      details: String(body.details || '').slice(0, 4000),
      contact_pref: String(body.contact_pref || 'email').slice(0, 20),
      phone: body.phone ? String(body.phone).slice(0, 40) : null,
    };

    if (!lead.first_name || !lead.email.includes('@') || !lead.stage || !lead.details) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { error: dbErr } = await supabaseAdmin.from('advisory_leads').insert(lead);
    if (dbErr) throw dbErr;

    // Email YOU the new lead (non-fatal — the lead is already saved).
    if (resend && process.env.EMAIL_FROM) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: ADMIN,
          replyTo: lead.email,
          subject: `New Advisory lead: ${lead.first_name} (${lead.stage})`,
          text:
            `Name: ${lead.first_name} ${lead.last_name || ''}\n` +
            `Email: ${lead.email}\n` +
            `Business: ${lead.business || '-'}\n` +
            `Stage: ${lead.stage}\n` +
            `Reach via: ${lead.contact_pref}${lead.phone ? ' (' + lead.phone + ')' : ''}\n\n` +
            `What they want:\n${lead.details}\n`,
        });
      } catch (e) { console.error('Advisory email failed:', e); }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Advisory route error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}