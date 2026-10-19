'use client';
// @ts-nocheck
// app/dashboard/vault/page.tsx — Idea Vault in the bubble look. Same data (vault_ideas), same seal
// route (/api/vault/seal), full detailed certificate. Launch HQ is gone.

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useModules } from '@/components/gc/useModules';
import { Header, Icon, Modal, ModuleGate, fmtDate } from '@/components/gc/ui';

const INDUSTRIES = ['Fintech', 'SaaS', 'Marketplace', 'Logistics', 'Healthcare', 'Education', 'Retail', 'Food & Bev', 'AI/ML', 'Hardware', 'Consumer', 'B2B'];

function NewIdeaModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [claims, setClaims] = useState('');
  const [users, setUsers] = useState('');
  const [diff, setDiff] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const FIELDS = [
    { label: 'Problem', hint: 'What problem does this solve, and who has it?', value: problem, set: setProblem, ph: 'e.g. Night-market food vendors lose sales to long lines…', rows: 3 },
    { label: 'Solution', hint: 'How does it work when someone uses it?', value: solution, set: setSolution, ph: 'e.g. Customers pre-order and pay from a QR code at the stall…', rows: 3 },
    { label: 'Key claims', hint: '3–5 things that are new or different. Number them.', value: claims, set: setClaims, ph: '1. …\n2. …\n3. …', rows: 4 },
    { label: 'Intended users', hint: 'Who exactly would use this?', value: users, set: setUsers, ph: 'e.g. Street-food vendors doing 100+ orders a night…', rows: 2 },
    { label: 'How it differs', hint: 'What exists today, and how is yours different?', value: diff, set: setDiff, ph: 'e.g. Square handles payment but not the queue…', rows: 3 },
  ];
  const complete = title.trim() && problem.trim() && solution.trim() && claims.trim() && users.trim() && diff.trim();
  const buildDoc = () => `PRIOR ART DISCLOSURE\n\nTitle: ${title}\n\nPROBLEM:\n${problem}\n\nSOLUTION:\n${solution}\n\nKEY CLAIMS:\n${claims}\n\nINTENDED USERS:\n${users}\n\nDIFFERENTIATION:\n${diff}`;

  const save = async () => {
    if (!complete) { setError('Fill in every section before saving.'); return; }
    setLoading(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { data, error: dbErr } = await supabase.from('vault_ideas').insert({ user_id: user.id, title: title.trim(), description: problem.trim(), expanded_doc: buildDoc(), tags, status: 'draft' }).select().single();
      if (dbErr) throw dbErr;
      onCreated(data); onClose();
    } catch (e) { setError('Could not save that. Try again in a moment.'); setLoading(false); }
  };

  return (
    <Modal onClose={onClose}>
      <span className="gc-label">New idea</span>
      <h2 className="gc-display" style={{ fontSize: 22 }}>Write it down, then seal it.</h2>
      <p className="gc-small">The more detail, the stronger your record. Saved as a draft; sealing locks the timestamp.</p>
      <div><label className="gc-label" htmlFor="ni-title">Title</label><input id="ni-title" className="gc-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="A short, clear name" /></div>
      {FIELDS.map(f => (
        <div key={f.label}>
          <label className="gc-label">{f.label} <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }} className="gc-muted">— {f.hint}</span></label>
          <textarea className="gc-textarea" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} rows={f.rows} />
        </div>
      ))}
      <div>
        <span className="gc-label">Tags <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }} className="gc-muted">(optional)</span></span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {INDUSTRIES.map(t => <button key={t} type="button" className="gc-chip" style={{ minHeight: 34, fontSize: 12 }} aria-pressed={tags.includes(t)} onClick={() => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}>{t}</button>)}
        </div>
      </div>
      {error && <p className="gc-error">{error}</p>}
      <button className="gc-btn gc-btn--red gc-btn--big gc-btn--block" disabled={loading || !complete} onClick={save}>{loading ? 'Saving…' : complete ? 'Save to vault' : 'Complete all sections to save'}</button>
    </Modal>
  );
}

