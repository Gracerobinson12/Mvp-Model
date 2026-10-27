'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

// ── Visual proof components ──────────────────────────────────────────────────

function QAProofCard() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Functional', 'Usability', 'Edge cases'];
  const items = [
    [
      { label: 'Checkout flow — item removal', status: 'fail', note: 'Cart total doesn\'t update until page refresh' },
      { label: 'Password reset email delivery', status: 'pass', note: 'Delivered < 30s, link expires correctly' },
      { label: 'Mobile form — autocomplete conflict', status: 'fail', note: 'iOS Safari autofill overwrites dropdown selection' },
      { label: 'API timeout handling', status: 'pass', note: 'Graceful fallback shown after 5s' },
    ],
    [
      { label: 'Onboarding step 3 — CTA unclear', status: 'warn', note: '"Next" looks disabled but is active' },
      { label: 'Error messages — plain English', status: 'fail', note: 'Shows raw error code "ERR_VALIDATION_422"' },
      { label: 'Tab order on settings page', status: 'pass', note: 'Logical left-to-right, all focusable' },
    ],
    [
      { label: 'Empty state — no orders yet', status: 'fail', note: 'Blank white screen, no message shown' },
      { label: 'Special chars in product name', status: 'pass', note: 'Ampersands and quotes render correctly' },
      { label: 'Concurrent session conflict', status: 'warn', note: 'No warning when same account signs in elsewhere' },
    ],
  ][activeTab];

  const dot = (s: string) => ({ pass: '#30d158', fail: '#ff3b30', warn: '#ff9f0a' }[s] || '#888');
  const label = (s: string) => ({ pass: 'Pass', fail: 'Fail', warn: 'Review' }[s] || s);

  return (
    <div style={proofShell}>
      <div style={proofHeader}>
        <span style={proofEye}>🧪</span>
        <div>
          <p style={proofTitle}>QA Report · v1.4.2</p>
          <p style={proofSub}>Checkout flow &amp; account module · 14 scenarios</p>
        </div>
        <span style={{ ...pill, background: 'rgba(255,59,48,0.1)', color: '#ff3b30', marginLeft: 'auto' }}>3 issues found</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '5px 13px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === i ? '#1c1c1e' : 'rgba(0,0,0,0.06)', color: activeTab === i ? '#fff' : 'rgba(28,28,30,0.6)', transition: 'all 0.15s' }}>{t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '10px 12px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot(item.status), flexShrink: 0, marginTop: 4 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', marginBottom: 2 }}>{item.label}</p>
              <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)', lineHeight: 1.4 }}>{item.note}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: dot(item.status), flexShrink: 0 }}>{label(item.status)}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(255,59,48,0.06)', borderRadius: 10, border: '0.5px solid rgba(255,59,48,0.15)' }}>
        <p style={{ fontSize: 12, color: '#cc2018', fontWeight: 600 }}>Next: reproduce &amp; document each failure → hand off to dev with reproduction steps</p>
      </div>
    </div>
  );
}

