'use client';
// @ts-nocheck
// app/about/page.tsx — About Gratia Core.
// PHOTO: drop your image in /public as "about.jpg" (or change the src below).
// Edit the founder blurb text to your own words.

import Link from 'next/link';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block'}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

const BRANCHES = [
  { icon: '💬', name: 'Advisory', desc: 'Tell us the problem — we help you figure out what to do, then build it.' },
  { icon: '📡', name: 'Intelligence', desc: 'Regulatory and market updates filtered to your industry, in plain language.' },
  { icon: '🧰', name: 'Solutions', desc: 'Products that solve real problems: seal your ideas, track trades, launch what you build.' },
];

export default function AboutPage() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;color:#14202e;background:radial-gradient(ellipse 80% 60% at 18% -8%,rgba(255,59,48,0.10) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 82% 110%,rgba(10,132,255,0.10) 0%,transparent 60%),#eae6f2}`}</style>

      <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><GCIcon size={26} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: '#14202e' }}>Gratia Core</span></Link>
      </div>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '96px 24px 80px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#cc2018', marginBottom: 10 }}>About</p>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(30px,5vw,46px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>Built to help businesses move.</h1>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: '#3a4656', marginBottom: 14 }}>
          Gratia Core exists to help businesses navigate problems, understand change, and find solutions — through advisory, intelligence, and technology. No jargon, no false promises: just honest tools and clear guidance that actually move you forward.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: '#3a4656', marginBottom: 36 }}>
          We believe your data is yours. Everything you create lives secured in your own account, and we tell you plainly what each tool does — and what it doesn&apos;t.
        </p>

        {/* Founder / photo */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: 22, padding: 24, marginBottom: 40, backdropFilter: 'blur(30px)' }}>
          <img src="/grace.JPEG" alt="Gratia Core founder" style={{ width: 150, height: 150, borderRadius: 18, objectFit: 'cover', flexShrink: 0, background: '#dfe4ec' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Why we built this</p>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3a4656' }}>
              {/* ✏️ Replace this with your own words. */}
              Gratia Core started with a simple frustration: getting real help for a business — protecting an idea, keeping up with the rules, tracking a deal — was either too expensive, too confusing, or locked behind people who didn&apos;t explain anything. We&apos;re building the opposite: clear, honest, self-serve tools that respect your time and your data.
            </p>
          </div>
        </div>

        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 16 }}>What we do</h2>
        <div style={{ display: 'grid', gap: 12, marginBottom: 40 }}>
          {BRANCHES.map(b => (
            <div key={b.name} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 16, padding: '16px 18px' }}>
              <span style={{ fontSize: 24 }}>{b.icon}</span>
              <div><p style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{b.name}</p><p style={{ fontSize: 14, color: '#3a4656', lineHeight: 1.6 }}>{b.desc}</p></div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/pricing" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 100, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(255,59,48,0.3)' }}>See what&apos;s live →</Link>
          <p style={{ fontSize: 13, marginTop: 16 }}><Link href="/contact" style={{ color: '#1f45c7', fontWeight: 600, textDecoration: 'none' }}>Get in contact →</Link></p>
          <Link href="/" style={{ display: 'inline-block', marginTop: 14, fontSize: 13, color: '#8a97a6', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </main>
    </>
  );
}