function SealModal({ idea, ownerName, onClose, onSealed }) {
  const [step, setStep] = useState('confirm');
  const [sealed, setSealed] = useState(null);
  const [error, setError] = useState('');
  const doSeal = async () => {
    setStep('sealing'); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/vault/seal', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` }, body: JSON.stringify({ ideaId: idea.id }) });
      const data = await res.json();
      if (!data.ok) throw new Error();
      setSealed(data.idea); setStep('done'); onSealed(data.idea);
    } catch { setError('Sealing did not go through. Nothing changed — try again.'); setStep('confirm'); }
  };
  return (
    <Modal onClose={onClose} maxWidth={480}>
      {step === 'confirm' && <>
        <span className="gc-label">Seal this idea</span>
        <h2 className="gc-display" style={{ fontSize: 22 }}>{idea.title}</h2>
        <p className="gc-small">Sealing hashes the exact text (SHA-256) and records the UTC time. Any later change would break the fingerprint — that is the proof. Sealing is permanent.</p>
        <div className="gc-glass gc-glass--pink" style={{ padding: '14px 16px', fontSize: 14 }}>Certificate will be issued to <strong style={{ color: 'var(--gc-red)' }}>{ownerName}</strong>.</div>
        {error && <p className="gc-error">{error}</p>}
        <button className="gc-btn gc-btn--red gc-btn--big gc-btn--block" onClick={doSeal}>Seal it <Icon.vault size={18} /></button>
      </>}
      {step === 'sealing' && <div style={{ textAlign: 'center', padding: '28px 0' }}><h2 className="gc-display" style={{ fontSize: 20 }}>Sealing…</h2><p className="gc-small">Hashing and timestamping.</p></div>}
      {step === 'done' && sealed && <>
        <span className="gc-tag gc-tag--red" style={{ alignSelf: 'flex-start' }}><Icon.check size={14} /> Sealed</span>
        <h2 className="gc-display" style={{ fontSize: 22 }}>Done. It existed today, and you can prove it.</h2>
        <div className="gc-glass" style={{ padding: '14px 16px' }}>
          <div className="gc-mono" style={{ lineHeight: 1.8, wordBreak: 'break-all' }}>ID: {sealed.seal_id}<br />SHA-256: {sealed.seal_hash}<br />Sealed: {sealed.sealed_at ? new Date(sealed.sealed_at).toUTCString() : ''}</div>
        </div>
        <button className="gc-btn gc-btn--outline gc-btn--block" onClick={onClose}>Close</button>
      </>}
    </Modal>
  );
}

