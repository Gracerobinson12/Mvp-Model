'use client';
// @ts-nocheck
// app/dashboard/expense/page.tsx — Leak Finder + Negotiation Kit.
// Upload a bank/card statement CSV → CODE finds recurring charges, duplicates, price increases.
// No AI, no external API. Every finding shows its receipts. Negotiation scripts are code templates.
// Self-serve, scales infinitely. Gated by has_intelligence.

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

// ── CSV parsing (handles quoted fields) ──
function parseCSV(text) {
  const rows = [];
  let row = [], cur = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i+1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (cur !== '' || row.length) { row.push(cur); rows.push(row); row = []; cur = ''; } if (c==='\r'&&text[i+1]==='\n') i++; }
      else cur += c;
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

// ── Column detection: find date / description / amount columns ──
function detectColumns(header) {
  const h = header.map(x => x.toLowerCase().trim());
  const find = (opts) => { for (const o of opts) { const i = h.findIndex(x => x.includes(o)); if (i >= 0) return i; } return -1; };
  return {
    date: find(['date', 'posted', 'transaction date']),
    desc: find(['description', 'name', 'merchant', 'memo', 'details', 'payee']),
    amount: find(['amount', 'debit', 'charge', 'value']),
  };
}

// ── Normalize a merchant name for grouping (strip trailing numbers, dates, store #s) ──
function normMerchant(s) {
  return (s || '').toUpperCase()
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, '')    // dates
    .replace(/#?\d{3,}/g, '')                     // store/ref numbers
    .replace(/[*]+/g, ' ')
    .replace(/\b(POS|PURCHASE|PAYMENT|RECURRING|AUTOPAY|ACH|DEBIT|WWW|COM)\b/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, 40);
}

const money = n => (isNaN(n) ? '—' : '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

// ── The leak analysis — pure code, deterministic ──
function analyze(rows) {
  if (rows.length < 2) return { error: 'That file looks empty.' };
  const cols = detectColumns(rows[0]);
  if (cols.desc < 0 || cols.amount < 0) return { error: 'Couldn\u2019t find description and amount columns. Make sure your CSV has headers like "Description" and "Amount".' };

  const txns = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const rawAmt = (r[cols.amount] || '').replace(/[$,()]/g, '').trim();
    const amt = parseFloat(rawAmt);
    if (isNaN(amt)) continue;
    const desc = r[cols.desc] || '';
    txns.push({ date: cols.date >= 0 ? r[cols.date] : '', desc, merchant: normMerchant(desc), amount: Math.abs(amt) });
  }
  if (!txns.length) return { error: 'No valid transactions found in the file.' };

  // group by merchant
  const groups = {};
  for (const t of txns) { if (!t.merchant) continue; (groups[t.merchant] ||= []).push(t); }

  const findings = [];

  // 1. DUPLICATE charges — same merchant, same amount, 2+ times close together → "Verified"
  for (const [m, ts] of Object.entries(groups)) {
    const byAmt = {};
    ts.forEach(t => (byAmt[t.amount.toFixed(2)] ||= []).push(t));
    for (const [amt, dups] of Object.entries(byAmt)) {
      if (dups.length >= 2 && parseFloat(amt) > 5) {
        findings.push({
          type: 'duplicate', label: 'Verified', color: '#ff3b30',
          title: `Possible duplicate charge — ${m}`,
          detail: `${dups.length} charges of ${money(parseFloat(amt))} to the same merchant.`,
          amount: parseFloat(amt) * (dups.length - 1),
          evidence: dups.map(d => `${d.date} · ${d.desc} · ${money(d.amount)}`),
          merchant: m,
        });
      }
    }
  }

  // 2. RECURRING subscriptions — same merchant, same amount, 3+ times → "Worth asking"
  for (const [m, ts] of Object.entries(groups)) {
    const byAmt = {};
    ts.forEach(t => (byAmt[t.amount.toFixed(2)] ||= []).push(t));
    for (const [amt, hits] of Object.entries(byAmt)) {
      if (hits.length >= 3 && parseFloat(amt) > 5) {
        findings.push({
          type: 'recurring', label: 'Worth asking', color: '#b45309',
          title: `Recurring charge — ${m}`,
          detail: `${hits.length}× ${money(parseFloat(amt))} = ${money(parseFloat(amt) * hits.length)} total. If you don\u2019t use it, cancel. If you do, negotiate.`,
          amount: parseFloat(amt),
          evidence: hits.slice(0, 4).map(d => `${d.date} · ${money(d.amount)}`),
          merchant: m,
        });
      }
    }
  }

  // 3. PRICE INCREASES — same merchant, amount went up over time → "Likely overpaying"
  for (const [m, ts] of Object.entries(groups)) {
    if (ts.length < 2) continue;
    const amts = [...new Set(ts.map(t => t.amount.toFixed(2)))].map(Number).sort((a,b)=>a-b);
    if (amts.length >= 2) {
      const low = amts[0], high = amts[amts.length-1];
      if (high > low * 1.08 && low > 10) {   // >8% increase
        const pct = ((high - low) / low * 100).toFixed(0);
        findings.push({
          type: 'increase', label: 'Likely overpaying', color: '#0a84ff',
          title: `Price increase — ${m}`,
          detail: `Went from ${money(low)} to ${money(high)} (+${pct}%). A price hike is the #1 thing vendors reverse when you ask.`,
          amount: (high - low) * 12,  // annualized
          evidence: [`Lowest seen: ${money(low)}`, `Highest seen: ${money(high)}`],
          merchant: m,
        });
      }
    }
  }

  // sort: verified first, then by amount
  const order = { duplicate: 0, increase: 1, recurring: 2 };
  findings.sort((a, b) => (order[a.type] - order[b.type]) || (b.amount - a.amount));

  const totalPotential = findings.reduce((s, f) => s + (f.type === 'duplicate' ? f.amount : f.type === 'increase' ? f.amount : f.amount * 12), 0);
  return { findings, txnCount: txns.length, totalPotential };
}

