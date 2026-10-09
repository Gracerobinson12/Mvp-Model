// app/api/debug/check/route.ts
// TEMPORARY diagnostic. Open https://www.gratiacore.com/api/debug/check in your browser.
// It reports whether the live server's env keys are working — WITHOUT exposing any secret.
// DELETE THIS FILE once the issue is fixed (it reveals nothing sensitive, but it's not needed after).

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anthropic = process.env.ANTHROPIC_API_KEY || '';

  const report: any = {
    supabase_url_present: !!url,
    supabase_url_value: url,                       // public anyway (NEXT_PUBLIC_)
    service_role_key_present: !!svc,
    service_role_key_length: svc.length,           // real service key ≈ 200+ chars
    service_role_starts_with_eyJ: svc.startsWith('eyJ'),
    service_role_has_quotes: svc.includes('"') || svc.includes("'"),
    service_role_has_space: /\s/.test(svc),
    anthropic_key_present: !!anthropic,
    anthropic_key_prefix_ok: anthropic.startsWith('sk-ant-'),
  };

  // The real test: can the service role read vault_ideas past RLS?
  try {
    const admin = createClient(url, svc);
    const { count, error } = await admin
      .from('vault_ideas')
      .select('id', { count: 'exact', head: true });
    report.vault_read_ok = !error;
    report.vault_total_rows = count;               // >0 means service role is working
    report.vault_read_error = error ? error.message : null;
  } catch (e: any) {
    report.vault_read_ok = false;
    report.vault_read_error = e.message;
  }

  return NextResponse.json(report, { status: 200 });
}