// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const IMPACT = {
  high:   { label:'High impact',   color:'#cc2018', bg:'rgba(255,59,48,0.1)' },
  medium: { label:'Medium impact', color:'#b45309', bg:'rgba(255,149,0,0.1)' },
  low:    { label:'Low impact',    color:'#1a7a35', bg:'rgba(48,209,88,0.1)' },
};

export default function RegulatoryPage() {
  const router = useRouter();
  const [industry, setIndustry] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [agency, setAgency] = useState('all');
  const [loading, setLoading] = useState(true);

  // 1. load the user's saved industry
  useEffect(() => {
    const load = async () => {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data } = await supabase.from('industry_profiles').select('industry').eq('user_id', user.id).single();
      setIndustry(data?.industry || null);
      setLoading(false);
    };
    load();
  }, [router]);

  // 2. fetch updates that contain the user's industry in their array
  useEffect(() => {
    if (!industry) return;
    supabase.from('reg_updates').select('*')
      .contains('industries', [industry])          // ← array filter, the key fix
      .order('published_at', { ascending: false })
      .then(({ data }) => setUpdates(data || []));
  }, [industry]);

  const agencies = ['all', ...Array.from(new Set(updates.map(u => u.agency)))];
  const shown = agency === 'all' ? updates : updates.filter(u => u.agency === agency);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{minHeight:'100vh',background:'#e8eef5',fontFamily:"'DM Sans',sans-serif",padding:'28px 24px 80px'}}>
        <div style={{maxWidth:760,margin:'0 auto'}}>

          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <span style={{fontSize:24}}>⚖️</span>
            <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:900,letterSpacing:'-1px',color:'#1c1c1e'}}>Regulatory Updates</h1>
          </div>
          <p style={{fontSize:14,color:'rgba(28,28,30,0.55)',marginBottom:24}}>
            {industry ? <>Showing updates for <strong style={{color:'#1c1c1e'}}>{industry}</strong>.</> : 'Set your industry to see relevant updates.'}
          </p>

          {loading ? (
            <p style={{color:'rgba(28,28,30,0.4)',padding:'40px 0',textAlign:'center'}}>Loading…</p>
          ) : !industry ? (
            <div style={{background:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.9)',borderRadius:20,padding:'40px 24px',textAlign:'center'}}>
              <div style={{fontSize:40,marginBottom:12}}>🧭</div>
              <p style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>Pick your industry first</p>
              <p style={{fontSize:14,color:'rgba(28,28,30,0.55)',marginBottom:18}}>We'll filter regulatory changes down to just your sector.</p>
              <Link href="/onboarding" style={{display:'inline-block',padding:'11px 22px',borderRadius:100,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>Set my industry →</Link>
            </div>
          ) : (
            <>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
                {agencies.map(a => (
                  <button key={a} onClick={()=>setAgency(a)} style={{padding:'6px 14px',borderRadius:100,fontSize:12,fontWeight:agency===a?700:500,cursor:'pointer',border:'1px solid rgba(0,0,0,0.08)',background:agency===a?'#1c1c1e':'rgba(255,255,255,0.6)',color:agency===a?'#fff':'rgba(28,28,30,0.55)',fontFamily:'inherit'}}>{a==='all'?'All agencies':a}</button>
                ))}
              </div>

              {shown.length === 0 ? (
                <div style={{background:'rgba(255,255,255,0.7)',borderRadius:20,padding:'40px 24px',textAlign:'center'}}>
                  <div style={{fontSize:36,marginBottom:10}}>✓</div>
                  <p style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,marginBottom:6}}>Nothing needs you right now</p>
                  <p style={{fontSize:14,color:'rgba(28,28,30,0.55)'}}>We checked — no {agency==='all'?'':agency+' '}updates for {industry} this cycle. We'll alert you when that changes.</p>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {shown.map(u => {
                    const imp = IMPACT[u.impact] || IMPACT.medium;
                    return (
                      <div key={u.id} style={{background:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.9)',borderRadius:18,padding:'18px 20px',boxShadow:'0 4px 16px rgba(0,0,0,0.05)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                          <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:100,background:'rgba(28,28,46,0.06)',color:'rgba(28,28,30,0.6)'}}>{u.agency}</span>
                          <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:100,background:imp.bg,color:imp.color}}>{imp.label}</span>
                          <span style={{fontSize:11,color:'rgba(28,28,30,0.4)',marginLeft:'auto'}}>{new Date(u.published_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                        </div>
                        <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:'#1c1c1e',marginBottom:6,lineHeight:1.3}}>{u.title}</h3>
                        <p style={{fontSize:14,color:'rgba(28,28,30,0.6)',lineHeight:1.6}}>{u.summary}</p>
                        {u.source_url && <a href={u.source_url} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:'#ff3b30',fontWeight:600,textDecoration:'none',display:'inline-block',marginTop:10}}>Read the full ruling →</a>}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}