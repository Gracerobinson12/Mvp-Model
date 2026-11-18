// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import ModuleGate from '@/components/ModuleGate';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type AgreementStatus = 'draft' | 'pending' | 'active' | 'complete' | 'cancelled';

interface BarterAgreement {
  id: string;
  user_id: string;
  title: string;
  counterparty_name: string;
  counterparty_email: string;
  my_offer: string;
  their_offer: string;
  deadline: string | null;
  notes: string;
  status: AgreementStatus;
  token: string | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
}

/* ─────────────────────────────────────────────
   Shared styles
───────────────────────────────────────────── */
const S = {
  page: { minHeight: '100vh', background: '#f2f2f7', fontFamily: "'DM Sans',system-ui,sans-serif", WebkitFontSmoothing: 'antialiased' as const, overflowX: 'hidden' as const },
  orb1: { position: 'fixed' as const, top: '-12%', left: '-5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,59,48,0.08) 0%,rgba(255,255,255,0) 70%)', filter: 'blur(40px)', animation: 'meshFloat1 18s ease-in-out infinite', pointerEvents: 'none' as const, zIndex: 0 },
  orb2: { position: 'fixed' as const, top: '25%', right: '-8%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,132,255,0.06) 0%,rgba(255,255,255,0) 70%)', filter: 'blur(50px)', animation: 'meshFloat2 22s ease-in-out infinite', pointerEvents: 'none' as const, zIndex: 0 },
  shell: { maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px', position: 'relative' as const, zIndex: 1 },
  glass: (primary = false): React.CSSProperties => ({
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    borderRadius: 20,
    boxShadow: primary
      ? 'inset 0 0 0 1.5px rgba(215,20,26,0.16),inset 0 1px 0 rgba(255,255,255,0.95),0 8px 32px rgba(215,20,26,0.07)'
      : 'inset 0 1px 0 rgba(255,255,255,0.95),0 8px 32px rgba(0,0,0,0.07)',
  }),
  btnRed: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: '#D7141A', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
  btnGhost: { padding: '7px 13px', borderRadius: 9, fontSize: 12, fontWeight: 600, background: 'rgba(120,120,128,0.1)', color: '#1c1c1e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
  inp: { width: '100%', padding: '12px 15px', borderRadius: 11, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: 'rgba(120,120,128,0.09)', border: '1px solid rgba(0,0,0,0.09)', color: '#1c1c1e', boxSizing: 'border-box' as const },
  ta:  { width: '100%', padding: '12px 15px', borderRadius: 11, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: 'rgba(120,120,128,0.09)', border: '1px solid rgba(0,0,0,0.09)', color: '#1c1c1e', boxSizing: 'border-box' as const, resize: 'vertical' as const, lineHeight: 1.6 },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#636366', display: 'block', marginBottom: 5 },
};

/* ─────────────────────────────────────────────
   Status badge
───────────────────────────────────────────── */
const STATUS_COLORS: Record<AgreementStatus, { bg: string; color: string; label: string }> = {
  draft:     { bg: 'rgba(120,120,128,0.1)',  color: '#636366',  label: 'Draft'     },
  pending:   { bg: 'rgba(255,149,0,0.1)',    color: '#C07400',  label: 'Pending'   },
  active:    { bg: 'rgba(10,132,255,0.08)',  color: '#0A54E8',  label: 'Active'    },
  complete:  { bg: 'rgba(52,199,89,0.1)',    color: '#248A3D',  label: 'Complete'  },
  cancelled: { bg: 'rgba(215,20,26,0.07)',   color: '#D7141A',  label: 'Cancelled' },
};

function StatusBadge({ status }: { status: AgreementStatus }) {
  const c = STATUS_COLORS[status];
  return <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color }}>{c.label}</span>;
}

