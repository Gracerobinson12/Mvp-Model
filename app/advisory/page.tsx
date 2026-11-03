'use client';

// app/advisory/page.tsx
// Gratia Core — Consulting page
// Drop this file directly into app/advisory/page.tsx
// Requires: motion/react  (already in your project)
// Form submits to: POST /api/advisory
// Email on submission: handled by the API route via Resend (see below)

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ───────────────────────────────────────────────────────────────────
type ServiceKey = 'qa' | 'product_lab' | 'tech_diligence' | 'solutions';

interface Service {
  key: ServiceKey;
  num: string;
  icon: string;
  title: string;
  desc: string;
  bullets: string[];
}

// ─── Data ────────────────────────────────────────────────────────────────────
const SERVICES: Service[] = [
  {
    key: 'qa',
    num: '01',
    icon: '🔬',
    title: 'QA & User Testing',
    desc: 'We test your product like a real user — across devices, browsers, and edge cases — then hand you a clear report of what\'s broken and what to fix first.',
    bullets: [
      'Functional and regression testing',
      'Accessibility audit (WCAG 2.2)',
      'Device + browser coverage',
      'Prioritized findings report',
    ],
  },
  {
    key: 'product_lab',
    num: '02',
    icon: '💡',
    title: 'Product Concept Lab',
    desc: 'From napkin sketch to validated concept — we help you shape an idea into something buildable, whether it\'s software, a physical product, or both.',
    bullets: [
      'Concept definition & scoping',
      'Market & feasibility research',
      'Prototype direction (digital or physical)',
      'Go/no-go decision framework',
    ],
  },
  {
    key: 'tech_diligence',
    num: '03',
    icon: '🔍',
    title: 'Tech Due Diligence',
    desc: 'We map your architecture, surface security risks, and give you an honest picture of your technical health — whether you\'re raising, acquiring, or just want to know where you stand.',
    bullets: [
      'Infrastructure & stack audit',
      'Security posture review',
      'Dependency & CVE analysis',
      'Risk report with remediation steps',
    ],
  },
  {
    key: 'solutions',
    num: '04',
    icon: '🤝',
    title: 'Solutions & Ongoing Support',
    desc: 'For teams that need a steady technical partner — not a one-time engagement. We stay in your corner through code reviews, strategy calls, and ongoing work.',
    bullets: [
      'Monthly retainer model',
      'Code reviews & architecture guidance',
      'Priority response time',
      'Scales with your needs',
    ],
  },
];

const STEPS = [
  { n: '1', title: 'Fill out the form', desc: 'Tell us what you\'re working on and what you need help with.' },
  { n: '2', title: 'We reach out', desc: 'Within one business day we\'ll be in touch to set up a call.' },
  { n: '3', title: 'Strategy call', desc: 'We learn about your product, scope the work, and align on approach.' },
  { n: '4', title: 'We get to work', desc: 'Deliverables, findings, or an ongoing engagement — your call.' },
];

