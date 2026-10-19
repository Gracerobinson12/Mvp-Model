'use client';
// @ts-nocheck
// app/dashboard/barter/page.tsx — Barter in the bubble look. Same data (barter_agreements),
// same routes (/api/barter/send, /api/barter/confirm). Edit & resend, delivery tracking kept.

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useModules } from '@/components/gc/useModules';
import { Header, Icon, Modal, ModuleGate, fmtDate } from '@/components/gc/ui';

const STATUS = {
  draft: 'Draft', sent: 'Waiting for them', confirmed: 'Confirmed', completed: 'Done', declined: 'Declined',
};

function AgreementModal({ onClose, onSaved, existing }) {
  const isEdit = !!existing;
  const [f, setF] = useState({
    title: existing?.title || '', counterparty_name: existing?.counterparty_name || '', counterparty_email: existing?.counterparty_email || '',
    you_deliver: existing?.you_deliver || '', you_deliver_value: existing?.you_deliver_value ? String(existing.you_deliver_value) : '',
    they_deliver: existing?.they_deliver || '', they_deliver_value: existing?.they_deliver_value ? String(existing.they_deliver_value) : '',
    due_date: existing?.due_date || '', notes: existing?.notes || '',
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const complete = f.title && f.counterparty_name && f.you_deliver && f.they_deliver;

  const save = async () => {
    if (!complete) { setError('Title, their name, and both sides of the trade are required.'); return; }
    setLoading(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error();
      const fields = {
        title: f.title, counterparty_name: f.counterparty_name, counterparty_email: f.counterparty_email || null,
        you_deliver: f.you_deliver, they_deliver: f.they_deliver,
        you_deliver_value: parseFloat(f.you_deliver_value) || 0, they_deliver_value: parseFloat(f.they_deliver_value) || 0,
        due_date: f.due_date || null, notes: f.notes || null,
      };
      let q = isEdit
        ? supabase.from('barter_agreements').update({ ...fields, status: 'draft', confirm_token: null, token_expires_at: null }).eq('id', existing.id)
        : supabase.from('barter_agreements').insert({ user_id: user.id, ...fields, status: 'draft', you_delivered: false, they_delivered: false });
      const { data, error: dbErr } = await q.select().single();
      if (dbErr) throw dbErr;
      onSaved(data); onClose();
    } catch { setError('Could not save that. Try again in a moment.'); setLoading(false); }
  };

  return (
    <Modal onClose={onClose}>
      <span className="gc-label">{isEdit ? 'Edit agreement' : 'New agreement'}</span>
      <h2 className="gc-display" style={{ fontSize: 22 }}>{isEdit ? 'Update the trade' : 'Write the trade down'}</h2>
      <p className="gc-small">Both sides, clear terms, timestamped. {isEdit ? 'Saving puts it back to draft so you can resend the new terms.' : 'Then send it to them to confirm.'}</p>
      <div><label className="gc-label" htmlFor="ba-title">Trade title</label><input id="ba-title" className="gc-input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Logo + brand kit ⇄ 3 months of bookkeeping" /></div>
      <div className="gc-grid2">
        <div><label className="gc-label" htmlFor="ba-name">Their name</label><input id="ba-name" className="gc-input" value={f.counterparty_name} onChange={e => set('counterparty_name', e.target.value)} placeholder="Full name" /></div>
        <div><label className="gc-label" htmlFor="ba-email">Their email <span className="gc-muted" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>(to send the confirm link)</span></label><input id="ba-email" type="email" className="gc-input" value={f.counterparty_email} onChange={e => set('counterparty_email', e.target.value)} placeholder="them@example.com" /></div>
      </div>
      <div className="gc-glass gc-glass--pink" style={{ padding: 16 }}>
        <label className="gc-label" htmlFor="ba-you" style={{ color: 'var(--gc-red)' }}>You deliver</label>
        <textarea id="ba-you" className="gc-textarea" rows={2} value={f.you_deliver} onChange={e => set('you_deliver', e.target.value)} placeholder="e.g. 3 logo concepts + unlimited revisions" />
        <input className="gc-input" style={{ marginTop: 8, minHeight: 42 }} type="number" value={f.you_deliver_value} onChange={e => set('you_deliver_value', e.target.value)} placeholder="Estimated value in $ (optional)" />
      </div>
      <div className="gc-glass" style={{ padding: 16 }}>
        <label className="gc-label" htmlFor="ba-them">They deliver</label>
        <textarea id="ba-them" className="gc-textarea" rows={2} value={f.they_deliver} onChange={e => set('they_deliver', e.target.value)} placeholder="e.g. Monthly books through January" />
        <input className="gc-input" style={{ marginTop: 8, minHeight: 42 }} type="number" value={f.they_deliver_value} onChange={e => set('they_deliver_value', e.target.value)} placeholder="Estimated value in $ (optional)" />
      </div>
      <div className="gc-grid2">
        <div><label className="gc-label" htmlFor="ba-due">Due date <span className="gc-muted" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>(optional)</span></label><input id="ba-due" type="date" className="gc-input" value={f.due_date} onChange={e => set('due_date', e.target.value)} /></div>
        <div><label className="gc-label" htmlFor="ba-notes">Notes <span className="gc-muted" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>(optional)</span></label><input id="ba-notes" className="gc-input" value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Anything both of you should know" /></div>
      </div>
      {error && <p className="gc-error">{error}</p>}
      <button className="gc-btn gc-btn--red gc-btn--big gc-btn--block" disabled={loading} onClick={save}>{loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create agreement'}</button>
    </Modal>
  );
}

function AgreementCard({ ag, onUpdate, onEdit }) {
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');
  const confirmed = ag.status === 'confirmed' || ag.status === 'completed';
  const primary = ag.status === 'sent' || ag.status === 'confirmed';

  const send = async () => {
    setSending(true); setNote('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/barter/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` }, body: JSON.stringify({ agreementId: ag.id }) });
      const data = await res.json();
      if (!data.ok) throw new Error();
      onUpdate(data.agreement);
      if (data.confirm_url) await navigator.clipboard?.writeText(data.confirm_url).catch(() => {});
      setNote(data.emailed === false ? `The email did not go out — the confirm link is on your clipboard, paste it to ${ag.counterparty_name}.` : `Sent to ${ag.counterparty_email}. The link is also on your clipboard.`);
    } catch { setNote('Could not send right now. Try again in a moment.'); }
    setSending(false);
  };
  const copyLink = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/barter/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` }, body: JSON.stringify({ agreementId: ag.id, linkOnly: true }) }).catch(() => null);
    const data = res ? await res.json() : null;
    if (data?.confirm_url) { await navigator.clipboard?.writeText(data.confirm_url).catch(() => {}); if (data.agreement) onUpdate(data.agreement); setNote('Confirm link copied.'); }
    else setNote('Could not make a link right now.');
  };
  const markDelivered = async (side) => {
    const field = side === 'you' ? 'you_delivered' : 'they_delivered';
    const newVal = !ag[field];
    const bothDone = side === 'you' ? (newVal && ag.they_delivered) : (ag.you_delivered && newVal);
    const updates = { [field]: newVal };
    if (bothDone) { updates.status = 'completed'; updates.completed_at = new Date().toISOString(); }
    const { data } = await supabase.from('barter_agreements').update(updates).eq('id', ag.id).select().single();
    if (data) onUpdate(data);
  };

  return (
    <article className={`gc-glass gc-pad gc-stack gc-fade ${primary ? 'gc-glass--primary' : ''}`} style={{ gap: 14 }}>
      <div className="gc-row" style={{ alignItems: 'flex-start' }}>
        <div className="gc-stack" style={{ gap: 6 }}>
          <span className="gc-display" style={{ fontSize: 18 }}>{ag.title}</span>
          <span className="gc-small">You give: {ag.you_deliver}{ag.you_deliver_value > 0 ? ` (~$${Number(ag.you_deliver_value).toLocaleString()})` : ''} · They give: {ag.they_deliver}{ag.they_deliver_value > 0 ? ` (~$${Number(ag.they_deliver_value).toLocaleString()})` : ''}</span>
          <span className="gc-small">With {ag.counterparty_name}{ag.due_date ? ` · due ${fmtDate(ag.due_date)}` : ''}{ag.confirmed_at ? ` · both confirmed ${fmtDate(ag.confirmed_at)}` : ''}</span>
          {ag.notes && <span className="gc-small">Notes: {ag.notes}</span>}
        </div>
        <span className={`gc-tag ${ag.status === 'sent' ? 'gc-tag--red' : 'gc-tag--pink'}`}>{confirmed && <Icon.check size={12} />}{ag.status === 'sent' ? `Waiting for ${ag.counterparty_name} to confirm` : STATUS[ag.status] || ag.status}</span>
      </div>

      {(ag.status === 'draft' || ag.status === 'sent') && (
        <div className="gc-row" style={{ paddingTop: 14, borderTop: '1px solid var(--gc-line)' }}>
          <span className="gc-small" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon.mail size={18} />
            {ag.status === 'sent' && ag.counterparty_email ? <>Sent to <strong style={{ color: 'var(--gc-red)' }}>{ag.counterparty_email}</strong>{ag.sent_at ? ` · ${fmtDate(ag.sent_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}</> : ag.counterparty_email ? `Will be sent to ${ag.counterparty_email}` : 'Add their email to send it'}
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="gc-btn gc-btn--outline" onClick={() => onEdit(ag)}>Edit</button>
            <button className="gc-btn gc-btn--outline" onClick={copyLink}>Copy link</button>
            <button className="gc-btn gc-btn--red" disabled={sending || !ag.counterparty_email} onClick={send}>{sending ? 'Sending…' : ag.status === 'sent' ? 'Resend' : 'Send to confirm'}</button>
          </div>
        </div>
      )}

      {confirmed && ag.status !== 'completed' && (
        <div className="gc-row" style={{ paddingTop: 14, borderTop: '1px solid var(--gc-line)' }}>
          <span className="gc-small">Agreement emailed to both of you. Mark each side done as it happens.</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className={`gc-btn ${ag.you_delivered ? 'gc-btn--outline' : 'gc-btn--red'}`} onClick={() => markDelivered('you')}>{ag.you_delivered ? '✓ Mine done' : 'Mark mine done'}</button>
            <button className={`gc-btn ${ag.they_delivered ? 'gc-btn--outline' : 'gc-btn--red'}`} onClick={() => markDelivered('them')}>{ag.they_delivered ? '✓ Theirs received' : 'Mark theirs received'}</button>
          </div>
        </div>
      )}
      {ag.status === 'completed' && <span className="gc-small" style={{ paddingTop: 14, borderTop: '1px solid var(--gc-line)' }}>Completed {fmtDate(ag.completed_at)}.</span>}
      {note && <p className="gc-note" style={{ fontWeight: 600 }}>{note}</p>}
    </article>
  );
}