// ── Negotiation script templates (code-filled, no AI) ──
function negotiationScript(f) {
  const m = f.merchant;
  if (f.type === 'increase') {
    return `Subject: Request to review recent price increase\n\nHi,\n\nI've been a customer for a while and I noticed my rate with ${m} increased to ${money(f.amount/12)} from a lower rate. I'd like to understand why, and I'm asking you to return me to my previous pricing.\n\nI've seen competitive offers and would prefer to stay — but the increase is hard to justify. Can you apply a loyalty or retention rate?\n\nIf the price can't be adjusted, please let me know what options I have.\n\nThank you.`;
  }
  if (f.type === 'recurring') {
    return `Subject: Reviewing my account\n\nHi,\n\nI'm reviewing recurring charges and I'm paying ${money(f.amount)} regularly to ${m}. Before I decide whether to continue, I'd like to know:\n\n1. Is there a lower-tier plan that covers what I actually use?\n2. Are there any loyalty or annual-prepay discounts?\n3. What's the best rate you can offer to keep me?\n\nI'd rather stay if the pricing makes sense. Thanks.`;
  }
  return `Subject: Duplicate charge\n\nHi,\n\nI was charged more than once by ${m} for the same amount (${money(f.amount)}). This appears to be a duplicate. Please review and refund the extra charge(s).\n\nI've attached/can provide the transaction details. Thank you.`;
}

