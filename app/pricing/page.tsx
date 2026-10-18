'use client';
// @ts-nocheck
// app/pricing/page.tsx — public pricing for the bubble ecosystem. Per module, per month, cancel any day.
// Landing-page styling (Sora + DM Sans) because this is public; the app itself uses the glass look.

import React from 'react';
import Link from 'next/link';
import { MODULES, PAID_MODULES, COMING_SOON, money } from '@/lib/modules';

export default function PricingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;font-family:'DM Sans',sans-serif;color:#1a1a2e;-webkit-font-smoothing:antialiased}
        .pr-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        @media(max-width:860px){.pr-grid{grid-template-columns:1fr}}
      `}</style>
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,.09) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,.07) 0%,transparent 50%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)', padding: '28px 20px 72px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
            <Link href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 900, fontSize: 16, color: '#1a1a2e', textDecoration: 'none' }}>Gratia Core</Link>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: '#ff3b30', textDecoration: 'none' }}>Log in →</Link>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 10 }}>Pricing</p>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(30px,5vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.08, marginBottom: 12 }}>Add what you need.<br />Pay only for what’s on.</h1>
            <p style={{ fontSize: 16, color: 'rgba(26,26,46,.6)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>Every module is its own monthly price. Turn one on and it’s prorated from today; turn it off and you stop paying that day. One bill, no plans, no bundles.</p>
          </div>

          <div className="pr-grid" style={{ marginBottom: 20 }}>
            {PAID_MODULES.map(id => {
              const mod = MODULES[id];
              return (
                <div key={id} style={{ background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(30px)', border: '0.5px solid rgba(255,255,255,.95)', borderRadius: 24, padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 8px 30px rgba(0,0,0,.06)' }}>
                  <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: '-.5px' }}>{mod.name}</p>
                  <p style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px' }}>{money(mod.price)}</span><span style={{ fontSize: 13, color: 'rgba(26,26,46,.5)' }}>/ month</span></p>
                  <p style={{ fontSize: 13.5, color: 'rgba(26,26,46,.65)', lineHeight: 1.55 }}>{mod.tagline}</p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
                    {mod.bullets.map(b => <li key={b} style={{ fontSize: 13, color: 'rgba(26,26,46,.7)', display: 'flex', gap: 8 }}><span style={{ color: '#ff3b30', fontWeight: 700 }}>✓</span>{b}</li>)}
                  </ul>
                  <Link href={`/signup?module=${id}`} style={{ marginTop: 'auto', display: 'block', textAlign: 'center', padding: 13, borderRadius: 100, textDecoration: 'none', fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', boxShadow: '0 4px 16px rgba(255,59,48,.33)' }}>Start with {mod.name} →</Link>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'rgba(255,59,48,.06)', border: '0.5px solid rgba(255,59,48,.18)', borderRadius: 20, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
            <div>
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, marginBottom: 2 }}>Advisory · free to ask</p>
              <p style={{ fontSize: 13, color: 'rgba(26,26,46,.6)' }}>Websites, consulting, tech &amp; automation, security &amp; privacy. Free 20-minute scoping call, then one fixed quote.</p>
            </div>
            <Link href="/advisory" style={{ padding: '11px 20px', borderRadius: 100, textDecoration: 'none', fontSize: 13, fontWeight: 700, background: '#fff', color: '#1a1a2e', border: '0.5px solid rgba(0,0,0,.12)' }}>Tell us the situation →</Link>
          </div>

          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(26,26,46,.45)', marginBottom: 12, textAlign: 'center' }}>Coming soon</p>
          <div className="pr-grid" style={{ marginBottom: 36 }}>
            {COMING_SOON.map(c => (
              <div key={c.id} style={{ border: '1.5px dashed rgba(255,59,48,.35)', borderRadius: 20, padding: '18px 20px' }}>
                <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{c.name}</p>
                <p style={{ fontSize: 13, color: 'rgba(26,26,46,.6)', lineHeight: 1.5, marginBottom: 8 }}>{c.tagline}</p>
                <Link href={`/contact?waitlist=${c.id}`} style={{ fontSize: 13, fontWeight: 700, color: '#ff3b30', textDecoration: 'none' }}>Join the waitlist →</Link>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: 'rgba(26,26,46,.45)', textAlign: 'center', lineHeight: 1.7 }}>Prices in USD. Proration handled by Stripe; taxes may apply. Already have an account? <Link href="/login" style={{ color: '#ff3b30', fontWeight: 600, textDecoration: 'none' }}>Log in</Link> and add modules from your bubbles.</p>
        </div>
      </div>
    </>
  );
}
