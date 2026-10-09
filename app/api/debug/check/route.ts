// app/api/debug/check/route.ts
// TEMPORARY diagnostic v3 — raw REST call to surface the LITERAL error. No secrets exposed.
// Open https://www.gratiacore.com/api/debug/check  — DELETE after fixing.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const report: any = {};

  // 1. Raw REST read with the service key — shows the real HTTP status + body.
  try {
    const r = await fetch(`${url}/rest/v1/vault_ideas?select=id&limit=1`, {
      headers: { apikey: svc, Authorization: `Bearer ${svc}` },
    });
    report.raw_status = r.status;              // 200 ok · 401 auth · 403 perm · 404 relation
    report.raw_status_text = r.statusText;
    report.raw_body = (await r.text()).slice(0, 600);
  } catch (e: any) {
    report.raw_fetch_threw = String(e?.message || e);
    report.raw_cause = String(e?.cause || '');
  }

  // 2. supabase-js select (non-head) with full error fields.
  try {
    const admin = createClient(url, svc);
    const { data, error } = await admin.from('vault_ideas').select('id').limit(1);
    report.js_ok = !error;
    report.js_rows = data ? data.length : null;
    report.js_error = error ? { message: error.message, details: (error as any).details, hint: (error as any).hint, code: (error as any).code } : null;
  } catch (e: any) {
    report.js_threw = String(e?.message || e);
  }

  return NextResponse.json(report, { status: 200 });
}