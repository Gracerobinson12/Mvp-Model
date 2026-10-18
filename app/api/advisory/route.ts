// app/api/advisory/route.ts
// Saves an Advisory lead to Supabase, emails YOU (admin) the lead, and sends the person a confirmation.
// v2: services[] (websites/consulting/tech/security), budget, timeline.
//
// Env: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL
// SQL: run advisory-services.sql and sql/modules-setup.sql once.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN = process.env.ADMIN_EMAIL || 'gracer@gratiacore.com';
const SERVICE_KEYS = ['websites', 'consulting', 'tech', 'security'];
const SERVICE_LABEL: Record<string, string> = {
  websites: 'Websites', consulting: 'Consulting', tech: 'Tech & automation', security: 'Security & privacy',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Signed-in users (the in-app Advisory page) send a bearer token → the lead belongs to their account.
    let userId: string | null = null;
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (token) { const { data } = await supabaseAdmin.auth.getUser(token); userId = data?.user?.id || null; }

    const services = Array.isArray(body.services)
      ? body.services.map((s: any) => String(s)).filter((s: string) => SERVICE_KEYS.includes(s)).slice(0, 4)
      : [];

    const lead = {
      first_name: String(body.first_name || '').slice(0, 120),
      last_name: body.last_name ? String(body.last_name).slice(0, 120) : null,
      email: String(body.email || '').toLowerCase().slice(0, 200),
      business: body.business ? String(body.business).slice(0, 200) : null,
      stage: String(body.stage || '').slice(0, 40),
      details: String(body.details || '').slice(0, 4000),
      contact_pref: String(body.contact_pref || 'email').slice(0, 20),
      phone: body.phone ? String(body.phone).slice(0, 40) : null,
      services,
      budget: body.budget ? String(body.budget).slice(0, 40) : null,
      timeline: body.timeline ? String(body.timeline).slice(0, 40) : null,
      user_id: userId,
      status: 'new',
    };

    if (!lead.first_name || !lead.email.includes('@') || !lead.stage || !lead.details || services.length === 0) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { error: dbErr } = await supabaseAdmin.from('advisory_leads').insert(lead);
    if (dbErr) throw dbErr;

    const svcText = services.map((s: string) => SERVICE_LABEL[s] || s).join(', ');

    if (resend && process.env.EMAIL_FROM) {
      // Admin alert (non-fatal — the lead is already saved).
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: ADMIN,
          replyTo: lead.email,
          subject: `New Advisory lead: ${lead.first_name} — ${svcText}`,
          text:
            `Name: ${lead.first_name} ${lead.last_name || ''}\n` +
            `Email: ${lead.email}\n` +
            `Business: ${lead.business || '-'}\n` +
            `Services: ${svcText}\n` +
            `Stage: ${lead.stage}\n` +
            `Budget: ${lead.budget || '-'}\n` +
            `Timeline: ${lead.timeline || '-'}\n` +
            `Reach via: ${lead.contact_pref}${lead.phone ? ' (' + lead.phone + ')' : ''}\n\n` +
            `What they want:\n${lead.details}\n`,
        });
      } catch (e) { console.error('Advisory admin email failed:', e); }

      // Confirmation to the person (non-fatal).
      try {
        const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const confirmHtml = `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#14202e">
  <div style="height:4px;background:linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30);border-radius:12px 12px 0 0"></div>
  <div style="border:1px solid #e3e7ee;border-top:none;border-radius:0 0 14px 14px;padding:24px 22px">
    <p style="font-size:18px;font-weight:800;margin:0 0 10px">Got it, ${esc(lead.first_name)} — thanks for reaching out 👋</p>
    <p style="font-size:15px;line-height:1.7;color:#3a4656;margin:0 0 14px">We received your request for <strong>${esc(svcText)}</strong> and a real person will review it. We reply within 2 business days${lead.contact_pref !== 'email' ? ` and will reach you by ${esc(lead.contact_pref)}` : ''}.</p>
    <p style="font-size:13px;color:#566475;line-height:1.6;margin:0 0 4px"><strong>What you sent us:</strong></p>
    <p style="font-size:13px;color:#566475;line-height:1.6;background:#f4f6f9;border-radius:10px;padding:12px 14px;margin:0 0 14px">${esc(lead.details)}</p>
    <p style="font-size:12px;color:#8a97a6;line-height:1.6;margin:0">Need to add something? Just reply to this email or write to intel@gratiacore.com.</p>
  </div>
</div>`;
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: lead.email,
          replyTo: ADMIN,
          subject: 'We got your request — Gratia Core Advisory',
          html: confirmHtml,
          text: `Got it, ${lead.first_name} — thanks for reaching out.\n\nWe received your request for ${svcText} and will reply within 2 business days.\n\nWhat you sent us:\n${lead.details}\n\nNeed to add something? Reply here or email intel@gratiacore.com.`,
        });
      } catch (e) { console.error('Advisory confirmation email failed:', e); }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Advisory route error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
