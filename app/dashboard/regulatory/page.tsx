'use client';
// @ts-nocheck
// app/dashboard/regulatory/page.tsx — Regulatory feed. Reads reg_updates filtered to the
// user's industries (overlap). Dark default + toggle. Honest empty state before pipeline runs.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}
const agencyShort = a => { const m=(a||'').match(/\b([A-Z]{2,5})\b/); return m?m[1]:(a||'').split(' ').map(w=>w[0]).join('').slice(0,4).toUpperCase()||'GOV'; };
const ago = d => { if(!d) return ''; const days=Math.floor((Date.now()-new Date(d))/86400000); return days<=0?'today':days===1?'1 day ago':`${days} days ago`; };
const impactMeta = (imp,D) => { const v=(imp||'').toLowerCase(); if(v.includes('high'))return{label:'HIGH',color:'#ff3b30'}; if(v.includes('med'))return{label:'MEDIUM',color:D?'#4a9eff':'#0a84ff'}; return{label:'LOW',color:D?'rgba(255,255,255,0.4)':'rgba(28,28,30,0.4)'}; };

export default function RegulatoryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('dark');
  const [open, setOpen] = useState(null);

  useEffect(() => { const s = localStorage.getItem('gc_intel_mode'); if (s) setMode(s); }, []);
  useEffect(() => { localStorage.setItem('gc_intel_mode', mode); }, [mode]);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      const inds = prof?.industries?.length ? prof.industries : (prof?.industry ? [prof.industry] : []);
      if (inds.length) {
        const { data } = await supabase.from('reg_updates').select('*').overlaps('industries', inds).order('published_at', { ascending: false }).limit(50);
        setUpdates(data || []);
      }
      setLoading(false);
    })();
  }, [router]);

  const D = mode === 'dark';
  const bg = D ? 'radial-gradient(ellipse 60% 40% at 15% 0%,rgba(124,58,237,0.15) 0%,transparent 55%),#0a0e17' : 'radial-gradient(ellipse 60% 40% at 15% 0%,rgba(124,58,237,0.1) 0%,transparent 55%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)';
  const ink = D?'#fff':'#1a1a2e', ink2 = D?'rgba(255,255,255,0.5)':'rgba(26,26,46,0.55)', ink3 = D?'rgba(255,255,255,0.35)':'rgba(26,26,46,0.4)';
  const card = D?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.72)', cardBdr = D?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.9)';
  const inds = profile?.industries?.length ? profile.industries : (profile?.industry ? [profile.industry] : []);

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0e17', color:'rgba(255,255,255,0.4)', fontFamily:"'DM Sans',sans-serif" }}>Loading…</div>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ minHeight:'100vh', background:bg, color:ink, fontFamily:"'DM Sans',sans-serif", padding:'18px 18px 60px' }}>
        <div style={{ maxWidth:760, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Link href="/dashboard/intelligence" style={{textDecoration:'none'}}><GCIcon size={28}/></Link>
              <div><p style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:ink}}>Regulatory Updates</p><p style={{fontSize:11,color:ink3}}>{inds.length?inds.join(' · '):'No industries set'}</p></div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setMode(m=>m==='dark'?'light':'dark')} style={{background:card,border:`0.5px solid ${cardBdr}`,borderRadius:100,padding:'6px 12px',cursor:'pointer',color:ink2,fontSize:12,fontWeight:500,fontFamily:'inherit'}}>{D?'☀︎ Light':'☾ Dark'}</button>
              <Link href="/dashboard/intelligence" style={{fontSize:13,color:ink2,textDecoration:'none',alignSelf:'center'}}>← Intelligence</Link>
            </div>
          </div>

          {inds.length === 0 ? (
            <div style={{ background:card, border:`0.5px solid ${cardBdr}`, borderRadius:18, padding:'40px 28px', textAlign:'center' }}>
              <div style={{fontSize:36,marginBottom:10}}>🎯</div>
              <p style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,color:ink,marginBottom:6}}>Set your industries first</p>
              <p style={{fontSize:13,color:ink2,lineHeight:1.6,maxWidth:340,margin:'0 auto 16px'}}>Regulatory updates filter to your industries. Choose yours to see matched changes.</p>
              <button onClick={()=>router.push('/onboarding?tier=intelligence')} style={{padding:'10px 20px',borderRadius:100,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700,color:'#fff',background:'linear-gradient(135deg,#7c3aed,#bf5af2)'}}>Choose industries →</button>
            </div>
          ) : updates.length === 0 ? (
            <div style={{ background:card, border:`0.5px solid ${cardBdr}`, borderRadius:18, padding:'40px 28px', textAlign:'center' }}>
              <div style={{fontSize:36,marginBottom:10}}>📡</div>
              <p style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,color:ink,marginBottom:6}}>Syncing your updates…</p>
              <p style={{fontSize:13,color:ink2,lineHeight:1.6,maxWidth:360,margin:'0 auto'}}>We&apos;re pulling federal regulatory changes for {inds.join(', ')}. New items land here automatically as they&apos;re published.</p>
            </div>
          ) : updates.map((u,i) => {
            const im = impactMeta(u.impact,D); const isOpen = open===u.id;
            return (
              <div key={u.id||i} onClick={()=>setOpen(isOpen?null:u.id)} style={{ background:card, border:`0.5px solid ${cardBdr}`, borderLeft:`3px solid ${im.color}`, borderRadius:14, padding:'14px 16px', marginBottom:10, cursor:'pointer', animation:`fadeUp 0.3s ease ${Math.min(i,8)*0.04}s both` }}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5,flexWrap:'wrap'}}>
                  <span style={{fontSize:9,fontWeight:700,color:'#fff',background:'#7c3aed',padding:'1px 7px',borderRadius:4}}>{agencyShort(u.agency)}</span>
                  <span style={{fontSize:9,fontWeight:700,color:im.color}}>{im.label}</span>
                </div>
                <p style={{fontSize:14,fontWeight:600,color:ink,lineHeight:1.35}}>{u.title}</p>
                <p style={{fontSize:10,color:ink3,marginTop:4}}>{ago(u.published_at)}{u.industries?.length?' · '+u.industries.slice(0,3).join(', '):''}</p>
                {isOpen && (
                  <div style={{marginTop:10,paddingTop:10,borderTop:`0.5px solid ${cardBdr}`}}>
                    {u.summary && <p style={{fontSize:12.5,color:ink2,lineHeight:1.6,marginBottom:10}}>{u.summary}</p>}
                    {u.source_url && <a href={u.source_url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:12,fontWeight:600,color:D?'#a78bfa':'#7c3aed',textDecoration:'none'}}>Read the official source →</a>}
                  </div>
                )}
              </div>
            );
          })}

          <p style={{fontSize:10,color:ink3,textAlign:'center',marginTop:20,lineHeight:1.7}}>Matched to your industries from official federal sources. Informational, not legal advice.</p>
        </div>
      </div>
    </>
  );
}