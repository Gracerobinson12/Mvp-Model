'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Transition } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const GC_PROTECT_URL = 'https://gcprotect.tech';

const BRANCHES = [
  { n: '01', id: 'advisory', name: 'Advisory', icon: '\u{1F4AC}', color: '#ff3b30', ink: '#cc2018', live: true, href: '/advisory',
    hook: "You have a problem. Let's figure it out.",
    desc: 'Business and technology guidance for how you build, operate, and grow \u2014 websites, systems, automation, and AI.',
    cta: 'Start a conversation \u2192' },
  { n: '02', id: 'intelligence', name: 'Intelligence', icon: '\u{1F4E1}', color: '#0a84ff', ink: '#185FA5', live: true, href: '/intelligence',
    hook: "Know what's changing before it becomes your problem.",
    desc: 'Regulatory, market, industry, and policy intelligence \u2014 filtered to your sector, in plain language.',
    cta: 'Explore Intelligence \u2192' },
  { n: '03', id: 'solutions', name: 'Solutions', icon: '\u{1F9F0}', color: '#30d158', ink: '#0F6E56', live: true, href: '/solutions',
    hook: 'Find a tool for the job.',
    desc: 'Ideas Vault and Barter \u2014 live now. Document and seal ideas, track trade agreements.',
    cta: 'See what we offer \u2192' },
];
 
function LetterReveal({ text, delay = 0, color = 'inherit' }: { text: string; delay?: number; color?: string; }) {
  return (
    <span style={{ display: 'inline-flex' }}>
      {text.split('').map((char, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', lineHeight: 1 }}>
          <motion.span initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260, delay: delay + i * 0.048 } as Transition}
            style={{ display: 'inline-block', color }}>{char}</motion.span>
        </span>
      ))}
    </span>
  );
}

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
            Solutions for businesses moving forward
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GCIcon({ size = 36 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

function BranchCard({ b, i }: { b: typeof BRANCHES[number]; i: number }) {
  const inner = (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay: i * 0.1, type: 'spring', stiffness: 180, damping: 22 }}
      style={{ display: 'flex', gap: 18, alignItems: 'flex-start',
        background: b.live ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.4)',
        border: '0.5px solid ' + (b.live ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.7)'),
        borderRadius: 20, padding: '22px 24px', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', opacity: b.live ? 1 : 0.78, cursor: 'pointer', transition: 'all 0.2s' }}>
      <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: b.ink, width: 26, flexShrink: 0 }}>{b.n}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{b.icon}</span>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#1a1a2e' }}>{b.name}</span>
          </div>
          {b.live
            ? <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#1a7a35', background: 'rgba(48,209,88,0.1)', border: '0.5px solid rgba(48,209,88,0.25)', padding: '4px 10px', borderRadius: 100, whiteSpace: 'nowrap' }}>&#9679; Live</span>
            : <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(26,26,46,0.4)', background: 'rgba(0,0,0,0.05)', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4px 10px', borderRadius: 100, whiteSpace: 'nowrap' }}>Coming soon</span>}
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', marginBottom: 6, letterSpacing: '-0.2px' }}>{b.hook}</p>
        <p style={{ fontSize: 13.5, color: 'rgba(26,26,46,0.55)', lineHeight: 1.6, marginBottom: b.live ? 10 : 0 }}>{b.desc}</p>
        {b.live && <span style={{ fontSize: 13, fontWeight: 700, color: b.ink }}>{b.cta}</span>}
      </div>
    </motion.div>
  );
  return b.live ? <Link href={b.href} style={{ textDecoration: 'none' }}>{inner}</Link> : <div>{inner}</div>;
}

