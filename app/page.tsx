'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Transition } from 'motion/react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { QuickSignupModal } from '@/components/QuickSignupModal';

// ── Module data ───────────────────────────────────────────────
const PERSONAL_MODULES = [
  {
    id: 'vault', name: 'Ideas vault', icon: '💡', color: '#af52de',
    tagline: 'Document it before you pitch it.',
    desc: 'Timestamp your concept with a dated, immutable record before you share it with anyone. Proof the idea was yours — available the moment you need it.',
    stat: 'Timestamped. Documented. Yours.',
  },
  {
    id: 'barter', name: 'Barter exchange', icon: '🤝', color: '#1a7a35',
    tagline: 'Trade services with a paper trail.',
    desc: 'Match with verified freelancers and founders open to service exchanges. Every agreement is generated, documented, and countersigned — no handshake deals.',
    stat: 'Every deal documented',
  },
  {
    id: 'duty', name: 'Sample duty lookup', icon: '⚓', color: '#ff9500',
    tagline: 'Know your Alibaba cost before it ships.',
    desc: 'Ordering samples from a Chinese or overseas supplier? Enter the product and origin country — get your estimated customs duty before the order is placed, not after it arrives.',
    stat: 'No customs surprises',
  },
];

const BUSINESS_MODULES = [
  {
    id: 'tariff', name: 'Tariff intelligence', icon: '⚓', color: '#ff3b30',
    tagline: 'Know your landed cost before you commit.',
    desc: 'Real-time HTS duty rates, Section 301 alerts, and a landed-cost calculator that updates as trade policy shifts. Know your margin before the order is placed.',
    stat: 'Know before you order',
  },
  {
    id: 'regulatory', name: 'Regulatory updates', icon: '⚖️', color: '#7c3aed',
    tagline: 'Industry compliance, in plain language.',
    desc: 'FDA, OSHA, customs, and major regulatory bodies monitored for your industry. Changes are AI-summarized before they hit the news cycle — no legal team required.',
    stat: 'Plain language. Fast alerts.',
  },
  {
    id: 'market', name: 'Market intelligence', icon: '📈', color: '#0a84ff',
    tagline: 'Spot trends before your competitors do.',
    desc: 'Weekly demand signals from your specific industry vertical — pricing shifts, competitor moves, and emerging patterns flagged early so you can act first.',
    stat: 'Signals refreshed weekly',
  },
  {
    id: 'shield', name: 'Shield', icon: '🛡️', color: '#b45309',
    tagline: 'Client data stays out of every AI model.',
    desc: 'Redacts sensitive business data before any AI prompt is sent — client names, account numbers, and custom entity types your team defines. Full audit trail included.',
    stat: 'Data stays yours',
  },
];

