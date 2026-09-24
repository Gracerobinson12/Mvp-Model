// app/api/barter/send/route.ts
// Owner sends an agreement for confirmation: generates a one-time token, sets status='sent',
// returns the confirm URL (so you can copy it now), and — once Resend is wired — emails it.
//
// Security: token is a random UUID (unguessable), single-use, expires in 14 days.
// The public confirm page reads the row ONLY via this token through the confirm route,
// never by row id, and never with direct table access.
//
// Requires: SUPABASE_SERVICE_ROLE_KEY (server-only), NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SITE_URL

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// import { Resend } from 'resend';   // ← uncomment when Resend is set up
// const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    const { agreementId } = await req.json();
    if (!agreementId) return NextResponse.json({ ok: false, error: 'Missing agreementId' }, { status: 400 });

    const { data: ag, error: loadErr } = await admin
      .from('barter_agreements').select('*').eq('id', agreementId).eq('user_id', user.id).single();
    if (loadErr || !ag) return NextResponse.json({ ok: false, error: 'Agreement not found' }, { status: 404 });
    if (!ag.counterparty_email) return NextResponse.json({ ok: false, error: 'No counterparty email' }, { status: 400 });

    const confirmToken = randomUUID();
    const expires = new Date(Date.now() + 14 * 864e5).toISOString();

    const { data: updated, error: updErr } = await admin
      .from('barter_agreements')
      .update({ status: 'sent', confirm_token: confirmToken, token_expires_at: expires, sent_at: new Date().toISOString() })
      .eq('id', agreementId).eq('user_id', user.id).select().single();
    if (updErr) throw updErr;

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://gratiacore.com';
    const confirmUrl = `${base}/barter/confirm/${confirmToken}`;

    // ---- Email (uncomment when Resend is live) ----
    // await resend.emails.send({
    //   from: process.env.ADVISORY_FROM!,
    //   to: ag.counterparty_email,
    //   replyTo: user.email,
    //   subject: `${user.email} wants to confirm a trade with you`,
    //   text:
    //     `You've been asked to confirm a barter agreement:\n\n` +
    //     `"${ag.title}"\n\n` +
    //     `They deliver: ${ag.you_deliver}\n` +
    //     `You deliver: ${ag.they_deliver}\n\n` +
    //     `Review and confirm (link expires in 14 days):\n${confirmUrl}\n`,
    // });

    // Return the URL so the owner can copy/share it manually until email is on.
    return NextResponse.json({ ok: true, agreement: updated, confirm_url: confirmUrl });
  } catch (e: any) {
    console.error('barter/send error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}