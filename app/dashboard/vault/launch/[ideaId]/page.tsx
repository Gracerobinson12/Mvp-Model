'use client';
// @ts-nocheck
// app/dashboard/vault/launch/[ideaId]/page.tsx — Launch HQ v1.
// Idea auto-carries from the Vault. 5-question intake → AI plan → tracked tasks in Supabase.
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
  { id: 'foundation', name: 'Foundation', icon: '🏛️', sub: 'Make it a real, legal business' },
  { id: 'build', name: 'Build', icon: '🔨', sub: 'Design & build the product' },
  { id: 'legal', name: 'Legal & Compliance', icon: '⚖️', sub: 'Policies & what the law requires' },
  { id: 'launch', name: 'Launch', icon: '🚀', sub: 'Test it & go live' },
];

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

  useEffect(() => { const s = localStorage.getItem('gc_dash_mode'); if (s) setMode(s); }, []);
  useEffect(() => { localStorage.setItem('gc_dash_mode', mode); }, [mode]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      // load the vault idea
      const { data: i } = await supabase.from('vault_ideas').select('*').eq('id', ideaId).eq('user_id', user.id).single();
      if (!i) { setError('Idea not found.'); setLoading(false); return; }
      setIdea(i);
      // existing project for this idea?
      const { data: p } = await supabase.from('launch_projects').select('*').eq('idea_id', ideaId).eq('user_id', user.id).is('deleted_at', null).maybeSingle();
      if (p) {
        setProject(p); setIntake(p.intake || {});
        const { data: t } = await supabase.from('launch_tasks').select('*').eq('project_id', p.id).order('sort');
        if (t && t.length) { setTasks(t); setStep('plan'); }
      }
      setLoading(false);
    })();
  }, [ideaId, router]);

  const isAnswered = (q) => {
    const v = intake[q.key];
    return q.multi ? Array.isArray(v) && v.length > 0 : !!v;
  };
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
    // Flatten multi-select arrays into readable strings for storage + the AI prompt.
    const flatIntake = Object.fromEntries(
      Object.entries(intake).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v])
    );
    try {
      const { data: { user, session } } = await supabase.auth.getUser().then(async r => ({ data: { user: r.data.user, session: (await supabase.auth.getSession()).data.session } }));
      // create (or reuse) the project
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
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Generation failed');
      const { data: t } = await supabase.from('launch_tasks').select('*').eq('project_id', proj.id).order('sort');
      setTasks(t || []); setStep('plan');
    } catch (e) { setError(e.message || 'Something went wrong'); setStep('intake'); }
  };

  const toggleTask = async (t) => {
    const nv = !t.done;
    setTasks(ts => ts.map(x => x.id === t.id ? { ...x, done: nv } : x));
    await supabase.from('launch_tasks').update({ done: nv }).eq('id', t.id);
  };

  const D = mode === 'dark';
  const bg = D ? '#0e151e' : 'linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)';
  const ink = D ? '#e5ebf1' : '#14202e', ink2 = D ? '#97a5b5' : '#566475', ink3 = D ? 'rgba(151,165,181,0.6)' : 'rgba(86,100,117,0.6)';
  const card = D ? '#17202b' : '#fff', cardBdr = D ? '#2a3645' : '#d3dae2', accent = '#1f45c7';

  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:D?'#0e151e':'#eef1f6', color:ink3, fontFamily:"'DM Sans',sans-serif" }}>Loading…</div>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ minHeight:'100vh', background:bg, color:ink, fontFamily:"'DM Sans',sans-serif", padding:'18px 18px 60px' }}>
        <div style={{ maxWidth:720, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Link href="/dashboard/vault" style={{textDecoration:'none'}}><GCIcon size={28}/></Link>
              <div><p style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:ink}}>Launch HQ</p><p style={{fontSize:11,color:ink3}}>{idea?.title || 'Your project'}</p></div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setMode(m=>m==='dark'?'light':'dark')} style={{background:card,border:`1px solid ${cardBdr}`,borderRadius:100,padding:'6px 12px',cursor:'pointer',color:ink2,fontSize:12,fontWeight:500,fontFamily:'inherit'}}>{D?'☀︎ Light':'☾ Dark'}</button>
              <Link href="/dashboard/vault" style={{fontSize:13,color:ink2,textDecoration:'none',alignSelf:'center'}}>← Vault</Link>
            </div>
          </div>

          {/* INTAKE */}
          {step === 'intake' && (
            <div style={{ animation:'fadeUp 0.3s ease both' }}>
              <div style={{ background:card, border:`1px solid ${cardBdr}`, borderRadius:16, padding:'18px 20px', marginBottom:16 }}>
                <p style={{fontSize:11,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:ink3,marginBottom:6}}>Your idea</p>
                <p style={{fontSize:16,fontWeight:700,color:ink,marginBottom:4}}>{idea?.title}</p>
                <p style={{fontSize:13,color:ink2,lineHeight:1.55}}>{idea?.description}</p>
              </div>
              <p style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:ink,marginBottom:4}}>Let's build your plan</p>
              <p style={{fontSize:13,color:ink2,marginBottom:20,lineHeight:1.55}}>Answer 5 quick questions. We'll turn your idea into a real, step-by-step plan you can track.</p>

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
                {allAnswered ? '✨ Generate my launch plan' : `Answer all 5 (${answeredCount}/5)`}
              </button>
              <p style={{fontSize:11,color:ink3,textAlign:'center',marginTop:12,lineHeight:1.6}}>Your plan is general guidance to help you organize — not legal, financial, or tax advice. Confirm anything official with a licensed professional.</p>
            </div>
          )}

          {/* GENERATING */}
          {step === 'generating' && (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <div style={{ width:40, height:40, border:`3px solid ${cardBdr}`, borderTopColor:accent, borderRadius:'50%', margin:'0 auto 20px', animation:'spin 0.8s linear infinite' }} />
              <p style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,color:ink,marginBottom:8}}>Building your plan…</p>
              <p style={{fontSize:13,color:ink2,lineHeight:1.6,maxWidth:340,margin:'0 auto'}}>Turning "{idea?.title}" into real, trackable steps across four phases. This takes a few seconds.</p>
            </div>
          )}

          {/* PLAN */}
          {step === 'plan' && (
            <div style={{ animation:'fadeUp 0.3s ease both' }}>
              <div style={{ background:card, border:`1px solid ${cardBdr}`, borderRadius:16, padding:'18px 20px', marginBottom:20 }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <p style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,color:ink}}>{done} of {tasks.length} done</p>
                  <span style={{fontSize:14,fontWeight:700,color:accent}}>{pct}%</span>
                </div>
                <div style={{height:8,background:D?'#2a3544':'#d9e0e8',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:accent,transition:'width 0.3s'}}/></div>
              </div>

              {PHASES.map(ph => {
                const phTasks = tasks.filter(t => t.phase === ph.id);
                if (!phTasks.length) return null;
                const phDone = phTasks.filter(t=>t.done).length;
                return (
                  <div key={ph.id} style={{ marginBottom:24 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:8, borderBottom:`2px solid ${ink}` }}>
                      <span style={{fontSize:20}}>{ph.icon}</span>
                      <div style={{flex:1}}><p style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,color:ink}}>{ph.name}</p><p style={{fontSize:12,color:ink3}}>{ph.sub}</p></div>
                      <span style={{fontSize:13,color:ink3}}>{phDone}/{phTasks.length}</span>
                    </div>
                    {phTasks.map(t => (
                      <div key={t.id} style={{ display:'flex', gap:12, padding:'11px 0', borderBottom:`1px solid ${cardBdr}`, cursor:'pointer' }} onClick={()=>toggleTask(t)}>
                        <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${t.done?'#21744a':cardBdr}`, background:t.done?'#21744a':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{t.done && <span style={{color:'#fff',fontSize:12,fontWeight:700}}>✓</span>}</div>
                        <div style={{flex:1}}>
                          <p style={{fontSize:14.5,fontWeight:560,color:t.done?ink3:ink,textDecoration:t.done?'line-through':'none',lineHeight:1.4}}>{t.title}</p>
                          {t.why && <p style={{fontSize:12.5,color:ink3,marginTop:3,lineHeight:1.5}}>{t.why}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              <div style={{display:'flex',gap:8,marginTop:20,justifyContent:'center'}}>
                <button onClick={()=>{ setStep('intake'); }} style={{padding:'10px 18px',borderRadius:100,border:`1px solid ${cardBdr}`,background:'transparent',color:ink2,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Adjust answers &amp; regenerate</button>
              </div>
              <p style={{fontSize:11,color:ink3,textAlign:'center',marginTop:20,lineHeight:1.7}}>This plan is general guidance to help you organize your launch — not legal, financial, or tax advice.<br/>Laws vary by location and situation; confirm anything official with a licensed professional.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}