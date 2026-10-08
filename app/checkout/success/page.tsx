'use client';
// @ts-nocheck
// app/checkout/success/page.tsx — Stripe redirects here after a successful trial start.
// The webhook flips entitlements; this page just confirms + routes to the right dashboard.

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function SuccessInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const tier = sp.get('tier') || 'solutions';
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // give the webhook a moment, then send them to their dashboard
    const dest = tier === 'solutions' ? '/dashboard/solutions' : `/onboarding?tier=${tier}`;
    const t = setTimeout(() => { setChecking(false); }, 1500);
    return () => clearTimeout(t);
  }, [tier]);

  const dest = tier === 'solutions' ? '/dashboard/solutions' : `/onboarding?tier=${tier}`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif", background: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(48,209,88,0.14) 0%,transparent 55%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ width: 'min(420px,100%)', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,0.92)', borderRadius: 24, padding: '36px 30px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 900, color: '#1a1a2e', marginBottom: 8, letterSpacing: '-0.5px' }}>You&apos;re in.</h1>
        <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.55)', lineHeight: 1.6, marginBottom: 24 }}>Your 7-day free trial has started. You won&apos;t be charged until day 8 — cancel anytime from Settings.</p>
        <button onClick={() => router.replace(dest)} disabled={checking} style={{ width: '100%', padding: 14, borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#30d158,#1a7a35)', boxShadow: '0 6px 20px rgba(48,209,88,0.4)' }}>
          {checking ? 'Setting up…' : (tier === 'solutions' ? 'Go to my dashboard →' : 'Set up my feed →')}
        </button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f0eff4' }} />}><SuccessInner /></Suspense>;
}