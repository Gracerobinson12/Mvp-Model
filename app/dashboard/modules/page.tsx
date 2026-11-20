'use client';
// @ts-nocheck
// app/dashboard/modules/page.tsx — Add what you need. Slide to turn on, charged today + monthly.

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MODULES, MODULE_ORDER, PAID_MODULES, COMING_SOON, money } from '@/lib/modules';
import { useModules } from '@/components/gc/useModules';
import { Header, Icon, MODULE_ICON } from '@/components/gc/ui';
const ShieldIcon = Icon.shield;
const AdvisoryIcon = Icon.advisory;

// ── Slide toggle ────────────────────────────────────────────────────────────
function SlideToggle({ on, busy, onChange }: { on: boolean; busy: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      disabled={busy}
      onClick={() => !busy && onChange(!on)}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        width: 52, height: 30, borderRadius: 100, border: 'none', cursor: busy ? 'wait' : 'pointer',
        background: on ? 'var(--gc-red)' : 'rgba(120,120,128,0.28)',
        transition: 'background 0.22s ease', padding: 0, flexShrink: 0,
        boxShadow: on ? '0 0 0 3px rgba(215,20,26,0.18)' : 'none',
      }}
    >
      <span style={{
        position: 'absolute', left: on ? 'calc(100% - 26px)' : 4,
        width: 22, height: 22, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.22)', transition: 'left 0.22s ease',
      }} />
    </button>
  );
}

