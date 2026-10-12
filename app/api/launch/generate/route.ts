// app/api/launch/generate/route.ts
// Generates an idea-specific launch plan with Anthropic. Built to NEVER fail the user:
//   1) big enough token budget so the JSON isn't cut off
//   2) salvages complete tasks even if the output is truncated
//   3) retries once with a shorter request if nothing parsed
//   4) falls back to a starter plan built from the idea itself if the model is unavailable
// Order of phases is deliberate: validate -> build -> official (legal/money LAST) -> launch.
// Not legal/financial advice. Env: ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const PHASE_IDS = ['validate', 'build', 'official', 'launch'];

const PHASES = [
  { id: 'validate', name: 'Shape & Validate', scope: 'Understand exactly what they are building and prove people want it BEFORE spending money: one-sentence pitch, who it is for, the core problem, the simplest version that delivers value, and cheap/free validation (landing page or waitlist, 5-10 conversations with target users, a pricing hypothesis, a check of the real competitors).' },
  { id: 'build', name: 'Build the Product', scope: 'Make the smallest real version that delivers the core value (MVP/prototype): brand basics, only the screens/pages it truly needs, backend/database, accounts only if required, and getting it in front of a handful of real users to confirm it works.' },
  { id: 'official', name: 'Make It Official', scope: 'ONLY once it is validated and working: form the entity (LLC/etc.) or confirm structure, EIN, business bank account, licenses/permits, sales-tax registration if selling, and the policies that apply (Privacy Policy, Terms, and any specific law like CAN-SPAM/GDPR/CCPA/PCI-via-processor, with why it applies), framed as "you likely need X, confirm with a professional."' },
  { id: 'launch', name: 'Launch & Grow', scope: 'Go live and grow: final QA, switch payments to live, link legal pages, recruit beta/early users, support path + analytics, launch announcement in the exact communities where these customers are, and a 30-day review.' },
];

type Task = { phase: string; title: string; why: string; steps: string[]; tip: string | null; est_time: string | null; est_cost: string | null; resource: string | null };

function buildPrompt(idea: string, intake: any, compact: boolean) {
  const phaseList = PHASES.map(p => `- ${p.id} (${p.name}): ${p.scope}`).join('\n');
  const perPhase = compact ? '3' : '3 to 5';
  const howCount = compact ? '2' : '3';
  return `You are an experienced founder mentoring someone building the SPECIFIC idea below. Write a plan that reads like it came from someone who has launched this exact kind of thing — never generic startup advice they could Google.

THE IDEA (tailor everything to it):
${idea}

CONTEXT:
- Type: ${intake.kind || 'not specified'}
- Monetization: ${intake.money || 'not specified'}
- Location/market: ${intake.location || 'not specified'}
- Business status: ${intake.entity || 'not specified'}
- Timeline: ${intake.timeline || 'not specified'}

Use EXACTLY these four phases, in this order:
${phaseList}

RULES:
- ${perPhase} tasks per phase.
- CRITICAL ORDER: never place entity formation, EIN, paid legal, or purchases before validation and a working build. Money/legal lives ONLY in "official". "validate" must be cheap or free.
- BE SPECIFIC TO THIS IDEA. Name the exact subreddits, groups, directories, forums, or physical places where THIS idea's customers already are; name the real competitors; name the actual tool. Drop any task you cannot make specific.
- "how": ${howCount} literal do-it-now actions with real tools/sites/search terms. Not a restatement of the title.
- "tip": one non-obvious insider insight for THIS idea (a common mistake, shortcut, cheaper alternative, or gotcha). No platitudes.
- "resource": ONE real tool/site/template name (e.g. "Google Forms", "Carrd", "Stripe Payment Links", "USPTO TESS", "r/houseplants").
- "time": e.g. "~2 hours", "1 weekend". "cost": e.g. "$0", "~$15/mo", "$130 one-time".
- Legal/official tasks: name the specific law/rule and why, framed as "you likely need X — confirm with a professional."
- Keep every string short. No markdown anywhere.

Return ONLY this JSON, nothing else:
{"tasks":[{"phase":"validate","title":"...","why":"...","how":["...","..."],"tip":"...","time":"...","cost":"...","resource":"..."}]}`;
}

// --- parsing helpers --------------------------------------------------------
function stripFences(s: string) { return s.replace(/```json/gi, '').replace(/```/g, '').trim(); }

