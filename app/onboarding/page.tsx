'use client';
// @ts-nocheck
// app/onboarding/page.tsx — tier-branched setup, runs AFTER account + payment.
// Reads ?tier= (solutions | intelligence | bundle). Solutions = 1 screen.
// Intelligence/bundle = 4 steps (name+business, country+state, industries[], delivery).
// Writes everything to profiles (single source of truth). No writing-style step (per-update
// explanation handles that later). Access itself is gated by entitlement elsewhere.

import React, { Suspense, useState, useEffect  } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { onboardingKind } from '@/lib/pricing';
import { INDUSTRIES } from '@/lib/cfr-taxonomy';

// INDUSTRIES now comes from the shared taxonomy (maps to CFR categories)
const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const COUNTRIES = ['United States','Canada','United Kingdom','Australia','Other'];
const CHANNELS = [
  { key: 'email', label: 'Email', icon: '\u2709\ufe0f', sub: 'Alerts to your inbox' },
  { key: 'text',  label: 'Text',  icon: '\u{1F4AC}', sub: 'SMS to your phone' },
  { key: 'inapp', label: 'In-app', icon: '\u{1F514}', sub: 'Notifications here' },
];

function GCIcon({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

function OnboardingPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const tier = (sp.get('tier') || 'intelligence');
  const kind = onboardingKind(tier);          // 'solutions' | 'intelligence'
  const isIntel = kind === 'intelligence';
  const accent = tier === 'solutions' ? '#30d158' : tier === 'bundle' ? '#ff3b30' : '#0a84ff';
  const accent2 = tier === 'solutions' ? '#1a7a35' : tier === 'bundle' ? '#ff6b35' : '#378add';

  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ first_name: '', business_name: '', country: 'United States', state: '', industries: [] as string[], delivery_channel: 'email' });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const totalSteps = isIntel ? 4 : 1;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(`/signup`); return; }   // no account → start at signup, not login
      setUser(user);
      setReady(true);
      const { data } = await supabase.from('profiles').select('first_name').eq('id', user.id).single();
      if (data?.first_name) set('first_name', data.first_name);
    })();
  }, [router]);

  // SOLUTIONS AUTO-FORWARD: name/email captured at signup, nothing else to ask → go to the tool.
  useEffect(() => {
    if (!ready || isIntel) return;
    (async () => {
      if (user) await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id);
      router.replace('/dashboard/vault');
    })();
  }, [ready, isIntel, user]);

  const finish = async () => {
    setSaving(true); setError('');
    try {
      const patch: any = {
        first_name: f.first_name || null,
        business_name: f.business_name || null,
        onboarded: true,
      };
      if (isIntel) {
        patch.country = f.country || null;
        patch.state = f.state || null;
        patch.industries = f.industries.length ? f.industries : [];
        patch.delivery_channel = f.delivery_channel || 'email';
      }
      const { error: e } = await supabase.from('profiles').update(patch).eq('id', user.id);
      if (e) throw e;
      // land where the product lives
      router.replace(isIntel ? '/dashboard/intelligence' : '/dashboard/vault');
    } catch (e) { setError(e.message || 'Something went wrong'); setSaving(false); }
  };

  // ---- shared styles ----
  const inp = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1a1a2e', boxSizing: 'border-box' };
  const lbl = { fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,0.5)', display: 'block', marginBottom: 6 };
  const primary = (on = true) => ({ padding: 13, borderRadius: 100, border: 'none', fontSize: 15, fontWeight: 700, cursor: on ? 'pointer' : 'not-allowed', fontFamily: 'inherit', background: on ? `linear-gradient(135deg,${accent},${accent2})` : 'rgba(0,0,0,0.08)', color: on ? '#fff' : 'rgba(26,26,46,0.3)', boxShadow: on ? `0 4px 16px ${accent}55` : 'none' });
  const backBtn = { padding: '13px 18px', borderRadius: 100, border: '0.5px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.7)', color: 'rgba(26,26,46,0.6)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };

  const shell = (eyebrow, title, sub, body, footer) => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif", background: `radial-gradient(ellipse 70% 50% at 15% 5%,${accent}18 0%,transparent 55%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)` }}>
      <div style={{ width: 'min(500px,100%)', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,0.92)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${accent},${accent2})` }} />
        <div style={{ padding: '24px 28px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <GCIcon size={22} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Gratia Core</span>
          </div>
          {isIntel && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {Array.from({ length: totalSteps }).map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: step > i ? accent : 'rgba(0,0,0,0.08)', transition: 'background .3s' }} />)}
            </div>
          )}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent2, marginBottom: 6 }}>{eyebrow}</p>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 21, fontWeight: 900, letterSpacing: '-0.5px', color: '#1a1a2e', marginBottom: 6 }}>{title}</h1>
          <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.55)', lineHeight: 1.6, marginBottom: 20 }}>{sub}</p>
          {body}
          {error && <p style={{ fontSize: 12, color: '#ff3b30', marginTop: 12 }}>{error}</p>}
          <div style={{ marginTop: 20 }}>{footer}</div>
        </div>
      </div>
    </div>
  );

  // hold render until auth confirmed — prevents the flash-then-redirect
  if (!ready) return <div style={{minHeight:'100vh',background:'#f0eff4'}} />;

  // ---- SOLUTIONS: one screen ----
  if (!isIntel) {
    return shell(
      'Solutions · setup',
      "You're in. One quick thing.",
      'Your tools are ready. What should we call you?',
      <>
        <label style={lbl}>First name</label>
        <input value={f.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Grace" style={inp} />
        <div style={{ background: 'rgba(48,209,88,0.06)', border: '0.5px solid rgba(48,209,88,0.18)', borderRadius: 12, padding: '11px 13px', marginTop: 14, fontSize: 12, color: 'rgba(26,26,46,0.6)' }}>✓ Ideas Vault &amp; Barter unlocked</div>
      </>,
      <button onClick={finish} disabled={saving || !f.first_name.trim()} style={{ ...primary(!!f.first_name.trim()), width: '100%' }}>{saving ? 'Setting up…' : 'Enter my tools →'}</button>
    );
  }

  // ---- INTELLIGENCE / BUNDLE: 4 steps ----
  if (step === 1) return shell(
    (tier === 'bundle' ? 'Gratia Core' : 'Intelligence') + ' · setup',
    'Let\u2019s get you set up',
    'First, the basics.',
    <>
      <label style={lbl}>First name</label>
      <input value={f.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Grace" style={{ ...inp, marginBottom: 14 }} />
      <label style={lbl}>Business name</label>
      <input value={f.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Acme Co" style={inp} />
    </>,
    <button onClick={() => setStep(2)} disabled={!f.first_name.trim()} style={{ ...primary(!!f.first_name.trim()), width: '100%' }}>Next →</button>
  );

  if (step === 2) return shell(
    'Location',
    'Where are you based?',
    'Federal coverage is live now — state-level is coming, so we\u2019ll save yours.',
    <>
      <label style={lbl}>Country</label>
      <select value={f.country} onChange={e => set('country', e.target.value)} style={{ ...inp, marginBottom: 14, appearance: 'none' }}>
        {COUNTRIES.map(c => <option key={c}>{c}</option>)}
      </select>
      <label style={lbl}>State {f.country !== 'United States' && <span style={{ fontWeight: 400, color: 'rgba(26,26,46,0.35)' }}>(or region)</span>}</label>
      {f.country === 'United States'
        ? <select value={f.state} onChange={e => set('state', e.target.value)} style={{ ...inp, appearance: 'none' }}><option value="">Select…</option>{US_STATES.map(s => <option key={s}>{s}</option>)}</select>
        : <input value={f.state} onChange={e => set('state', e.target.value)} placeholder="Region" style={inp} />}
    </>,
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => setStep(1)} style={backBtn}>← Back</button>
      <button onClick={() => setStep(3)} disabled={!f.state.trim()} style={{ ...primary(!!f.state.trim()), flex: 1 }}>Next →</button>
    </div>
  );

  if (step === 3) return shell(
    'Industries',
    'What do you work in?',
    'Pick all that apply — you\u2019ll get regulatory and market updates across every one.',
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, maxHeight: 260, overflowY: 'auto' }}>
      {INDUSTRIES.map(ind => {
        const on = f.industries.includes(ind);
        return <button key={ind} onClick={() => set('industries', on ? f.industries.filter(x => x !== ind) : [...f.industries, ind])} style={{ padding: '8px 14px', borderRadius: 100, fontSize: 13, fontWeight: on ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', border: `0.5px solid ${on ? accent : 'rgba(0,0,0,0.1)'}`, background: on ? `${accent}1a` : 'rgba(255,255,255,0.6)', color: on ? accent2 : 'rgba(26,26,46,0.6)' }}>{on ? '✓ ' : ''}{ind}</button>;
      })}
    </div>,
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => setStep(2)} style={backBtn}>← Back</button>
      <button onClick={() => setStep(4)} disabled={f.industries.length === 0} style={{ ...primary(f.industries.length > 0), flex: 1 }}>Next → {f.industries.length > 0 && `(${f.industries.length})`}</button>
    </div>
  );

  return shell(
    'Delivery',
    'How should we reach you?',
    'Where your alerts land. Change it any time in settings.',
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {CHANNELS.map(c => {
        const on = f.delivery_channel === c.key;
        return (
          <button key={c.key} onClick={() => set('delivery_channel', c.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', border: `0.5px solid ${on ? accent : 'rgba(0,0,0,0.08)'}`, background: on ? `${accent}14` : 'rgba(255,255,255,0.6)' }}>
            <span style={{ fontSize: 18 }}>{c.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{c.label}</p>
              <p style={{ fontSize: 11, color: 'rgba(26,26,46,0.5)', margin: 0 }}>{c.sub}</p>
            </div>
            {on && <span style={{ color: accent2, fontWeight: 700 }}>✓</span>}
          </button>
        );
      })}
    </div>,
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => setStep(3)} style={backBtn}>← Back</button>
      <button onClick={finish} disabled={saving} style={{ ...primary(true), flex: 1 }}>{saving ? 'Finishing…' : 'Show my intelligence →'}</button>
    </div>
  );
}


export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f0eff4' }} />}>
      <OnboardingPageInner />
    </Suspense>
  );
}