// ── GC Protect card — link coming soon, no purchase here ────────────────────
function ProtectCard() {
  const mod = MODULES.protect;
  return (
    <article
      className="gc-glass gc-pad gc-stack"
      style={{ gap: 14, padding: 22, position: 'relative', overflow: 'hidden', maxWidth: 480 }}
    >
      <span style={{ position: 'absolute', right: -8, top: -8, fontSize: 80, opacity: 0.04, pointerEvents: 'none', userSelect: 'none' }}>🛡</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="gc-glass" style={{ width: 48, height: 48, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldIcon size={24} />
        </span>
        <div>
          <h3 className="gc-display" style={{ fontSize: 18, margin: 0 }}>GC Protect</h3>
          <p className="gc-small" style={{ fontWeight: 600, margin: 0 }}>Link coming soon</p>
        </div>
      </div>
      <p className="gc-small" style={{ fontSize: 14 }}>{mod.tagline}</p>
      <ul className="gc-list">{mod.bullets.map(b => <li key={b}>{b}</li>)}</ul>
      <p className="gc-note" style={{ marginTop: 'auto' }}>GC Protect lives at its own link — we'll add it here shortly.</p>
    </article>
  );
}

// ── Card-on-file confirm modal ───────────────────────────────────────────────
function ConfirmModal({ pending, onConfirm, onCancel }: {
  pending: { name: string; price: number; card_last4: string; card_brand: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!pending) return null;
  const brand = pending.card_brand
    ? pending.card_brand.charAt(0).toUpperCase() + pending.card_brand.slice(1)
    : 'Card';
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 9900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onCancel}
    >
      <div
        style={{ width: 'min(400px,100%)', background: 'rgba(255,255,255,0.97)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.22)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ height: 3, background: 'linear-gradient(90deg,#D7141A,#ff6b35)' }} />
        <div style={{ padding: '26px 26px 22px' }}>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: '-0.4px', color: '#1a1a2e', marginBottom: 6 }}>
            Add {pending.name}?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.65)', lineHeight: 1.6, marginBottom: 20 }}>
            ${pending.price}/mo — charged today, then on the same date each month.
          </p>

          {/* Card display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(215,20,26,0.05)', border: '1px solid rgba(215,20,26,0.12)', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>💳</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{brand} ···{pending.card_last4}</p>
              <p style={{ fontSize: 12, color: 'rgba(26,26,46,0.5)', margin: '2px 0 0' }}>Card on file</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onConfirm}
              style={{ flex: 1, padding: '13px 0', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#ff3b30,#D7141A)', boxShadow: '0 4px 16px rgba(215,20,26,0.35)' }}
            >
              Confirm · ${pending.price}/mo
            </button>
            <button
              onClick={onCancel}
              style={{ padding: '13px 18px', borderRadius: 100, border: '1px solid rgba(26,26,46,0.15)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'rgba(26,26,46,0.7)', background: 'transparent' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function Page() {
  return <Suspense fallback={<div className="gc-wrap" />}><ModulesPage /></Suspense>;
}

function ModulesPage() {
  const m = useModules();
  const sp = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    const start = sp.get('start');
    if (!start || fired.current || m.loading || !(start in MODULES)) return;
    fired.current = true;
    if (!m.access[start] && MODULES[start].price > 0) m.toggle(start, true);
  }, [sp, m.loading]); // eslint-disable-line

  const onNames = PAID_MODULES.filter(id => m.access[id]).map(id => MODULES[id].name).join(', ');
  const nextInvoice = m.summary?.next_invoice
    ? new Date(m.summary.next_invoice).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const otherPaid = PAID_MODULES.filter(id => id !== 'protect');

  return (
    <div className="gc-wrap">
      <Header back />

      <div className="gc-stack">
        <h1 className="gc-h1">Add what you need.</h1>
        <p className="gc-sub">Turn a module on and you're charged today — then on the same date every month until you turn it off. One bill, no plans, no bundles.</p>
      </div>

      <div className="gc-glass gc-glass--pink gc-row" style={{ padding: '16px 20px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, flexWrap: 'wrap' }}>
          <span className="gc-dot" />
          <strong style={{ color: 'var(--gc-red)' }}>This month: {money(m.monthTotal)}</strong>
          {onNames ? ` · ${onNames}` : ' · nothing on yet'}
          {nextInvoice ? ` · renews ${nextInvoice}` : ''}
        </span>
        <Link href="/dashboard/account" style={{ fontSize: 14, fontWeight: 700, textDecoration: 'none', minHeight: 44, display: 'flex', alignItems: 'center' }}>Billing &amp; invoices →</Link>
      </div>

      {m.error && <p className="gc-error">{m.error}</p>}

      {/* GC Protect — link coming soon */}
      <section className="gc-stack" style={{ gap: 14 }}>
        <h2 className="gc-h2">GC Protect</h2>
        <ProtectCard />
      </section>

      {/* Other paid modules */}
      <section className="gc-stack" style={{ gap: 14 }}>
        <h2 className="gc-h2">Available modules</h2>
        <div className="gc-grid3">
          {otherPaid.map(id => {
            const mod = MODULES[id]; const on = !!m.access[id]; const Ico = MODULE_ICON[id];
            return (
              <article key={id} className={`gc-glass gc-pad gc-stack ${on ? 'gc-glass--primary' : ''}`} style={{ gap: 14, padding: 22 }}>
                <div className="gc-row" style={{ alignItems: 'flex-start' }}>
                  <span className="gc-glass" style={{ width: 48, height: 48, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: on ? undefined : 'inset 0 0 0 2px rgba(215,20,26,0.38)' }}>
                    <Ico size={24} />
                  </span>
                  <SlideToggle on={on} busy={m.busy === id || m.loading} onChange={v => m.toggle(id, v)} />
                </div>
                <div className="gc-stack" style={{ gap: 4 }}>
                  <h3 className="gc-display" style={{ fontSize: 18 }}>{mod.name}</h3>
                  <p className="gc-small" style={{ fontWeight: 600 }}>
                    {money(mod.price)} / month · {m.loading ? '…' : on ? 'active' : 'off'}
                  </p>
                </div>
                <p className="gc-small" style={{ fontSize: 14 }}>{mod.tagline}</p>
                <ul className="gc-list">{mod.bullets.map(b => <li key={b}>{b}</li>)}</ul>
                {on
                  ? <Link href={mod.href} className="gc-btn gc-btn--outline" style={{ marginTop: 'auto' }}>Open</Link>
                  : <button
                      className="gc-btn gc-btn--red"
                      style={{ marginTop: 'auto' }}
                      disabled={m.busy === id}
                      onClick={() => m.toggle(id, true)}
                    >
                      {m.busy === id ? 'One moment…' : `Turn on · ${money(mod.price)}/mo`}
                    </button>
                }
              </article>
            );
          })}
        </div>
      </section>

      {/* Advisory — always free */}
      <section className="gc-stack" style={{ gap: 14 }}>
        <h2 className="gc-h2">Always included</h2>
        <div className="gc-glass gc-glass--pink gc-row" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="gc-glass" style={{ width: 48, height: 48, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gc-red)' }}>
              <AdvisoryIcon size={24} />
            </span>
            <span className="gc-stack" style={{ gap: 2 }}>
              <span className="gc-display" style={{ fontSize: 16, color: 'var(--gc-red)' }}>Advisory</span>
              <span style={{ fontSize: 14 }}>{MODULES.advisory.tagline} Quoted per job.</span>
            </span>
          </div>
          <Link href="/dashboard/advisory" className="gc-btn gc-btn--outline">Ask us something →</Link>
        </div>
      </section>

      {/* Coming soon */}
      <section className="gc-stack" style={{ gap: 14 }}>
        <h2 className="gc-h2">Coming soon</h2>
        <div className="gc-grid3">
          {COMING_SOON.map(c => (
            <article key={c.id} className="gc-glass gc-glass--dashed gc-stack" style={{ padding: 22, gap: 10 }}>
              <h3 className="gc-display" style={{ fontSize: 17 }}>{c.name}</h3>
              <p className="gc-small" style={{ fontSize: 14 }}>{c.tagline}</p>
              <Link href={`/contact?waitlist=${c.id}`} style={{ marginTop: 'auto', alignSelf: 'flex-start', minHeight: 44, display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Join the waitlist →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <p className="gc-note">
        You're charged today when you turn something on, then on the same date each month until you turn it off.
        Stripe handles billing; every change shows on your invoice. Taxes may apply.
      </p>

      {/* Card-on-file confirm modal */}
      <ConfirmModal pending={m.pending} onConfirm={m.confirmToggle} onCancel={m.cancelToggle} />
    </div>
  );
}