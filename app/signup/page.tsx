'use client';
// @ts-nocheck
// app/signup/page.tsx — one-screen account creation + choose your bubbles.
// Name, email, password, then toggle Idea Vault / Barter / GC Protect on now, or leave them off and add later.
// Advisory is included free (always on, no toggle).
// After signup → /dashboard, or /dashboard/modules?start=vault,barter when they picked modules.
// Nothing is charged here: Stripe Checkout happens in-app when a module is turned on.

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MODULES, money } from '@/lib/modules';

const PICKABLE = ['vault', 'barter', 'protect'].filter(id => MODULES[id]);

function GCIcon({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

function Switch({ on, label }) {
  return (
    <span role="switch" aria-checked={on} aria-label={label} style={{ position: 'relative', width: 46, height: 28, borderRadius: 100, flexShrink: 0, background: on ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(26,26,46,.14)', boxShadow: on ? '0 3px 10px rgba(255,59,48,.35)' : 'none', transition: 'all .2s' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.25)', transition: 'left .2s' }} />
    </span>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const preselect = (sp.get('module') || '').split(',').filter(id => PICKABLE.includes(id));

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [picked, setPicked] = useState<string[]>(preselect);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exists, setExists] = useState(false);
  const [agree, setAgree] = useState(false);

  const toggle = (id) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const total = picked.reduce((s, id) => s + (MODULES[id]?.price || 0), 0);

  const submit = async () => {
    if (!firstName.trim()) { setError('Enter your first name.'); return; }
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords don\u2019t match.'); return; }
    if (!agree) { setError('Please agree to the Terms and Privacy Policy to continue.'); return; }
    setLoading(true); setError('');
    try {
      const { data, error: e } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password });
      if (e) {
        const msg = (e.message || '').toLowerCase();
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) { setExists(true); setLoading(false); return; }
        throw e;
      }
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) { setExists(true); setLoading(false); return; }
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
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'signup', data: { email: user.email, name: (firstName.trim() + ' ' + lastName.trim()).trim(), plan: picked.length ? picked.join(',') : 'none yet' } }),
        }).catch(() => {});
      }
      if (picked.length) {
        const accessToken = data?.session?.access_token;
        if (accessToken) {
          try {
            const res = await fetch('/api/modules/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
              body: JSON.stringify({ modules: picked }),
            });
            const out = await res.json();
            if (out.ok && out.url) { window.location.href = out.url; return; }   // Stripe's hosted payment page
            if (out.ok) { router.replace('/dashboard'); return; }
          } catch {}
        }
        // No session yet (email confirmation on) or checkout failed → modules page picks it up after login.
        router.replace(`/dashboard/modules?start=${picked.join(',')}`);
        return;
      }
      router.replace('/dashboard');
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
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;color:#1a1a2e}
        .su-in{width:100%;padding:12px 14px;border-radius:14px;border:0.5px solid rgba(26,26,46,.14);background:rgba(255,255,255,.85);font-size:14px;font-family:inherit;outline:none;color:#1a1a2e;margin-bottom:12px;transition:border-color .15s,box-shadow .15s}
        .su-in:focus{border-color:#ff3b30;box-shadow:0 0 0 3px rgba(255,59,48,.14)}
        .su-lbl{font-size:11px;font-weight:700;letter-spacing:.04em;color:rgba(26,26,46,.5);display:block;margin-bottom:5px}
        .su-mod{width:100%;display:flex;align-items:center;gap:12px;text-align:left;padding:14px 16px;border-radius:20px;border:0.5px solid rgba(255,255,255,.95);background:rgba(255,255,255,.7);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);cursor:pointer;font-family:inherit;color:inherit;transition:all .2s;box-shadow:0 4px 16px rgba(0,0,0,.05)}
        .su-mod[aria-pressed="true"]{border-color:rgba(255,59,48,.45);background:rgba(255,59,48,.07);box-shadow:0 6px 20px rgba(255,59,48,.16)}
        .su-mod:focus-visible{outline:2px solid #ff3b30;outline-offset:2px}
        @keyframes rainbowShift{to{background-position:200% center}}
        @media(max-width:480px){.su-names{grid-template-columns:1fr !important}}
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,.10) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 90%,rgba(255,59,48,.05) 0%,transparent 50%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)' }}>
        <div style={{ width: 'min(480px,100%)', background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,.92)', borderRadius: 28, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.12)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff6b35,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowShift 3s linear infinite' }} />
          <div style={{ padding: '28px 28px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}><GCIcon size={24} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800 }}>Gratia Core</span></div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 6 }}>Create your account</p>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: '-.6px', marginBottom: 6 }}>Build your bubbles.</h1>
            <p style={{ fontSize: 13, color: 'rgba(26,26,46,.58)', lineHeight: 1.6, marginBottom: 22 }}>Free to sign up. Turn on only what you need, change it any day, and add the rest later.</p>

            <div className="su-names" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label className="su-lbl" htmlFor="su-fn">First name</label><input id="su-fn" className="su-in" autoComplete="given-name" value={firstName} onChange={e => { setFirstName(e.target.value); setError(''); }} placeholder="Jane" /></div>
              <div><label className="su-lbl" htmlFor="su-ln">Last name</label><input id="su-ln" className="su-in" autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" /></div>
            </div>
            <label className="su-lbl" htmlFor="su-em">Email</label>
            <input id="su-em" className="su-in" type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); setExists(false); }} placeholder="jane@company.com" />
            <label className="su-lbl" htmlFor="su-pw">Password</label>
            <input id="su-pw" className="su-in" type="password" autoComplete="new-password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="At least 8 characters" />
            <label className="su-lbl" htmlFor="su-cf">Confirm password</label>
            <input id="su-cf" className="su-in" type="password" autoComplete="new-password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }} placeholder="Re-enter your password" />

            {/* Bubbles */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '10px 0 10px' }}>
              <span className="su-lbl" style={{ marginBottom: 0 }}>YOUR BUBBLES</span>
              <span style={{ fontSize: 11, color: 'rgba(26,26,46,.45)' }}>Tap to turn on · off by default</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {PICKABLE.map(id => {
                const mod = MODULES[id]; const on = picked.includes(id);
                return (
                  <button key={id} type="button" className="su-mod" aria-pressed={on} onClick={() => toggle(id)}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800 }}>{mod.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#ff3b30' }}>{money(mod.price)}/mo</span>
                      </span>
                      <span style={{ display: 'block', fontSize: 12, color: 'rgba(26,26,46,.58)', lineHeight: 1.5, marginTop: 2 }}>{mod.tagline}</span>
                    </span>
                    <Switch on={on} label={`${mod.name} ${on ? 'on' : 'off'}`} />
                  </button>
                );
              })}

              {/* Advisory — complimentary, always on */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 20, border: '1.5px dashed rgba(255,59,48,.35)', background: 'rgba(255,59,48,.04)' }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800 }}>Advisory</span>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#cc2018', background: 'rgba(255,59,48,.1)', borderRadius: 100, padding: '2px 8px' }}>Included free</span>
                  </span>
                  <span style={{ display: 'block', fontSize: 12, color: 'rgba(26,26,46,.58)', lineHeight: 1.5, marginTop: 2 }}>Websites, consulting, tech &amp; security. Free scoping call, then one fixed quote.</span>
                </span>
                <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: '50%', background: '#ff3b30', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>✓</span>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'rgba(26,26,46,.6)', lineHeight: 1.55, background: 'rgba(255,255,255,.6)', border: '0.5px solid rgba(255,255,255,.95)', borderRadius: 14, padding: '10px 14px', marginBottom: 14 }}>
              {picked.length === 0
                ? <>Nothing on yet — <strong>$0 today</strong>. Add bubbles anytime from your dashboard.</>
                : <><strong style={{ color: '#ff3b30' }}>{money(total)}/mo</strong> for {picked.length} bubble{picked.length === 1 ? '' : 's'}. You\u2019ll confirm payment securely with Stripe next; it\u2019s prorated and you can turn any off anytime.</>}
            </div>

            {exists && (
              <div style={{ background: 'rgba(255,59,48,.07)', border: '0.5px solid rgba(255,59,48,.25)', borderRadius: 14, padding: '11px 14px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>That email already has an account.</p>
                <p style={{ fontSize: 12 }}><Link href="/login" style={{ color: '#ff3b30', fontWeight: 700, textDecoration: 'none' }}>Log in instead →</Link></p>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, margin: '4px 0 2px', cursor: 'pointer' }}>
              <input type="checkbox" checked={agree} onChange={e => { setAgree(e.target.checked); setError(''); }} style={{ marginTop: 2, width: 16, height: 16, accentColor: '#ff3b30', flexShrink: 0, cursor: 'pointer' }} />
              <span style={{ fontSize: 12, color: 'rgba(26,26,46,.62)', lineHeight: 1.5 }}>
                I agree to the <Link href="/terms" target="_blank" style={{ color: '#ff3b30', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</Link> and <Link href="/privacy" target="_blank" style={{ color: '#ff3b30', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>, including the arbitration and class-action-waiver terms. I consent to receive account and service emails.
              </span>
            </label>

            {error && <p role="alert" style={{ fontSize: 12, color: '#cc2018', margin: '10px 0 0' }}>{error}</p>}

            <button onClick={submit} disabled={loading || !agree} style={{ width: '100%', padding: 15, borderRadius: 100, border: 'none', cursor: (loading || !agree) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', boxShadow: '0 6px 20px rgba(255,59,48,.35)', marginTop: 14, opacity: agree ? 1 : 0.55 }}>
              {loading ? 'Creating account…' : picked.length ? 'Create account & continue →' : 'Create free account →'}
            </button>
            <p style={{ fontSize: 12, color: 'rgba(26,26,46,.5)', textAlign: 'center', marginTop: 14 }}>Already have an account? <Link href="/login" style={{ color: '#ff3b30', fontWeight: 600, textDecoration: 'none' }}>Log in</Link></p>
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