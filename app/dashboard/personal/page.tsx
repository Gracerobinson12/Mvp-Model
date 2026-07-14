// @ts-nocheck
/* eslint-disable */
'use client';

/**
 * app/dashboard/personal/page.tsx
 * Individual plan dashboard — spider layout, iOS 27 glass, blue tones
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

// ── Help Modal ────────────────────────────────────────────────
function HelpModal({ onClose, userEmail, mode }) {
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState('');

  const D   = mode === 'dark';
  const ink = D ? '#fff' : '#1c1c1e';
  const ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(28,28,30,0.5)';
  const inp: any = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
    background: D ? 'rgba(255,255,255,0.07)' : 'rgba(120,120,128,0.08)',
    border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    color: ink, transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  const handleSubmit = async () => {
    if (!subject) { setError('Choose a subject.'); return; }
    if (!message.trim()) { setError('Enter your message.'); return; }
    setLoading(true); setError('');
    try {
      await supabase.from('support_tickets').insert({
        email: userEmail, subject, message,
        status: 'open', created_at: new Date().toISOString(),
      });
      // Also send email via your API route (wire up later)
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, subject, message }),
      }).catch(() => {});
      setSent(true);
    } catch { setError('Something went wrong. Email us at support@gratiacore.com'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 'min(440px,calc(100vw - 32px))',
        background: D ? 'rgba(14,14,22,0.98)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
        border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'}`,
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.2)',
      }}>
        {/* Rainbow trim */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#34aadc,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowAnim 3s linear infinite' }} />
        <div style={{ padding: '24px 26px 22px' }}>
          {!sent ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: ink, letterSpacing: '-0.4px', marginBottom: 2 }}>Get help</h2>
                  <p style={{ fontSize: 12, color: ink2 }}>We typically respond within a few hours.</p>
                </div>
                <button onClick={onClose} style={{ background: D ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', color: ink2, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink2, marginBottom: 6 }}>Subject</p>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={{ ...inp, marginBottom: 12, appearance: 'none' }}>
                <option value="">Select a topic…</option>
                <option value="Billing issue">Billing issue</option>
                <option value="Can't access my account">Can't access my account</option>
                <option value="Feature not working">Feature not working</option>
                <option value="Feature request">Feature request</option>
                <option value="Other">Other</option>
              </select>

              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink2, marginBottom: 6 }}>Message</p>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what's going on…" rows={4} style={{ ...inp, resize: 'vertical', marginBottom: error ? 6 : 14 }} />
              {error && <p style={{ fontSize: 12, color: '#ff3b30', marginBottom: 10 }}>{error}</p>}

              <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: 13, borderRadius: 100, background: 'linear-gradient(135deg,#0a84ff,#34aadc)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(10,132,255,0.3)', marginBottom: 10 }}>
                {loading ? 'Sending…' : 'Send message →'}
              </button>
              <p style={{ fontSize: 11, textAlign: 'center', color: ink2 }}>
                Or email us directly: <a href="mailto:support@gratiacore.com" style={{ color: '#0a84ff', fontWeight: 600, textDecoration: 'none' }}>support@gratiacore.com</a>
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: ink, marginBottom: 6 }}>Message sent</h2>
              <p style={{ fontSize: 13, color: ink2, lineHeight: 1.6, marginBottom: 18 }}>We'll get back to <strong style={{ color: ink }}>{userEmail}</strong> shortly.</p>
              <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 100, background: 'linear-gradient(135deg,#0a84ff,#34aadc)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Notification bell ─────────────────────────────────────────
