'use client';
// @ts-nocheck
// app/intelligence/page.tsx — COMING SOON storefront. Shows what's coming, captures waitlist
// emails into product_waitlist (product='intelligence'). No signup/trial buttons yet.

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

const INCLUDED = [
  ['Regulatory updates', 'Federal changes matched to your industries, with links to the official source.'],
  ['Filtered to your sector', 'Pick your industries; the feed only shows what affects you.'],
  ['Market signals', 'Sector movement and company news for your industries.'],
  ['Plain-language framing', 'What changed, who it affects, where to read more.'],
];

export default function IntelligencePage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const join = async () => {
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    setLoading(true); setError('');
    try {
      const { error: e } = await supabase.from('product_waitlist').insert({ email: email.trim().toLowerCase(), product: 'intelligence' });
      if (e && !(e.message || '').includes('duplicate')) throw e;
      setDone(true);
    } catch { setError('Something went wrong. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes rainbowShift{to{background-position:200% center;}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(10,132,255,0.12) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(191,90,242,0.08) 0%,transparent 50%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)', fontFamily: "'DM Sans',sans-serif", padding: '24px 20px 60px' }}>

        <div style={{ maxWidth: 640, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <GCIcon size={24} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Gratia Core</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(26,26,46,0.5)', textDecoration: 'none' }}>← Home</Link>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.05)', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 100, padding: '5px 14px', marginBottom: 18 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0a84ff' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(26,26,46,0.5)' }}>Intelligence · Coming soon</span>
          </div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(30px,5vw,46px)', fontWeight: 900, letterSpacing: '-1.6px', lineHeight: 1.05, color: '#1a1a2e', marginBottom: 14 }}>Know what’s changing<br/>before it’s your problem.</h1>
          <p style={{ fontSize: 15, color: 'rgba(26,26,46,0.55)', lineHeight: 1.65, maxWidth: 440, margin: '0 auto 28px' }}>Regulatory, market, industry, and policy intelligence — filtered to your industries and delivered in plain language. Launching soon.</p>
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto', background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '0.5px solid rgba(255,255,255,0.9)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowShift 3s linear infinite' }} />
          <div style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(26,26,46,0.4)', marginBottom: 8 }}>What’s coming</p>
            {INCLUDED.map(([label, sub], i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderTop: i > 0 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
                <span style={{ color: '#0a84ff', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✦</span>
                <div><p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{label}</p><p style={{ fontSize: 12, color: 'rgba(26,26,46,0.5)', margin: '2px 0 0', lineHeight: 1.5 }}>{sub}</p></div>
              </div>
            ))}

            {/* Waitlist capture */}
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
              {!done ? (
                <>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>📡 Be first in line</p>
                  <p style={{ fontSize: 12, color: 'rgba(26,26,46,0.55)', lineHeight: 1.5, marginBottom: 12 }}>Drop your email and we’ll tell you the moment Intelligence launches.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && join()} placeholder="you@company.com" style={{ flex: 1, padding: '12px 14px', borderRadius: 100, border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1a1a2e' }} />
                    <button onClick={join} disabled={loading} style={{ padding: '0 22px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#0a84ff,#378add)', whiteSpace: 'nowrap', boxShadow: '0 4px 16px #0a84ff55' }}>{loading ? '…' : 'Notify me'}</button>
                  </div>
                  {error && <p style={{ fontSize: 12, color: '#ff3b30', marginTop: 10 }}>{error}</p>}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '6px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', fontFamily: "'Sora',sans-serif", marginBottom: 4 }}>You’re on the list.</p>
                  <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.55)' }}>We’ll email you the moment Intelligence launches.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: '22px auto 0', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.55)' }}>Need help right now? Advisory is open — <Link href="/advisory" style={{ color: '#ff3b30', fontWeight: 700, textDecoration: 'none' }}>let’s talk →</Link></p>
        </div>
      </div>
    </>
  );
}