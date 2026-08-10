// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const INDUSTRIES = ['E-commerce','Retail','SaaS','Technology','Health & Wellness','Food & Beverage','Manufacturing','Construction','Finance','Professional Services','Logistics','Hospitality','Beauty','Real Estate','Creative & Media','Education','Nonprofit','Import/Export','Something Else'];
const EMP = ['Just me','2–14','15–49','50–99','100+'];
const COUNTRIES = ['China','Vietnam','India','Mexico','EU','Bangladesh','Indonesia','Other'];
const SHIP = ['Under $800','$800–$10k','$10k–$100k','Over $100k'];
const SKILLS = ['Design','Development','Writing','Marketing','Photo/Video','Audio','Business','Consulting','Other'];

// shared bits
const wrap = { minHeight:'100vh', background:'radial-gradient(ellipse 80% 60% at 20% -10%,rgba(255,59,48,0.10) 0%,transparent 60%),#e8eef5', fontFamily:"'DM Sans',system-ui,sans-serif", display:'flex', alignItems:'center', justifyContent:'center', padding:20 };
const card = { width:'min(580px,100%)', background:'rgba(255,255,255,0.72)', backdropFilter:'blur(40px) saturate(180%)', border:'1px solid rgba(255,255,255,0.9)', borderRadius:24, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.12)' };
const input = { width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(0,0,0,0.12)', background:'#fff', fontSize:14, fontFamily:'inherit' };
const primary = (on) => ({ padding:13, borderRadius:100, border:'none', fontSize:15, fontWeight:700, cursor:on?'pointer':'not-allowed', fontFamily:'inherit', background:on?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(0,0,0,0.08)', color:on?'#fff':'rgba(28,28,30,0.3)' });
const back = { padding:'13px 20px', borderRadius:100, border:'1px solid rgba(0,0,0,0.12)', background:'rgba(255,255,255,0.7)', color:'#1c1c1e', fontSize:14, cursor:'pointer', fontFamily:'inherit' };
const label = (t,o) => <p style={{fontSize:11,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'rgba(28,28,30,0.5)',margin:'16px 0 8px'}}>{t}{o&&<span style={{textTransform:'none',letterSpacing:0,fontWeight:400,color:'rgba(28,28,30,0.35)'}}> ({o})</span>}</p>;

function Pills({ items, val, set, multi }) {
  const on = (i) => multi ? val.includes(i) : val === i;
  const toggle = (i) => multi ? set(val.includes(i) ? val.filter(x=>x!==i) : [...val,i]) : set(i);
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
      {items.map(i => (
        <button key={i} onClick={()=>toggle(i)} style={{padding:'8px 14px',borderRadius:100,fontSize:14,fontWeight:on(i)?700:500,cursor:'pointer',border:`1px solid ${on(i)?'#ff3b30':'rgba(0,0,0,0.1)'}`,background:on(i)?'rgba(255,59,48,0.1)':'rgba(255,255,255,0.6)',color:on(i)?'#cc2018':'rgba(28,28,30,0.6)',fontFamily:'inherit'}}>{i}</button>
      ))}
    </div>
  );
}

function Shell({ eyebrow, total, step, title, sub, children }) {
  return (
    <div style={wrap}><div style={card}>
      <div style={{height:3,background:'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2)'}} />
      <div style={{padding:'26px 30px 30px'}}>
        <div style={{height:4,background:'rgba(0,0,0,0.06)',borderRadius:99,marginBottom:16}}><div style={{height:4,width:`${(step/total)*100}%`,background:'#ff3b30',borderRadius:99}} /></div>
        <p style={{fontSize:12,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'#ff3b30',marginBottom:6}}>{eyebrow} · step {step} of {total}</p>
        <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:23,fontWeight:900,letterSpacing:'-1px',color:'#1c1c1e',marginBottom:5}}>{title}</h1>
        <p style={{fontSize:14,color:'rgba(28,28,30,0.55)',lineHeight:1.5,marginBottom:14}}>{sub}</p>
        {children}
      </div>
    </div></div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    first_name:'', skills:[], trade_want:'',
    business_name:'', employee_count:'', customer_type:'',
    industry:'', sub_industry:'', state:'', city:'',
    imports:'', origin_countries:[], avg_shipment_value:'', hts_codes:'',
    ideas:'', growth:[], alert_frequency:'daily',
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));

  useEffect(() => {
    (async () => {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      const { data } = await supabase.from('profiles').select('plan, first_name').eq('id', user.id).single();
      setPlan(data?.plan || 'individual'); if (data?.first_name) set('first_name', data.first_name);
    })();
  }, [router]);

  const saveAndGo = async () => {
  setSaving(true);

  // save EVERYTHING to industry_profiles — full record
  await supabase.from('industry_profiles').upsert({
    user_id: user.id,
    industry: f.industry || null,
    sub_industry: f.sub_industry || null,
    business_name: f.business_name || null,
    employee_count: f.employee_count || null,
    customer_type: f.customer_type || null,
    state: f.state || null,
    city: f.city || null,
    imports: f.imports || null,
    origin_countries: f.origin_countries.length ? f.origin_countries : null,
    avg_shipment_value: f.avg_shipment_value || null,
    hts_codes: f.hts_codes ? f.hts_codes.split(',').map(s => s.trim()).filter(Boolean) : null,
    ideas: f.ideas || null,
    growth_directions: f.growth.length ? f.growth : null,
    alert_frequency: f.alert_frequency || 'daily',
    skills: f.skills.length ? f.skills : null,
    trade_want: f.trade_want || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  // mirror the essentials onto profiles + mark onboarded
  await supabase.from('profiles').update({
    first_name: f.first_name || null,
    business_name: f.business_name || null,
    industry: f.industry || null,
    state: f.state || null,
    onboarded: true,
  }).eq('id', user.id);

  // Verify Stripe session to set plan_status
const params = new URLSearchParams(window.location.search);
const sessionId = params.get('session_id');
if (sessionId) {
  await fetch('/api/verify-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, userId: user.id }),
  });
}
router.replace(plan === 'enterprise' ? '/dashboard/enterprise' : '/dashboard/personal');
};

  if (!plan) return <div style={{position:'fixed',inset:0,background:'#e8eef5'}} />;

  // ---------- INDIVIDUAL: 2 steps ----------
  if (plan !== 'enterprise') {
    if (step === 1) return (
      <Shell eyebrow="Individual" total={2} step={1} title={`Welcome${f.first_name ? `, ${f.first_name}` : ''}! What do you do?`} sub="This is the name other members see on your barter listings.">
        {label('What do you do?')}
        <Pills items={SKILLS} val={f.skills} set={v=>set('skills',v)} multi />
        <div style={{display:'flex',marginTop:22}}>
          <button style={{...primary(f.first_name),flex:1}} disabled={!f.first_name} onClick={()=>setStep(2)}>Next →</button>
        </div>
      </Shell>
    );
    return (
      <Shell eyebrow="Individual" total={2} step={2} title="Anything you're looking to trade?" sub="Optional — helps us match you on the barter board. You can skip and do this later.">
        {label('What you want in return','optional')}
        <input style={input} value={f.trade_want} onChange={e=>set('trade_want',e.target.value)} placeholder="e.g. web development, a logo, copywriting" />
        <div style={{display:'flex',gap:10,marginTop:22}}>
          <button style={back} onClick={()=>setStep(1)}>← Back</button>
          <button style={{...primary(true),flex:1}} disabled={saving} onClick={saveAndGo}>{saving?'Setting up…':'Enter my dashboard →'}</button>
        </div>
      </Shell>
    );
  }

  // ---------- ENTERPRISE: 6 steps ----------
  const T = 6;
  if (step === 1) return (
    <Shell eyebrow="Business" total={T} step={1} title="Tell us about your business" sub="We use this to decide which rules and thresholds actually apply to you.">
      {label('Business name')}<input style={input} value={f.business_name} onChange={e=>set('business_name',e.target.value)} placeholder="Acme Corp" />
      {label('Employee count')}<Pills items={EMP} val={f.employee_count} set={v=>set('employee_count',v)} />
      {label('Who are your customers?')}<Pills items={['Other businesses','Consumers','Both']} val={f.customer_type} set={v=>set('customer_type',v)} />
      <div style={{display:'flex',marginTop:22}}><button style={{...primary(f.business_name),flex:1}} disabled={!f.business_name} onClick={()=>setStep(2)}>Next →</button></div>
    </Shell>
  );
  if (step === 2) return (
    <Shell eyebrow="Business" total={T} step={2} title="What industry are you in?" sub="This decides which agencies and market signals we watch for you.">
      <Pills items={INDUSTRIES} val={f.industry} set={v=>set('industry',v)} />
      {label('What do you actually sell?','optional')}<input style={input} value={f.sub_industry} onChange={e=>set('sub_industry',e.target.value)} placeholder="Organic cotton baby clothes, DTC + Amazon" />
      <div style={{display:'flex',gap:10,marginTop:22}}><button style={back} onClick={()=>setStep(1)}>← Back</button><button style={{...primary(f.industry),flex:1}} disabled={!f.industry} onClick={()=>setStep(3)}>Next →</button></div>
    </Shell>
  );
  if (step === 3) return (
    <Shell eyebrow="Business" total={T} step={3} title="Where are you based?" sub="Federal coverage is live now. State-level monitoring is coming soon — we'll save your location and switch it on automatically.">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div>{label('State')}<input style={input} value={f.state} onChange={e=>set('state',e.target.value)} placeholder="Texas" /></div>
        <div>{label('City')}<input style={input} value={f.city} onChange={e=>set('city',e.target.value)} placeholder="Austin" /></div>
      </div>
      <div style={{display:'flex',gap:10,marginTop:22}}><button style={back} onClick={()=>setStep(2)}>← Back</button><button style={{...primary(true),flex:1}} onClick={()=>setStep(4)}>Next →</button></div>
    </Shell>
  );
  if (step === 4) return (
    <Shell eyebrow="Business" total={T} step={4} title="Do you import goods?" sub="This powers Tariff Intelligence — we alert you when your specific products are affected.">
      {label('Do you bring goods in from other countries?')}<Pills items={['Yes, I import','No imports','A supplier handles it']} val={f.imports} set={v=>set('imports',v)} />
      {f.imports==='Yes, I import' && <>
        {label('Where do they come from?')}<Pills items={COUNTRIES} val={f.origin_countries} set={v=>set('origin_countries',v)} multi />
        {label('Average shipment value')}<Pills items={SHIP} val={f.avg_shipment_value} set={v=>set('avg_shipment_value',v)} />
        {label('HTS codes','optional — makes alerts exact')}<input style={input} value={f.hts_codes} onChange={e=>set('hts_codes',e.target.value)} placeholder="e.g. 6110.20 — or leave blank" />
      </>}
      <div style={{display:'flex',gap:10,marginTop:22}}><button style={back} onClick={()=>setStep(3)}>← Back</button><button style={{...primary(true),flex:1}} onClick={()=>setStep(5)}>{f.imports==='No imports'?'Skip →':'Next →'}</button></div>
    </Shell>
  );
  if (step === 5) return (
    <Shell eyebrow="Business" total={T} step={5} title="What should we watch for you?" sub="We track what people search for and buy, then flag what points at something you could sell.">
      {label('Ideas you\'re sitting on','optional')}<textarea style={{...input,minHeight:70,resize:'vertical'}} value={f.ideas} onChange={e=>set('ideas',e.target.value)} placeholder="A subscription box. A new product line. Selling wholesale." />
      {label('If it worked, where would you grow?')}<Pills items={['Adjacent products','New channel','New customer type','New region','Subscription','Not sure yet']} val={f.growth} set={v=>set('growth',v)} multi />
      <div style={{display:'flex',gap:10,marginTop:22}}><button style={back} onClick={()=>setStep(4)}>← Back</button><button style={{...primary(true),flex:1}} onClick={()=>setStep(6)}>Next →</button></div>
    </Shell>
  );
  return (
    <Shell eyebrow="Business" total={T} step={6} title="How should we alert you?" sub="You can change any of this later in settings.">
      {label('Alert frequency')}<Pills items={['Immediately','Daily digest','Weekly']} val={f.alert_frequency} set={v=>set('alert_frequency',v)} />
      <div style={{display:'flex',gap:10,marginTop:22}}><button style={back} onClick={()=>setStep(5)}>← Back</button><button style={{...primary(true),flex:1}} disabled={saving} onClick={saveAndGo}>{saving?'Setting up…':'Launch my dashboard →'}</button></div>
    </Shell>
  );
}
