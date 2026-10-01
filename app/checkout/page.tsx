'use client';
// @ts-nocheck
// app/checkout/page.tsx — PLAN CONFIRM → redirects to Stripe hosted checkout via /api/checkout.
// Monthly/Yearly toggle, what's-included, Intelligence waitlist. Real payments (no placeholder).

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TIERS, TRIAL_DAYS } from '@/lib/pricing';

function GCIcon({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

const INCLUDES = {
  solutions: [
    { icon: '💡', name: 'Ideas Vault', desc: 'Write down an idea and “seal” it — a SHA-256 fingerprint + timestamp, so you have dated proof it was yours. Download a certificate any time.' },
    { icon: '🤝', name: 'Barter', desc: 'Log a trade, send the other side a one-click email to confirm the terms, then track delivery from both sides until it’s done.' },
  ],
  intelligence: [
    { icon: '⚖️', name: 'Regulatory updates', desc: 'Federal changes matched to your industries, in plain language, linked to the official source.' },
    { icon: '📈', name: 'Market signals', desc: 'Sector movement for your industries. Coming soon.' },
  ],
  bundle: [
    { icon: '⚖️', name: 'Everything in Intelligence', desc: 'Regulatory + market intelligence for your industries.' },
    { icon: '💡', name: 'Everything in Solutions', desc: 'Ideas Vault + Barter, all the tools.' },
  ],
};

function CheckoutInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const tier = sp.get('tier') || 'solutions';
  const t = TIERS[tier] || TIERS.solutions;
  const accent = t.accent, accent2 = tier === 'solutions' ? '#1a7a35' : tier === 'bundle' ? '#ff6b35' : '#378add';
  const includes = INCLUDES[tier] || INCLUDES.solutions;

  const [cycle, setCycle] = useState(sp.get('cycle') === 'monthly' ? 'monthly' : 'annual');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showWaitlist = tier === 'solutions';
  const [wlEmail, setWlEmail] = useState('');
  const [wlDone, setWlDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace(`/signup?tier=${tier}&cycle=${cycle}`); return; }
      setUser(user);
      if (user.email) setWlEmail(user.email);
    });
  }, []);

  const price = cycle === 'annual' ? t.annual : t.monthly;
  const unit = cycle === 'annual' ? '/yr' : '/mo';

  const joinWaitlist = async () => {
    if (!wlEmail.includes('@')) return;
    try { await supabase.from('product_waitlist').insert({ email: wlEmail.trim().toLowerCase(), product: 'intelligence' }); } catch {}
    setWlDone(true);
  };

  const startTrial = async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ tier, cycle }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout');
      window.location.href = data.url;   // → Stripe hosted checkout
    } catch (e) {
      setError(e.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes rainbowShift{to{background-position:200% center}}
        .cyc-btn{padding:9px 0;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:transparent;color:rgba(26,26,46,0.5);font-family:'DM Sans',sans-serif;transition:all 0.2s;flex:1;text-align:center}
        .cyc-btn.on{background:#fff;color:#1a1a2e;box-shadow:0 1px 6px rgba(0,0,0,0.1)}
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans',sans-serif", background: `radial-gradient(ellipse 70% 50% at 15% 5%,${accent}18 0%,transparent 55%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)` }}>
        <div style={{ width: 'min(460px,100%)', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,0.92)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowShift 3s linear infinite' }} />
          <div style={{ padding: '28px 30px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}><GCIcon size={24} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Gratia Core</span></div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent2, marginBottom: 6 }}>Confirm your plan</p>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', color: '#1a1a2e', marginBottom: 16 }}>{t.name} — start free</h1>

            <div style={{ display: 'flex', gap: 4, background: 'rgba(120,120,128,0.1)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 100, padding: 4, marginBottom: 14 }}>
              <button className={`cyc-btn${cycle === 'monthly' ? ' on' : ''}`} onClick={() => setCycle('monthly')}>Monthly · ${t.monthly}/mo</button>
              <button className={`cyc-btn${cycle === 'annual' ? ' on' : ''}`} onClick={() => setCycle('annual')}>Yearly · ${t.annual}/yr</button>
            </div>

            <div style={{ background: `${accent}0d`, border: `0.5px solid ${accent}30`, borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: cycle === 'annual' ? 4 : 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{cycle === 'annual' ? 'Billed yearly' : 'Billed monthly'}</span>
                <span><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 900, color: '#1a1a2e', letterSpacing: '-1px' }}>${price}</span><span style={{ fontSize: 13, color: 'rgba(26,26,46,0.4)' }}>{unit}</span></span>
              </div>
              {cycle === 'annual' && <p style={{ fontSize: 12, color: accent2, fontWeight: 600 }}>Save ${t.annualSaves} vs paying monthly</p>}
              <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.08)', margin: '12px 0' }} />
              <p style={{ fontSize: 12, color: accent2, fontWeight: 600 }}>Free for {TRIAL_DAYS} days — ${price} charged on day {TRIAL_DAYS + 1} unless you cancel.</p>
            </div>

            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(26,26,46,0.4)', marginBottom: 8 }}>What you get</p>
            {includes.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '10px 0', borderTop: i > 0 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{it.icon}</span>
                <div><p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{it.name}</p><p style={{ fontSize: 12, color: 'rgba(26,26,46,0.55)', margin: '2px 0 0', lineHeight: 1.5 }}>{it.desc}</p></div>
              </div>
            ))}

            {error && <p style={{ fontSize: 12, color: '#ff3b30', margin: '14px 0 0' }}>{error}</p>}

            <button onClick={startTrial} disabled={loading || !user} style={{ width: '100%', padding: 15, borderRadius: 100, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#fff', background: `linear-gradient(135deg,${accent},${accent2})`, boxShadow: `0 6px 20px ${accent}55`, marginTop: 16 }}>
              {loading ? 'Opening secure checkout…' : `Start free trial — ${cycle === 'annual' ? `$${t.annual}/yr` : `$${t.monthly}/mo`} after ${TRIAL_DAYS} days →`}
            </button>
            <p style={{ fontSize: 11, color: 'rgba(26,26,46,0.4)', textAlign: 'center', marginTop: 12 }}>Secure checkout by Stripe · cancel anytime</p>

            {showWaitlist && (
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
                {!wlDone ? (
                  <>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>📡 Want Intelligence too?</p>
                    <p style={{ fontSize: 12, color: 'rgba(26,26,46,0.55)', lineHeight: 1.5, marginBottom: 10 }}>Regulatory + market updates for your industry, launching soon. Drop your email and we’ll tell you when it drops.</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="email" value={wlEmail} onChange={e => setWlEmail(e.target.value)} placeholder="you@company.com" style={{ flex: 1, padding: '10px 12px', borderRadius: 100, border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#1a1a2e' }} />
                      <button onClick={joinWaitlist} style={{ padding: '0 18px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#0a84ff,#378add)', whiteSpace: 'nowrap' }}>Notify me</button>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: '#1a7a35', fontWeight: 600, textAlign: 'center' }}>✓ You’re on the Intelligence list.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f0eff4' }} />}><CheckoutInner /></Suspense>;
}