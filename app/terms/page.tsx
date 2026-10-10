'use client';
// @ts-nocheck
// app/terms/page.tsx — Terms of Service.
// ⚠️ TEMPLATE, NOT LEGAL ADVICE. Fill the [BRACKETED] fields and have an attorney review
// the Arbitration & Class Action Waiver section before relying on it — enforceability varies by state.

import Link from 'next/link';

const UPDATED = 'October 10, 2026';
const COMPANY = 'Gratia Core LLC';          // ← your exact registered entity
const STATE = 'New York';                   // ← your governing state
const CONTACT = 'support@gratiacore.com';   // ← your support email

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block'}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

const H = ({ children }) => <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: '#14202e', margin: '28px 0 8px' }}>{children}</h2>;
const P = ({ children }) => <p style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3a4656', margin: '0 0 12px' }}>{children}</p>;

export default function TermsPage() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#f4f6f9}`}</style>
      <div style={{ minHeight: '100vh', padding: '28px 18px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 24 }}><GCIcon size={28} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: '#14202e' }}>Gratia Core</span></Link>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 900, color: '#14202e', letterSpacing: '-0.5px', marginBottom: 6 }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: '#8a97a6', marginBottom: 20 }}>Last updated: {UPDATED}</p>

          <P>These Terms of Service (&quot;Terms&quot;) are a binding agreement between you and {COMPANY} (&quot;Gratia Core,&quot; &quot;we,&quot; &quot;us&quot;). They govern your use of gratiacore.com and our products and services (the &quot;Services&quot;). By creating an account, submitting an order, or using the Services, you agree to these Terms and to our <Link href="/privacy" style={{ color: '#1f45c7', fontWeight: 600 }}>Privacy Policy</Link>. If you do not agree, do not use the Services.</P>

          <H>1. Who may use the Services</H>
          <P>You must be at least 18 years old and able to form a binding contract. If you use the Services for an organization, you represent that you are authorized to accept these Terms on its behalf.</P>

          <H>2. Accounts</H>
          <P>You are responsible for your account, for keeping your password secure, and for all activity under your account. Tell us promptly at {CONTACT} if you suspect unauthorized use.</P>

          <H>3. Subscriptions, trials, billing, and cancellation</H>
          <P>Paid plans are billed on a recurring basis (monthly or yearly) through our payment processor, Stripe. If your plan includes a free trial, we will not charge you during the trial; your selected plan will automatically begin and your payment method will be charged at the end of the trial unless you cancel before it ends. Subscriptions renew automatically until cancelled.</P>
          <P>You can cancel anytime from your account&apos;s billing settings. Cancellation stops future renewals; it does not retroactively refund the current period, and except where required by law, payments are non-refundable. Prices may change on renewal with advance notice.</P>

          <H>4. What the Services are — and are not</H>
          <P><strong>Ideas Vault.</strong> Sealing an idea creates a cryptographic fingerprint (SHA-256) of your document and records the date and time it was saved in our system. This can help show that a specific document existed in a specific form at a specific time. It is <strong>not</strong> a patent, copyright, trademark, legal filing, or government registration, and it does not by itself establish ownership or priority of an invention. For legal protection of an idea, consult a qualified attorney.</P>
          <P><strong>Barter.</strong> Barter is a record-keeping and tracking tool for trade agreements between you and another party. A confirmed agreement in Gratia Core is a record that both parties indicated agreement; it is <strong>not</strong> a legally binding contract unless you and the other party independently intend and create one. We are not a party to your agreements and are not responsible for either party&apos;s performance.</P>
          <P><strong>Launch HQ.</strong> Launch HQ generates general planning guidance using AI. It is informational only and is <strong>not</strong> legal, financial, tax, or professional advice. Laws and requirements vary by location and situation; confirm anything official with a licensed professional before acting.</P>
          <P><strong>Advisory and Intelligence.</strong> Any guidance, data, or regulatory information we surface is provided for general information only, may be incomplete or out of date, and is not a substitute for professional advice.</P>

          <H>5. Acceptable use</H>
          <P>You agree not to misuse the Services, including: breaking the law; infringing others&apos; rights; uploading malware; attempting to access data that is not yours; scraping or overloading the Services; or using the Services to harass, defraud, or harm others.</P>

          <H>6. Your content</H>
          <P>You keep ownership of the content you submit (ideas, agreements, uploads). You grant us a limited license to store, process, and display your content solely to provide the Services to you. We do not sell your content. See the <Link href="/privacy" style={{ color: '#1f45c7', fontWeight: 600 }}>Privacy Policy</Link> for how we handle data.</P>

          <H>7. AI features</H>
          <P>Some features use third-party AI models to generate output from your inputs. AI output can be inaccurate or incomplete; you are responsible for reviewing it before relying on it. Do not submit information you are not permitted to share.</P>

          <H>8. Disclaimers</H>
          <P>THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY OUTPUT IS ACCURATE.</P>

          <H>9. Limitation of liability</H>
          <P>TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY.toUpperCase()} WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICES WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM, OR (B) $100.</P>

          <H>10. Indemnification</H>
          <P>You agree to indemnify and hold {COMPANY} harmless from claims arising out of your content, your use of the Services, or your violation of these Terms, to the extent permitted by law.</P>

          <div style={{ background: '#fff', border: '1px solid #e3e7ee', borderRadius: 14, padding: '18px 20px', margin: '28px 0' }}>
            <H>11. Binding arbitration &amp; class action waiver</H>
            <P><strong>Please read this section carefully — it affects your legal rights.</strong></P>
            <P>Except where prohibited by law, you and {COMPANY} agree that any dispute arising out of or relating to these Terms or the Services will be resolved by <strong>binding individual arbitration</strong>, not in court, except that either party may bring an individual claim in small-claims court. The arbitration will be administered under the rules of a recognized arbitration provider, and will take place in {STATE} or be conducted remotely.</P>
            <P><strong>Class action waiver.</strong> You and {COMPANY} agree that each may bring claims against the other only in an individual capacity, and <strong>not</strong> as a plaintiff or class member in any purported class, consolidated, or representative proceeding. The arbitrator may not consolidate more than one person&apos;s claims or preside over any form of a class proceeding.</P>
            <P><strong>30-day opt-out.</strong> You may opt out of this arbitration and class-action-waiver section by emailing {CONTACT} within 30 days of first accepting these Terms, with your name, account email, and a clear statement that you opt out of arbitration. Opting out does not affect any other part of these Terms.</P>
            <P>If the class action waiver is found unenforceable as to a particular claim, that claim (and only that claim) will proceed in court; the rest of this section still applies.</P>
          </div>

          <H>12. Changes to these Terms</H>
          <P>We may update these Terms. If we make material changes, we will give notice (for example, by email or an in-app notice) before they take effect. Continuing to use the Services after changes take effect means you accept the updated Terms.</P>

          <H>13. Termination</H>
          <P>You may stop using the Services at any time. We may suspend or terminate access if you violate these Terms or to protect the Services. Sections that by their nature should survive termination (e.g., disclaimers, limitation of liability, arbitration) survive.</P>

          <H>14. Governing law</H>
          <P>These Terms are governed by the laws of the State of {STATE}, without regard to conflict-of-laws rules, except that the Federal Arbitration Act governs the arbitration section.</P>

          <H>15. Contact</H>
          <P>Questions about these Terms: {CONTACT}.</P>

          <div style={{ marginTop: 28, padding: '14px 16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12 }}>
            <p style={{ fontSize: 12.5, color: '#9a3412', lineHeight: 1.6 }}><strong>Note:</strong> This page is a general template, not legal advice. Have a licensed attorney review it — especially the arbitration and class-action-waiver section — and fill in your exact legal entity, state, and contact details before launch.</p>
          </div>

          <p style={{ marginTop: 28, fontSize: 13 }}><Link href="/" style={{ color: '#1f45c7', fontWeight: 600, textDecoration: 'none' }}>← Back to Gratia Core</Link></p>
        </div>
      </div>
    </>
  );
}