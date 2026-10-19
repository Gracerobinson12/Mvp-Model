'use client';
// @ts-nocheck
// app/dashboard/account/page.tsx — profile, where you're signed in, billing (Stripe portal + invoices),
// your modules, pause everything, your data.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MODULES, PAID_MODULES, money } from '@/lib/modules';
import { useModules } from '@/components/gc/useModules';
import { Header, Icon, Toggle, fmtDate } from '@/components/gc/ui';

export default function AccountPage() {
  const m = useModules();
  const router = useRouter();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState('');
  const [confirmPause, setConfirmPause] = useState(false);
  const [portalErr, setPortalErr] = useState('');

  useEffect(() => { if (m.profile) setName(m.name); /* eslint-disable-line */ }, [m.profile]);

  const saveProfile = async () => {
    await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', m.user.id);
    setSaved('Saved.'); setTimeout(() => setSaved(''), 2000);
  };
  const openPortal = async () => {
    setPortalErr('');
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/billing/portal', { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
    const j = await res.json();
    if (j.url) window.location.href = j.url; else setPortalErr(j.error || 'Billing portal unavailable right now.');
  };
  const signOut = async () => { await supabase.auth.signOut(); router.replace('/login'); };
  const protectUrl = process.env.NEXT_PUBLIC_PROTECT_URL || '';
  const paused = m.onCount === 0;

  return (
    <div className="gc-wrap">
      <Header back right={<button className="gc-btn gc-btn--outline" onClick={signOut}>Sign out</button>} />

      <div className="gc-stack">
        <h1 className="gc-h1">Account</h1>
        <p className="gc-sub">One login for every Gratia Core module, including GC Protect in its own app.</p>
      </div>

      <div className="gc-two">
        <div className="gc-main" style={{ gap: 20 }}>

          <section className="gc-glass gc-pad gc-stack" style={{ gap: 16, padding: '24px 26px' }}>
            <h2 className="gc-h2">Profile</h2>
            <div className="gc-grid2">
              <div><label className="gc-label" htmlFor="acc-name">Name</label><input id="acc-name" className="gc-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name (goes on certificates)" /></div>
              <div><label className="gc-label" htmlFor="acc-email">Email</label><input id="acc-email" className="gc-input" value={m.user?.email || ''} readOnly /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="gc-btn gc-btn--red" onClick={saveProfile}>Save</button>
              <Link href="/forgot-password" className="gc-btn gc-btn--outline">Change password</Link>
              {saved && <span className="gc-small" style={{ fontWeight: 600 }}>{saved}</span>}
            </div>
          </section>

          <section className="gc-glass gc-pad gc-stack" style={{ gap: 14, padding: '24px 26px' }}>
            <h2 className="gc-h2">Where you’re signed in</h2>
            <div className="gc-glass gc-glass--pink gc-row" style={{ padding: '14px 18px', borderRadius: 20 }}>
              <span className="gc-stack" style={{ gap: 2 }}><span style={{ fontWeight: 700, fontSize: 15, color: 'var(--gc-red)' }}>gratiacore.com</span><span className="gc-small">This device · now</span></span>
              <span className="gc-tag gc-tag--red">Signed in</span>
            </div>
            <div className="gc-glass gc-glass--pink gc-row" style={{ padding: '14px 18px', borderRadius: 20 }}>
              <span className="gc-stack" style={{ gap: 2 }}><span style={{ fontWeight: 700, fontSize: 15, color: 'var(--gc-red)' }}>GC Protect</span><span className="gc-small">Same account, same password{protectUrl ? '' : ' · app launching now'}</span></span>
              {protectUrl ? <a href={protectUrl} className="gc-tag gc-tag--red" style={{ textDecoration: 'none' }}>Open <Icon.external size={12} /></a> : <span className="gc-tag gc-tag--pink">Soon</span>}
            </div>
          </section>

          <section className="gc-glass gc-pad gc-stack" style={{ gap: 14, padding: '24px 26px' }}>
            <h2 className="gc-h2">Billing</h2>
            <div className="gc-row">
              <span className="gc-stack" style={{ gap: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{m.summary?.card ? `${m.summary.card.brand[0].toUpperCase()}${m.summary.card.brand.slice(1)} ending ${m.summary.card.last4}` : 'No card on file yet'}</span>
                <span className="gc-small">{m.summary?.next_invoice ? `Next invoice ${fmtDate(m.summary.next_invoice)} · ${money(m.monthTotal)}` : 'Turn on a paid module to start a bill.'}</span>
              </span>
              <button className="gc-btn gc-btn--outline" onClick={openPortal}>{m.summary?.card ? 'Update card' : 'Billing portal'}</button>
            </div>
            {portalErr && <p className="gc-error">{portalErr}</p>}
            {(m.summary?.invoices || []).length > 0 && <>
              <div className="gc-divider" />
              <div className="gc-stack" style={{ fontSize: 14 }}>
                {m.summary.invoices.map(inv => (
                  <div key={inv.id} className="gc-row">
                    <span>{fmtDate(inv.date)} · {inv.lines.join(', ') || 'Gratia Core'}</span>
                    <span style={{ display: 'flex', gap: 14 }}><span style={{ fontWeight: 700 }}>{money(inv.total)}</span>{inv.url && <a href={inv.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, textDecoration: 'none' }}>PDF</a>}</span>
                  </div>
                ))}
              </div>
            </>}
          </section>
        </div>

        <aside className="gc-rail">
          <section id="pause" className="gc-glass gc-glass--primary gc-pad gc-stack" style={{ gap: 14, padding: '24px 26px' }}>
            <div className="gc-row">
              <span className="gc-stack" style={{ gap: 2 }}>
                <span className="gc-display" style={{ fontSize: 17 }}>Pause everything</span>
                <span className="gc-small">Every module off. Billing stops today.</span>
              </span>
              <Toggle on={paused} busy={m.busy === 'pause' || m.loading} label="Pause all modules" onChange={v => { if (v) setConfirmPause(true); else router.push('/dashboard/modules'); }} />
            </div>
            {confirmPause && !paused && (
              <div className="gc-glass gc-glass--pink gc-stack" style={{ padding: 16, gap: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--gc-red)' }}>Turn off {m.onCount} module{m.onCount > 1 ? 's' : ''} and stop billing now?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="gc-btn gc-btn--red" disabled={m.busy === 'pause'} onClick={async () => { await m.pauseAll(); setConfirmPause(false); }}>{m.busy === 'pause' ? 'Pausing…' : 'Yes, pause everything'}</button>
                  <button className="gc-btn gc-btn--outline" onClick={() => setConfirmPause(false)}>Keep</button>
                </div>
              </div>
            )}
            {m.error && <p className="gc-error">{m.error}</p>}
            <p className="gc-note">Your seals, agreements and requests stay safe and read-only. Turn any module back on whenever you want.</p>
          </section>

          <section className="gc-glass gc-pad gc-stack" style={{ gap: 12, padding: '24px 26px' }}>
            <h2 className="gc-h2" style={{ fontSize: 16 }}>Your modules</h2>
            <div className="gc-stack" style={{ gap: 8, fontSize: 14 }}>
              {PAID_MODULES.map(id => <div key={id} className="gc-row" style={{ color: m.access[id] ? undefined : 'var(--gc-red-dark)' }}><span style={{ fontWeight: m.access[id] ? 600 : 400 }}>{MODULES[id].name}</span><span>{m.access[id] ? `on · ${money(MODULES[id].price)}` : 'off'}</span></div>)}
              <div className="gc-row gc-muted"><span>Advisory</span><span>free</span></div>
            </div>
            <Link href="/dashboard/modules" style={{ alignSelf: 'flex-start', minHeight: 44, display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Add or change →</Link>
          </section>

          <section className="gc-glass gc-pad gc-stack" style={{ gap: 10, padding: '24px 26px' }}>
            <h2 className="gc-h2" style={{ fontSize: 16 }}>Your data</h2>
            <p className="gc-small">Want a copy of everything, or your account deleted? Email <a href="mailto:intel@gratiacore.com">intel@gratiacore.com</a> from this address and we do it within 7 days.</p>
            <Link href="/privacy" style={{ fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Privacy Policy →</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}