'use client';
// @ts-nocheck
// app/pricing/page.tsx — REPLACES your old pricing page.
// Reads live from lib/pricing.ts (single source of truth) so numbers never drift.
// Three tiers: Solutions $15 / Intelligence $49 / Bundle $59. Monthly/annual toggle.
// Each CTA routes into the onboarding flow: /signup?tier=...&cycle=...
// Advisory stays a separate "let's talk" link (consulting, no self-serve plan).

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { TIERS } from '@/lib/pricing';

function GCIcon({ size = 26 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

// What each tier includes — display only (mapped to what's real today).
const INCLUDES: Record<string, string[]> = {
  solutions: ['Ideas Vault — document & seal ideas', 'Barter — logged, confirmed trade agreements'],
  intelligence: ['Regulatory updates for your industries', 'Market signals (coming soon)', 'Filtered to your sector, plain-language'],
  bundle: ['Everything in Intelligence', 'Everything in Solutions', 'One login, one bill'],
};

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'DM Sans',system-ui,sans-serif;color:#1c1c1e;overflow-x:hidden;-webkit-font-smoothing:antialiased;
          background:radial-gradient(ellipse 80% 60% at 18% -8%,rgba(255,59,48,0.14) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 82% 110%,rgba(10,132,255,0.16) 0%,transparent 60%),#eae6f2;min-height:100vh;}
        @keyframes priceSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .price-animate{animation:priceSlide 0.28s ease}
        .tog-pill{display:inline-flex;background:rgba(255,255,255,0.45);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.72);border-radius:100px;padding:3px;box-shadow:0 2px 8px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.8)}
        .tog-btn{padding:8px 20px;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:transparent;color:rgba(28,28,30,0.45);font-family:'DM Sans',sans-serif;transition:all 0.2s}
        .tog-btn.on{background:rgba(255,255,255,0.9);color:#1c1c1e;box-shadow:0 1px 6px rgba(0,0,0,0.1)}
      `}</style>

      <div style={{ position: 'fixed', top: 22, left: 22, zIndex: 50, display: 'flex', alignItems: 'center', gap: 9 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <GCIcon size={26} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: '-0.4px', color: '#1c1c1e' }}>Gratia Core</span>
        </Link>
      </div>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '90px 24px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: 100, padding: '5px 14px', marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#30d158' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(28,28,30,0.55)' }}>7-day free trial · every plan</span>
          </div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1, color: '#1c1c1e', marginBottom: 10 }}>Simple, honest pricing.</h1>
          <p style={{ fontSize: 16, color: 'rgba(28,28,30,0.5)', marginBottom: 24 }}>Card saved, not charged until day 8. Cancel anytime.</p>
          <div className="tog-pill">
            <button className={`tog-btn${!annual ? ' on' : ''}`} onClick={() => setAnnual(false)}>Monthly</button>
            <button className={`tog-btn${annual ? ' on' : ''}`} onClick={() => setAnnual(true)}>
              Annual&nbsp;<span style={{ fontSize: 10, fontWeight: 700, color: '#1a7a35', background: 'rgba(48,209,88,0.15)', border: '0.5px solid rgba(48,209,88,0.3)', padding: '2px 7px', borderRadius: 100 }}>Save more</span>
            </button>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 16, marginBottom: 20, alignItems: 'stretch' }}>
          {(['solutions', 'intelligence', 'bundle'] as const).map((key, i) => {
            const t = TIERS[key];
            const featured = key === 'bundle';
            const price = annual ? t.annual : t.monthly;
            const unit = annual ? '/yr' : '/mo';
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, type: 'spring', stiffness: 180, damping: 22 }}
                style={{ position: 'relative', background: featured ? 'rgba(255,255,255,0.66)' : 'rgba(255,255,255,0.52)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: featured ? `2px solid ${t.accent}66` : '1px solid rgba(255,255,255,0.78)', borderRadius: 22, padding: '28px 26px', boxShadow: featured ? `0 20px 60px ${t.accent}22, 0 8px 24px rgba(0,0,0,0.09)` : '0 8px 32px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column' }}>
                {featured && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', background: `linear-gradient(135deg,${t.accent},#ff6b35)`, color: '#fff', padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap', boxShadow: `0 4px 12px ${t.accent}44` }}>Best value</div>}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.accent, background: `${t.accent}14`, border: `0.5px solid ${t.accent}30`, padding: '3px 10px', borderRadius: 100, width: 'fit-content', marginBottom: 16, marginTop: featured ? 8 : 0 }}>{t.name}</div>
                <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)', lineHeight: 1.5, marginBottom: 16, minHeight: 34 }}>{t.tagline}</p>
                <div key={String(annual)} className="price-animate" style={{ marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 48, fontWeight: 900, letterSpacing: '-3px', color: '#1c1c1e', lineHeight: 1 }}>${price}</span>
                  <span style={{ fontSize: 15, color: 'rgba(28,28,30,0.38)' }}>{unit}</span>
                </div>
                <p style={{ fontSize: 12, color: annual ? t.accent : 'rgba(28,28,30,0.4)', fontWeight: annual ? 600 : 400, marginBottom: 20, minHeight: 18 }}>{annual ? `Save $${t.annualSaves} vs monthly` : 'Billed monthly'}</p>
                <div style={{ flex: 1, marginBottom: 20 }}>
                  {INCLUDES[key].map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '7px 0', fontSize: 13, color: 'rgba(28,28,30,0.7)', borderTop: j > 0 ? '0.5px solid rgba(255,255,255,0.65)' : 'none' }}>
                      <span style={{ color: '#1a7a35', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <a href={`/signup?tier=${key}&cycle=${annual ? 'annual' : 'monthly'}`} style={{ display: 'block', textAlign: 'center', padding: 13, borderRadius: 100, textDecoration: 'none', fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", background: featured ? `linear-gradient(135deg,${t.accent},#ff6b35)` : 'rgba(255,255,255,0.85)', color: featured ? '#fff' : '#1c1c1e', border: featured ? 'none' : '0.5px solid rgba(0,0,0,0.12)', boxShadow: featured ? `0 4px 16px ${t.accent}55` : 'none' }}>Start 7-day trial →</a>
                <p style={{ fontSize: 11, color: 'rgba(28,28,30,0.3)', textAlign: 'center', marginTop: 8 }}>Card saved · not charged until day 8</p>
              </motion.div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: 13, color: 'rgba(28,28,30,0.5)' }}>Need consulting instead? <Link href="/advisory" style={{ color: '#ff3b30', fontWeight: 600, textDecoration: 'none' }}>Let&apos;s talk →</Link></p>
          <Link href="/" style={{ display: 'inline-block', marginTop: 18, fontSize: 13, color: 'rgba(28,28,30,0.45)', textDecoration: 'none', fontWeight: 500 }}>← Back to home</Link>
        </div>
      </main>
    </>
  );
}