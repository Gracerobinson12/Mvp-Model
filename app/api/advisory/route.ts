// app/api/advisory/route.ts
// Accepts both the new consulting page payload and the legacy advisory form payload.
// New shape:  { name, email, company?, services[], message? }
// Legacy:     { first_name, last_name?, email, business?, stage, details, contact_pref?, phone?, services[], budget?, timeline? }
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
const ADMIN = process.env.ADMIN_EMAIL || 'intel@gratiacore.com';

// All valid service keys across old and new form
const SERVICE_KEYS = ['websites', 'consulting', 'tech', 'security', 'qa', 'product_lab', 'tech_diligence', 'solutions'];
const SERVICE_LABEL: Record<string, string> = {
  // legacy
  websites: 'Websites',
  consulting: 'Consulting',
  tech: 'Tech & automation',
  security: 'Security & privacy',
  // new consulting page
  qa: 'QA & User Testing',
  product_lab: 'Product Concept Lab',
  tech_diligence: 'Tech Due Diligence',
  solutions: 'Solutions & Ongoing Support',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Signed-in users send a bearer token → attach their user_id to the lead.
    let userId: string | null = null;
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      userId = data?.user?.id || null;
    }

    // ── Normalise the two payload shapes ────────────────────────────────────
    // New consulting page sends: { name, email, company?, services[], message?, source? }
    // Legacy form sends:         { first_name, last_name?, email, business?, stage, details, ... }
    const isNewShape = !!body.name && !body.first_name;

    const firstName = isNewShape
      ? String(body.name || '').split(' ')[0].slice(0, 120)
      : String(body.first_name || '').slice(0, 120);

    const lastName = isNewShape
      ? (String(body.name || '').split(' ').slice(1).join(' ') || null)
      : (body.last_name ? String(body.last_name).slice(0, 120) : null);

    const email = String(body.email || '').toLowerCase().trim().slice(0, 200);

    const business = isNewShape
      ? (body.company ? String(body.company).slice(0, 200) : null)
      : (body.business ? String(body.business).slice(0, 200) : null);

    // New shape uses "message"; legacy uses "details". Both map to the same column.
    const details = isNewShape
      ? String(body.message || '').slice(0, 4000)
      : String(body.details || '').slice(0, 4000);

    // New shape has no stage — use a placeholder so legacy validation still passes.
    const stage = isNewShape ? 'consulting_page' : String(body.stage || '').slice(0, 40);

    const services: string[] = Array.isArray(body.services)
      ? body.services.map((s: unknown) => String(s)).filter((s: string) => SERVICE_KEYS.includes(s)).slice(0, 8)
      : [];

    const contactPref = String(body.contact_pref || 'email').slice(0, 20);
    const phone = body.phone ? String(body.phone).slice(0, 40) : null;
    const budget = body.budget ? String(body.budget).slice(0, 40) : null;
    const timeline = body.timeline ? String(body.timeline).slice(0, 40) : null;
    const source = body.source ? String(body.source).slice(0, 60) : (isNewShape ? 'consulting_page' : 'advisory_page');

    // ── Validation ───────────────────────────────────────────────────────────
    if (!firstName || !email.includes('@') || services.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: name, email, and at least one service.' },
        { status: 400 }
      );
    }
    // Legacy form requires stage + details; new consulting page can omit details.
    if (!isNewShape && (!stage || !details)) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: stage and details.' },
        { status: 400 }
      );
    }

    // ── Save to Supabase ─────────────────────────────────────────────────────
    const lead = {
      first_name: firstName,
      last_name: lastName,
      email,
      business,
      stage,
      details: details || null,
      contact_pref: contactPref,
      phone,
      services,
      budget,
      timeline,
      user_id: userId,
      source,
      status: 'new',
    };

    const { error: dbErr } = await supabaseAdmin.from('advisory_leads').insert(lead);
    if (dbErr) throw dbErr;

    // ── Emails (non-fatal) ───────────────────────────────────────────────────
    const svcText = services.map((s: string) => SERVICE_LABEL[s] || s).join(', ');
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    if (resend && process.env.EMAIL_FROM) {
      // Admin notification
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: ADMIN,
          replyTo: email,
          subject: `New Consulting lead: ${fullName} — ${svcText}`,
          text:
            `Name: ${fullName}\n` +
            `Email: ${email}\n` +
            `Business: ${business || '—'}\n` +
            `Services: ${svcText}\n` +
            `Stage: ${stage}\n` +
            `Budget: ${budget || '—'}\n` +
            `Timeline: ${timeline || '—'}\n` +
            `Source: ${source}\n` +
            (contactPref !== 'email' ? `Reach via: ${contactPref}${phone ? ` (${phone})` : ''}\n` : '') +
            `\nWhat they said:\n${details || '(nothing entered)'}\n`,
        });
      } catch (e) { console.error('Advisory admin email failed:', e); }

      // Confirmation to the person
      try {
        const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const confirmHtml = `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#14202e">
  <div style="height:4px;background:linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30);border-radius:12px 12px 0 0"></div>
  <div style="border:1px solid #e3e7ee;border-top:none;border-radius:0 0 14px 14px;padding:24px 22px">
    <p style="font-size:18px;font-weight:800;margin:0 0 10px">Got it, ${esc(firstName)} — thanks for reaching out 👋</p>
    <p style="font-size:15px;line-height:1.7;color:#3a4656;margin:0 0 14px">
      We received your request for <strong>${esc(svcText)}</strong>. A real person will review it and we aim to reply within one business day.
    </p>
    ${details ? `
    <p style="font-size:13px;color:#566475;line-height:1.6;margin:0 0 4px"><strong>What you told us:</strong></p>
    <p style="font-size:13px;color:#566475;line-height:1.6;background:#f4f6f9;border-radius:10px;padding:12px 14px;margin:0 0 14px">${esc(details)}</p>
    ` : ''}
    <p style="font-size:12px;color:#8a97a6;line-height:1.6;margin:0">
      Need to add something? Just reply to this email or write to intel@gratiacore.com.
    </p>
  </div>
</div>`;

        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: email,
          replyTo: ADMIN,
          subject: 'We got your request — Gratia Core Consulting',
          html: confirmHtml,
          text: `Got it, ${firstName} — thanks for reaching out.\n\nWe received your request for ${svcText} and will reply within one business day.\n\n${details ? `What you told us:\n${details}\n\n` : ''}Need to add something? Reply here or email intel@gratiacore.com.`,
        });
      } catch (e) { console.error('Advisory confirmation email failed:', e); }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('Advisory route error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}