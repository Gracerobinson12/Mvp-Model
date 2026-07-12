'use client';
// @ts-nocheck

/**
 * app/dashboard/personal/page.tsx
 *
 * Individual plan dashboard — spider layout
 * Supabase auth + profiles table wired up
 *
 * Profiles table columns used:
 *   id, email, first_name, last_name, full_name,
 *   plan_status, selected_plan, trial_ends_at,
 *   stripe_customer_id, last_seen_at
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ── Brand icon ─────────────────────────────────────────────────
function GCIcon({ size = 28 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

// ── Module panel content ───────────────────────────────────────
function EmptyState({ icon, title, desc, cta, ctaColor, onCta, mode }) {
  const ink = mode === 'dark' ? 'rgba(255,255,255,0.85)' : '#1c1c1e';
  const ink2 = mode === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(28,28,30,0.5)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 12px' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14, fontFamily: "'Sora',sans-serif", fontWeight: 800, color: ink, letterSpacing: '-0.3px', marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 12, color: ink2, lineHeight: 1.6, marginBottom: 16 }}>{desc}</p>
      {cta && (
        <button onClick={onCta} style={{
          padding: '9px 18px', borderRadius: 100, border: 'none',
          background: ctaColor, color: '#fff', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: `0 4px 12px ${ctaColor}40`,
        }}>{cta}</button>
      )}
    </div>
  );
}

// ── Notification bell ──────────────────────────────────────────
function NotifBell({ notifications, mode, ink }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const ddBg = mode === 'dark' ? 'rgba(18,18,26,0.98)' : 'rgba(255,255,255,0.98)';
  const ddBdr = mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const ink2 = mode === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(28,28,30,0.5)';
  const sepClr = mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} aria-label="Notifications"
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#ff3b30' }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 280, background: ddBg,
          backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
          border: `1px solid ${ddBdr}`, borderRadius: 16,
          boxShadow: mode === 'dark' ? '0 16px 40px rgba(0,0,0,0.5)' : '0 16px 40px rgba(0,0,0,0.12)',
          zIndex: 200, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: `0.5px solid ${sepClr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: ink }}>Notifications</span>
            {unread > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#ff3b30' }}>{unread} new</span>}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 12, color: ink2 }}>No notifications yet</div>
          ) : (
            notifications.map((n, i) => (
              <div key={i} style={{
                padding: '11px 14px',
                borderBottom: i < notifications.length - 1 ? `0.5px solid ${sepClr}` : 'none',
                background: n.read ? 'transparent' : mode === 'dark' ? 'rgba(255,59,48,0.05)' : 'rgba(255,59,48,0.03)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: ink, margin: '0 0 2px', lineHeight: 1.4 }}>{n.title}</p>
                  <p style={{ fontSize: 11, color: ink2, margin: 0, lineHeight: 1.4 }}>{n.body}</p>
                  <p style={{ fontSize: 10, color: mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(28,28,30,0.3)', margin: '3px 0 0' }}>{n.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────
export default function PersonalDashboard() {
  const router = useRouter();

  const [user,       setUser]       = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [mode,       setMode]       = useState('dark');
  const [activeNode, setActiveNode] = useState('vault');
  const [svgLines,   setSvgLines]   = useState([]);

  const canvasRef = useRef(null);
  const nodeRefs  = useRef({});

  // ── Notifications (static — wire to Supabase later) ───────────
  const NOTIFICATIONS = [
    { icon: '🎉', title: 'Welcome to Gratia Core', body: 'Your Individual plan is active. Start by sealing your first idea.', time: 'Just now', read: false },
    { icon: '💡', title: 'Ideas vault ready', body: 'Seal concepts, pitches, or inventions with a timestamp before sharing.', time: '2 min ago', read: false },
    { icon: '🔒', title: 'Account secured', body: 'Your card is saved and will not be charged until day 8.', time: '5 min ago', read: true },
  ];

  // ── Mode persistence ──────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('gc_dash_mode');
    if (saved) setMode(saved);
  }, []);
  useEffect(() => { localStorage.setItem('gc_dash_mode', mode); }, [mode]);

  // ── Auth + profile ────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUser(user);

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) setProfile(prof);

      // Update last seen
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id);

      setLoading(false);
    };
    init();
  }, [router]);

  // ── Sign out ──────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // ── Draw SVG beams after mount / resize ──────────────────────
  const drawLines = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const cx     = rect.width / 2;
    const cy     = rect.height / 2;

    const lines = Object.entries(nodeRefs.current).map(([id, el]) => {
      if (!el) return null;
      const nr  = el.getBoundingClientRect();
      const nx  = (nr.left - rect.left) + nr.width / 2;
      const ny  = (nr.top  - rect.top)  + nr.height / 2;
      return { id, x1: cx, y1: cy, x2: nx, y2: ny };
    }).filter(Boolean);

    setSvgLines(lines);
  }, []);

  useEffect(() => {
    const timer = setTimeout(drawLines, 150);
    window.addEventListener('resize', drawLines);
    return () => { clearTimeout(timer); window.removeEventListener('resize', drawLines); };
  }, [drawLines, loading]);

  // ── Derived values ────────────────────────────────────────────
  const displayName = profile?.first_name
    || profile?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'there';
  const initial  = (profile?.first_name?.[0] || user?.email?.[0] || 'G').toUpperCase();
  const email    = user?.email ?? '';

  const isActive = profile?.plan_status === 'active' || profile?.plan_status === 'trialing' || !!profile?.stripe_customer_id;
  const onTrial  = profile?.plan_status === 'trialing';
  let daysLeft   = null;
  if (profile?.trial_ends_at) {
    const end = new Date(profile.trial_ends_at);
    if (end > new Date()) daysLeft = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
  }

  const lastLogin = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── Theme tokens ──────────────────────────────────────────────
  const D        = mode === 'dark';
  const bg       = D ? '#08080f' : '#eae6f2';
  const bgMesh   = D
    ? 'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(175,82,222,0.12) 0%,transparent 65%),radial-gradient(ellipse 50% 50% at 20% 80%,rgba(255,59,48,0.08) 0%,transparent 55%),radial-gradient(ellipse 50% 50% at 80% 20%,rgba(10,132,255,0.08) 0%,transparent 55%)'
    : 'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(175,82,222,0.1) 0%,transparent 65%),radial-gradient(ellipse 50% 50% at 20% 80%,rgba(255,59,48,0.07) 0%,transparent 55%)';
  const ink      = D ? '#fff'                        : '#1c1c1e';
  const ink2     = D ? 'rgba(255,255,255,0.5)'       : 'rgba(28,28,30,0.52)';
  const ink3     = D ? 'rgba(255,255,255,0.28)'      : 'rgba(28,28,30,0.35)';
  const glass    = D ? 'rgba(255,255,255,0.05)'      : 'rgba(255,255,255,0.55)';
  const glassBdr = D ? 'rgba(255,255,255,0.1)'       : 'rgba(255,255,255,0.8)';
  const headerBg = D ? 'rgba(8,8,15,0.85)'           : 'rgba(255,255,255,0.7)';
  const panelBg  = D ? 'rgba(255,255,255,0.04)'      : 'rgba(255,255,255,0.5)';
  const panelBdr = D ? 'rgba(255,255,255,0.08)'      : 'rgba(0,0,0,0.07)';
  const sepClr   = D ? 'rgba(255,255,255,0.08)'      : 'rgba(0,0,0,0.06)';
  const itemBg   = D ? 'rgba(255,255,255,0.05)'      : 'rgba(255,255,255,0.7)';
  const itemBdr  = D ? 'rgba(255,255,255,0.08)'      : 'rgba(0,0,0,0.06)';

  const card = (extra = {}) => ({
    background: glass,
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: `1px solid ${glassBdr}`,
    borderRadius: 20,
    boxShadow: D ? '0 2px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.3)' : '0 2px 0 rgba(255,255,255,0.9) inset, 0 8px 24px rgba(0,0,0,0.07)',
    ...extra,
  });

  // ── Node config ────────────────────────────────────────────────
  const NODES = {
    vault: {
      emoji: '💡', label: 'Ideas vault', color: '#af52de',
      nodeBg: D ? 'rgba(175,82,222,0.18)' : 'rgba(175,82,222,0.15)',
      beamColor: ['rgba(175,82,222,0)', 'rgba(175,82,222,0.7)', 'rgba(175,82,222,0)'],
      style: { top: '14%', left: '16%' },
    },
    barter: {
      emoji: '🤝', label: 'Barter', color: '#30d158',
      nodeBg: D ? 'rgba(48,209,88,0.15)' : 'rgba(48,209,88,0.12)',
      beamColor: ['rgba(48,209,88,0)', 'rgba(48,209,88,0.7)', 'rgba(48,209,88,0)'],
      style: { top: '14%', right: '16%' },
    },
    duty: {
      emoji: '⚓', label: 'Sample duty', color: '#ff9500',
      nodeBg: D ? 'rgba(255,149,0,0.15)' : 'rgba(255,149,0,0.12)',
      beamColor: ['rgba(255,149,0,0)', 'rgba(255,149,0,0.7)', 'rgba(255,149,0,0)'],
      style: { bottom: '18%', left: '12%' },
    },
    settings: {
      emoji: '⚙️', label: 'Settings', color: '#ff3b30',
      nodeBg: D ? 'rgba(255,59,48,0.12)' : 'rgba(255,59,48,0.1)',
      beamColor: ['rgba(255,59,48,0)', 'rgba(255,59,48,0.6)', 'rgba(255,59,48,0)'],
      style: { bottom: '18%', right: '12%' },
    },
    billing: {
      emoji: '💳', label: 'Billing', color: D ? 'rgba(255,255,255,0.5)' : 'rgba(28,28,30,0.4)',
      nodeBg: D ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.6)',
      beamColor: D
        ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']
        : ['rgba(28,28,30,0)', 'rgba(28,28,30,0.2)', 'rgba(28,28,30,0)'],
      style: { top: '50%', left: '5%', transform: 'translateY(-50%)' },
    },
  };

  // ── Panel content ──────────────────────────────────────────────
  const renderPanel = () => {
    const panelCard = (extra = {}) => ({
      background: itemBg,
      border: `0.5px solid ${itemBdr}`,
      borderRadius: 12,
      padding: '11px 13px',
      marginBottom: 7,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      ...extra,
    });

    if (activeNode === 'vault') return (
      <div>
        <EmptyState
          mode={mode}
          icon="💡"
          title="Seal your first idea"
          desc={"Timestamp a concept before you pitch it. If ownership's ever disputed, you have proof it was yours first."}
          cta="+ Seal an idea"
          ctaColor="#af52de"
          onCta={() => router.push('/dashboard/vault')}
        />
        <div style={{ height: '0.5px', background: sepClr, margin: '8px 0 14px' }} />
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3, marginBottom: 8 }}>How it works</p>
        {['Write your idea or upload a file', 'We timestamp it with an immutable record', "Share freely — you're covered"].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(175,82,222,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#af52de', flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 12, color: ink2, lineHeight: 1.4 }}>{s}</span>
          </div>
        ))}
      </div>
    );

    if (activeNode === 'barter') return (
      <div>
        <EmptyState
          mode={mode}
          icon="🤝"
          title="Start your first trade"
          desc="Swap services with verified partners. Every deal is digitally countersigned — no handshake agreements."
          cta="+ Browse trades"
          ctaColor="#1a7a35"
          onCta={() => router.push('/dashboard/barter')}
        />
        <div style={{ height: '0.5px', background: sepClr, margin: '8px 0 14px' }} />
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3, marginBottom: 8 }}>Examples</p>
        {['Logo design ↔ SEO audit', 'Copywriting ↔ Dev work', 'Photography ↔ Social media'].map((s, i) => (
          <div key={i} style={panelCard()}>
            <span style={{ fontSize: 14 }}>🤝</span>
            <span style={{ fontSize: 12, color: ink2 }}>{s}</span>
          </div>
        ))}
      </div>
    );

    if (activeNode === 'duty') return (
      <div>
        <EmptyState
          mode={mode}
          icon="⚓"
          title="Look up sample duty"
          desc="Know your customs cost before you order from Alibaba or any overseas supplier. No more surprise fees at the door."
          cta="+ New lookup"
          ctaColor="#ff9500"
          onCta={() => router.push('/dashboard/duty')}
        />
        <div style={{ height: '0.5px', background: sepClr, margin: '8px 0 14px' }} />
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3, marginBottom: 8 }}>What you enter</p>
        {['Product category (e.g. ceramic mugs)', 'Origin country (e.g. China)', 'Destination: United States'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff9500', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: ink2 }}>{s}</span>
          </div>
        ))}
      </div>
    );

    if (activeNode === 'settings') return (
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>Account settings</p>
        {[
          { icon: '👤', label: 'Profile', sub: 'Name, email, state', href: '/dashboard/settings/profile' },
          { icon: '🔔', label: 'Notifications', sub: 'Email alerts & digests', href: '/dashboard/settings/notifications' },
          { icon: '🔒', label: 'Password & security', sub: 'Change password, sessions', href: '/dashboard/settings/security' },
          { icon: '🌗', label: 'Appearance', sub: mode === 'dark' ? 'Currently dark mode' : 'Currently light mode', action: () => setMode(m => m === 'dark' ? 'light' : 'dark') },
        ].map((item, i) => (
          <div key={i} onClick={item.action ?? (() => router.push(item.href))}
            style={{ ...panelCard(), cursor: 'pointer' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: ink, margin: '0 0 1px' }}>{item.label}</p>
              <p style={{ fontSize: 11, color: ink3, margin: 0 }}>{item.sub}</p>
            </div>
          </div>
        ))}
        <div style={{ height: '0.5px', background: sepClr, margin: '8px 0' }} />
        <div onClick={signOut} style={{ ...panelCard({ background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.2)', cursor: 'pointer' }) }}>
          <span style={{ fontSize: 18 }}>🚪</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#ff3b30', margin: '0 0 1px' }}>Sign out</p>
            <p style={{ fontSize: 11, color: ink3, margin: 0 }}>{email}</p>
          </div>
        </div>
        <div style={{ ...panelCard({ background: 'rgba(255,59,48,0.04)', border: '0.5px solid rgba(255,59,48,0.12)', cursor: 'pointer', marginTop: 4 }), justifyContent: 'center' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,59,48,0.6)', margin: 0 }}>Delete account</p>
        </div>
      </div>
    );

    if (activeNode === 'billing') return (
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>Your billing</p>

        {/* Plan status */}
        <div style={{ background: 'rgba(175,82,222,0.1)', border: '0.5px solid rgba(175,82,222,0.2)', borderRadius: 14, padding: '14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#af52de' }}>Individual plan</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#30d158' : '#ff3b30' }}>
              {onTrial ? `${daysLeft}d trial` : isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p style={{ fontSize: 22, fontFamily: "'Sora',sans-serif", fontWeight: 900, letterSpacing: '-1px', color: ink, margin: '0 0 3px' }}>$19<span style={{ fontSize: 13, fontWeight: 400, opacity: 0.4 }}>/mo</span></p>
          {onTrial && <p style={{ fontSize: 11, color: '#ff9500', margin: 0 }}>Trial ends in {daysLeft} days — card not charged yet</p>}
          {!onTrial && isActive && <p style={{ fontSize: 11, color: ink3, margin: 0 }}>Next charge: Aug 7, 2026</p>}
        </div>

        {[
          { label: 'Payment method', val: 'Visa ···· 4242', icon: '💳' },
          { label: 'Billing email', val: email || 'Not set', icon: '📧' },
        ].map((item, i) => (
          <div key={i} style={panelCard()}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: ink3, margin: '0 0 1px' }}>{item.label}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.val}</p>
            </div>
          </div>
        ))}

        <Link href="/pricing" style={{ display: 'block', textAlign: 'center', padding: '10px', background: 'linear-gradient(135deg,#0a84ff,#34aadc)', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#fff', textDecoration: 'none', marginTop: 8, boxShadow: '0 4px 12px rgba(10,132,255,0.3)' }}>
          Upgrade to Business →
        </Link>

        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <a href="mailto:support@gratiacore.com" style={{ fontSize: 11, color: ink3, textDecoration: 'none' }}>Billing questions → support@gratiacore.com</a>
        </div>
      </div>
    );

    return null;
  };

  // ── Loading ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080f', fontFamily: "'DM Sans',sans-serif", color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
      Loading your dashboard…
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow:hidden}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}

        @keyframes beamFlow {
          0%   { stroke-dashoffset:400; opacity:0.25; }
          50%  { opacity:0.9; }
          100% { stroke-dashoffset:0;   opacity:0.25; }
        }
        @keyframes hubPulse {
          0%,100% { box-shadow:0 0 0 0 rgba(255,59,48,0),0 0 0 10px rgba(255,59,48,0.06); }
          50%      { box-shadow:0 0 0 14px rgba(255,59,48,0),0 0 0 10px rgba(255,59,48,0.14); }
        }
        @keyframes nodeGlow {
          0%,100% { box-shadow:0 0 0 0 transparent; }
          50%      { box-shadow:0 0 16px 3px var(--node-color); }
        }
        @keyframes panelIn {
          from { opacity:0; transform:translateX(10px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes lp { 0%,100%{opacity:1}50%{opacity:0.28} }
        @keyframes ddOpen { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }

        .gc-node { cursor:pointer; transition:transform 0.2s; }
        .gc-node:hover { transform:scale(1.1); }
        .gc-node:hover .gc-node-ring { opacity:1 !important; }
        .gc-node-icon { transition:all 0.2s; }
        .gc-panel-content { animation:panelIn 0.22s ease; }
        .gc-cmd-hint { font-size:10px; opacity:0.4; transition:opacity 0.2s; }
        .gc-cmd-hint:hover { opacity:0.7; }
      `}</style>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: bg, backgroundImage: bgMesh, color: ink, fontFamily: "'DM Sans',sans-serif", transition: 'background 0.3s, color 0.2s', overflow: 'hidden' }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <header style={{
          flexShrink: 0,
          background: headerBg,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderBottom: `0.5px solid ${sepClr}`,
          padding: '0 20px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <GCIcon size={26} />
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: -0.4, color: ink }}>Gratia Core</span>
          </div>

          {/* Usage stats */}
          <div style={{ display: 'flex', gap: 14, marginLeft: 8 }}>
            {[
              { label: 'Ideas', val: '0', color: '#af52de' },
              { label: 'Trades', val: '0', color: '#30d158' },
              { label: 'Lookups', val: '0', color: '#ff9500' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 900, color: s.color, letterSpacing: -0.5 }}>{s.val}</span>
                <span style={{ fontSize: 11, color: ink3 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* ⌘K hint */}
          <div className="gc-cmd-hint" style={{ color: ink, display: 'flex', alignItems: 'center', gap: 4, border: `0.5px solid ${sepClr}`, borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>
            <span style={{ fontSize: 10 }}>⌘K</span>
            <span style={{ fontSize: 10 }}>search</span>
          </div>

          {/* Support */}
          <a href="mailto:support@gratiacore.com" aria-label="Support" style={{ display: 'flex', alignItems: 'center', padding: 6, color: ink3, textDecoration: 'none', transition: 'color 0.2s', flexShrink: 0 }} title="support@gratiacore.com">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>
            </svg>
          </a>

          {/* Notifications */}
          <NotifBell notifications={NOTIFICATIONS} mode={mode} ink={ink} />

          {/* Dark/light toggle */}
          <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} aria-label="Toggle dark mode"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: ink3, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {mode === 'dark'
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>

          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, cursor: 'pointer' }} onClick={() => setActiveNode('settings')}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', border: `1.5px solid ${glassBdr}`, flexShrink: 0 }}>
              {initial}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: ink, margin: 0 }}>{displayName}</p>
              <p style={{ fontSize: 10, color: ink3, margin: 0 }}>Individual</p>
            </div>
          </div>
        </header>

        {/* ── Trial banner ──────────────────────────────────────── */}
        {onTrial && daysLeft !== null && (
          <div style={{
            flexShrink: 0,
            background: 'rgba(255,149,0,0.1)',
            borderBottom: '0.5px solid rgba(255,149,0,0.2)',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff9500', animation: 'lp 1.5s ease infinite' }} />
              <span style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}>
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your free trial
              </span>
              <span style={{ fontSize: 12, color: ink3 }}>· Card not charged until day 8</span>
            </div>
            <button onClick={() => setActiveNode('billing')} style={{ padding: '5px 14px', background: '#ff9500', color: '#fff', border: 'none', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              View billing
            </button>
          </div>
        )}

        {/* ── No subscription banner ────────────────────────────── */}
        {!isActive && (
          <div style={{
            flexShrink: 0,
            background: 'rgba(255,59,48,0.08)',
            borderBottom: '0.5px solid rgba(255,59,48,0.2)',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <span style={{ fontSize: 12, color: '#cc2018', fontWeight: 600 }}>Your trial has ended — subscribe to keep access</span>
            <button onClick={() => setActiveNode('billing')} style={{ padding: '5px 14px', background: '#ff3b30', color: '#fff', border: 'none', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Subscribe →
            </button>
          </div>
        )}

        {/* ── Main: spider + panel ──────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Spider canvas */}
          <div ref={canvasRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

            {/* SVG beam layer */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              <defs>
                {Object.entries(NODES).map(([id, n]) => (
                  <linearGradient key={id} id={`beam-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    {n.beamColor.map((c, i) => <stop key={i} offset={i === 0 ? '0%' : i === 1 ? '50%' : '100%'} stopColor={c} />)}
                  </linearGradient>
                ))}
              </defs>
              {svgLines.map(({ id, x1, y1, x2, y2 }, i) => {
                const len = Math.hypot(x2 - x1, y2 - y1);
                const isActive = activeNode === id;
                return (
                  <g key={id}>
                    {/* Track */}
                    <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={D ? 'rgba(255,255,255,0.05)' : 'rgba(28,28,30,0.06)'} strokeWidth="1" />
                    {/* Animated beam */}
                    <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={`url(#beam-${id})`}
                      strokeWidth={isActive ? 2 : 1.5}
                      strokeDasharray={`70 ${Math.max(len - 70, 10)}`}
                      style={{
                        animation: `beamFlow 2.4s linear infinite ${i * 0.35}s`,
                        opacity: isActive ? 1 : 0.55,
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hub */}
            <div onClick={() => setActiveNode(null)} style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 72, height: 72, borderRadius: 22,
              background: '#ff3b30',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Arial Black',sans-serif", fontSize: 22, fontWeight: 900, color: '#fff',
              zIndex: 20, cursor: 'pointer',
              animation: 'hubPulse 3s ease-in-out infinite',
              border: '1.5px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 24px rgba(255,59,48,0.4)',
            }}>GC</div>

            {/* Greeting below hub */}
            <div style={{
              position: 'absolute', top: 'calc(50% + 52px)', left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center', zIndex: 20, pointerEvents: 'none',
            }}>
              <p style={{ fontSize: 12, color: ink3, whiteSpace: 'nowrap' }}>{greeting}, {displayName}</p>
              <p style={{ fontSize: 10, color: D ? 'rgba(255,255,255,0.18)' : 'rgba(28,28,30,0.2)', marginTop: 2 }}>
                Last login: {lastLogin}
              </p>
            </div>

            {/* Nodes */}
            {Object.entries(NODES).map(([id, n]) => (
              <div key={id} ref={el => nodeRefs.current[id] = el}
                className="gc-node"
                onClick={() => setActiveNode(id)}
                style={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, ...n.style }}>

                {/* Ring (active indicator) */}
                <div className="gc-node-ring" style={{
                  position: 'absolute', inset: -6,
                  borderRadius: 22,
                  border: `1.5px solid ${n.color}`,
                  opacity: activeNode === id ? 0.8 : 0,
                  transition: 'opacity 0.2s',
                  pointerEvents: 'none',
                }} />

                <div className="gc-node-icon" style={{
                  width: 54, height: 54, borderRadius: 16,
                  background: n.nodeBg,
                  border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                  boxShadow: activeNode === id ? `0 0 20px 3px ${n.color}30` : 'none',
                  transition: 'box-shadow 0.3s',
                }}>
                  {n.emoji}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: activeNode === id ? ink : ink3, textAlign: 'center', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>
                  {n.label}
                </span>
              </div>
            ))}

            {/* Bottom: security note */}
            <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6, zIndex: 10, whiteSpace: 'nowrap' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={ink3} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontSize: 10, color: ink3 }}>Data encrypted · Secured by Stripe · <Link href="/terms" style={{ color: ink3 }}>Terms</Link> · <Link href="/privacy" style={{ color: ink3 }}>Privacy</Link></span>
            </div>
          </div>

          {/* Right panel */}
          <div style={{
            width: 280, flexShrink: 0,
            background: panelBg,
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderLeft: `0.5px solid ${panelBdr}`,
            padding: '20px 16px',
            overflowY: 'auto',
            zIndex: 50,
          }}>
            {activeNode ? (
              <div key={activeNode} className="gc-panel-content">
                {/* Node header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: NODES[activeNode]?.nodeBg || glass,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {NODES[activeNode]?.emoji}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: ink, margin: 0, letterSpacing: '-0.3px' }}>{NODES[activeNode]?.label}</p>
                  </div>
                </div>
                <div style={{ height: '0.5px', background: sepClr, marginBottom: 14 }} />
                {renderPanel()}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 8, paddingBottom: 40 }}>
                <div style={{ fontSize: 28, opacity: 0.3 }}>✦</div>
                <p style={{ fontSize: 13, color: ink3, lineHeight: 1.6 }}>Select a node<br />to open it here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}