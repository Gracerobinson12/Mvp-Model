// app/api/intelligence/ingest/route.ts
// Federal Register ingestion using CFR-title + agency taxonomy (scalable, no AI, free).
// Pulls recent docs WITH cfr_references, maps via lib/cfr-taxonomy, upserts to reg_updates.
//
// Run manually first: /api/intelligence/ingest?secret=YOUR_SECRET  then add Vercel Cron.
// Env: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, INGEST_SECRET

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapDocToIndustries } from '@/lib/cfr-taxonomy';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const impactFrom = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t === 'rule') return 'high';           // final rule
  if (t.includes('proposed')) return 'medium';
  return 'low';                              // notice, etc.
};

export async function GET(req: NextRequest)  { return run(req); }
export async function POST(req: NextRequest) { return run(req); }

async function run(req: NextRequest) {
  try {
    const secret = new URL(req.url).searchParams.get('secret');
    if (process.env.INGEST_SECRET && secret !== process.env.INGEST_SECRET)
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    // Ask the API for the structured fields we map on — crucially cfr_references + agencies.
    const fields = ['document_number','title','abstract','html_url','publication_date','type','agencies','cfr_references']
      .map(f => `fields[]=${f}`).join('&');
    const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const url = `https://www.federalregister.gov/api/v1/documents.json?per_page=200&order=newest&conditions[publication_date][gte]=${since}&${fields}`;

    const res = await fetch(url, { headers: { 'User-Agent': 'GratiaCore/1.0 (intelligence@gratiacore.com)' } });
    if (!res.ok) throw new Error(`Federal Register ${res.status}`);
    const json = await res.json();
    const docs = json.results || [];

    let inserted = 0, skipped = 0;
    for (const d of docs) {
      const industries = mapDocToIndustries(d);
      if (industries.length === 0) { skipped++; continue; }

      const agencyName = (d.agencies && d.agencies[0] && (d.agencies[0].name || d.agencies[0].raw_name)) || null;
      const row = {
        source: 'federal_register',
        source_ref: d.document_number,
        title: d.title,
        summary: d.abstract || null,
        agency: agencyName,
        impact: impactFrom(d.type),
        industries,
        source_url: d.html_url || null,
        published_at: d.publication_date ? new Date(d.publication_date).toISOString() : new Date().toISOString(),
      };
      const { error } = await admin.from('reg_updates').upsert(row, { onConflict: 'source_ref' });
      if (error) { skipped++; continue; }
      inserted++;
    }

    return NextResponse.json({ ok: true, pulled: docs.length, inserted, skipped });
  } catch (e: any) {
    console.error('ingest error:', e);
    return NextResponse.json({ ok: false, error: e.message || 'Server error' }, { status: 500 });
  }
}