export default function VaultPage() {
  const m = useModules();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [sealTarget, setSealTarget] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!m.user) return;
    supabase.from('vault_ideas').select('*').eq('user_id', m.user.id).is('deleted_at', null).order('created_at', { ascending: false })
      .then(({ data }) => { setIdeas(data || []); setLoading(false); });
  }, [m.user]);

  // Full detailed certificate (same text as the original Ideas Vault version)
  const downloadCert = (idea) => {
    const body = idea.expanded_doc || idea.description || '';
    const sealedUtc = idea.sealed_at ? new Date(idea.sealed_at).toUTCString() : '';
    const ownerName = m.name || 'the account holder';
    const ownerEmail = m.user?.email || '—';
    const div = '═'.repeat(60);
    const thin = '─'.repeat(60);
    const text =
`${div}
        GRATIA CORE — IDEAS VAULT
        CERTIFICATE OF SEALED RECORD
${div}

This certifies that the idea and details below were recorded and
cryptographically sealed in Gratia Core on the date and time shown.

Certified to:   ${ownerName}
Account email:  ${ownerEmail}
Title:          ${idea.title}
Seal ID:        ${idea.seal_id}
Sealed (UTC):   ${sealedUtc}
SHA-256:        ${idea.seal_hash}

${thin}
SEALED DETAILS — the exact content this certificate covers
${thin}

${body}

${thin}
WHAT THIS PROVES
${thin}

The SHA-256 value above is a unique fingerprint of the sealed record
(the details above, the title, and the sealing timestamp). Any change
to a single character of the details would produce a different
fingerprint. Because the fingerprint matches, this document proves the
details existed in exactly this form, under this account, on the date
and time recorded above.

${thin}
ATTESTATION
${thin}

Sealed by:  ${ownerName}

Signature:  __________________________________    Date: ____________

Issued by Gratia Core — gratiacore.com
Verification reference: ${idea.seal_id}

${thin}
This is a record of prior existence and authorship on the recorded date.
It is NOT a patent, copyright, trademark, or government registration, and
it is not legal advice. Gratia Core is not a law firm. For legal protection
of an idea, consult a licensed attorney.
${div}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GC-${idea.seal_id}-certificate.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sealedCount = ideas.filter(i => i.status === 'sealed').length;
  const shown = ideas.filter(i => filter === 'all' || i.status === filter);

  return (
    <div className="gc-wrap">
      <Header back right={<span className="gc-pill gc-glass gc-glass--pink" style={{ borderRadius: 999 }}><span className="gc-dot" />{m.loading ? '…' : m.access.vault ? 'On · $5/mo' : 'Off'}</span>} />

      <ModuleGate id="vault" state={m.stateOf('vault')} busy={m.busy === 'vault'} onTurnOn={() => m.toggle('vault', true)}>
        {showNew && <NewIdeaModal onClose={() => setShowNew(false)} onCreated={i => setIdeas(p => [i, ...p])} />}
        {sealTarget && <SealModal idea={sealTarget} ownerName={m.name} onClose={() => setSealTarget(null)} onSealed={u => setIdeas(p => p.map(i => i.id === u.id ? u : i))} />}

        <div className="gc-stack">
          <h1 className="gc-h1">Idea Vault</h1>
          <p className="gc-sub">Seal an idea. You get a timestamped, signed certificate that proves it existed today — yours to show anyone.</p>
        </div>

        <div className="gc-two">
          <section className="gc-main gc-glass gc-glass--primary gc-pad" style={{ gap: 16, padding: '26px 28px' }}>
            <h2 className="gc-h2" style={{ fontSize: 19 }}>Seal something new</h2>
            <p className="gc-small" style={{ fontSize: 14 }}>Write the idea in your own words — problem, solution, what is new, who it is for. Everything you type is hashed and timestamped. We never edit it, and only you can read it.</p>
            <div className="gc-row">
              <span className="gc-small">Certificate will be issued to <strong style={{ color: 'var(--gc-red)' }}>{m.name || '…'}</strong> · UTC timestamp · SHA-256</span>
              <button className="gc-btn gc-btn--red gc-btn--big" onClick={() => setShowNew(true)}><Icon.plus size={18} /> New idea</button>
            </div>
          </section>
          <aside className="gc-rail">
            <div className="gc-glass gc-glass--pink gc-pad gc-stack" style={{ gap: 8 }}>
              <span className="gc-h2" style={{ fontSize: 16, color: 'var(--gc-red)' }}>What a seal proves</span>
              <p className="gc-small" style={{ fontSize: 14 }}>That this exact content existed, under your name, at this exact time. It does not register a trademark, patent or copyright — it is evidence you can bring to one.</p>
            </div>
            <div className="gc-glass gc-pad gc-stack" style={{ gap: 10 }}>
              <span className="gc-h2" style={{ fontSize: 16 }}>Files &amp; canary marks</span>
              <p className="gc-small" style={{ fontSize: 14 }}>Seal code, designs and decks, and add hidden markers so copies can be traced.</p>
              <span className="gc-tag" style={{ alignSelf: 'flex-start', border: '2px dashed rgba(215,20,26,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Coming soon</span>
            </div>
          </aside>
        </div>

        <section className="gc-stack" style={{ gap: 14 }}>
          <div className="gc-row">
            <h2 className="gc-h2" style={{ fontSize: 19 }}>Your seals</h2>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="gc-small" style={{ marginRight: 6 }}>{sealedCount} sealed · {ideas.length - sealedCount} draft{ideas.length - sealedCount === 1 ? '' : 's'}</span>
              {[['all', 'All'], ['sealed', 'Sealed'], ['draft', 'Drafts']].map(([v, l]) => <button key={v} type="button" className="gc-chip" style={{ minHeight: 36 }} aria-pressed={filter === v} onClick={() => setFilter(v)}>{l}</button>)}
            </div>
          </div>

          {loading ? <p className="gc-small" style={{ textAlign: 'center', padding: 40 }}>Loading your vault…</p>
          : ideas.length === 0 ? (
            <div className="gc-glass gc-glass--dashed gc-pad" style={{ textAlign: 'center', padding: 36 }}>
              <p className="gc-display" style={{ fontSize: 18, marginBottom: 6 }}>Nothing sealed yet</p>
              <p className="gc-small" style={{ maxWidth: 420, margin: '0 auto 16px' }}>Document it before you share it. Write the idea, seal it, keep the certificate.</p>
              <button className="gc-btn gc-btn--red" onClick={() => setShowNew(true)}>Write your first idea</button>
            </div>
          ) : shown.length === 0 ? <p className="gc-small" style={{ textAlign: 'center', padding: 30 }}>No {filter} ideas.</p>
          : shown.map((idea, i) => {
            const sealed = idea.status === 'sealed';
            return (
              <article key={idea.id} className={`gc-glass gc-row gc-fade ${sealed ? 'gc-glass--primary' : ''}`} style={{ padding: '18px 22px', borderRadius: 24, animationDelay: `${i * 0.04}s` }}>
                <div className="gc-stack" style={{ gap: 6, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 17 }}>{idea.title}</span>
                    {sealed ? <span className="gc-tag gc-tag--red"><Icon.check size={12} /> Sealed</span> : <span className="gc-tag gc-tag--pink">Draft</span>}
                    {(idea.tags || []).slice(0, 3).map(t => <span key={t} className="gc-tag gc-tag--pink" style={{ fontWeight: 600 }}>{t}</span>)}
                  </div>
                  {sealed
                    ? <span className="gc-mono">{idea.sealed_at ? new Date(idea.sealed_at).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : ''} · {idea.seal_id} · sha256 {idea.seal_hash?.slice(0, 4)}…{idea.seal_hash?.slice(-4)}</span>
                    : <span className="gc-small">Created {fmtDate(idea.created_at)} · not timestamped until you seal it</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sealed
                    ? <button className="gc-btn gc-btn--red" onClick={() => downloadCert(idea)}><Icon.download size={18} /> Certificate</button>
                    : <button className="gc-btn gc-btn--red" onClick={() => setSealTarget(idea)}><Icon.vault size={18} /> Seal now</button>}
                </div>
              </article>
            );
          })}
        </section>

        <p className="gc-note" style={{ textAlign: 'center' }}>A seal records prior existence and integrity. It is not a patent and not legal advice — for full protection, talk to a licensed IP attorney.</p>
      </ModuleGate>
    </div>
  );
}