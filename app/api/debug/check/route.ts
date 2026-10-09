// app/api/debug/check/route.ts
// TEMPORARY diagnostic v2 — decodes the key's role + project, shows the real read error.
// Open https://www.gratiacore.com/api/debug/check in your browser. Reveals NO secret values.
// DELETE THIS FILE once fixed.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Decode a JWT payload (middle segment) without verifying — safe, reveals role + project ref.
function decodeJwt(jwt: string) {
  try {
    const part = jwt.split('.')[1];
    if (!part) return { error: 'not a JWT (no payload segment)' };
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const p = JSON.parse(json);
    return { role: p.role, project_ref: p.ref, issuer: p.iss };
  } catch (e: any) {
    return { error: 'could not decode: ' + e.message };
  }
}

function projectRefFromUrl(url: string) {
  try { return new URL(url).hostname.split('.')[0]; } catch { return null; }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const keyInfo = decodeJwt(svc);
  const urlRef = projectRefFromUrl(url);

  const report: any = {
    url_project_ref: urlRef,
    key_role: (keyInfo as any).role || null,            // MUST be "service_role"
    key_project_ref: (keyInfo as any).project_ref || null, // MUST equal url_project_ref
    key_decode_error: (keyInfo as any).error || null,
    role_is_service_role: (keyInfo as any).role === 'service_role',
    project_refs_match: (keyInfo as any).project_ref === urlRef,
  };

  // Show the ACTUAL read error, fully.
  try {
    const admin = createClient(url, svc);
    const { count, error } = await admin
      .from('vault_ideas')
      .select('id', { count: 'exact', head: true });
    report.vault_read_ok = !error;
    report.vault_total_rows = count;
    report.vault_read_error = error ? JSON.stringify(error) : null;
  } catch (e: any) {
    report.vault_read_ok = false;
    report.vault_read_error = 'THROWN: ' + JSON.stringify({ message: e?.message, name: e?.name, cause: String(e?.cause || '') });
  }

  return NextResponse.json(report, { status: 200 });
}