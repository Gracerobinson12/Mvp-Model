'use client';

// app/advisory/page.tsx — public Advisory intake. No login. Saves a lead + (optionally) emails you.

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const STAGES = [
  { key: 'brainstorming', label: 'Brainstorming', icon: '\u{1F4A1}', sub: 'An idea, not built yet' },
  { key: 'midway',        label: 'Midway',        icon: '\u{1F680}', sub: 'Building it now' },
  { key: 'live',          label: 'Live, want more',icon: '\u{1F3C1}', sub: 'Up and running' },
];
const CONTACT = [
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'text',  label: 'Text' },
];

function GCIcon({ size = 26 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

export default function AdvisoryPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [business, setBusiness] = useState('');
  const [stage, setStage] = useState('');
  const [details, setDetails] = useState('');
  const [contactPref, setContactPref] = useState('email');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState(''); // honeypot (spam trap) — must stay empty
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const needsPhone = contactPref === 'phone' || contactPref === 'text';
  const valid = firstName.trim() && email.includes('@') && stage && details.trim() && (!needsPhone || phone.trim());

  const submit = async () => {
    if (company) return; // bot filled the honeypot — silently drop
    if (!firstName.trim()) { setError('Enter your first name.'); return; }
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    if (!stage) { setError('Pick the stage you\u2019re at.'); return; }
    if (!details.trim()) { setError('Tell us what you need.'); return; }
    if (needsPhone && !phone.trim()) { setError('Add a phone number so we can reach you.'); return; }
    setLoading(true); setError('');

    const lead = {
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      email: email.trim().toLowerCase(),
      business: business.trim() || null,
      stage,
      details: details.trim(),
      contact_pref: contactPref,
      phone: phone.trim() || null,
    };

    try {
      // Try the API route first (saves + emails you). Falls back to a direct insert if the route isn't up yet.
      const res = await fetch('/api/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      }).catch(() => null);

      if (!res || !res.ok) {
        const { error: dbErr } = await supabase.from('advisory_leads').insert(lead);
        if (dbErr) throw dbErr;
      }
      setSent(true);
    } catch {
      setError('Something went wrong. Email us at hello@gratiacore.com');
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: 'rgba(120,120,128,0.08)', border: '0.5px solid rgba(0,0,0,0.1)', color: '#1a1a2e', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,0.5)', display: 'block', marginBottom: 5 };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes rainbowShift{to{background-position:200% center;}}
        @keyframes meshFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(4%,6%) scale(1.08); } }
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.09) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.07) 0%,transparent 50%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)', fontFamily: "'DM Sans',sans-serif", padding: '24px 20px 60px' }}>

        <div style={{ maxWidth: 480, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <GCIcon size={24} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Gratia Core</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(26,26,46,0.5)', textDecoration: 'none' }}>&larr; Home</Link>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,0.92)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', animation: 'fadeUp 0.4s ease' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowShift 3s linear infinite' }} />

          {!sent ? (
            <div style={{ padding: '24px 26px 26px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#cc2018', marginBottom: 6 }}>Advisory</p>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', color: '#1a1a2e', marginBottom: 6 }}>Tell us the problem.</h1>
              <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.55)', lineHeight: 1.6, marginBottom: 20 }}>A few details and we&apos;ll be in touch. We help you figure out what to do &mdash; then build it.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div><label style={lbl}>First name</label><input value={firstName} onChange={e => { setFirstName(e.target.value); setError(''); }} placeholder="Jordan" style={inp} /></div>
                <div><label style={lbl}>Last name <span style={{ color: 'rgba(26,26,46,0.3)', fontWeight: 400 }}>(optional)</span></label><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Lee" style={inp} /></div>
              </div>

              <div style={{ marginBottom: 12 }}><label style={lbl}>Email</label><input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="jordan@company.com" style={inp} /></div>
              <div style={{ marginBottom: 16 }}><label style={lbl}>Business <span style={{ color: 'rgba(26,26,46,0.3)', fontWeight: 400 }}>(optional)</span></label><input value={business} onChange={e => setBusiness(e.target.value)} placeholder="Acme Co" style={inp} /></div>

              {/* honeypot: hidden from humans, bots fill it */}
              <input value={company} onChange={e => setCompany(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

              <label style={{ ...lbl, marginBottom: 8 }}>What stage are you at?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
                {STAGES.map(s => {
                  const on = stage === s.key;
                  return (
                    <button key={s.key} onClick={() => { setStage(s.key); setError(''); }} style={{ padding: '10px 6px', borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', border: '0.5px solid ' + (on ? 'transparent' : 'rgba(255,255,255,0.85)'), background: on ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(255,255,255,0.6)', boxShadow: on ? '0 4px 10px rgba(255,59,48,0.25)' : 'none' }}>
                      <div style={{ fontSize: 18, marginBottom: 3 }}>{s.icon}</div>
                      <p style={{ fontSize: 11, fontWeight: on ? 700 : 500, color: on ? '#fff' : 'rgba(26,26,46,0.6)', lineHeight: 1.2 }}>{s.label}</p>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>What do you want help with, or what are you building?</label>
                <textarea value={details} onChange={e => { setDetails(e.target.value); setError(''); }} rows={4} placeholder="We're a DTC skincare brand and our site can't keep up \u2014 thinking about automation and a rebuild\u2026" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
              </div>

              <label style={{ ...lbl, marginBottom: 8 }}>Best way to reach you</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: needsPhone ? 12 : 20 }}>
                {CONTACT.map(c => {
                  const on = contactPref === c.key;
                  return (
                    <button key={c.key} onClick={() => setContactPref(c.key)} style={{ flex: 1, padding: 8, textAlign: 'center', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: on ? 600 : 400, border: '0.5px solid ' + (on ? 'rgba(255,59,48,0.25)' : 'rgba(0,0,0,0.08)'), background: on ? 'rgba(255,59,48,0.1)' : 'rgba(255,255,255,0.6)', color: on ? '#cc2018' : 'rgba(26,26,46,0.55)' }}>{c.label}</button>
                  );
                })}
              </div>

              {needsPhone && (
                <div style={{ marginBottom: 20 }}><label style={lbl}>Phone number</label><input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }} placeholder="(555) 123-4567" style={inp} /></div>
              )}

              {error && <p style={{ fontSize: 12, color: '#ff3b30', marginBottom: 12 }}>{error}</p>}

              <button onClick={submit} disabled={loading} style={{ width: '100%', padding: 13, borderRadius: 100, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: valid ? '#fff' : 'rgba(28,28,30,0.3)', background: valid ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(0,0,0,0.07)', boxShadow: valid ? '0 4px 16px rgba(255,59,48,0.35)' : 'none', transition: 'all 0.2s' }}>
                {loading ? 'Sending\u2026' : 'Start a conversation \u2192'}
              </button>
              <p style={{ fontSize: 11, color: 'rgba(26,26,46,0.4)', textAlign: 'center', marginTop: 12 }}>We read every submission and reply within 2 business days.</p>
            </div>
          ) : (
            <div style={{ padding: '40px 30px', textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>&#128075;</div>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>Got it, {firstName}.</h2>
              <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.55)', lineHeight: 1.65, marginBottom: 22 }}>Thanks for reaching out. We&apos;ll review what you sent and get back to you at <strong style={{ color: '#1a1a2e' }}>{email}</strong> within 2 business days.</p>
              <Link href="/" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 100, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(255,59,48,0.3)' }}>Back to home</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}