// ─── Styles (inline — no Tailwind) ───────────────────────────────────────────
const s = {
  page: {
    background: '#f2f2f7',
    minHeight: '100vh',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: '#14202e',
  } as React.CSSProperties,

  // hero
  hero: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '72px 20px 56px',
    textAlign: 'center' as const,
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,59,48,0.08)',
    border: '1px solid rgba(255,59,48,0.22)',
    color: '#ff3b30',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.1em',
    textTransform: 'uppercase' as const,
    borderRadius: 20,
    padding: '5px 14px',
    marginBottom: 20,
    fontFamily: "'Sora', sans-serif",
  },
  h1: {
    fontFamily: "'Sora', sans-serif",
    fontWeight: 900,
    fontSize: 'clamp(30px, 6vw, 50px)',
    lineHeight: 1.1,
    letterSpacing: '-.02em',
    marginBottom: 18,
  },
  heroPara: {
    fontSize: 'clamp(15px, 2vw, 17px)',
    color: '#566475',
    maxWidth: 520,
    margin: '0 auto 32px',
    lineHeight: 1.7,
  },
  heroCta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: '#ff3b30',
    color: '#fff',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    border: 'none',
    borderRadius: 14,
    padding: '14px 28px',
    cursor: 'pointer',
    textDecoration: 'none',
  },

  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.55)',
    maxWidth: 900,
    margin: '0 auto',
  },

  // section wrapper
  section: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '64px 20px',
  },
  sectionLabel: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '.12em',
    color: '#ff3b30',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  sectionTitle: {
    fontFamily: "'Sora', sans-serif",
    fontWeight: 800,
    fontSize: 'clamp(22px, 3.5vw, 30px)',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  sectionSub: {
    color: '#566475',
    textAlign: 'center' as const,
    fontSize: 15,
    marginBottom: 40,
  },

  // services grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
    gap: 16,
  },
  svcCard: {
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 20,
    padding: '28px 28px 24px',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  svcNum: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255,59,48,0.45)',
    letterSpacing: '.1em',
    marginBottom: 10,
  },
  svcIcon: { fontSize: 28, marginBottom: 12, display: 'block' },
  svcTitle: {
    fontFamily: "'Sora', sans-serif",
    fontWeight: 800,
    fontSize: 17,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  svcDesc: { fontSize: 14, color: '#566475', lineHeight: 1.7, marginBottom: 16 },
  bulletList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' as const, gap: 6 },
  bulletItem: { fontSize: 13, color: '#566475', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5 },
  bulletDot: { width: 5, height: 5, borderRadius: '50%', background: '#ff3b30', flexShrink: 0, marginTop: 6, opacity: 0.6 },

  // how steps
  stepsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
    gap: 0,
  },
  step: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    padding: '0 16px',
  },
  stepNum: {
    width: 56, height: 56,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.85)',
    border: '1.5px solid rgba(255,255,255,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Sora', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: '#ff3b30',
    marginBottom: 16,
    backdropFilter: 'blur(12px)',
  },
  stepTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 6 },
  stepDesc: { fontSize: 12, color: '#566475', lineHeight: 1.6 },

  // form
  formSection: { maxWidth: 640, margin: '0 auto', padding: '64px 20px 96px' },
  formCard: {
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 24,
    padding: '40px 36px',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
  },
  formHead: { textAlign: 'center' as const, marginBottom: 32 },
  formH2: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: 6 },
  formSub: { color: '#566475', fontSize: 14 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6, marginBottom: 14 },
  fieldLabel: {
    fontSize: 12, fontWeight: 600, color: '#566475',
    textTransform: 'uppercase' as const, letterSpacing: '.06em',
  },
  input: {
    background: 'rgba(255,255,255,0.9)',
    border: '1.5px solid rgba(0,0,0,0.12)',
    borderRadius: 12,
    padding: '12px 14px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: '#14202e',
    outline: 'none',
    width: '100%',
  },
  textarea: {
    background: 'rgba(255,255,255,0.9)',
    border: '1.5px solid rgba(0,0,0,0.12)',
    borderRadius: 12,
    padding: '12px 14px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: '#14202e',
    outline: 'none',
    width: '100%',
    resize: 'vertical' as const,
    minHeight: 100,
  },
  checksLabel: {
    fontSize: 12, fontWeight: 600, color: '#566475',
    textTransform: 'uppercase' as const, letterSpacing: '.06em',
    display: 'block', marginBottom: 8,
  },
  checksGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 },
  checkItem: (checked: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    background: checked ? 'rgba(255,59,48,0.05)' : 'rgba(255,255,255,0.9)',
    border: `1.5px solid ${checked ? 'rgba(255,59,48,0.5)' : 'rgba(0,0,0,0.12)'}`,
    borderRadius: 12, padding: '11px 14px', cursor: 'pointer',
    transition: 'all .15s', userSelect: 'none',
  }),
  checkBox: (checked: boolean): React.CSSProperties => ({
    width: 18, height: 18, borderRadius: 5,
    border: `2px solid ${checked ? '#ff3b30' : 'rgba(0,0,0,0.2)'}`,
    background: checked ? '#ff3b30' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all .15s',
  }),
  checkLabel: { fontSize: 13, fontWeight: 500, lineHeight: 1.3 },
  submitBtn: (disabled: boolean): React.CSSProperties => ({
    width: '100%',
    background: disabled ? 'rgba(255,59,48,0.5)' : '#ff3b30',
    color: '#fff',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15, fontWeight: 700,
    border: 'none', borderRadius: 14,
    padding: '15px', cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }),
  errBox: {
    background: 'rgba(255,59,48,0.08)',
    border: '1px solid rgba(255,59,48,0.25)',
    borderRadius: 10, padding: '10px 14px',
    fontSize: 13, color: '#ff3b30', marginBottom: 14,
  },
  disclaimer: {
    textAlign: 'center' as const,
    fontSize: 11, color: '#566475',
    marginTop: 14, lineHeight: 1.6, opacity: 0.8,
  },
  successWrap: { textAlign: 'center' as const, padding: '24px 0' },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 8 },
  successSub: { color: '#566475', fontSize: 14, lineHeight: 1.6 },
  footer: { textAlign: 'center' as const, fontSize: 12, color: '#566475', padding: '0 0 48px', opacity: 0.7 },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────
