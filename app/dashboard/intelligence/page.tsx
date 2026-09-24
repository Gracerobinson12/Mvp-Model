'use client';
// @ts-nocheck
// app/dashboard/intelligence/page.tsx — Intelligence command deck.
// Futuristic layout (stat tiles + live feed + market/filters rail), dark/light toggle.
// Reads reg_updates filtered to the user's profile.industries[]. "Relevant to you" = overlap.
// Gated by has_intelligence (layout guard enforces; this page also degrades gracefully).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AGENCY_COLOR = { FTC:'#ff3b30', SEC:'#0a84ff', FDA:'#0a84ff', OSHA:'#ff9500', CBP:'#636366', EPA:'#30d158', DOL:'#34aadc' };
const impactMeta = (imp, D) => {
  const v = (imp||'').toLowerCase();
  if (v.includes('high')) return { label:'HIGH', color:'#ff3b30', bar:'#ff3b30', bg: D?'rgba(255,59,48,0.08)':'rgba(255,59,48,0.05)' };
  if (v.includes('med'))  return { label:'MEDIUM', color: D?'#4a9eff':'#0a84ff', bar:'#0a84ff', bg: D?'rgba(10,132,255,0.06)':'rgba(10,132,255,0.04)' };
  return { label:'LOW', color: D?'rgba(255,255,255,0.4)':'rgba(28,28,30,0.4)', bar: D?'rgba(255,255,255,0.2)':'rgba(28,28,46,0.2)', bg:'transparent' };
};
const agencyShort = a => { const m=(a||'').match(/\b([A-Z]{2,4})\b/); if(m) return m[1]; return (a||'').split(' ').map(w=>w[0]).join('').slice(0,4).toUpperCase()||'GOV'; };
const ago = d => { if(!d) return ''; const days=Math.floor((Date.now()-new Date(d))/86400000); return days<=0?'today':days===1?'1 day ago':`${days} days ago`; };

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