function LandingPage() {
  const [checked, setChecked] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('intro')) { localStorage.removeItem('gc_intro_seen'); setChecked(true); return; }
    if (localStorage.getItem('gc_intro_seen')) setIntroComplete(true);
    setChecked(true);
  }, []);

  const handleIntroComplete = useCallback(() => { localStorage.setItem('gc_intro_seen', '1'); setIntroComplete(true); }, []);

  const scatteredBadges = [
    { text: 'Advisory', color: '#ff3b30', rotate: -6 },
    { text: 'Intelligence', color: '#0a84ff', rotate: 8 },
    { text: 'Solutions', color: '#30d158', rotate: -4 },
    { text: 'GC Protect', color: '#bf5af2', rotate: 12 },
    { text: 'Built to move forward', color: '#ff9500', rotate: -9 },
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
        @keyframes meshFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(4%,6%) scale(1.08); } }
        @keyframes meshFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-3%,4%) scale(1.12); } }
        @keyframes gcTickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .gc-ticker-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 1001; height: 34px; background: rgba(255,255,255,0.55); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border-bottom: 1px solid rgba(255,255,255,0.8); box-shadow: 0 2px 0 rgba(255,255,255,0.9) inset, 0 4px 20px rgba(0,0,0,0.06); display: flex; align-items: center; overflow: hidden; }
        .gc-ticker-label { flex-shrink: 0; padding: 0 12px 0 14px; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #ff3b30; border-right: 1px solid rgba(255,59,48,0.2); height: 100%; display: flex; align-items: center; white-space: nowrap; background: rgba(255,255,255,0.3); }
        .gc-ticker-track { display: flex; align-items: center; animation: gcTickerScroll 30s linear infinite; white-space: nowrap; }
        .gc-ticker-track:hover { animation-play-state: paused; }
        .gc-ticker-item { font-size: 11px; color: rgba(28,28,30,0.65); padding: 0 28px; display: flex; align-items: center; gap: 7px; }
        .gc-ticker-dot { width: 4px; height: 4px; border-radius: 50%; background: #ff3b30; flex-shrink: 0; }
        .top-wordmark { position: fixed; top: 48px; left: 22px; z-index: 1000; display: flex; align-items: center; gap: 9px; }
        .top-wordmark span { font-family: 'Sora',sans-serif; font-size: 15px; font-weight: 800; letter-spacing: -0.4px; color: #1c1c1e; }
        .navbar { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); width: calc(100% - 48px); max-width: 1100px; z-index: 1000; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; height: 56px; background: rgba(255,255,255,0.72); backdrop-filter: blur(40px) saturate(200%); -webkit-backdrop-filter: blur(40px) saturate(200%); border: 1px solid rgba(255,255,255,0.95); border-radius: 20px; box-shadow: 0 -2px 24px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9); }
        .nav-pill { display: flex; align-items: center; gap: 2px; background: rgba(120,120,128,0.1); border: 1px solid rgba(0,0,0,0.05); border-radius: 100px; padding: 4px; position: absolute; left: 50%; transform: translateX(-50%); }
        .nav-item { padding: 6px 15px; font-size: 13px; font-weight: 600; color: rgba(28,28,30,0.55); text-decoration: none; border-radius: 100px; cursor: pointer; transition: color 0.2s, background 0.2s; }
        .nav-item:hover { color: #1c1c1e; background: rgba(255,255,255,0.6); }
        .btn-login { padding: 8px 18px; font-size: 13px; font-weight: 600; color: rgba(28,28,30,0.75); text-decoration: none; background: rgba(255,255,255,0.45); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.9); border-radius: 100px; cursor: pointer; transition: all 0.2s; display: inline-block; }
        .btn-login:hover { background: rgba(255,255,255,0.7); }
        .btn-signup { padding: 8px 18px; font-size: 13px; font-weight: 700; color: #fff; background: linear-gradient(135deg,#ff3b30,#ff6b35); border: none; border-radius: 100px; cursor: pointer; box-shadow: 0 4px 16px rgba(255,59,48,0.38); transition: all 0.2s; white-space: nowrap; text-decoration: none; }
        .btn-signup:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255,59,48,0.45); }
        .hero { position: relative; width: 100%; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow: hidden; padding-bottom: 90px; padding-top: 34px; }
        .hero-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(28,28,30,0.38); margin-bottom: 20px; position: relative; z-index: 2; }
        .hero-brand { font-family: 'Sora',sans-serif; font-size: clamp(44px,7.5vw,92px); font-weight: 900; letter-spacing: -3.5px; line-height: 0.98; color: #1c1c1e; margin-bottom: 24px; position: relative; z-index: 2; }
        .hero-subtitle { font-size: 17px; color: rgba(28,28,30,0.55); line-height: 1.65; max-width: 520px; margin: 0 auto 36px; position: relative; z-index: 2; }
        .hero-actions { display: flex; align-items: center; justify-content: center; gap: 14px; position: relative; z-index: 2; flex-wrap: wrap; }
        .scattered-badge { position: absolute; padding: 8px 18px; border-radius: 100px; font-size: 13.5px; font-weight: 700; color: #fff; white-space: nowrap; }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 15px 30px; background: linear-gradient(135deg,#ff3b30,#ff6b35); color: #fff; border-radius: 100px; font-size: 15px; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 6px 24px rgba(255,59,48,0.38); font-family: 'DM Sans',sans-serif; text-decoration: none; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(255,59,48,0.45); }
        .btn-secondary { display: inline-flex; align-items: center; gap: 8px; padding: 15px 26px; background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); color: #1c1c1e; border-radius: 100px; font-size: 15px; font-weight: 700; border: 1px solid rgba(255,255,255,0.95); box-shadow: 0 2px 12px rgba(0,0,0,0.07); cursor: pointer; text-decoration: none; font-family: 'DM Sans',sans-serif; transition: all 0.2s; }
        .btn-secondary:hover { background: rgba(255,255,255,0.9); transform: translateY(-1px); }
        .content-section { max-width: 860px; margin: 0 auto; padding: 60px 24px; position: relative; z-index: 1; }
        .section-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(28,28,30,0.32); margin-bottom: 20px; text-align: center; }
        .gc-footer { max-width: 1100px; margin: 0 auto; padding: 40px 24px 140px; }
        .gc-footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .gc-footer-col-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(28,28,30,0.38); margin-bottom: 14px; }
        .gc-footer-link { display: block; font-size: 14px; color: rgba(28,28,30,0.6); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
        .gc-footer-link:hover { color: #1c1c1e; }
        .gc-footer-bottom { padding-top: 24px; border-top: 0.5px solid rgba(28,28,30,0.1); display: flex; align-items: center; justify-content: space-between; }
        @media (max-width: 768px) { .gc-footer-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-12%', left: '-5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,59,48,0.08) 0%,rgba(255,255,255,0) 70%)', filter: 'blur(40px)', animation: 'meshFloat1 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '25%', right: '-8%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,132,255,0.06) 0%,rgba(255,255,255,0) 70%)', filter: 'blur(50px)', animation: 'meshFloat2 22s ease-in-out infinite' }} />
      </div>

      <div className="gc-ticker-bar" role="marquee" aria-label="Updates">
        <div className="gc-ticker-label">Now open</div>
        <div style={{ overflow: 'hidden', flex: 1, display: 'flex' }}>
          <div className="gc-ticker-track">
            {[0, 1].map((dupe) => (
              <React.Fragment key={dupe}>
                <div className="gc-ticker-item"><span className="gc-ticker-dot" /> Advisory is open &mdash; tell us the problem, we&apos;ll help you solve it</div>
                <div className="gc-ticker-item"><span className="gc-ticker-dot" /> GC Protect is live &mdash; AI data protection for the modern workplace</div>
                <div className="gc-ticker-item"><span className="gc-ticker-dot" /> Intelligence &amp; Solutions launching soon &mdash; join the list</div>
                <div className="gc-ticker-item"><span className="gc-ticker-dot" /> Advisory &middot; Intelligence &middot; Solutions</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="top-wordmark"><GCIcon size={26} /><span>Gratia Core</span></div>

      <section className="hero">
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
          {scatteredBadges.map((badge, idx) => (
            <motion.div key={idx}
              animate={{ x: driftPaths[idx].x, y: driftPaths[idx].y, rotate: [badge.rotate, badge.rotate + 10, badge.rotate - 10, badge.rotate] }}
              transition={{ duration: 24 + idx * 5, repeat: Infinity, ease: 'easeInOut' }}
              className="scattered-badge" style={{ position: 'absolute', top: '45%', left: '42%', background: badge.color }}>{badge.text}</motion.div>
          ))}
        </div>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 720, width: '100%', padding: '0 24px' }}>
          <motion.p className="hero-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>Gratia Core</motion.p>
          <motion.h1 className="hero-brand" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: 'spring', stiffness: 100, damping: 20 }}>
            Solutions for businesses<br />moving forward.
          </motion.h1>
          <motion.p className="hero-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
            We help businesses navigate problems, understand change, and find solutions &mdash; through advisory, intelligence, and technology.
          </motion.p>
          <motion.div className="hero-actions" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, type: 'spring', stiffness: 120, damping: 22 }}>
            <a href="#branches" className="btn-primary">Explore Gratia Core <ChevronRight size={16} strokeWidth={2.5} /></a>
            <Link href="/advisory" className="btn-secondary">Let&apos;s talk</Link>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}
          style={{ position: 'absolute', bottom: 96, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 2 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(28,28,30,0.28)' }}>Scroll</span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} style={{ width: 1, height: 28, background: 'rgba(28,28,30,0.18)' }} />
        </motion.div>
      </section>

      <section id="branches" className="content-section">
        <p className="section-eyebrow">Three ways we work</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
          {BRANCHES.map((b, i) => <BranchCard key={b.id} b={b} i={i} />)}
        </div>
      </section>

      <section className="content-section" style={{ paddingTop: 0 }}>
        <p className="section-eyebrow">Our first product &mdash; live now</p>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 160, damping: 22 }}
          style={{ background: 'linear-gradient(135deg,rgba(10,132,255,0.09),rgba(191,90,242,0.07))', border: '1px solid rgba(10,132,255,0.2)', borderRadius: 24, padding: '28px 30px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(191,90,242,0.08)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, position: 'relative' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#0a84ff,#bf5af2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: '0 4px 16px rgba(10,132,255,0.32)' }}>&#128737;&#65039;</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: '-0.6px', color: '#1a1a2e' }}>GC Protect</span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#1a7a35', background: 'rgba(48,209,88,0.12)', padding: '4px 9px', borderRadius: 100 }}>&#9679; Live</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(26,26,46,0.5)', marginTop: 2 }}>From the Gratia Core ecosystem</p>
            </div>
          </div>
          <p style={{ fontSize: 15, color: 'rgba(26,26,46,0.62)', lineHeight: 1.65, marginBottom: 18, maxWidth: 560, position: 'relative' }}>
            AI data protection for the modern workplace. GC Protect redacts sensitive client data before it ever reaches an AI tool &mdash; client names, account numbers, and custom terms your team defines, with a full audit trail.
          </p>
          <a href={GC_PROTECT_URL} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#0a84ff,#3a6ff0)', padding: '12px 24px', borderRadius: 100, textDecoration: 'none', boxShadow: '0 4px 16px rgba(10,132,255,0.32)', position: 'relative' }}>
            Visit GC Protect &#8599;
          </a>
        </motion.div>
      </section>

      <section className="content-section" style={{ paddingTop: 0 }}>
        <div style={{ background: 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.85)', borderRadius: 20, padding: '22px 26px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,46,0.32)', marginBottom: 16, textAlign: 'center' }}>How it&apos;s priced</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { label: 'Advisory', val: 'Quoted per project' },
              { label: 'Intelligence', val: 'From $49/mo \u00b7 soon' },
              { label: 'Bundle', val: 'Everything, $59/mo \u00b7 soon' },
            ].map((p, i) => (
              <div key={p.label} style={{ borderLeft: i > 0 ? '0.5px solid rgba(0,0,0,0.08)' : 'none', paddingLeft: i > 0 ? 16 : 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>{p.label}</p>
                <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.5)' }}>{p.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="gc-footer">
        <div style={{ height: '0.5px', background: 'rgba(28,28,30,0.1)', marginBottom: 40 }} />
        <div className="gc-footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}><GCIcon size={28} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: '#1c1c1e' }}>Gratia Core</span></div>
            <p style={{ fontSize: 13, color: 'rgba(28,28,30,0.5)', lineHeight: 1.65, maxWidth: 240 }}>Solutions for businesses moving forward &mdash; advisory, intelligence, and the tools to act.</p>
          </div>
          <div>
            <p className="gc-footer-col-label">Explore</p>
            <Link href="/advisory" className="gc-footer-link">Advisory</Link>
            <Link href="/intelligence" className="gc-footer-link">Intelligence</Link>
            <Link href="/solutions" className="gc-footer-link">Solutions</Link>
            <Link href="/pricing" className="gc-footer-link">Pricing</Link>
            <a href={GC_PROTECT_URL} target="_blank" rel="noopener noreferrer" className="gc-footer-link">GC Protect &#8599;</a>
          </div>
          <div>
            <p className="gc-footer-col-label">Company</p>
            <Link href="/about" className="gc-footer-link">About</Link>
            <Link href="/advisory" className="gc-footer-link">Contact</Link>
          </div>
          <div>
            <p className="gc-footer-col-label">Legal</p>
            <Link href="/terms" className="gc-footer-link">Terms of service</Link>
            <Link href="/privacy" className="gc-footer-link">Privacy policy</Link>
            <Link href="/cookies" className="gc-footer-link">Cookie policy</Link>
          </div>
        </div>
        <div className="gc-footer-bottom">
          <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.38)', margin: 0 }}>&copy; {new Date().getFullYear()} Gratia Core. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(28,28,30,0.38)', fontSize: 16 }}>&#120143;</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(28,28,30,0.38)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>in</a>
          </div>
        </div>
      </footer>

      <header className="navbar">
        <nav className="nav-pill">
          <Link href="/advisory" className="nav-item">Advisory</Link>
          <Link href="/intelligence" className="nav-item">Intelligence</Link>
          <Link href="/solutions" className="nav-item">Solutions</Link>
          <Link href="/pricing" className="nav-item">Pricing</Link> 
          <Link href="/about" className="nav-item">About</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" className="btn-login">Log in</Link>
          <Link href="/advisory" className="btn-signup">Let&apos;s talk</Link>
        </div>
      </header>
    </>
  );
}

