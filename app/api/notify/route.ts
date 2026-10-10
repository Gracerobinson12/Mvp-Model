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

    // On signup, also send the NEW USER a branded welcome/confirmation email (non-fatal).
    if (kind === 'signup' && d.email) {
      try {
        const first = (d.name || '').split(' ')[0] || 'there';
        const welcomeHtml = `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#14202e">
  <div style="height:4px;background:linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30);border-radius:12px 12px 0 0"></div>
  <div style="border:1px solid #e3e7ee;border-top:none;border-radius:0 0 14px 14px;padding:24px 22px">
    <p style="font-size:18px;font-weight:800;margin:0 0 10px">Welcome to Gratia Core, ${esc(first)} 👋</p>
    <p style="font-size:15px;line-height:1.7;color:#3a4656;margin:0 0 14px">Your account is confirmed and ready. You can seal ideas in the Ideas Vault, track trade agreements in Barter, and bring a project to life with Launch HQ.</p>
    <a href="https://www.gratiacore.com/dashboard/solutions" style="display:inline-block;background:#1f45c7;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:10px">Go to your dashboard →</a>
    <p style="font-size:12px;color:#8a97a6;line-height:1.6;margin:18px 0 0">Questions? Just reply to this email or reach us at intel@gratiacore.com.</p>
  </div>
</div>`;
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: d.email,
          subject: 'Welcome to Gratia Core — your account is confirmed',
          html: welcomeHtml,
          text: `Welcome to Gratia Core, ${first}!\n\nYour account is confirmed and ready. Seal ideas in the Ideas Vault, track trades in Barter, and plan with Launch HQ.\n\nDashboard: https://www.gratiacore.com/dashboard/solutions\n\nQuestions? Reply here or email intel@gratiacore.com.`,
        });
      } catch (e) { console.error('welcome email failed:', e); }
    }

    return NextResponse.json({ ok: true, emailed: true });
  } catch (e: any) {
    console.error('notify error:', e);
    // Non-fatal: a failed alert must never break the user's signup/feedback.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}