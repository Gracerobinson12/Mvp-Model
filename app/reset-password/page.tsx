'use client';
// @ts-nocheck
// app/reset-password/page.tsx — where the reset email link lands. Sets a new password.
// Supabase puts the user in a temporary recovery session when they arrive via the link.

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 24 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // When arriving from the email link, Supabase fires a PASSWORD_RECOVERY event
    // and creates a temporary session. We just confirm a session exists.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (newPass.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPass !== confirm) { setError('Passwords don\u2019t match.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.replace('/login'), 2500);
  };

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1a1a2e', boxSizing: 'border-box', marginBottom: 12 };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes rainbowShift{to{background-position:200% center}}`}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans',sans-serif", background: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.1) 0%,transparent 55%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)' }}>
        <div style={{ width: 'min(420px,100%)', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,0.92)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowShift 3s linear infinite' }} />
          <div style={{ padding: '28px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}><GCIcon size={22} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Gratia Core</span></div>
            {done ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>✓</div>
                <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>Password updated</h2>
                <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.55)', lineHeight: 1.6 }}>Taking you to log in…</p>
              </div>
            ) : !ready ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.55)', lineHeight: 1.6 }}>Verifying your reset link…</p>
                <p style={{ fontSize: 12, color: 'rgba(26,26,46,0.4)', marginTop: 12 }}>If this doesn&apos;t load, the link may have expired. <Link href="/forgot-password" style={{ color: '#cc2018', fontWeight: 600, textDecoration: 'none' }}>Request a new one</Link>.</p>
              </div>
            ) : (
              <>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 6, letterSpacing: '-0.5px' }}>Set a new password</h1>
                <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.55)', lineHeight: 1.6, marginBottom: 20 }}>Choose a new password for your account.</p>
                <input type="password" value={newPass} onChange={e => { setNewPass(e.target.value); setError(''); }} placeholder="New password (min 8 chars)" style={inp} />
                <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Confirm new password" style={inp} />
                {error && <p style={{ fontSize: 12, color: '#ff3b30', marginBottom: 12 }}>{error}</p>}
                <button onClick={submit} disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', boxShadow: '0 4px 16px rgba(255,59,48,0.35)' }}>{loading ? 'Updating…' : 'Update password →'}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}