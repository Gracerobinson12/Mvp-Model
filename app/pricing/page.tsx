'use client';

/**
 * app/pricing/page.tsx
 * Drop into: app/pricing/page.tsx
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { QuickSignupModal } from '@/components/QuickSignupModal';

type Billing = 'monthly' | 'annual';

// ── Brand Icon ────────────────────────────────────────────────
function GCIcon({ size = 28 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

const FEATURES = [
  {
    id: 'vault', dot: '#af52de',
    name: 'Ideas vault',
    desc: 'Timestamps your concept with an immutable dated record before you share it with anyone. If ownership is ever disputed, you have documented proof it was yours first — without needing a lawyer.',
    individual: true, business: true,
  },
  {
    id: 'barter', dot: '#1a7a35',
    name: 'Barter exchange',
    desc: 'Match with verified individuals or businesses open to service trades. Every agreement is digitally countersigned — no handshake deals, no disputes about what was agreed.',
    individual: true, business: true,
  },
  {
    id: 'duty', dot: '#ff9500',
    name: 'Sample duty lookup',
    desc: 'Calculate customs costs before ordering samples from Alibaba or overseas suppliers. Avoid surprise fees at the door — know your real cost before you click order.',
    individual: true, business: true,
  },
  {
    id: 'tariff', dot: '#ff3b30',
    name: 'Tariff intelligence',
    desc: 'Full HTS duty rate database, Section 301 alerts, and a landed-cost calculator that updates as trade policy shifts. Know your exact import margin before any purchase order is placed.',
    individual: false, business: true,
  },
  {
    id: 'regulatory', dot: '#7c3aed',
    name: 'Regulatory updates',
    desc: 'FDA, OSHA, customs, and major regulatory bodies monitored for your industry. AI-summarized in plain language before changes hit the news cycle — so you\'re never caught off guard by a client.',
    individual: false, business: true,
  },
  {
    id: 'market', dot: '#0a84ff',
    name: 'Market intelligence',
    desc: 'Weekly demand signals from your specific industry vertical — pricing shifts, competitor moves, and emerging patterns flagged early. Act on trends before your competitors even notice them.',
    individual: false, business: true,
  },
  {
    id: 'shield', dot: '#b45309',
    name: 'Shield',
    desc: 'Automatically redacts sensitive client data — names, account numbers, and custom entity types — before any AI prompt leaves your team. Full audit trail so compliance is always provable, not just assumed.',
    individual: false, business: true,
  },
];

// ── Promo strip ───────────────────────────────────────────────
function PromoStrip() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.48)',
      backdropFilter: 'blur(30px) saturate(160%)',
      WebkitBackdropFilter: 'blur(30px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.75)',
      borderTop: '1.5px solid rgba(255,255,255,0.9)',
      borderRadius: '0 0 22px 22px',
      padding: '12px 18px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 7 }}>
        <span style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)' }}>Early access code</span>
        <span style={{
          fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 900,
          letterSpacing: '0.08em', color: '#ff3b30',
          background: 'rgba(255,59,48,0.08)',
          border: '1.5px dashed rgba(255,59,48,0.3)',
          padding: '2px 10px', borderRadius: 5,
        }}>FOUNDING</span>
        <span style={{ fontSize: 12, color: 'rgba(28,28,30,0.4)' }}>— locks your rate forever</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 11, color: 'rgba(28,28,30,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Secured by Stripe
        </span>
        <span style={{ fontSize: 11, color: 'rgba(28,28,30,0.4)' }}>✕ Cancel anytime</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const [showModal, setShowModal] = useState(false);

  const prices = {
    individual: billing === 'monthly'
      ? { price: '$19', suffix: '/mo', sub: 'Billed monthly' }
      : { price: '$149', suffix: '/yr', sub: 'One payment · saves $79 vs monthly' },
    business: billing === 'monthly'
      ? { price: '$99', suffix: '/mo', sub: 'Billed monthly' }
      : { price: '$899', suffix: '/yr', sub: 'One payment · saves $289 vs monthly' },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        body {
          font-family:'DM Sans',system-ui,sans-serif;
          color:#1c1c1e;
          overflow-x:hidden;
          -webkit-font-smoothing:antialiased;
          background:
            radial-gradient(ellipse 80% 60% at 18% -8%, rgba(255,59,48,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 82% 110%, rgba(10,132,255,0.16) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 58% 38%, rgba(255,59,48,0.08) 0%, transparent 60%),
            #eae6f2;
          min-height:100vh;
        }

        /* Glass ticker */
        .gc-ticker-bar {
          position:fixed; top:0; left:0; right:0; z-index:1001; height:34px;
          background:rgba(255,255,255,0.55);
          backdrop-filter:blur(40px) saturate(180%);
          -webkit-backdrop-filter:blur(40px) saturate(180%);
          border-bottom:1px solid rgba(255,255,255,0.8);
          box-shadow:0 2px 0 rgba(255,255,255,0.9) inset, 0 4px 20px rgba(0,0,0,0.06);
          display:flex; align-items:center; overflow:hidden;
        }
        .gc-ticker-label {
          flex-shrink:0; padding:0 12px 0 14px;
          font-size:10px; font-weight:800; letter-spacing:0.12em;
          text-transform:uppercase; color:#ff3b30;
          border-right:1px solid rgba(255,59,48,0.2);
          height:100%; display:flex; align-items:center;
          white-space:nowrap; background:rgba(255,255,255,0.3);
        }
        .gc-ticker-track {
          display:flex; align-items:center;
          animation:gcTickerScroll 28s linear infinite; white-space:nowrap;
        }
        .gc-ticker-track:hover { animation-play-state:paused; }
        .gc-ticker-item { font-size:11px; color:rgba(28,28,30,0.65); padding:0 28px; display:flex; align-items:center; gap:7px; }
        .gc-ticker-dot { width:4px; height:4px; border-radius:50%; background:#ff3b30; flex-shrink:0; }
        .gc-ticker-code { font-weight:800; color:#ff3b30; background:rgba(255,59,48,0.1); border:1px solid rgba(255,59,48,0.25); padding:1px 6px; border-radius:4px; font-size:10px; letter-spacing:0.05em; }
        @keyframes gcTickerScroll { 0%{transform:translateX(0);}100%{transform:translateX(-50%);} }

        /* Top-left wordmark */
        .top-wordmark { position:fixed; top:48px; left:22px; z-index:1000; display:flex; align-items:center; gap:9px; }
        .top-wordmark span { font-family:'Sora',sans-serif; font-size:15px; font-weight:800; letter-spacing:-0.4px; color:#1c1c1e; }

        /* Bottom navbar */
        .navbar { position:fixed; bottom:16px; left:50%; transform:translateX(-50%); width:calc(100% - 48px); max-width:1100px; z-index:1000; display:flex; align-items:center; justify-content:space-between; padding:0 18px; height:56px; background:rgba(255,255,255,0.72); backdrop-filter:blur(40px) saturate(200%); -webkit-backdrop-filter:blur(40px) saturate(200%); border:1px solid rgba(255,255,255,0.95); border-radius:20px; box-shadow:0 -2px 24px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9); }
        .nav-pill { display:flex; align-items:center; gap:2px; background:rgba(120,120,128,0.1); border:1px solid rgba(0,0,0,0.05); border-radius:100px; padding:4px; position:absolute; left:50%; transform:translateX(-50%); }
        .nav-item { padding:6px 15px; font-size:13px; font-weight:600; color:rgba(28,28,30,0.55); text-decoration:none; border-radius:100px; cursor:pointer; transition:color 0.2s, background 0.2s; }
        .nav-item:hover { color:#1c1c1e; background:rgba(255,255,255,0.6); }
        .nav-item.active { color:#1c1c1e; background:rgba(255,255,255,0.6); }
        .btn-login { padding:8px 18px; font-size:13px; font-weight:600; color:rgba(28,28,30,0.75); text-decoration:none; background:rgba(255,255,255,0.45); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.9); border-radius:100px; cursor:pointer; transition:all 0.2s; display:inline-block; }
        .btn-signup { padding:8px 18px; font-size:13px; font-weight:700; color:#fff; background:linear-gradient(135deg,#ff3b30,#ff6b35); border:none; border-radius:100px; cursor:pointer; box-shadow:0 4px 16px rgba(255,59,48,0.38); transition:all 0.2s; white-space:nowrap; }
        .btn-signup:hover { transform:translateY(-1px); }

        /* Glass card base */
        .glass-card {
          background:rgba(255,255,255,0.52);
          backdrop-filter:blur(40px) saturate(180%);
          -webkit-backdrop-filter:blur(40px) saturate(180%);
          border:1px solid rgba(255,255,255,0.78);
          border-bottom:none;
          border-radius:22px 22px 0 0;
          box-shadow:0 2px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.04) inset, 0 20px 60px rgba(0,0,0,0.1);
          position:relative; overflow:hidden;
        }
        .glass-card.featured {
          background:rgba(255,255,255,0.64);
          border:1.5px solid rgba(255,255,255,0.88);
          border-bottom:none;
          box-shadow:0 2px 0 rgba(255,255,255,0.95) inset, 0 32px 80px rgba(10,132,255,0.15), 0 8px 24px rgba(0,0,0,0.09);
          transform:scale(1.025);
          transform-origin:bottom center;
        }

        /* Toggle */
        .tog-pill { display:inline-flex; background:rgba(255,255,255,0.45); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.72); border-radius:100px; padding:3px; box-shadow:0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8); }
        .tog-btn { padding:8px 22px; border-radius:100px; font-size:13px; font-weight:600; cursor:pointer; border:none; background:transparent; color:rgba(28,28,30,0.45); font-family:'DM Sans',sans-serif; transition:all 0.2s; }
        .tog-btn.on { background:rgba(255,255,255,0.9); color:#1c1c1e; box-shadow:0 1px 6px rgba(0,0,0,0.1); }

        /* Feature rows */
        .feat-row { display:flex; align-items:center; gap:10px; padding:9px 0; font-size:13px; color:rgba(28,28,30,0.7); }
        .feat-row + .feat-row { border-top:0.5px solid rgba(255,255,255,0.65); }

        /* CTA buttons */
        .cta-purple { width:100%; padding:13px; border-radius:100px; background:linear-gradient(135deg,rgba(175,82,222,0.88),rgba(191,90,242,0.88)); color:#fff; border:1px solid rgba(255,255,255,0.3); font-size:14px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 4px 16px rgba(175,82,222,0.32), inset 0 1px 0 rgba(255,255,255,0.25); transition:all 0.2s; }
        .cta-purple:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(175,82,222,0.4); }
        .cta-blue { width:100%; padding:13px; border-radius:100px; background:linear-gradient(135deg,rgba(10,132,255,0.88),rgba(52,170,220,0.88)); color:#fff; border:1px solid rgba(255,255,255,0.3); font-size:14px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 4px 16px rgba(10,132,255,0.32), inset 0 1px 0 rgba(255,255,255,0.25); transition:all 0.2s; }
        .cta-blue:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(10,132,255,0.4); }

        /* Comparison table */
        .comp-table { background:rgba(255,255,255,0.42); backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px); border:1px solid rgba(255,255,255,0.72); border-radius:20px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.85); }
        .comp-row { display:grid; grid-template-columns:1fr 100px 100px; }
        .comp-row + .comp-row { border-top:0.5px solid rgba(255,255,255,0.55); }
        .comp-row.alt { background:rgba(255,255,255,0.2); }
        .comp-row.hdr { background:rgba(255,255,255,0.35); }
        .comp-cell { padding:12px 16px; }
        .comp-cell.ctr { text-align:center; display:flex; align-items:center; justify-content:center; font-size:16px; }
        .badge-biz { font-size:9px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:2px 7px; border-radius:100px; background:rgba(10,132,255,0.1); color:#185fa5; }

        @keyframes priceSlide { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);} }
        .price-animate { animation:priceSlide 0.28s ease; }

        .live-dot { width:6px;height:6px;border-radius:50%;background:#30d158;box-shadow:0 0 0 3px rgba(48,209,88,0.2);animation:livePulse 2s ease-in-out infinite;flex-shrink:0; }
        @keyframes livePulse { 0%,100%{box-shadow:0 0 0 3px rgba(48,209,88,0.2);}50%{box-shadow:0 0 0 6px rgba(48,209,88,0.07);} }
      `}</style>

      {/* Glass ticker */}
      <div className="gc-ticker-bar" role="marquee" aria-label="Live updates">
        <div className="gc-ticker-label">Early access</div>
        <div style={{ overflow: 'hidden', flex: 1, display: 'flex' }}>
          <div className="gc-ticker-track">
            {[0, 1].map((d) => (
              <React.Fragment key={d}>
                <div className="gc-ticker-item"><span className="gc-ticker-dot" />Use code <span className="gc-ticker-code">FOUNDING</span> at checkout — lock in your price forever</div>
                <div className="gc-ticker-item"><span className="gc-ticker-dot" />7-day free trial · Card saved, not charged until day 8 · Cancel anytime</div>
                <div className="gc-ticker-item"><span className="gc-ticker-dot" />Early access pricing ends at launch · Founding members keep their rate for life</div>
                <div className="gc-ticker-item"><span className="gc-ticker-dot" />Ideas vault · Barter exchange · Tariff intelligence · Regulatory updates · Shield now live</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Top-left wordmark */}
      <div className="top-wordmark">
        <GCIcon size={26} />
        <span>Gratia Core</span>
      </div>

      {/* Main content */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '110px 24px 140px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: 100, padding: '5px 14px 5px 10px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="live-dot" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(28,28,30,0.55)' }}>Early access open</span>
          </div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1, color: '#1c1c1e', marginBottom: 10 }}>
            Simple, honest pricing.
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(28,28,30,0.5)', marginBottom: 24 }}>
            7 days free. Cancel before day 8 — pay nothing.
          </p>

          {/* Billing toggle */}
          <div className="tog-pill">
            <button
              className={`tog-btn${billing === 'monthly' ? ' on' : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Monthly
            </button>
            <button
              className={`tog-btn${billing === 'annual' ? ' on' : ''}`}
              onClick={() => setBilling('annual')}
            >
              Annual &nbsp;
              <span style={{ fontSize: 10, fontWeight: 700, color: '#1a7a35', background: 'rgba(48,209,88,0.15)', border: '0.5px solid rgba(48,209,88,0.3)', padding: '2px 7px', borderRadius: 100 }}>
                Save 35%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Price cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, alignItems: 'end' }}>

          {/* Individual */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 180, damping: 22 }}
          >
            <div className="glass-card" style={{ padding: '28px 26px 24px' }}>
              <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle,rgba(175,82,222,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c3aed', background: 'rgba(175,82,222,0.1)', border: '0.5px solid rgba(175,82,222,0.2)', padding: '3px 10px', borderRadius: 100, width: 'fit-content', marginBottom: 18 }}>Individual</div>
              <div key={billing} className="price-animate" style={{ marginBottom: 4 }}>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 52, fontWeight: 900, letterSpacing: '-3px', color: '#1c1c1e', lineHeight: 1 }}>{prices.individual.price}</span>
                <span style={{ fontSize: 16, color: 'rgba(28,28,30,0.38)', fontWeight: 400 }}>{prices.individual.suffix}</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.4)', marginBottom: 22 }}>{prices.individual.sub}</p>
              <div style={{ marginBottom: 22 }}>
                {[
                  { dot: '#af52de', text: 'Ideas vault' },
                  { dot: '#1a7a35', text: 'Barter exchange' },
                  { dot: '#ff9500', text: 'Sample duty lookup' },
                ].map((f, i) => (
                  <div key={i} className="feat-row">
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: f.dot, flexShrink: 0 }} />
                    {f.text}
                  </div>
                ))}
              </div>
              <button className="cta-purple" onClick={() => setShowModal(true)}>Start 7-day trial →</button>
              <p style={{ fontSize: 11, color: 'rgba(28,28,30,0.3)', textAlign: 'center', marginTop: 8 }}>Card saved · not charged until day 8</p>
            </div>
            <PromoStrip />
          </motion.div>

          {/* Business */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, type: 'spring', stiffness: 180, damping: 22 }}
          >
            <div className="glass-card featured" style={{ padding: '28px 26px 24px' }}>
              <div style={{ position: 'absolute', top: -40, left: -20, width: 170, height: 170, borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,132,255,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'linear-gradient(135deg,#0a84ff,#34aadc)', color: '#fff', padding: '4px 14px', borderRadius: '0 0 12px 12px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(10,132,255,0.3)' }}>Most popular</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#185fa5', background: 'rgba(10,132,255,0.1)', border: '0.5px solid rgba(10,132,255,0.2)', padding: '3px 10px', borderRadius: 100, width: 'fit-content', marginBottom: 18, marginTop: 14 }}>Business</div>
              <div key={billing + 'biz'} className="price-animate" style={{ marginBottom: 4 }}>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 52, fontWeight: 900, letterSpacing: '-3px', color: '#1c1c1e', lineHeight: 1 }}>{prices.business.price}</span>
                <span style={{ fontSize: 16, color: 'rgba(28,28,30,0.38)', fontWeight: 400 }}>{prices.business.suffix}</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.4)', marginBottom: 22 }}>{prices.business.sub}</p>
              <div style={{ marginBottom: 22 }}>
                {[
                  { dot: '#ff3b30', text: 'Tariff intelligence' },
                  { dot: '#7c3aed', text: 'Regulatory updates' },
                  { dot: '#0a84ff', text: 'Market intelligence' },
                  { dot: '#b45309', text: 'Shield — AI data protection' },
                ].map((f, i) => (
                  <div key={i} className="feat-row">
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: f.dot, flexShrink: 0 }} />
                    {f.text}
                  </div>
                ))}
              </div>
              <button className="cta-blue" onClick={() => setShowModal(true)}>Start 7-day trial →</button>
              <p style={{ fontSize: 11, color: 'rgba(28,28,30,0.3)', textAlign: 'center', marginTop: 8 }}>Card saved · not charged until day 8</p>
            </div>
            <div style={{ transform: 'scale(1.025)', transformOrigin: 'top center' }}>
              <PromoStrip />
            </div>
          </motion.div>
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        >
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: '-0.8px', color: '#1c1c1e', marginBottom: 16 }}>
            What&apos;s included — in detail
          </h2>
          <div className="comp-table">

            {/* Header row */}
            <div className="comp-row hdr">
              <div className="comp-cell" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(28,28,30,0.38)' }}>Feature</div>
              <div className="comp-cell ctr" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7c3aed' }}>Individual</div>
              <div className="comp-cell ctr" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#185fa5' }}>Business</div>
            </div>

            {FEATURES.map((f, i) => (
              <div key={f.id} className={`comp-row${i % 2 === 0 ? '' : ' alt'}`}>
                <div className="comp-cell">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e' }}>{f.name}</span>
                    {!f.individual && <span className="badge-biz">Business</span>}
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)', lineHeight: 1.6, paddingLeft: 16 }}>{f.desc}</p>
                </div>
                <div className="comp-cell ctr">
                  {f.individual
                    ? <span style={{ color: '#1a7a35', fontWeight: 700, fontSize: 17 }}>✓</span>
                    : <span style={{ color: 'rgba(28,28,30,0.15)', fontSize: 17 }}>—</span>}
                </div>
                <div className="comp-cell ctr">
                  <span style={{ color: '#1a7a35', fontWeight: 700, fontSize: 17 }}>✓</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Back to homepage */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(28,28,30,0.45)', textDecoration: 'none', fontWeight: 500 }}>
            ← Back to home
          </Link>
        </div>
      </main>

      {/* Bottom navbar */}
      <header className="navbar">
        <nav className="nav-pill">
          <Link href="/#modules" className="nav-item">Modules</Link>
          <Link href="/pricing" className="nav-item active">Pricing</Link>
          <Link href="/about" className="nav-item">About</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" className="btn-login">Log in</Link>
          <button onClick={() => setShowModal(true)} className="btn-signup">Try free</button>
        </div>
      </header>

      {showModal && <QuickSignupModal onClose={() => setShowModal(false)} />}
    </>
  );
}