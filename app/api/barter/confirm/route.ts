// app/api/barter/confirm/route.ts
// PUBLIC endpoint used by the counterparty (no account). Looks a row up ONLY by its
// one-time token, returns just the safe fields, and applies accept/decline once.
// On ACCEPT, emails BOTH parties a confirmation with the full agreed terms.
//
// Why a server route instead of public RLS read: the token lookup uses the service key
// here, so the barter_agreements table itself stays fully private (no public SELECT policy).
//
// Requires: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, RESEND_API_KEY, EMAIL_FROM

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function esc(s: any) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function loadByToken(token: string) {
  if (!token || token.length < 20) return null;
  const { data } = await admin.from('barter_agreements').select('*').eq('confirm_token', token).single();
  return data || null;
}

function safe(ag: any) {
  return {
    title: ag.title, counterparty_name: ag.counterparty_name,
    you_deliver: ag.you_deliver, they_deliver: ag.they_deliver,
    you_deliver_value: ag.you_deliver_value, they_deliver_value: ag.they_deliver_value,
    due_date: ag.due_date, notes: ag.notes, status: ag.status,
    expired: ag.token_expires_at ? new Date(ag.token_expires_at) < new Date() : false,
  };
}

// Build the confirmation email (same terms shown to both parties).
function confirmedEmailHtml(ag: any, ownerName: string) {
  const row = (label: string, val: string, top = true) =>
    `<tr><td style="padding:8px 0;color:#566475;${top ? 'border-top:1px solid #eef1f5' : ''}">${esc(label)}</td>` +
    `<td style="padding:8px 0;text-align:right;font-weight:600;${top ? 'border-top:1px solid #eef1f5' : ''}">${esc(val)}</td></tr>`;
  return `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#14202e">
  <div style="background:#21744a;color:#fff;font-weight:800;font-size:18px;padding:18px 22px;border-radius:14px 14px 0 0">&#10003; Agreement confirmed &middot; Gratia Core</div>
  <div style="border:1px solid #e3e7ee;border-top:none;border-radius:0 0 14px 14px;padding:22px">
    <p style="font-size:15px;line-height:1.6;margin:0 0 14px">This barter agreement is now confirmed by both parties. Keep this email as your record.</p>
    <p style="font-size:17px;font-weight:700;margin:0 0 16px">"${esc(ag.title)}"</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
      ${row(`${ownerName} delivers`, `${ag.you_deliver}${ag.you_deliver_value ? ` (est. $${ag.you_deliver_value})` : ''}`, false)}
      ${row(`${ag.counterparty_name} delivers`, `${ag.they_deliver}${ag.they_deliver_value ? ` (est. $${ag.they_deliver_value})` : ''}`)}
      ${ag.due_date ? row('Target date', ag.due_date) : ''}
    </table>
    ${ag.notes ? `<p style="font-size:13px;color:#566475;line-height:1.6;margin:0 0 14px"><strong>Notes:</strong> ${esc(ag.notes)}</p>` : ''}
    <p style="font-size:12px;color:#8a97a6;line-height:1.6;margin:14px 0 0">Confirmed on ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET.</p>
    <p style="font-size:11px;color:#aab4c0;line-height:1.6;margin:10px 0 0">Gratia Core records trade agreements between parties. This confirmation is a record of mutual agreement, not legal, financial, or tax advice, and is not a legally binding contract unless both parties intend it to be.</p>
  </div>
</div>`;
}

async function emailBothOnConfirm(ag: any) {
  if (!resend || !process.env.EMAIL_FROM) return;
  // owner email from auth
  let ownerEmail: string | null = null;
  let ownerName = 'The sender';
  try {
    const { data } = await admin.auth.admin.getUserById(ag.user_id);
    ownerEmail = data?.user?.email || null;
    ownerName = ownerEmail || ownerName;
  } catch (e) { console.error('owner lookup failed:', e); }

  const recipients = [ag.counterparty_email, ownerEmail].filter(Boolean) as string[];
  if (!recipients.length) return;

  const html = confirmedEmailHtml(ag, ownerName);
  const text =
    `Agreement confirmed by both parties.\n\n"${ag.title}"\n\n` +
    `${ownerName} delivers: ${ag.you_deliver}${ag.you_deliver_value ? ` (est. $${ag.you_deliver_value})` : ''}\n` +
    `${ag.counterparty_name} delivers: ${ag.they_deliver}${ag.they_deliver_value ? ` (est. $${ag.they_deliver_value})` : ''}\n` +
    (ag.due_date ? `Target date: ${ag.due_date}\n` : '') +
    (ag.notes ? `Notes: ${ag.notes}\n` : '') +
    `\nThis is a record of mutual agreement, not legal advice.\n`;

  // Send individually so neither address sees the other in a To field.
  for (const to of recipients) {
    try {
      await resend.emails.send({ from: process.env.EMAIL_FROM!, to, subject: `Confirmed: "${ag.title}"`, html, text });
    } catch (e) { console.error('confirm email failed for', to, e); }
  }
}

// GET: fetch the agreement for display on the confirm page
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || '';
  const ag = await loadByToken(token);
  if (!ag) return NextResponse.json({ ok: false, error: 'Invalid or expired link' }, { status: 404 });
  return NextResponse.json({ ok: true, agreement: safe(ag) });
}

// POST: apply accept or decline — single use, must be unexpired and still 'sent'
export async function POST(req: NextRequest) {
  try {
    const { token, action } = await req.json();
    const ag = await loadByToken(token);
    if (!ag) return NextResponse.json({ ok: false, error: 'Invalid or expired link' }, { status: 404 });
    if (ag.status !== 'sent') return NextResponse.json({ ok: false, error: 'This agreement was already handled' }, { status: 409 });
    if (ag.token_expires_at && new Date(ag.token_expires_at) < new Date())
      return NextResponse.json({ ok: false, error: 'This link has expired' }, { status: 410 });

    const now = new Date().toISOString();
    const updates = action === 'accept'
      ? { status: 'confirmed', confirmed_at: now, confirm_token: null, token_expires_at: null }  // burn the token
      : { status: 'declined', declined_at: now, confirm_token: null, token_expires_at: null };

    const { error: updErr } = await admin.from('barter_agreements').update(updates).eq('id', ag.id);
    if (updErr) throw updErr;

    // On accept, email both parties the confirmed terms (non-fatal — uses the row we loaded before the token was burned).
    if (action === 'accept') {
      await emailBothOnConfirm(ag);
    }

    return NextResponse.json({ ok: true, status: updates.status });
  } catch (e: any) {
    console.error('barter/confirm error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}