// app/api/barter/confirm/route.ts
// PUBLIC endpoint used by the counterparty (no account). Looks a row up ONLY by its
// one-time token, returns just the safe fields, and applies accept/decline once.
//
// Why a server route instead of public RLS read: the token lookup uses the service key
// here, so the barter_agreements table itself stays fully private (no public SELECT policy).
// A leaked/guessed row id is useless — only a valid, unexpired, unused token works.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

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

    return NextResponse.json({ ok: true, status: updates.status });
  } catch (e: any) {
    console.error('barter/confirm error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}