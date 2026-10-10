// app/api/launch/generate/route.ts
// Generates a project plan from the idea + 5 intake answers using Anthropic.
// Server-side only (ANTHROPIC_API_KEY never reaches the browser). Verifies the user.
// IMPORTANT: the plan is informational planning guidance, NOT legal/financial/tax advice.
// Env: ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PHASES = [
  { id: 'foundation', name: 'Foundation', scope: 'Making it a real, legal business: name availability, entity formation or confirming structure, EIN, business bank account, licenses/permits, sales tax registration if selling, bookkeeping, insurance, professional email.' },
  { id: 'build', name: 'Build', scope: 'Designing and building the product: brand basics, the pages/screens it needs, the backend/database, authentication if accounts, payments if charging, core features.' },
  { id: 'legal', name: 'Legal & Compliance', scope: 'Making it legally compliant: Privacy Policy, Terms of Service, and only the other policies that apply, plus naming any specific law/rule this project triggers (e.g. CAN-SPAM, GDPR, CCPA, PCI via processor). Say why it applies.' },
  { id: 'launch', name: 'Launch', scope: 'Proving it works and going live: QA testing, switching payments to live, legal pages linked, beta testers, support process, launch announcement, post-launch review.' },
];

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { projectId, idea, intake } = await req.json();
    if (!projectId || !idea) return NextResponse.json({ error: 'Missing project info' }, { status: 400 });

    // verify the project belongs to this user
    const { data: proj } = await admin.from('launch_projects').select('id').eq('id', projectId).eq('user_id', user.id).single();
    if (!proj) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const phaseList = PHASES.map(p => `- ${p.id} (${p.name}): ${p.scope}`).join('\n');
    const prompt = `You are a practical startup operations planner. Create a concrete, actionable task list to take this idea from concept to launch.

THE IDEA:
${idea}

CONTEXT (their answers):
- Type: ${intake.kind || 'not specified'}
- Monetization: ${intake.money || 'not specified'}
- Location/market: ${intake.location || 'not specified'}
- Business status: ${intake.entity || 'not specified'}
- Timeline: ${intake.timeline || 'not specified'}

Organize tasks under EXACTLY these four phases:
${phaseList}

RULES:
- 3 to 6 concrete tasks per phase. Specific and doable, not vague.
- Tailor to their answers (e.g. if "Free for now", skip payment tasks; if "Not yet" a business, include formation).
- For legal tasks, name the specific law/rule and why it applies — but frame as "you likely need X, confirm with a professional", never as definitive legal advice.
- Each task: a short title and a one-sentence "why".

Return ONLY valid JSON, no markdown, in this exact shape:
{"tasks":[{"phase":"foundation","title":"...","why":"..."},...]}`;

    const msg = await anthropic.messages.create({
      // Override anytime by setting ANTHROPIC_MODEL in Vercel. Default is a model your account has.
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 2000,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: '{' },   // prefill: forces the reply to be JSON
      ],
    });

    const raw = msg.content.find(b => b.type === 'text')?.text || '';
    const text = '{' + raw;   // re-attach the prefilled opening brace
    // Robust JSON extraction: strip code fences, then grab the first {...} block even if the
    // model added any prose before/after it.
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.slice(firstBrace, lastBrace + 1);
    }
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error('launch parse failed. raw model output:', text);
      return NextResponse.json({ error: 'Plan generation failed, try again.' }, { status: 500 });
    }
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    if (!tasks.length) return NextResponse.json({ error: 'No tasks generated, try again.' }, { status: 500 });

    // save tasks (replace any existing for this project)
    await admin.from('launch_tasks').delete().eq('project_id', projectId);
    const rows = tasks.map((t, i) => ({
      project_id: projectId, user_id: user.id,
      phase: ['foundation','build','legal','launch'].includes(t.phase) ? t.phase : 'build',
      title: String(t.title || '').slice(0, 300),
      why: String(t.why || '').slice(0, 500),
      sort: i, done: false,
    })).filter(t => t.title);
    const { error: insErr } = await admin.from('launch_tasks').insert(rows);
    if (insErr) throw insErr;

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e: any) {
    // Full error stays in server logs only — never sent to the browser.
    console.error('launch generate error:', e);
    return NextResponse.json({ error: 'Something went wrong generating the plan. Please try again.' }, { status: 500 });
  }
}