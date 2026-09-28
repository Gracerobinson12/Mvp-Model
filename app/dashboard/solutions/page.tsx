'use client';
// @ts-nocheck
// app/dashboard/solutions/page.tsx — Solutions HUB (command-deck style).
// LIGHT default + dark/light toggle (shares gc_dash_mode).
// Personalized activity strip (last sealed idea, agreements awaiting confirm) + tool tiles + GC Protect.
// All data is real, per-user (RLS). No new SQL required — reads vault_ideas + barter_agreements.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const GC_PROTECT_URL = 'https://gcprotect.com';

function GCIcon({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

const TOOLS = [
  { id: 'vault', href: '/dashboard/vault', icon: '💡', name: 'Ideas Vault', accent: '#ff3b30', accent2: '#ff6b35',
    desc: 'Seal ideas with a SHA-256 fingerprint + timestamp. Dated proof it was yours.' },
  { id: 'barter', href: '/dashboard/barter', icon: '🤝', name: 'Barter', accent: '#30d158', accent2: '#1a7a35',
    desc: 'Log trades, confirm by email, track delivery from both sides to done.' },
];

const ago = d => { if (!d) return ''; const days = Math.floor((Date.now() - new Date(d)) / 86400000); return days <= 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`; };

export default function SolutionsHub() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('light');   // LIGHT default
  const [stats, setStats] = useState({ ideas: 0, sealed: 0, trades: 0 });
  const [activity, setActivity] = useState([]);

  useEffect(() => { const s = localStorage.getItem('gc_dash_mode'); if (s) setMode(s); }, []);
  useEffect(() => { localStorage.setItem('gc_dash_mode', mode); }, [mode]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      try {
        // counts
        const [{ count: ideas }, { count: sealed }, { count: trades }] = await Promise.all([
          supabase.from('vault_ideas').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
          supabase.from('vault_ideas').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'sealed'),
          supabase.from('barter_agreements').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
        ]);
        setStats({ ideas: ideas || 0, sealed: sealed || 0, trades: trades || 0 });

        // ── personalized activity ──
        const acts = [];
        const { data: lastSealed } = await supabase.from('vault_ideas')
          .select('title, sealed_at').eq('user_id', user.id).eq('status', 'sealed')
          .order('sealed_at', { ascending: false }).limit(1);
        if (lastSealed && lastSealed[0]) {
          acts.push({ icon: '🔒', color: '#ff3b30', tint: 'rgba(255,59,48,0.12)',
            text: `Last sealed — "${lastSealed[0].title}"`, meta: ago(lastSealed[0].sealed_at) });
        }
        const { data: awaiting } = await supabase.from('barter_agreements')
          .select('counterparty_name, sent_at').eq('user_id', user.id).eq('status', 'sent')
          .order('sent_at', { ascending: false });
        if (awaiting && awaiting.length) {
          acts.push({ icon: '⏳', color: '#b45309', tint: 'rgba(255,159,10,0.14)',
            text: `${awaiting.length} agreement${awaiting.length > 1 ? 's' : ''} awaiting ${awaiting[0].counterparty_name}'s confirmation`,
            meta: awaiting[0].sent_at ? 'sent ' + ago(awaiting[0].sent_at) : 'sent' });
        }
        setActivity(acts);
      } catch {}
      setLoading(false);
    })();
  }, [router]);

  const D = mode === 'dark';
  const bg = D
    ? 'radial-gradient(ellipse 60% 40% at 12% 0%,rgba(48,209,88,0.14) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 92% 100%,rgba(255,59,48,0.1) 0%,transparent 55%),#0a0e17'
    : 'radial-gradient(ellipse 70% 60% at 12% -10%,rgba(48,209,88,0.12) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 88% 110%,rgba(255,59,48,0.06) 0%,transparent 60%),#eef1f6';
  const ink = D ? '#fff' : '#1a1a2e';
  const ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.55)';
  const ink3 = D ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,46,0.4)';
  const card = D ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)';
  const cardBdr = D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';

  const goHome = () => {
    // "home" = the user's own hub, never the marketing site or old /dashboard
    if (profile?.has_intelligence) router.push('/dashboard/intelligence');
    else router.push('/dashboard/solutions');
  };

  const trialDays = profile?.trial_ends_at ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at) - Date.now()) / 86400000)) : null;
  const trialLabel = profile?.plan_status === 'trialing' && trialDays !== null ? `Trial · ${trialDays}d left` : (profile?.plan_status === 'active' ? 'Active plan' : '');
  const name = profile?.first_name || profile?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef1f6', color: 'rgba(26,26,46,0.4)', fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>Loading…</div>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .tool-tile{transition:transform 0.18s;text-decoration:none;}
        .tool-tile:hover{transform:translateY(-3px);}
      `}</style>

      <div style={{ minHeight: '100vh', background: bg, color: ink, fontFamily: "'DM Sans',sans-serif", padding: '18px 18px 60px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div onClick={goHome} style={{ cursor: 'pointer' }}><GCIcon size={30} /></div>
              <div>
                <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink }}>Solutions</p>
                <p style={{ fontSize: 11, color: ink3 }}>{greeting}, {name}{trialLabel ? ` · ${trialLabel}` : ''}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 100, padding: '6px 12px', cursor: 'pointer', color: ink2, fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>{D ? '☀︎ Light' : '☾ Dark'}</button>
              <button onClick={() => router.push('/dashboard/settings')} style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 100, padding: '6px 12px', cursor: 'pointer', color: ink2, fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>⚙ Settings</button>
              <button onClick={async () => { await supabase.auth.signOut(); router.replace('/'); }} style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 100, padding: '6px 12px', cursor: 'pointer', color: ink2, fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>Sign out</button>
            </div>
          </div>

          {/* Personalized activity strip */}
          <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 16, padding: '14px 18px', marginBottom: 16, backdropFilter: 'blur(20px)', animation: 'fadeUp 0.3s ease both' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, marginBottom: activity.length ? 12 : 0 }}>Here&apos;s what&apos;s happening</p>
            {activity.length === 0 ? (
              <p style={{ fontSize: 13, color: ink2, lineHeight: 1.5 }}>Nothing yet — seal your first idea or log a trade to get started.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: a.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{a.icon}</div>
                    <p style={{ fontSize: 13, color: ink2, lineHeight: 1.4 }}><span style={{ color: ink, fontWeight: 500 }}>{a.text}</span>{a.meta ? ` · ${a.meta}` : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tool tiles */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>Your tools</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 22 }}>
            {TOOLS.map((tool, i) => (
              <Link key={tool.id} href={tool.href} className="tool-tile" style={{ animation: `fadeUp 0.3s ease ${(i + 1) * 0.06}s both` }}>
                <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 20, padding: '22px', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', boxShadow: D ? '0 8px 32px rgba(0,0,0,0.3)' : '0 6px 20px rgba(0,0,0,0.06)', height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle,${tool.accent}22 0%,transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${tool.accent},${tool.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14, boxShadow: `0 4px 16px ${tool.accent}44` }}>{tool.icon}</div>
                  <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: ink, marginBottom: 6, letterSpacing: '-0.3px' }}>{tool.name}</p>
                  <p style={{ fontSize: 13, color: ink2, lineHeight: 1.55, marginBottom: 14 }}>{tool.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: tool.accent2 }}>Open →</span>
                    {tool.id === 'vault' && <span style={{ fontSize: 11, color: ink3 }}>{stats.ideas} ideas · {stats.sealed} sealed</span>}
                    {tool.id === 'barter' && <span style={{ fontSize: 11, color: ink3 }}>{stats.trades} agreement{stats.trades !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* GC Protect */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>From the Gratia Core ecosystem</p>
          <a href={GC_PROTECT_URL} target="_blank" rel="noopener noreferrer" className="tool-tile" style={{ display: 'block' }}>
            <div style={{ background: D ? 'linear-gradient(135deg,rgba(10,132,255,0.12),rgba(191,90,242,0.1))' : 'linear-gradient(135deg,rgba(10,132,255,0.09),rgba(191,90,242,0.07))', border: '1px solid rgba(10,132,255,0.2)', borderRadius: 18, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#0a84ff,#bf5af2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🛡️</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: ink }}>GC Protect</span>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: D ? '#4ade80' : '#1a7a35', background: 'rgba(48,209,88,0.12)', padding: '2px 7px', borderRadius: 100 }}>Live</span>
                </div>
                <p style={{ fontSize: 12, color: ink2, marginTop: 2 }}>AI data protection — redact before it reaches any AI tool.</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: D ? '#4a9eff' : '#0a84ff', whiteSpace: 'nowrap' }}>Visit ↗</span>
            </div>
          </a>

          {/* Need advice? → Advisory */}
          <a href="/advisory" className="tool-tile" style={{ display: 'block', marginTop: 6 }}>
            <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💬</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: ink, margin: 0 }}>Need business or tech advice?</p>
                <p style={{ fontSize: 12, color: ink2, margin: '2px 0 0' }}>Advisory is open — tell us the problem, we\'ll help you solve it.</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#cc2018', whiteSpace: 'nowrap' }}>Let\'s talk →</span>
            </div>
          </a>

          <p style={{ fontSize: 10, color: ink3, textAlign: 'center', marginTop: 28, lineHeight: 1.7 }}>
            Records created here establish existence and integrity — not legal advice.<br />
            <Link href="/terms" style={{ color: ink3 }}>Terms</Link> · <Link href="/privacy" style={{ color: ink3 }}>Privacy</Link>
          </p>
        </div>
      </div>
    </>
  );
}