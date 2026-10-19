'use client';
// @ts-nocheck
// app/dashboard/protect/page.tsx — GC Protect bubble. Protect runs in its own app on its own domain
// (same Supabase project = same login). This page: on/off + what it does + open it.
// Env: NEXT_PUBLIC_PROTECT_URL (e.g. https://protect.gratiacore.com). Until it's set, the button says so.

import React from 'react';
import { useModules } from '@/components/gc/useModules';
import { Header, Icon, ModuleGate, Toggle } from '@/components/gc/ui';

const CAUGHT = ['Names', 'SSNs & IDs', 'Emails', 'Phone numbers', 'Credit cards', 'API keys', 'GitHub tokens', 'AWS keys', 'Passwords', 'Database strings'];

export default function ProtectPage() {
  const m = useModules();
  const url = process.env.NEXT_PUBLIC_PROTECT_URL || '';
  const on = !!m.access.protect;

  return (
    <div className="gc-wrap">
      <Header back right={<span className="gc-pill gc-glass gc-glass--pink" style={{ borderRadius: 999 }}><span className="gc-dot" />{m.loading ? '…' : on ? 'On · $9/mo' : 'Off'}</span>} />

      <ModuleGate id="protect" state={m.stateOf('protect')} busy={m.busy === 'protect'} onTurnOn={() => m.toggle('protect', true)}>
        <div className="gc-stack">
          <h1 className="gc-h1">GC Protect</h1>
          <p className="gc-sub">Sensitive details become tokens before any AI sees them. You keep the real values; the AI only ever gets placeholders.</p>
        </div>

        <div className="gc-two">
          <div className="gc-main">
            <div className="gc-glass gc-glass--pink gc-row" style={{ padding: '18px 18px 18px 24px' }}>
              <span className="gc-stack" style={{ gap: 2 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--gc-red)' }}>Protection {on ? 'on' : 'off'}</span>
                <span className="gc-small">{on ? 'Tokens are made on every prompt across your account.' : 'Turn on to start tokenizing.'}</span>
              </span>
              <Toggle on={on} busy={m.busy === 'protect'} label={`Protection ${on ? 'on' : 'off'}`} onChange={v => m.toggle('protect', v)} />
            </div>
            {m.error && <p className="gc-error">{m.error}</p>}

            <section className="gc-stack" style={{ gap: 12 }}>
              <h2 className="gc-h2">How it works</h2>
              <div className="gc-grid3" style={{ gap: 12 }}>
                <div className="gc-glass gc-stack" style={{ padding: '16px 18px', gap: 8, borderRadius: 20 }}>
                  <span className="gc-label" style={{ marginBottom: 0 }}>You type</span>
                  <span className="gc-mono" style={{ lineHeight: 1.55 }}>Customer: Jane Doe<br />SSN: 123-45-6789<br />key: sk_live_4e…</span>
                </div>
                <div className="gc-glass gc-glass--red gc-stack" style={{ padding: '16px 18px', gap: 8, borderRadius: 20 }}>
                  <span className="gc-label" style={{ marginBottom: 0 }}>AI sees</span>
                  <span className="gc-mono" style={{ lineHeight: 1.55, color: '#fff' }}>Customer: GC-C9K2P4M<br />SSN: GC-IDX8R2Q1<br />key: GC-SECRET-01</span>
                </div>
                <div className="gc-glass gc-stack" style={{ padding: '16px 18px', gap: 8, borderRadius: 20 }}>
                  <span className="gc-label" style={{ marginBottom: 0 }}>You read</span>
                  <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--gc-red-deep)' }}>“Dear Jane Doe, thank you for your order…” — real values put back, only on your screen.</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="gc-rail">
            {url
              ? <a href={url} className="gc-btn gc-btn--red gc-btn--big gc-btn--block" style={{ minHeight: 56 }}>Open GC Protect <Icon.external size={18} /></a>
              : <span className="gc-btn gc-btn--outline gc-btn--big gc-btn--block" style={{ minHeight: 56, opacity: .7 }}>GC Protect app · launching now</span>}
            <p className="gc-note" style={{ textAlign: 'center' }}>Opens in its own app. Same account — you’re already signed in.</p>
            <div className="gc-glass gc-pad gc-stack" style={{ gap: 12 }}>
              <span className="gc-h2" style={{ fontSize: 16 }}>What gets caught</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CAUGHT.map(c => <span key={c} className="gc-tag gc-tag--pink" style={{ fontWeight: 600, padding: '8px 14px' }}>{c}</span>)}
              </div>
            </div>
          </aside>
        </div>
      </ModuleGate>
    </div>
  );
}