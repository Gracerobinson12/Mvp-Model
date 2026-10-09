// app/api/debug/check/route.ts
// TEMP diagnostic v4 — lists the models THIS key can actually use.
// Open https://www.gratiacore.com/api/debug/check  — DELETE after fixing.

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY || '';
  const report: any = {
    anthropic_key_present: !!key,
    anthropic_key_prefix: key.slice(0, 12),   // e.g. "sk-ant-api03" vs "sk-ant-admin"
  };

  try {
    const anthropic = new Anthropic({ apiKey: key });
    const list = await anthropic.models.list({ limit: 50 });
    report.models_ok = true;
    report.available_models = (list.data || []).map((m: any) => m.id);
    report.model_count = report.available_models.length;
  } catch (e: any) {
    report.models_ok = false;
    report.models_error_status = e?.status || null;
    report.models_error = e?.message || String(e);
  }

  return NextResponse.json(report, { status: 200 });
}