/* ─────────────────────────────────────────────
   New Agreement Modal
───────────────────────────────────────────── */
function NewAgreementModal({ onClose, onSaved }: { onClose: () => void; onSaved: (a: BarterAgreement) => void }) {
  const [title, setTitle]       = useState('');
  const [cpName, setCpName]     = useState('');
  const [cpEmail, setCpEmail]   = useState('');
  const [myOffer, setMyOffer]   = useState('');
  const [theirOffer, setTheirs] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  async function save(asDraft: boolean) {
    if (!title.trim())   { setError('Add a title for this agreement.'); return; }
    if (!myOffer.trim()) { setError('Describe what you are offering.'); return; }
    if (!theirOffer.trim()) { setError('Describe what you want in return.'); return; }
    if (!asDraft && !cpEmail.trim()) { setError('Add the counterparty email to send for confirmation.'); return; }
    setSaving(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { data, error: dbErr } = await supabase.from('barter_agreements').insert({
        user_id: user.id,
        title: title.trim(),
        counterparty_name: cpName.trim(),
        counterparty_email: cpEmail.trim().toLowerCase(),
        my_offer: myOffer.trim(),
        their_offer: theirOffer.trim(),
        deadline: deadline || null,
        notes: notes.trim(),
        status: asDraft ? 'draft' : 'pending',
      }).select().single();
      if (dbErr) throw dbErr;
      if (!asDraft && cpEmail.trim()) {
        // send confirmation email via API
        await fetch('/api/barter/send-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agreementId: data.id }),
        });
      }
      onSaved(data as BarterAgreement);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  const fieldRow = (label: string, hint: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: '#8e8e93', marginBottom: 4 }}>{hint}</p>}
      {children}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 28, boxShadow: 'inset 0 0 0 1.5px rgba(215,20,26,0.16),0 40px 100px rgba(0,0,0,0.18)', width: 'min(560px,100%)', maxHeight: '90vh', overflowY: 'auto', padding: '28px 28px 24px' }}
        onClick={e => e.stopPropagation()}>

        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 21, fontWeight: 700, marginBottom: 4 }}>New barter agreement</h2>
        <p style={{ fontSize: 14, color: '#636366', marginBottom: 20, lineHeight: 1.5 }}>Describe what both sides are offering. Send it for confirmation or save as a draft.</p>

        {fieldRow('Agreement title', 'Give this deal a short, clear name.',
          <input style={S.inp} placeholder="e.g. Logo design for 3 months SEO" value={title} onChange={e => setTitle(e.target.value)} />
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Counterparty</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input style={S.inp} placeholder="Name" value={cpName} onChange={e => setCpName(e.target.value)} />
            <input style={{ ...S.inp }} placeholder="Email (for confirmation link)" value={cpEmail} onChange={e => setCpEmail(e.target.value)} type="email" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={S.label}>What you offer</label>
            <textarea style={{ ...S.ta, minHeight: 80 }} placeholder="Your contribution — be specific." value={myOffer} onChange={e => setMyOffer(e.target.value)} rows={3} />
          </div>
          <div>
            <label style={S.label}>What they offer</label>
            <textarea style={{ ...S.ta, minHeight: 80 }} placeholder="Their contribution — be specific." value={theirOffer} onChange={e => setTheirs(e.target.value)} rows={3} />
          </div>
        </div>

        {fieldRow('Deadline', 'Optional — when does the exchange need to happen by?',
          <input style={S.inp} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        )}

        {fieldRow('Notes', 'Delivery terms, milestones, or anything else worth documenting.',
          <textarea style={{ ...S.ta, minHeight: 60 }} value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        )}

        <div style={{ background: 'rgba(215,20,26,0.07)', borderRadius: 12, padding: '11px 14px', marginBottom: 18, fontSize: 13, color: '#636366', lineHeight: 1.5 }}>
          <strong style={{ color: '#D7141A' }}>Not a legal contract.</strong> This agreement is a written record of an informal exchange. It has no legal enforceability and is not reviewed by any attorney. For enforceable contracts, consult a qualified legal professional.
        </div>

        {error && <p style={{ fontSize: 12, color: '#D7141A', marginBottom: 10 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
          <button style={{ ...S.btnRed, flex: 1, justifyContent: 'center', borderRadius: 13, minHeight: 48, fontSize: 14 }} onClick={() => save(false)} disabled={saving}>
            {saving ? 'Sending…' : 'Send for confirmation →'}
          </button>
          <button style={{ ...S.btnGhost, flex: '0 0 auto', borderRadius: 13, minHeight: 48, padding: '0 20px', fontSize: 14 }} onClick={() => save(true)} disabled={saving}>
            Save draft
          </button>
        </div>
        <button style={{ ...S.btnGhost, width: '100%', marginTop: 8, borderRadius: 12, minHeight: 44, fontSize: 14 }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Agreement detail drawer
───────────────────────────────────────────── */
function AgreementDrawer({ agreement: a, onClose, onStatusChange }: {
  agreement: BarterAgreement;
  onClose: () => void;
  onStatusChange: (id: string, status: AgreementStatus) => void;
}) {
  const [working, setWorking] = useState(false);

  async function markComplete() {
    setWorking(true);
    await supabase.from('barter_agreements').update({ status: 'complete', completed_at: new Date().toISOString() }).eq('id', a.id);
    onStatusChange(a.id, 'complete');
    setWorking(false);
  }

  async function cancel() {
    if (!confirm('Cancel this agreement?')) return;
    setWorking(true);
    await supabase.from('barter_agreements').update({ status: 'cancelled' }).eq('id', a.id);
    onStatusChange(a.id, 'cancelled');
    setWorking(false);
    onClose();
  }

  async function resend() {
    setWorking(true);
    await fetch('/api/barter/send-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agreementId: a.id }),
    });
    setWorking(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 640, maxHeight: '82vh', overflowY: 'auto', padding: '28px 28px 40px', boxShadow: '0 -12px 60px rgba(0,0,0,0.14)' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 5 }}>{a.title}</h2>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' as const }}>
              <StatusBadge status={a.status} />
              <span style={{ fontSize: 12, color: '#8e8e93' }}>Created {new Date(a.created_at).toLocaleDateString()}</span>
              {a.confirmed_at && <span style={{ fontSize: 12, color: '#248A3D' }}>Confirmed {new Date(a.confirmed_at).toLocaleDateString()}</span>}
            </div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#8e8e93', padding: 4, flexShrink: 0 }} onClick={onClose}>✕</button>
        </div>

        {/* counterparty */}
        {(a.counterparty_name || a.counterparty_email) && (
          <div style={{ background: 'rgba(120,120,128,0.07)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase' as const, color: '#8e8e93', marginBottom: 5 }}>Counterparty</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{a.counterparty_name || '—'}</div>
            <div style={{ fontSize: 13, color: '#636366' }}>{a.counterparty_email || '—'}</div>
          </div>
        )}

        {/* exchange terms */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ background: 'rgba(215,20,26,0.07)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase' as const, color: '#D7141A', marginBottom: 6 }}>You offer</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{a.my_offer || '—'}</p>
          </div>
          <div style={{ background: 'rgba(10,132,255,0.07)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase' as const, color: '#0A54E8', marginBottom: 6 }}>They offer</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{a.their_offer || '—'}</p>
          </div>
        </div>

        {a.deadline && (
          <div style={{ marginBottom: 12, fontSize: 13.5 }}>
            <strong>Deadline:</strong> {new Date(a.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        )}

        {a.notes && (
          <div style={{ background: 'rgba(120,120,128,0.07)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase' as const, color: '#8e8e93', marginBottom: 5 }}>Notes</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{a.notes}</p>
          </div>
        )}

        {/* actions */}
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' as const, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          {a.status === 'active' && (
            <button style={{ ...S.btnRed, flex: '1 1 auto', justifyContent: 'center', borderRadius: 12, minHeight: 44 }} onClick={markComplete} disabled={working}>
              Mark complete ✓
            </button>
          )}
          {(a.status === 'draft' || a.status === 'pending') && a.counterparty_email && (
            <button style={{ ...S.btnRed, flex: '1 1 auto', justifyContent: 'center', borderRadius: 12, minHeight: 44 }} onClick={resend} disabled={working}>
              Resend confirmation link
            </button>
          )}
          {(a.status === 'draft' || a.status === 'pending' || a.status === 'active') && (
            <button style={{ ...S.btnGhost, borderRadius: 12, minHeight: 44, padding: '0 18px', fontSize: 14 }} onClick={cancel} disabled={working}>
              Cancel agreement
            </button>
          )}
        </div>

        <p style={{ fontSize: 12, color: '#8e8e93', marginTop: 16, lineHeight: 1.5 }}>
          Not a legal contract. This record captures an informal exchange agreement. No attorney has reviewed it. For enforceable contracts, consult legal counsel.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stats strip
───────────────────────────────────────────── */
function StatsStrip({ agreements }: { agreements: BarterAgreement[] }) {
  const active   = agreements.filter(a => a.status === 'active').length;
  const complete = agreements.filter(a => a.status === 'complete').length;
  const pending  = agreements.filter(a => a.status === 'pending').length;
  const draft    = agreements.filter(a => a.status === 'draft').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
      {[
        { label: 'Active',    value: active,   color: '#0A54E8' },
        { label: 'Pending',   value: pending,  color: '#C07400' },
        { label: 'Complete',  value: complete, color: '#248A3D' },
        { label: 'Drafts',    value: draft,    color: '#636366' },
      ].map(stat => (
        <div key={stat.label} style={{ ...S.glass(), padding: '14px 18px', textAlign: 'center' as const }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: stat.color, lineHeight: 1.1 }}>{stat.value}</div>
          <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2, fontWeight: 600 }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function BarterPage() {
  const [agreements, setAgreements] = useState<BarterAgreement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilter]   = useState<AgreementStatus | 'all'>('all');
  const [showNew, setShowNew]       = useState(false);
  const [selected, setSelected]     = useState<BarterAgreement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('barter_agreements')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setAgreements((data as BarterAgreement[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = agreements.filter(a => filterStatus === 'all' || a.status === filterStatus);

  function onStatusChange(id: string, status: AgreementStatus) {
    setAgreements(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }

  const filterPill = (s: AgreementStatus | 'all'): React.CSSProperties => ({
    padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
    background: filterStatus === s ? '#D7141A' : 'rgba(120,120,128,0.09)',
    color: filterStatus === s ? '#fff' : '#1c1c1e',
  });

  return (
    <ModuleGate moduleId="barter">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes meshFloat1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(4%,6%) scale(1.08)}}
        @keyframes meshFloat2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-3%,4%) scale(1.12)}}
        * { box-sizing: border-box; }
        input:focus, textarea:focus { border-color: rgba(215,20,26,0.4) !important; }
      `}</style>

      <div style={S.page}>
        <div style={S.orb1} />
        <div style={S.orb2} />

        <Header back="/dashboard" />

        <div style={S.shell}>

          {/* ── hero ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, margin: '28px 0 24px', flexWrap: 'wrap' as const }}>
            <div style={{
              width: 112, height: 112, borderRadius: '50%', flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              background: 'linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0) 48%),linear-gradient(160deg,rgba(240,72,78,0.95),rgba(200,10,18,0.92))',
              border: '1px solid rgba(255,255,255,0.45)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.55),inset 0 -10px 24px rgba(110,0,6,0.28),0 20px 48px rgba(215,20,26,0.32)',
              color: '#fff', textAlign: 'center' as const,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/>
                <path d="M12 7v10m-4-5h8"/>
              </svg>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2, padding: '0 10%' }}>Barter</span>
              <span style={{ fontSize: 10, fontWeight: 600, opacity: .88 }}>$3/mo</span>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(28px,5vw,42px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.05, color: '#1c1c1e', margin: '0 0 8px' }}>
                Trade value.
              </h1>
              <p style={{ fontSize: 15, color: '#636366', lineHeight: 1.6, maxWidth: 480, margin: 0 }}>
                Write up what you are trading for what, send a confirmation link, and keep a written record — no money, no lawyers.
              </p>
            </div>
            <button style={{ ...S.btnRed, padding: '12px 24px', borderRadius: 14, fontSize: 15, flexShrink: 0 }} onClick={() => setShowNew(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              New agreement
            </button>
          </div>

          {/* stats */}
          {agreements.length > 0 && <StatsStrip agreements={agreements} />}

          {/* filter row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12, marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Your agreements</h2>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
              {(['all','active','pending','draft','complete','cancelled'] as const).map(s => (
                <button key={s} style={filterPill(s)} onClick={() => setFilter(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* loading */}
          {loading && <p style={{ fontSize: 14, color: '#8e8e93', padding: '20px 0' }}>Loading…</p>}

          {/* empty */}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center' as const, border: '2px dashed rgba(215,20,26,0.25)', borderRadius: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 10, opacity: .4 }}>🤝</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                {filterStatus === 'all' ? 'No agreements yet' : `No ${filterStatus} agreements`}
              </h3>
              <p style={{ fontSize: 14, color: '#8e8e93', maxWidth: 320, margin: '0 auto 18px', lineHeight: 1.5 }}>
                {filterStatus === 'all'
                  ? 'Create your first barter — write what both sides offer, set a deadline, and send it for confirmation.'
                  : `No agreements with "${filterStatus}" status.`}
              </p>
              {filterStatus === 'all' && (
                <button style={S.btnRed} onClick={() => setShowNew(true)}>New agreement →</button>
              )}
            </div>
          )}

          {/* agreement cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
            {filtered.map(a => (
              <div key={a.id}
                style={{ ...S.glass(a.status === 'active'), padding: '18px 20px', cursor: 'pointer', transition: 'transform .15s', display: 'flex', flexDirection: 'column', gap: 10 }}
                onClick={() => setSelected(a)}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, flex: 1 }}>{a.title}</div>
                  <StatusBadge status={a.status} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'rgba(215,20,26,0.06)', borderRadius: 10, padding: '8px 11px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: '#D7141A', marginBottom: 3 }}>You offer</div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#1c1c1e', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{a.my_offer}</div>
                  </div>
                  <div style={{ background: 'rgba(10,132,255,0.06)', borderRadius: 10, padding: '8px 11px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: '#0A54E8', marginBottom: 3 }}>They offer</div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#1c1c1e', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{a.their_offer}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#8e8e93' }}>
                  <span>
                    {a.counterparty_name
                      ? <>With <strong style={{ color: '#1c1c1e' }}>{a.counterparty_name}</strong></>
                      : 'No counterparty set'}
                  </span>
                  {a.deadline && (
                    <span>Due {new Date(a.deadline).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* how barter works */}
          {agreements.length === 0 && !loading && (
            <div style={{ marginTop: 32, ...S.glass(), padding: 24 }}>
              <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 14 }}>How it works</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                {[
                  { step: '1', icon: '✍️', title: 'Write it down', desc: 'Describe exactly what each side is offering. The more specific, the better.' },
                  { step: '2', icon: '📧', title: 'Send a link', desc: 'Your counterparty gets a unique link to review and confirm the deal.' },
                  { step: '3', icon: '🤝', title: 'Both confirm', desc: 'Once they click confirm, the agreement is marked active and both sides have a record.' },
                  { step: '4', icon: '✅', title: 'Mark complete', desc: 'When both sides have delivered, mark it complete. Keep your records tidy.' },
                ].map(c => (
                  <div key={c.step} style={{ padding: '14px 16px', background: 'rgba(215,20,26,0.05)', borderRadius: 14 }}>
                    <div style={{ fontSize: 24, marginBottom: 7 }}>{c.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: '#636366', lineHeight: 1.5 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* compliance disclaimer */}
          <div style={{ marginTop: 28, padding: '14px 18px', background: 'rgba(120,120,128,0.06)', borderRadius: 14, fontSize: 12, color: '#8e8e93', lineHeight: 1.6 }}>
            <strong style={{ color: '#636366' }}>Not legal advice. Not a contract.</strong> Barter agreements on Gratia Core are written records of informal exchanges between willing parties. They have no legal enforceability and are not reviewed by attorneys. No financial or legal advice is provided. Gratia Core is not a party to any agreement and makes no representations about the enforceability, accuracy, or completeness of any agreement. For legally binding agreements, consult a qualified attorney. This module is for personal record-keeping only.
          </div>

        </div>
      </div>

      {showNew && (
        <NewAgreementModal
          onClose={() => setShowNew(false)}
          onSaved={a => setAgreements(prev => [a, ...prev])}
        />
      )}

      {selected && (
        <AgreementDrawer
          agreement={selected}
          onClose={() => setSelected(null)}
          onStatusChange={onStatusChange}
        />
      )}
    </ModuleGate>
  );
}