export default function IntelligenceDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('dark');   // defaults dark (terminal feel), toggleable
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { const s = localStorage.getItem('gc_intel_mode'); if (s) setMode(s); }, []);
  useEffect(() => { localStorage.setItem('gc_intel_mode', mode); }, [mode]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      const inds = prof?.industries?.length ? prof.industries : (prof?.industry ? [prof.industry] : []);
      if (inds.length) {
        const { data } = await supabase.from('reg_updates').select('*').overlaps('industries', inds).order('published_at', { ascending: false }).limit(50);
        setUpdates(data || []);
      }
      setLoading(false);
    })();
  }, [router]);

  const D = mode === 'dark';
  // theme tokens
  const bg = D
    ? 'radial-gradient(ellipse 60% 40% at 15% 0%,rgba(10,132,255,0.15) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 90% 100%,rgba(191,90,242,0.1) 0%,transparent 55%),#0a0e17'
    : 'radial-gradient(ellipse 60% 40% at 15% 0%,rgba(10,132,255,0.1) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 90% 100%,rgba(191,90,242,0.07) 0%,transparent 55%),#eef1f6';
  const ink  = D ? '#fff' : '#1a1a2e';
  const ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.55)';
  const ink3 = D ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,46,0.4)';
  const card = D ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)';
  const cardBdr = D ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)';
  const chipBg = D ? 'rgba(255,255,255,0.05)' : 'rgba(28,28,46,0.04)';

  const inds = profile?.industries?.length ? profile.industries : (profile?.industry ? [profile.industry] : []);
  const relevant = u => (u.industries || []).some(i => inds.includes(i));
  const newThisWeek = updates.filter(u => (Date.now() - new Date(u.published_at)) < 7 * 864e5).length;
  const highImpact = updates.filter(u => (u.impact||'').toLowerCase().includes('high')).length;

  const statTile = (icon, iconColor, label, big, sub, subColor) => (
    <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 14, padding: '14px 16px', backdropFilter: 'blur(20px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${iconColor}`, display: 'inline-block' }} />
        <span style={{ fontSize: 11, color: ink2 }}>{label}</span>
      </div>
      <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: ink, letterSpacing: '-1px', lineHeight: 1 }}>{big}</p>
      <p style={{ fontSize: 11, color: subColor, marginTop: 5 }}>{sub}</p>
    </div>
  );

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0e17', color:'rgba(255,255,255,0.4)', fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>Loading intelligence…</div>;

  const noIndustries = inds.length === 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes glowPulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ minHeight: '100vh', background: bg, color: ink, fontFamily: "'DM Sans',sans-serif", padding: '18px 18px 60px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}><GCIcon size={30} /></Link>
              <div>
                <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink }}>Intelligence</p>
                <p style={{ fontSize: 11, color: ink3 }}>{inds.length ? inds.join(' · ') : 'No industries set'}{profile?.state ? ` · ${profile.state}` : ''}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: D?'rgba(48,209,88,0.12)':'rgba(48,209,88,0.1)', border: '0.5px solid rgba(48,209,88,0.3)', borderRadius: 100, padding: '5px 11px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#30d158', boxShadow: '0 0 8px #30d158', animation: 'glowPulse 2s ease infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: D?'#4ade80':'#1a7a35' }}>Live</span>
              </div>
              <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 100, padding: '6px 12px', cursor: 'pointer', color: ink2, fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>{D ? '☀︎ Light' : '☾ Dark'}</button>
            </div>
          </div>

          {noIndustries ? (
            <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 18, padding: '48px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: ink, marginBottom: 8 }}>Set your industries to activate the feed</p>
              <p style={{ fontSize: 14, color: ink2, lineHeight: 1.6, maxWidth: 380, margin: '0 auto 20px' }}>Intelligence filters regulatory and market updates to what affects your business. Pick your industries to start.</p>
              <button onClick={() => router.push('/onboarding?tier=intelligence')} style={{ padding: '11px 22px', borderRadius: 100, background: 'linear-gradient(135deg,#0a84ff,#378add)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Choose industries →</button>
            </div>
          ) : (
            <>
              {/* Stat tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                {statTile('▢', '#0a84ff', 'Regulatory', updates.length, `${newThisWeek} new this week`, D?'#4a9eff':'#0a84ff')}
                {statTile('▢', '#30d158', 'Market', '—', 'Signals coming soon', ink3)}
                {statTile('▢', '#ff9f0a', 'Needs action', highImpact, highImpact ? 'High impact' : 'All clear', highImpact ? '#ff9f0a' : ink3)}
              </div>

              {/* Feed + rail */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 10 }}>
                {/* Live feed */}
                <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 16, padding: 16, backdropFilter: 'blur(20px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ink2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live feed</span>
                    <span style={{ fontSize: 10, color: ink3 }}>{updates.length} updates</span>
                  </div>

                  {updates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>📡</div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: ink, marginBottom: 6 }}>Syncing your first updates…</p>
                      <p style={{ fontSize: 12, color: ink2, lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>We&apos;re pulling regulatory changes for {inds.join(', ')}. New items land here automatically.</p>
                    </div>
                  ) : updates.map((u, i) => {
                    const im = impactMeta(u.impact, D);
                    const rel = relevant(u);
                    const ac = AGENCY_COLOR[agencyShort(u.agency)] || '#636366';
                    const open = expanded === u.id;
                    return (
                      <div key={u.id || i} onClick={() => setExpanded(open ? null : u.id)} style={{ borderLeft: `2px solid ${im.bar}`, background: im.bg, borderRadius: '0 10px 10px 0', padding: '11px 13px', marginBottom: 8, cursor: 'pointer', animation: `fadeUp 0.3s ease ${Math.min(i,8)*0.04}s both` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: ac, padding: '1px 6px', borderRadius: 4 }}>{agencyShort(u.agency)}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: im.color }}>{im.label}{rel ? ' · Relevant to you' : ''}</span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: ink, lineHeight: 1.35 }}>{u.title}</p>
                        <p style={{ fontSize: 10, color: ink3, marginTop: 4 }}>{ago(u.published_at)}{u.industries?.length ? ' · ' + u.industries.slice(0,3).join(', ') : ''}</p>
                        {open && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${cardBdr}` }}>
                            {u.summary && <p style={{ fontSize: 12, color: ink2, lineHeight: 1.6, marginBottom: 10 }}>{u.summary}</p>}
                            {u.source_url && <a href={u.source_url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ fontSize: 12, fontWeight: 600, color: '#0a84ff', textDecoration: 'none' }}>Read the official source →</a>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right rail */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 16, padding: 16, backdropFilter: 'blur(20px)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ink2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Market pulse</span>
                    <svg viewBox="0 0 200 60" style={{ width: '100%', height: 52, marginTop: 10 }}>
                      <polyline points="0,45 25,42 50,46 75,35 100,38 125,28 150,30 175,18 200,14" fill="none" stroke="#30d158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p style={{ fontSize: 10, color: ink3 }}>Market signals — coming soon</p>
                  </div>
                  <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 16, padding: 16, backdropFilter: 'blur(20px)', flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ink2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your filters</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                      {inds.map(i => <span key={i} style={{ fontSize: 10, color: D?'#4a9eff':'#0a84ff', background: D?'rgba(10,132,255,0.12)':'rgba(10,132,255,0.08)', border: '0.5px solid rgba(10,132,255,0.3)', padding: '3px 9px', borderRadius: 100 }}>{i}</span>)}
                      <button onClick={() => router.push('/dashboard/settings')} style={{ fontSize: 10, color: ink3, background: chipBg, border: `0.5px solid ${cardBdr}`, padding: '3px 9px', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit' }}>+ edit</button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <p style={{ fontSize: 10, color: ink3, textAlign: 'center', marginTop: 24, lineHeight: 1.7 }}>
            Intelligence aggregates official public sources and links to originals. Informational, not legal advice.<br />
            <Link href="/terms" style={{ color: ink3 }}>Terms</Link> · <Link href="/privacy" style={{ color: ink3 }}>Privacy</Link>
          </p>
        </div>
      </div>
    </>
  );
}
