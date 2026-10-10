'use client';
// @ts-nocheck
// app/contact/page.tsx — simple "get in contact" page.

import Link from 'next/link';

const CONTACT = 'intel@gratiacore.com';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block'}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

export default function ContactPage() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.08) 0%,transparent 55%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)}`}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: 'min(460px,100%)', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,0.92)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)' }} />
          <div style={{ padding: '34px 32px 30px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 22 }}><GCIcon size={26} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: '#14202e' }}>Gratia Core</span></div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 900, color: '#14202e', letterSpacing: '-0.5px', marginBottom: 12 }}>Get in contact</h1>
            <p style={{ fontSize: 15, color: '#3a4656', lineHeight: 1.7, marginBottom: 24 }}>
              Just want to get in touch? Email us at<br />
              <a href={`mailto:${CONTACT}`} style={{ color: '#1f45c7', fontWeight: 700, textDecoration: 'none', fontSize: 17 }}>{CONTACT}</a><br />
              and we&apos;ll be in touch shortly.
            </p>
            <a href={`mailto:${CONTACT}`} style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 100, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(255,59,48,0.3)' }}>Email us →</a>
            <p style={{ fontSize: 12, color: '#8a97a6', marginTop: 20 }}>Looking for hands-on help? <Link href="/advisory" style={{ color: '#1f45c7', fontWeight: 600, textDecoration: 'none' }}>Visit Advisory →</Link></p>
            <Link href="/" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: '#8a97a6', textDecoration: 'none' }}>← Back to home</Link>
          </div>
        </div>
      </div>
    </>
  );
}