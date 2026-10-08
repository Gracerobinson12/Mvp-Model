'use client';
// @ts-nocheck
// app/dashboard/intelligence/page.tsx — Intelligence HUB (command deck).
// Three modules: Regulatory updates, Tariff intelligence, Expense/Leak Finder.
// Shows the user's industries + a live count of regulatory updates. Dark default + toggle.
// Gated by has_intelligence.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

const MODULES = [
  { id: 'regulatory', href: '/dashboard/regulatory', icon: '⚖️', name: 'Regulatory Updates', accent: '#7c3aed', accent2: '#bf5af2',
    desc: 'Federal rule changes matched to your industries — IRS, FTC, FDA, OSHA and more, in plain language with the official source.' },
  { id: 'tariff', href: '/dashboard/tariff', icon: '🌐', name: 'Tariff Intelligence', accent: '#ff3b30', accent2: '#ff6b35',
    desc: 'Look up duty rates on any product, and check whether a supplier raised prices more than the tariff actually justifies.' },
  { id: 'expense', href: '/dashboard/expense', icon: '🔍', name: 'Expense Intelligence', accent: '#0a84ff', accent2: '#378add',
    desc: 'Upload a statement — we find duplicate charges, forgotten subscriptions, and price increases, then hand you the script to get your money back.' },
];

export default function IntelligenceHub() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('dark');   // dark default for the "terminal" feel
  const [regCount, setRegCount] = useState(0);

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
        try {
          const { count } = await supabase.from('reg_updates').select('*', { count: 'exact', head: true }).overlaps('industries', inds);
          setRegCount(count || 0);
        } catch {}
      }
      setLoading(false);
    })();
  }, [router]);

  const D = mode === 'dark';
  const bg = D ? 'radial-gradient(ellipse 60% 40% at 15% 0%,rgba(124,58,237,0.15) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 90% 100%,rgba(10,132,255,0.1) 0%,transparent 55%),#0a0e17' : 'radial-gradient(ellipse 60% 40% at 15% 0%,rgba(124,58,237,0.1) 0%,transparent 55%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)';
  const ink = D ? '#fff' : '#1a1a2e', ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.55)', ink3 = D ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,46,0.4)';
  const card = D ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)', cardBdr = D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';

  const name = profile?.first_name || 'there';
  const inds = profile?.industries?.length ? profile.industries : (profile?.industry ? [profile.industry] : []);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e17', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans',sans-serif" }}>Loading…</div>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}@keyframes glowPulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.imod{transition:transform 0.18s;text-decoration:none}.imod:hover{transform:translateY(-3px)}`}</style>
      <div style={{ minHeight: '100vh', background: bg, color: ink, fontFamily: "'DM Sans',sans-serif", padding: '18px 18px 60px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/" style={{ textDecoration: 'none' }}><GCIcon size={30} /></Link>
              <div>
                <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink }}>Intelligence</p>
                <p style={{ fontSize: 11, color: ink3 }}>{greeting}, {name}{inds.length ? ` · ${inds.slice(0,2).join(', ')}${inds.length>2?'…':''}` : ''}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: D?'rgba(48,209,88,0.12)':'rgba(48,209,88,0.1)', border: '0.5px solid rgba(48,209,88,0.3)', borderRadius: 100, padding: '5px 11px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#30d158', boxShadow: '0 0 8px #30d158', animation: 'glowPulse 2s ease infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: D?'#4ade80':'#1a7a35' }}>Live</span>
              </div>
              <button onClick={() => router.push('/dashboard/settings')} style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 100, padding: '6px 12px', cursor: 'pointer', color: ink2, fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>⚙ Settings</button>
              <button onClick={() => setMode(m => m==='dark'?'light':'dark')} style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 100, padding: '6px 12px', cursor: 'pointer', color: ink2, fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>{D?'☀︎ Light':'☾ Dark'}</button>
            </div>
          </div>

          {inds.length === 0 && (
            <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: ink, marginBottom: 4 }}>Set your industries to activate Regulatory</p>
              <p style={{ fontSize: 13, color: ink2, lineHeight: 1.55, marginBottom: 12 }}>Regulatory updates filter to your industries. Pick yours to start seeing matched changes. (Tariff &amp; Expense work without this.)</p>
              <button onClick={() => router.push('/onboarding?tier=intelligence')} style={{ padding: '9px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#7c3aed,#bf5af2)' }}>Choose industries →</button>
            </div>
          )}

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>Your intelligence</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 14 }}>
            {MODULES.map((mod, i) => (
              <Link key={mod.id} href={mod.href} className="imod" style={{ animation: `fadeUp 0.3s ease ${i*0.06}s both` }}>
                <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 20, padding: '22px', backdropFilter: 'blur(20px)', boxShadow: D?'0 8px 32px rgba(0,0,0,0.3)':'0 6px 20px rgba(0,0,0,0.06)', height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle,${mod.accent}22 0%,transparent 70%)` }} />
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${mod.accent},${mod.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14, boxShadow: `0 4px 16px ${mod.accent}55` }}>{mod.icon}</div>
                  <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 800, color: ink, marginBottom: 6, letterSpacing: '-0.3px' }}>{mod.name}</p>
                  <p style={{ fontSize: 13, color: ink2, lineHeight: 1.55, marginBottom: 14 }}>{mod.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: mod.accent2 }}>Open →</span>
                    {mod.id === 'regulatory' && <span style={{ fontSize: 11, color: ink3 }}>{regCount} update{regCount!==1?'s':''}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <p style={{ fontSize: 10, color: ink3, textAlign: 'center', marginTop: 28, lineHeight: 1.7 }}>
            Intelligence aggregates official public sources and your own data. Informational, not legal or financial advice.<br/>
            <Link href="/terms" style={{ color: ink3 }}>Terms</Link> · <Link href="/privacy" style={{ color: ink3 }}>Privacy</Link> · <Link href="/report" style={{ color: ink3 }}>Report a problem</Link>
          </p>
        </div>
      </div>
    </>
  );
}