// app/api/notify/route.ts
// Sends YOU (the admin) an email when things happen on the site: new signups,
// Intelligence waitlist joins, and feedback. Keeps you up to date in real time.
//
// Env:
//   RESEND_API_KEY
//   EMAIL_FROM   e.g. "Gratia Core <noreply@gratiacore.com>"
//   ADMIN_EMAIL  e.g. "gracer@gratiacore.com"   (where these alerts are sent)

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN = process.env.ADMIN_EMAIL || 'gracer@gratiacore.com';

function esc(s: any) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SUBJECTS: Record<string, string> = {
  signup: '🎉 New Gratia Core signup',
  waitlist: '📡 New Intelligence waitlist signup',
  feedback: '💬 New feedback',
  advisory: '📥 New Advisory lead',
};

export async function POST(req: NextRequest) {
  try {
    const { kind, data } = await req.json();
    if (!kind || !SUBJECTS[kind]) return NextResponse.json({ ok: false, error: 'Unknown kind' }, { status: 400 });

    // Always respond ok even if email isn't configured — never block the user's action.
    if (!resend || !process.env.EMAIL_FROM) return NextResponse.json({ ok: true, emailed: false });

    const d = data || {};
    const when = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET';
    const rows = Object.entries(d)
      .map(([k, v]) => `<tr><td style="padding:6px 10px;color:#566475;border-top:1px solid #eef1f5">${esc(k)}</td><td style="padding:6px 10px;font-weight:600;border-top:1px solid #eef1f5">${esc(v)}</td></tr>`)
      .join('');

    const html = `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#14202e">
  <div style="background:#ff3b30;color:#fff;font-weight:800;font-size:16px;padding:16px 20px;border-radius:12px 12px 0 0">${esc(SUBJECTS[kind])}</div>
  <div style="border:1px solid #e3e7ee;border-top:none;border-radius:0 0 12px 12px;padding:18px 20px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows || '<tr><td style="padding:6px 10px">(no details)</td></tr>'}</table>
    <p style="font-size:12px;color:#8a97a6;margin:14px 0 0">${when}</p>
  </div>
</div>`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: ADMIN,
      replyTo: d.email || undefined,
      subject: `${SUBJECTS[kind]}${d.email ? ` — ${d.email}` : ''}`,
      html,
      text: `${SUBJECTS[kind]}\n\n` + Object.entries(d).map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${when}`,
    });

    return NextResponse.json({ ok: true, emailed: true });
  } catch (e: any) {
    console.error('notify error:', e);
    // Non-fatal: a failed alert must never break the user's signup/feedback.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}