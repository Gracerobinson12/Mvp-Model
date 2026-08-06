// @ts-nocheck
/* eslint-disable */
'use client';

/**
 * app/onboarding/enterprise/page.tsx
 * Enterprise plan onboarding — 6 steps, ~3 minutes
 * Saves to industry_profiles + profiles tables
 * Redirects to /dashboard/enterprise after completion
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const INDUSTRIES = ['E-commerce','SaaS / Tech','Health & Wellness','Food & Beverage','Import / Export','Manufacturing','Finance','Real Estate','Beauty / Cosmetics','Legal','Education','Other'];
const BIZ_TYPES  = ['LLC','Corporation','Sole Proprietor','Partnership','Non-profit'];
const EMP_COUNTS = ['1–10','11–50','51–250','250+'];
const REV_RANGES = ['Under $500k','$500k–$5M','$5M–$50M','$50M+'];
const AGENCIES   = ['FTC','FDA','OSHA','CBP','SEC','EPA','CFPB','State AG'];
const COUNTRIES  = ['China','Vietnam','India','Mexico','EU','Bangladesh','Indonesia','Other'];
const CATEGORIES = ['Electronics','Apparel / Textiles','Food / Beverage','Chemicals','Machinery','Furniture','Cosmetics','Other'];
const SHIP_VALS  = ['Under $800','$800–$10k','$10k–$100k','Over $100k'];
const SEGMENTS   = ['Budget','Mid-market','Premium','Luxury'];
const CHANNELS   = ['DTC / Website','Amazon','Wholesale','Retail stores','B2B direct','Marketplaces'];
const CUSTOMERS  = ['Gen Z','Millennials','Gen X','Boomers','SMBs','Enterprise'];
const COMP_MODES = [
  { key: 'none',  name: 'None',  desc: 'Standard protection' },
  { key: 'hipaa', name: 'HIPAA', desc: 'Health data rules' },
  { key: 'soc2',  name: 'SOC 2', desc: 'Enterprise audit trail' },
  { key: 'gdpr',  name: 'GDPR',  desc: 'EU data protection' },
];
const FREQ_OPTIONS = [
  { key: 'immediately', icon: '⚡', label: 'Immediately', sub: 'High impact only' },
  { key: 'daily',       icon: '📋', label: 'Daily digest', sub: '9am every day'  },
  { key: 'weekly',      icon: '🗓',  label: 'Weekly',      sub: 'Monday 9am'      },
];

export default function EnterpriseOnboarding() {
  const router = useRouter();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [user,    setUser]    = useState(null);
  const total = 6;

  // Step 1
  const [companyName, setCompanyName] = useState('');
  const [bizType,     setBizType]     = useState('');
  const [empCount,    setEmpCount]    = useState('');
  const [revenue,     setRevenue]     = useState('');
  const [bizModel,    setBizModel]    = useState('');

  // Step 2
  const [state,       setState]       = useState('');
  const [county,      setCounty]      = useState('');
  const [city,        setCity]        = useState('');
  const [multiState,  setMultiState]  = useState(false);

  // Step 3
  const [industries,  setIndustries]  = useState([]);
  const [subIndustry, setSubIndustry] = useState('');
  const [keywords,    setKeywords]    = useState([]);
  const [kwInput,     setKwInput]     = useState('');
  const [agencies,    setAgencies]    = useState(['FTC','CBP']);

  // Step 4
  const [imports,      setImports]      = useState(null);
  const [countries,    setCountries]    = useState([]);
  const [productCats,  setProductCats]  = useState([]);
  const [shipVal,      setShipVal]      = useState('');
  const [htsCodes,     setHtsCodes]     = useState('');

  // Step 5
  const [segment,      setSegment]      = useState('');
  const [channels,     setChannels]     = useState([]);
  const [competitors,  setCompetitors]  = useState([]);
  const [compInput,    setCompInput]    = useState('');
  const [targetCust,   setTargetCust]   = useState('');

  // Step 6
  const [alertFreq,    setAlertFreq]    = useState('daily');
  const [redactNames,  setRedactNames]  = useState(true);
  const [redactFin,    setRedactFin]    = useState(true);
  const [redactPII,    setRedactPII]    = useState(true);
  const [compMode,     setCompMode]     = useState('none');
  const [customTerms,  setCustomTerms]  = useState([]);
  const [termInput,    setTermInput]    = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUser(user);
      const { data: profile } = await supabase
        .from('industry_profiles')
        .select('onboarding_complete')
        .eq('user_id', user.id)
        .single();
      if (profile?.onboarding_complete) router.push('/dashboard/enterprise');
    };
    init();
  }, [router]);

  const progress = Math.round(((step + 1) / total) * 100);

  const toggle = (arr, setArr, val) => setArr(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);

  const addTag = (input, setInput, tags, setTags, max = 10) => {
    if (input.trim() && tags.length < max) {
      setTags(p => [...p, input.trim()]);
      setInput('');
    }
  };

  const save = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (companyName) {
        await supabase.from('profiles').update({ company_name: companyName }).eq('id', user.id);
      }
      await supabase.from('industry_profiles').upsert({
        user_id: user.id,
        industry: industries.join(', '),
        sub_industry: subIndustry,
        state, county, city,
        employee_count: empCount,
        business_type: bizType,
        revenue_range: revenue,
        agencies,
        alert_frequency: alertFreq,
        alert_high_immediate: alertFreq === 'immediately',
        imports_goods: imports === true,
        origin_countries: countries,
        product_categories: productCats,
        hts_codes: htsCodes ? htsCodes.split(',').map(s => s.trim()) : [],
        avg_shipment_value: shipVal,
        market_segment: segment,
        sales_channels: channels,
        target_customer: targetCust,
        competitor_names: competitors,
        redact_client_names: redactNames,
        redact_financials: redactFin,
        redact_personal: redactPII,
        custom_redact_terms: customTerms,
        compliance_mode: compMode,
        multi_state: multiState,
        onboarding_complete: true,
      }, { onConflict: 'user_id' });

      router.push('/dashboard/enterprise');
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  // ── Design tokens ──
  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 12, marginBottom: 10,
    background: 'linear-gradient(180deg,rgba(255,255,255,0.75) 0%,rgba(255,255,255,0.6) 100%)',
    border: '1px solid rgba(255,255,255,0.92)',
    boxShadow: '0 1px 0 rgba(255,255,255,1) inset,0 2px 8px rgba(0,0,0,0.06)',
    fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: '#1c1c1e', outline: 'none',
  };
  const chip = (active) => ({
    padding: '6px 13px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: '0.5px solid', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s',
    background: active ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(255,255,255,0.6)',
    borderColor: active ? 'rgba(255,59,48,0.4)' : 'rgba(255,255,255,0.85)',
    color: active ? '#fff' : 'rgba(28,28,30,0.55)',
    boxShadow: active ? '0 4px 10px rgba(255,59,48,0.25)' : '0 1px 0 rgba(255,255,255,0.9) inset',
  });
  const lbl = { fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'rgba(28,28,30,0.4)', marginBottom: 6, display: 'block' };
  const toggleSwitch = (on, toggle) => (
    <div onClick={toggle} style={{ width: 38, height: 22, borderRadius: 100, background: on ? '#30d158' : 'rgba(28,28,46,0.15)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15) inset' }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </div>
  );
  const toggleRow = (label, sub, on, setOn) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'linear-gradient(180deg,rgba(255,255,255,0.65) 0%,rgba(255,255,255,0.5) 100%)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 12, marginBottom: 7, boxShadow: '0 1px 0 rgba(255,255,255,1) inset' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'rgba(28,28,30,0.45)', margin: 0 }}>{sub}</p>
      </div>
      {toggleSwitch(on, () => setOn(!on))}
    </div>
  );
  const nav = (onBack, onNext, nextLabel = 'Next →', canSkip = false, onSkip = null) => (
    <>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={onBack} style={{ padding: '13px 18px', borderRadius: 100, border: '0.5px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.55)', color: 'rgba(28,28,30,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
        <button onClick={onNext} style={{ flex: 1, padding: 13, borderRadius: 100, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(255,59,48,0.3)' }}>{nextLabel}</button>
      </div>
      {canSkip && <p onClick={onSkip} style={{ textAlign: 'center', fontSize: 12, color: 'rgba(28,28,30,0.38)', cursor: 'pointer', paddingTop: 10 }}>Skip for now</p>}
    </>
  );
  const tagWrap = (tags, setTags, input, setInput, placeholder, max = 10, color = '#ff3b30', bg = 'rgba(255,59,48,0.08)', border = 'rgba(255,59,48,0.2)') => (
    <div style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.7) 0%,rgba(255,255,255,0.55) 100%)', border: '1px solid rgba(255,255,255,0.92)', borderRadius: 12, padding: '9px 10px', marginBottom: 10, minHeight: 44, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', boxShadow: '0 1px 0 rgba(255,255,255,1) inset' }}>
      {tags.map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: bg, border: `0.5px solid ${border}`, borderRadius: 100, padding: '3px 9px', fontSize: 11, fontWeight: 600, color }}>
          {t} <span onClick={() => setTags(p => p.filter((_, j) => j !== i))} style={{ cursor: 'pointer', opacity: 0.5 }}>✕</span>
        </div>
      ))}
      {tags.length < max && (
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input, setInput, tags, setTags, max); } }} placeholder={placeholder} style={{ border: 'none', background: 'transparent', fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: '#1c1c1e', outline: 'none', minWidth: 80 }} />
      )}
    </div>
  );

  const DOTS = Array.from({ length: total }, (_, i) => i);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
        @keyframes rb{to{background-position:200% center;}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='rgba(28,28,30,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.4);border-radius:2px;}
      `}</style>

      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 65% 55% at 8% -8%,rgba(255,59,48,0.5) 0%,transparent 52%),radial-gradient(ellipse 55% 45% at 94% 108%,rgba(10,132,255,0.42) 0%,transparent 52%),radial-gradient(ellipse 35% 30% at 50% 50%,rgba(255,149,0,0.18) 0%,transparent 50%),#dde4f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '28px 20px 40px', fontFamily: "'DM Sans',sans-serif" }}>

        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(28,28,30,0.45)', marginBottom: 12 }}>Step {step + 1} of {total} · Takes about 3 minutes</p>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
          {DOTS.map(i => (
            <div key={i} style={{ height: 7, borderRadius: 4, width: i === step ? 20 : 7, background: i < step ? '#ff3b30' : i === step ? '#ff3b30' : 'rgba(28,28,46,0.12)', boxShadow: i === step ? '0 0 8px rgba(255,59,48,0.4)' : 'none', transition: 'all 0.3s' }} />
          ))}
        </div>

        {/* Card */}
        <div style={{ width: '100%', maxWidth: 500, background: 'linear-gradient(160deg,rgba(255,255,255,0.76) 0%,rgba(255,255,255,0.60) 100%)', border: '1px solid rgba(255,255,255,0.92)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 0 rgba(255,255,255,1) inset,0 20px 60px rgba(0,0,0,0.12)', animation: 'fadeUp 0.3s ease' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#34aadc,#ff3b30)', backgroundSize: '200% auto', animation: 'rb 3s linear infinite' }} />
          <div style={{ height: 3, background: 'rgba(28,28,46,0.08)' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#ff3b30,#ff6b35)', borderRadius: '0 2px 2px 0', boxShadow: '0 0 8px rgba(255,59,48,0.4)', transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>

          <div style={{ padding: '20px 22px 24px', maxHeight: '75vh', overflowY: 'auto' }}>

            {/* ── STEP 1: Business basics ── */}
            {step === 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 4 }}>Step 1 · Business basics</p>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.6px', marginBottom: 4 }}>Tell us about your business</h1>
                <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)', lineHeight: 1.6, marginBottom: 18 }}>Used to personalise your regulatory, Shield, and tariff settings.</p>

                <label style={lbl}>Company name</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Corp" style={inp} />

                <label style={lbl}>Business type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {BIZ_TYPES.map(t => <button key={t} onClick={() => setBizType(t)} style={chip(bizType === t)}>{t}</button>)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Employee count</label>
                    <select value={empCount} onChange={e => setEmpCount(e.target.value)} style={{ ...inp, marginBottom: 0 }}>
                      <option value=''>Select…</option>
                      {EMP_COUNTS.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Revenue range</label>
                    <select value={revenue} onChange={e => setRevenue(e.target.value)} style={{ ...inp, marginBottom: 0 }}>
                      <option value=''>Select…</option>
                      {REV_RANGES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <label style={{ ...lbl, marginTop: 12 }}>B2B or B2C?</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {['B2B','B2C','Both'].map(m => <button key={m} onClick={() => setBizModel(m)} style={chip(bizModel === m)}>{m}</button>)}
                </div>

                <button onClick={() => setStep(1)} style={{ width: '100%', padding: 13, borderRadius: 100, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(255,59,48,0.32)' }}>Next →</button>
              </>
            )}

            {/* ── STEP 2: Location ── */}
            {step === 1 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 4 }}>Step 2 · Location</p>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.6px', marginBottom: 4 }}>Where is your business?</h1>
                <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)', lineHeight: 1.6, marginBottom: 16 }}>State determines which regulations apply to you.</p>

                <div style={{ background: 'rgba(10,132,255,0.06)', border: '0.5px solid rgba(10,132,255,0.18)', borderRadius: 10, padding: '9px 12px', marginBottom: 14, fontSize: 11, color: 'rgba(28,28,30,0.55)', lineHeight: 1.6, boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset' }}>
                  <strong style={{ color: '#0a84ff' }}>Federal coverage live now.</strong> State and county regulations coming soon — we'll email you when your state goes live.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>State</label>
                    <select value={state} onChange={e => setState(e.target.value)} style={{ ...inp, marginBottom: 0 }}>
                      <option value=''>Select…</option>
                      {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>City</label>
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="Austin" style={{ ...inp, marginBottom: 0 }} />
                  </div>
                </div>

                <label style={{ ...lbl, marginTop: 12 }}>County <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(28,28,30,0.3)' }}>(optional — for when county coverage launches)</span></label>
                <input value={county} onChange={e => setCounty(e.target.value)} placeholder="Travis County" style={inp} />

                <label style={lbl}>Do you operate in multiple states?</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {[['Yes','true'],['No — one state only','false']].map(([label, val]) => (
                    <button key={val} onClick={() => setMultiState(val === 'true')} style={chip(multiState === (val === 'true'))}>{label}</button>
                  ))}
                </div>

                {nav(() => setStep(0), () => setStep(2))}
              </>
            )}

            {/* ── STEP 3: Industry ── */}
            {step === 2 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 4 }}>Step 3 · Industry</p>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.6px', marginBottom: 4 }}>What industry are you in?</h1>
                <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)', lineHeight: 1.6, marginBottom: 16 }}>Filters regulatory updates and market signals to what applies to your business.</p>

                <label style={lbl}>Primary industry</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {INDUSTRIES.map(ind => <button key={ind} onClick={() => toggle(industries, setIndustries, ind)} style={chip(industries.includes(ind))}>{ind}</button>)}
                </div>

                <label style={lbl}>Sub-industry / niche <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(28,28,30,0.3)' }}>(optional)</span></label>
                <input value={subIndustry} onChange={e => setSubIndustry(e.target.value)} placeholder="e.g. DTC supplements, B2B HR SaaS, luxury fashion import…" style={inp} />

                <label style={lbl}>Agencies to watch</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {AGENCIES.map(a => <button key={a} onClick={() => toggle(agencies, setAgencies, a)} style={chip(agencies.includes(a))}>{a}</button>)}
                </div>

                <label style={lbl}>Custom keywords to track <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(28,28,30,0.3)' }}>(optional)</span></label>
                {tagWrap(keywords, setKeywords, kwInput, setKwInput, 'Type keyword + Enter…')}

                {nav(() => setStep(1), () => setStep(3))}
              </>
            )}

            {/* ── STEP 4: Import / Export ── */}
            {step === 3 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 4 }}>Step 4 · Import / Export</p>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.6px', marginBottom: 4 }}>Do you import goods?</h1>
                <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)', lineHeight: 1.6, marginBottom: 16 }}>Powers Tariff Intelligence — we alert you when your specific products are affected.</p>

                <label style={lbl}>Do you import goods from other countries?</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {[['Yes, I import', true],['No imports', false]].map(([label, val]) => (
                    <button key={String(val)} onClick={() => setImports(val as boolean)} style={chip(imports === val)}>{label as string}</button>
                  ))}
                </div>

                {imports === true && (
                  <>
                    <label style={lbl}>Origin countries</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {COUNTRIES.map(c => <button key={c} onClick={() => toggle(countries, setCountries, c)} style={chip(countries.includes(c))}>{c}</button>)}
                    </div>

                    <label style={lbl}>Product categories</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {CATEGORIES.map(c => <button key={c} onClick={() => toggle(productCats, setProductCats, c)} style={chip(productCats.includes(c))}>{c}</button>)}
                    </div>

                    <label style={lbl}>Average shipment value</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {SHIP_VALS.map(v => <button key={v} onClick={() => setShipVal(v)} style={chip(shipVal === v)}>{v}</button>)}
                    </div>

                    <label style={lbl}>HTS codes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(28,28,30,0.3)' }}>(optional — makes alerts exact)</span></label>
                    <input value={htsCodes} onChange={e => setHtsCodes(e.target.value)} placeholder="e.g. 6110.20, 8471.30 — or leave blank" style={inp} />
                  </>
                )}

                {nav(() => setStep(2), () => setStep(4), 'Next →', true, () => setStep(4))}
              </>
            )}

            {/* ── STEP 5: Market intel ── */}
            {step === 4 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 4 }}>Step 5 · Market intel</p>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.6px', marginBottom: 4 }}>Who are your competitors?</h1>
                <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)', lineHeight: 1.6, marginBottom: 16 }}>We track competitor moves, pricing shifts, and demand signals in your market.</p>

                <label style={lbl}>Market segment</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {SEGMENTS.map(s => <button key={s} onClick={() => setSegment(s)} style={chip(segment === s)}>{s}</button>)}
                </div>

                <label style={lbl}>Sales channels</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {CHANNELS.map(c => <button key={c} onClick={() => toggle(channels, setChannels, c)} style={chip(channels.includes(c))}>{c}</button>)}
                </div>

                <label style={lbl}>Competitor names <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(28,28,30,0.3)' }}>(up to 5)</span></label>
                {tagWrap(competitors, setCompetitors, compInput, setCompInput, 'Type name + Enter…', 5)}

                <label style={lbl}>Target customer</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {CUSTOMERS.map(c => <button key={c} onClick={() => setTargetCust(c)} style={chip(targetCust === c)}>{c}</button>)}
                </div>

                {nav(() => setStep(3), () => setStep(5), 'Next →', true, () => setStep(5))}
              </>
            )}

            {/* ── STEP 6: Alerts + Shield ── */}
            {step === 5 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 4 }}>Step 6 · Alerts + Shield</p>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.6px', marginBottom: 4 }}>How should we alert you?</h1>
                <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)', lineHeight: 1.6, marginBottom: 16 }}>Set notification preferences and Shield data protection settings.</p>

                <label style={lbl}>Alert frequency</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
                  {FREQ_OPTIONS.map(f => {
                    const active = alertFreq === f.key;
                    return (
                      <div key={f.key} onClick={() => setAlertFreq(f.key)} style={{ padding: 10, borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: active ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(255,255,255,0.6)', border: `1px solid ${active ? 'rgba(255,59,48,0.4)' : 'rgba(255,255,255,0.85)'}`, boxShadow: active ? '0 4px 10px rgba(255,59,48,0.25),0 1px 0 rgba(255,255,255,0.2) inset' : '0 1px 0 rgba(255,255,255,0.9) inset', transition: 'all 0.15s' }}>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: active ? '#fff' : 'rgba(28,28,30,0.6)' }}>{f.label}</p>
                        <p style={{ fontSize: 9, color: active ? 'rgba(255,255,255,0.65)' : 'rgba(28,28,30,0.38)' }}>{f.sub}</p>
                      </div>
                    );
                  })}
                </div>

                <div style={{ height: '0.5px', background: 'linear-gradient(90deg,rgba(255,255,255,0.1),rgba(255,255,255,0.85),rgba(255,255,255,0.1))', margin: '4px 0 14px' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e', margin: 0 }}>🛡️ Shield protection</p>
                    <p style={{ fontSize: 11, color: 'rgba(28,28,30,0.45)', margin: 0 }}>Auto-redact before AI prompts leave your team</p>
                  </div>
                </div>

                {toggleRow('Redact client names', 'Replaces real names with [CLIENT]', redactNames, setRedactNames)}
                {toggleRow('Redact financials', 'Account numbers, invoice amounts', redactFin, setRedactFin)}
                {toggleRow('Redact personal info', 'Emails, addresses, phone numbers (PII)', redactPII, setRedactPII)}

                <label style={{ ...lbl, marginTop: 10 }}>Compliance mode</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                  {COMP_MODES.map(m => {
                    const active = compMode === m.key;
                    return (
                      <div key={m.key} onClick={() => setCompMode(m.key)} style={{ padding: '11px 12px', borderRadius: 12, border: `1px solid ${active ? 'rgba(255,59,48,0.3)' : 'rgba(255,255,255,0.85)'}`, cursor: 'pointer', background: active ? 'rgba(255,59,48,0.06)' : 'rgba(255,255,255,0.55)', boxShadow: active ? '0 1px 0 rgba(255,255,255,0.8) inset,0 0 0 1.5px rgba(255,59,48,0.15)' : '0 1px 0 rgba(255,255,255,1) inset', transition: 'all 0.15s' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e', margin: 0 }}>{m.name}</p>
                        <p style={{ fontSize: 10, color: 'rgba(28,28,30,0.45)', margin: '2px 0 0' }}>{m.desc}</p>
                      </div>
                    );
                  })}
                </div>

                <label style={lbl}>Custom terms to always redact <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(28,28,30,0.3)' }}>(up to 10)</span></label>
                {tagWrap(customTerms, setCustomTerms, termInput, setTermInput, 'Type term + Enter…')}

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={() => setStep(4)} style={{ padding: '13px 18px', borderRadius: 100, border: '0.5px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.55)', color: 'rgba(28,28,30,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                  <button onClick={save} disabled={loading} style={{ flex: 1, padding: 13, borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(48,209,88,0.32)', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Setting up…' : 'Launch my dashboard →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(28,28,30,0.3)', marginTop: 20 }}>
          © 2026 Gratia Core · <a href="/privacy" style={{ color: 'rgba(28,28,30,0.3)' }}>Privacy</a> · <a href="/terms" style={{ color: 'rgba(28,28,30,0.3)' }}>Terms</a>
        </p>
      </div>
    </>
  );
}