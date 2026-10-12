'use client';
// @ts-nocheck
// app/dashboard/vault/launch/[ideaId]/page.tsx — Launch HQ v2 (build cockpit).
// Idea auto-carries from the Vault. 5-question intake → AI plan → tracked, detailed tasks in Supabase.
// Phase order is deliberate: validate → build → make it official (money/legal LAST) → launch.
// RLS-secured per user. NOT legal/financial advice (disclaimers throughout).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

const QUESTIONS = [
  { key: 'kind', label: 'What kind of thing is it?', hint: 'Pick all that apply', multi: true, opts: ['Website', 'App', 'Physical product', 'Service', 'Other'] },
  { key: 'money', label: 'How will you charge?', hint: 'Pick all that apply', multi: true, opts: ['Subscriptions', 'One-time purchases', 'Free for now'] },
  { key: 'location', label: 'Where are you / your customers?', opts: ['United States', 'US + International', 'Other'] },
  { key: 'entity', label: 'Are you a registered business yet?', opts: ['Not yet', 'Sole proprietor', 'LLC', 'Corporation'] },
  { key: 'timeline', label: 'Timeline goal?', opts: ['ASAP', '2–3 months', 'No rush'] },
];
const PHASES = [
  { id: 'validate', name: 'Shape & Validate', icon: '🔍', sub: 'Understand it & prove it — before spending a dollar' },
  { id: 'build', name: 'Build the Product', icon: '🔨', sub: 'Make the smallest real version that works' },
  { id: 'official', name: 'Make It Official', icon: '🏛️', sub: 'Form the business — only once it’s working' },
  { id: 'launch', name: 'Launch & Grow', icon: '🚀', sub: 'Go live and get your first users' },
];
// Older plans used different phase names — map them so nothing disappears.
const LEGACY = { foundation: 'official', legal: 'official' };
const normPhase = (p) => { const x = LEGACY[p] || p; return PHASES.some(ph => ph.id === x) ? x : 'validate'; };
// Pull the first dollar figure out of "$130 one-time" / "~$15/mo" / "$50–$300".
const costNum = (s) => { const m = String(s || '').replace(/,/g, '').match(/\$\s*(\d+(\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
const fmt$ = (n) => n >= 1000 ? `$${(n/1000).toFixed(1).replace(/\.0$/,'')}k` : `$${Math.round(n)}`;

export default function LaunchHQPage() {
  const router = useRouter();
  const params = useParams();
  const ideaId = params?.ideaId;
  const [mode, setMode] = useState('light');
  const [loading, setLoading] = useState(true);
  const [idea, setIdea] = useState(null);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [intake, setIntake] = useState({});
  const [step, setStep] = useState('intake'); // intake | generating | plan
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  useEffect(() => { const s = localStorage.getItem('gc_dash_mode'); if (s) setMode(s); }, []);
  useEffect(() => { localStorage.setItem('gc_dash_mode', mode); }, [mode]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data: i } = await supabase.from('vault_ideas').select('*').eq('id', ideaId).eq('user_id', user.id).single();
      if (!i) { setError('We couldn’t find that idea in your vault.'); setLoading(false); return; }
      setIdea(i);
      const { data: p } = await supabase.from('launch_projects').select('*').eq('idea_id', ideaId).eq('user_id', user.id).is('deleted_at', null).maybeSingle();
      if (p) {
        setProject(p); setIntake(p.intake || {});
        const { data: t } = await supabase.from('launch_tasks').select('*').eq('project_id', p.id).order('sort');
        if (t && t.length) { setTasks(t); setStep('plan'); }
      }
      setLoading(false);
    })();
  }, [ideaId, router]);

  const isAnswered = (q) => { const v = intake[q.key]; return q.multi ? Array.isArray(v) && v.length > 0 : !!v; };
  const toggleOpt = (q, o) => {
    setIntake(p => {
      if (!q.multi) return { ...p, [q.key]: o };
      const cur = Array.isArray(p[q.key]) ? p[q.key] : [];
      return { ...p, [q.key]: cur.includes(o) ? cur.filter(x => x !== o) : [...cur, o] };
    });
  };
  const answeredCount = QUESTIONS.filter(isAnswered).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  const generate = async () => {
    setError(''); setStep('generating');
    const flatIntake = Object.fromEntries(Object.entries(intake).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v]));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      let proj = project;
      if (!proj) {
        const { data: created, error: ce } = await supabase.from('launch_projects').insert({
          user_id: user.id, idea_id: ideaId, name: idea.title,
          idea_summary: [idea.title, idea.description].filter(Boolean).join(' — '),
          intake: flatIntake,
        }).select().single();
        if (ce) throw ce;
        proj = created; setProject(created);
      } else {
        await supabase.from('launch_projects').update({ intake: flatIntake }).eq('id', proj.id);
      }
      const ideaText = [idea.title, idea.description, idea.expanded_doc].filter(Boolean).join('\n\n');
      const res = await fetch('/api/launch/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ projectId: proj.id, idea: ideaText, intake: flatIntake }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error('retry');
      const { data: t } = await supabase.from('launch_tasks').select('*').eq('project_id', proj.id).order('sort');
      setTasks(t || []); setOpenId(null); setStep('plan');
    } catch (e) {
      // Never show raw errors to users.
      setError('We couldn’t finish building your plan just now. Give it another try.');
      setStep('intake');
    }
  };

  const toggleTask = async (t) => {
    const nv = !t.done;
    setTasks(ts => ts.map(x => x.id === t.id ? { ...x, done: nv } : x));
    await supabase.from('launch_tasks').update({ done: nv }).eq('id', t.id);
  };

  // ---------- theme ----------
  const D = mode === 'dark';
  const bg = D ? '#0e151e' : 'linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)';
  const ink = D ? '#e5ebf1' : '#14202e', ink2 = D ? '#97a5b5' : '#566475', ink3 = D ? 'rgba(151,165,181,0.6)' : 'rgba(86,100,117,0.6)';
  const card = D ? '#17202b' : '#fff', card2 = D ? '#0f161f' : '#f6f8fb', cardBdr = D ? '#2a3645' : '#d3dae2';
  const accent = '#1f45c7', red = '#ff3b30', green = '#1a7a35';
  const chip = { fontSize: 11, fontWeight: 600, color: ink2, background: D ? '#1f2a37' : '#eef2f7', borderRadius: 100, padding: '3px 9px', whiteSpace: 'nowrap' };
  const chipBlue = { ...chip, color: D ? '#9db4ff' : accent, background: D ? '#17233f' : '#eaeefc' };

  // ---------- derived (cockpit numbers) ----------
  const normTasks = tasks.map(t => ({ ...t, phase: normPhase(t.phase) }));
  const done = normTasks.filter(t => t.done).length;
  const pct = normTasks.length ? Math.round(done / normTasks.length * 100) : 0;
  const byPhase = PHASES.map(ph => ({ ...ph, items: normTasks.filter(t => t.phase === ph.id) })).filter(ph => ph.items.length);
  const nextTask = (() => { for (const ph of byPhase) { const t = ph.items.find(x => !x.done); if (t) return { ...t, phaseName: ph.name }; } return null; })();
  const spent = normTasks.filter(t => t.done).reduce((s, t) => s + costNum(t.est_cost), 0);
  const estTotal = normTasks.reduce((s, t) => s + costNum(t.est_cost), 0);
  const nextPhase = byPhase.find(ph => ph.items.some(t => !t.done));
  const intakeChips = [intake.kind, intake.money, intake.location].filter(Boolean).map(v => Array.isArray(v) ? v.join(', ') : v);

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:D?'#0e151e':'#eef1f6', color:ink3, fontFamily:"'DM Sans',sans-serif" }}>Loading…</div>;

  const Card = ({ children, style }) => <div style={{ background:card, border:`1px solid ${cardBdr}`, borderRadius:16, padding:'16px 18px', ...style }}>{children}</div>;
  const Eyebrow = ({ children, color }) => <p style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:color||ink3,marginBottom:6}}>{children}</p>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.hq-two{display:grid;grid-template-columns:1.6fr 1fr;gap:14px}@media(max-width:760px){.hq-two{grid-template-columns:1fr}}`}</style>
      <div style={{ minHeight:'100vh', background:bg, color:ink, fontFamily:"'DM Sans',sans-serif", padding:'18px 16px 60px' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          {/* top bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
              <Link href="/dashboard/vault" style={{textDecoration:'none'}}><GCIcon size={28}/></Link>
              <div style={{minWidth:0}}><p style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:ink}}>Launch HQ</p><p style={{fontSize:11,color:ink3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{idea?.title || 'Your project'}</p></div>
            </div>
            <div style={{display:'flex',gap:8,flexShrink:0}}>
              <button onClick={()=>setMode(m=>m==='dark'?'light':'dark')} style={{background:card,border:`1px solid ${cardBdr}`,borderRadius:100,padding:'6px 12px',cursor:'pointer',color:ink2,fontSize:12,fontWeight:500,fontFamily:'inherit'}}>{D?'☀︎ Light':'☾ Dark'}</button>
              <Link href="/dashboard/vault" style={{fontSize:13,color:ink2,textDecoration:'none',alignSelf:'center'}}>← Vault</Link>
            </div>
          </div>

          {/* ================= INTAKE ================= */}
          {step === 'intake' && idea && (
            <div style={{ animation:'fadeUp 0.3s ease both', maxWidth:720, margin:'0 auto' }}>
              <Card style={{ marginBottom:16 }}>
                <Eyebrow>Your idea</Eyebrow>
                <p style={{fontSize:16,fontWeight:700,color:ink,marginBottom:4}}>{idea?.title}</p>
                <p style={{fontSize:13,color:ink2,lineHeight:1.55}}>{idea?.description}</p>
              </Card>
              <p style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:ink,marginBottom:4}}>Let's build your plan</p>
              <p style={{fontSize:13,color:ink2,marginBottom:20,lineHeight:1.55}}>Answer 5 quick questions and we'll turn your idea into a detailed, phased plan you can track. We start by helping you understand and validate what you're building — so you don't spend money forming a business until it's actually working.</p>
              {QUESTIONS.map(q => (
                <div key={q.key} style={{ marginBottom:18 }}>
                  <label style={{fontSize:14,fontWeight:650,color:ink,display:'block',marginBottom:q.hint?3:8}}>{q.label}</label>
                  {q.hint && <p style={{fontSize:11.5,color:ink3,marginBottom:8}}>{q.hint}</p>}
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                    {q.opts.map(o => {
                      const v = intake[q.key];
                      const on = q.multi ? (Array.isArray(v) && v.includes(o)) : v === o;
                      return <button key={o} onClick={()=>toggleOpt(q,o)} style={{padding:'8px 14px',borderRadius:100,fontSize:13,fontWeight:on?700:500,cursor:'pointer',fontFamily:'inherit',border:`1px solid ${on?accent:cardBdr}`,background:on?accent:card,color:on?'#fff':ink2}}>{on && q.multi ? '✓ ' : ''}{o}</button>;
                    })}
                  </div>
                </div>
              ))}
              {error && <p style={{fontSize:13,color:'#ae2a21',marginTop:12}}>{error}</p>}
              <button onClick={generate} disabled={!allAnswered} style={{ width:'100%', marginTop:16, padding:15, borderRadius:10, border:'none', cursor:allAnswered?'pointer':'not-allowed', fontFamily:'inherit', fontSize:15, fontWeight:700, color:'#fff', background:allAnswered?accent:'rgba(0,0,0,0.12)', opacity:allAnswered?1:0.6 }}>
                {allAnswered ? (tasks.length ? '✨ Regenerate my launch plan' : '✨ Generate my launch plan') : `Answer all 5 (${answeredCount}/5)`}
              </button>
              {tasks.length > 0 && <button onClick={()=>setStep('plan')} style={{width:'100%',marginTop:8,padding:11,borderRadius:10,border:`1px solid ${cardBdr}`,background:'transparent',color:ink2,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>← Back to my current plan</button>}
              <p style={{fontSize:11,color:ink3,textAlign:'center',marginTop:12,lineHeight:1.6}}>Your plan is general guidance to help you organize — not legal, financial, or tax advice. Confirm anything official with a licensed professional.</p>
            </div>
          )}

          {/* ================= GENERATING ================= */}
          {step === 'generating' && (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <div style={{ width:40, height:40, border:`3px solid ${cardBdr}`, borderTopColor:accent, borderRadius:'50%', margin:'0 auto 20px', animation:'spin 0.8s linear infinite' }} />
              <p style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,color:ink,marginBottom:8}}>Building your plan…</p>
              <p style={{fontSize:13,color:ink2,lineHeight:1.6,maxWidth:360,margin:'0 auto'}}>Turning "{idea?.title}" into specific, trackable steps — with how-tos, tips, time and cost for each. This takes about 20–30 seconds.</p>
            </div>
          )}

          {/* ================= PLAN (cockpit) ================= */}
          {step === 'plan' && (
            <div style={{ animation:'fadeUp 0.3s ease both' }}>
              {/* header */}
              <Card style={{ marginBottom:14 }}>
                <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
                  <div style={{ width:66, height:66, borderRadius:'50%', flexShrink:0, background:`conic-gradient(${accent} ${pct}%, ${cardBdr} 0)`, display:'grid', placeItems:'center' }}>
                    <div style={{ width:50, height:50, borderRadius:'50%', background:card, display:'grid', placeItems:'center', fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:ink }}>{pct}%</div>
                  </div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <p style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,color:ink}}>{idea?.title}</p>
                      {intakeChips.length > 0 && <span style={chipBlue}>{intakeChips.join(' · ')}</span>}
                    </div>
                    <p style={{fontSize:12,color:ink3,marginTop:4}}>{done} of {normTasks.length} steps done{nextPhase ? <> · current phase: <strong style={{color:ink2}}>{nextPhase.name}</strong></> : ' · all phases complete 🎉'}</p>
                    <div style={{height:8,background:card2,borderRadius:6,overflow:'hidden',marginTop:10}}><div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${accent},#3a6ff0)`,transition:'width 0.3s'}}/></div>
                  </div>
                  <button onClick={()=>setStep('intake')} style={{padding:'9px 16px',borderRadius:100,border:`1px solid ${cardBdr}`,background:'transparent',color:ink2,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Adjust &amp; regenerate</button>
                </div>
              </Card>

              {/* do this next */}
              {nextTask && (
                <Card style={{ marginBottom:14, borderLeft:`3px solid ${red}` }}>
                  <Eyebrow color={red}>Do this next · {nextTask.phaseName}</Eyebrow>
                  <p style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:ink}}>{nextTask.title}</p>
                  {nextTask.why && <p style={{fontSize:13,color:ink2,marginTop:4,lineHeight:1.55}}>{nextTask.why}</p>}
                  <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                    <button onClick={()=>setOpenId(nextTask.id)} style={{padding:'8px 14px',borderRadius:100,border:'none',background:accent,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>See how to do it ↓</button>
                    <button onClick={()=>toggleTask(nextTask)} style={{padding:'8px 14px',borderRadius:100,border:`1px solid ${cardBdr}`,background:'transparent',color:ink2,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>✓ Mark done</button>
                  </div>
                </Card>
              )}

              <div className="hq-two">
                {/* phases + tasks */}
                <div style={{display:'grid',gap:14,alignContent:'start'}}>
                  {byPhase.map(ph => {
                    const phDone = ph.items.filter(t=>t.done).length;
                    const complete = phDone === ph.items.length;
                    return (
                      <Card key={ph.id}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                          <span style={{fontSize:20}}>{ph.icon}</span>
                          <div style={{flex:1,minWidth:0}}><p style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:ink}}>{ph.name}</p><p style={{fontSize:12,color:ink3}}>{ph.sub}</p></div>
                          <span style={{...chip, color: complete ? green : (phDone ? accent : ink3)}}>{complete ? '✓ Done' : `${phDone} / ${ph.items.length}`}</span>
                        </div>
                        {ph.items.map(t => {
                          const steps = Array.isArray(t.steps) ? t.steps : [];
                          const hasDetail = steps.length || t.tip || t.est_time || t.est_cost || t.resource;
                          const open = openId === t.id;
                          return (
                            <div key={t.id} style={{ border:`1px solid ${open?accent:cardBdr}`, borderRadius:12, padding:'11px 12px', marginBottom:8, background: open ? card : card2, boxShadow: open ? `0 0 0 3px ${accent}22` : 'none' }}>
                              <div style={{ display:'flex', gap:10 }}>
                                <div onClick={()=>toggleTask(t)} style={{ width:19, height:19, borderRadius:5, border:`2px solid ${t.done?green:cardBdr}`, background:t.done?green:'transparent', display:'grid', placeItems:'center', flexShrink:0, marginTop:2, cursor:'pointer', color:'#fff', fontSize:11, fontWeight:700 }}>{t.done && '✓'}</div>
                                <div style={{flex:1,minWidth:0,cursor:hasDetail?'pointer':'default'}} onClick={()=>hasDetail && setOpenId(open?null:t.id)}>
                                  <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'flex-start'}}>
                                    <p style={{fontSize:14,fontWeight:650,color:t.done?ink3:ink,textDecoration:t.done?'line-through':'none',lineHeight:1.4}}>{t.title}</p>
                                    {hasDetail && <span style={{fontSize:11,color:ink3,flexShrink:0,marginTop:3}}>{open?'▲':'▾'}</span>}
                                  </div>
                                  {t.why && <p style={{fontSize:12.5,color:ink3,marginTop:3,lineHeight:1.5}}>{t.why}</p>}
                                  {(t.est_time||t.est_cost||t.resource) && (
                                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:7}}>
                                      {t.est_time && <span style={chip}>⏱ {t.est_time}</span>}
                                      {t.est_cost && <span style={chip}>💲 {t.est_cost}</span>}
                                      {t.resource && <span style={chipBlue}>🔧 {t.resource}</span>}
                                    </div>
                                  )}
                                  {open && (
                                    <div style={{marginTop:11,animation:'fadeUp 0.2s ease both'}}>
                                      {steps.length > 0 && (
                                        <div style={{marginBottom:t.tip?10:0}}>
                                          <Eyebrow>How to do it</Eyebrow>
                                          {steps.map((s,si)=>(
                                            <div key={si} style={{display:'flex',gap:8,marginBottom:5}}>
                                              <span style={{color:accent,fontWeight:700,fontSize:12.5,flexShrink:0}}>{si+1}.</span>
                                              <span style={{fontSize:12.5,color:ink2,lineHeight:1.5}}>{s}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {t.tip && (
                                        <div style={{background:D?'#17233f':'#eaeefc',border:`1px solid ${D?'#2a3b5c':'#d4ddfb'}`,borderRadius:10,padding:'9px 12px'}}>
                                          <span style={{fontSize:12.5,color:D?'#9db4ff':accent,lineHeight:1.55}}><strong>💡 Insider tip:</strong> {t.tip}</span>
                                        </div>
                                      )}
                                      {!steps.length && !t.tip && <p style={{fontSize:12,color:ink3}}>Regenerate the plan to get step-by-step detail for this task.</p>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </Card>
                    );
                  })}
                </div>

                {/* side rail */}
                <div style={{display:'grid',gap:14,alignContent:'start'}}>
                  <Card>
                    <Eyebrow>Milestones</Eyebrow>
                    <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:4}}>
                      <div style={{display:'flex',gap:10}}><span style={{width:9,height:9,borderRadius:'50%',background:green,marginTop:5,flexShrink:0}}/><div><p style={{fontSize:13,fontWeight:700,color:ink}}>Idea sealed in the Vault</p><p style={{fontSize:11,color:ink3}}>{idea?.sealed_at ? new Date(idea.sealed_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' · done' : 'saved · seal it in the Vault for dated proof'}</p></div></div>
                      {byPhase.map(ph => {
                        const d = ph.items.filter(t=>t.done).length, n = ph.items.length;
                        const state = d === n ? 'done' : (d > 0 || ph.id === nextPhase?.id) ? 'active' : 'next';
                        return (
                          <div key={ph.id} style={{display:'flex',gap:10}}>
                            <span style={{width:9,height:9,borderRadius:'50%',background: state==='done'?green: state==='active'?accent: cardBdr, marginTop:5, flexShrink:0}}/>
                            <div><p style={{fontSize:13,fontWeight:700,color: state==='next'?ink2:ink}}>{ph.name}</p><p style={{fontSize:11,color:ink3}}>{state==='done' ? 'done' : state==='active' ? `in progress · ${Math.round(d/n*100)}%` : 'up next'}</p></div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                  <Card>
                    <Eyebrow>Cost tracker</Eyebrow>
                    <p style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:26,color:ink,marginTop:2}}>{fmt$(spent)} <span style={{fontSize:12,fontWeight:400,color:ink3}}>spent / ~{fmt$(estTotal)} est. to launch</span></p>
                    <div style={{height:8,background:card2,borderRadius:6,overflow:'hidden',marginTop:8}}><div style={{height:'100%',width:`${estTotal?Math.min(100,Math.round(spent/estTotal*100)):0}%`,background:green}}/></div>
                    <p style={{fontSize:11,color:ink3,marginTop:8,lineHeight:1.5}}>Adds up each step's estimated cost as you check it off — so there are no surprises. Estimates only.</p>
                  </Card>
                  <div style={{background:card2,border:`1px dashed ${cardBdr}`,borderRadius:12,padding:'12px 14px',fontSize:12,color:ink2,lineHeight:1.55}}>
                    Tap any step to see exactly how to do it, a tip specific to your idea, and the tool to use. Money and legal steps come <strong>after</strong> you've proven it works — on purpose.
                  </div>
                </div>
              </div>

              <p style={{fontSize:11,color:ink3,textAlign:'center',marginTop:22,lineHeight:1.7}}>This plan is general guidance to help you organize your launch — not legal, financial, or tax advice.<br/>Laws vary by location and situation; confirm anything official with a licensed professional.</p>
            </div>
          )}

          {/* idea missing */}
          {!idea && !loading && step !== 'generating' && (
            <div style={{textAlign:'center',padding:'60px 20px',color:ink2}}><p style={{fontSize:14}}>{error || 'We couldn’t find that idea.'}</p><Link href="/dashboard/vault" style={{color:accent,fontWeight:600,textDecoration:'none',display:'inline-block',marginTop:10}}>← Back to Vault</Link></div>
          )}
        </div>
      </div>
    </>
  );
}