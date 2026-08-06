// @ts-nocheck
/* eslint-disable */
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function ConfirmContent() {
  const router    = useRouter();
  const params    = useSearchParams();
  const plan      = params.get('plan') || 'individual';
  const sessionId = params.get('session_id');
  const [email,    setEmail]    = useState('');
  const [resent,   setResent]   = useState(false);
  const [sending,  setSending]  = useState(false);
  const [ready,    setReady]    = useState(false);

  const goToOnboarding = async (user) => {
    if (sessionId) {
      try {
        await fetch('/api/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId: user.id }),
        });
      } catch (e) {}
    }
    router.push('/onboarding/' + plan);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { goToOnboarding(user); return; }
      const stored = localStorage.getItem('gc_signup_email');
      if (stored) setEmail(stored);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) { clearInterval(id); goToOnboarding(user); }
      });
    }, 3000);
    return () => clearInterval(id);
  }, [ready]);

  const resend = async () => {
    if (!email || sending) return;
    setSending(true);
    await supabase.auth.resend({ type: 'signup', email });
    setResent(true);
    setSending(false);
  };

  if (!ready) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        @keyframes rb { to { background-position: 200% center; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        fontFamily: "'DM Sans', sans-serif",
        background: plan === 'enterprise'
          ? 'radial-gradient(ellipse 65% 55% at 8% -8%, rgba(255,59,48,0.45) 0%, transparent 52%), radial-gradient(ellipse 55% 45% at 94% 108%, rgba(10,132,255,0.35) 0%, transparent 52%), #dde4f0'
          : 'radial-gradient(ellipse 65% 55% at 8% -8%, rgba(10,132,255,0.42) 0%, transparent 52%), radial-gradient(ellipse 55% 45% at 94% 108%, rgba(48,209,88,0.32) 0%, transparent 52%), #dde4f0',
      }}>

        <div style={{
          width: '100%', maxWidth: 440,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.62) 100%)',
          border: '1px solid rgba(255,255,255,0.92)', borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 2px 0 rgba(255,255,255,1) inset, 0 24px 64px rgba(0,0,0,0.12)',
          animation: 'up 0.4s ease',
        }}>

          <div style={{
            height: 3,
            background: plan === 'enterprise'
              ? 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#ff3b30)'
              : 'linear-gradient(90deg,#0a84ff,#30d158,#ffd60a,#0a84ff)',
            backgroundSize: '200% auto',
            animation: 'rb 3s linear infinite',
          }} />

          <div style={{ padding: '28px 28px 28px' }}>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5))',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 2px 0 rgba(255,255,255,1) inset, 0 8px 24px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
              }}>
                📧
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(48,209,88,0.1)', border: '0.5px solid rgba(48,209,88,0.22)',
                borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#1a7a35',
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#30d158', animation: 'pulse 1.5s ease infinite' }} />
                Payment confirmed · Waiting for email
              </div>
            </div>

            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.6px', textAlign: 'center', marginBottom: 8 }}>
              Check your inbox
            </h1>

            <p style={{ fontSize: 13, color: 'rgba(28,28,30,0.55)', textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
              We sent a confirmation link to
              <br />
              <strong style={{ color: '#1c1c1e' }}>{email || 'your email address'}</strong>
              <br />
              Click it to activate your account and start setup.
            </p>

            <div style={{
              background: plan === 'enterprise' ? 'rgba(255,59,48,0.05)' : 'rgba(10,132,255,0.05)',
              border: plan === 'enterprise' ? '0.5px solid rgba(255,59,48,0.18)' : '0.5px solid rgba(10,132,255,0.18)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 20,
              boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: plan === 'enterprise' ? '#ff3b30' : '#0a84ff', marginBottom: 10 }}>
                What happens next
              </p>
              {[
                { icon: '✉️', text: 'Click the confirmation link in your email' },
                { icon: plan === 'enterprise' ? '🏢' : '👤', text: plan === 'enterprise' ? '3-minute account setup' : '90-second account setup' },
                { icon: '🚀', text: 'Access your full dashboard' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(255,255,255,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    boxShadow: '0 1px 0 rgba(255,255,255,1) inset',
                  }}>
                    {item.icon}
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.6)', margin: 0, fontWeight: 500 }}>{item.text}</p>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(48,209,88,0.06)', border: '0.5px solid rgba(48,209,88,0.2)',
              borderRadius: 12, padding: '10px 13px', marginBottom: 20,
              fontSize: 12, color: 'rgba(28,28,30,0.55)', textAlign: 'center', lineHeight: 1.65,
              boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset',
            }}>
              🔒 7-day free trial started. Card saved, not charged until day 8. Cancel any time.
            </div>

            {!resent ? (
              <button
                onClick={resend}
                disabled={sending}
                style={{
                  width: '100%', padding: 11, borderRadius: 100, marginBottom: 10,
                  background: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.85)',
                  color: 'rgba(28,28,30,0.55)', fontSize: 13, fontWeight: 600,
                  cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset',
                }}
              >
                {sending ? 'Sending…' : "Didn't get it? Resend confirmation email"}
              </button>
            ) : (
              <div style={{
                textAlign: 'center', padding: 10, borderRadius: 100, marginBottom: 10,
                background: 'rgba(48,209,88,0.08)', border: '0.5px solid rgba(48,209,88,0.2)',
                color: '#1a7a35', fontSize: 13, fontWeight: 600,
              }}>
                ✓ Sent — check your inbox and spam folder
              </div>
            )}

            <p style={{ fontSize: 11, color: 'rgba(28,28,30,0.35)', textAlign: 'center' }}>
              Already confirmed?{' '}
              <Link href="/login" style={{ color: plan === 'enterprise' ? '#ff3b30' : '#0a84ff', fontWeight: 600 }}>
                Sign in →
              </Link>
            </p>

          </div>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(28,28,30,0.3)', marginTop: 20 }}>
          © 2026 Gratia Core ·{' '}
          <Link href="/privacy" style={{ color: 'rgba(28,28,30,0.3)' }}>Privacy</Link>
          {' · '}
          <Link href="/terms" style={{ color: 'rgba(28,28,30,0.3)' }}>Terms</Link>
        </p>

      </div>
    </>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dde4f0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(28,28,30,0.4)' }}>
        Loading…
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}