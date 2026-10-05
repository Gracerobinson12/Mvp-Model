'use client';
// @ts-nocheck
// app/report/page.tsx — lean report/ticket form. Saves to support_tickets + emails you (via /api/report).
// Linked from email templates ("didn't request this?") and from the dashboard.
// Works whether or not the person is logged in.

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 24 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

const TOPICS = ['Suspicious account activity', 'I didn\u2019t request an email change', 'I didn\u2019t request a password reset', 'Billing problem', 'A tool isn\u2019t working', 'Something else'];

export default function ReportPage() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (user?.email) setEmail(user.email); }); }, []);

  const submit = async () => {
    if (!email.includes('@')) { setError('Enter your email so we can follow up.'); return; }
    if (!subject) { setError('Pick what this is about.'); return; }
    if (!message.trim()) { setError('Tell us what happened.'); return; }
    setLoading(true); setError('');
    const ticket = { email: email.trim().toLowerCase(), subject, message: message.trim(), status: 'open' };
    try {
      // try the API route first (saves + emails you); fall back to a direct insert
      const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ticket) }).catch(() => null);
      if (!res || !res.ok) {
        const { error: dbErr } = await supabase.from('support_tickets').insert(ticket);
        if (dbErr) throw dbErr;
      }
      setSent(true);
    } catch { setError('Something went wrong. Email support@gratiacore.com directly.'); }
    finally { setLoading(false); }
  };

  const inp = { width: '100%', padding: '11px 14px', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1a1a2e', boxSizing: 'border-box', marginBottom: 12 };
  const lbl = { fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,0.5)', display: 'block', marginBottom: 5 };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}@keyframes rainbowShift{to{background-position:200% center}}`}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans',sans-serif", background: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.1) 0%,transparent 55%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)' }}>
        <div style={{ width: 'min(460px,100%)', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,0.92)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowShift 3s linear infinite' }} />
          <div style={{ padding: '26px 28px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><GCIcon size={22} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Gratia Core</span></div>
            {!sent ? (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#cc2018', marginBottom: 6 }}>Report</p>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 21, fontWeight: 900, letterSpacing: '-0.5px', color: '#1a1a2e', marginBottom: 6 }}>Report a problem</h1>
                <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.55)', lineHeight: 1.6, marginBottom: 20 }}>Suspicious activity, a change you didn&apos;t make, or anything wrong — tell us and we&apos;ll look into it fast.</p>

                <label style={lbl}>Your email</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@company.com" style={inp} />

                <label style={lbl}>What&apos;s this about?</label>
                <select value={subject} onChange={e => { setSubject(e.target.value); setError(''); }} style={{ ...inp, appearance: 'none' }}>
                  <option value="">Select…</option>
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <label style={lbl}>What happened?</label>
                <textarea value={message} onChange={e => { setMessage(e.target.value); setError(''); }} rows={4} placeholder="Describe what you saw…" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />

                {error && <p style={{ fontSize: 12, color: '#ff3b30', marginBottom: 12 }}>{error}</p>}

                <button onClick={submit} disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 100, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', boxShadow: '0 4px 16px rgba(255,59,48,0.35)' }}>{loading ? 'Sending…' : 'Submit report →'}</button>
                <p style={{ fontSize: 11, color: 'rgba(26,26,46,0.4)', textAlign: 'center', marginTop: 12 }}>We review every report. Urgent? Email support@gratiacore.com</p>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>✓</div>
                <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>Report received</h2>
                <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.55)', lineHeight: 1.6, marginBottom: 20 }}>Thanks — we&apos;ll review it and follow up at <strong style={{ color: '#1a1a2e' }}>{email}</strong> if we need more.</p>
                <Link href="/" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 100, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Back to home</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}