export default function ConsultingPage() {
  const [selected, setSelected] = useState<Set<ServiceKey>>(new Set());
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLElement>(null);

  function toggleService(key: ServiceKey) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return; }
    if (selected.size === 0) { setError('Please select at least one service.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          services: [...selected],
          message: message.trim() || undefined,
          source: 'consulting_page',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Server error');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or email intel@gratiacore.com.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f2f2f7; }
        input::placeholder, textarea::placeholder { color: #8a97a8; }
        input:focus, textarea:focus { border-color: #ff3b30 !important; }
        @media (max-width: 520px) {
          .form-row-grid { grid-template-columns: 1fr !important; }
          .checks-grid { grid-template-columns: 1fr !important; }
          .form-card-inner { padding: 24px 18px !important; }
        }
      `}</style>

      <div style={s.page}>
        {/* ── HERO ── */}
        <motion.section
          style={s.hero}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={s.eyebrow}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="5" cy="5" r="1.5" fill="currentColor"/>
            </svg>
            Gratia Core · Consulting
          </div>

          <h1 style={s.h1}>
            Build smarter.{' '}
            <span style={{ color: '#ff3b30' }}>Ship with confidence.</span>
          </h1>

          <p style={s.heroPara}>
            We work directly with founders and small teams — auditing what's there, shaping what's next, and staying in your corner through it all.
          </p>

          <motion.a
            href="#book"
            style={s.heroCta}
            whileHover={{ background: '#D7141A', y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            Book a consultation
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.a>
        </motion.section>

        <div style={s.divider} />

        {/* ── SERVICES ── */}
        <section style={s.section}>
          <div style={s.sectionLabel}>What we do</div>
          <h2 style={s.sectionTitle}>Four ways we can help</h2>
          <p style={s.sectionSub}>Tell us what you need and we'll figure out the right fit together.</p>

          <div style={s.grid}>
            {SERVICES.map((svc, i) => (
              <motion.div
                key={svc.key}
                style={s.svcCard}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -3, boxShadow: '0 16px 48px rgba(0,0,0,0.1)' }}
              >
                {/* accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: 28, right: 28, height: 2,
                  background: 'linear-gradient(90deg, transparent, rgba(255,59,48,0.4), transparent)',
                  borderRadius: '0 0 2px 2px',
                }} />
                <div style={s.svcNum}>{svc.num}</div>
                <span style={s.svcIcon}>{svc.icon}</span>
                <h3 style={s.svcTitle}>{svc.title}</h3>
                <p style={s.svcDesc}>{svc.desc}</p>
                <ul style={s.bulletList}>
                  {svc.bullets.map(b => (
                    <li key={b} style={s.bulletItem}>
                      <span style={s.bulletDot} />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        <div style={s.divider} />

        {/* ── HOW IT WORKS ── */}
        <section style={{ ...s.section, maxWidth: 860 }}>
          <div style={s.sectionLabel}>The process</div>
          <h2 style={{ ...s.sectionTitle, marginBottom: 48 }}>Simple from start to finish</h2>
          <div style={s.stepsRow}>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                style={s.step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              >
                <div style={s.stepNum}>{step.n}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <div style={s.divider} />

        {/* ── FORM ── */}
        <section id="book" ref={formRef} style={s.formSection}>
          <motion.div
            style={s.formCard}
            className="form-card-inner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  style={s.successWrap}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <div style={s.successIcon}>✉️</div>
                  <div style={s.successTitle}>We got it — thanks.</div>
                  <p style={s.successSub}>
                    We'll reach out within one business day to set up a call. Keep an eye on your inbox.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div style={s.formHead}>
                    <h2 style={s.formH2}>Let's talk about your project</h2>
                    <p style={s.formSub}>No pressure, no pitch. Just a real conversation about what you need.</p>
                  </div>

                  {error && (
                    <motion.div
                      style={s.errBox}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Name + Email */}
                    <div style={s.formRow} className="form-row-grid">
                      <div style={s.field}>
                        <label style={s.fieldLabel}>Your name</label>
                        <input
                          style={s.input}
                          type="text"
                          placeholder="Grace Robinson"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                          autoComplete="name"
                        />
                      </div>
                      <div style={s.field}>
                        <label style={s.fieldLabel}>Email</label>
                        <input
                          style={s.input}
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {/* Company */}
                    <div style={s.field}>
                      <label style={s.fieldLabel}>
                        Company or product{' '}
                        <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                          (optional)
                        </span>
                      </label>
                      <input
                        style={s.input}
                        type="text"
                        placeholder="Acme Inc. or your app name"
                        value={company}
                        onChange={e => setCompany(e.target.value)}
                      />
                    </div>

                    {/* Services */}
                    <div style={{ marginBottom: 14 }}>
                      <span style={s.checksLabel}>What are you looking for?</span>
                      <div style={s.checksGrid} className="checks-grid">
                        {SERVICES.map(svc => {
                          const checked = selected.has(svc.key);
                          return (
                            <div
                              key={svc.key}
                              style={s.checkItem(checked)}
                              onClick={() => toggleService(svc.key)}
                              role="checkbox"
                              aria-checked={checked}
                              tabIndex={0}
                              onKeyDown={e => e.key === ' ' && toggleService(svc.key)}
                            >
                              <div style={s.checkBox(checked)}>
                                {checked && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                              <span style={s.checkLabel}>{svc.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message */}
                    <div style={s.field}>
                      <label style={s.fieldLabel}>
                        Tell us what you're working on{' '}
                        <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                          (optional)
                        </span>
                      </label>
                      <textarea
                        style={s.textarea}
                        placeholder="A few sentences about your product, where you're at, and what kind of help you need."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                      />
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      style={s.submitBtn(submitting)}
                      disabled={submitting}
                      whileHover={!submitting ? { background: '#D7141A' } : {}}
                      whileTap={!submitting ? { scale: 0.98 } : {}}
                    >
                      {submitting ? 'Sending…' : 'Send my request'}
                    </motion.button>
                  </form>

                  <p style={s.disclaimer}>
                    Not legal, financial, or medical advice. By submitting you agree to be contacted by Gratia Core.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        <p style={s.footer}>© 2026 Gratia Core Enterprise LLC · gratiacore.com</p>
      </div>
    </>
  );
}