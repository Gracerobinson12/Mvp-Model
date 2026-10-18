'use client';

// app/advisory/page.tsx — public Advisory v2.
// Service catalog (Websites · Consulting · Tech & automation · Security & privacy) + a scoped intake.
// No login. Saves a lead via /api/advisory (which emails you + confirms to them).
// SQL: run advisory-services.sql once.

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ── EDIT ME: your service catalog. Prices are hidden by default (from: ''). Add e.g. from: 'from $300' to show a starting point.
const SERVICES = [
  {
    key: 'websites', icon: '\u{1F310}', name: 'Websites',
    tag: 'Design + build',
    from: '',
    blurb: 'A site that actually converts — designed, built, and launched on your domain.',
    includes: ['Landing pages, marketing sites, or full rebuilds', 'Next.js, Shopify or Webflow — we pick what fits', 'Mobile-first, fast, SEO basics done right', 'Domain, hosting, analytics and forms wired up'],
    good_for: 'You need a site, or the one you have is costing you customers.',
  },
  {
    key: 'consulting', icon: '\u{1F9ED}', name: 'Consulting',
    tag: 'Strategy',
    from: '',
    blurb: 'Decide what to build, what to skip, and what it should cost before you spend.',
    includes: ['Product scoping: MVP vs. everything', 'Pricing, go-to-market and launch plan', 'Vendor and tool selection (build vs. buy)', 'Compliance and risk roadmap for your industry'],
    good_for: 'You have an idea or a growing business and need a clear, honest plan.',
  },
  {
    key: 'tech', icon: '⚙️', name: 'Tech & automation',
    tag: 'Custom software',
    from: '',
    blurb: 'Custom software, integrations and AI workflows that remove manual work.',
    includes: ['MVPs and internal tools (web + mobile)', 'Integrations: Stripe, CRMs, email, spreadsheets, APIs', 'AI workflows: intake, drafting, classification, reporting', 'Data pipelines and dashboards you can trust'],
    good_for: 'You know the process; you want it to run without you.',
  },
  {
    key: 'security', icon: '\u{1F6E1}️', name: 'Security & privacy',
    tag: 'PII + protection',
    from: '',
    blurb: 'Find where personal data and secrets leak, fix it, and prove you did.',
    includes: ['PII and secrets audit across code, forms and AI prompts', 'GC Protect setup: AI-safe data handling', 'Access review, backups, incident readiness', 'Privacy Policy, Terms and consent flows that match reality'],
    good_for: 'You handle customer data, use AI tools, or someone asked “are we compliant?”',
  },
];

const STAGES = [
  { key: 'brainstorming', label: 'Brainstorming', icon: '\u{1F4A1}', sub: 'An idea, not built yet' },
  { key: 'midway',        label: 'Midway',        icon: '\u{1F680}', sub: 'Building it now' },
  { key: 'live',          label: 'Live, want more',icon: '\u{1F3C1}', sub: 'Up and running' },
];
const BUDGETS = ['Under $1k', '$1k–$5k', '$5k–$15k', '$15k+', 'Not sure yet'];
const TIMELINES = ['ASAP', 'This month', '1–3 months', 'Just exploring'];
const CONTACT = [
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'text',  label: 'Text' },
];