// ── Letter Reveal ─────────────────────────────────────────────
function LetterReveal({ text, delay = 0, color = 'inherit' }: {
  text: string; delay?: number; color?: string;
}) {
  return (
    <span style={{ display: 'inline-flex' }}>
      {text.split('').map((char, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', lineHeight: 1 }}>
          <motion.span
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260, delay: delay + i * 0.048 } as Transition}
            style={{ display: 'inline-block', color }}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// ── Gratia Intro ──────────────────────────────────────────────
function GratiaIntro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'reveal' | 'hold' | 'exit' | 'done'>('reveal');
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 2300);
    const t2 = setTimeout(() => setPhase('exit'), 3300);
    const t3 = setTimeout(() => { setPhase('done'); onComplete(); }, 4100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);
  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div key="intro" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.65, ease: 'easeInOut' }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7' }}>
          <div style={{ display: 'flex', gap: '0.3em', fontSize: 'clamp(44px, 9vw, 92px)', fontFamily: "'Sora', 'Arial Black', sans-serif", fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            <LetterReveal text="GRATIA" delay={0.1} color="#1c1c1e" />
            <LetterReveal text="CORE" delay={0.40} color="#ff3b30" />
          </div>
          <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 1.55, duration: 0.55, ease: 'easeOut' }}
            style={{ marginTop: 20, height: 1, width: 110, background: 'rgba(28,28,30,0.15)', transformOrigin: 'left' }} />
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.9, duration: 0.5 }}
            style={{ marginTop: 16, fontSize: 12, letterSpacing: '0.14em', color: 'rgba(28,28,30,0.4)', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>
            Business intelligence, built for businesses
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Brand Icon ────────────────────────────────────────────────
function GCIcon({ size = 36 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

// ── 3D Toggle Carousel ────────────────────────────────────────
function ModuleToggleCarousel() {
  const [audience, setAudience] = useState<'personal' | 'business'>('personal');
  const [active, setActive] = useState(0);
  const modules = audience === 'personal' ? PERSONAL_MODULES : BUSINESS_MODULES;
  const current = modules[active];
  useEffect(() => { setActive(0); }, [audience]);

  const getCardStyle = (idx: number): React.CSSProperties => {
    let pos = idx - active;
    const total = modules.length;
    if (pos > total / 2) pos -= total;
    if (pos < -total / 2) pos += total;
    const abs = Math.abs(pos);
    if (abs > 2) return { opacity: 0, pointerEvents: 'none', zIndex: 0 };
    const cfg: Record<number, { tx: number; ry: number; sc: number; op: number; tz: number }> = {
      [-2]: { tx: -265, ry: 54, sc: 0.50, op: 0.28, tz: -130 },
      [-1]: { tx: -145, ry: 32, sc: 0.74, op: 0.70, tz: -65 },
      [0]:  { tx: 0, ry: 0, sc: 1, op: 1, tz: 0 },
      [1]:  { tx: 145, ry: -32, sc: 0.74, op: 0.70, tz: -65 },
      [2]:  { tx: 265, ry: -54, sc: 0.50, op: 0.28, tz: -130 },
    };
    const c = cfg[pos] ?? (pos < 0 ? cfg[-2] : cfg[2]);
    return {
      transform: `translateX(${c.tx}px) translateZ(${c.tz}px) rotateY(${c.ry}deg) scale(${c.sc})`,
      opacity: c.op, zIndex: abs === 0 ? 10 : abs === 1 ? 5 : 2,
      pointerEvents: abs === 0 ? 'none' : 'auto',
      cursor: abs > 0 ? 'pointer' : 'default',
    };
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 12 }}>What you get</p>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, letterSpacing: '-1.8px', lineHeight: 1.1, color: '#1c1c1e', marginBottom: 28 }}>
          Built for individuals.<br />Scaled for business.
        </h2>
        <div style={{ display: 'inline-flex', gap: 3, background: 'rgba(120,120,128,0.1)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 100, padding: 4 }}>
          {(['personal', 'business'] as const).map((a) => (
            <button key={a} onClick={() => setAudience(a)} style={{
              padding: '8px 22px', borderRadius: 100, fontSize: 13, fontWeight: 600,
              border: audience === a ? '1px solid rgba(0,0,0,0.1)' : 'none',
              background: audience === a ? '#fff' : 'transparent',
              color: audience === a ? '#1c1c1e' : 'rgba(28,28,30,0.5)',
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'DM Sans',sans-serif",
              boxShadow: audience === a ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
              {a === 'personal' ? 'For individuals' : 'For businesses'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', height: 420, perspective: '1100px', perspectiveOrigin: '50% 50%', marginBottom: 36 }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transformStyle: 'preserve-3d' }}>
          {modules.map((mod, idx) => (
            <div key={`${audience}-${mod.id}`}
              onClick={() => {
                let pos = idx - active;
                const total = modules.length;
                if (pos > total / 2) pos -= total;
                if (pos < -total / 2) pos += total;
                if (pos !== 0) setActive(idx);
              }}
              style={{
                position: 'absolute', width: 300, height: 380, borderRadius: 24,
                background: mod.color, display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', padding: '24px 24px 28px', overflow: 'hidden',
                transition: 'transform 0.5s cubic-bezier(0.34,1.2,0.64,1), opacity 0.4s ease',
                ...getCardStyle(idx),
              }}
            >
              <div style={{ position: 'absolute', bottom: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'absolute', top: -30, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 12 }}>{mod.icon}</div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 100 }}>
                  {audience === 'personal' ? 'Personal' : 'Business'}
                </span>
              </div>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>{mod.stat}</p>
                <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 900, letterSpacing: '-0.8px', lineHeight: 1.1, color: '#fff', marginBottom: 8 }}>{mod.name}</h3>
                <p style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.5 }}>{mod.tagline}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setActive((p) => (p - 1 + modules.length) % modules.length)} aria-label="Previous"
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: '50%', background: '#1c1c1e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <ChevronLeft size={18} color="#fff" strokeWidth={2.5} />
        </button>
        <button onClick={() => setActive((p) => (p + 1) % modules.length)} aria-label="Next"
          style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: '50%', background: '#1c1c1e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${audience}-${active}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
          style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: 'rgba(28,28,30,0.6)', lineHeight: 1.7 }}>{current.desc}</p>
        </motion.div>
      </AnimatePresence>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 24 }}>
        {modules.map((mod, i) => (
          <button key={mod.id} onClick={() => setActive(i)} aria-label={`Go to ${mod.name}`}
            style={{ width: i === active ? 22 : 6, height: 6, borderRadius: 100, background: i === active ? current.color : 'rgba(28,28,30,0.14)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────
function LandingPage() {
  const [checked, setChecked] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('intro')) {
      localStorage.removeItem('gc_intro_seen');
      setChecked(true);
      return;
    }
    if (localStorage.getItem('gc_intro_seen')) setIntroComplete(true);
    setChecked(true);
  }, []);

  const handleIntroComplete = useCallback(() => {
    localStorage.setItem('gc_intro_seen', '1');
    setIntroComplete(true);
  }, []);

  const scatteredBadges = [
    { text: 'Tariff Intelligence', color: '#ff3b30', rotate: -6 },
    { text: 'Ideas Vault', color: '#af52de', rotate: 8 },
    { text: 'Market Intelligence', color: '#ff9500', rotate: -4 },
    { text: 'Regulatory Updates', color: '#7c3aed', rotate: 12 },
    { text: 'Shield', color: '#0a84ff', rotate: -9 },
  ];

  const driftPaths = [
    { x: ['-25vw','30vw','-10vw','25vw','-25vw'], y: ['-20vh','20vh','-10vh','30vh','-20vh'] },
    { x: ['25vw','-30vw','15vw','-20vw','25vw'], y: ['25vh','-15vh','10vh','-25vh','25vh'] },
    { x: ['-10vw','20vw','-35vw','5vw','-10vw'], y: ['30vh','-25vh','20vh','-15vh','30vh'] },
    { x: ['35vw','-20vw','-5vw','15vw','35vw'], y: ['-15vh','30vh','-25vh','10vh','-15vh'] },
    { x: ['-20vw','15vw','30vw','-30vw','-20vw'], y: ['10vh','-20vh','25vh','-15vh','10vh'] },
  ];

  if (!checked) return <div style={{ position: 'fixed', inset: 0, background: '#f2f2f7' }} />;
  if (!introComplete) return <GratiaIntro onComplete={handleIntroComplete} />;



  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700&display=swap');
        *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0 }
        html { scroll-behavior: smooth }
        body { background: #f2f2f7; font-family: 'DM Sans', system-ui, sans-serif; color: #1c1c1e; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        @keyframes rainbowShift { to { background-position: 200% center; } }
        @keyframes meshFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(4%,6%) scale(1.08); } }
        @keyframes meshFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-3%,4%) scale(1.12); } }

        /* ── Ticker bar — glass style ── */
        .gc-ticker-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1001; height: 34px;
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border-bottom: 1px solid rgba(255,255,255,0.8);
          box-shadow: 0 2px 0 rgba(255,255,255,0.9) inset, 0 4px 20px rgba(0,0,0,0.06);
          display: flex; align-items: center; overflow: hidden;
        }
        .gc-ticker-label {
          flex-shrink: 0; padding: 0 12px 0 14px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
          text-transform: uppercase; color: #ff3b30;
          border-right: 1px solid rgba(255,59,48,0.2);
          height: 100%; display: flex; align-items: center;
          white-space: nowrap; background: rgba(255,255,255,0.3);
        }
        .gc-ticker-track { display: flex; align-items: center; animation: gcTickerScroll 28s linear infinite; white-space: nowrap; }
        .gc-ticker-track:hover { animation-play-state: paused; }
        .gc-ticker-item { font-size: 11px; color: rgba(28,28,30,0.65); padding: 0 28px; display: flex; align-items: center; gap: 7px; }
        .gc-ticker-dot { width: 4px; height: 4px; border-radius: 50%; background: #ff3b30; flex-shrink: 0; }
        .gc-ticker-code { font-weight: 800; color: #ff3b30; background: rgba(255,59,48,0.1); border: 1px solid rgba(255,59,48,0.25); padding: 1px 6px; border-radius: 4px; font-size: 10px; letter-spacing: 0.05em; }
        @keyframes gcTickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        /* ── Top-left wordmark — sits below glass ticker ── */
        .top-wordmark { position: fixed; top: 48px; left: 22px; z-index: 1000; display: flex; align-items: center; gap: 9px; }
        .top-wordmark span { font-family: 'Sora',sans-serif; font-size: 15px; font-weight: 800; letter-spacing: -0.4px; color: #1c1c1e; }

        /* ── Bottom navbar (actions only — no logo) ── */
        .navbar { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); width: calc(100% - 48px); max-width: 1100px; z-index: 1000; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; height: 56px; background: rgba(255,255,255,0.72); backdrop-filter: blur(40px) saturate(200%); -webkit-backdrop-filter: blur(40px) saturate(200%); border: 1px solid rgba(255,255,255,0.95); border-radius: 20px; box-shadow: 0 -2px 24px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9); }
        .nav-pill { display: flex; align-items: center; gap: 2px; background: rgba(120,120,128,0.1); border: 1px solid rgba(0,0,0,0.05); border-radius: 100px; padding: 4px; position: absolute; left: 50%; transform: translateX(-50%); }
        .nav-item { padding: 6px 15px; font-size: 13px; font-weight: 600; color: rgba(28,28,30,0.55); text-decoration: none; border-radius: 100px; cursor: pointer; transition: color 0.2s, background 0.2s; }
        .nav-item:hover { color: #1c1c1e; background: rgba(255,255,255,0.6); }
        .btn-login { padding: 8px 18px; font-size: 13px; font-weight: 600; color: rgba(28,28,30,0.75); text-decoration: none; background: rgba(255,255,255,0.45); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.9); border-radius: 100px; cursor: pointer; transition: all 0.2s; display: inline-block; }
        .btn-login:hover { background: rgba(255,255,255,0.7); }
        .btn-signup { padding: 8px 18px; font-size: 13px; font-weight: 700; color: #fff; background: linear-gradient(135deg,#ff3b30,#ff6b35); border: none; border-radius: 100px; cursor: pointer; box-shadow: 0 4px 16px rgba(255,59,48,0.38); transition: all 0.2s; white-space: nowrap; }
        .btn-signup:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255,59,48,0.45); }

        /* ── Hero ── */
        .hero { position: relative; width: 100%; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow: hidden; padding-bottom: 90px; padding-top: 34px; }
        .hero-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(28,28,30,0.38); margin-bottom: 20px; position: relative; z-index: 2; }
        .hero-brand { font-family: 'Sora',sans-serif; font-size: clamp(52px,9vw,110px); font-weight: 900; letter-spacing: -4px; line-height: 1; color: #1c1c1e; margin-bottom: 28px; position: relative; z-index: 2; }
        .hero-brand .accent { color: #ff3b30; }
        .hero-subtitle { font-size: 17px; color: rgba(28,28,30,0.55); line-height: 1.65; max-width: 520px; margin: 0 auto 36px; position: relative; z-index: 2; }
        .hero-actions { display: flex; align-items: center; justify-content: center; gap: 14px; position: relative; z-index: 2; }
        .scattered-badge { position: absolute; padding: 8px 18px; border-radius: 100px; font-size: 13.5px; font-weight: 700; color: #fff; white-space: nowrap; }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 15px 30px; background: linear-gradient(135deg,#ff3b30,#ff6b35); color: #fff; border-radius: 100px; font-size: 15px; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 6px 24px rgba(255,59,48,0.38); font-family: 'DM Sans',sans-serif; text-decoration: none; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(255,59,48,0.45); }
        .btn-secondary { display: inline-flex; align-items: center; gap: 8px; padding: 15px 26px; background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); color: #1c1c1e; border-radius: 100px; font-size: 15px; font-weight: 700; border: 1px solid rgba(255,255,255,0.95); box-shadow: 0 2px 12px rgba(0,0,0,0.07); cursor: pointer; text-decoration: none; font-family: 'DM Sans',sans-serif; transition: all 0.2s; }
        .btn-secondary:hover { background: rgba(255,255,255,0.9); transform: translateY(-1px); }

        /* ── Sections ── */
        .content-section { max-width: 1100px; margin: 0 auto; padding: 80px 24px; position: relative; z-index: 1; }
        .content-section.last { padding-bottom: 0; }
        .section-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: #ff3b30; margin-bottom: 12px; }
        .section-title { font-family: 'Sora',sans-serif; font-size: clamp(28px,4vw,42px); font-weight: 900; letter-spacing: -1.8px; line-height: 1.1; color: #1c1c1e; margin-bottom: 14px; }
        .section-sub { font-size: 16px; color: rgba(28,28,30,0.52); line-height: 1.65; max-width: 520px; }

        /* ── Footer ── */
        .gc-footer { max-width: 1100px; margin: 0 auto; padding: 64px 24px 140px; }
        .gc-footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .gc-footer-col-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(28,28,30,0.38); margin-bottom: 14px; }
        .gc-footer-link { display: block; font-size: 14px; color: rgba(28,28,30,0.6); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
        .gc-footer-link:hover { color: #1c1c1e; }
        .gc-footer-bottom { padding-top: 24px; border-top: 0.5px solid rgba(28,28,30,0.1); display: flex; align-items: center; justify-content: space-between; }
        @media (max-width: 768px) { .gc-footer-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      {/* Background mesh */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-12%', left: '-5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,59,48,0.08) 0%,rgba(255,255,255,0) 70%)', filter: 'blur(40px)', animation: 'meshFloat1 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '25%', right: '-8%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(191,90,242,0.06) 0%,rgba(255,255,255,0) 70%)', filter: 'blur(50px)', animation: 'meshFloat2 22s ease-in-out infinite' }} />
      </div>

      {/* ── Ticker bar ── */}
      <div className="gc-ticker-bar" role="marquee" aria-label="Live updates">
        <div className="gc-ticker-label">Early access</div>
        <div style={{ overflow: 'hidden', flex: 1, display: 'flex' }}>
          <div className="gc-ticker-track">
            {/* Duplicated for seamless loop */}
            {[0, 1].map((dupe) => (
              <React.Fragment key={dupe}>
                <div className="gc-ticker-item">
                  <span className="gc-ticker-dot" />
                  Use code <span className="gc-ticker-code">FOUNDING</span> at checkout — lock in your price forever
                </div>
                <div className="gc-ticker-item">
                  <span className="gc-ticker-dot" />
                  Early access pricing ends at launch · Founding members keep their rate for life
                </div>
                <div className="gc-ticker-item">
                  <span className="gc-ticker-dot" />
                  7-day free trial · Card saved, not charged until day 8 · Cancel anytime
                </div>
                <div className="gc-ticker-item">
                  <span className="gc-ticker-dot" />
                  Ideas vault · Barter exchange · Tariff intelligence · Regulatory updates · Shield now live
                </div>
                <div className="gc-ticker-item">
                  <span className="gc-ticker-dot" />
                  Use code <span className="gc-ticker-code">FOUNDING</span> · Early access · Limited spots
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top-left wordmark ── */}
      <div className="top-wordmark">
        <GCIcon size={26} />
        <span>Gratia Core</span>
      </div>

      {/* ── Hero ── */}
      <section className="hero">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' }}>
          {scatteredBadges.map((badge, idx) => (
            <motion.div key={idx}
              animate={{ x: driftPaths[idx].x, y: driftPaths[idx].y, rotate: [badge.rotate, badge.rotate + 10, badge.rotate - 10, badge.rotate] }}
              transition={{ duration: 24 + idx * 5, repeat: Infinity, ease: 'easeInOut' }}
              className="scattered-badge"
              style={{ position: 'absolute', top: '45%', left: '42%', background: badge.color }}
            >
              {badge.text}
            </motion.div>
          ))}
        </div>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 700, width: '100%', padding: '0 24px' }}>
          <motion.p className="hero-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>Gratia Core</motion.p>
          <motion.h1 className="hero-brand" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: 'spring', stiffness: 100, damping: 20 }}>
            Business<br /><span className="accent">Intelligence.</span>
          </motion.h1>
          <motion.p className="hero-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
            Regulatory compliance, tariff tracking, market signals, and data protection — built for businesses that can&apos;t afford to be caught off guard.
          </motion.p>
          <motion.div className="hero-actions" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, type: 'spring', stiffness: 120, damping: 22 }}>
            <button className="btn-primary" onClick={() => setShowModal(true)}>Get started free <ChevronRight size={16} strokeWidth={2.5} /></button>
            <a href="#modules" className="btn-secondary">Explore modules</a>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}
          style={{ position: 'absolute', bottom: 96, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 2 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(28,28,30,0.28)' }}>Scroll</span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} style={{ width: 1, height: 28, background: 'rgba(28,28,30,0.18)' }} />
        </motion.div>
      </section>

      {/* ── What is Gratia Core ── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '80px 24px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 14 }}>What is Gratia Core</p>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, color: '#1c1c1e', marginBottom: 20 }}>
              One platform.<br />Every stage of business.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(28,28,30,0.6)', lineHeight: 1.7, marginBottom: 28 }}>
              Gratia Core gives freelancers the tools to protect their work and trade fairly — and gives businesses the intelligence to make faster, safer decisions. Both plans. One platform.
            </p>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { num: '$0', label: 'Charged in your first 7 days — cancel anytime' },
                { num: '< 2 min', label: 'To set up and be inside the platform' },
                { num: 'Locked', label: 'Early access pricing stays yours forever' },
              ].map((s) => (
                <div key={s.label}>
                  <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', color: '#1c1c1e', marginBottom: 3 }}>{s.num}</p>
                  <p style={{ fontSize: 11, color: 'rgba(28,28,30,0.42)', lineHeight: 1.45 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { problem: '"I ordered samples from Alibaba and got hit with unexpected customs fees at the door."', solution: 'Sample duty lookup shows your exact cost before checkout.', icon: '⚓', color: '#ff9500' },
              { problem: '"I pitched my idea and someone ran with it before I could prove it was mine."', solution: 'Ideas vault timestamps your concept the moment you create it.', icon: '💡', color: '#af52de' },
              { problem: '"A regulatory change hit our industry and we found out from a client complaint."', solution: 'Regulatory updates flag changes in your sector before they hit the news.', icon: '⚖️', color: '#7c3aed' },
              { problem: '"An employee pasted client account numbers into ChatGPT to draft a reply."', solution: 'Shield redacts sensitive data before it reaches any AI tool.', icon: '🛡️', color: '#0a84ff' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, type: 'spring', stiffness: 180, damping: 24 }}
                style={{ padding: '16px 0', borderBottom: i < 3 ? '0.5px solid rgba(28,28,30,0.08)' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
                <div>
                  <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.4)', marginBottom: 4, lineHeight: 1.5, fontStyle: 'italic' }}>{item.problem}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', lineHeight: 1.45 }}>{item.solution}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Module carousel ── */}
      <section id="modules" className="content-section">
        <ModuleToggleCarousel />
      </section>

      {/* ── How it works ── */}
      <section className="content-section" style={{ paddingTop: 0 }}>
        <p className="section-eyebrow">How it works</p>
        <h2 className="section-title">Up and running in three steps.</h2>
        <p className="section-sub" style={{ marginBottom: 40 }}>No onboarding call. No setup fee. Just sign up and the platform starts working.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            {
              num: '01', icon: '👤', iconBg: 'rgba(255,59,48,0.1)',
              title: 'Create your account',
              desc: 'Pick your plan, enter your details, and start your 7-day free trial. Card saved — not charged until day 8.',
            },
            {
              num: '02', icon: '⚙️', iconBg: 'rgba(124,58,237,0.1)',
              title: 'Set up your modules',
              desc: 'Tell us your industry, the markets you work in, and the tools your team uses. Takes two minutes.',
            },
            {
              num: '03', icon: '🔔', iconBg: 'rgba(26,122,53,0.1)',
              title: "You're never the last to know",
              desc: 'Gratia Core monitors your industry around the clock. You find out first — never from a client call.',
            },
          ].map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 180, damping: 22 }}
              style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, padding: '28px 24px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: step.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{step.icon}</div>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 900, color: 'rgba(28,28,30,0.2)', letterSpacing: '0.05em' }}>{step.num}</span>
              </div>
              <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 800, color: '#1c1c1e', marginBottom: 8, letterSpacing: '-0.3px' }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(28,28,30,0.55)', lineHeight: 1.65 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="gc-footer">
        <div style={{ height: '0.5px', background: 'rgba(28,28,30,0.1)', marginBottom: 48 }} />
        <div className="gc-footer-grid">
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <GCIcon size={28} />
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: '#1c1c1e' }}>Gratia Core</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(28,28,30,0.5)', lineHeight: 1.65, maxWidth: 220 }}>
              Business intelligence for individuals and businesses — from protecting your first idea to tracking global tariff shifts.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="gc-footer-col-label">Product</p>
            <a href="#modules" className="gc-footer-link">Modules</a>
            <Link href="/pricing" className="gc-footer-link">Pricing</Link>
            <Link href="/changelog" className="gc-footer-link">Changelog</Link>
          </div>

          {/* Company */}
          <div>
            <p className="gc-footer-col-label">Company</p>
            <Link href="/about" className="gc-footer-link">About</Link>
            <Link href="/contact" className="gc-footer-link">Contact</Link>
            <Link href="/blog" className="gc-footer-link">Blog</Link>
          </div>

          {/* Legal */}
          <div>
            <p className="gc-footer-col-label">Legal</p>
            <Link href="/terms" className="gc-footer-link">Terms of service</Link>
            <Link href="/privacy" className="gc-footer-link">Privacy policy</Link>
            <Link href="/cookies" className="gc-footer-link">Cookie policy</Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="gc-footer-bottom">
          <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.38)', margin: 0 }}>© {new Date().getFullYear()} Gratia Core. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(28,28,30,0.38)', transition: 'color 0.2s', fontSize: 16 }}>𝕏</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(28,28,30,0.38)', transition: 'color 0.2s', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>in</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(28,28,30,0.38)', transition: 'color 0.2s', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>ig</a>
          </div>
        </div>
      </footer>

      {/* ── Bottom navbar (actions — no logo, top wordmark handles brand) ── */}
      <header className="navbar">
        <nav className="nav-pill">
          <a href="#modules" className="nav-item">Modules</a>
          <Link href="/pricing" className="nav-item">Pricing</Link>
          <Link href="/about" className="nav-item">About</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" className="btn-login">Log in</Link>
          <button onClick={() => setShowModal(true)} className="btn-signup">Try free</button>
        </div>
      </header>

      <AnimatePresence>
        {showModal && <QuickSignupModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  );
}

