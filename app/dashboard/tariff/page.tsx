'use client';
// @ts-nocheck
// app/dashboard/tariff/page.tsx — Tariff Intelligence.
// HTS duty lookup (USITC free API) + supplier surcharge check (code math).
// Gated by has_intelligence. Honest: HTS classification is an estimate; flags that.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}
const money = n => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TariffPage() {
  const router = useRouter();
  const [mode, setMode] = useState('light');
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState('');

  // surcharge checker
  const [oldPrice, setOldPrice] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [tariffRate, setTariffRate] = useState('');

  useEffect(() => { const s = localStorage.getItem('gc_dash_mode'); if (s) setMode(s); }, []);
  useEffect(() => { localStorage.setItem('gc_dash_mode', mode); }, [mode]);
  useEffect(() => { (async () => { const { data:{user} } = await supabase.auth.getUser(); if (!user) { router.replace('/login'); return; } setLoading(false); })(); }, [router]);

  const search = async () => {
    if (query.trim().length < 2) return;
    setSearching(true); setErr(''); setResults(null);
    try {
      const res = await fetch(`/api/intelligence/tariff?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setResults(data.results);
    } catch (e) { setErr(e.message || 'Lookup failed'); }
    setSearching(false);
  };

  // surcharge math (code, not AI)
  const op = parseFloat(oldPrice) || 0, np = parseFloat(newPrice) || 0, tr = parseFloat(tariffRate) || 0;
  const actualIncrease = op > 0 ? ((np - op) / op) * 100 : 0;
  const tariffExplains = op * (tr / 100);
  const overCharge = np - op - tariffExplains;
  const hasSurchargeResult = op > 0 && np > 0;

  const D = mode === 'dark';
  const bg = D ? 'radial-gradient(ellipse 60% 40% at 12% 0%,rgba(255,59,48,0.14) 0%,transparent 55%),#0a0e17' : 'radial-gradient(ellipse 70% 60% at 12% -10%,rgba(255,59,48,0.1) 0%,transparent 60%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)';
  const ink = D ? '#fff' : '#1a1a2e', ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.55)', ink3 = D ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,46,0.4)';
  const card = D ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)', cardBdr = D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';
  const inp = { width: '100%', padding: '11px 14px', borderRadius: 12, border: `0.5px solid ${D?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.12)'}`, background: D?'rgba(255,255,255,0.04)':'#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: ink, boxSizing: 'border-box' };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D?'#0a0e17':'#eef1f6', color: ink3, fontFamily: "'DM Sans',sans-serif" }}>Loading…</div>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}`}</style>
      <div style={{ minHeight: '100vh', background: bg, color: ink, fontFamily: "'DM Sans',sans-serif", padding: '18px 18px 60px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/dashboard/intelligence" style={{ textDecoration: 'none' }}><GCIcon size={28} /></Link>
              <div><p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink }}>Tariff Intelligence</p><p style={{ fontSize: 11, color: ink3 }}>Duty rates &amp; supplier surcharge checks</p></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMode(m => m==='dark'?'light':'dark')} style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 100, padding: '6px 12px', cursor: 'pointer', color: ink2, fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>{D?'☀︎ Light':'☾ Dark'}</button>
              <Link href="/dashboard/intelligence" style={{ fontSize: 13, color: ink2, textDecoration: 'none', alignSelf: 'center' }}>← Intelligence</Link>
            </div>
          </div>

          {/* HTS lookup */}
          <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 18, padding: '20px 22px', marginBottom: 14, backdropFilter: 'blur(20px)' }}>
            <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink, marginBottom: 4 }}>🌐 Duty rate lookup</p>
            <p style={{ fontSize: 12, color: ink2, marginBottom: 14, lineHeight: 1.5 }}>Search a product to find its HTS code and the official US duty rate.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="e.g. ceramic mugs, cotton t-shirts, steel bolts" style={inp} />
              <button onClick={search} disabled={searching} style={{ padding: '0 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', whiteSpace: 'nowrap' }}>{searching ? '…' : 'Search'}</button>
            </div>
            {err && <p style={{ fontSize: 12, color: '#ff3b30', marginTop: 10 }}>{err}</p>}
            {results && results.length === 0 && <p style={{ fontSize: 13, color: ink3, marginTop: 12 }}>No matches. Try a simpler term (the product material or type).</p>}
            {results && results.map((r, i) => (
              <div key={i} style={{ marginTop: 10, padding: '12px 14px', background: D?'rgba(255,255,255,0.03)':'rgba(28,28,46,0.03)', border: `0.5px solid ${cardBdr}`, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#ff3b30', fontWeight: 700 }}>{r.htsno || '—'}</span>
                  {r.general && <span style={{ fontSize: 13, fontWeight: 800, color: ink, whiteSpace: 'nowrap' }}>{r.general}</span>}
                </div>
                <p style={{ fontSize: 12.5, color: ink2, marginTop: 4, lineHeight: 1.5 }}>{r.description}</p>
              </div>
            ))}
            {results && results.length > 0 && <p style={{ fontSize: 11, color: ink3, marginTop: 12, lineHeight: 1.5 }}>⚠️ HTS classification is an estimate — the exact code depends on your product's specifics. Confirm with a licensed customs broker for import decisions.</p>}
          </div>

          {/* Surcharge checker */}
          <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 18, padding: '20px 22px', backdropFilter: 'blur(20px)' }}>
            <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink, marginBottom: 4 }}>🧮 Supplier surcharge check</p>
            <p style={{ fontSize: 12, color: ink2, marginBottom: 16, lineHeight: 1.5 }}>Did your supplier raise prices more than the tariff actually justifies? Enter the numbers — this is your negotiation leverage.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div><label style={{ fontSize: 11, color: ink3, display: 'block', marginBottom: 5 }}>Old price</label><input value={oldPrice} onChange={e => setOldPrice(e.target.value)} type="number" placeholder="100" style={inp} /></div>
              <div><label style={{ fontSize: 11, color: ink3, display: 'block', marginBottom: 5 }}>New price</label><input value={newPrice} onChange={e => setNewPrice(e.target.value)} type="number" placeholder="130" style={inp} /></div>
              <div><label style={{ fontSize: 11, color: ink3, display: 'block', marginBottom: 5 }}>Tariff rate %</label><input value={tariffRate} onChange={e => setTariffRate(e.target.value)} type="number" placeholder="10" style={inp} /></div>
            </div>
            {hasSurchargeResult && (
              <div style={{ background: overCharge > 0.01 ? (D?'rgba(255,59,48,0.1)':'rgba(255,59,48,0.06)') : (D?'rgba(48,209,88,0.1)':'rgba(48,209,88,0.06)'), border: `0.5px solid ${overCharge > 0.01 ? 'rgba(255,59,48,0.25)' : 'rgba(48,209,88,0.25)'}`, borderRadius: 14, padding: '16px 18px' }}>
                <p style={{ fontSize: 13, color: ink2, marginBottom: 6 }}>Your supplier raised the price <strong style={{ color: ink }}>{actualIncrease.toFixed(1)}%</strong>.</p>
                <p style={{ fontSize: 13, color: ink2, marginBottom: 6 }}>A {tr}% tariff only explains about <strong style={{ color: ink }}>{money(tariffExplains)}</strong> of the increase.</p>
                {overCharge > 0.01 ? (
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#cc2018', marginTop: 8 }}>⚠️ ~{money(overCharge)} of the increase isn't explained by the tariff. That's your negotiation point: "The tariff is {tr}% — why did the price go up {actualIncrease.toFixed(0)}%?"</p>
                ) : (
                  <p style={{ fontSize: 14, fontWeight: 700, color: D?'#4ade80':'#1a7a35', marginTop: 8 }}>✓ The increase is roughly in line with the tariff. Less room to push, but still worth asking for a loyalty rate.</p>
                )}
              </div>
            )}
            <p style={{ fontSize: 11, color: ink3, marginTop: 12, lineHeight: 1.5 }}>Estimate only — suppliers have other costs too. Use it as a conversation starter, not a definitive figure.</p>
          </div>
        </div>
      </div>
    </>
  );
}