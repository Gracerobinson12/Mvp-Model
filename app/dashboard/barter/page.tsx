// @ts-nocheck
/* eslint-disable */
'use client';

/**
 * app/dashboard/barter/page.tsx
 * Private barter dashboard — post listings, manage trades
 * Three tabs: Browse board | My trades | Post listing
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['Dev', 'Design', 'Writing', 'Marketing', 'Photo/Video', 'Audio', 'Business', 'Other'];

const CAT_COLORS = {
  Dev:         { color: '#0a84ff', bg: 'rgba(10,132,255,0.1)',  border: 'rgba(10,132,255,0.2)'  },
  Design:      { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.2)'  },
  Writing:     { color: '#b45309', bg: 'rgba(255,149,0,0.1)',  border: 'rgba(255,149,0,0.2)'   },
  Marketing:   { color: '#1a7a35', bg: 'rgba(48,209,88,0.1)',  border: 'rgba(48,209,88,0.2)'   },
  'Photo/Video':{ color: '#cc2018', bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.2)'   },
  Audio:       { color: '#0a84ff', bg: 'rgba(10,132,255,0.08)',border: 'rgba(10,132,255,0.15)' },
  Business:    { color: '#ff3b30', bg: 'rgba(255,59,48,0.08)', border: 'rgba(255,59,48,0.15)'  },
  Other:       { color: '#636366', bg: 'rgba(99,99,102,0.08)', border: 'rgba(99,99,102,0.15)'  },
};

const STATUS_COLORS = {
  active:        { label: '● Active',           color: '#1a7a35', bg: 'rgba(48,209,88,0.1)',  border: 'rgba(48,209,88,0.25)'  },
  awaiting_you:  { label: '⏳ Your turn',        color: '#b45309', bg: 'rgba(255,149,0,0.1)', border: 'rgba(255,149,0,0.25)'  },
  awaiting_them: { label: '⏳ Waiting on them',  color: '#0a84ff', bg: 'rgba(10,132,255,0.1)',border: 'rgba(10,132,255,0.2)'  },
  completed:     { label: '✓ Completed',         color: 'rgba(28,28,30,0.5)', bg: 'rgba(28,28,46,0.05)', border: 'rgba(28,28,46,0.1)' },
  disputed:      { label: '⚠ Disputed',          color: '#cc2018', bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.25)'  },
};

// ── New Trade Modal (3-step, glass style) ────────────────────
function NewTradeModal({ onClose, onCreated, mode }) {
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form,    setForm]    = useState({ title: '', counterparty_name: '', counterparty_email: '', you_deliver: '', you_deliver_value: '', they_deliver: '', they_deliver_value: '', due_date: '', notes: '' });

  const D = mode === 'dark';
  const ink = D ? '#fff' : '#1c1c1e';
  const ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(28,28,30,0.5)';
  const inp = { width: '100%', padding: '11px 14px', borderRadius: 12, border: `1px solid ${D ? 'rgba(255,255,255,0.12)' : 'rgba(28,28,46,0.12)'}`, background: D ? 'rgba(255,255,255,0.07)' : 'rgba(28,28,46,0.03)', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: ink, boxSizing: 'border-box' };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.title || !form.counterparty_name || !form.you_deliver || !form.they_deliver) { setError('Fill in all required fields.'); return; }
    setLoading(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const agreementId = `GCB-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const { data, error: dbErr } = await supabase.from('barter_trades').insert({
        user_id: user.id, ...form,
        you_deliver_value: parseFloat(form.you_deliver_value) || 0,
        they_deliver_value: parseFloat(form.they_deliver_value) || 0,
        you_delivered: false, they_delivered: false,
        status: 'active', agreement_id: agreementId,
        due_date: form.due_date || null, notes: form.notes || null,
      }).select().single();
      if (dbErr) throw dbErr;
      onCreated(data); onClose();
    } catch (e) { setError(e.message); setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)', padding: '0 16px 24px' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 540, background: D ? 'rgba(14,14,22,0.98)' : 'rgba(255,255,255,0.97)', backdropFilter: 'blur(40px)', border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'}`, borderRadius: '24px 24px 18px 18px', overflow: 'hidden', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowAnim 3s linear infinite' }} />
        <div style={{ padding: '20px 22px 28px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: '50%', background: D ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer', fontSize: 12, color: ink2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: D ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 4 }}>New trade agreement</p>
          <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 900, color: ink, marginBottom: 4, letterSpacing: '-0.5px' }}>What are you trading?</p>
          <p style={{ fontSize: 12, color: ink2, lineHeight: 1.6, marginBottom: 20 }}>Document the deal before any work starts. Both sides, clear terms, timestamped.</p>

          {/* Progress */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 22 }}>
            {[1,2,3].map(n => <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= n ? '#ff3b30' : D ? 'rgba(255,255,255,0.12)' : 'rgba(28,28,46,0.1)', transition: 'background 0.3s' }} />)}
          </div>

          {step === 1 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink2, marginBottom: 6 }}>Trade title *</p>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Logo design for web development" style={{ ...inp, marginBottom: 12 }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink2, marginBottom: 6 }}>Other person&apos;s name *</p>
              <input value={form.counterparty_name} onChange={e => set('counterparty_name', e.target.value)} placeholder="Full name" style={{ ...inp, marginBottom: 12 }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink2, marginBottom: 6 }}>Their email <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
              <input value={form.counterparty_email} onChange={e => set('counterparty_email', e.target.value)} placeholder="email@example.com" type="email" style={{ ...inp, marginBottom: 12 }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink2, marginBottom: 6 }}>Due date <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
              <input value={form.due_date} onChange={e => set('due_date', e.target.value)} type="date" style={{ ...inp, marginBottom: 20 }} />
              <button onClick={() => setStep(2)} style={{ width: '100%', padding: 13, borderRadius: 100, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(255,59,48,0.3)' }}>Next →</button>
            </>
          )}

          {step === 2 && (
            <>
              {/* You deliver */}
              <div style={{ background: D ? 'rgba(48,209,88,0.08)' : 'rgba(48,209,88,0.05)', border: `0.5px solid ${D ? 'rgba(48,209,88,0.2)' : 'rgba(48,209,88,0.15)'}`, borderRadius: 16, padding: 14, marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a7a35', marginBottom: 10 }}>What YOU deliver</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: ink2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>What you're giving *</p>
                <textarea value={form.you_deliver} onChange={e => set('you_deliver', e.target.value)} placeholder="e.g. 3 logo concepts with unlimited revisions, as AI + PNG files" rows={3} style={{ ...inp, resize: 'vertical', marginBottom: 10 }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: ink2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Estimated value</p>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: ink2, fontSize: 14 }}>$</span>
                  <input value={form.you_deliver_value} onChange={e => set('you_deliver_value', e.target.value)} placeholder="0" type="number" style={{ ...inp, paddingLeft: 28 }} />
                </div>
              </div>
              {/* They deliver */}
              <div style={{ background: D ? 'rgba(255,59,48,0.07)' : 'rgba(255,59,48,0.04)', border: `0.5px solid ${D ? 'rgba(255,59,48,0.18)' : 'rgba(255,59,48,0.12)'}`, borderRadius: 16, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#cc2018', marginBottom: 10 }}>What THEY deliver</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: ink2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>What they're giving *</p>
                <textarea value={form.they_deliver} onChange={e => set('they_deliver', e.target.value)} placeholder="e.g. Full landing page in Next.js, mobile responsive, deployed to Vercel" rows={3} style={{ ...inp, resize: 'vertical', marginBottom: 10 }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: ink2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Estimated value</p>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: ink2, fontSize: 14 }}>$</span>
                  <input value={form.they_deliver_value} onChange={e => set('they_deliver_value', e.target.value)} placeholder="0" type="number" style={{ ...inp, paddingLeft: 28 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} style={{ padding: '13px 18px', borderRadius: 100, border: `0.5px solid ${D ? 'rgba(255,255,255,0.15)' : 'rgba(28,28,46,0.15)'}`, background: 'transparent', color: ink2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: 13, borderRadius: 100, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Next →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: ink2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Notes or extra terms</p>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any other terms both parties should know…" rows={3} style={{ ...inp, resize: 'vertical', marginBottom: 14 }} />
              {/* Preview */}
              <div style={{ background: D ? 'rgba(255,59,48,0.07)' : 'rgba(255,59,48,0.04)', border: `0.5px solid ${D ? 'rgba(255,59,48,0.2)' : 'rgba(255,59,48,0.14)'}`, borderRadius: 14, padding: '13px 15px', marginBottom: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff3b30', marginBottom: 8 }}>Agreement preview</p>
                <p style={{ fontSize: 12, color: ink2, lineHeight: 1.8 }}>
                  <strong style={{ color: ink }}>&ldquo;{form.title || 'Your trade'}&rdquo;</strong><br />
                  Between you and <strong style={{ color: ink }}>{form.counterparty_name || 'them'}</strong><br /><br />
                  <strong>You deliver:</strong> {form.you_deliver || '—'}{form.you_deliver_value ? ` · est. $${form.you_deliver_value}` : ''}<br />
                  <strong>They deliver:</strong> {form.they_deliver || '—'}{form.they_deliver_value ? ` · est. $${form.they_deliver_value}` : ''}
                </p>
              </div>
              <div style={{ background: D ? 'rgba(48,209,88,0.07)' : 'rgba(48,209,88,0.05)', border: `0.5px solid ${D ? 'rgba(48,209,88,0.2)' : 'rgba(48,209,88,0.15)'}`, borderRadius: 12, padding: '10px 13px', marginBottom: 14, fontSize: 12, color: ink2, lineHeight: 1.6 }}>
                🔒 This agreement gets a timestamp when saved — a legal record of what was agreed and when.
              </div>
              {error && <div style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#cc2018', marginBottom: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={{ padding: '13px 18px', borderRadius: 100, border: `0.5px solid ${D ? 'rgba(255,255,255,0.15)' : 'rgba(28,28,46,0.15)'}`, background: 'transparent', color: ink2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                <button onClick={save} disabled={loading} style={{ flex: 1, padding: 13, borderRadius: 100, background: loading ? 'rgba(255,59,48,0.3)' : 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(255,59,48,0.3)' }}>
                  {loading ? 'Saving…' : '🤝 Create agreement →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Trade card ────────────────────────────────────────────────
function TradeCard({ trade, onUpdate, mode }) {
  const D = mode === 'dark';
  const ink = D ? '#fff' : '#1c1c1e';
  const ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(28,28,30,0.5)';
  const ink3 = D ? 'rgba(255,255,255,0.28)' : 'rgba(28,28,30,0.32)';
  const sep = D ? 'rgba(255,255,255,0.08)' : 'rgba(28,28,46,0.07)';
  const cfg = STATUS_COLORS[trade.status] || STATUS_COLORS.active;
  const isActive = ['active', 'awaiting_you', 'awaiting_them'].includes(trade.status);
  const daysLeft = trade.due_date ? Math.ceil((new Date(trade.due_date).getTime() - Date.now()) / 86400000) : null;

  const markDelivered = async (side) => {
    const field = side === 'you' ? 'you_delivered' : 'they_delivered';
    const newVal = !trade[field];
    const bothDone = side === 'you' ? (newVal && trade.they_delivered) : (trade.you_delivered && newVal);
    const updates = { [field]: newVal };
    if (bothDone) { updates.status = 'completed'; updates.completed_at = new Date().toISOString(); }
    else if (newVal && side === 'you') updates.status = 'awaiting_them';
    else if (newVal && side === 'them') updates.status = 'awaiting_you';
    else updates.status = 'active';
    const { data } = await supabase.from('barter_trades').update(updates).eq('id', trade.id).select().single();
    if (data) onUpdate(data);
  };

  return (
    <div style={{ background: D ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.58)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)'}`, borderRadius: 18, padding: '16px 18px', marginBottom: 10, position: 'relative', overflow: 'hidden', boxShadow: D ? '0 8px 32px rgba(0,0,0,0.3)' : '0 6px 20px rgba(0,0,0,0.07)' }}>
      {isActive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg,transparent,${cfg.color},transparent)` }} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: ink, letterSpacing: '-0.3px', margin: 0 }}>{trade.title}</p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: cfg.bg, border: `0.5px solid ${cfg.border}`, color: cfg.color }}>{cfg.label}</span>
          </div>
          <p style={{ fontSize: 11, color: ink3, margin: 0 }}>
            With {trade.counterparty_name} · {new Date(trade.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {daysLeft !== null && isActive && <span style={{ marginLeft: 6, color: daysLeft < 3 ? '#ff3b30' : ink3, fontWeight: daysLeft < 3 ? 700 : 400 }}>· {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}</span>}
          </p>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: ink3, flexShrink: 0 }}>{trade.agreement_id}</span>
      </div>

      {/* Exchange */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: D ? 'rgba(255,255,255,0.04)' : 'rgba(28,28,46,0.03)', border: `0.5px solid ${sep}`, borderRadius: 14, padding: '11px 13px', marginBottom: 12 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: ink3, margin: '0 0 3px' }}>You deliver</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: ink, margin: '0 0 5px' }}>{trade.you_deliver}</p>
          {trade.you_deliver_value > 0 && <p style={{ fontSize: 10, color: ink3, margin: '0 0 6px' }}>Est. ${trade.you_deliver_value.toLocaleString()}</p>}
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: trade.you_delivered ? 'rgba(48,209,88,0.1)' : 'rgba(255,149,0,0.1)', border: `0.5px solid ${trade.you_delivered ? 'rgba(48,209,88,0.3)' : 'rgba(255,149,0,0.3)'}`, color: trade.you_delivered ? '#1a7a35' : '#b45309' }}>
            {trade.you_delivered ? '✓ Done' : '⏳ Pending'}
          </span>
        </div>
        <span style={{ fontSize: 16, color: ink3, flexShrink: 0 }}>⇄</span>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: ink3, margin: '0 0 3px' }}>They deliver</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: ink, margin: '0 0 5px' }}>{trade.they_deliver}</p>
          {trade.they_deliver_value > 0 && <p style={{ fontSize: 10, color: ink3, margin: '0 0 6px' }}>Est. ${trade.they_deliver_value.toLocaleString()}</p>}
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: trade.they_delivered ? 'rgba(48,209,88,0.1)' : 'rgba(10,132,255,0.1)', border: `0.5px solid ${trade.they_delivered ? 'rgba(48,209,88,0.3)' : 'rgba(10,132,255,0.2)'}`, color: trade.they_delivered ? '#1a7a35' : '#0a84ff' }}>
            {trade.they_delivered ? '✓ Done' : '⏳ Pending'}
          </span>
        </div>
      </div>

      {/* Notes */}
      {trade.notes && <p style={{ fontSize: 12, color: ink2, background: D ? 'rgba(255,255,255,0.04)' : 'rgba(28,28,46,0.03)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, lineHeight: 1.5 }}>📝 {trade.notes}</p>}

      {/* Actions */}
      {isActive && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {!trade.you_delivered && <button onClick={() => markDelivered('you')} style={{ flex: 1, padding: '9px 12px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>✓ Mark mine delivered</button>}
          {!trade.they_delivered && <button onClick={() => markDelivered('them')} style={{ flex: 1, padding: '9px 12px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#0a84ff,#34aadc)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>✓ Mark theirs received</button>}
          <button style={{ padding: '9px 12px', borderRadius: 100, border: `0.5px solid rgba(255,59,48,0.2)`, background: 'rgba(255,59,48,0.06)', color: '#cc2018', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⚠ Flag</button>
        </div>
      )}
      {trade.status === 'completed' && <p style={{ fontSize: 12, color: '#1a7a35', fontWeight: 600 }}>✓ Trade completed {trade.completed_at ? new Date(trade.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>}
    </div>
  );
}

// ── Post listing modal ────────────────────────────────────────
function PostListingModal({ onClose, onPosted, mode }) {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [category, setCategory] = useState('');
  const [offer,    setOffer]    = useState('');
  const [want,     setWant]     = useState('');
  const [value,    setValue]    = useState('');
  const [desc,     setDesc]     = useState('');

  const D = mode === 'dark';
  const ink = D ? '#fff' : '#1c1c1e';
  const ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(28,28,30,0.5)';
  const inp = { width: '100%', padding: '11px 14px', borderRadius: 12, border: `1px solid ${D ? 'rgba(255,255,255,0.12)' : 'rgba(28,28,46,0.12)'}`, background: D ? 'rgba(255,255,255,0.07)' : 'rgba(28,28,46,0.03)', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: ink, boxSizing: 'border-box' };

  const post = async () => {
    if (!offer || !want || !category) { setError('Fill in all required fields and choose a category.'); return; }
    setLoading(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { data, error: dbErr } = await supabase.from('barter_listings').insert({
        user_id: user.id, what_i_offer: offer, what_i_want: want,
        category, estimated_value: parseFloat(value) || null,
        description: desc || null, status: 'open', is_public: true,
      }).select().single();
      if (dbErr) throw dbErr;
      onPosted(data); onClose();
    } catch (e) { setError(e.message); setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)', padding: '0 16px 24px' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 500, background: D ? 'rgba(14,14,22,0.98)' : 'rgba(255,255,255,0.97)', backdropFilter: 'blur(40px)', border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'}`, borderRadius: '24px 24px 18px 18px', overflow: 'hidden' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#30d158,#0a84ff,#30d158)', backgroundSize: '200% auto', animation: 'rainbowAnim 3s linear infinite' }} />
        <div style={{ padding: '20px 22px 28px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: '50%', background: D ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer', fontSize: 12, color: ink2 }}>✕</button>
          <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 900, color: ink, marginBottom: 4, letterSpacing: '-0.5px' }}>Post to the community board</p>
          <p style={{ fontSize: 12, color: ink2, lineHeight: 1.5, marginBottom: 20 }}>Visible publicly at gratiacore.com/barter. Remove any time.</p>

          <p style={{ fontSize: 11, fontWeight: 700, color: ink2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>I&apos;m offering *</p>
          <input value={offer} onChange={e => setOffer(e.target.value)} placeholder="e.g. Logo design, 3 concepts + revisions" style={{ ...inp, marginBottom: 12 }} />

          <p style={{ fontSize: 11, fontWeight: 700, color: ink2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>In exchange for *</p>
          <input value={want} onChange={e => setWant(e.target.value)} placeholder="e.g. Next.js development, SEO audit…" style={{ ...inp, marginBottom: 12 }} />

          <p style={{ fontSize: 11, fontWeight: 700, color: ink2, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Category *</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {CATEGORIES.map(c => {
              const col = CAT_COLORS[c] || {};
              return (
                <button key={c} onClick={() => setCategory(c)} style={{ padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `0.5px solid`, fontFamily: 'inherit', background: category === c ? col.bg : D ? 'rgba(255,255,255,0.06)' : 'rgba(28,28,46,0.04)', borderColor: category === c ? col.border : D ? 'rgba(255,255,255,0.1)' : 'rgba(28,28,46,0.1)', color: category === c ? col.color : ink2, fontWeight: category === c ? 700 : 500 }}>{c}</button>
              );
            })}
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, color: ink2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Estimated value <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: ink2, fontSize: 14 }}>$</span>
            <input value={value} onChange={e => setValue(e.target.value)} placeholder="0" type="number" style={{ ...inp, paddingLeft: 28 }} />
          </div>

          {error && <div style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#cc2018', marginBottom: 12 }}>{error}</div>}

          <button onClick={post} disabled={loading} style={{ width: '100%', padding: 13, borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(48,209,88,0.3)' }}>
            {loading ? 'Posting…' : '🤝 Post to community board →'}
          </button>
          <p style={{ fontSize: 11, textAlign: 'center', color: ink2, marginTop: 10 }}>Visible at <strong>gratiacore.com/barter</strong> · Remove any time</p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function DashboardBarterPage() {
  const router  = useRouter();
  const [user,          setUser]          = useState(null);
  const [trades,        setTrades]        = useState([]);
  const [listings,      setListings]      = useState([]);
  const [myListings,    setMyListings]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState('browse');
  const [mode,          setMode]          = useState('light');
  const [showNewTrade,  setShowNewTrade]  = useState(false);
  const [showPostListing, setShowPostListing] = useState(false);
  const [catFilter,     setCatFilter]     = useState('all');
  const [tradeFilter,   setTradeFilter]   = useState('all');

  const D    = mode === 'dark';
  const ink  = D ? '#fff' : '#1c1c1e';
  const ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(28,28,30,0.5)';
  const ink3 = D ? 'rgba(255,255,255,0.28)' : 'rgba(28,28,30,0.32)';
  const sep  = D ? 'rgba(255,255,255,0.08)' : 'rgba(28,28,46,0.07)';
  const glass = D ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.58)';
  const glassBdr = D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)';
  const bg = D
    ? 'radial-gradient(ellipse 70% 60% at 20% -10%,rgba(48,209,88,0.15) 0%,transparent 60%),#08080f'
    : 'radial-gradient(ellipse 80% 60% at 15% -10%,rgba(48,209,88,0.14) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 85% 110%,rgba(255,59,48,0.08) 0%,transparent 60%),#e8eef5';

  useEffect(() => {
    const saved = localStorage.getItem('gc_dash_mode');
    if (saved) setMode(saved);
    // Check for ?request= param (coming from public board)
    const params = new URLSearchParams(window.location.search);
    if (params.get('request')) setTab('browse');
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUser(user);

      // Load trades
      const { data: tradeData } = await supabase
        .from('barter_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTrades(tradeData || []);

      // Load community listings
      const { data: listingData } = await supabase
        .from('barter_listings')
        .select('*, profiles(first_name, barter_rating, barter_trades_count)')
        .eq('is_public', true)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      setListings(listingData || []);

      // Load my listings
      const { data: myData } = await supabase
        .from('barter_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setMyListings(myData || []);

      setLoading(false);
    };
    init();
  }, [router]);

  const active    = trades.filter(t => ['active', 'awaiting_you', 'awaiting_them'].includes(t.status));
  const completed = trades.filter(t => t.status === 'completed');
  const totalValue = active.reduce((s, t) => s + (t.you_deliver_value || 0), 0);

  const filteredListings = listings.filter(l =>
    (catFilter === 'all' || l.category === catFilter) &&
    l.user_id !== user?.id  // Don't show own listings
  );

  const filteredTrades = tradeFilter === 'all' ? trades : tradeFilter === 'active' ? active : completed;

  const cardStyle = {
    background: glass,
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: `1px solid ${glassBdr}`,
    borderRadius: 18,
    boxShadow: D ? '0 8px 32px rgba(0,0,0,0.3)' : '0 6px 20px rgba(0,0,0,0.07)',
  };

  const avatarColors = ['linear-gradient(135deg,#0a84ff,#34aadc)', 'linear-gradient(135deg,#7c3aed,#bf5af2)', 'linear-gradient(135deg,#ff9500,#ff6b00)', 'linear-gradient(135deg,#30d158,#1a7a35)', 'linear-gradient(135deg,#ff3b30,#ff6b35)'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
        @keyframes rainbowAnim{to{background-position:200% center;}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        .tab-btn{padding:8px 16px;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;border:0.5px solid;transition:all 0.2s;font-family:'DM Sans',sans-serif;white-space:nowrap;}
        .cat-f{padding:5px 12px;border-radius:100px;font-size:11px;font-weight:500;cursor:pointer;border:0.5px solid;transition:all 0.18s;font-family:'DM Sans',sans-serif;white-space:nowrap;}
        .listing-hover{transition:transform 0.15s,box-shadow 0.15s;}
        .listing-hover:hover{transform:translateY(-2px);}
      `}</style>

      <div style={{ minHeight: '100vh', background: bg, backgroundAttachment: 'fixed', color: ink, fontFamily: "'DM Sans',sans-serif", paddingBottom: 60 }}>

        {/* Header */}
        <header style={{ background: D ? 'rgba(8,8,15,0.88)' : 'rgba(255,255,255,0.6)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderBottom: `0.5px solid ${sep}`, padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#34aadc,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowAnim 3s linear infinite' }} />

          <Link href="/dashboard/personal" style={{ display: 'flex', alignItems: 'center', gap: 5, color: ink3, textDecoration: 'none', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>← Dashboard</Link>
          <div style={{ width: '0.5px', height: 14, background: sep }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 28, height: 32, position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', bottom: 0, left: 3, right: 3, height: 27, borderRadius: 9, background: '#0d5c28' }} />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 27, borderRadius: 9, background: 'linear-gradient(135deg,#30d158,#1a7a35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: '1px solid rgba(255,255,255,0.35)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}>🤝</div>
            </div>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 800, color: ink, letterSpacing: '-0.3px' }}>Barter Exchange</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Stats */}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ background: 'rgba(48,209,88,0.1)', border: '0.5px solid rgba(48,209,88,0.2)', borderRadius: 100, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 900, color: '#1a7a35' }}>{active.length}</span>
              <span style={{ fontSize: 10, color: ink3 }}>active</span>
            </div>
            <div style={{ background: 'rgba(10,132,255,0.1)', border: '0.5px solid rgba(10,132,255,0.2)', borderRadius: 100, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 900, color: '#0a84ff' }}>{listings.length}</span>
              <span style={{ fontSize: 10, color: ink3 }}>board</span>
            </div>
          </div>

          <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} style={{ background: D ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)', border: `0.5px solid ${glassBdr}`, borderRadius: 100, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: ink3, fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 }}>
            {D ? '☀️' : '🌙'}
          </button>

          <Link href="/barter" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: D ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)', border: `0.5px solid ${glassBdr}`, borderRadius: 100, color: ink3, textDecoration: 'none', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
            Public board ↗
          </Link>
        </header>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { key: 'browse', label: '🌐 Browse board' },
              { key: 'mine',   label: `My trades (${trades.length})` },
              { key: 'listings', label: `My listings (${myListings.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className="tab-btn" style={{
                background: tab === t.key ? 'linear-gradient(135deg,#30d158,#1a7a35)' : glass,
                borderColor: tab === t.key ? 'rgba(48,209,88,0.4)' : glassBdr,
                color: tab === t.key ? '#fff' : ink2,
                boxShadow: tab === t.key ? '0 4px 12px rgba(48,209,88,0.3)' : 'none',
              }}>{t.label}</button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowNewTrade(true)} style={{ padding: '8px 14px', borderRadius: 100, background: D ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)', border: `0.5px solid ${glassBdr}`, color: ink2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>+ Private agreement</button>
            <button onClick={() => setShowPostListing(true)} style={{ padding: '8px 16px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 10px rgba(48,209,88,0.28)', whiteSpace: 'nowrap' }}>+ Post listing</button>
          </div>

          {/* ── BROWSE TAB ── */}
          {tab === 'browse' && (
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={() => setCatFilter('all')} className="cat-f" style={{ background: catFilter === 'all' ? ink : glass, borderColor: catFilter === 'all' ? ink : glassBdr, color: catFilter === 'all' ? D ? '#000' : '#fff' : ink2 }}>All</button>
                {CATEGORIES.map(c => {
                  const col = CAT_COLORS[c] || {};
                  const isActive = catFilter === c;
                  return <button key={c} onClick={() => setCatFilter(c)} className="cat-f" style={{ background: isActive ? col.bg : glass, borderColor: isActive ? col.border : glassBdr, color: isActive ? col.color : ink2, fontWeight: isActive ? 700 : 500 }}>{c}</button>;
                })}
              </div>

              {filteredListings.length === 0 ? (
                <div style={{ ...cardStyle, padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🤝</div>
                  <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink, marginBottom: 6 }}>No listings yet</p>
                  <p style={{ fontSize: 13, color: ink2, marginBottom: 16 }}>Be the first to post — your listing goes on the public board at gratiacore.com/barter.</p>
                  <button onClick={() => setShowPostListing(true)} style={{ padding: '10px 22px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Post the first listing →</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                  {filteredListings.map((listing, i) => {
                    const cat = CAT_COLORS[listing.category] || CAT_COLORS.Other;
                    const name = listing.profiles?.first_name || 'Member';
                    const rating = listing.profiles?.barter_rating || 5.0;
                    const tradeCount = listing.profiles?.barter_trades_count || 0;
                    const avatarBg = avatarColors[name.charCodeAt(0) % avatarColors.length];
                    return (
                      <div key={listing.id} className="listing-hover" style={{ ...cardStyle, padding: '14px 15px', animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{name[0].toUpperCase()}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: ink, margin: 0 }}>{name}</p>
                            <p style={{ fontSize: 10, color: ink3, margin: 0 }}>⭐ {rating.toFixed(1)} · {tradeCount} trade{tradeCount !== 1 ? 's' : ''}</p>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: cat.bg, color: cat.color, border: `0.5px solid ${cat.border}`, flexShrink: 0 }}>{listing.category}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                          <div style={{ flex: 1, background: D ? 'rgba(48,209,88,0.07)' : 'rgba(48,209,88,0.06)', border: '0.5px solid rgba(48,209,88,0.18)', borderRadius: 10, padding: '8px 9px' }}>
                            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a7a35', margin: '0 0 3px' }}>Offering</p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: ink, margin: 0, lineHeight: 1.3 }}>{listing.what_i_offer}</p>
                            {listing.estimated_value && <p style={{ fontSize: 10, color: ink3, margin: '3px 0 0' }}>~${listing.estimated_value.toLocaleString()}</p>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: ink3, flexShrink: 0 }}>⇄</div>
                          <div style={{ flex: 1, background: D ? 'rgba(255,59,48,0.06)' : 'rgba(255,59,48,0.05)', border: '0.5px solid rgba(255,59,48,0.14)', borderRadius: 10, padding: '8px 9px' }}>
                            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#cc2018', margin: '0 0 3px' }}>Wants</p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: ink, margin: 0, lineHeight: 1.3 }}>{listing.what_i_want}</p>
                          </div>
                        </div>
                        <button onClick={() => setShowNewTrade(true)} style={{ width: '100%', padding: '9px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 10px rgba(48,209,88,0.25)' }}>
                          Request this trade →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MY TRADES TAB ── */}
          {tab === 'mine' && (
            <div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
                {[
                  { label: 'Active trades', val: active.length,    color: '#1c1c1e' },
                  { label: 'Completed',     val: completed.length, color: '#30d158' },
                  { label: 'Total value',   val: totalValue > 0 ? `$${totalValue.toLocaleString()}` : '—', color: '#ff9500' },
                ].map(s => (
                  <div key={s.label} style={{ ...cardStyle, padding: '12px 14px', textAlign: 'center', borderRadius: 14 }}>
                    <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: s.color, margin: '0 0 3px', letterSpacing: '-0.8px' }}>{s.val}</p>
                    <p style={{ fontSize: 11, color: ink3, margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Filter */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {[['all','All'],['active','Active'],['completed','Completed']].map(([v,l]) => (
                  <button key={v} onClick={() => setTradeFilter(v)} className="tab-btn" style={{ background: tradeFilter === v ? glass : 'transparent', borderColor: tradeFilter === v ? glassBdr : 'transparent', color: tradeFilter === v ? ink : ink3, fontWeight: tradeFilter === v ? 600 : 400 }}>{l}</button>
                ))}
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: ink3 }}>Loading…</div>
              ) : trades.length === 0 ? (
                <div style={{ ...cardStyle, padding: '36px 24px', textAlign: 'center', borderRadius: 18 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                  <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink, marginBottom: 6 }}>No trade agreements yet</p>
                  <p style={{ fontSize: 13, color: ink2, marginBottom: 16, lineHeight: 1.6, maxWidth: 340, margin: '0 auto 16px' }}>Document a barter before work starts. Both sides, clear terms, timestamped proof.</p>
                  <button onClick={() => setShowNewTrade(true)} style={{ padding: '10px 22px', borderRadius: 100, background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Create first agreement →</button>
                </div>
              ) : (
                filteredTrades.map((trade, i) => (
                  <div key={trade.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                    <TradeCard trade={trade} onUpdate={updated => setTrades(p => p.map(t => t.id === updated.id ? updated : t))} mode={mode} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── MY LISTINGS TAB ── */}
          {tab === 'listings' && (
            <div>
              {myListings.length === 0 ? (
                <div style={{ ...cardStyle, padding: '36px 24px', textAlign: 'center', borderRadius: 18 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📢</div>
                  <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink, marginBottom: 6 }}>No listings posted yet</p>
                  <p style={{ fontSize: 13, color: ink2, marginBottom: 16, lineHeight: 1.6 }}>Post your skills to the community board. Anyone can find it at gratiacore.com/barter.</p>
                  <button onClick={() => setShowPostListing(true)} style={{ padding: '10px 22px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Post your first listing →</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {myListings.map((listing, i) => {
                    const cat = CAT_COLORS[listing.category] || CAT_COLORS.Other;
                    return (
                      <div key={listing.id} style={{ ...cardStyle, padding: '14px 16px', borderRadius: 16, animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: ink, margin: 0, letterSpacing: '-0.3px' }}>{listing.what_i_offer}</p>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: listing.status === 'open' ? 'rgba(48,209,88,0.1)' : 'rgba(28,28,46,0.06)', color: listing.status === 'open' ? '#1a7a35' : ink3, border: `0.5px solid ${listing.status === 'open' ? 'rgba(48,209,88,0.25)' : 'rgba(28,28,46,0.1)'}` }}>{listing.status === 'open' ? '● Open' : 'Closed'}</span>
                            </div>
                            <p style={{ fontSize: 12, color: ink3, margin: 0 }}>Wants: <strong style={{ color: ink2 }}>{listing.what_i_want}</strong></p>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: cat.bg, color: cat.color, border: `0.5px solid ${cat.border}`, flexShrink: 0 }}>{listing.category}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {listing.estimated_value && <span style={{ fontSize: 11, color: ink3 }}>Est. ${listing.estimated_value.toLocaleString()}</span>}
                          <span style={{ fontSize: 11, color: ink3 }}>· {listing.views || 0} views</span>
                          <div style={{ flex: 1 }} />
                          <button onClick={async () => {
                            await supabase.from('barter_listings').update({ status: listing.status === 'open' ? 'closed' : 'open' }).eq('id', listing.id);
                            setMyListings(p => p.map(l => l.id === listing.id ? { ...l, status: l.status === 'open' ? 'closed' : 'open' } : l));
                          }} style={{ padding: '5px 12px', borderRadius: 100, border: `0.5px solid ${glassBdr}`, background: glass, color: ink2, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {listing.status === 'open' ? 'Close listing' : 'Reopen'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Legal */}
          <p style={{ fontSize: 11, color: ink3, textAlign: 'center', marginTop: 32, lineHeight: 1.7 }}>
            Barter agreements create a record — not a legally binding contract.<br />
            For high-value trades, consult an attorney. · <Link href="/terms" style={{ color: ink3 }}>Terms</Link> · <Link href="/privacy" style={{ color: ink3 }}>Privacy</Link>
          </p>
        </div>
      </div>

      {showNewTrade    && <NewTradeModal    onClose={() => setShowNewTrade(false)}    onCreated={t => setTrades(p => [t, ...p])} mode={mode} />}
      {showPostListing && <PostListingModal onClose={() => setShowPostListing(false)} onPosted={l => setMyListings(p => [l, ...p])} mode={mode} />}
    </>
  );
}