function ProductLabProofCard() {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: '💡', title: 'Problem statement', body: '"Small salon owners lose 40% of bookings to no-shows and have no easy way to send reminders without a monthly subscription."' },
    { icon: '🎯', title: 'Target user', body: 'Solo stylists and 2–3 person salons, age 30–52, iPhone users, low software comfort. Currently using a paper book or notes app.' },
    { icon: '🗺️', title: 'Concept map', body: 'Core loop: Book → Auto-remind (SMS) → Confirm or reschedule → Log result. No account needed for the client. One-tap for the stylist.' },
    { icon: '✅', title: 'Viability check', body: 'Twilio SMS ~$0.0079/msg. At 20 bookings/wk that\'s $0.63/wk. Charge $12/mo flat. 90% margin. No app store required — PWA.' },
  ];
  return (
    <div style={proofShell}>
      <div style={proofHeader}>
        <span style={proofEye}>💡</span>
        <div>
          <p style={proofTitle}>Concept document · Salon Reminder</p>
          <p style={proofSub}>Product Concept Lab · discovery phase</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {steps.map((s, i) => (
          <div key={i} onClick={() => setStep(i)} style={{ flex: 1, height: 4, borderRadius: 4, cursor: 'pointer', background: i <= step ? '#ff3b30' : 'rgba(0,0,0,0.08)', transition: 'background 0.2s' }} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}
          style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 14, padding: '18px 16px', minHeight: 110 }}>
          <p style={{ fontSize: 22, marginBottom: 8 }}>{steps[step].icon}</p>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1c1c1e', marginBottom: 6, letterSpacing: '-0.2px' }}>{steps[step].title}</p>
          <p style={{ fontSize: 13, color: 'rgba(28,28,30,0.62)', lineHeight: 1.6 }}>{steps[step].body}</p>
        </motion.div>
      </AnimatePresence>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: '7px 16px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: step === 0 ? 'default' : 'pointer', opacity: step === 0 ? 0.3 : 1, color: '#1c1c1e' }}>← Back</button>
        <span style={{ fontSize: 12, color: 'rgba(28,28,30,0.38)', alignSelf: 'center' }}>{step + 1} / {steps.length}</span>
        <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1} style={{ padding: '7px 16px', borderRadius: 100, border: 'none', background: step === steps.length - 1 ? 'rgba(0,0,0,0.06)' : '#ff3b30', color: step === steps.length - 1 ? 'rgba(28,28,30,0.3)' : '#fff', fontSize: 13, fontWeight: 700, cursor: step === steps.length - 1 ? 'default' : 'pointer' }}>Next →</button>
      </div>
    </div>
  );
}

function TechDiligenceProofCard() {
  const items = [
    { area: 'Authentication', finding: 'JWT tokens never expire — no refresh logic implemented', risk: 'high' },
    { area: 'Database', finding: 'All queries use SELECT * — no indexing on user_id columns', risk: 'medium' },
    { area: 'API keys', finding: 'Stripe secret key is hardcoded in /utils/payment.js', risk: 'high' },
    { area: 'Dependencies', finding: '4 packages with known CVEs — lodash 4.17.15, axios 0.21.1', risk: 'medium' },
    { area: 'Deployments', finding: 'No staging environment — pushes go straight to production', risk: 'low' },
    { area: 'Error logging', finding: 'No Sentry or equivalent — errors silently swallowed', risk: 'low' },
  ];
  const riskColor = (r: string) => ({ high: '#ff3b30', medium: '#ff9f0a', low: '#30d158' }[r] || '#888');
  const riskBg = (r: string) => ({ high: 'rgba(255,59,48,0.08)', medium: 'rgba(255,159,10,0.08)', low: 'rgba(48,209,88,0.08)' }[r] || 'transparent');
  return (
    <div style={proofShell}>
      <div style={proofHeader}>
        <span style={proofEye}>🔍</span>
        <div>
          <p style={proofTitle}>Tech Due Diligence · SaaS target</p>
          <p style={proofSub}>Codebase audit · 6 risk areas flagged</p>
        </div>
        <span style={{ ...pill, background: 'rgba(255,59,48,0.08)', color: '#ff3b30', marginLeft: 'auto' }}>2 critical</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: riskBg(item.risk), border: `0.5px solid ${riskColor(item.risk)}22`, borderRadius: 10, padding: '9px 12px' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: riskColor(item.risk), textTransform: 'uppercase' as const, letterSpacing: '0.06em', width: 40, flexShrink: 0, paddingTop: 1 }}>{item.risk}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1c1c1e', marginBottom: 2 }}>{item.area}</p>
              <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.55)', lineHeight: 1.4 }}>{item.finding}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 10 }}>
        <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)', fontWeight: 600 }}>Deliverable: risk memo + remediation checklist, ready to share with legal or investors</p>
      </div>
    </div>
  );
}