export default function BarterPage() {
  const m = useModules();
  const [ags, setAgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!m.user) return;
    supabase.from('barter_agreements').select('*').eq('user_id', m.user.id).is('deleted_at', null).order('created_at', { ascending: false })
      .then(({ data }) => { setAgs(data || []); setLoading(false); });
  }, [m.user]);

  const waiting = ags.filter(a => a.status === 'sent').length;
  const confirmed = ags.filter(a => a.status === 'confirmed' || a.status === 'completed').length;
  const value = ags.filter(a => a.status === 'confirmed' || a.status === 'completed').reduce((s, a) => s + (Number(a.you_deliver_value) || 0) + (Number(a.they_deliver_value) || 0), 0);
  const upd = (u) => setAgs(p => p.map(x => x.id === u.id ? u : x));

  return (
    <div className="gc-wrap">
      <Header back right={<span className="gc-pill gc-glass gc-glass--pink" style={{ borderRadius: 999 }}><span className="gc-dot" />{m.loading ? '…' : m.access.barter ? 'On · $5/mo' : 'Off'}</span>} />

      <ModuleGate id="barter" state={m.stateOf('barter')} busy={m.busy === 'barter'} onTurnOn={() => m.toggle('barter', true)}>
        {showNew && <AgreementModal onClose={() => setShowNew(false)} onSaved={a => setAgs(p => [a, ...p])} />}
        {editing && <AgreementModal existing={editing} onClose={() => setEditing(null)} onSaved={upd} />}

        <div className="gc-row" style={{ alignItems: 'flex-end' }}>
          <div className="gc-stack">
            <h1 className="gc-h1">Barter</h1>
            <p className="gc-sub">Trade services with another founder. Write it down, both confirm, both get the agreement by email. No money changes hands.</p>
          </div>
          <button className="gc-btn gc-btn--red gc-btn--big" onClick={() => setShowNew(true)}><Icon.plus size={18} /> New agreement</button>
        </div>

        <div className="gc-grid3">
          {[['Waiting on them', waiting], ['Confirmed', confirmed], ['Value traded', `$${value.toLocaleString()}`]].map(([l, v]) => (
            <div key={l} className="gc-glass gc-glass--pink gc-stack" style={{ padding: '18px 20px', gap: 4 }}>
              <span className="gc-label" style={{ marginBottom: 0 }}>{l}</span>
              <span className="gc-display" style={{ fontSize: 28, color: 'var(--gc-red)' }}>{loading ? '…' : v}</span>
            </div>
          ))}
        </div>

        <section className="gc-stack" style={{ gap: 12 }}>
          <h2 className="gc-h2" style={{ fontSize: 19 }}>Your agreements</h2>
          {loading ? <p className="gc-small" style={{ textAlign: 'center', padding: 40 }}>Loading…</p>
          : ags.length === 0 ? (
            <div className="gc-glass gc-glass--dashed" style={{ textAlign: 'center', padding: 36 }}>
              <p className="gc-display" style={{ fontSize: 18, marginBottom: 6 }}>No agreements yet</p>
              <p className="gc-small" style={{ maxWidth: 420, margin: '0 auto 16px' }}>Write the trade down before work starts, send it to them to confirm, and track it to done.</p>
              <button className="gc-btn gc-btn--red" onClick={() => setShowNew(true)}>Create the first one</button>
            </div>
          ) : ags.map(ag => <AgreementCard key={ag.id} ag={ag} onUpdate={upd} onEdit={setEditing} />)}
        </section>

        <p className="gc-note">A Barter agreement is a written record both of you confirmed. It is not legal advice; for anything with real money or IP on the line, have a professional look at it.</p>
      </ModuleGate>
    </div>
  );
}