// app/api/barter/send/route.ts
// Owner sends an agreement for confirmation: generates a one-time token, sets status='sent',
// emails the counterparty the confirm link, and also returns the URL (so it can be copied).
// Pass { linkOnly: true } to get/refresh the link WITHOUT sending an email (the "Copy link" button).
//
// Security: token is a random UUID (unguessable), single-use, expires in 14 days.
// The public confirm page reads the row ONLY via this token through the confirm route.
//
// Requires:
//   SUPABASE_SERVICE_ROLE_KEY   (server-only)
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SITE_URL        e.g. https://www.gratiacore.com
//   RESEND_API_KEY              from resend.com  (run: npm install resend)
//   EMAIL_FROM                  e.g. "Gratia Core <noreply@gratiacore.com>"  (domain verified in Resend)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function escapeHtml(s: string) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    const { agreementId, linkOnly } = await req.json();
    if (!agreementId) return NextResponse.json({ ok: false, error: 'Missing agreementId' }, { status: 400 });

    const { data: ag, error: loadErr } = await admin
      .from('barter_agreements').select('*').eq('id', agreementId).eq('user_id', user.id).single();
    if (loadErr || !ag) return NextResponse.json({ ok: false, error: 'Agreement not found' }, { status: 404 });
    if (!ag.counterparty_email && !linkOnly) return NextResponse.json({ ok: false, error: 'No counterparty email' }, { status: 400 });

    const confirmToken = randomUUID();
    const expires = new Date(Date.now() + 14 * 864e5).toISOString();

    const { data: updated, error: updErr } = await admin
      .from('barter_agreements')
      .update({ status: 'sent', confirm_token: confirmToken, token_expires_at: expires, sent_at: new Date().toISOString() })
      .eq('id', agreementId).eq('user_id', user.id).select().single();
    if (updErr) throw updErr;

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gratiacore.com';
    const confirmUrl = `${base}/barter/confirm/${confirmToken}`;
    const senderName = ag.your_name || user.email || 'A Gratia Core user';

    // ---- Email the counterparty (non-fatal: if it fails, the link is still returned) ----
    let emailed = false;
    let emailError: string | null = null;
    if (!linkOnly && ag.counterparty_email && resend && process.env.EMAIL_FROM) {
      try {
        const title = escapeHtml(ag.title);
        const theyGet = escapeHtml(ag.you_deliver);     // what the counterparty receives = what the owner delivers
        const theyGive = escapeHtml(ag.they_deliver);   // what the counterparty provides
        const html = `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#14202e">
  <div style="background:#ff3b30;color:#fff;font-weight:800;font-size:18px;padding:18px 22px;border-radius:14px 14px 0 0">Gratia Core · Barter</div>
  <div style="border:1px solid #e3e7ee;border-top:none;border-radius:0 0 14px 14px;padding:22px">
    <p style="font-size:15px;line-height:1.6;margin:0 0 14px">${escapeHtml(senderName)} wants to confirm a trade agreement with you:</p>
    <p style="font-size:17px;font-weight:700;margin:0 0 16px">"${title}"</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:18px">
      <tr><td style="padding:8px 0;color:#566475">You receive</td><td style="padding:8px 0;text-align:right;font-weight:600">${theyGet}</td></tr>
      <tr><td style="padding:8px 0;color:#566475;border-top:1px solid #eef1f5">You provide</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #eef1f5">${theyGive}</td></tr>
    </table>
    <a href="${confirmUrl}" style="display:block;text-align:center;background:#1f45c7;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px;border-radius:10px">Review &amp; confirm</a>
    <p style="font-size:12px;color:#8a97a6;line-height:1.6;margin:16px 0 0">This link is unique to you and expires in 14 days. If you weren't expecting this, you can ignore this email.</p>
    <p style="font-size:11px;color:#aab4c0;line-height:1.6;margin:12px 0 0">Gratia Core helps people track trade agreements. This is a record of a proposed trade, not a legally binding contract unless you and the sender agree otherwise.</p>
  </div>
</div>`;
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: ag.counterparty_email,
          replyTo: user.email || undefined,
          subject: `${senderName} wants to confirm a trade with you`,
          html,
          text:
            `${senderName} wants to confirm a barter agreement with you:\n\n` +
            `"${ag.title}"\n\n` +
            `You receive: ${ag.you_deliver}\n` +
            `You provide: ${ag.they_deliver}\n\n` +
            `Review and confirm (link expires in 14 days):\n${confirmUrl}\n`,
        });
        emailed = true;
      } catch (e: any) {
        console.error('barter email failed:', e);
        emailError = e?.message || 'email failed';
      }
    }

    return NextResponse.json({ ok: true, agreement: updated, confirm_url: confirmUrl, emailed, email_error: emailError });
  } catch (e: any) {
    console.error('barter/send error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}