function SolutionsProofCard() {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const tickets = [12, 9, 5, 4, 3, 2];
  const max = Math.max(...tickets);
  const updates = [
    { date: 'Feb 3', text: 'Booking widget updated — 0 errors since deploy' },
    { date: 'Jan 28', text: 'Added Google Calendar sync — 3 staff accounts' },
    { date: 'Jan 14', text: 'SSL renewed, DNS TTL lowered for faster failover' },
    { date: 'Dec 19', text: 'Stripe webhook retry logic added' },
  ];
  return (
    <div style={proofShell}>
      <div style={proofHeader}>
        <span style={proofEye}>🔧</span>
        <div>
          <p style={proofTitle}>Solutions retainer · 6-month view</p>
          <p style={proofSub}>Ongoing support &amp; upkeep · issues over time</p>
        </div>
        <span style={{ ...pill, background: 'rgba(48,209,88,0.1)', color: '#1a7a35', marginLeft: 'auto' }}>↓ 83% issues</span>
      </div>
      {/* Sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 16, padding: '12px 12px 8px', background: 'rgba(0,0,0,0.03)', borderRadius: 12 }}>
        {tickets.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', borderRadius: 4, background: i === 0 ? '#ff3b30' : i === months.length - 1 ? '#30d158' : 'rgba(215,20,26,0.3)', height: `${(v / max) * 60 + 6}px`, transition: 'height 0.3s' }} />
            <span style={{ fontSize: 10, color: 'rgba(28,28,30,0.4)', fontWeight: 600 }}>{months[i]}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(28,28,30,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Recent updates</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {updates.map((u, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: 'rgba(28,28,30,0.38)', fontWeight: 600, whiteSpace: 'nowrap', paddingTop: 1, width: 44 }}>{u.date}</span>
            <span style={{ fontSize: 13, color: '#1c1c1e', lineHeight: 1.4 }}>{u.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────────────────
const proofShell: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  border: '0.5px solid rgba(255,255,255,0.9)',
  borderRadius: 18,
  padding: '18px 18px 16px',
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
};
const proofHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14,
};
const proofEye: React.CSSProperties = { fontSize: 22, flexShrink: 0, marginTop: 1 };
const proofTitle: React.CSSProperties = {
  fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1c1c1e', letterSpacing: '-0.2px', marginBottom: 2,
};
const proofSub: React.CSSProperties = { fontSize: 12, color: 'rgba(28,28,30,0.48)' };
const pill: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, whiteSpace: 'nowrap' as const,
};

// ── Services ─────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    key: 'qa',
    icon: '🧪',
    name: 'QA & User Testing',
    tag: 'Find issues before your customers do',
    desc: 'We go through your product the way real users do; clicking every flow, pushing edge cases, and writing up what breaks, what\'s confusing, and what\'s silently failing. You get a prioritized report your developer can act on immediately.',
    proof: <QAProofCard />,
    proofLabel: 'Sample QA report — interactive',
  },
  {
    key: 'product_lab',
    icon: '💡',
    name: 'Product Concept Lab',
    tag: 'Turn an idea into something buildable',
    desc: 'You have an idea but don\'t know if it\'s viable, who it\'s for, or how to build it. We work through problem definition, user mapping, concept structure, and basic viability so you leave with a clear document, not just a conversation.',
    proof: <ProductLabProofCard />,
    proofLabel: 'Sample concept document — interactive',
  },
  {
    key: 'tech_diligence',
    icon: '🔍',
    name: 'Tech Due Diligence',
    tag: 'Know what you\'re buying or building on',
    desc: 'Evaluating a product, considering an acquisition, or inheriting a codebase? We audit it for security risks, architectural decisions, dependency health, and hidden technical debt, and give you a clear risk memo you can share with investors or legal.',
    proof: <TechDiligenceProofCard />,
    proofLabel: 'Sample risk audit — interactive',
  },
  {
    key: 'solutions',
    icon: '🔧',
    name: 'Solutions & Ongoing Support',
    tag: 'Retainer-style upkeep for your tech',
    desc: 'Your tech stack works, until it doesn\'t. We stay close: handling integrations, chasing bugs, coordinating vendors, and making incremental improvements so problems stay small and your team stays focused on the work that matters.',
    proof: <SolutionsProofCard />,
    proofLabel: 'Sample retainer log — interactive',
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ConsultingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeProof, setActiveProof] = useState<string | null>(null);

  const toggle = (k: string) => setSelected(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter your name and a valid email address.');
      return;
    }
    if (selected.length === 0) {
      setErrorMsg('Please select at least one service.');
      return;
    }
    setStatus('loading'); setErrorMsg('');
    try {
      const lead = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim() || null,
        services: selected,
        message: message.trim() || null,
        source: 'consulting_page',
        created_at: new Date().toISOString(),
      };
      const res = await fetch('/api/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      if (!res.ok) throw new Error('Server error');
      setStatus('done');
    } catch {
      try {
        const { error } = await supabase.from('advisory_leads').insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          company: company.trim() || null,
          services: selected,
          message: message.trim() || null,
          source: 'consulting_page',
        });
        if (error) throw error;
        setStatus('done');
      } catch {
        setStatus('error');
        setErrorMsg('Something went wrong. Try again or email us directly at intel@gratiacore.com.');
      }
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 15px', borderRadius: 14, fontSize: 15, fontFamily: 'inherit',
    background: 'rgba(120,120,128,0.07)', border: '1px solid rgba(0,0,0,0.09)',
    color: '#1c1c1e', outline: 'none', transition: 'border-color 0.2s',
  };
  const selectedSvc = SERVICES.find(s => s.key === activeProof);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f2f2f7;font-family:'DM Sans',system-ui,sans-serif;color:#1c1c1e;-webkit-font-smoothing:antialiased;}
        @keyframes meshFloat1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(4%,6%) scale(1.08)}}
        @keyframes meshFloat2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-3%,4%) scale(1.12)}}
        .proof-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px}
        .proof-modal{width:min(520px,calc(100vw - 48px));background:rgba(255,255,255,0.97);border-radius:24px;padding:24px;box-shadow:0 40px 120px rgba(0,0,0,0.22);max-height:calc(100vh - 48px);overflow-y:auto}
        .svc-card{background:rgba(255,255,255,0.65);border:0.5px solid rgba(255,255,255,0.92);border-radius:20px;padding:22px 22px 18px;backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);box-shadow:0 2px 12px rgba(0,0,0,0.06);cursor:pointer;transition:all 0.18s;position:relative}
        .svc-card.selected{border-color:rgba(255,59,48,0.4);box-shadow:0 0 0 2px rgba(255,59,48,0.18),0 4px 20px rgba(255,59,48,0.1)}
        .svc-card:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,0.1)}
        .check-ring{width:22px;height:22px;border-radius:50%;border:2px solid rgba(0,0,0,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s}
        .check-ring.on{background:#ff3b30;border-color:#ff3b30}
        .proof-btn{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#ff3b30;background:rgba(255,59,48,0.07);border:0.5px solid rgba(255,59,48,0.2);border-radius:100px;padding:5px 12px;cursor:pointer;transition:all 0.15s;margin-top:10px}
        .proof-btn:hover{background:rgba(255,59,48,0.13)}
        .navbar{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:1000;display:flex;align-items:center;justify-content:space-between;padding:0 18px;height:56px;background:rgba(255,255,255,0.72);backdrop-filter:blur(40px) saturate(200%);-webkit-backdrop-filter:blur(40px) saturate(200%);border:1px solid rgba(255,255,255,0.95);border-radius:20px;box-shadow:0 -2px 24px rgba(0,0,0,0.06),0 8px 32px rgba(0,0,0,0.1),inset 0 1px 0 rgba(255,255,255,0.9)}
        .nav-pill{display:flex;align-items:center;gap:2px;background:rgba(120,120,128,0.1);border:1px solid rgba(0,0,0,0.05);border-radius:100px;padding:4px;position:absolute;left:50%;transform:translateX(-50%)}
        .nav-item{padding:6px 15px;font-size:13px;font-weight:600;color:rgba(28,28,30,0.55);text-decoration:none;border-radius:100px;cursor:pointer;transition:color 0.2s,background 0.2s}
        .nav-item:hover,.nav-item.active{color:#1c1c1e;background:rgba(255,255,255,0.6)}
        .btn-login{padding:8px 18px;font-size:13px;font-weight:600;color:rgba(28,28,30,0.75);text-decoration:none;background:rgba(255,255,255,0.45);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.9);border-radius:100px}
        .btn-signup{padding:8px 18px;font-size:13px;font-weight:700;color:#fff;background:linear-gradient(135deg,#ff3b30,#ff6b35);border:none;border-radius:100px;cursor:pointer;box-shadow:0 4px 16px rgba(255,59,48,0.38);text-decoration:none}
        @media(max-width:700px){.two-col{grid-template-columns:1fr!important}}
        @media(max-width:520px){.page-pad{padding:0 16px}}
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-12%', left: '-5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,59,48,0.08) 0%,transparent 70%)', filter: 'blur(40px)', animation: 'meshFloat1 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '40%', right: '-8%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,132,255,0.06) 0%,transparent 70%)', filter: 'blur(50px)', animation: 'meshFloat2 22s ease-in-out infinite' }} />
      </div>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '72px 24px 140px' }} className="page-pad">

        {/* Back */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ marginBottom: 36 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'rgba(28,28,30,0.45)', textDecoration: 'none' }}>← Back to Gratia Core</Link>
        </motion.div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 22 }} style={{ marginBottom: 52 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.2)', borderRadius: 100, padding: '5px 13px', fontSize: 11, fontWeight: 700, color: '#ff3b30', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3b30' }} /> Consulting · Free to ask
          </span>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(32px,5.5vw,58px)', fontWeight: 900, letterSpacing: '-2.5px', lineHeight: 1.05, color: '#1c1c1e', marginBottom: 18 }}>
            How can we<br />consult for you?
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(28,28,30,0.55)', lineHeight: 1.7, maxWidth: 560 }}>
            Pick the services that fit your situation. Each one has a visual example below so you know exactly what you&apos;re getting! Then tell us about your project.
          </p>
          <p style={{ marginTop: 10, fontSize: 12, color: 'rgba(28,28,30,0.35)' }}>
            Not legal, financial, or medical advice. Services are for informational and operational support only.
          </p>
        </motion.div>

        {/* Services */}
        <section style={{ marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(28,28,30,0.32)', marginBottom: 20 }}>Select what you need</p>
          <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {SERVICES.map((s, i) => (
              <motion.div key={s.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 24 }}>
                <div className={`svc-card${selected.includes(s.key) ? ' selected' : ''}`} onClick={() => toggle(s.key)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{s.icon}</span>
                      <div>
                        <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: '#1c1c1e', letterSpacing: '-0.3px', lineHeight: 1.2, marginBottom: 2 }}>{s.name}</p>
                        <p style={{ fontSize: 11, color: 'rgba(28,28,30,0.45)', fontWeight: 600 }}>{s.tag}</p>
                      </div>
                    </div>
                    <div className={`check-ring${selected.includes(s.key) ? ' on' : ''}`}>
                      {selected.includes(s.key) && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'rgba(28,28,30,0.58)', lineHeight: 1.65 }}>{s.desc}</p>
                  <button className="proof-btn" onClick={e => { e.stopPropagation(); setActiveProof(s.key); }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {s.proofLabel}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Form */}
        <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 140, damping: 22 }}
          style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(255,255,255,0.92)', borderRadius: 24, padding: '32px 28px', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

          <AnimatePresence mode="wait">
            {status === 'done' ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: '#1c1c1e', marginBottom: 10 }}>Got it — we&apos;ll be in touch.</h2>
                <p style={{ fontSize: 15, color: 'rgba(28,28,30,0.55)', lineHeight: 1.65, maxWidth: 400, margin: '0 auto 24px' }}>
                  We aim to reply within one business day. You&apos;ll hear from us at <strong style={{ color: '#1c1c1e' }}>{email}</strong>.
                </p>
                <Link href="/" style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', borderRadius: 100, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>← Back to Gratia Core</Link>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.5px', marginBottom: 4 }}>Tell us about your project</h2>
                <p style={{ fontSize: 13, color: 'rgba(28,28,30,0.45)', marginBottom: 8 }}>
                  {selected.length === 0 ? 'Select at least one service above, then fill this in.' : `Selected: ${selected.map(k => SERVICES.find(s => s.key === k)?.name).join(', ')}`}
                </p>
                <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(28,28,30,0.5)', letterSpacing: '0.04em' }}>Your name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder=" Jane Doe" style={inp} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(28,28,30,0.5)', letterSpacing: '0.04em' }}>Email address *</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="janedoe@company.com" style={inp} required />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(28,28,30,0.5)', letterSpacing: '0.04em' }}>Company or project <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="XYZ Inc." style={inp} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(28,28,30,0.5)', letterSpacing: '0.04em' }}>What&apos;s going on? <span style={{ fontWeight: 400 }}>(optional but helpful)</span></label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Describe what you're trying to solve, build, or understand. The more context you give, the better we can help." style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                </div>
                {errorMsg && <p style={{ fontSize: 13, color: '#ff3b30', fontWeight: 600 }}>{errorMsg}</p>}
                <button type="submit" disabled={status === 'loading'} style={{ padding: '15px 0', borderRadius: 100, fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', boxShadow: '0 4px 18px rgba(255,59,48,0.38)', transition: 'all 0.2s' }}>
                  {status === 'loading' ? 'Sending…' : 'Start a conversation →'}
                </button>
                <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.35)', textAlign: 'center', lineHeight: 1.6 }}>
                  Free to ask. No commitment. We&apos;ll reply within one business day.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.section>
      </main>

      {/* Proof modal */}
      <AnimatePresence>
        {activeProof && selectedSvc && (
          <motion.div className="proof-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveProof(null)}>
            <motion.div className="proof-modal" initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(28,28,30,0.38)', marginBottom: 4 }}>What this looks like</p>
                  <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.4px' }}>{selectedSvc.name}</p>
                </div>
                <button onClick={() => setActiveProof(null)} style={{ background: 'rgba(0,0,0,0.07)', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c1c1e' }}>✕</button>
              </div>
              {selectedSvc.proof}
              <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(255,59,48,0.05)', borderRadius: 12, border: '0.5px solid rgba(255,59,48,0.15)' }}>
                <p style={{ fontSize: 12, color: '#cc2018', lineHeight: 1.55 }}>
                  <strong>This is a sample.</strong> Your actual deliverable will match your specific situation, product, and goals.
                </p>
              </div>
              <button onClick={() => { setActiveProof(null); toggle(selectedSvc.key); }} style={{ width: '100%', marginTop: 14, padding: '13px 0', borderRadius: 100, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: selected.includes(selectedSvc.key) ? 'rgba(0,0,0,0.07)' : 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: selected.includes(selectedSvc.key) ? 'rgba(28,28,30,0.5)' : '#fff' }}>
                {selected.includes(selectedSvc.key) ? '✓ Selected — remove' : `Add ${selectedSvc.name} →`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <header className="navbar">
        <nav className="nav-pill">
          <Link href="/advisory" className="nav-item active">Consulting</Link>
          <Link href="/#branches" className="nav-item">Modules</Link>
          <Link href="/pricing" className="nav-item">Pricing</Link>
          <Link href="/about" className="nav-item">About</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" className="btn-login">Log in</Link>
          <Link href="/signup" className="btn-signup">Get started</Link>
        </div>
      </header>
    </>
  );
}