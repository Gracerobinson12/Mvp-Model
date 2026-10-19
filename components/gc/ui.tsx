'use client';
// @ts-nocheck
// components/gc/ui.tsx — shared pieces for the bubble app: header, icons, toggle, module gate, modal.

import React from 'react';
import Link from 'next/link';
import { MODULES, money } from '@/lib/modules';

/* ── icons (inline stroke SVG, never emoji) ── */
const I = ({ children, size = 24, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>{children}</svg>
);
export const Icon = {
  shield:   (p) => <I {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></I>,
  vault:    (p) => <I {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></I>,
  barter:   (p) => <I {...p}><path d="M4 8h13l-3-3" /><path d="M20 16H7l3 3" /></I>,
  advisory: (p) => <I {...p}><path d="M4 5h16v11H9l-5 4z" /></I>,
  plus:     (p) => <I {...p}><path d="M12 5v14M5 12h14" /></I>,
  user:     (p) => <I {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></I>,
  power:    (p) => <I {...p}><path d="M12 3v9" /><path d="M6.3 6.3a8 8 0 1 0 11.4 0" /></I>,
  arrow:    (p) => <I {...p}><path d="M5 12h14M13 6l6 6-6 6" /></I>,
  back:     (p) => <I {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></I>,
  download: (p) => <I {...p}><path d="M12 3v12M6 11l6 6 6-6M4 21h16" /></I>,
  external: (p) => <I {...p}><path d="M14 4h6v6M20 4l-9 9M19 14v6H5V6h6" /></I>,
  check:    (p) => <I {...p}><path d="M5 12l5 5 9-11" /></I>,
  close:    (p) => <I {...p}><path d="M6 6l12 12M18 6L6 18" /></I>,
  mail:     (p) => <I {...p}><path d="M3 6h18v12H3z" /><path d="M3 7l9 6 9-6" /></I>,
  bulb:     (p) => <I {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.5h6c0-1.2.4-1.9 1-2.5A6 6 0 0 0 12 3z" /></I>,
  globe:    (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></I>,
  compass:  (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-2 6-4 2 2-6z" /></I>,
  gear:     (p) => <I {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></I>,
};
export const MODULE_ICON = { protect: Icon.shield, vault: Icon.vault, barter: Icon.barter, advisory: Icon.advisory };

export function GCMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#D7141A" />
      <text x="16" y="21" fontFamily="Unbounded, sans-serif" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">GC</text>
    </svg>
  );
}

/* ── header: logo (or back link) · right side ── */
export function Header({ back = false, right = null }) {
  return (
    <header className="gc-row" style={{ minHeight: 48 }}>
      {back ? (
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
          <Icon.back size={20} /> Gratia Core
        </Link>
      ) : (
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <GCMark /><span className="gc-display" style={{ fontSize: 19 }}>Gratia Core</span>
        </Link>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {right}
        <Link href="/dashboard/account" aria-label="Account" className="gc-btn gc-btn--outline gc-icon-btn"><Icon.user size={22} /></Link>
      </div>
    </header>
  );
}

export function Toggle({ on, onChange, busy = false, label }) {
  return (
    <button type="button" className="gc-toggle" aria-pressed={on ? 'true' : 'false'} aria-label={label} disabled={busy} onClick={() => onChange(!on)}>
      <span><i /></span>
    </button>
  );
}

export function Modal({ onClose, children, maxWidth = 560 }) {
  return (
    <div className="gc-modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gc-glass gc-modal" style={{ maxWidth }}>
        <button type="button" onClick={onClose} aria-label="Close" className="gc-btn gc-btn--outline gc-icon-btn gc-close"><Icon.close size={18} /></button>
        {children}
      </div>
    </div>
  );
}

/* ── module gate: wraps a module page; if the module is off, shows the turn-on card instead ── */
export function ModuleGate({ id, state, onTurnOn, busy, children }) {
  const m = MODULES[id];
  if (state === 'loading') return <div style={{ padding: 60, textAlign: 'center' }} className="gc-muted">Loading…</div>;
  if (state === 'on' || m.price === 0) return children;
  const Ico = MODULE_ICON[id];
  return (
    <div className="gc-glass gc-glass--primary gc-pad gc-fade" style={{ maxWidth: 560, margin: '24px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <span className="gc-glass gc-glass--red" style={{ width: 64, height: 64, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico size={30} /></span>
      <h2 className="gc-display" style={{ fontSize: 24 }}>{m.name} is off</h2>
      <p className="gc-sub" style={{ fontSize: 15 }}>{m.tagline}</p>
      <ul className="gc-list" style={{ textAlign: 'left' }}>{m.bullets.map(b => <li key={b}>{b}</li>)}</ul>
      <button className="gc-btn gc-btn--red gc-btn--big" disabled={busy} onClick={onTurnOn}>{busy ? 'One moment…' : `Turn on · ${money(m.price)}/mo`}</button>
      <p className="gc-note">Prorated from today. Turn it off any day and the rest of the month comes off your bill.</p>
      <Link href="/dashboard" style={{ fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>← Back to your bubbles</Link>
    </div>
  );
}

export const fmtDate = (d, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => d ? new Date(d).toLocaleDateString('en-US', opts) : '';