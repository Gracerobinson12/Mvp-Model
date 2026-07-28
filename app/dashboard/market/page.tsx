// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const DIR = {
  up:      { icon:'↑', color:'#1a7a35', bg:'rgba(48,209,88,0.1)' },
  down:    { icon:'↓', color:'#cc2018', bg:'rgba(255,59,48,0.1)' },
  neutral: { icon:'→', color:'#0a84ff', bg:'rgba(10,132,255,0.1)' },
};

export default function MarketPage() {
  const router = useRouter();
  const [industry, setIndustry] = useState(null);
  const [signals, setSignals] = useState([]);
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!industry) return;
    supabase.from('market_signals').select('*')
      .eq('industry', industry)                    // single text — .eq is correct
      .order('created_at', { ascending: false })   // ← was published_at (didn't exist)
      .then(({ data }) => setSignals(data || []));
  }, [industry]);

  const types = ['all', ...Array.from(new Set(signals.map(s => s.signal_type)))];
  const shown = type === 'all' ? signals : signals.filter(s => s.signal_type === type);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{minHeight:'100vh',background:'#e8eef5',fontFamily:"'DM Sans',sans-serif",padding:'28px 24px 80px'}}>
        <div style={{maxWidth:760,margin:'0 auto'}}>

          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <span style={{fontSize:24}}>📈</span>
            <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:900,letterSpacing:'-1px',color:'#1c1c1e'}}>Market Intelligence</h1>
          </div>
          <p style={{fontSize:14,color:'rgba(28,28,30,0.55)',marginBottom:24}}>
            {industry ? <>Signals for <strong style={{color:'#1c1c1e'}}>{industry}</strong>.</> : 'Set your industry to see market signals.'}
          </p>

          {loading ? (
            <p style={{color:'rgba(28,28,30,0.4)',padding:'40px 0',textAlign:'center'}}>Loading…</p>
          ) : !industry ? (
            <div style={{background:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.9)',borderRadius:20,padding:'40px 24px',textAlign:'center'}}>
              <div style={{fontSize:40,marginBottom:12}}>🧭</div>
              <p style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>Pick your industry first</p>
              <p style={{fontSize:14,color:'rgba(28,28,30,0.55)',marginBottom:18}}>We'll surface demand signals and trends for your market.</p>
              <Link href="/onboarding" style={{display:'inline-block',padding:'11px 22px',borderRadius:100,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>Set my industry →</Link>
            </div>
          ) : (
            <>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
                {types.map(t => (
                  <button key={t} onClick={()=>setType(t)} style={{padding:'6px 14px',borderRadius:100,fontSize:12,fontWeight:type===t?700:500,cursor:'pointer',border:'1px solid rgba(0,0,0,0.08)',background:type===t?'#1c1c1e':'rgba(255,255,255,0.6)',color:type===t?'#fff':'rgba(28,28,30,0.55)',fontFamily:'inherit'}}>{t==='all'?'All signals':t}</button>
                ))}
              </div>

              {shown.length === 0 ? (
                <div style={{background:'rgba(255,255,255,0.7)',borderRadius:20,padding:'40px 24px',textAlign:'center'}}>
                  <div style={{fontSize:36,marginBottom:10}}>📊</div>
                  <p style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,marginBottom:6}}>No signals this week</p>
                  <p style={{fontSize:14,color:'rgba(28,28,30,0.55)'}}>We're watching {industry}. New signals appear here as they surface.</p>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {shown.map(s => {
                    const d = DIR[s.direction] || DIR.neutral;
                    return (
                      <div key={s.id} style={{background:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.9)',borderRadius:18,padding:'18px 20px',boxShadow:'0 4px 16px rgba(0,0,0,0.05)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                          <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:100,background:'rgba(28,28,46,0.06)',color:'rgba(28,28,30,0.6)'}}>{s.signal_type}</span>
                          <span style={{fontSize:13,fontWeight:800,padding:'2px 10px',borderRadius:100,background:d.bg,color:d.color}}>{d.icon}</span>
                        </div>
                        <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:'#1c1c1e',marginBottom:6,lineHeight:1.3}}>{s.title}</h3>
                        <p style={{fontSize:14,color:'rgba(28,28,30,0.6)',lineHeight:1.6}}>{s.summary}</p>
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