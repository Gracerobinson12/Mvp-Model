'use client';
// @ts-nocheck
// app/signup/page.tsx
// After signup → /dashboard, or /dashboard/modules?start=<module> when they came from pricing.

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 26 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const startModule = sp.get('module') || ''; // e.g. /signup?module=vault

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [exists,    setExists]    = useState(false);
  const [agree,     setAgree]     = useState(false);

  const submit = async () => {
    if (!firstName.trim())          { setError('Enter your first name.'); return; }
    if (!email.includes('@'))       { setError('Enter a valid email.'); return; }
    if (password.length < 8)        { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)       { setError("Passwords don't match."); return; }
    if (!agree)                     { setError('Please agree to the Terms and Privacy Policy to continue.'); return; }
    setLoading(true); setError('');
    try {
      const { data, error: e } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (e) {
        const msg = (e.message || '').toLowerCase();
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          setExists(true); setLoading(false); return;
        }
        throw e;
      }
      // Supabase returns user with identities:[] when the email already exists
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setExists(true); setLoading(false); return;
      }
      const user = data.user;
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          full_name: (firstName.trim() + ' ' + lastName.trim()).trim(),
          plan: 'modules',
          plan_status: 'incomplete',
          onboarded: false,
          terms_accepted_at: new Date().toISOString(),
          terms_version: '2026-10-10',
        }, { onConflict: 'id' });
      }
      // Land on the bubbles, or straight into the module they clicked
      router.replace(startModule ? `/dashboard/modules?start=${startModule}` : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff',
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
    color: '#1a1a2e', boxSizing: 'border-box', marginBottom: 12,
  };
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 600,
    color: 'rgba(26,26,46,0.5)', display: 'block', marginBottom: 5,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes rainbowShift{to{background-position:200% center}}
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans',sans-serif", background: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(215,20,26,0.1) 0%,transparent 55%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)' }}>
        <div style={{ width: 'min(440px,100%)', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,0.92)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowShift 3s linear infinite' }} />
          <div style={{ padding: '28px 30px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <GCIcon size={24} />
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Gratia Core</span>
            </div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', color: '#1a1a2e', marginBottom: 6 }}>Create your account</h1>
            <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.55)', lineHeight: 1.6, marginBottom: 20 }}>
              {startModule
                ? `You're one step away from turning on ${startModule.charAt(0).toUpperCase() + startModule.slice(1)}.`
                : 'Turn on only what you need. Cancel any module, any day.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>First name</label>
                <input value={firstName} onChange={e => { setFirstName(e.target.value); setError(''); }} placeholder="Jane" style={inp} />
              </div>
              <div>
                <label style={lbl}>Last name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" style={inp} />
              </div>
            </div>

            <label style={lbl}>Email</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); setExists(false); }} placeholder="jane@company.com" style={inp} />

            <label style={lbl}>Password</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="At least 8 characters" style={inp} />

            <label style={lbl}>Confirm password</label>
            <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Re-enter your password" style={inp} />

            {exists && (
              <div style={{ background: 'rgba(10,132,255,0.08)', border: '0.5px solid rgba(10,132,255,0.25)', borderRadius: 12, padding: '11px 14px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 600, marginBottom: 2 }}>That email already has an account.</p>
                <p style={{ fontSize: 12, color: 'rgba(26,26,46,0.6)' }}>
                  <Link href="/login" style={{ color: '#0a84ff', fontWeight: 600, textDecoration: 'none' }}>Log in instead →</Link>
                </p>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, margin: '4px 0 2px', cursor: 'pointer' }}>
              <input type="checkbox" checked={agree} onChange={e => { setAgree(e.target.checked); setError(''); }} style={{ marginTop: 2, width: 16, height: 16, accentColor: '#D7141A', flexShrink: 0, cursor: 'pointer' }} />
              <span style={{ fontSize: 12, color: 'rgba(26,26,46,0.62)', lineHeight: 1.5 }}>
                I agree to the{' '}
                <Link href="/terms" target="_blank" style={{ color: '#D7141A', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank" style={{ color: '#D7141A', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>
                , including the arbitration and class-action-waiver terms. I consent to receive account and service emails.
              </span>
            </label>

            {error && <p style={{ fontSize: 12, color: '#ff3b30', margin: '10px 0 4px' }}>{error}</p>}

            <button
              onClick={submit}
              disabled={loading || !agree}
              style={{ width: '100%', padding: 15, borderRadius: 100, border: 'none', cursor: (loading || !agree) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#ff3b30,#D7141A)', boxShadow: '0 6px 20px rgba(215,20,26,0.4)', marginTop: 12, opacity: agree ? 1 : 0.55 }}
            >
              {loading ? 'Creating account…' : 'Continue →'}
            </button>

            <p style={{ fontSize: 12, color: 'rgba(26,26,46,0.5)', textAlign: 'center', marginTop: 14 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#D7141A', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f0eff4' }} />}>
      <SignupPageInner />
    </Suspense>
  );
}