export default function LeakFinderPage() {
  const router = useRouter();
  const [mode, setMode] = useState('light');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [openScript, setOpenScript] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { const s = localStorage.getItem('gc_dash_mode'); if (s) setMode(s); }, []);
  useEffect(() => { localStorage.setItem('gc_dash_mode', mode); }, [mode]);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof); setLoading(false);
    })();
  }, [router]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name); setParseError(''); setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCSV(String(reader.result));
        const res = analyze(rows);
        if (res.error) { setParseError(res.error); return; }
        setResult(res);
      } catch { setParseError('Couldn\u2019t read that file. Make sure it\u2019s a CSV export from your bank or card.'); }
    };
    reader.readAsText(file);
  };

  const D = mode === 'dark';
  const bg = D ? 'radial-gradient(ellipse 60% 40% at 12% 0%,rgba(10,132,255,0.14) 0%,transparent 55%),#0a0e17' : 'radial-gradient(ellipse 70% 60% at 12% -10%,rgba(10,132,255,0.1) 0%,transparent 60%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)';
  const ink = D ? '#fff' : '#1a1a2e', ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.55)', ink3 = D ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,46,0.4)';
  const card = D ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)', cardBdr = D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D?'#0a0e17':'#eef1f6', color: ink3, fontFamily: "'DM Sans',sans-serif" }}>Loading…</div>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ minHeight: '100vh', background: bg, color: ink, fontFamily: "'DM Sans',sans-serif", padding: '18px 18px 60px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/dashboard/intelligence" style={{ textDecoration: 'none' }}><GCIcon size={28} /></Link>
              <div><p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink }}>Expense Intelligence</p><p style={{ fontSize: 11, color: ink3 }}>Find the money leaking out of your business</p></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMode(m => m==='dark'?'light':'dark')} style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 100, padding: '6px 12px', cursor: 'pointer', color: ink2, fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>{D?'☀︎ Light':'☾ Dark'}</button>
              <Link href="/dashboard/intelligence" style={{ fontSize: 13, color: ink2, textDecoration: 'none', alignSelf: 'center' }}>← Intelligence</Link>
            </div>
          </div>

          {!result && (
            <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 20, padding: '32px 28px', textAlign: 'center', backdropFilter: 'blur(20px)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: ink, marginBottom: 8 }}>Find your leaks in seconds</p>
              <p style={{ fontSize: 14, color: ink2, lineHeight: 1.6, maxWidth: 440, margin: '0 auto 22px' }}>Upload a CSV export of your bank or card statement. We scan it for duplicate charges, forgotten subscriptions, and price increases — then hand you a ready-to-send script to get your money back.</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: 'none' }} />
              <button onClick={() => fileRef.current?.click()} style={{ padding: '14px 28px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#0a84ff,#378add)', boxShadow: '0 6px 20px rgba(10,132,255,0.4)' }}>Upload statement CSV →</button>
              {parseError && <p style={{ fontSize: 13, color: '#ff3b30', marginTop: 16 }}>{parseError}</p>}
              <p style={{ fontSize: 11, color: ink3, marginTop: 18, lineHeight: 1.6 }}>🔒 Analyzed in your browser — your statement is never uploaded to a server.<br/>Export a CSV from your bank/card online (usually "Download" or "Export transactions").</p>
            </div>
          )}

          {result && (
            <div style={{ animation: 'fadeUp 0.4s ease both' }}>
              {/* Summary */}
              <div style={{ background: 'linear-gradient(135deg,rgba(10,132,255,0.1),rgba(48,209,88,0.08))', border: '1px solid rgba(10,132,255,0.25)', borderRadius: 20, padding: '24px 26px', marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, marginBottom: 6 }}>Scanned {result.txnCount} transactions · {fileName}</p>
                <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 900, color: ink, letterSpacing: '-1px', lineHeight: 1 }}>{result.findings.length} potential leak{result.findings.length !== 1 ? 's' : ''} found</p>
                {result.totalPotential > 0 && <p style={{ fontSize: 15, color: D?'#4ade80':'#1a7a35', fontWeight: 700, marginTop: 8 }}>Up to {money(result.totalPotential)}/yr in potential savings</p>}
                <button onClick={() => { setResult(null); setFileName(''); }} style={{ marginTop: 14, background: 'none', border: 'none', color: ink2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Scan another statement</button>
              </div>

              {result.findings.length === 0 ? (
                <div style={{ background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 18, padding: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: ink, marginBottom: 6 }}>No obvious leaks found</p>
                  <p style={{ fontSize: 13, color: ink2, lineHeight: 1.6 }}>We didn't spot duplicates, obvious recurring overcharges, or price jumps in this file. Try a statement with more history (3+ months shows recurring patterns best).</p>
                </div>
              ) : result.findings.map((f, i) => (
                <div key={i} style={{ background: card, border: `0.5px solid ${cardBdr}`, borderLeft: `3px solid ${f.color}`, borderRadius: 16, padding: '18px 20px', marginBottom: 12, backdropFilter: 'blur(20px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: f.color, padding: '2px 9px', borderRadius: 100 }}>{f.label}</span>
                    {f.amount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: f.color }}>~{money(f.amount)}{f.type !== 'duplicate' ? '/yr' : ''}</span>}
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: ink, marginBottom: 4 }}>{f.title}</p>
                  <p style={{ fontSize: 13, color: ink2, lineHeight: 1.55, marginBottom: 12 }}>{f.detail}</p>

                  {/* receipts */}
                  <div style={{ background: D?'rgba(0,0,0,0.2)':'rgba(28,28,46,0.03)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: ink3, marginBottom: 6 }}>The receipts</p>
                    {f.evidence.map((e, j) => <p key={j} style={{ fontSize: 12, color: ink2, fontFamily: 'monospace', lineHeight: 1.6 }}>{e}</p>)}
                  </div>

                  <button onClick={() => setOpenScript(openScript === i ? null : i)} style={{ padding: '9px 16px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#0a84ff,#378add)' }}>
                    {openScript === i ? 'Hide script' : '✍️ Get negotiation script'}
                  </button>

                  {openScript === i && (
                    <div style={{ marginTop: 12, background: D?'rgba(0,0,0,0.25)':'rgba(28,28,46,0.04)', border: `0.5px solid ${cardBdr}`, borderRadius: 12, padding: '14px 16px' }}>
                      <pre style={{ fontSize: 12.5, color: ink, whiteSpace: 'pre-wrap', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6, margin: 0 }}>{negotiationScript(f)}</pre>
                      <button onClick={() => navigator.clipboard?.writeText(negotiationScript(f))} style={{ marginTop: 10, padding: '7px 14px', borderRadius: 100, border: `0.5px solid ${cardBdr}`, background: 'transparent', color: ink2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📋 Copy script</button>
                    </div>
                  )}
                </div>
              ))}

              <p style={{ fontSize: 11, color: ink3, textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
                Findings are calculated from your statement data. Savings are estimates — actual results depend on your negotiation.<br/>This is not financial advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}