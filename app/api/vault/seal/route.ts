// app/api/vault/seal/route.ts
// Real, honest sealing: SHA-256 hash of the document + a server timestamp, saved to the DB.
// Designed so RFC-3161 (notarized) and Bitcoin/OpenTimestamps (anchored) slot in later
// as upgrades via the seal_level column — existing 'basic' seals upgrade cleanly.
//
// What this proves TODAY (honest):
//   - Integrity: the exact document content, unaltered (SHA-256).
//   - Time-of-record: when it was recorded in our system (server timestamp).
// What it does NOT yet claim: third-party notarization or blockchain anchoring.
//
// Requires (server-only, never NEXT_PUBLIC_):
//   SUPABASE_SERVICE_ROLE_KEY   — lets the server write the seal past RLS
//   NEXT_PUBLIC_SUPABASE_URL    — already in your env

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'crypto';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. Identify the caller from their access token (never trust a user_id from the body).
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    const { ideaId } = await req.json();
    if (!ideaId) return NextResponse.json({ ok: false, error: 'Missing ideaId' }, { status: 400 });

    // 2. Load the idea and verify it belongs to this user.
    const { data: idea, error: loadErr } = await admin
      .from('vault_ideas')
      .select('*')
      .eq('id', ideaId)
      .eq('user_id', user.id)   // ownership check — can't seal someone else's idea
      .single();
    if (loadErr || !idea) return NextResponse.json({ ok: false, error: 'Idea not found' }, { status: 404 });
    if (idea.status === 'sealed') return NextResponse.json({ ok: false, error: 'Already sealed' }, { status: 409 });

    // 3. Build the canonical document string and hash it. This is the fingerprint.
    const sealedAt = new Date().toISOString();
    const canonical = [
      'GRATIA CORE — IDEAS VAULT SEAL',
      `idea_id: ${idea.id}`,
      `user_id: ${user.id}`,
      `title: ${idea.title}`,
      `document:\n${idea.expanded_doc || idea.description || ''}`,
      `sealed_at: ${sealedAt}`,
    ].join('\n');

    const sealHash = createHash('sha256').update(canonical, 'utf8').digest('hex');
    const sealId = `GC-${randomUUID().split('-')[0].toUpperCase()}`;

    // 4. Save the seal. seal_level = 'basic' now; upgrades to 'notarized' / 'anchored' later.
    const { data: sealed, error: updErr } = await admin
      .from('vault_ideas')
      .update({
        status: 'sealed',
        seal_hash: sealHash,
        seal_id: sealId,
        sealed_at: sealedAt,
        seal_level: 'basic',
        strength: { hash: true, rfc: false, bitcoin: false },
      })
      .eq('id', ideaId)
      .eq('user_id', user.id)
      .select()
      .single();
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true, idea: sealed });
  } catch (e: any) {
    console.error('vault/seal error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}