function parseTasks(raw: string): any[] {
  const text = stripFences(raw);
  // 1) try the whole object / array
  const o = text.indexOf('{'), cb = text.lastIndexOf('}');
  if (o !== -1 && cb > o) {
    try {
      const p = JSON.parse(text.slice(o, cb + 1));
      if (Array.isArray(p)) return p;
      if (Array.isArray(p?.tasks)) return p.tasks;
      if (Array.isArray(p?.plan)) return p.plan;
    } catch {}
  }
  // 2) salvage: pull out every complete task object even if the tail was cut off
  const found: any[] = [];
  const re = /\{[^{}]*"title"\s*:\s*"[^{}]*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    try { const t = JSON.parse(m[0]); if (t && t.title) found.push(t); } catch {}
  }
  return found;
}

function normalize(tasks: any[]): Task[] {
  const asSteps = (v: any): string[] => {
    if (Array.isArray(v)) return v.map(x => String(x).slice(0, 300)).filter(Boolean).slice(0, 6);
    if (typeof v === 'string' && v.trim()) return [v.slice(0, 300)];
    return [];
  };
  const legacy: Record<string, string> = { foundation: 'official', legal: 'official' };
  return tasks.map(t => {
    let phase = String(t.phase || '').toLowerCase();
    phase = legacy[phase] || phase;
    if (!PHASE_IDS.includes(phase)) phase = 'validate';
    return {
      phase,
      title: String(t.title || t.task || t.name || '').slice(0, 300),
      why: String(t.why || t.reason || t.description || '').slice(0, 500),
      steps: asSteps(t.how || t.steps || t.actions),
      tip: String(t.tip || t.insight || '').slice(0, 500) || null,
      est_time: String(t.time || t.est_time || '').slice(0, 40) || null,
      est_cost: String(t.cost || t.est_cost || '').slice(0, 40) || null,
      resource: String(t.resource || t.tool || '').slice(0, 120) || null,
    };
  }).filter(t => t.title);
}

async function askModel(prompt: string, maxTokens: number): Promise<any[]> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: 'You are a JSON API. Reply with one raw JSON object and nothing else — no prose, no markdown, no code fences.',
    messages: [{ role: 'user', content: prompt }],
  });
  const raw = (msg.content || []).map((b: any) => (b.type === 'text' ? b.text : '')).join('').trim();
  return parseTasks(raw);
}

