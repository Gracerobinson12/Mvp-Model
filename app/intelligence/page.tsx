'use client';
// @ts-nocheck
// app/intelligence/page.tsx — LIVE storefront (replaces the coming-soon waitlist).
// Sells the 3 modules, "Start free trial" → /signup?tier=intelligence. Advisory link.

import React from 'react';
import Link from 'next/link';

function GCIcon({ size = 24 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

const INCLUDED = [
  ['⚖️', 'Regulatory updates', 'Federal rule changes matched to your industries — IRS, FTC, FDA, OSHA and more, in plain language with the official source.'],
  ['🌐', 'Tariff intelligence', 'Look up duty rates on any product, and check whether a supplier raised prices more than the tariff actually justifies.'],
  ['🔍', 'Expense intelligence', 'Upload a statement — we find duplicate charges, forgotten subscriptions, and price hikes, then hand you the script to get your money back.'],
];

export default function IntelligencePage() {
  const accent = '#0a84ff', accent2 = '#378add';
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}@keyframes rainbowShift{to{background-position:200% center}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(10,132,255,0.12) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(191,90,242,0.08) 0%,transparent 50%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)', fontFamily: "'DM Sans',sans-serif", padding: '24px 20px 60px' }}>

        <div style={{ maxWidth: 640, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <GCIcon size={24} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Gratia Core</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(26,26,46,0.5)', textDecoration: 'none' }}>← Home</Link>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accent}14`, border: `0.5px solid ${accent}30`, borderRadius: 100, padding: '5px 14px', marginBottom: 18 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#30d158' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent2 }}>Intelligence · Live</span>
          </div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(30px,5vw,46px)', fontWeight: 900, letterSpacing: '-1.6px', lineHeight: 1.05, color: '#1a1a2e', marginBottom: 14 }}>Know what&apos;s changing<br/>before it&apos;s your problem.</h1>
          <p style={{ fontSize: 15, color: 'rgba(26,26,46,0.55)', lineHeight: 1.65, maxWidth: 460, margin: '0 auto 28px' }}>Regulatory changes, tariff checks, and expense leak-finding — filtered to your industry and built to save you money.</p>
        </div>

        <div style={{ maxWidth: 540, margin: '0 auto', background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '0.5px solid rgba(255,255,255,0.9)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowShift 3s linear infinite' }} />
          <div style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(26,26,46,0.4)', marginBottom: 8 }}>What&apos;s included · $49/mo</p>
            {INCLUDED.map(([icon, label, sub], i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderTop: i > 0 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <div><p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{label}</p><p style={{ fontSize: 12, color: 'rgba(26,26,46,0.5)', margin: '2px 0 0', lineHeight: 1.5 }}>{sub}</p></div>
              </div>
            ))}

            <a href="/signup?tier=intelligence&cycle=annual" style={{ display: 'block', textAlign: 'center', padding: 16, borderRadius: 100, textDecoration: 'none', fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", background: `linear-gradient(135deg,${accent},${accent2})`, color: '#fff', boxShadow: `0 6px 20px ${accent}55`, marginTop: 18 }}>Start free trial →</a>
            <Link href="/pricing" style={{ display: 'block', textAlign: 'center', padding: 14, borderRadius: 100, textDecoration: 'none', fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", background: 'rgba(255,255,255,0.8)', color: '#1a1a2e', border: '0.5px solid rgba(0,0,0,0.12)', marginTop: 8 }}>See pricing</Link>
            <p style={{ fontSize: 11, color: 'rgba(26,26,46,0.4)', textAlign: 'center', marginTop: 12 }}>7-day free trial · card not charged until day 8</p>
          </div>
        </div>

        <div style={{ maxWidth: 540, margin: '22px auto 0', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.55)' }}>Prefer to talk it through first? Advisory is open — <Link href="/advisory" style={{ color: '#ff3b30', fontWeight: 700, textDecoration: 'none' }}>let&apos;s talk →</Link></p>
        </div>
      </div>
    </>
  );
}