const COOKIE_KEY = 'gc_access';
const COOKIE_DAYS = 30;
function setCookie(val: string) {
  const exp = new Date(Date.now() + COOKIE_DAYS * 864e5).toUTCString();
  document.cookie = COOKIE_KEY + '=' + val + ';expires=' + exp + ';path=/;SameSite=Lax';
}
function getCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|;\\\\s*)' + COOKIE_KEY + '=([^;]*)'));
  return m ? m[1] : null;
}

function GatePage({ onUnlock }: { onUnlock: () => void }) {
  const [view, setView] = React.useState<'main' | 'code'>('main');
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleWaitlist = async () => {
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address.'); return; }
    setLoading(true); setError('');
    try {
      const { error: dbErr } = await supabase.from('waitlist').insert({ email: email.trim().toLowerCase(), source: 'launch_gate' });
      if (dbErr && !dbErr.message.includes('duplicate')) throw dbErr;
      setSubmitted(true);
    } catch { setError('Something went wrong. Try again.'); }
    finally { setLoading(false); }
  };

  const handleCode = async () => {
    if (!code.trim()) { setError('Enter your access code.'); return; }
    setLoading(true); setError('');
    const trimmed = code.trim().toUpperCase();
    const VALID_CODES = ['GRATIA2026', 'FOUNDING', 'EARLYBIRD'];
    if (VALID_CODES.includes(trimmed)) { setCookie('granted'); onUnlock(); return; }
    try {
      const { data } = await supabase.from('access_codes').select('*').eq('code', trimmed).eq('active', true).single();
      if (!data) { setError('Invalid code. Try again or join the waitlist.'); setLoading(false); return; }
      setCookie('granted'); setLoading(false); onUnlock();
    } catch { setError('Invalid code. Try again or join the waitlist.'); setLoading(false); }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 15, fontFamily: 'inherit', outline: 'none', background: 'rgba(120,120,128,0.08)', border: '1px solid ' + (error ? '#ff3b30' : 'rgba(0,0,0,0.1)'), color: '#1c1c1e', boxSizing: 'border-box', transition: 'border-color 0.2s' };

  const scatteredBadges = [
    { text: 'Advisory', color: '#ff3b30', rotate: -6 },
    { text: 'Intelligence', color: '#0a84ff', rotate: 8 },
    { text: 'Solutions', color: '#30d158', rotate: -4 },
    { text: 'GC Protect', color: '#bf5af2', rotate: 12 },
    { text: 'Moving forward', color: '#ff9500', rotate: -9 },
  ];
  const driftPaths = [
    { x: ['-25vw','30vw','-10vw','25vw','-25vw'], y: ['-20vh','20vh','-10vh','30vh','-20vh'] },
    { x: ['25vw','-30vw','15vw','-20vw','25vw'], y: ['25vh','-15vh','10vh','-25vh','25vh'] },
    { x: ['-10vw','20vw','-35vw','5vw','-10vw'], y: ['30vh','-25vh','20vh','-15vh','30vh'] },
    { x: ['35vw','-20vw','-5vw','15vw','35vw'], y: ['-15vh','30vh','-25vh','10vh','-15vh'] },
    { x: ['-20vw','15vw','30vw','-30vw','-20vw'], y: ['10vh','-20vh','25vh','-15vh','10vh'] },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: '#f2f2f7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{'@keyframes rainbowShift{to{background-position:200% center;}} @keyframes meshFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(4%,6%) scale(1.08); } } @keyframes meshFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-3%,4%) scale(1.12); } }'}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-12%', left: '-5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,59,48,0.09) 0%,transparent 70%)', filter: 'blur(40px)', animation: 'meshFloat1 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '25%', right: '-8%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,132,255,0.07) 0%,transparent 70%)', filter: 'blur(50px)', animation: 'meshFloat2 22s ease-in-out infinite' }} />
      </div>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {scatteredBadges.map((badge, idx) => (
          <motion.div key={idx}
            animate={{ x: driftPaths[idx].x, y: driftPaths[idx].y, rotate: [badge.rotate, badge.rotate + 10, badge.rotate - 10, badge.rotate] }}
            transition={{ duration: 24 + idx * 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: '45%', left: '42%', padding: '8px 18px', borderRadius: 100, fontSize: 13.5, fontWeight: 700, color: '#fff', background: badge.color, whiteSpace: 'nowrap' }}>{badge.text}</motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        style={{ position: 'relative', zIndex: 10, width: 'min(420px, calc(100vw - 32px))', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(60px) saturate(180%)', WebkitBackdropFilter: 'blur(60px) saturate(180%)', border: '1px solid rgba(255,255,255,0.95)', borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.16), 0 0 0 0.5px rgba(0,0,0,0.05)' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowShift 3s linear infinite' }} />
        <div style={{ padding: '32px 32px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><GCIcon size={52} /></div>
          <AnimatePresence mode="wait">
            {view === 'main' && !submitted && (
              <motion.div key="main" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.2)', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#ff3b30', letterSpacing: '0.08em', textTransform: 'uppercase' as const, width: 'fit-content', margin: '0 auto 16px' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3b30' }} /> Coming soon
                </div>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.15, color: '#1c1c1e', textAlign: 'center', marginBottom: 10 }}>Solutions for businesses<br />moving forward.</h1>
                <p style={{ fontSize: 14, color: 'rgba(28,28,30,0.52)', lineHeight: 1.65, textAlign: 'center', marginBottom: 22 }}>Gratia Core is opening soon. Join the waitlist and we&apos;ll email you the moment doors open.</p>
                <input type="email" placeholder="your@email.com" value={email} autoFocus onChange={e => { setEmail(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleWaitlist()} style={{ ...inp, marginBottom: error ? 6 : 12 }} />
                {error && <p style={{ fontSize: 12, color: '#ff3b30', marginBottom: 10 }}>{error}</p>}
                <button onClick={handleWaitlist} disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 100, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: email.trim() ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(0,0,0,0.07)', color: email.trim() ? '#fff' : 'rgba(28,28,30,0.28)', boxShadow: email.trim() ? '0 4px 16px rgba(255,59,48,0.35)' : 'none', marginBottom: 16 }}>
                  {loading ? 'Joining\u2026' : 'Join the waitlist \u2192'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,0,0,0.08)' }} />
                  <span style={{ fontSize: 12, color: 'rgba(28,28,30,0.38)' }}>or</span>
                  <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,0,0,0.08)' }} />
                </div>
                <button onClick={() => { setView('code'); setError(''); }} style={{ width: '100%', padding: 11, borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(120,120,128,0.08)', border: '1px solid rgba(0,0,0,0.08)', color: 'rgba(28,28,30,0.6)', transition: 'all 0.2s' }}>I have an access code</button>
              </motion.div>
            )}
            {view === 'main' && submitted && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '8px 0 12px' }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>&#127881;</div>
                <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1c1c1e', marginBottom: 8 }}>You&apos;re on the list.</h2>
                <p style={{ fontSize: 14, color: 'rgba(28,28,30,0.52)', lineHeight: 1.65, marginBottom: 20 }}>We&apos;ll email <strong style={{ color: '#1c1c1e' }}>{email}</strong> the moment Gratia Core opens.</p>
                <button onClick={() => { setView('code'); setError(''); }} style={{ padding: '10px 22px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(120,120,128,0.08)', border: '1px solid rgba(0,0,0,0.08)', color: 'rgba(28,28,30,0.6)' }}>I have an access code \u2192</button>
              </motion.div>
            )}
            {view === 'code' && (
              <motion.div key="code" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1c1c1e', marginBottom: 6, textAlign: 'center' }}>Enter your code</h2>
                <p style={{ fontSize: 13, color: 'rgba(28,28,30,0.48)', textAlign: 'center', marginBottom: 22, lineHeight: 1.55 }}>Got an early access code? Enter it below to unlock Gratia Core.</p>
                <input type="text" placeholder="XXXXXXXX" value={code} autoFocus onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleCode()} style={{ ...inp, fontSize: 18, fontWeight: 700, letterSpacing: '0.12em', textAlign: 'center' as const, marginBottom: error ? 6 : 14 }} />
                {error && <p style={{ fontSize: 12, color: '#ff3b30', marginBottom: 10 }}>{error}</p>}
                <button onClick={handleCode} disabled={loading || !code.trim()} style={{ width: '100%', padding: 14, borderRadius: 100, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: code.trim() ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(0,0,0,0.07)', color: code.trim() ? '#fff' : 'rgba(28,28,30,0.28)', boxShadow: code.trim() ? '0 4px 16px rgba(255,59,48,0.35)' : 'none', marginBottom: 14 }}>
                  {loading ? 'Checking\u2026' : 'Unlock access \u2192'}
                </button>
                <button onClick={() => { setView('main'); setError(''); setCode(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(28,28,30,0.42)', fontFamily: 'inherit', width: '100%', textAlign: 'center' as const }}>&larr; Back</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ position: 'relative', zIndex: 10, fontSize: 11, color: 'rgba(28,28,30,0.3)', marginTop: 20, textAlign: 'center' }}>
        Gratia Core &middot; Solutions for businesses moving forward &middot; &copy; {new Date().getFullYear()}
      </motion.p>
    </div>
  );
}

export default function RootPage() {
  const [status, setStatus] = React.useState<'checking' | 'locked' | 'unlocked'>('checking');
  useEffect(() => { setStatus(getCookie() === 'granted' ? 'unlocked' : 'locked'); }, []);
  const handleUnlock = useCallback(() => setStatus('unlocked'), []);
  if (status === 'checking') return <div style={{ position: 'fixed', inset: 0, background: '#f2f2f7' }} />;
  if (status === 'unlocked') return <LandingPage />;
  return <GatePage onUnlock={handleUnlock} />;
}