// Last resort so the user always gets a usable, idea-aware starting plan (never an error screen).
function fallbackPlan(ideaTitle: string): Task[] {
  const t = ideaTitle || 'your idea';
  const mk = (phase: string, title: string, why: string, steps: string[], tip: string, est_time: string, est_cost: string, resource: string): Task =>
    ({ phase, title, why, steps, tip, est_time, est_cost, resource });
  return [
    mk('validate', `Write the one-sentence pitch for ${t}`, 'If you cannot say it in one sentence, customers will not get it either.', ['Fill in: "[Who] struggles with [problem]. ' + t + ' helps by [how]."', 'Read it to 3 people outside your circle and note where they get confused', 'Rewrite until nobody asks "so what does it do?"'], 'The clearest pitches name the customer before the product.', '~1 hour', '$0', 'Google Docs'),
    mk('validate', 'Talk to 10 people who have this problem', 'Real conversations beat assumptions and cost nothing.', ['List where these people already gather online and offline', 'Ask about the last time they hit the problem and what they did', 'Write down the exact words they use — that becomes your copy'], 'Ask about past behavior, not whether they "would" use it — people say yes to be nice.', '1 week', '$0', 'Notion'),
    mk('validate', 'Put up a one-page landing page with a waitlist', 'Email signups are the cheapest proof that strangers want this.', ['Headline = your one-sentence pitch', 'One signup box, one benefit list, nothing else', 'Share it where your customers are and watch the signup rate'], 'A 5%+ visitor-to-signup rate is a strong early signal for a new idea.', '1 afternoon', '$0–$19', 'Carrd'),
    mk('build', 'Define the smallest version that delivers the core value', 'Scope creep is the #1 reason first versions never ship.', ['Write the single job the product must do', 'List features, then cut everything not needed for that job', 'Sketch the 3–5 screens or steps that remain'], 'If a feature does not help the one core job, it waits for v2.', '~2 hours', '$0', 'Figma'),
    mk('build', 'Build the first working version', 'A real thing in users\' hands teaches more than any plan.', ['Pick the simplest stack you can ship with', 'Build only the screens from your scope', 'Use hosted services for auth, data, and payments instead of custom code'], 'Boring, proven tools ship faster than clever ones.', '2–4 weeks', '$0–$50/mo', 'Vercel + Supabase'),
    mk('build', 'Test it with 5 real users', 'Watching real people use it reveals what you cannot see yourself.', ['Recruit from your waitlist or conversations', 'Watch them use it without helping', 'Fix the top 3 points of confusion before anything else'], 'Silence while they struggle is the most valuable data you will get.', '1 week', '$0', 'Zoom'),
    mk('official', 'Choose and form your business structure', 'Now that it works, protect yourself before taking real customers.', ['Compare sole proprietor vs LLC for your situation', 'File formation documents with your state', 'Get a free EIN from the IRS'], 'You likely need an LLC before taking payments at scale — confirm with a professional for your state.', '1 weekend', '$50–$300', 'IRS EIN (free)'),
    mk('official', 'Open a business bank account and set up bookkeeping', 'Separating money keeps your liability protection intact.', ['Open a business checking account with your EIN', 'Connect simple bookkeeping software', 'Route all income and expenses through it'], 'Mixing personal and business money can void your LLC protection.', '~2 hours', '$0–$15/mo', 'Wave'),
    mk('official', 'Publish Privacy Policy and Terms', 'Required by app stores, payment processors, and most laws before launch.', ['Draft both from a reputable template', 'Add the specific rules that apply to your product and location', 'Link them in your product and on your site'], 'If you collect emails you likely need CAN-SPAM compliance — confirm with a professional.', '~3 hours', '$0–$100', 'Termly'),
    mk('launch', 'Run a final quality check', 'First impressions decide whether people come back.', ['Test every core flow on a phone and a laptop', 'Try to break it: bad inputs, slow network, refreshes', 'Fix anything that blocks the core job'], 'Test the path a brand-new user takes, not the one you know by heart.', '2–3 days', '$0', 'BrowserStack'),
    mk('launch', 'Launch to your waitlist and the communities you found', 'Your earliest fans are already waiting — start there.', ['Email the waitlist with a personal note', 'Post where your customers gather, sharing the problem story not just the product', 'Reply to every single comment and signup in week one'], 'Launching to 50 warm people beats launching to 5,000 strangers.', '1 week', '$0', 'Resend'),
    mk('launch', 'Review what happened after 30 days', 'Decide the next move from data, not feelings.', ['Track signups, active users, and the one key action', 'Talk to 5 users who stayed and 5 who left', 'Pick the single biggest improvement for next month'], 'Retention after 30 days tells you more than launch-day numbers.', '~2 hours', '$0', 'Google Analytics'),
  ];
}

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { projectId, idea, intake: rawIntake } = await req.json();
    if (!projectId || !idea) return NextResponse.json({ error: 'Missing project info' }, { status: 400 });
    const intake = rawIntake && typeof rawIntake === 'object' ? rawIntake : {};

    const { data: proj } = await admin.from('launch_projects').select('id,name').eq('id', projectId).eq('user_id', user.id).single();
    if (!proj) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // ---- generate with safety nets ----
    let tasks: Task[] = [];
    let source = 'ai';
    try {
      tasks = normalize(await askModel(buildPrompt(idea, intake, false), 8000));
      if (tasks.length < 6) {
        console.warn('launch: thin result, retrying compact');
        tasks = normalize(await askModel(buildPrompt(idea, intake, true), 6000));
      }
    } catch (e: any) {
      console.error('launch: model call failed:', e?.message || e);
    }
    if (tasks.length < 6) {
      console.warn('launch: using fallback plan');
      tasks = fallbackPlan(proj.name || String(idea).split('\n')[0]);
      source = 'fallback';
    }

    // ---- save (replace existing) ----
    await admin.from('launch_tasks').delete().eq('project_id', projectId);
    const rows = tasks.map((t, i) => ({ project_id: projectId, user_id: user.id, ...t, sort: i, done: false }));
    let { error: insErr } = await admin.from('launch_tasks').insert(rows);
    if (insErr) {
      // detail columns missing (SQL not run yet) -> save base fields so the plan still appears
      console.error('launch insert failed, retrying base fields:', insErr.message);
      const baseRows = rows.map(({ steps, tip, est_time, est_cost, resource, ...b }) => b);
      const retry = await admin.from('launch_tasks').insert(baseRows);
      if (retry.error) throw retry.error;
    }

    return NextResponse.json({ ok: true, count: rows.length, source });
  } catch (e: any) {
    console.error('launch generate error:', e);
    return NextResponse.json({ error: 'Something went wrong generating the plan. Please try again.' }, { status: 500 });
  }
}