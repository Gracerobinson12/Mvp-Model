'use client';
// @ts-nocheck
// app/dashboard/advisory/page.tsx — Advisory inside the app (free). Posts to /api/advisory with the
// user's token so the lead is tied to their account; "Your requests" reads their own leads (RLS).
// The public /advisory page stays for people who aren't signed in.

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useModules } from '@/components/gc/useModules';
import { Header, Icon } from '@/components/gc/ui';

const SERVICES = [
  { key: 'websites',   name: 'Websites',            Ico: Icon.globe,   blurb: 'A site that converts — designed, built, launched on your domain.' },
  { key: 'consulting', name: 'Consulting',          Ico: Icon.compass, blurb: 'What to build, what to skip, what it should cost.' },
  { key: 'tech',       name: 'Tech & automation',   Ico: Icon.gear,    blurb: 'Custom software, integrations, AI workflows that remove manual work.' },
  { key: 'security',   name: 'Security & privacy',  Ico: Icon.shield,  blurb: 'Find where data and secrets leak, fix it, prove you did.' },
];
const LABEL = Object.fromEntries(SERVICES.map(s => [s.key, s.name]));
const BUDGETS = ['Under $1k', '$1k–$5k', '$5k+', 'Not sure'];
const TIMELINES = ['ASAP', 'This month', '1–3 months', 'Exploring'];
const STATUS = { new: 'Received', reviewing: 'Reviewing', quoted: 'Quoted', booked: 'Call booked', closed: 'Closed' };

export default function AdvisoryPage() {
  const m = useModules();
  const [services, setServices] = useState([]);
  const [details, setDetails] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState([]);

  const loadLeads = async () => {
    if (!m.user) return;
    const { data } = await supabase.from('advisory_leads').select('id,created_at,services,details,status').eq('user_id', m.user.id).order('created_at', { ascending: false }).limit(10);
    setLeads(data || []);
  };
  useEffect(() => { loadLeads(); /* eslint-disable-line */ }, [m.user]);

  const toggle = (k) => { setServices(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]); setError(''); };
  const submit = async () => {
    if (!services.length) { setError('Pick at least one service.'); return; }
    if (!details.trim()) { setError('Tell us what is going on.'); return; }
    setSending(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const [first, ...rest] = (m.name || '').split(' ');
      const res = await fetch('/api/advisory', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ first_name: first || 'there', last_name: rest.join(' ') || null, email: m.user?.email, stage: 'live', contact_pref: 'email', services, budget: budget || null, timeline: timeline || null, details: details.trim() }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error();
      setSent(true); setDetails(''); setServices([]); setBudget(''); setTimeline('');
      loadLeads();
    } catch { setError('Could not send that. Email us at intel@gratiacore.com and we will pick it up.'); }
    setSending(false);
  };

  return (
    <div className="gc-wrap">
      <Header back right={<span className="gc-pill gc-glass gc-glass--pink" style={{ borderRadius: 999 }}>Free to ask</span>} />

      <div className="gc-stack">
        <h1 className="gc-h1">Advisory</h1>
        <p className="gc-sub">Real people, not a bot. Tell us the situation; we scope it on a free 20-minute call and quote a fixed price.</p>
      </div>

      <section className="gc-stack" style={{ gap: 12 }}>
        <h2 className="gc-h2">What do you need? <span className="gc-muted" style={{ fontFamily: 'Figtree, sans-serif', fontWeight: 500, fontSize: 14 }}>Pick all that apply</span></h2>
        <div className="gc-grid4">
          {SERVICES.map(({ key, name, Ico, blurb }) => (
            <button key={key} type="button" className="gc-chip gc-chip--solid" aria-pressed={services.includes(key)} onClick={() => toggle(key)}
              style={{ textAlign: 'left', borderRadius: 24, padding: 20, minHeight: 150, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 8, whiteSpace: 'normal' }}>
              <Ico size={26} />
              <span className="gc-display" style={{ fontSize: 16 }}>{name}</span>
              <span style={{ fontSize: 13, lineHeight: 1.45, fontWeight: 500 }}>{blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="gc-two">
        <section className="gc-main gc-glass gc-glass--primary" style={{ padding: '26px 28px', gap: 18 }}>
          <h2 className="gc-h2" style={{ fontSize: 19 }}>Tell us the situation</h2>
          <div>
            <label className="gc-label" htmlFor="adv-details">What’s going on, and what would a win look like?</label>
            <textarea id="adv-details" className="gc-textarea" rows={5} value={details} onChange={e => { setDetails(e.target.value); setError(''); }} placeholder="We sell skincare on Shopify. Orders get re-typed into a spreadsheet by hand, the site is slow… A win: orders flow in automatically." />
          </div>
          <div className="gc-grid2" style={{ gap: 18 }}>
            <div className="gc-stack" style={{ gap: 8 }}>
              <span className="gc-label" style={{ marginBottom: 0 }}>Budget <span className="gc-muted" style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{BUDGETS.map(b => <button key={b} type="button" className="gc-chip" aria-pressed={budget === b} onClick={() => setBudget(budget === b ? '' : b)}>{b}</button>)}</div>
            </div>
            <div className="gc-stack" style={{ gap: 8 }}>
              <span className="gc-label" style={{ marginBottom: 0 }}>Timeline <span className="gc-muted" style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{TIMELINES.map(t => <button key={t} type="button" className="gc-chip" aria-pressed={timeline === t} onClick={() => setTimeline(timeline === t ? '' : t)}>{t}</button>)}</div>
            </div>
          </div>
          {error && <p className="gc-error">{error}</p>}
          {sent && <p className="gc-note" style={{ fontWeight: 600, color: 'var(--gc-red)' }}>Got it. A confirmation is on its way to {m.user?.email}; we reply within 2 business days.</p>}
          <div className="gc-row">
            <span className="gc-small">We’ll reply to <strong style={{ color: 'var(--gc-red)' }}>{m.user?.email || '…'}</strong> within 2 business days.</span>
            <button className="gc-btn gc-btn--red gc-btn--big" disabled={sending} onClick={submit}>{sending ? 'Sending…' : 'Request a quote'} <Icon.arrow size={18} /></button>
          </div>
        </section>

        <aside className="gc-rail">
          <section className="gc-glass gc-pad gc-stack" style={{ gap: 14 }}>
            <h2 className="gc-h2" style={{ fontSize: 16 }}>Your requests</h2>
            {leads.length === 0 && <p className="gc-small">Nothing yet. Your requests and their status show up here.</p>}
            {leads.map((l, i) => (
              <React.Fragment key={l.id}>
                {i > 0 && <div className="gc-divider" />}
                <div className="gc-stack" style={{ gap: 6 }}>
                  <div className="gc-row" style={{ gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{(l.services || []).map(s => LABEL[s] || s).join(', ') || 'Request'}</span>
                    <span className={`gc-tag ${l.status === 'new' || l.status === 'reviewing' ? 'gc-tag--red' : 'gc-tag--pink'}`}>{STATUS[l.status] || 'Received'}</span>
                  </div>
                  <span className="gc-small">Sent {new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {String(l.details || '').slice(0, 90)}{(l.details || '').length > 90 ? '…' : ''}</span>
                </div>
              </React.Fragment>
            ))}
          </section>
          <div className="gc-glass gc-glass--pink gc-pad gc-stack" style={{ gap: 8 }}>
            <span className="gc-h2" style={{ fontSize: 16, color: 'var(--gc-red)' }}>How pricing works</span>
            <p className="gc-small" style={{ fontSize: 14 }}>Free scoping call. Then one fixed quote for the whole job — no hourly surprises. You own everything we build.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
