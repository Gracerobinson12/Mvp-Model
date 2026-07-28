// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const INDUSTRIES = ['E-commerce','Retail','SaaS','Technology','Health & Wellness','Food & Beverage','Manufacturing','Construction','Finance','Professional Services','Logistics','Hospitality','Beauty','Real Estate','Creative & Media','Education','Nonprofit','Import/Export','Something Else'];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState('');
  const [subIndustry, setSubIndustry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return; }
      setUser(data.user);
    });
  }, [router]);

  const finish = async () => {
    if (!industry || !user) return;
    setSaving(true);

    // save industry to the table the module pages read from
    await supabase.from('industry_profiles').upsert({
      user_id: user.id,
      industry,
      sub_industry: subIndustry || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // mirror onto profile + mark onboarded
    await supabase.from('profiles').update({
      industry,
      state: state || null,
      onboarded: true,
    }).eq('id', user.id);

    // route by plan
    const { data: p } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
    router.replace(p?.plan === 'enterprise' ? '/dashboard/enterprise' : '/dashboard/personal');
  };

  const wrap = { minHeight:'100vh', background:'radial-gradient(ellipse 80% 60% at 20% -10%,rgba(255,59,48,0.10) 0%,transparent 60%),#e8eef5', fontFamily:"'DM Sans',system-ui,sans-serif", display:'flex', alignItems:'center', justifyContent:'center', padding:20 };
  const card = { width:'min(560px,100%)', background:'rgba(255,255,255,0.72)', backdropFilter:'blur(40px) saturate(180%)', border:'1px solid rgba(255,255,255,0.9)', borderRadius:24, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.12)' };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={wrap}>
        <div style={card}>
          <div style={{height:3,background:'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2)'}} />
          <div style={{padding:'28px 30px 30px'}}>

            <p style={{fontSize:12,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'#ff3b30',marginBottom:6}}>Step {step} of 2 · quick setup</p>

            {step === 1 && (
              <>
                <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:24,fontWeight:900,letterSpacing:'-1px',color:'#1c1c1e',marginBottom:6}}>What industry are you in?</h1>
                <p style={{fontSize:14,color:'rgba(28,28,30,0.55)',lineHeight:1.5,marginBottom:20}}>We use this to show you only the regulatory updates and market signals that actually apply to your business.</p>

                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
                  {INDUSTRIES.map(ind => {
                    const on = industry === ind;
                    return (
                      <button key={ind} onClick={() => setIndustry(ind)} style={{
                        padding:'9px 15px', borderRadius:100, fontSize:14, fontWeight:on?700:500, cursor:'pointer',
                        border:`1px solid ${on?'#ff3b30':'rgba(0,0,0,0.1)'}`,
                        background:on?'rgba(255,59,48,0.1)':'rgba(255,255,255,0.6)',
                        color:on?'#cc2018':'rgba(28,28,30,0.6)', fontFamily:'inherit',
                      }}>{ind}</button>
                    );
                  })}
                </div>

                <input value={subIndustry} onChange={e=>setSubIndustry(e.target.value)} placeholder="What do you sell / do? (optional — e.g. DTC supplements)" style={{width:'100%',padding:'12px 14px',borderRadius:12,border:'1px solid rgba(0,0,0,0.12)',background:'#fff',fontSize:14,marginBottom:20,fontFamily:'inherit'}} />

                <button disabled={!industry} onClick={()=>setStep(2)} style={{width:'100%',padding:13,borderRadius:100,border:'none',fontSize:15,fontWeight:700,cursor:industry?'pointer':'not-allowed',fontFamily:'inherit',background:industry?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(0,0,0,0.08)',color:industry?'#fff':'rgba(28,28,30,0.3)'}}>Next →</button>
              </>
            )}

            {step === 2 && (
              <>
                <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:24,fontWeight:900,letterSpacing:'-1px',color:'#1c1c1e',marginBottom:6}}>Where are you based?</h1>
                <p style={{fontSize:14,color:'rgba(28,28,30,0.55)',lineHeight:1.5,marginBottom:20}}>Federal coverage is live now. State-level monitoring is coming soon — we'll save your location and switch it on automatically.</p>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
                  <input value={state} onChange={e=>setState(e.target.value)} placeholder="State" style={{padding:'12px 14px',borderRadius:12,border:'1px solid rgba(0,0,0,0.12)',background:'#fff',fontSize:14,fontFamily:'inherit'}} />
                  <input value={city} onChange={e=>setCity(e.target.value)} placeholder="City" style={{padding:'12px 14px',borderRadius:12,border:'1px solid rgba(0,0,0,0.12)',background:'#fff',fontSize:14,fontFamily:'inherit'}} />
                </div>

                <div style={{display:'flex',gap:10}}>
                  <button onClick={()=>setStep(1)} style={{padding:'13px 20px',borderRadius:100,border:'1px solid rgba(0,0,0,0.12)',background:'rgba(255,255,255,0.7)',color:'#1c1c1e',fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>← Back</button>
                  <button disabled={saving} onClick={finish} style={{flex:1,padding:13,borderRadius:100,border:'none',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff'}}>{saving?'Setting up…':'Enter my dashboard →'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}