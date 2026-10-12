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

// Order matters: validate and build a real version BEFORE spending money on legal/entity setup.
const PHASES = [
  { id: 'validate', name: 'Shape & Validate', scope: 'Understand exactly what you are building and prove people want it BEFORE spending money: a one-sentence pitch, who it is for, the core problem, the simplest version that would deliver value, and cheap/free validation (landing page or waitlist, 5-10 conversations with target users, a pricing hypothesis, checking direct competitors).' },
  { id: 'build', name: 'Build the Product', scope: 'Make the smallest real version that delivers the core value (an MVP or prototype): brand basics, the few screens/pages it truly needs, the backend/database, accounts only if required, and getting it in front of a handful of real users to confirm it works before going further.' },
  { id: 'official', name: 'Make It Official', scope: 'ONLY once the product is validated and working: now make it a real, legal business — form the entity (LLC/etc.) or confirm structure, EIN, business bank account, any licenses/permits, sales-tax registration if selling, plus the policies that apply (Privacy Policy, Terms, and any specific law like CAN-SPAM/GDPR/CCPA/PCI-via-processor, with why it applies). Frame as "you likely need X, confirm with a professional."' },
  { id: 'launch', name: 'Launch & Grow', scope: 'Go live and grow: final QA, switch payments to live, link the legal pages, recruit beta/early users, set up a support path and analytics, announce the launch, and review what is working after 30 days.' },
];

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { projectId, idea, intake: rawIntake } = await req.json();
    if (!projectId || !idea) return NextResponse.json({ error: 'Missing project info' }, { status: 400 });
    const intake = rawIntake && typeof rawIntake === 'object' ? rawIntake : {};

    // verify the project belongs to this user
    const { data: proj } = await admin.from('launch_projects').select('id').eq('id', projectId).eq('user_id', user.id).single();
    if (!proj) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const phaseList = PHASES.map(p => `- ${p.id} (${p.name}): ${p.scope}`).join('\n');
    const prompt = `You are an experienced founder and operator mentoring someone building the SPECIFIC idea below. Write a plan that feels like it was written by someone who has actually launched this exact kind of thing — not generic startup advice they could Google.

THE IDEA (read it closely and tailor everything to it):
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
- 3 to 6 tasks per phase.
- CRITICAL ORDER: never tell them to spend money forming an entity, getting an EIN, or making purchases until AFTER they have validated the idea and built a working version. Money/legal setup belongs ONLY in the "official" phase. "validate" must be cheap or free.
- BE SPECIFIC TO THIS IDEA, NOT GENERIC. Every task must reference the actual idea. Bad: "do market research." Good: name the exact subreddits, Facebook groups, directories, forums, or physical places where THIS idea's customers already are; name the real competitor(s) and how to differ; name the actual tool to use. If you cannot make a task specific to this idea, drop it.
- "how" must be 3-4 concrete do-it-now actions — the literal steps, with real tools/sites/search terms named — not restatements of the title.
- "tip" is one non-obvious insider insight tailored to THIS idea: a common mistake people make with this type of product, a shortcut, a cheaper alternative, or a gotcha. Not a platitude.
- "resource" names ONE real tool, site, or template to use for that task (e.g. "Google Forms", "Stripe Payment Links", "Carrd", "USPTO TESS", "r/<subreddit>"). Use a real name.
- "time" is a rough estimate like "~2 hours", "1 weekend", "2-3 days". "cost" is a dollar estimate like "$0", "~$15/mo", "$130 one-time".
- For official/legal tasks, name the specific law/rule and why it applies, framed as "you likely need X — confirm with a professional." Never definitive legal advice.

Return ONLY valid JSON, no markdown, in EXACTLY this shape:
{"tasks":[{"phase":"validate","title":"short imperative title","why":"one sentence on why it matters","how":["concrete action 1","concrete action 2","concrete action 3"],"tip":"one idea-specific insider tip","time":"~2 hours","cost":"$0","resource":"Real Tool Name"}]}`;

    const msg = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 4000,
      system: 'You are a JSON API. You reply with one raw JSON object and nothing else — no prose, no markdown, no code fences.',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (msg.content || []).map((b: any) => (b.type === 'text' ? b.text : '')).join('').trim();

    // Tolerant extraction: strip fences, then slice the outermost {...} (or [...]) block.
    const extractJson = (s: string): string => {
      let c = s.replace(/```json/gi, '').replace(/```/g, '').trim();
      const o = c.indexOf('{'), cb = c.lastIndexOf('}');
      const ob = c.indexOf('['), cab = c.lastIndexOf(']');
      // Prefer object braces; fall back to array brackets.
      if (o !== -1 && cb > o) return c.slice(o, cb + 1);
      if (ob !== -1 && cab > ob) return c.slice(ob, cab + 1);
      return c;
    };

    let parsed: any = null;
    try { parsed = JSON.parse(extractJson(raw)); } catch {}

    // Accept {tasks:[...]}, a bare [...], or {phases:{...}} shapes.
    let tasks: any[] = [];
    if (parsed) {
      if (Array.isArray(parsed)) tasks = parsed;
      else if (Array.isArray(parsed.tasks)) tasks = parsed.tasks;
      else if (Array.isArray(parsed.plan)) tasks = parsed.plan;
    }

    if (!tasks.length) {
      console.error('launch generate: could not parse tasks. raw:', raw.slice(0, 1000));
      return NextResponse.json({ error: 'Plan generation failed, try again.', detail: parsed ? 'NO_TASKS' : 'PARSE_FAIL', raw: raw.slice(0, 800) }, { status: 500 });
    }

    // save tasks (replace any existing for this project)
    await admin.from('launch_tasks').delete().eq('project_id', projectId);
    const asSteps = (v: any): string[] => {
      if (Array.isArray(v)) return v.map(x => String(x).slice(0, 300)).filter(Boolean).slice(0, 6);
      if (typeof v === 'string' && v.trim()) return [v.slice(0, 300)];
      return [];
    };
    const rows = tasks.map((t, i) => ({
      project_id: projectId, user_id: user.id,
      phase: ['validate','build','official','launch'].includes(t.phase) ? t.phase : 'validate',
      title: String(t.title || t.task || t.name || '').slice(0, 300),
      why: String(t.why || t.reason || t.description || '').slice(0, 500),
      steps: asSteps(t.how || t.steps || t.actions),
      tip: String(t.tip || t.insight || '').slice(0, 500) || null,
      est_time: String(t.time || t.est_time || '').slice(0, 40) || null,
      est_cost: String(t.cost || t.est_cost || '').slice(0, 40) || null,
      resource: String(t.resource || t.tool || '').slice(0, 120) || null,
      sort: i, done: false,
    })).filter(t => t.title);

    let { error: insErr } = await admin.from('launch_tasks').insert(rows);
    if (insErr) {
      // If the detail columns aren't in the table yet, fall back to base fields so it still works.
      console.error('launch insert failed, retrying with base fields:', insErr.message);
      const baseRows = rows.map(({ steps, tip, est_time, est_cost, resource, ...base }) => base);
      const retry = await admin.from('launch_tasks').insert(baseRows);
      if (retry.error) throw retry.error;
    }

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e: any) {
    console.error('launch generate error:', e);
    // TEMP: surface the real cause so we can diagnose. Remove detail/where once fixed.
    return NextResponse.json({
      error: 'Something went wrong generating the plan. Please try again.',
      detail: e?.message || String(e),
      where: e?.status ? `api_status_${e.status}` : (e?.code ? `db_${e.code}` : 'unknown'),
    }, { status: 500 });
  }
}