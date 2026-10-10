'use client';
// @ts-nocheck
// app/privacy/page.tsx — Privacy Policy.
// ⚠️ TEMPLATE, NOT LEGAL ADVICE. Fill [BRACKETED] fields and confirm the subprocessor list
// matches what you actually use. Have counsel review if you serve EU/UK or California users at scale.

import Link from 'next/link';

const UPDATED = 'October 10, 2026';
const COMPANY = 'Gratia Core LLC';
const CONTACT = 'support@gratiacore.com';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block'}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

const H = ({ children }) => <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: '#14202e', margin: '28px 0 8px' }}>{children}</h2>;
const P = ({ children }) => <p style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3a4656', margin: '0 0 12px' }}>{children}</p>;
const LI = ({ children }) => <li style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3a4656', margin: '0 0 6px' }}>{children}</li>;

export default function PrivacyPage() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#f4f6f9}`}</style>
      <div style={{ minHeight: '100vh', padding: '28px 18px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 24 }}><GCIcon size={28} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: '#14202e' }}>Gratia Core</span></Link>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 900, color: '#14202e', letterSpacing: '-0.5px', marginBottom: 6 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: '#8a97a6', marginBottom: 20 }}>Last updated: {UPDATED}</p>

          <P>{COMPANY} (&quot;Gratia Core,&quot; &quot;we,&quot; &quot;us&quot;) respects your privacy. This policy explains what we collect, how we use it, who we share it with, and the choices you have. It applies to gratiacore.com and our Services.</P>

          <H>Information we collect</H>
          <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
            <LI><strong>Account info</strong> you give us: name, email, password (stored hashed by our auth provider), and your industry/profile details.</LI>
            <LI><strong>Content you create:</strong> ideas you save or seal, barter agreements, launch plans, and anything you upload.</LI>
            <LI><strong>Billing info:</strong> handled by Stripe. We receive limited details (plan, status, last four digits, billing country) — we do <strong>not</strong> store full card numbers.</LI>
            <LI><strong>Usage &amp; device data:</strong> basic logs, IP address, browser type, and interactions, used to run and secure the Services.</LI>
          </ul>

          <H>How we use it</H>
          <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
            <LI>To provide, maintain, and improve the Services.</LI>
            <LI>To process payments and manage your subscription.</LI>
            <LI>To send service and account emails (confirmations, security, billing, and — if you opted in — product updates).</LI>
            <LI>To secure the Services, prevent abuse, and comply with law.</LI>
          </ul>
          <P>We do <strong>not</strong> sell your personal information, and we do not use your private content to train our own models.</P>

          <H>Service providers (subprocessors)</H>
          <P>We share data with vendors only as needed to run the Services:</P>
          <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
            <LI><strong>Supabase</strong> — database, authentication, and storage of your account and content.</LI>
            <LI><strong>Stripe</strong> — payment processing and subscription billing.</LI>
            <LI><strong>Resend</strong> — sending transactional and (if opted in) marketing emails.</LI>
            <LI><strong>Anthropic</strong> — AI generation for Launch HQ. Inputs you submit for a plan are sent to Anthropic to produce output; per Anthropic&apos;s commercial terms, API inputs/outputs are not used to train their models.</LI>
            <LI><strong>Vercel</strong> — hosting and delivery of the website.</LI>
          </ul>

          <H>Your content and security</H>
          <P>Your account data is protected with row-level security so that, by default, only you can access your own records. We use industry-standard safeguards, but no system is perfectly secure; you share information at your own risk.</P>

          <H>Your choices and rights</H>
          <P>You can access or update your profile in settings, and you can request deletion of your account and associated data by emailing {CONTACT}. Depending on where you live (for example, California under the CCPA/CPRA, or the EU/UK under the GDPR), you may have rights to access, correct, delete, or port your data, and to opt out of certain uses. We honor these requests as required by applicable law.</P>
          <P><strong>Email preferences.</strong> Service emails (billing, security, confirmations) are required while you have an account. Marketing emails are optional — every marketing email includes an unsubscribe link, and unsubscribing stops them without affecting your account.</P>

          <H>Data retention</H>
          <P>We keep your information while your account is active and as needed to provide the Services, comply with law, resolve disputes, and enforce agreements. When you delete your account, we delete or de-identify your data within a reasonable period, except where we must retain it by law.</P>

          <H>Children</H>
          <P>The Services are for adults (18+) and are not directed to children. We do not knowingly collect personal information from anyone under 18. If you believe a minor has given us data, contact {CONTACT} and we will delete it.</P>

          <H>Changes</H>
          <P>We may update this policy. Material changes will be announced (for example, by email or an in-app notice). The &quot;last updated&quot; date above reflects the current version.</P>

          <H>Contact</H>
          <P>Questions or requests: {CONTACT}.</P>

          <div style={{ marginTop: 28, padding: '14px 16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12 }}>
            <p style={{ fontSize: 12.5, color: '#9a3412', lineHeight: 1.6 }}><strong>Note:</strong> This is a general template, not legal advice. Confirm the subprocessor list matches what you actually use, and have counsel review before launch if you serve EU/UK or large numbers of California users.</p>
          </div>

          <p style={{ marginTop: 28, fontSize: 13 }}><Link href="/" style={{ color: '#1f45c7', fontWeight: 600, textDecoration: 'none' }}>← Back to Gratia Core</Link></p>
        </div>
      </div>
    </>
  );
}