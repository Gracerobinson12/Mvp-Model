// app/api/barter/lookup/route.ts
// Public GET endpoint: returns safe agreement fields for the confirm page.
// No auth required — lookup is by one-time token only.
// Uses service role key server-side so the barter_agreements table
// has NO public RLS policy and stays fully private.
//
// Requires: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get('token') || '';
    if (!token || token.length < 20) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
    }

    const { data: ag, error } = await admin
      .from('barter_agreements')
      .select('*')
      .eq('confirm_token', token)
      .single();

    if (error || !ag) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    // Check expiry
    if (ag.token_expires_at && new Date(ag.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This confirmation link has expired. Ask the sender to resend it.' }, { status: 410 });
    }

    // Look up owner's display name
    let ownerName = ag.your_name || '';
    let ownerEmail = '';
    try {
      const { data: ownerData } = await admin.auth.admin.getUserById(ag.user_id);
      ownerEmail = ownerData?.user?.email || '';
      if (!ownerName) ownerName = ownerEmail;
    } catch (e) {
      // non-fatal
    }

    // Return only what the confirm page needs — never expose internal IDs or user_id
    return NextResponse.json({
      agreement: {
        id:                ag.id,
        title:             ag.title,
        counterparty_name: ag.counterparty_name,
        counterparty_email: ag.counterparty_email,
        my_offer:          ag.you_deliver,          // what the owner delivers (= what counterparty receives)
        their_offer:       ag.they_deliver,          // what the counterparty delivers (= what owner receives)
        deadline:          ag.due_date || null,
        notes:             ag.notes || '',
        status:            ag.status,
        owner_name:        ownerName,
        owner_email:       ownerEmail,
      },
    });
  } catch (e: any) {
    console.error('barter/lookup error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}