// ── Cookie helpers ────────────────────────────────────────────
const COOKIE_KEY  = 'gc_access';
const COOKIE_DAYS = 30;
function setCookie(val: string) {
  const exp = new Date(Date.now() + COOKIE_DAYS * 864e5).toUTCString();
  document.cookie = `${COOKIE_KEY}=${val};expires=${exp};path=/;SameSite=Lax`;
}
function getCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_KEY}=([^;]*)`));
  return m ? m[1] : null;
}

// ── Gate page ─────────────────────────────────────────────────
import { supabase } from '@/lib/supabase';

function GatePage({ onUnlock }: { onUnlock: () => void }) {
  const [view,      setView]      = React.useState<'main'|'code'>('main');
  const [email,     setEmail]     = React.useState('');
  const [code,      setCode]      = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [loading,   setLoading]   = React.useState(false);
  const [error,     setError]     = React.useState('');

  const handleWaitlist = async () => {
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address.'); return; }
    setLoading(true); setError('');
    try {
      const { error: dbErr } = await supabase
        .from('waitlist')
        .insert({ email: email.trim().toLowerCase(), source: 'launch_gate' });
      if (dbErr && !dbErr.message.includes('duplicate')) throw dbErr;
      setSubmitted(true);
    } catch { setError('Something went wrong. Try again.'); }
    finally { setLoading(false); }
  };

  const handleCode = async () => {
    if (!code.trim()) { setError('Enter your access code.'); return; }
    setLoading(true); setError('');
    const trimmed = code.trim().toUpperCase();
    const master  = process.env.NEXT_PUBLIC_LAUNCH_CODE;
    if (master && trimmed === master.toUpperCase()) {
      setCookie('granted'); onUnlock(); return;
    }
    const { data } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', trimmed)
      .eq('active', true)
      .single();
    if (!data) { setError('Invalid code. Try again or join the waitlist.'); setLoading(false); return; }
    if (data.max_uses && data.uses_count >= data.max_uses) { setError('This code has reached its limit.'); setLoading(false); return; }
    await supabase.from('access_codes').update({ uses_count: (data.uses_count ?? 0) + 1 }).eq('code', trimmed);
    setCookie('granted'); setLoading(false); onUnlock();
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
    background: 'rgba(120,120,128,0.08)',
    border: `1px solid ${error ? '#ff3b30' : 'rgba(0,0,0,0.1)'}`,
    color: '#1c1c1e', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  const scatteredBadges = [
    { text: 'Tariff Intelligence', color: '#ff3b30', rotate: -6 },
    { text: 'Ideas Vault',         color: '#af52de', rotate: 8  },
    { text: 'Market Intelligence', color: '#ff9500', rotate: -4 },
    { text: 'Regulatory Updates',  color: '#7c3aed', rotate: 12 },
    { text: 'Shield',              color: '#0a84ff', rotate: -9 },
  ];
  const driftPaths = [
    { x:['-25vw','30vw','-10vw','25vw','-25vw'], y:['-20vh','20vh','-10vh','30vh','-20vh'] },
    { x:['25vw','-30vw','15vw','-20vw','25vw'],  y:['25vh','-15vh','10vh','-25vh','25vh']  },
    { x:['-10vw','20vw','-35vw','5vw','-10vw'],  y:['30vh','-25vh','20vh','-15vh','30vh']  },
    { x:['35vw','-20vw','-5vw','15vw','35vw'],   y:['-15vh','30vh','-25vh','10vh','-15vh'] },
    { x:['-20vw','15vw','30vw','-30vw','-20vw'], y:['10vh','-20vh','25vh','-15vh','10vh']  },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9990, background:'#f2f2f7', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{`@keyframes rainbowShift{to{background-position:200% center;}}`}</style>

      {/* Background mesh */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'-12%', left:'-5%', width:'55vw', height:'55vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(255,59,48,0.09) 0%,transparent 70%)', filter:'blur(40px)', animation:'meshFloat1 18s ease-in-out infinite' }} />
        <div style={{ position:'absolute', top:'25%', right:'-8%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(191,90,242,0.07) 0%,transparent 70%)', filter:'blur(50px)', animation:'meshFloat2 22s ease-in-out infinite' }} />
      </div>

      {/* Drifting badges */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        {scatteredBadges.map((badge, idx) => (
          <motion.div key={idx}
            animate={{ x: driftPaths[idx].x, y: driftPaths[idx].y, rotate:[badge.rotate, badge.rotate+10, badge.rotate-10, badge.rotate] }}
            transition={{ duration: 24+idx*5, repeat:Infinity, ease:'easeInOut' }}
            style={{ position:'absolute', top:'45%', left:'42%', padding:'8px 18px', borderRadius:100, fontSize:13.5, fontWeight:700, color:'#fff', background:badge.color, whiteSpace:'nowrap' }}
          >{badge.text}</motion.div>
        ))}
      </div>

      {/* Glass card */}
      <motion.div
        initial={{ opacity:0, scale:0.96, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        transition={{ type:'spring', stiffness:200, damping:24 }}
        style={{ position:'relative', zIndex:10, width:'min(420px, calc(100vw - 32px))', background:'rgba(255,255,255,0.88)', backdropFilter:'blur(60px) saturate(180%)', WebkitBackdropFilter:'blur(60px) saturate(180%)', border:'1px solid rgba(255,255,255,0.95)', borderRadius:28, overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.16), 0 0 0 0.5px rgba(0,0,0,0.05)' }}
      >
        {/* Rainbow trim */}
        <div style={{ height:3, background:'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)', backgroundSize:'200% auto', animation:'rainbowShift 3s linear infinite' }} />

        <div style={{ padding:'32px 32px 28px' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
            <GCIcon size={52} />
          </div>

          <AnimatePresence mode="wait">
            {/* Main — waitlist */}
            {view === 'main' && !submitted && (
              <motion.div key="main" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} transition={{ duration:0.2 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'rgba(255,59,48,0.08)', border:'0.5px solid rgba(255,59,48,0.2)', borderRadius:100, padding:'4px 12px', fontSize:11, fontWeight:700, color:'#ff3b30', letterSpacing:'0.08em', textTransform:'uppercase' as const, marginBottom:16, width:'fit-content', margin:'0 auto 16px' }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#ff3b30' }} /> Coming soon
                </div>
                <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:24, fontWeight:900, letterSpacing:'-1px', lineHeight:1.15, color:'#1c1c1e', textAlign:'center', marginBottom:10 }}>Business intelligence<br />for everyone.</h1>
                <p style={{ fontSize:14, color:'rgba(28,28,30,0.52)', lineHeight:1.65, textAlign:'center', marginBottom:22 }}>Gratia Core is launching soon. Join the waitlist and we'll email you the moment doors open.</p>
                <input type="email" placeholder="your@email.com" value={email} autoFocus onChange={e => { setEmail(e.target.value); setError(''); }} onKeyDown={e => e.key==='Enter' && handleWaitlist()} style={{ ...inp, marginBottom: error?6:12 }} />
                {error && <p style={{ fontSize:12, color:'#ff3b30', marginBottom:10 }}>{error}</p>}
                <button onClick={handleWaitlist} disabled={loading} style={{ width:'100%', padding:14, borderRadius:100, fontSize:15, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', background:email.trim()?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(0,0,0,0.07)', color:email.trim()?'#fff':'rgba(28,28,30,0.28)', boxShadow:email.trim()?'0 4px 16px rgba(255,59,48,0.35)':'none', marginBottom:16 }}>
                  {loading ? 'Joining…' : 'Join the waitlist →'}
                </button>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ flex:1, height:'0.5px', background:'rgba(0,0,0,0.08)' }} />
                  <span style={{ fontSize:12, color:'rgba(28,28,30,0.38)' }}>or</span>
                  <div style={{ flex:1, height:'0.5px', background:'rgba(0,0,0,0.08)' }} />
                </div>
                <button onClick={() => { setView('code'); setError(''); }} style={{ width:'100%', padding:11, borderRadius:100, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', background:'rgba(120,120,128,0.08)', border:'1px solid rgba(0,0,0,0.08)', color:'rgba(28,28,30,0.6)', transition:'all 0.2s' }}>
                  I have an access code
                </button>
              </motion.div>
            )}

            {/* Submitted */}
            {view === 'main' && submitted && (
              <motion.div key="done" initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} style={{ textAlign:'center', padding:'8px 0 12px' }}>
                <div style={{ fontSize:40, marginBottom:14 }}>🎉</div>
                <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:900, color:'#1c1c1e', marginBottom:8 }}>You're on the list.</h2>
                <p style={{ fontSize:14, color:'rgba(28,28,30,0.52)', lineHeight:1.65, marginBottom:20 }}>We'll email <strong style={{ color:'#1c1c1e' }}>{email}</strong> the moment Gratia Core opens.</p>
                <button onClick={() => { setView('code'); setError(''); }} style={{ padding:'10px 22px', borderRadius:100, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', background:'rgba(120,120,128,0.08)', border:'1px solid rgba(0,0,0,0.08)', color:'rgba(28,28,30,0.6)' }}>
                  I have an access code →
                </button>
              </motion.div>
            )}

            {/* Code entry */}
            {view === 'code' && (
              <motion.div key="code" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} transition={{ duration:0.2 }}>
                <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:900, color:'#1c1c1e', marginBottom:6, textAlign:'center' }}>Enter your code</h2>
                <p style={{ fontSize:13, color:'rgba(28,28,30,0.48)', textAlign:'center', marginBottom:22, lineHeight:1.55 }}>Got an early access code? Enter it below to unlock Gratia Core.</p>
                <input type="text" placeholder="XXXXXXXX" value={code} autoFocus onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }} onKeyDown={e => e.key==='Enter' && handleCode()} style={{ ...inp, fontSize:18, fontWeight:700, letterSpacing:'0.12em', textAlign:'center' as const, marginBottom:error?6:14 }} />
                {error && <p style={{ fontSize:12, color:'#ff3b30', marginBottom:10 }}>{error}</p>}
                <button onClick={handleCode} disabled={loading || !code.trim()} style={{ width:'100%', padding:14, borderRadius:100, fontSize:15, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', background:code.trim()?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(0,0,0,0.07)', color:code.trim()?'#fff':'rgba(28,28,30,0.28)', boxShadow:code.trim()?'0 4px 16px rgba(255,59,48,0.35)':'none', marginBottom:14 }}>
                  {loading ? 'Checking…' : 'Unlock access →'}
                </button>
                <button onClick={() => { setView('main'); setError(''); setCode(''); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'rgba(28,28,30,0.42)', fontFamily:'inherit', width:'100%', textAlign:'center' as const }}>
                  ← Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }} style={{ position:'relative', zIndex:10, fontSize:11, color:'rgba(28,28,30,0.3)', marginTop:20, textAlign:'center' }}>
        Gratia Core · Business Intelligence · © {new Date().getFullYear()}
      </motion.p>
    </div>
  );
}

// ── Root — checks cookie, shows gate or landing ───────────────
export default function RootPage() {
  const [status, setStatus] = React.useState<'checking'|'locked'|'unlocked'>('checking');

  useEffect(() => {
    setStatus(getCookie() === 'granted' ? 'unlocked' : 'locked');
  }, []);

  const handleUnlock = useCallback(() => setStatus('unlocked'), []);

  if (status === 'checking') return <div style={{ position:'fixed', inset:0, background:'#f2f2f7' }} />;
  if (status === 'unlocked') return <LandingPage />;
  return <GatePage onUnlock={handleUnlock} />;
}