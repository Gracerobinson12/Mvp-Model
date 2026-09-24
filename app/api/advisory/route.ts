// app/api/advisory/route.ts
// Saves an Advisory lead to Supabase and (once Resend is set up) emails you.
//
// SETUP WHEN READY:
//   1. npm install resend
//   2. In .env.local add:
//        RESEND_API_KEY=re_xxxxxxxx
//        ADVISORY_NOTIFY_TO=you@gratiacore.com
//        ADVISORY_FROM="Gratia Core <noreply@gratiacore.com>"   (domain must be verified in Resend)
//   3. Uncomment the two marked blocks below.
//
// Until then this route just saves the lead — fully working, no email.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client (service role bypasses RLS for the insert).
// Add SUPABASE_SERVICE_ROLE_KEY to .env.local (never expose it to the browser).
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---- Resend (leave commented until your domain is verified) ----
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

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

    // ---- Email notification (uncomment when Resend is ready) ----
    // try {
    //   await resend.emails.send({
    //     from: process.env.ADVISORY_FROM!,
    //     to: process.env.ADVISORY_NOTIFY_TO!,
    //     replyTo: lead.email,
    //     subject: `New Advisory lead: ${lead.first_name} (${lead.stage})`,
    //     text:
    //       `Name: ${lead.first_name} ${lead.last_name || ''}\n` +
    //       `Email: ${lead.email}\n` +
    //       `Business: ${lead.business || '\u2014'}\n` +
    //       `Stage: ${lead.stage}\n` +
    //       `Reach via: ${lead.contact_pref}${lead.phone ? ' (' + lead.phone + ')' : ''}\n\n` +
    //       `What they want:\n${lead.details}\n`,
    //   });
    // } catch (e) {
    //   // Don't fail the request if email hiccups — the lead is already saved.
    //   console.error('Advisory email failed:', e);
    // }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Advisory route error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}