function NotifBell({ mode, ink }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const D = mode === 'dark';

  const NOTIFS = [
    { icon: '🎉', title: 'Welcome to Gratia Core', body: 'Your Individual plan is active. Seal your first idea to get started.', time: 'Just now', read: false },
    { icon: '🔒', title: 'Trial started', body: '7 days free — card not charged until day 8.', time: '1 min ago', read: false },
    { icon: '📬', title: 'Confirm your email', body: 'Check your inbox to verify your email address.', time: '2 min ago', read: true },
  ];
  const unread = NOTIFS.filter(n => !n.read).length;

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const ddBg  = D ? 'rgba(14,14,22,0.98)' : 'rgba(255,255,255,0.98)';
  const ddBdr = D ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const ink2  = D ? 'rgba(255,255,255,0.45)' : 'rgba(28,28,30,0.5)';
  const sep   = D ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} aria-label="Notifications" style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        {unread > 0 && <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: '#ff3b30' }} />}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 290, background: ddBg, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: `1px solid ${ddBdr}`, borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.15)', zIndex: 200, overflow: 'hidden', animation: 'ddOpen 0.18s ease' }}>
          <div style={{ padding: '12px 14px', borderBottom: `0.5px solid ${sep}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: D ? '#fff' : '#1c1c1e' }}>Notifications</span>
            {unread > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#ff3b30' }}>{unread} new</span>}
          </div>
          {NOTIFS.map((n, i) => (
            <div key={i} style={{ padding: '11px 14px', borderBottom: i < NOTIFS.length - 1 ? `0.5px solid ${sep}` : 'none', background: n.read ? 'transparent' : D ? 'rgba(10,132,255,0.05)' : 'rgba(10,132,255,0.03)', display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: D ? '#fff' : '#1c1c1e', margin: '0 0 2px', lineHeight: 1.3 }}>{n.title}</p>
                <p style={{ fontSize: 11, color: ink2, margin: '0 0 3px', lineHeight: 1.4 }}>{n.body}</p>
                <p style={{ fontSize: 10, color: D ? 'rgba(255,255,255,0.25)' : 'rgba(28,28,30,0.3)', margin: 0 }}>{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────
export default function PersonalDashboard() {
  const router = useRouter();
  const [user,       setUser]       = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [mode,       setMode]       = useState('light');
  const [activeNode, setActiveNode] = useState('vault');
  const [showHelp,   setShowHelp]   = useState(false);
  const [svgLines,   setSvgLines]   = useState([]);

  const canvasRef = useRef(null);
  const nodeRefs  = useRef({});

  useEffect(() => {
    const saved = localStorage.getItem('gc_dash_mode');
    if (saved) setMode(saved);
  }, []);
  useEffect(() => { localStorage.setItem('gc_dash_mode', mode); }, [mode]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUser(user);

      // If coming back from Stripe, verify + update profile first
      const sessionId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('session_id')
        : null;

      if (sessionId) {
        try {
          await fetch('/api/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, userId: user.id }),
          });
          // Clean URL — remove session_id from address bar
          window.history.replaceState({}, '', '/dashboard/personal');
        } catch (e) {
          console.error('Session verification failed', e);
        }
      }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) setProfile(prof);
      await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);
      setLoading(false);
    };
    init();
  }, [router]);

  const signOut = async () => { await supabase.auth.signOut(); router.push('/'); };

  const drawLines = useCallback(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const lines = Object.entries(nodeRefs.current).map(([id, el]) => {
      if (!el) return null;
      const nr = el.getBoundingClientRect();
      return { id, x1: cx, y1: cy, x2: (nr.left - rect.left) + nr.width / 2, y2: (nr.top - rect.top) + nr.height / 2 };
    }).filter(Boolean);
    setSvgLines(lines);
  }, []);

  useEffect(() => {
    const t = setTimeout(drawLines, 150);
    window.addEventListener('resize', drawLines);
    return () => { clearTimeout(t); window.removeEventListener('resize', drawLines); };
  }, [drawLines, loading]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: mode === 'dark' ? '#08080f' : '#e8eef5', fontFamily: "'DM Sans',sans-serif", color: 'rgba(28,28,30,0.4)', fontSize: 13 }}>Loading your dashboard…</div>;

  // ── Derived values ────────────────────────────────────────
  const D           = mode === 'dark';
  const displayName = profile?.first_name || profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const initial     = (profile?.first_name?.[0] || user?.email?.[0] || 'G').toUpperCase();
  const email       = user?.email ?? '';
  const createdAt   = profile?.created_at ? new Date(profile.created_at).getTime() : Date.now();
  const accountAgeDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  const isActive    =
    profile?.plan_status === 'active' ||
    profile?.plan_status === 'trialing' ||
    !!profile?.stripe_customer_id ||
    accountAgeDays < 8;
  const onTrial     = profile?.plan_status === 'trialing' || accountAgeDays < 8;
  let daysLeft      = null;
  if (profile?.trial_ends_at) {
    const end = new Date(profile.trial_ends_at);
    if (end > new Date()) daysLeft = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  } else {
    daysLeft = Math.max(0, Math.ceil(8 - accountAgeDays));
  }
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const lastLogin = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ── Theme ─────────────────────────────────────────────────
  const bg       = D ? '#08080f' : '#e8eef5';
  const bgMesh   = D
    ? 'radial-gradient(ellipse 70% 60% at 20% -10%,rgba(10,132,255,0.15) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 110%,rgba(52,170,220,0.1) 0%,transparent 60%)'
    : 'radial-gradient(ellipse 80% 60% at 15% -10%,rgba(10,132,255,0.18) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 85% 110%,rgba(52,170,220,0.14) 0%,transparent 60%),radial-gradient(ellipse 40% 30% at 10% 80%,rgba(48,209,88,0.08) 0%,transparent 50%)';
  const ink      = D ? '#fff' : '#1c1c1e';
  const ink2     = D ? 'rgba(255,255,255,0.5)' : 'rgba(28,28,30,0.5)';
  const ink3     = D ? 'rgba(255,255,255,0.28)' : 'rgba(28,28,30,0.32)';
  const glass    = D ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)';
  const glassBdr = D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.82)';
  const glowIn   = D ? '0 2px 0 rgba(255,255,255,0.06) inset' : '0 2px 0 rgba(255,255,255,0.92) inset';
  const glShadow = D ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.07)';
  const sep      = D ? 'rgba(255,255,255,0.08)' : 'rgba(28,28,46,0.07)';
  const panelBg  = D ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)';
  const headerBg = D ? 'rgba(8,8,15,0.85)' : 'rgba(255,255,255,0.55)';
  const itemBg   = D ? 'rgba(255,255,255,0.05)' : 'rgba(28,28,46,0.03)';
  const itemBdr  = D ? 'rgba(255,255,255,0.08)' : 'rgba(28,28,46,0.07)';

  // ── Node config — Option E: 3D floating badge ────────────────
  const NODES = {
    vault:    { emoji: '💡', label: 'Ideas vault',  color: '#0a84ff', shadow: '#0056b3', grad: 'linear-gradient(135deg,#0a84ff,#34aadc)', glow: 'rgba(10,132,255,0.4)',  beamGrad: ['rgba(10,132,255,0)', 'rgba(10,132,255,0.65)', 'rgba(10,132,255,0)'],  nodeBg: D ? 'rgba(10,132,255,0.18)' : 'rgba(10,132,255,0.12)', style: { top: '12%', left: '12%'  } },
    barter:   { emoji: '🤝', label: 'Barter',       color: '#30d158', shadow: '#0d5c28', grad: 'linear-gradient(135deg,#30d158,#1a7a35)', glow: 'rgba(48,209,88,0.4)',   beamGrad: ['rgba(48,209,88,0)', 'rgba(48,209,88,0.55)', 'rgba(48,209,88,0)'],     nodeBg: D ? 'rgba(48,209,88,0.15)'  : 'rgba(48,209,88,0.1)',  style: { top: '12%', right: '15%' } },
    duty:     { emoji: '⚓', label: 'Sample duty',  color: '#ff9500', shadow: '#7a4200', grad: 'linear-gradient(135deg,#ff9500,#ff6b00)', glow: 'rgba(255,149,0,0.4)',   beamGrad: ['rgba(255,149,0,0)', 'rgba(255,149,0,0.55)', 'rgba(255,149,0,0)'],     nodeBg: D ? 'rgba(255,149,0,0.15)'  : 'rgba(255,149,0,0.1)',  style: { bottom: '22%', left: '9%' } },
    settings: { emoji: '⚙️', label: 'Settings',     color: '#ff3b30', shadow: '#8b1a14', grad: 'linear-gradient(135deg,#ff3b30,#ff6b35)', glow: 'rgba(255,59,48,0.4)',   beamGrad: ['rgba(255,59,48,0)', 'rgba(255,59,48,0.45)', 'rgba(255,59,48,0)'],      nodeBg: D ? 'rgba(255,59,48,0.12)'  : 'rgba(255,59,48,0.08)', style: { bottom: '22%', right: '12%'} },
    billing:  { emoji: '💳', label: 'Billing',      color: '#636366', shadow: '#3a3a3c', grad: 'rgba(28,28,46,0.12)', glow: 'rgba(28,28,46,0.2)', beamGrad: D ? ['rgba(255,255,255,0)','rgba(255,255,255,0.25)','rgba(255,255,255,0)'] : ['rgba(52,170,220,0)','rgba(52,170,220,0.3)','rgba(52,170,220,0)'], nodeBg: D ? 'rgba(255,255,255,0.07)' : 'rgba(28,28,46,0.07)', style: { top: '47%', left: '5%'   } },
  };

  // ── Panel content ─────────────────────────────────────────
  const pCard = (extra: any = {}) => ({ background: itemBg, border: `0.5px solid ${itemBdr}`, borderRadius: 11, padding: '10px 12px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', ...extra });

  const renderPanel = () => {
    if (activeNode === 'vault') return (
      <div>
        <div style={{ background: D ? 'rgba(10,132,255,0.12)' : 'rgba(10,132,255,0.08)', border: `1px solid ${D ? 'rgba(10,132,255,0.25)' : 'rgba(10,132,255,0.16)'}`, borderRadius: 16, padding: 14, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -24, right: -24, width: 90, height: 90, borderRadius: '50%', background: 'rgba(10,132,255,0.1)', pointerEvents: 'none' }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: '#0a84ff', marginBottom: 4 }}>👋 Welcome, {displayName}</p>
          <p style={{ fontSize: 11, color: ink2, lineHeight: 1.55 }}>Seal your first idea below — 30 seconds, timestamped proof forever.</p>
        </div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3, marginBottom: 8 }}>Get started · 0 of 3</p>
        <div style={{ marginBottom: 14 }}>
          {[
            { label: 'Seal your first idea', color: '#0a84ff', active: true },
            { label: 'Browse barter exchange', color: ink3, active: false },
            { label: 'Try a duty lookup', color: ink3, active: false },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', background: item.active ? D ? 'rgba(10,132,255,0.08)' : 'rgba(10,132,255,0.05)' : itemBg, border: `0.5px solid ${item.active ? D ? 'rgba(10,132,255,0.2)' : 'rgba(10,132,255,0.14)' : itemBdr}`, borderRadius: 10, cursor: 'pointer', marginBottom: 5, opacity: item.active ? 1 : 0.55 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${item.active ? '#0a84ff' : ink3}`, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: item.active ? '#0a84ff' : ink2, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
            </div>
          ))}
        </div>
        <button onClick={() => router.push('/dashboard/vault')} style={{ width: '100%', padding: 12, borderRadius: 100, background: 'linear-gradient(135deg,#0a84ff,#34aadc)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(10,132,255,0.32), inset 0 1px 0 rgba(255,255,255,0.25)', marginBottom: 8 }}>
          + Seal an idea →
        </button>
        <p style={{ fontSize: 11, textAlign: 'center', color: ink3 }}>Card saved · trial ends in {daysLeft ?? '7'} days</p>
      </div>
    );

    if (activeNode === 'barter') return (
      <div>
        <div style={{ textAlign: 'center', padding: '16px 0 12px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
          <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: ink, marginBottom: 5, letterSpacing: '-0.3px' }}>Start your first trade</p>
          <p style={{ fontSize: 12, color: ink2, lineHeight: 1.6, marginBottom: 14 }}>Swap services with verified partners. Every deal is countersigned — no handshake agreements.</p>
          <button onClick={() => router.push('/dashboard/barter')} style={{ padding: '10px 22px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(48,209,88,0.3)' }}>Browse trades →</button>
        </div>
        <div style={{ height: '0.5px', background: sep, margin: '12px 0' }} />
        {['Logo design ↔ SEO audit', 'Dev work ↔ Copywriting', 'Photography ↔ Social media'].map((s, i) => (
          <div key={i} style={pCard()}>
            <span style={{ fontSize: 14 }}>🤝</span>
            <span style={{ fontSize: 12, color: ink2 }}>{s}</span>
          </div>
        ))}
      </div>
    );

    if (activeNode === 'duty') return (
      <div>
        <div style={{ textAlign: 'center', padding: '16px 0 12px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚓</div>
          <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: ink, marginBottom: 5, letterSpacing: '-0.3px' }}>Sample duty lookup</p>
          <p style={{ fontSize: 12, color: ink2, lineHeight: 1.6, marginBottom: 14 }}>Know your customs cost before ordering from Alibaba. No more surprise fees at the door.</p>
          <button onClick={() => router.push('/dashboard/duty')} style={{ padding: '10px 22px', borderRadius: 100, background: 'linear-gradient(135deg,#ff9500,#ff6b00)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(255,149,0,0.3)' }}>New lookup →</button>
        </div>
        <div style={{ height: '0.5px', background: sep, margin: '12px 0' }} />
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3, marginBottom: 8 }}>What you'll enter</p>
        {['Product category (e.g. ceramic mugs)', 'Origin country (e.g. China)', 'Destination: United States (default)'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff9500', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: ink2 }}>{s}</span>
          </div>
        ))}
      </div>
    );

    if (activeNode === 'settings') return (
      <div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3, marginBottom: 10 }}>Account settings</p>
        {[
          { emoji: '👤', label: 'Profile',            sub: 'Name, email, state',         href: '/dashboard/settings' },
          { emoji: '🔔', label: 'Notifications',      sub: 'Email alerts & digests',     href: '/dashboard/settings' },
          { emoji: '🔒', label: 'Password & security', sub: 'Change password, sessions', href: '/dashboard/settings' },
          { emoji: '🌗', label: 'Appearance',         sub: mode === 'dark' ? 'Dark mode on' : 'Light mode on', action: () => setMode(m => m === 'dark' ? 'light' : 'dark') },
        ].map((item, i) => (
          <div key={i} onClick={item.action ?? (() => router.push(item.href))} style={pCard()}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.emoji}</span>
            <div><p style={{ fontSize: 12, fontWeight: 600, color: ink, margin: 0 }}>{item.label}</p><p style={{ fontSize: 10, color: ink3, margin: 0 }}>{item.sub}</p></div>
          </div>
        ))}
        <div style={{ height: '0.5px', background: sep, margin: '8px 0' }} />
        <div onClick={signOut} style={pCard({ background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.18)' })}>
          <span style={{ fontSize: 18 }}>🚪</span>
          <div><p style={{ fontSize: 12, fontWeight: 600, color: '#ff3b30', margin: 0 }}>Sign out</p><p style={{ fontSize: 10, color: ink3, margin: 0 }}>{email}</p></div>
        </div>
        <div onClick={() => router.push('/dashboard/settings')} style={pCard({ background: 'rgba(255,59,48,0.04)', border: '0.5px solid rgba(255,59,48,0.1)', justifyContent: 'center', marginTop: 4 })}>
          <p style={{ fontSize: 11, color: 'rgba(255,59,48,0.55)', margin: 0 }}>Delete account</p>
        </div>
      </div>
    );

    if (activeNode === 'billing') return (
      <div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3, marginBottom: 10 }}>Your billing</p>
        <div style={{ background: D ? 'rgba(10,132,255,0.1)' : 'rgba(10,132,255,0.07)', border: '0.5px solid rgba(10,132,255,0.2)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0a84ff' }}>Individual plan</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#30d158' : '#ff3b30' }}>{onTrial ? `${daysLeft}d trial` : isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: ink, margin: '0 0 3px' }}>$19<span style={{ fontSize: 13, fontWeight: 400, opacity: 0.4 }}>/mo</span></p>
          {onTrial && <p style={{ fontSize: 11, color: '#ff9500', margin: 0 }}>Card not charged until day 8</p>}
        </div>
        {[{ label: 'Payment method', val: 'Visa ···· 4242', emoji: '💳' }, { label: 'Billing email', val: email, emoji: '📧' }].map((item, i) => (
          <div key={i} style={pCard()}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{item.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: 11, color: ink3, margin: 0 }}>{item.label}</p><p style={{ fontSize: 12, fontWeight: 600, color: ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.val}</p></div>
          </div>
        ))}
        <Link href="/pricing" style={{ display: 'block', textAlign: 'center', padding: 10, background: 'linear-gradient(135deg,#0a84ff,#34aadc)', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#fff', textDecoration: 'none', marginTop: 8, boxShadow: '0 4px 12px rgba(10,132,255,0.28)' }}>
          Upgrade to Business →
        </Link>
      </div>
    );
    return null;
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow:hidden}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes beamPulse{0%,100%{opacity:0.25;}50%{opacity:0.88;}}
        @keyframes hubGlow{0%,100%{box-shadow:0 0 0 6px rgba(255,59,48,0.07),0 4px 24px rgba(255,59,48,0.28);}50%{box-shadow:0 0 0 14px rgba(255,59,48,0.04),0 4px 32px rgba(255,59,48,0.42);}}
        @keyframes dotPulse{0%,100%{opacity:1;}50%{opacity:0.25;}}
        @keyframes rainbowAnim{to{background-position:200% center;}}
        @keyframes ddOpen{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes panelIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes feedIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .gc-node{cursor:pointer;transition:transform 0.2s;}
        .gc-node:hover{transform:scale(1.08);}
      `}</style>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: bg, backgroundImage: bgMesh, color: ink, fontFamily: "'DM Sans',sans-serif", transition: 'background 0.3s,color 0.2s', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <header style={{ flexShrink: 0, height: 52, background: headerBg, backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', borderBottom: `0.5px solid ${sep}`, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 10, zIndex: 100, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#34aadc,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowAnim 3s linear infinite' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <GCIcon size={24} />
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: -0.3, color: ink }}>Gratia Core</span>
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            {[{ label: 'ideas', color: '#0a84ff', bg: D ? 'rgba(10,132,255,0.15)' : 'rgba(10,132,255,0.1)', bdr: D ? 'rgba(10,132,255,0.25)' : 'rgba(10,132,255,0.18)' }, { label: 'trades', color: '#1a7a35', bg: D ? 'rgba(48,209,88,0.1)' : 'rgba(48,209,88,0.07)', bdr: D ? 'rgba(48,209,88,0.2)' : 'rgba(48,209,88,0.12)' }, { label: 'lookups', color: '#b45309', bg: D ? 'rgba(255,149,0,0.1)' : 'rgba(255,149,0,0.07)', bdr: D ? 'rgba(255,149,0,0.2)' : 'rgba(255,149,0,0.15)' }].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3, background: s.bg, border: `0.5px solid ${s.bdr}`, borderRadius: 100, padding: '3px 8px' }}>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 900, color: s.color }}>0</span>
                <span style={{ fontSize: 10, color: ink3 }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Trial / active status pill */}
          {isActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: onTrial ? D ? 'rgba(255,149,0,0.12)' : 'rgba(255,149,0,0.1)' : D ? 'rgba(48,209,88,0.12)' : 'rgba(48,209,88,0.1)', border: `0.5px solid ${onTrial ? 'rgba(255,149,0,0.25)' : 'rgba(48,209,88,0.25)'}`, borderRadius: 100, padding: '4px 10px', flexShrink: 0 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: onTrial ? '#ff9500' : '#30d158', animation: 'dotPulse 1.5s ease infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: onTrial ? '#b45309' : '#1a7a35' }}>
                {onTrial ? `${daysLeft}d left in trial` : 'Active ✓'}
              </span>
            </div>
          )}

          {/* Help */}
          <button onClick={() => setShowHelp(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: D ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', border: `0.5px solid ${glassBdr}`, borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ink3} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill={ink3}/></svg>
            <span style={{ fontSize: 11, color: ink3, fontWeight: 500 }}>Help</span>
          </button>

          {/* Notifications */}
          <NotifBell mode={mode} ink={ink} />

          {/* Dark/light toggle */}
          <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} style={{ background: D ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)', border: `0.5px solid ${glassBdr}`, borderRadius: 100, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {D ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ink3} strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ink3} strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            <span style={{ fontSize: 11, color: ink3, fontWeight: 500 }}>{D ? 'Light' : 'Dark'}</span>
          </button>

          {/* Avatar */}
          <div onClick={() => setActiveNode('settings')} style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#0a84ff,#34aadc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', border: `2px solid ${glassBdr}`, cursor: 'pointer', boxShadow: '0 2px 8px rgba(10,132,255,0.28)', flexShrink: 0 }}>
            {initial}
          </div>
        </header>

        {/* ── No subscription banner ── */}
        {!isActive && (
          <div style={{ flexShrink: 0, background: 'rgba(255,59,48,0.08)', borderBottom: '0.5px solid rgba(255,59,48,0.2)', padding: '8px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#cc2018', fontWeight: 600 }}>Your trial has ended — subscribe to keep access</span>
            <button onClick={() => setActiveNode('billing')} style={{ padding: '5px 14px', background: '#ff3b30', color: '#fff', border: 'none', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Subscribe →</button>
          </div>
        )}

        {/* ── Spider + panel ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Canvas */}
          <div ref={canvasRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              <defs>
                {Object.entries(NODES).map(([id, n]) => (
                  <linearGradient key={id} id={`beam-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    {n.beamGrad.map((c, i) => <stop key={i} offset={i === 0 ? '0%' : i === 1 ? '50%' : '100%'} stopColor={c} />)}
                  </linearGradient>
                ))}
              </defs>
              {svgLines.map(({ id, x1, y1, x2, y2 }, i) => {
                const len = Math.hypot(x2 - x1, y2 - y1);
                const active = activeNode === id;
                return (
                  <g key={id}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={D ? 'rgba(255,255,255,0.05)' : 'rgba(28,28,46,0.06)'} strokeWidth="1" />
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#beam-${id})`} strokeWidth={active ? 2.5 : 1.5} strokeDasharray={`65 ${Math.max(len - 65, 10)}`} style={{ animation: `beamPulse 2.2s linear infinite ${i * 0.38}s`, opacity: active ? 1 : 0.45 }} />
                  </g>
                );
              })}
            </svg>

            {/* Hub */}
            <div onClick={() => setActiveNode(null)} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 20, textAlign: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: 22, background: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Arial Black',Arial,sans-serif", fontSize: 20, fontWeight: 900, color: '#fff', animation: 'hubGlow 3s ease-in-out infinite', border: '2px solid rgba(255,255,255,0.4)', cursor: 'pointer', boxShadow: '0 4px 24px rgba(255,59,48,0.4)', position: 'relative', margin: '0 auto' }}>
                GC
                <div style={{ position: 'absolute', top: 4, left: 6, right: 6, height: 26, borderRadius: '10px 10px 0 0', background: 'linear-gradient(180deg,rgba(255,255,255,0.3) 0%,rgba(255,255,255,0) 100%)', pointerEvents: 'none' }} />
              </div>
              <p style={{ fontSize: 10, color: ink3, marginTop: 5, fontWeight: 500 }}>{greeting}, {displayName}</p>
              <p style={{ fontSize: 9, color: D ? 'rgba(255,255,255,0.18)' : 'rgba(28,28,46,0.2)', marginTop: 1 }}>Last login · {lastLogin}</p>
            </div>

            {/* Nodes — Option E: 3D floating badge */}
            {Object.entries(NODES).map(([id, n]) => (
              <div key={id} ref={el => nodeRefs.current[id] = el} className="gc-node" onClick={() => setActiveNode(id)} style={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, ...n.style }}>
                {/* 3D badge */}
                <div style={{ position: 'relative', width: id === 'billing' ? 46 : 56, height: id === 'billing' ? 50 : 60 }}>
                  {/* Shadow/depth layer */}
                  <div style={{ position: 'absolute', bottom: 0, left: 3, right: 3, height: id === 'billing' ? 42 : 52, borderRadius: id === 'billing' ? 12 : 16, background: n.shadow }} />
                  {/* Main card (lifted) */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: id === 'billing' ? 42 : 52,
                    borderRadius: id === 'billing' ? 12 : 16,
                    background: n.grad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: id === 'billing' ? 18 : 24,
                    border: '1px solid rgba(255,255,255,0.35)',
                    boxShadow: activeNode === id
                      ? `0 0 0 2px ${n.color}, 0 6px 20px ${n.glow}, inset 0 1px 0 rgba(255,255,255,0.4)`
                      : `0 4px 16px ${n.glow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                    transition: 'all 0.2s',
                  }}>
                    {n.emoji}
                    {/* Glass reflection */}
                    <div style={{ position: 'absolute', top: 3, left: 5, right: 5, height: 16, borderRadius: '8px 8px 0 0', background: 'linear-gradient(180deg,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0) 100%)', pointerEvents: 'none' }} />
                  </div>
                </div>
                <span style={{ fontSize: id === 'billing' ? 9 : 10, fontWeight: 700, color: activeNode === id ? n.color : ink3, textAlign: 'center', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>{n.label}</span>
              </div>
            ))}
          </div>

          {/* Right panel */}
          <div style={{ width: 264, flexShrink: 0, background: panelBg, backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', borderLeft: `0.5px solid ${sep}`, padding: '18px 16px', overflowY: 'auto', zIndex: 50 }}>
            {activeNode ? (
              <div key={activeNode} style={{ animation: 'panelIn 0.22s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: NODES[activeNode]?.nodeBg, border: `0.5px solid ${D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{NODES[activeNode]?.emoji}</div>
                  <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: ink, letterSpacing: '-0.3px' }}>{NODES[activeNode]?.label}</p>
                </div>
                <div style={{ height: '0.5px', background: sep, marginBottom: 14 }} />
                {renderPanel()}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 6, paddingBottom: 40 }}>
                <div style={{ fontSize: 24, opacity: 0.2 }}>✦</div>
                <p style={{ fontSize: 12, color: ink3, lineHeight: 1.6 }}>Select a node<br />to open it here</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Activity feed ── */}
        <div style={{ flexShrink: 0, height: 52, background: headerBg, backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', borderTop: `0.5px solid ${sep}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, paddingRight: 14, borderRight: `0.5px solid ${sep}` }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#30d158', animation: 'dotPulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink3 }}>Live activity</span>
          </div>
          <div style={{ display: 'flex', gap: 18, overflow: 'hidden', flex: 1 }}>
            {[
              { dot: '#ff3b30', text: 'Account created', meta: '· just now' },
              { dot: '#30d158', text: '7-day trial started', meta: '· card not charged' },
              { dot: D ? 'rgba(255,255,255,0.18)' : 'rgba(28,28,46,0.18)', text: 'Waiting for first idea to be sealed…', meta: '' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, animation: `feedIn 0.3s ease ${i * 0.1}s both` }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: i < 2 ? ink2 : ink3, fontWeight: i < 2 ? 500 : 400 }}>{item.text}</span>
                {item.meta && <span style={{ fontSize: 10, color: ink3 }}>{item.meta}</span>}
              </div>
            ))}
          </div>

          {/* ── Legal footer links ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, paddingLeft: 14, borderLeft: `0.5px solid ${sep}` }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={ink3} strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span style={{ fontSize: 10, color: ink3 }}>Data encrypted</span>
            <span style={{ fontSize: 10, color: D ? 'rgba(255,255,255,0.12)' : 'rgba(28,28,46,0.18)' }}>·</span>
            <Link href="/privacy"  style={{ fontSize: 10, color: ink3, textDecoration: 'none', transition: 'color 0.2s' }}>Privacy</Link>
            <Link href="/terms"    style={{ fontSize: 10, color: ink3, textDecoration: 'none', transition: 'color 0.2s' }}>Terms</Link>
            <Link href="/cookies"  style={{ fontSize: 10, color: ink3, textDecoration: 'none', transition: 'color 0.2s' }}>Cookies</Link>
            <a href="mailto:support@gratiacore.com" style={{ fontSize: 10, color: ink3, textDecoration: 'none' }}>Contact</a>
            <span style={{ fontSize: 10, color: ink3 }}>© {new Date().getFullYear()} Gratia Core</span>
          </div>
        </div>
      </div>

      {/* Help modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} userEmail={email} mode={mode} />}
    </>
  );
}