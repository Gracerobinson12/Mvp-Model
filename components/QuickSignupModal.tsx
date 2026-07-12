'use client';

/**
 * components/QuickSignupModal.tsx
 *
 * Step 1: Plan toggle (Individual / Business) + First name + Last name + Email
 * Step 2: Password + Confirm password + recap pill → Stripe hosted checkout
 *
 * .env.local:
 *   STRIPE_SECRET_KEY=sk_test_...
 *   NEXT_PUBLIC_APP_URL=http://localhost:3000
 *   STRIPE_PRICE_FREELANCER=price_1TGsBeQoXngqrNXZlVvmcsEW
 *   STRIPE_PRICE_BUSINESS=price_1TGsCGQoXngqrNXZPZn362p2
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, Moon, Eye, EyeOff } from 'lucide-react';

type Plan = 'personal' | 'business';
type Mode = 'light' | 'dark';

const PLANS = {
  personal: {
    label: 'Individual',
    price: '$19',
    annual: 'or $149/yr — save 35%',
    cta: 'linear-gradient(135deg,#af52de,#bf5af2)',
    ctaShadow: 'rgba(175,82,222,0.35)',
    tagBg: (m: Mode) => m === 'light' ? 'rgba(175,82,222,0.1)' : 'rgba(175,82,222,0.2)',
    tagColor: (m: Mode) => m === 'light' ? '#7c3aed' : '#c77df8',
    title: 'Protect your ideas.\nGet paid fairly.',
    subtitle: 'Built for freelancers and solo founders who need powerful tools without enterprise overhead.',
    features: [
      { dot: '#af52de', text: 'Ideas vault — timestamp your concept before you pitch' },
      { dot: '#1a7a35', text: 'Barter exchange — documented service trades' },
      { dot: '#ff9500', text: 'Sample duty lookup — no Alibaba customs surprises' },
    ],
  },
  business: {
    label: 'Business',
    price: '$99',
    annual: 'or $899/yr — save 25%',
    cta: 'linear-gradient(135deg,#0a84ff,#34aadc)',
    ctaShadow: 'rgba(10,132,255,0.35)',
    tagBg: (m: Mode) => m === 'light' ? 'rgba(10,132,255,0.1)' : 'rgba(10,132,255,0.2)',
    tagColor: (m: Mode) => m === 'light' ? '#185fa5' : '#5db5ff',
    title: 'Stay ahead of costs,\ncompliance and risk.',
    subtitle: 'Full-stack intelligence for businesses that import, operate in regulated industries, or use AI tools with client data.',
    features: [
      { dot: '#ff3b30', text: 'Tariff intelligence — landed cost before you order' },
      { dot: '#7c3aed', text: 'Regulatory updates — plain language, fast alerts' },
      { dot: '#0a84ff', text: 'Market intelligence — weekly demand signals' },
      { dot: '#b45309', text: 'Shield — client data never reaches any AI model' },
    ],
  },
} as const;

const lt = (light: string, dark: string, m: Mode) => m === 'light' ? light : dark;

// ── Password field — outside component to prevent remount on rerender ─
function PwField({
  label, value, onChange, show, onToggle,
  placeholder, mode, onEnter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  mode: Mode;
  onEnter?: () => void;
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, letterSpacing: '0.08em',
        textTransform: 'uppercase' as const, marginBottom: 6,
        color: lt('rgba(28,28,30,0.4)', 'rgba(255,255,255,0.3)', mode),
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '13px 44px 13px 16px',
            borderRadius: 12, fontSize: 15, fontFamily: 'inherit',
            outline: 'none', transition: 'border-color 0.2s',
            background: lt('rgba(120,120,128,0.08)', 'rgba(255,255,255,0.07)', mode),
            border: `1px solid ${lt('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)', mode)}`,
            color: lt('#1c1c1e', 'rgba(255,255,255,0.9)', mode),
            boxSizing: 'border-box' as const,
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'absolute', right: 14, top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, display: 'flex', alignItems: 'center',
            color: lt('rgba(28,28,30,0.35)', 'rgba(255,255,255,0.3)', mode),
          }}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────
export function QuickSignupModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode]   = useState<Mode>('light');
  const [plan, setPlan]   = useState<Plan>('personal');
  const [step, setStep]   = useState<'details' | 'password'>('details');

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');

  // Step 2
  const [password,   setPassword]    = useState('');
  const [confirmPw,  setConfirmPw]   = useState('');
  const [showPw,     setShowPw]      = useState(false);
  const [showConfirm,setShowConfirm] = useState(false);
  const [bizName,    setBizName]     = useState('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const pd       = PLANS[plan];
  const pwValid  = password.length >= 8;
  const pwMatch  = password === confirmPw && confirmPw.length > 0;
  const canSubmit = !!(firstName.trim() && pwValid && pwMatch);

  // Escape to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', padding: '13px 16px', borderRadius: 12,
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
    background: lt('rgba(120,120,128,0.08)', 'rgba(255,255,255,0.07)', mode),
    border: `1px solid ${lt('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)', mode)}`,
    color: lt('#1c1c1e', 'rgba(255,255,255,0.9)', mode),
    ...extra,
  });

  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 11, letterSpacing: '0.08em',
    textTransform: 'uppercase', marginBottom: 6,
    color: lt('rgba(28,28,30,0.4)', 'rgba(255,255,255,0.3)', mode),
  };

  const handleContinue = () => {
    if (!firstName.trim())                      { setError('Enter your first name.'); return; }
    if (!email.trim() || !email.includes('@'))  { setError('Enter a valid email address.'); return; }
    setError('');
    setStep('password');
  };

  const handleStartTrial = useCallback(async () => {
    if (!pwValid) { setError('Password must be at least 8 characters.'); return; }
    if (!pwMatch) { setError("Passwords don't match."); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, bizName, password, plan }),
      });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({}));
        throw new Error(message ?? 'Could not start checkout. Try again.');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }, [email, firstName, lastName, bizName, password, plan, pwValid, pwMatch]);

  const PlanToggle = (
    <div style={{
      display: 'flex', gap: 3,
      background: lt('rgba(120,120,128,0.1)', 'rgba(255,255,255,0.06)', mode),
      border: `1px solid ${lt('rgba(0,0,0,0.06)', 'rgba(255,255,255,0.08)', mode)}`,
      borderRadius: 100, padding: 3, marginBottom: 24,
    }}>
      {(['personal', 'business'] as Plan[]).map((p) => (
        <button key={p} onClick={() => { setPlan(p); setError(''); }} style={{
          flex: 1, padding: '8px 10px', borderRadius: 100,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all 0.2s',
          border: plan === p
            ? `0.5px solid ${lt('rgba(0,0,0,0.09)', 'rgba(255,255,255,0.14)', mode)}`
            : 'none',
          background: plan === p ? lt('#fff', 'rgba(255,255,255,0.12)', mode) : 'transparent',
          color: plan === p
            ? lt('#1c1c1e', '#fff', mode)
            : lt('rgba(28,28,30,0.4)', 'rgba(255,255,255,0.3)', mode),
          boxShadow: plan === p && mode === 'light' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        }}>
          {p === 'personal' ? 'For individuals' : 'For businesses'}
        </button>
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="gc-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      />

      {/* Flexbox centering wrapper — avoids Framer Motion transform conflict */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, pointerEvents: 'none',
        }}
      >
        <motion.div
          key="gc-modal"
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            width: '100%', maxWidth: 780,
            maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
            borderRadius: 28,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            background: lt('rgba(255,255,255,0.97)', 'rgba(14,14,22,0.98)', mode),
            border: `1px solid ${lt('rgba(0,0,0,0.08)', 'rgba(255,255,255,0.08)', mode)}`,
            boxShadow: mode === 'light'
              ? '0 48px 120px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(0,0,0,0.06)'
              : '0 48px 120px rgba(0,0,0,0.75)',
          }}
        >
          {/* Rainbow trim */}
          <div style={{
            height: 3.5,
            background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)',
            backgroundSize: '200% auto',
            animation: 'gcRainbow 3s linear infinite',
            borderRadius: '28px 28px 0 0',
          }} />

          {/* Controls */}
          <div style={{
            position: 'absolute', top: 18, right: 18,
            display: 'flex', alignItems: 'center', gap: 8, zIndex: 10,
          }}>
            <button
              onClick={() => setMode(m => m === 'light' ? 'dark' : 'light')}
              aria-label="Toggle dark mode"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 100, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                border: `0.5px solid ${lt('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.12)', mode)}`,
                background: lt('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)', mode),
                color: lt('rgba(28,28,30,0.55)', 'rgba(255,255,255,0.45)', mode),
                transition: 'all 0.2s',
              }}
            >
              {mode === 'light' ? <Moon size={12} strokeWidth={2} /> : <Sun size={12} strokeWidth={2} />}
              {mode === 'light' ? 'Dark' : 'Light'}
            </button>
            <button onClick={onClose} aria-label="Close" style={{
              width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', transition: 'all 0.2s',
              background: lt('rgba(0,0,0,0.07)', 'rgba(255,255,255,0.08)', mode),
              color: lt('rgba(28,28,30,0.5)', 'rgba(255,255,255,0.45)', mode),
            }}>
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Split body */}
          <div style={{ display: 'flex', minHeight: 520 }}>

            {/* ── Left: plan context ── */}
            <div style={{
              width: 280, flexShrink: 0, padding: '36px 28px',
              display: 'flex', flexDirection: 'column',
              borderRight: `0.5px solid ${lt('rgba(0,0,0,0.07)', 'rgba(255,255,255,0.07)', mode)}`,
              background: lt('rgba(0,0,0,0.018)', 'rgba(255,255,255,0.018)', mode),
              transition: 'background 0.3s',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 13, background: '#ff3b30',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Arial Black', Arial, sans-serif",
                fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 20,
                boxShadow: '0 4px 14px rgba(255,59,48,0.35)',
              }}>GC</div>

              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '4px 11px', borderRadius: 100,
                width: 'fit-content', marginBottom: 12,
                background: pd.tagBg(mode), color: pd.tagColor(mode),
                transition: 'all 0.3s',
              }}>
                {pd.label}
              </div>

              <p style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px',
                lineHeight: 1.2, marginBottom: 10, whiteSpace: 'pre-line',
                color: lt('#1c1c1e', '#fff', mode), transition: 'color 0.3s',
              }}>
                {pd.title}
              </p>

              <p style={{
                fontSize: 13, lineHeight: 1.65, marginBottom: 22,
                color: lt('rgba(28,28,30,0.5)', 'rgba(255,255,255,0.38)', mode),
              }}>
                {pd.subtitle}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {pd.features.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0',
                    borderBottom: i < pd.features.length - 1
                      ? `0.5px solid ${lt('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)', mode)}`
                      : 'none',
                  }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: f.dot, flexShrink: 0, marginTop: 5,
                    }} />
                    <span style={{
                      fontSize: 13, lineHeight: 1.5,
                      color: lt('rgba(28,28,30,0.62)', 'rgba(255,255,255,0.5)', mode),
                    }}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                <div style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 32, fontWeight: 900, letterSpacing: '-1.5px',
                  color: lt('#1c1c1e', '#fff', mode), transition: 'color 0.3s',
                }}>
                  {pd.price}
                  <span style={{ fontSize: 15, fontWeight: 400, opacity: 0.42 }}>/mo</span>
                </div>
                <div style={{
                  fontSize: 12, marginTop: 3,
                  color: lt('rgba(28,28,30,0.38)', 'rgba(255,255,255,0.3)', mode),
                }}>
                  {pd.annual}
                </div>
              </div>
            </div>

            {/* ── Right: form ── */}
            <div style={{ flex: 1, padding: '36px 36px 32px', minWidth: 0 }}>
              {PlanToggle}

              {/* STEP 1 — name + email */}
              {step === 'details' && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <label style={lbl}>First name</label>
                      <input
                        autoFocus
                        value={firstName}
                        onChange={(e) => { setFirstName(e.target.value); setError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                        placeholder="First"
                        style={inp()}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={lbl}>Last name</label>
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                        placeholder="Last"
                        style={inp()}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: error ? 8 : 20 }}>
                    <label style={lbl}>Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                      placeholder="you@company.com"
                      style={inp()}
                    />
                  </div>

                  {error && (
                    <p style={{ fontSize: 13, color: '#ff3b30', marginBottom: 14 }}>{error}</p>
                  )}

                  <button
                    onClick={handleContinue}
                    style={{
                      width: '100%', padding: 15, borderRadius: 100,
                      fontSize: 15, fontWeight: 700, border: 'none',
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                      background: firstName.trim() && email.trim() ? pd.cta
                        : lt('rgba(0,0,0,0.07)', 'rgba(255,255,255,0.07)', mode),
                      color: firstName.trim() && email.trim() ? '#fff'
                        : lt('rgba(0,0,0,0.28)', 'rgba(255,255,255,0.2)', mode),
                      boxShadow: firstName.trim() && email.trim()
                        ? `0 4px 18px ${pd.ctaShadow}` : 'none',
                    }}
                  >
                    Continue →
                  </button>

                  <p style={{
                    fontSize: 13, textAlign: 'center', marginTop: 18,
                    color: lt('rgba(28,28,30,0.4)', 'rgba(255,255,255,0.28)', mode),
                  }}>
                    Already have an account?{' '}
                    <Link href="/login" onClick={onClose}
                      style={{ color: '#ff3b30', fontWeight: 600, textDecoration: 'none' }}>
                      Log in →
                    </Link>
                  </p>
                </motion.div>
              )}

              {/* STEP 2 — password + confirm */}
              {step === 'password' && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Who you are recap */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 12, marginBottom: 20,
                    background: lt('rgba(0,0,0,0.03)', 'rgba(255,255,255,0.04)', mode),
                    border: `0.5px solid ${lt('rgba(0,0,0,0.07)', 'rgba(255,255,255,0.07)', mode)}`,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: pd.cta, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>
                      {firstName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 14, fontWeight: 500, margin: 0,
                        color: lt('#1c1c1e', '#fff', mode),
                      }}>
                        {firstName} {lastName}
                      </p>
                      <p style={{
                        fontSize: 12, margin: 0, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: lt('rgba(28,28,30,0.45)', 'rgba(255,255,255,0.35)', mode),
                      }}>
                        {email}
                      </p>
                    </div>
                    <button
                      onClick={() => { setStep('details'); setError(''); }}
                      style={{
                        background: 'none', border: 'none', fontSize: 12,
                        cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                        color: lt('rgba(28,28,30,0.4)', 'rgba(255,255,255,0.32)', mode),
                      }}
                    >
                      Edit
                    </button>
                  </div>

                  {/* Business name */}
                  {plan === 'business' && (
                    <div style={{ marginBottom: 14 }}>
                      <label style={lbl}>Business name</label>
                      <input
                        autoFocus
                        value={bizName}
                        onChange={(e) => setBizName(e.target.value)}
                        placeholder="Acme Inc. (optional)"
                        style={inp()}
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div style={{ marginBottom: 10 }}>
                    <PwField
                      label="Create password"
                      value={password}
                      onChange={(v) => { setPassword(v); setError(''); }}
                      show={showPw}
                      onToggle={() => setShowPw(s => !s)}
                      placeholder="8+ characters"
                      mode={mode}
                    />
                    {password.length > 0 && !pwValid && (
                      <p style={{ fontSize: 12, color: '#ff9500', marginTop: 5 }}>
                        Use at least 8 characters
                      </p>
                    )}
                  </div>

                  {/* Confirm */}
                  <div style={{ marginBottom: 4 }}>
                    <PwField
                      label="Confirm password"
                      value={confirmPw}
                      onChange={(v) => { setConfirmPw(v); setError(''); }}
                      show={showConfirm}
                      onToggle={() => setShowConfirm(s => !s)}
                      placeholder="Repeat your password"
                      mode={mode}
                      onEnter={canSubmit ? handleStartTrial : undefined}
                    />
                    {confirmPw.length > 0 && !pwMatch && (
                      <p style={{ fontSize: 12, color: '#ff3b30', marginTop: 5 }}>
                        Passwords don't match
                      </p>
                    )}
                    {confirmPw.length > 0 && pwMatch && pwValid && (
                      <p style={{ fontSize: 12, color: '#1a7a35', marginTop: 5 }}>
                        ✓ Passwords match
                      </p>
                    )}
                  </div>

                  {/* Next step note */}
                  <div style={{
                    padding: '13px 16px', borderRadius: 14, margin: '16px 0 14px',
                    background: lt('rgba(0,0,0,0.03)', 'rgba(255,255,255,0.04)', mode),
                    border: `0.5px solid ${lt('rgba(0,0,0,0.07)', 'rgba(255,255,255,0.07)', mode)}`,
                  }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, marginBottom: 4,
                      color: lt('rgba(28,28,30,0.7)', 'rgba(255,255,255,0.6)', mode),
                    }}>
                      Next: secure card entry via Stripe
                    </p>
                    <p style={{
                      fontSize: 13, lineHeight: 1.55, margin: 0,
                      color: lt('rgba(28,28,30,0.45)', 'rgba(255,255,255,0.35)', mode),
                    }}>
                      7 days free — card saved, not charged until day 8. Cancel any time before then.
                    </p>
                  </div>

                  {error && (
                    <p style={{ fontSize: 13, color: '#ff3b30', marginBottom: 12 }}>{error}</p>
                  )}

                  <button
                    onClick={handleStartTrial}
                    disabled={loading || !canSubmit}
                    style={{
                      width: '100%', padding: 15, borderRadius: 100,
                      fontSize: 15, fontWeight: 700, border: 'none',
                      cursor: loading ? 'wait' : canSubmit ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', transition: 'all 0.2s', marginBottom: 10,
                      background: canSubmit && !loading ? pd.cta
                        : lt('rgba(0,0,0,0.07)', 'rgba(255,255,255,0.07)', mode),
                      color: canSubmit && !loading ? '#fff'
                        : lt('rgba(0,0,0,0.25)', 'rgba(255,255,255,0.2)', mode),
                      boxShadow: canSubmit && !loading ? `0 4px 18px ${pd.ctaShadow}` : 'none',
                    }}
                  >
                    {loading ? 'Redirecting to checkout…' : 'Start 7-day trial →'}
                  </button>

                  <p style={{
                    fontSize: 12, textAlign: 'center',
                    color: lt('rgba(28,28,30,0.32)', 'rgba(255,255,255,0.22)', mode),
                  }}>
                    Cancel before day 8 — pay nothing.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`@keyframes gcRainbow { to { background-position: 200% center; } }`}</style>
    </AnimatePresence>
  );
}