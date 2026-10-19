'use client';
// @ts-nocheck
// app/dashboard/page.tsx — Home: the bubbles. On = red glass, off = clear glass with a ring,
// free = pink glass, dashed = add. Right rail: this month's bill, what needs you, pause everything.

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MODULES, PAID_MODULES, money } from '@/lib/modules';
import { useModules } from '@/components/gc/useModules';
import { Header, Icon, MODULE_ICON } from '@/components/gc/ui';

// bubble positions as % of a 720×560 stage (scales to phones)
const POS = {
  protect:  { left: '0%',    top: '0%',    width: '33.3%' },
  vault:    { left: '40.3%', top: '6.4%',  width: '29.2%' },
  add:      { left: '77.8%', top: '19.6%', width: '15.3%' },
  barter:   { left: '9.7%',  top: '51.8%', width: '29.2%' },
  advisory: { left: '45.8%', top: '53.6%', width: '30.5%' },
};

export default function Page() {
  return <Suspense fallback={<div className="gc-wrap" />}><HomePage /></Suspense>;
}

function HomePage() {
  const m = useModules();
  const sp = useSearchParams();
  const [counts, setCounts] = useState({ sealed: 0, drafts: 0, waiting: 0 });

  // module-specific little facts for the bubble subtitles and "needs you"
  useEffect(() => {
    if (!m.user) return;
    (async () => {
      const [v, b] = await Promise.all([
        supabase.from('vault_ideas').select('status').eq('user_id', m.user.id).is('deleted_at', null),
        supabase.from('barter_agreements').select('status').eq('user_id', m.user.id).is('deleted_at', null),
      ]);
      const ideas = v.data || [], ags = b.data || [];
      setCounts({
        sealed: ideas.filter(i => i.status === 'sealed').length,
        drafts: ideas.filter(i => i.status === 'draft').length,
        waiting: ags.filter(a => a.status === 'sent').length,
      });
    })();
  }, [m.user]);

  // came back from Stripe Checkout? refresh once so the bubble turns red
  useEffect(() => { if (sp.get('on')) m.reload(); /* eslint-disable-line */ }, [sp]);

  const sub = (id) => {
    const on = m.access[id];
    if (MODULES[id].price === 0) return 'Free to ask';
    if (!on) return `Off · ${money(MODULES[id].price)}/mo`;
    if (id === 'protect') return 'Tokens on';
    if (id === 'vault') return counts.sealed === 1 ? '1 sealed' : `${counts.sealed} sealed`;
    if (id === 'barter') return counts.waiting ? `${counts.waiting} waiting on them` : 'On';
    return 'On';
  };
  const cls = (id) => MODULES[id].price === 0 ? 'gc-bubble--free' : (m.access[id] ? 'gc-bubble--on' : 'gc-bubble--off');

  const needs = [];
  if (m.access.vault && counts.drafts) needs.push({ href: '/dashboard/vault', t: `${counts.drafts} draft${counts.drafts > 1 ? 's' : ''} not sealed yet`, s: 'Idea Vault · seal to lock the timestamp', a: 'Seal →' });
  if (m.access.barter && counts.waiting) needs.push({ href: '/dashboard/barter', t: `${counts.waiting} agreement${counts.waiting > 1 ? 's' : ''} waiting on the other person`, s: 'Barter · resend or copy the link', a: 'Open →' });

  const nextInvoice = m.summary?.next_invoice ? new Date(m.summary.next_invoice).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

  return (
    <div className="gc-wrap">
      <Header right={
        <Link href="/dashboard/modules" className="gc-pill gc-glass gc-glass--pink" style={{ borderRadius: 999 }}>
          <span className="gc-dot" /> This month · {money(m.monthTotal)}
        </Link>
      } />

      <div className="gc-stack">
        <h1 className="gc-display" style={{ fontSize: 'clamp(30px, 5vw, 40px)', fontWeight: 500, lineHeight: 1.12 }}>Your tools.<br />Your rules.</h1>
        <p className="gc-sub">Tap a bubble to open a module. Turn one off and you stop paying for it that day.</p>
      </div>

      <div className="gc-two" style={{ gap: 48 }}>
        <nav aria-label="Modules" className="gc-stage">
          <div className="gc-orb" style={{ left: '12%', top: '7%', width: '58%', height: '75%', background: 'radial-gradient(circle at 45% 40%, rgba(215,20,26,0.38), rgba(215,20,26,0) 70%)' }} />
          <div className="gc-orb" style={{ left: '50%', top: '45%', width: '50%', height: '64%', background: 'radial-gradient(circle at 50% 50%, rgba(255,120,126,0.42), rgba(255,120,126,0) 70%)' }} />

          {(['protect', 'vault', 'barter', 'advisory']).map(id => {
            const Ico = MODULE_ICON[id];
            return (
              <Link key={id} href={MODULES[id].href} className={`gc-bubble ${cls(id)}`} style={POS[id]}>
                <Ico />
                <span className="gc-bubble-name">{MODULES[id].name}</span>
                <span className="gc-bubble-sub">{m.loading ? '…' : sub(id)}</span>
              </Link>
            );
          })}
          <Link href="/dashboard/modules" aria-label="Add a module" className="gc-bubble gc-bubble--add" style={POS.add}>
            <Icon.plus /><span className="gc-bubble-sub" style={{ fontWeight: 600 }}>Add</span>
          </Link>
        </nav>

        <aside className="gc-rail">
          <section className="gc-glass gc-glass--primary gc-pad gc-stack" style={{ gap: 14 }}>
            <div className="gc-row">
              <h2 className="gc-h2" style={{ fontSize: 17 }}>This month</h2>
              <span className="gc-small">{nextInvoice ? `Billed ${nextInvoice}` : 'Nothing billed yet'}</span>
            </div>
            <div className="gc-stack" style={{ fontSize: 15 }}>
              {PAID_MODULES.map(id => (
                <div key={id} className="gc-row" style={{ color: m.access[id] ? undefined : 'var(--gc-red-dark)' }}>
                  <span style={{ fontWeight: m.access[id] ? 600 : 400 }}>{MODULES[id].name}</span>
                  <span>{m.access[id] ? money(MODULES[id].price) : 'off'}</span>
                </div>
              ))}
              <div className="gc-row gc-muted"><span>Advisory</span><span>free</span></div>
              <div className="gc-divider" />
              <div className="gc-row" style={{ fontWeight: 700, fontSize: 17 }}><span>Total</span><span>{money(m.monthTotal)}</span></div>
            </div>
            <p className="gc-note">Turn a module off any day and the rest of the month comes off your bill.</p>
            <Link href="/dashboard/modules" className="gc-btn gc-btn--red gc-btn--block" style={{ minHeight: 48 }}>Add or change modules <Icon.arrow size={18} /></Link>
          </section>

          <section className="gc-glass gc-pad gc-stack" style={{ gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="gc-dot" />
              <h2 className="gc-h2" style={{ fontSize: 17 }}>{needs.length ? `${needs.length} thing${needs.length > 1 ? 's' : ''} need${needs.length > 1 ? '' : 's'} you` : 'Nothing needs you'}</h2>
            </div>
            {needs.length === 0 && <p className="gc-note">All caught up. Open a bubble to get going.</p>}
            {needs.map((n, i) => (
              <React.Fragment key={n.href}>
                {i > 0 && <div className="gc-divider" />}
                <Link href={n.href} className="gc-row" style={{ textDecoration: 'none', minHeight: 44 }}>
                  <span className="gc-stack" style={{ gap: 2 }}><span style={{ fontWeight: 600, fontSize: 15 }}>{n.t}</span><span className="gc-small">{n.s}</span></span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{n.a}</span>
                </Link>
              </React.Fragment>
            ))}
          </section>

          <Link href="/dashboard/account#pause" className="gc-glass gc-row" style={{ textDecoration: 'none', minHeight: 64, padding: '12px 12px 12px 20px', borderRadius: 32, boxShadow: 'inset 0 0 0 2px rgba(215,20,26,0.38), inset 0 1px 0 rgba(255,255,255,0.95), 0 12px 36px rgba(215,20,26,0.10)' }}>
            <span className="gc-stack" style={{ gap: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Pause everything</span>
              <span className="gc-small">Turn every module off at once. Billing stops today.</span>
            </span>
            <span className="gc-glass gc-glass--red" style={{ width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon.power size={20} /></span>
          </Link>
        </aside>
      </div>
    </div>
  );
}