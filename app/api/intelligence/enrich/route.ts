// app/api/intelligence/enrich/route.ts
// Turns raw Federal Register entries into "This may affect you" cards.
// For each un-enriched reg_updates row, asks Claude for: what changed (plain English), who it
// applies to, impact, action level, deadline, what they may need to do, and cost impact.
// Honest framing throughout ("may", estimates, not legal advice). Run after /api/intelligence/ingest.
//
// Run: /api/intelligence/enrich?secret=YOUR_SECRET   (add to Vercel Cron after ingest)
// Env: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, INGEST_SECRET, ANTHROPIC_API_KEY

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

export async function GET(req: NextRequest)  { return run(req); }
export async function POST(req: NextRequest) { return run(req); }

function extractJson(raw: string): any | null {
  const t = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const o = t.indexOf('{'), c = t.lastIndexOf('}');
  if (o === -1 || c <= o) return null;
  try { return JSON.parse(t.slice(o, c + 1)); } catch { return null; }
}

const clean = (v: any, n: number) => (v == null ? null : String(v).slice(0, n)) || null;
const dateOrNull = (v: any) => { const s = String(v || '').trim(); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; };

async function enrichOne(u: any) {
  const prompt = `You explain U.S. federal regulatory updates to small-business owners in plain English. Be accurate and honest. Never give definitive legal advice — say "may" and "likely", and point them to a professional for anything binding.

UPDATE:
Title: ${u.title}
Agency: ${u.agency || 'unknown'}
Type: ${u.doc_type || ''}
Published: ${u.published_at || ''}
Industries tagged: ${(u.industries || []).join(', ') || 'general'}
Abstract: ${u.summary || '(none)'}

Return ONLY this JSON:
{
 "what_changed": "2-3 plain-English sentences on what this update actually does",
 "applies_to": "who it applies to in one short line, e.g. 'Restaurants and food-service businesses with employees', or 'Any business importing goods from China'",
 "action_level": "action | monitor | info",
 "impact": "high | medium | low",
 "deadline": "YYYY-MM-DD if there is a comment deadline, compliance date, or effective date; otherwise null",
 "steps": ["what the business MAY need to do, 1-3 short items, each starting with a verb; empty array if purely informational"],
 "cost_impact": "one short honest line on possible cost or operational impact, e.g. 'Possible added cost: updating labels and training staff' or 'No direct cost expected'. Say 'estimate' or 'possible' — never a precise dollar figure unless the document states one",
 "employee_min": null or a number if the rule only applies above a headcount threshold,
 "states": [] or a list of 2-letter state codes if it is clearly limited to specific states
}

Rules: "action" = a business in these industries likely must do something by a date. "monitor" = proposed or pending, worth watching. "info" = awareness only. Keep every string short and specific to THIS update.`;

  const msg = await anthropic.messages.create({
    model: MODEL, max_tokens: 900,
    system: 'You are a JSON API. Reply with one raw JSON object and nothing else.',
    messages: [{ role: 'user', content: prompt }],
  });
  const raw = (msg.content || []).map((b: any) => (b.type === 'text' ? b.text : '')).join('');
  const j = extractJson(raw);
  if (!j) return null;

  const action = ['action', 'monitor', 'info'].includes(String(j.action_level)) ? String(j.action_level) : 'info';
  const impact = ['high', 'medium', 'low'].includes(String(j.impact)) ? String(j.impact) : (u.impact || 'low');
  const steps = Array.isArray(j.steps) ? j.steps.map((s: any) => String(s).slice(0, 200)).filter(Boolean).slice(0, 4) : [];
  const states = Array.isArray(j.states) ? j.states.map((s: any) => String(s).toUpperCase().slice(0, 2)).filter(s => /^[A-Z]{2}$/.test(s)) : [];
  const empMin = Number.isFinite(Number(j.employee_min)) && Number(j.employee_min) > 0 ? Math.round(Number(j.employee_min)) : null;

  return {
    what_changed: clean(j.what_changed, 800),
    applies_to: clean(j.applies_to, 200),
    action_level: action,
    impact,
    deadline: dateOrNull(j.deadline),
    steps,
    cost_impact: clean(j.cost_impact, 300),
    employee_min: empMin,
    states,
    enriched_at: new Date().toISOString(),
  };
}

async function run(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;
    const secret = sp.get('secret');
    if (process.env.INGEST_SECRET && secret !== process.env.INGEST_SECRET)
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const limit = Math.min(parseInt(sp.get('limit') || '15', 10) || 15, 40);

    const { data: rows, error } = await admin.from('reg_updates')
      .select('id,title,summary,agency,doc_type,impact,industries,published_at')
      .is('enriched_at', null)
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    let done = 0, failed = 0;
    for (const u of rows || []) {
      try {
        const fields = await enrichOne(u);
        if (!fields) { failed++; continue; }
        const { error: upErr } = await admin.from('reg_updates').update(fields).eq('id', u.id);
        if (upErr) { failed++; continue; }
        done++;
      } catch (e) { console.error('enrich item failed:', u.id, (e as any)?.message); failed++; }
    }
    return NextResponse.json({ ok: true, candidates: (rows || []).length, enriched: done, failed });
  } catch (e: any) {
    console.error('enrich error:', e);
    return NextResponse.json({ ok: false, error: e.message || 'Server error' }, { status: 500 });
  }
}