function GCIcon({ size = 26 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

export default function AdvisoryPage() {
  const [services, setServices] = useState<string[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [business, setBusiness] = useState('');
  const [stage, setStage] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [details, setDetails] = useState('');
  const [contactPref, setContactPref] = useState('email');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState(''); // honeypot — must stay empty
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const needsPhone = contactPref === 'phone' || contactPref === 'text';
  const valid = services.length > 0 && firstName.trim() && email.includes('@') && stage && details.trim() && (!needsPhone || phone.trim());

  const toggleService = (k: string) => {
    setServices(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);
    setError('');
  };
  const pickAndScroll = (k: string) => {
    if (!services.includes(k)) setServices(s => [...s, k]);
    document.getElementById('intake')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submit = async () => {
    if (company) return;
    if (services.length === 0) { setError('Pick at least one service.'); return; }
    if (!firstName.trim()) { setError('Enter your first name.'); return; }
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    if (!stage) { setError('Pick the stage you’re at.'); return; }
    if (!details.trim()) { setError('Tell us what you need.'); return; }
    if (needsPhone && !phone.trim()) { setError('Add a phone number so we can reach you.'); return; }
    setLoading(true); setError('');

    const lead = {
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      email: email.trim().toLowerCase(),
      business: business.trim() || null,
      stage,
      details: details.trim(),
      contact_pref: contactPref,
      phone: phone.trim() || null,
      services,
      budget: budget || null,
      timeline: timeline || null,
    };

    try {
      const res = await fetch('/api/advisory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) }).catch(() => null);
      if (!res || !res.ok) {
        const { error: dbErr } = await supabase.from('advisory_leads').insert(lead);
        if (dbErr) throw dbErr;
      }
      setSent(true);
    } catch {
      setError('Something went wrong. Email us at intel@gratiacore.com');
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: 'rgba(120,120,128,0.08)', border: '0.5px solid rgba(0,0,0,0.1)', color: '#1a1a2e', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,0.5)', display: 'block', marginBottom: 5 };
  const pill = (on: boolean): React.CSSProperties => ({ padding: '8px 12px', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: on ? 600 : 400, border: '0.5px solid ' + (on ? 'rgba(255,59,48,0.25)' : 'rgba(0,0,0,0.08)'), background: on ? 'rgba(255,59,48,0.1)' : 'rgba(255,255,255,0.6)', color: on ? '#cc2018' : 'rgba(26,26,46,0.55)' });
  const card: React.CSSProperties = { background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,0.92)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes rainbowShift{to{background-position:200% center;}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .adv-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        @media(max-width:720px){.adv-grid{grid-template-columns:1fr}}
        .svc{transition:transform .15s ease, box-shadow .15s ease}
        .svc:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(0,0,0,0.12)}
      `}</style>

      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.09) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.07) 0%,transparent 50%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)', fontFamily: "'DM Sans',sans-serif", padding: '24px 20px 60px' }}>

        <div style={{ maxWidth: 820, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <GCIcon size={24} /><span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Gratia Core</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(26,26,46,0.5)', textDecoration: 'none' }}>&larr; Home</Link>
        </div>

        {/* ── Hero + catalog ── */}
        <div style={{ maxWidth: 820, margin: '0 auto 22px', animation: 'fadeUp 0.4s ease' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#cc2018', marginBottom: 8 }}>Advisory</p>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: '-0.8px', color: '#1a1a2e', lineHeight: 1.1, marginBottom: 10 }}>We figure out what to do. Then we build it.</h1>
          <p style={{ fontSize: 15, color: 'rgba(26,26,46,0.6)', lineHeight: 1.65, maxWidth: 600, marginBottom: 22 }}>Four ways we work with founders and small teams. Pick what you need below &mdash; mix them if the problem spans more than one &mdash; and tell us the situation. Every request gets a real reply, not a bot.</p>

          <div className="adv-grid">
            {SERVICES.map(s => {
              const on = services.includes(s.key);
              return (
                <div key={s.key} className="svc" style={{ ...card, borderRadius: 20, padding: '20px 20px 18px', border: '0.5px solid ' + (on ? 'rgba(255,59,48,0.45)' : 'rgba(255,255,255,0.92)'), position: 'relative' }}>
                  {on && <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#fff', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', borderRadius: 100, padding: '4px 9px' }}>SELECTED</span>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <div>
                      <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.1 }}>{s.name}</p>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,0.45)', letterSpacing: '0.04em' }}>{s.tag}{s.from ? ` · ${s.from}` : ''}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'rgba(26,26,46,0.7)', lineHeight: 1.55, marginBottom: 10 }}>{s.blurb}</p>
                  <ul style={{ listStyle: 'none', marginBottom: 12 }}>
                    {s.includes.map(i => (
                      <li key={i} style={{ fontSize: 12.5, color: 'rgba(26,26,46,0.65)', lineHeight: 1.5, display: 'flex', gap: 7 }}><span style={{ color: '#cc2018', fontWeight: 700 }}>&#10003;</span><span>{i}</span></li>
                    ))}
                  </ul>
                  <p style={{ fontSize: 12, color: 'rgba(26,26,46,0.5)', fontStyle: 'italic', marginBottom: 12 }}>Good for: {s.good_for}</p>
                  <button onClick={() => pickAndScroll(s.key)} style={{ width: '100%', padding: '10px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: on ? '#cc2018' : '#fff', background: on ? 'rgba(255,59,48,0.1)' : 'linear-gradient(135deg,#ff3b30,#ff6b35)', boxShadow: on ? 'none' : '0 4px 12px rgba(255,59,48,0.3)' }}>
                    {on ? 'Added — go to the form ↓' : `Get help with ${s.name.toLowerCase()} →`}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 16, fontSize: 12, color: 'rgba(26,26,46,0.5)' }}>
            <span>&#9679; Free 20-minute scoping call, then a fixed quote</span>
            <span>&#9679; Reply within 2 business days</span>
            <span>&#9679; You own everything we build</span>
          </div>
        </div>

        {/* ── Intake ── */}
        <div id="intake" style={{ maxWidth: 560, margin: '0 auto', ...card, animation: 'fadeUp 0.5s ease' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowShift 3s linear infinite' }} />

          {!sent ? (
            <div style={{ padding: '24px 26px 26px' }}>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: '-0.4px', color: '#1a1a2e', marginBottom: 4 }}>Tell us the situation.</h2>
              <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.55)', lineHeight: 1.6, marginBottom: 18 }}>The more specific, the faster we can quote.</p>

              <label style={{ ...lbl, marginBottom: 8 }}>What do you need? <span style={{ fontWeight: 400, color: 'rgba(26,26,46,0.35)' }}>(pick all that apply)</span></label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {SERVICES.map(s => (
                  <button key={s.key} onClick={() => toggleService(s.key)} style={pill(services.includes(s.key))}>{s.icon} {s.name}</button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div><label style={lbl}>First name</label><input value={firstName} onChange={e => { setFirstName(e.target.value); setError(''); }} placeholder="Jordan" style={inp} /></div>
                <div><label style={lbl}>Last name <span style={{ color: 'rgba(26,26,46,0.3)', fontWeight: 400 }}>(optional)</span></label><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Lee" style={inp} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={lbl}>Email</label><input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="jordan@company.com" style={inp} /></div>
              <div style={{ marginBottom: 16 }}><label style={lbl}>Business <span style={{ color: 'rgba(26,26,46,0.3)', fontWeight: 400 }}>(optional)</span></label><input value={business} onChange={e => setBusiness(e.target.value)} placeholder="Acme Co" style={inp} /></div>

              <input value={company} onChange={e => setCompany(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

              <label style={{ ...lbl, marginBottom: 8 }}>What stage are you at?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
                {STAGES.map(s => {
                  const on = stage === s.key;
                  return (
                    <button key={s.key} onClick={() => { setStage(s.key); setError(''); }} style={{ padding: '10px 6px', borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', border: '0.5px solid ' + (on ? 'transparent' : 'rgba(255,255,255,0.85)'), background: on ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(255,255,255,0.6)', boxShadow: on ? '0 4px 10px rgba(255,59,48,0.25)' : 'none' }}>
                      <div style={{ fontSize: 18, marginBottom: 3 }}>{s.icon}</div>
                      <p style={{ fontSize: 11, fontWeight: on ? 700 : 500, color: on ? '#fff' : 'rgba(26,26,46,0.6)', lineHeight: 1.2 }}>{s.label}</p>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ ...lbl, marginBottom: 8 }}>Budget <span style={{ fontWeight: 400, color: 'rgba(26,26,46,0.35)' }}>(optional)</span></label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {BUDGETS.map(b => <button key={b} onClick={() => setBudget(budget === b ? '' : b)} style={pill(budget === b)}>{b}</button>)}
                  </div>
                </div>
                <div>
                  <label style={{ ...lbl, marginBottom: 8 }}>Timeline <span style={{ fontWeight: 400, color: 'rgba(26,26,46,0.35)' }}>(optional)</span></label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {TIMELINES.map(t => <button key={t} onClick={() => setTimeline(timeline === t ? '' : t)} style={pill(timeline === t)}>{t}</button>)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>What&apos;s going on, and what would a win look like?</label>
                <textarea value={details} onChange={e => { setDetails(e.target.value); setError(''); }} rows={4} placeholder="We're a DTC skincare brand. Our Shopify site is slow, we're hand-entering orders into a spreadsheet, and we're not sure our customer data is handled safely…" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
              </div>

              <label style={{ ...lbl, marginBottom: 8 }}>Best way to reach you</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: needsPhone ? 12 : 20 }}>
                {CONTACT.map(c => (
                  <button key={c.key} onClick={() => setContactPref(c.key)} style={{ ...pill(contactPref === c.key), flex: 1, textAlign: 'center' }}>{c.label}</button>
                ))}
              </div>
              {needsPhone && (
                <div style={{ marginBottom: 20 }}><label style={lbl}>Phone number</label><input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }} placeholder="(555) 123-4567" style={inp} /></div>
              )}

              {error && <p style={{ fontSize: 12, color: '#ff3b30', marginBottom: 12 }}>{error}</p>}

              <button onClick={submit} disabled={loading} style={{ width: '100%', padding: 13, borderRadius: 100, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: valid ? '#fff' : 'rgba(28,28,30,0.3)', background: valid ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(0,0,0,0.07)', boxShadow: valid ? '0 4px 16px rgba(255,59,48,0.35)' : 'none', transition: 'all 0.2s' }}>
                {loading ? 'Sending…' : 'Request a quote →'}
              </button>
              <p style={{ fontSize: 11, color: 'rgba(26,26,46,0.4)', textAlign: 'center', marginTop: 12 }}>We read every submission and reply within 2 business days. By submitting you agree to our <Link href="/privacy" style={{ color: 'inherit' }}>Privacy Policy</Link>.</p>
            </div>
          ) : (
            <div style={{ padding: '40px 30px', textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>&#128075;</div>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>Got it, {firstName}.</h2>
              <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.55)', lineHeight: 1.65, marginBottom: 6 }}>We&apos;ll review your request for <strong style={{ color: '#1a1a2e' }}>{services.map(k => SERVICES.find(s => s.key === k)?.name).join(', ')}</strong> and get back to you at <strong style={{ color: '#1a1a2e' }}>{email}</strong> within 2 business days.</p>
              <p style={{ fontSize: 12, color: 'rgba(26,26,46,0.45)', marginBottom: 22 }}>A confirmation is on its way to your inbox (check spam the first time).</p>
              <Link href="/" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 100, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(255,59,48,0.3)' }}>Back to home</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}