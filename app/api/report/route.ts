// app/api/report/route.ts
// Saves a support ticket + emails you a notification (Resend — domain is verified now).
// Env: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, RESEND_API_KEY,
//      REPORT_NOTIFY_TO (your inbox), REPORT_FROM (e.g. "Gratia Core <noreply@gratiacore.com>")

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const ticket = {
      email: String(b.email || '').toLowerCase().slice(0, 200),
      subject: String(b.subject || '').slice(0, 200),
      message: String(b.message || '').slice(0, 4000),
      status: 'open',
    };
    if (!ticket.email.includes('@') || !ticket.subject || !ticket.message) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    }

    const { error: dbErr } = await admin.from('support_tickets').insert(ticket);
    if (dbErr) throw dbErr;

    // email you a heads-up (won't fail the request if email hiccups)
    try {
      if (process.env.RESEND_API_KEY && process.env.REPORT_NOTIFY_TO) {
        await resend.emails.send({
          from: process.env.REPORT_FROM || 'Gratia Core <noreply@gratiacore.com>',
          to: process.env.REPORT_NOTIFY_TO,
          replyTo: ticket.email,
          subject: `🚩 New report: ${ticket.subject}`,
          text: `From: ${ticket.email}\nTopic: ${ticket.subject}\n\n${ticket.message}`,
        });
      }
    } catch (e) { console.error('report email failed:', e); }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('report route error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}