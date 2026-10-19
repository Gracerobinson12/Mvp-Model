'use client';
// @ts-nocheck
// app/dashboard/modules/page.tsx — Add what you need. Toggle a module on/off; billing follows.

import React, { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MODULES, MODULE_ORDER, PAID_MODULES, COMING_SOON, money } from '@/lib/modules';
import { useModules } from '@/components/gc/useModules';
import { Header, Icon, MODULE_ICON, Toggle } from '@/components/gc/ui';

export default function Page() {
  return <Suspense fallback={<div className="gc-wrap" />}><ModulesPage /></Suspense>;
}

function ModulesPage() {
  const m = useModules();
  const sp = useSearchParams();
  const fired = useRef(false);
  // /dashboard/modules?start=vault (from pricing/signup) → open that module's turn-on right away
  useEffect(() => {
    const start = sp.get('start');
    if (!start || fired.current || m.loading || !(start in MODULES)) return;
    fired.current = true;
    if (!m.access[start] && MODULES[start].price > 0) m.toggle(start, true);
  }, [sp, m.loading]); // eslint-disable-line
  const onNames = PAID_MODULES.filter(id => m.access[id]).map(id => MODULES[id].name).join(', ');
  const nextInvoice = m.summary?.next_invoice ? new Date(m.summary.next_invoice).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

  return (
    <div className="gc-wrap">
      <Header back />

      <div className="gc-stack">
        <h1 className="gc-h1">Add what you need.</h1>
        <p className="gc-sub">Turn a module on and it joins your next invoice, prorated from today. Turn it off and you stop paying that day. One bill a month, no plans, no bundles.</p>
      </div>

      <div className="gc-glass gc-glass--pink gc-row" style={{ padding: '16px 20px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, flexWrap: 'wrap' }}>
          <span className="gc-dot" />
          <strong style={{ color: 'var(--gc-red)' }}>This month: {money(m.monthTotal)}</strong>
          {onNames ? ` · ${onNames}` : ' · nothing on yet'}{nextInvoice ? ` · next invoice ${nextInvoice}` : ''}
        </span>
        <Link href="/dashboard/account" style={{ fontSize: 14, fontWeight: 700, textDecoration: 'none', minHeight: 44, display: 'flex', alignItems: 'center' }}>Billing &amp; invoices →</Link>
      </div>

      {m.error && <p className="gc-error">{m.error}</p>}

      <section className="gc-stack" style={{ gap: 14 }}>
        <h2 className="gc-h2">Available now</h2>
        <div className="gc-grid3">
          {PAID_MODULES.map(id => {
            const mod = MODULES[id]; const on = !!m.access[id]; const Ico = MODULE_ICON[id];
            return (
              <article key={id} className={`gc-glass gc-pad gc-stack ${on ? 'gc-glass--primary' : ''}`} style={{ gap: 14, padding: 22 }}>
                <div className="gc-row" style={{ alignItems: 'flex-start' }}>
                  <span className={`gc-glass ${on ? 'gc-glass--red' : ''}`} style={{ width: 48, height: 48, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: on ? undefined : 'inset 0 0 0 2px rgba(215,20,26,0.38)' }}><Ico size={24} /></span>
                  <Toggle on={on} busy={m.busy === id || m.loading} label={`${mod.name} is ${on ? 'on' : 'off'}. Tap to turn ${on ? 'off' : 'on'}.`} onChange={v => m.toggle(id, v)} />
                </div>
                <div className="gc-stack" style={{ gap: 4 }}>
                  <h3 className="gc-display" style={{ fontSize: 18 }}>{mod.name}</h3>
                  <p className="gc-small" style={{ fontWeight: 600 }}>{money(mod.price)} / month · {m.loading ? '…' : on ? 'on' : 'off'}</p>
                </div>
                <p className="gc-small" style={{ fontSize: 14 }}>{mod.tagline}</p>
                <ul className="gc-list">{mod.bullets.map(b => <li key={b}>{b}</li>)}</ul>
                {on
                  ? <Link href={mod.href} className="gc-btn gc-btn--outline" style={{ marginTop: 'auto' }}>Open</Link>
                  : <button className="gc-btn gc-btn--red" style={{ marginTop: 'auto' }} disabled={m.busy === id} onClick={() => m.toggle(id, true)}>{m.busy === id ? 'One moment…' : `Turn on · ${money(mod.price)}/mo`}</button>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="gc-stack" style={{ gap: 14 }}>
        <h2 className="gc-h2">Always included</h2>
        <div className="gc-glass gc-glass--pink gc-row" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="gc-glass" style={{ width: 48, height: 48, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gc-red)' }}><Icon.advisory size={24} /></span>
            <span className="gc-stack" style={{ gap: 2 }}>
              <span className="gc-display" style={{ fontSize: 16, color: 'var(--gc-red)' }}>Advisory</span>
              <span style={{ fontSize: 14 }}>{MODULES.advisory.tagline} Quoted per job.</span>
            </span>
          </div>
          <Link href="/dashboard/advisory" className="gc-btn gc-btn--outline">Ask us something →</Link>
        </div>
      </section>

      <section className="gc-stack" style={{ gap: 14 }}>
        <h2 className="gc-h2">Coming soon</h2>
        <div className="gc-grid3">
          {COMING_SOON.map(c => (
            <article key={c.id} className="gc-glass gc-glass--dashed gc-stack" style={{ padding: 22, gap: 10 }}>
              <h3 className="gc-display" style={{ fontSize: 17 }}>{c.name}</h3>
              <p className="gc-small" style={{ fontSize: 14 }}>{c.tagline}</p>
              <Link href={`/contact?waitlist=${c.id}`} style={{ marginTop: 'auto', alignSelf: 'flex-start', minHeight: 44, display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Join the waitlist →</Link>
            </article>
          ))}
        </div>
      </section>

      <p className="gc-note">Proration is handled by Stripe; every change shows on your invoice. Taxes may apply depending on where you are.</p>
    </div>
  );
}