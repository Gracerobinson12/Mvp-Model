'use client';
// @ts-nocheck
// app/cookies/page.tsx — Cookie Policy. ⚠️ Template, not legal advice.

import Link from 'next/link';

const UPDATED = 'October 10, 2026';
const CONTACT = 'intel@gratiacore.com';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block'}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}
const H = ({ children }) => <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: '#14202e', margin: '28px 0 8px' }}>{children}</h2>;
const P = ({ children }) => <p style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3a4656', margin: '0 0 12px' }}>{children}</p>;
const LI = ({ children }) => <li style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3a4656', margin: '0 0 6px' }}>{children}</li>;

export default function CookiesPage() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#f4f6f9}`}</style>
      <div style={{ minHeight: '100vh', padding: '28px 18px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 24 }}><GCIcon size={28} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: '#14202e' }}>Gratia Core</span></Link>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 900, color: '#14202e', letterSpacing: '-0.5px', marginBottom: 6 }}>Cookie Policy</h1>
          <p style={{ fontSize: 13, color: '#8a97a6', marginBottom: 20 }}>Last updated: {UPDATED}</p>

          <P>This policy explains how Gratia Core uses cookies and similar technologies (like your browser&apos;s local storage) on gratiacore.com. It works alongside our <Link href="/privacy" style={{ color: '#1f45c7', fontWeight: 600 }}>Privacy Policy</Link>.</P>

          <H>What we use</H>
          <P>We keep this deliberately minimal. We do not run third-party advertising cookies and we do not sell your data.</P>
          <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
            <LI><strong>Essential (authentication).</strong> When you log in, our authentication provider (Supabase) stores a secure session token so you stay signed in and can only see your own data. The site will not work properly without these.</LI>
            <LI><strong>Preferences (local storage).</strong> We store small settings in your browser — for example, light/dark mode — so the site remembers how you like it. These stay on your device.</LI>
            <LI><strong>Payments.</strong> When you check out, Stripe may set cookies needed to process the payment securely. These are governed by Stripe&apos;s own policies.</LI>
            <LI><strong>Analytics (if enabled).</strong> We may use privacy-friendly analytics to count visits and understand which pages are used, in aggregate. This does not identify you personally.</LI>
          </ul>

          <H>Managing cookies</H>
          <P>You can clear or block cookies in your browser settings at any time. If you block essential/authentication cookies, you will not be able to stay logged in or use your account. Clearing local storage simply resets preferences like dark mode.</P>

          <H>Changes</H>
          <P>We may update this policy as the site evolves. The &quot;last updated&quot; date above reflects the current version.</P>

          <H>Contact</H>
          <P>Questions about cookies: {CONTACT}.</P>

          <div style={{ marginTop: 28, padding: '14px 16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12 }}>
            <p style={{ fontSize: 12.5, color: '#9a3412', lineHeight: 1.6 }}><strong>Note:</strong> General template, not legal advice. If you add advertising or cross-site tracking later, or serve EU/UK users at scale, you may need a cookie-consent banner — have counsel confirm.</p>
          </div>

          <p style={{ marginTop: 28, fontSize: 13 }}><Link href="/" style={{ color: '#1f45c7', fontWeight: 600, textDecoration: 'none' }}>← Back to Gratia Core</Link></p>
        </div>
      </div>
    </>
  );
}