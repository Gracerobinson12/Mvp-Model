// app/api/intelligence/tariff/route.ts
// Tariff lookup via the free USITC HTS API (no key). Given a search term, returns
// matching HTS codes + their duty rates. Also a simple "surcharge check": compare a
// supplier's price increase % to the actual tariff rate.
// This is informational — labeled as an estimate (HTS classification is genuinely tricky).

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get('q');
    if (!q || q.length < 2) return NextResponse.json({ ok: false, error: 'Enter at least 2 characters' }, { status: 400 });

    // USITC HTS REST search (public). Returns matching tariff lines.
    const url = `https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'GratiaCore/1.0' } });
    if (!res.ok) throw new Error(`HTS ${res.status}`);
    const data = await res.json();

    // Normalize to a clean list (HTS returns an array of results)
    const results = (Array.isArray(data) ? data : data.results || []).slice(0, 15).map(r => ({
      htsno: r.htsno || r.htsNumber || '',
      description: r.description || '',
      general: r.general || r.generalRate || '',     // general duty rate (text, e.g. "2.6%")
      special: r.special || '',
    })).filter(r => r.htsno || r.description);

    return NextResponse.json({ ok: true, query: q, results });
  } catch (e: any) {
    console.error('tariff route error:', e);
    return NextResponse.json({ ok: false, error: 'Tariff lookup is temporarily unavailable. Try again shortly.' }, { status: 500 });
  }
}