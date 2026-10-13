'use client';
// @ts-nocheck
// app/dashboard/regulatory/page.tsx — "This may affect you" regulatory feed.
// Personalized from onboarding: industries, state, entity type, headcount. Each update shows
// what changed (plain English), why it matters to THIS business, what they may need to do,
// possible cost/operational impact, deadline, and the official source. Honest: informational,
// not legal advice. Dark default + toggle.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}
const ago = d => { if(!d) return ''; const days=Math.floor((Date.now()-new Date(d))/86400000); return days<=0?'today':days===1?'1 day ago':`${days} days ago`; };
const fmtDate = d => d ? new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : null;
const daysUntil = d => d ? Math.ceil((new Date(d + 'T12:00:00') - Date.now())/86400000) : null;
const STATE_NAMES = { AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',DC:'Washington, DC' };
const stateCode = s => { if(!s) return null; const t=String(s).trim(); if(/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase(); const hit=Object.entries(STATE_NAMES).find(([,n])=>n.toLowerCase()===t.toLowerCase()); return hit?hit[0]:null; };

const LEVELS = {
  action:  { label: 'Action required', dot: '🔴', color: '#ff3b30', bg: 'rgba(255,59,48,0.10)', bd: 'rgba(255,59,48,0.30)' },
  monitor: { label: 'Monitor',         dot: '🟡', color: '#d97706', bg: 'rgba(245,158,11,0.12)', bd: 'rgba(245,158,11,0.32)' },
  info:    { label: 'Informational',   dot: '🟢', color: '#1a7a35', bg: 'rgba(48,209,88,0.10)',  bd: 'rgba(48,209,88,0.28)' },
};
// Fallback for rows not yet enriched: derive a level from impact/doc type.
const levelOf = u => u.action_level || ((u.impact||'').includes('high') ? 'action' : (u.impact||'').includes('med') ? 'monitor' : 'info');

export default function RegulatoryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [reviewed, setReviewed] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('dark');
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState('all'); // all | action | monitor | info | reviewed
  const [userId, setUserId] = useState(null);

  useEffect(() => { const s = localStorage.getItem('gc_intel_mode'); if (s) setMode(s); }, []);
  useEffect(() => { localStorage.setItem('gc_intel_mode', mode); }, [mode]);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setUserId(user.id);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      const inds = prof?.industries?.length ? prof.industries : (prof?.industry ? [prof.industry] : []);
      if (inds.length) {
        const [{ data }, { data: rv }] = await Promise.all([
          supabase.from('reg_updates').select('*').overlaps('industries', inds).order('published_at', { ascending: false }).limit(80),
          supabase.from('reg_reviews').select('update_id').eq('user_id', user.id),
        ]);
        setUpdates(data || []);
        setReviewed(new Set((rv || []).map(r => r.update_id)));
      }
      setLoading(false);
    })();
  }, [router]);

  const markReviewed = async (u, on) => {
    setReviewed(s => { const n = new Set(s); on ? n.add(u.id) : n.delete(u.id); return n; });
    if (on) await supabase.from('reg_reviews').insert({ user_id: userId, update_id: u.id });
    else await supabase.from('reg_reviews').delete().eq('user_id', userId).eq('update_id', u.id);
  };

  // ---------- theme ----------
  const D = mode === 'dark';
  const bg = D ? 'radial-gradient(ellipse 60% 40% at 15% 0%,rgba(124,58,237,0.15) 0%,transparent 55%),#0a0e17' : 'radial-gradient(ellipse 60% 40% at 15% 0%,rgba(124,58,237,0.1) 0%,transparent 55%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)';
  const ink = D?'#fff':'#1a1a2e', ink2 = D?'rgba(255,255,255,0.55)':'rgba(26,26,46,0.6)', ink3 = D?'rgba(255,255,255,0.38)':'rgba(26,26,46,0.42)';
  const card = D?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.78)', cardBdr = D?'rgba(255,255,255,0.10)':'rgba(255,255,255,0.95)', inner = D?'rgba(255,255,255,0.04)':'rgba(26,26,46,0.035)';
  const purple = D ? '#bf5af2' : '#7c3aed';

  // ---------- personalization from onboarding ----------
  const inds = profile?.industries?.length ? profile.industries : (profile?.industry ? [profile.industry] : []);
  const st = stateCode(profile?.state || profile?.reg_state);
  const stateName = st ? STATE_NAMES[st] : null;
  const employees = Number(profile?.reg_employee_count || profile?.company_size || 0) || null;
  const entity = profile?.reg_structure || null;

  // Hide items that clearly don't apply (state-limited elsewhere, or above a headcount they don't meet)
  const relevant = updates.filter(u => {
    if (Array.isArray(u.states) && u.states.length && st && !u.states.includes(st)) return false;
    if (u.employee_min && employees && employees < u.employee_min) return false;
    return true;
  });
  const counts = { action: 0, monitor: 0, info: 0 };
  relevant.forEach(u => { counts[levelOf(u)] = (counts[levelOf(u)] || 0) + 1; });
  const unreviewedAction = relevant.filter(u => levelOf(u) === 'action' && !reviewed.has(u.id)).length;
  const shown = relevant.filter(u => filter === 'all' ? !reviewed.has(u.id) : filter === 'reviewed' ? reviewed.has(u.id) : (levelOf(u) === filter && !reviewed.has(u.id)));

  const whyLine = (u) => {
    const bits = [];
    if (inds.length) bits.push(`you run a ${inds[0].toLowerCase()} business`);
    if (stateName) bits.push(`in ${stateName}`);
    if (employees) bits.push(`with ${employees} employee${employees===1?'':'s'}`);
    if (entity) bits.push(`(${entity})`);
    const who = bits.length ? `Because ${bits.join(' ')}, ` : '';
    const lv = levelOf(u);
    return who + (lv === 'action' ? 'this likely applies to you and may require action.' : lv === 'monitor' ? 'this is worth watching — it could affect you if it moves forward.' : 'this is good to know but likely needs no action from you.');
  };

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0e17', color:'rgba(255,255,255,0.4)', fontFamily:"'DM Sans',sans-serif" }}>Loading…</div>;

  const Pill = ({ lv, small }) => { const L = LEVELS[lv] || LEVELS.info; return <span style={{fontSize:small?10:11,fontWeight:700,padding:small?'2px 8px':'3px 10px',borderRadius:100,background:L.bg,border:`1px solid ${L.bd}`,color:L.color,whiteSpace:'nowrap'}}>{L.dot} {L.label}</span>; };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ minHeight:'100vh', background:bg, color:ink, fontFamily:"'DM Sans',sans-serif", padding:'18px 16px 60px' }}>
        <div style={{ maxWidth:780, margin:'0 auto' }}>
          {/* header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
              <Link href="/dashboard/intelligence" style={{textDecoration:'none'}}><GCIcon size={28}/></Link>
              <div style={{minWidth:0}}><p style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:ink}}>Regulatory · This may affect you</p><p style={{fontSize:11,color:ink3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{[inds.join(', '), stateName, employees?`${employees} employees`:null, entity].filter(Boolean).join(' · ') || 'Set up your business profile'}</p></div>
            </div>
            <div style={{display:'flex',gap:8,flexShrink:0}}>
              <button onClick={()=>setMode(m=>m==='dark'?'light':'dark')} style={{background:card,border:`1px solid ${cardBdr}`,borderRadius:100,padding:'6px 12px',cursor:'pointer',color:ink2,fontSize:12,fontFamily:'inherit'}}>{D?'☀︎':'☾'}</button>
              <button onClick={()=>router.push('/onboarding?tier=intelligence')} style={{background:card,border:`1px solid ${cardBdr}`,borderRadius:100,padding:'6px 12px',cursor:'pointer',color:ink2,fontSize:12,fontFamily:'inherit'}}>Edit profile</button>
            </div>
          </div>

          {!inds.length ? (
            <div style={{ background:card, border:`1px solid ${cardBdr}`, borderRadius:18, padding:'36px 24px', textAlign:'center' }}>
              <p style={{fontSize:32,marginBottom:10}}>⚖️</p>
              <p style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,color:ink,marginBottom:6}}>Tell us about your business first</p>
              <p style={{fontSize:13,color:ink2,lineHeight:1.6,maxWidth:380,margin:'0 auto 16px'}}>We match regulatory changes to your industry, state, business type, and team size — so you only see what may actually affect you.</p>
              <button onClick={()=>router.push('/onboarding?tier=intelligence')} style={{padding:'10px 20px',borderRadius:100,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700,color:'#fff',background:'linear-gradient(135deg,#7c3aed,#bf5af2)'}}>Set up my profile →</button>
            </div>
          ) : (
            <>
              {/* attention summary */}
              <div style={{ background:card, border:`1px solid ${cardBdr}`, borderRadius:18, padding:'16px 18px', marginBottom:14 }}>
                <p style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,color:ink,marginBottom:4}}>
                  {unreviewedAction > 0 ? `🔴 ${unreviewedAction} thing${unreviewedAction===1?'':'s'} may need your attention` : counts.monitor > 0 ? `🟡 Nothing urgent — ${counts.monitor} to keep an eye on` : '🟢 Nothing needs your attention right now'}
                </p>
                <p style={{fontSize:12.5,color:ink2,lineHeight:1.55}}>Matched to {inds.length === 1 ? inds[0] : `${inds.length} industries`}{stateName?` in ${stateName}`:''} from official federal sources. Updates that clearly don't apply to your state or team size are filtered out.</p>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:12}}>
                  {[['all',`Open · ${relevant.filter(u=>!reviewed.has(u.id)).length}`],['action',`🔴 Action · ${counts.action}`],['monitor',`🟡 Monitor · ${counts.monitor}`],['info',`🟢 Info · ${counts.info}`],['reviewed',`✓ Reviewed · ${reviewed.size}`]].map(([v,l])=>(
                    <button key={v} onClick={()=>setFilter(v)} style={{padding:'6px 12px',borderRadius:100,fontSize:12,fontWeight:filter===v?700:500,cursor:'pointer',fontFamily:'inherit',border:`1px solid ${filter===v?purple:cardBdr}`,background:filter===v?(D?'rgba(191,90,242,0.18)':'rgba(124,58,237,0.10)'):'transparent',color:filter===v?(D?'#e0c3ff':purple):ink2}}>{l}</button>
                  ))}
                </div>
              </div>

              {shown.length === 0 && (
                <div style={{ background:card, border:`1px solid ${cardBdr}`, borderRadius:18, padding:'30px 24px', textAlign:'center' }}>
                  <p style={{fontSize:14,fontWeight:700,color:ink,marginBottom:4}}>{updates.length === 0 ? 'No updates matched yet' : filter === 'reviewed' ? 'Nothing reviewed yet' : 'All clear here'}</p>
                  <p style={{fontSize:12.5,color:ink2,lineHeight:1.55,maxWidth:380,margin:'0 auto'}}>{updates.length === 0 ? 'The feed refreshes as new federal rules are published for your industries. Check back soon.' : 'Nothing in this view right now.'}</p>
                </div>
              )}

              {shown.map((u, i) => {
                const lv = levelOf(u); const L = LEVELS[lv];
                const isOpen = open === u.id;
                const dl = u.deadline ? daysUntil(u.deadline) : null;
                const steps = Array.isArray(u.steps) ? u.steps : [];
                const enriched = !!u.enriched_at;
                return (
                  <div key={u.id} style={{ background:card, border:`1px solid ${isOpen?L.bd:cardBdr}`, borderLeft:`3px solid ${L.color}`, borderRadius:16, padding:'14px 16px', marginBottom:10, animation:`fadeUp .25s ease ${i*0.03}s both` }}>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:6}}>
                      <Pill lv={lv} small />
                      {u.impact && <span style={{fontSize:10,fontWeight:700,color:ink3,letterSpacing:'0.06em'}}>IMPACT {String(u.impact).toUpperCase()}</span>}
                      {u.deadline && <span style={{fontSize:10,fontWeight:700,color: dl!==null && dl<=14 ? '#ff3b30' : ink3}}>⏰ {dl!==null && dl>=0 ? `${dl} day${dl===1?'':'s'} · ` : ''}{fmtDate(u.deadline)}</span>}
                      <span style={{fontSize:10,color:ink3,marginLeft:'auto'}}>{u.agency ? u.agency.split(' ').slice(0,4).join(' ') : 'Federal'} · {ago(u.published_at)}</span>
                    </div>
                    <p onClick={()=>setOpen(isOpen?null:u.id)} style={{fontSize:14.5,fontWeight:700,color:ink,lineHeight:1.4,cursor:'pointer'}}>{u.title}</p>
                    {u.applies_to && <p style={{fontSize:12,color:ink2,marginTop:4}}><strong style={{color:ink3,fontWeight:600}}>Applies to:</strong> {u.applies_to}</p>}

                    {/* why it matters to YOU — always visible */}
                    <div style={{marginTop:9,background:L.bg,border:`1px solid ${L.bd}`,borderRadius:10,padding:'8px 11px'}}>
                      <p style={{fontSize:12.5,color:ink,lineHeight:1.55}}><strong style={{color:L.color}}>Why it matters to you:</strong> {whyLine(u)}</p>
                    </div>

                    {isOpen && (
                      <div style={{marginTop:12,animation:'fadeUp .2s ease both'}}>
                        <p style={{fontSize:11,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:ink3,marginBottom:4}}>What changed</p>
                        <p style={{fontSize:13,color:ink2,lineHeight:1.6,marginBottom:12}}>{u.what_changed || u.summary || 'See the official source for the full text.'}</p>

                        {steps.length > 0 && (<>
                          <p style={{fontSize:11,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:ink3,marginBottom:6}}>What you may need to do</p>
                          <div style={{background:inner,borderRadius:10,padding:'10px 12px',marginBottom:12}}>
                            {steps.map((s,si)=>(<div key={si} style={{display:'flex',gap:8,marginBottom:si<steps.length-1?6:0}}><span style={{color:L.color,fontWeight:700,fontSize:12.5}}>{si+1}.</span><span style={{fontSize:12.5,color:ink,lineHeight:1.5}}>{s}</span></div>))}
                          </div>
                        </>)}

                        {u.cost_impact && (<>
                          <p style={{fontSize:11,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:ink3,marginBottom:4}}>Possible impact</p>
                          <p style={{fontSize:12.5,color:ink2,lineHeight:1.55,marginBottom:12}}>{u.cost_impact}</p>
                        </>)}

                        {!enriched && <p style={{fontSize:11.5,color:ink3,marginBottom:12,fontStyle:'italic'}}>Plain-English breakdown coming shortly for this update.</p>}

                        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                          {u.source_url && <a href={u.source_url} target="_blank" rel="noopener noreferrer" style={{fontSize:12,fontWeight:700,color:purple,textDecoration:'none',padding:'8px 14px',borderRadius:100,border:`1px solid ${cardBdr}`}}>Official source ↗</a>}
                          <button onClick={()=>markReviewed(u, !reviewed.has(u.id))} style={{fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',padding:'8px 14px',borderRadius:100,border:'none',background: reviewed.has(u.id) ? inner : 'linear-gradient(135deg,#7c3aed,#bf5af2)',color: reviewed.has(u.id) ? ink2 : '#fff'}}>{reviewed.has(u.id) ? 'Move back to open' : '✓ Mark reviewed'}</button>
                        </div>
                      </div>
                    )}
                    {!isOpen && <button onClick={()=>setOpen(u.id)} style={{marginTop:8,background:'none',border:'none',cursor:'pointer',fontSize:12,fontWeight:600,color:purple,fontFamily:'inherit',padding:0}}>Review →</button>}
                  </div>
                );
              })}

              <p style={{fontSize:10.5,color:ink3,textAlign:'center',marginTop:22,lineHeight:1.7}}>Matched to your profile from official federal sources. Plain-English summaries, impact levels, and cost notes are estimates to help you prioritize — informational only, not legal advice.<br/>Confirm anything binding with a licensed professional.</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}