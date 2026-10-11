'use client';
// @ts-nocheck
// app/dashboard/barter/page.tsx — Barter AGREEMENT TRACKER (no marketplace).
// Log a trade, send the counterparty a one-time confirm link, track delivery to completion.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const STATUS = {
  draft:     { label: '✏️ Draft',            color: '#7a4800', bg: 'rgba(255,159,10,.1)',  bd: 'rgba(255,159,10,.3)' },
  sent:      { label: '📤 Awaiting confirm',  color: '#0a84ff', bg: 'rgba(10,132,255,.1)',  bd: 'rgba(10,132,255,.25)' },
  confirmed: { label: '✓ Confirmed',          color: '#1a7a35', bg: 'rgba(48,209,88,.1)',   bd: 'rgba(48,209,88,.3)' },
  completed: { label: '✓ Completed',          color: '#1a7a35', bg: 'rgba(48,209,88,.14)',  bd: 'rgba(48,209,88,.35)' },
  declined:  { label: '✕ Declined',           color: '#cc2018', bg: 'rgba(255,59,48,.1)',   bd: 'rgba(255,59,48,.25)' },
};

function NewAgreementModal({ onClose, onCreated, existing }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!existing;
  const [f, setF] = useState({
    title: existing?.title || '', counterparty_name: existing?.counterparty_name || '', counterparty_email: existing?.counterparty_email || '',
    you_deliver: existing?.you_deliver || '', you_deliver_value: existing?.you_deliver_value ? String(existing.you_deliver_value) : '',
    they_deliver: existing?.they_deliver || '', they_deliver_value: existing?.they_deliver_value ? String(existing.they_deliver_value) : '',
    due_date: existing?.due_date || '', notes: existing?.notes || '',
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const inp = { width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(28,28,46,.12)', background: 'rgba(28,28,46,.03)', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#1a1a2e', boxSizing: 'border-box' };
  const lbl = { fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(28,28,30,.5)', marginBottom: 6 };

  const save = async () => {
    if (!f.title || !f.counterparty_name || !f.you_deliver || !f.they_deliver) { setError('Fill in all required fields.'); return; }
    setLoading(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const fields = {
        title: f.title, counterparty_name: f.counterparty_name,
        counterparty_email: f.counterparty_email || null,
        you_deliver: f.you_deliver, they_deliver: f.they_deliver,
        you_deliver_value: parseFloat(f.you_deliver_value) || 0,
        they_deliver_value: parseFloat(f.they_deliver_value) || 0,
        due_date: f.due_date || null, notes: f.notes || null,
      };
      let data, dbErr;
      if (isEdit) {
        // Editing reverts the agreement to draft so it can be re-sent with the new terms.
        ({ data, error: dbErr } = await supabase.from('barter_agreements')
          .update({ ...fields, status: 'draft', confirm_token: null, token_expires_at: null })
          .eq('id', existing.id).select().single());
      } else {
        ({ data, error: dbErr } = await supabase.from('barter_agreements')
          .insert({ user_id: user.id, ...fields, status: 'draft', you_delivered: false, they_delivered: false })
          .select().single());
      }
      if (dbErr) throw dbErr;
      onCreated(data); onClose();
    } catch (e) { setError(e.message); setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(16px)', padding: '0 16px 24px' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 540, background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,.9)', borderRadius: '24px 24px 18px 18px', overflow: 'hidden', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#30d158,#0a84ff,#30d158)' }} />
        <div style={{ padding: '20px 22px 28px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.07)', border: 'none', cursor: 'pointer', fontSize: 12 }}>✕</button>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,.1)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#1a7a35', marginBottom: 4 }}>{isEdit ? 'Edit agreement' : 'New agreement'}</p>
          <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 900, color: '#1a1a2e', marginBottom: 4, letterSpacing: '-.5px' }}>{isEdit ? 'Update the trade' : 'Log a trade'}</p>
          <p style={{ fontSize: 12, color: 'rgba(28,28,30,.5)', lineHeight: 1.6, marginBottom: 20 }}>Record the deal before work starts. Both sides, clear terms, timestamped.</p>

          <div style={{ display: 'flex', gap: 5, marginBottom: 22 }}>
            {[1, 2, 3].map(n => <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= n ? '#30d158' : 'rgba(28,28,46,.1)' }} />)}
          </div>

          {step === 1 && <>
            <p style={lbl}>Trade title *</p>
            <input value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Logo design for web development" style={{ ...inp, marginBottom: 12 }} />
            <p style={lbl}>Other person&apos;s name *</p>
            <input value={f.counterparty_name} onChange={e => set('counterparty_name', e.target.value)} placeholder="Full name" style={{ ...inp, marginBottom: 12 }} />
            <p style={lbl}>Their email <span style={{ fontWeight: 400, textTransform: 'none' }}>(needed to send a confirmation)</span></p>
            <input value={f.counterparty_email} onChange={e => set('counterparty_email', e.target.value)} type="email" placeholder="email@example.com" style={{ ...inp, marginBottom: 12 }} />
            <p style={lbl}>Due date <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
            <input value={f.due_date} onChange={e => set('due_date', e.target.value)} type="date" style={{ ...inp, marginBottom: 20 }} />
            <button onClick={() => setStep(2)} style={{ width: '100%', padding: 13, borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Next →</button>
          </>}

          {step === 2 && <>
            <div style={{ background: 'rgba(48,209,88,.05)', border: '.5px solid rgba(48,209,88,.15)', borderRadius: 16, padding: 14, marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#1a7a35', marginBottom: 10 }}>What YOU deliver</p>
              <textarea value={f.you_deliver} onChange={e => set('you_deliver', e.target.value)} placeholder="e.g. 3 logo concepts + unlimited revisions" rows={3} style={{ ...inp, resize: 'vertical', marginBottom: 10 }} />
              <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(28,28,30,.5)' }}>$</span><input value={f.you_deliver_value} onChange={e => set('you_deliver_value', e.target.value)} type="number" placeholder="Est. value" style={{ ...inp, paddingLeft: 28 }} /></div>
            </div>
            <div style={{ background: 'rgba(255,59,48,.04)', border: '.5px solid rgba(255,59,48,.12)', borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#cc2018', marginBottom: 10 }}>What THEY deliver</p>
              <textarea value={f.they_deliver} onChange={e => set('they_deliver', e.target.value)} placeholder="e.g. Landing page in Next.js, deployed" rows={3} style={{ ...inp, resize: 'vertical', marginBottom: 10 }} />
              <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(28,28,30,.5)' }}>$</span><input value={f.they_deliver_value} onChange={e => set('they_deliver_value', e.target.value)} type="number" placeholder="Est. value" style={{ ...inp, paddingLeft: 28 }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(1)} style={{ padding: '13px 18px', borderRadius: 100, border: '.5px solid rgba(28,28,46,.15)', background: 'transparent', color: 'rgba(28,28,30,.5)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: 13, borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Next →</button>
            </div>
          </>}

          {step === 3 && <>
            <p style={lbl}>Notes or extra terms</p>
            <textarea value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Anything else both parties should know…" rows={3} style={{ ...inp, resize: 'vertical', marginBottom: 14 }} />
            <div style={{ background: 'rgba(48,209,88,.05)', border: '.5px solid rgba(48,209,88,.15)', borderRadius: 12, padding: '10px 13px', marginBottom: 14, fontSize: 12, color: 'rgba(28,28,30,.5)', lineHeight: 1.6 }}>
              🔒 Saved with a timestamp. Next, send it to {f.counterparty_name || 'the other person'} to confirm — that turns it into a mutually agreed record.
            </div>
            {error && <div style={{ background: 'rgba(255,59,48,.08)', border: '1px solid rgba(255,59,48,.2)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#cc2018', marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(2)} style={{ padding: '13px 18px', borderRadius: 100, border: '.5px solid rgba(28,28,46,.15)', background: 'transparent', color: 'rgba(28,28,30,.5)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
              <button onClick={save} disabled={loading} style={{ flex: 1, padding: 13, borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{loading ? 'Saving…' : '🤝 Create agreement →'}</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

function AgreementCard({ ag, onUpdate, onEdit }) {
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailNote, setEmailNote] = useState('');
  const cfg = STATUS[ag.status] || STATUS.draft;
  const isConfirmed = ag.status === 'confirmed' || ag.status === 'completed';
  const daysLeft = ag.due_date ? Math.ceil((new Date(ag.due_date).getTime() - Date.now()) / 86400000) : null;

  const sendForConfirm = async () => {
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/barter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ agreementId: ag.id }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed');
      onUpdate(data.agreement);
      if (data.confirm_url) { await navigator.clipboard?.writeText(data.confirm_url).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2500); }
      // Tell the user whether the email actually went out, and give them the link either way.
      if (data.emailed === false) {
        setEmailNote(`Email didn't send${data.email_error ? ` (${data.email_error})` : ''} — the confirm link is copied to your clipboard, paste it to them directly.`);
      } else {
        setEmailNote(`Email sent to ${ag.counterparty_email}. Link also copied to your clipboard.`);
      }
    } catch (e) { setEmailNote(e.message || 'Something went wrong.'); }
    setSending(false);
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
    <div style={{ background: 'rgba(255,255,255,.62)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,.85)', borderRadius: 18, padding: '16px 18px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>{ag.title}</p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: cfg.bg, border: `.5px solid ${cfg.bd}`, color: cfg.color }}>{cfg.label}</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(28,28,30,.4)', margin: 0 }}>
            With {ag.counterparty_name} · {new Date(ag.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {daysLeft !== null && !isConfirmed && <span style={{ marginLeft: 6, color: daysLeft < 3 ? '#ff3b30' : 'rgba(28,28,30,.4)' }}>· {daysLeft > 0 ? `${daysLeft}d left` : 'overdue'}</span>}
          </p>
          {ag.counterparty_email && <p style={{ fontSize: 11, color: 'rgba(28,28,30,.4)', margin: '2px 0 0' }}>✉️ Sent to {ag.counterparty_email}</p>}
        </div>
        {ag.confirmed_at && <span style={{ fontSize: 10, color: '#1a7a35', fontWeight: 700, flexShrink: 0 }}>✓ {new Date(ag.confirmed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(28,28,46,.03)', border: '.5px solid rgba(28,28,46,.07)', borderRadius: 14, padding: '11px 13px', marginBottom: 12 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(28,28,30,.4)', margin: '0 0 3px' }}>You deliver</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', margin: '0 0 5px' }}>{ag.you_deliver}</p>
          {ag.you_deliver_value > 0 && <p style={{ fontSize: 10, color: 'rgba(28,28,30,.4)', margin: '0 0 6px' }}>Est. ${ag.you_deliver_value.toLocaleString()}</p>}
          {isConfirmed && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: ag.you_delivered ? 'rgba(48,209,88,.1)' : 'rgba(255,159,10,.1)', color: ag.you_delivered ? '#1a7a35' : '#b45309' }}>{ag.you_delivered ? '✓ Done' : '⏳ Pending'}</span>}
        </div>
        <span style={{ fontSize: 16, color: 'rgba(28,28,30,.3)' }}>⇄</span>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(28,28,30,.4)', margin: '0 0 3px' }}>They deliver</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', margin: '0 0 5px' }}>{ag.they_deliver}</p>
          {ag.they_deliver_value > 0 && <p style={{ fontSize: 10, color: 'rgba(28,28,30,.4)', margin: '0 0 6px' }}>Est. ${ag.they_deliver_value.toLocaleString()}</p>}
          {isConfirmed && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: ag.they_delivered ? 'rgba(48,209,88,.1)' : 'rgba(10,132,255,.1)', color: ag.they_delivered ? '#1a7a35' : '#0a84ff' }}>{ag.they_delivered ? '✓ Done' : '⏳ Pending'}</span>}
        </div>
      </div>

      {ag.notes && <p style={{ fontSize: 12, color: 'rgba(28,28,30,.5)', background: 'rgba(28,28,46,.03)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, lineHeight: 1.5 }}>📝 {ag.notes}</p>}

      {ag.status === 'draft' && (
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={() => onEdit(ag)} style={{ padding: '10px 14px', borderRadius: 100, border: '.5px solid rgba(28,28,46,.15)', background: 'transparent', color: 'rgba(28,28,30,.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✎ Edit</button>
          <button onClick={sendForConfirm} disabled={sending || !ag.counterparty_email} style={{ flex: 1, padding: '10px', borderRadius: 100, border: 'none', background: ag.counterparty_email ? 'linear-gradient(135deg,#0a84ff,#34aadc)' : 'rgba(28,28,46,.08)', color: ag.counterparty_email ? '#fff' : 'rgba(28,28,30,.35)', fontSize: 12, fontWeight: 700, cursor: ag.counterparty_email ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {sending ? 'Sending…' : copied ? '✓ Link copied' : ag.counterparty_email ? '📤 Send for confirmation' : 'Add their email to send'}
          </button>
        </div>
      )}
      {ag.status === 'sent' && (
        <div>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#0a84ff', fontWeight: 600, padding: '0 0 8px' }}>Waiting for {ag.counterparty_name} to confirm…</div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button onClick={() => onEdit(ag)} style={{ padding: '9px 14px', borderRadius: 100, border: '.5px solid rgba(28,28,46,.15)', background: 'transparent', color: 'rgba(28,28,30,.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✎ Edit</button>
            <button onClick={sendForConfirm} disabled={sending || !ag.counterparty_email} style={{ flex: 1, padding: '9px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#0a84ff,#34aadc)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {sending ? 'Sending…' : copied ? '✓ Link copied' : '📤 Resend email'}
            </button>
          </div>
        </div>
      )}
      {emailNote && <p style={{ fontSize: 11, color: emailNote.includes("didn't") ? '#b45309' : '#1a7a35', margin: '8px 0 0', lineHeight: 1.5 }}>{emailNote}</p>}
      {isConfirmed && ag.status !== 'completed' && (
        <div style={{ display: 'flex', gap: 7 }}>
          {!ag.you_delivered && <button onClick={() => markDelivered('you')} style={{ flex: 1, padding: '9px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Mark mine done</button>}
          {!ag.they_delivered && <button onClick={() => markDelivered('them')} style={{ flex: 1, padding: '9px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#0a84ff,#34aadc)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Mark theirs received</button>}
        </div>
      )}
      {ag.status === 'completed' && <p style={{ fontSize: 12, color: '#1a7a35', fontWeight: 600, margin: 0 }}>✓ Completed {ag.completed_at ? new Date(ag.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>}
    </div>
  );
}

export default function BarterPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ags, setAgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);   // agreement being edited, or null
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUser(user);
      const { data } = await supabase.from('barter_agreements').select('*').eq('user_id', user.id).is('deleted_at', null).order('created_at', { ascending: false });
      setAgs(data || []);
      setLoading(false);
    };
    init();
  }, []);

  const active = ags.filter(a => ['draft', 'sent', 'confirmed'].includes(a.status));
  const completed = ags.filter(a => a.status === 'completed');
  const shown = filter === 'all' ? ags : filter === 'active' ? active : completed;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {showNew && <NewAgreementModal onClose={() => setShowNew(false)} onCreated={a => setAgs(p => [a, ...p])} />}
      {editing && <NewAgreementModal existing={editing} onClose={() => setEditing(null)} onCreated={u => setAgs(p => p.map(x => x.id === u.id ? u : x))} />}

      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 60% at 15% -10%,rgba(48,209,88,.14) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 85% 110%,rgba(10,132,255,.07) 0%,transparent 60%),#e8eef5', color: '#1a1a2e', fontFamily: "'DM Sans',sans-serif", padding: '20px 16px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <Link href="/dashboard/solutions" style={{ fontSize: 11, color: 'rgba(26,26,46,.4)', textDecoration: 'none', display: 'block', marginBottom: 6 }}>← Dashboard</Link>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', color: '#1a7a35', textTransform: 'uppercase', marginBottom: 4 }}>🤝 Barter</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1 }}>Trade agreements</div>
            </div>
            <button onClick={() => setShowNew(true)} style={{ marginTop: 24, padding: '10px 18px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(48,209,88,.3)', whiteSpace: 'nowrap' }}>+ New agreement</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
            {[{ l: 'Active', v: active.length, c: '#1a1a2e' }, { l: 'Completed', v: completed.length, c: '#30d158' }, { l: 'Total', v: ags.length, c: '#0a84ff' }].map(s => (
              <div key={s.l} style={{ background: 'rgba(255,255,255,.62)', backdropFilter: 'blur(32px)', border: '.5px solid rgba(255,255,255,.85)', borderRadius: 14, padding: '12px 14px', textAlign: 'center' }}>
                <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: s.c, margin: '0 0 3px', letterSpacing: '-.8px' }}>{s.v}</p>
                <p style={{ fontSize: 11, color: 'rgba(26,26,46,.4)', margin: 0 }}>{s.l}</p>
              </div>
            ))}
          </div>

          {ags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[['all', 'All'], ['active', 'Active'], ['completed', 'Completed']].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)} style={{ padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '.5px solid', background: filter === v ? 'rgba(255,255,255,.8)' : 'transparent', borderColor: filter === v ? 'rgba(255,255,255,.9)' : 'transparent', color: filter === v ? '#1a1a2e' : 'rgba(26,26,46,.45)' }}>{l}</button>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(26,26,46,.35)' }}>Loading…</div>
          ) : ags.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,.62)', backdropFilter: 'blur(32px)', border: '.5px solid rgba(255,255,255,.85)', borderRadius: 18, padding: '36px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🤝</div>
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>No agreements yet</p>
              <p style={{ fontSize: 13, color: 'rgba(26,26,46,.5)', marginBottom: 16, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 16px' }}>Log a barter before work starts. Record the terms, send it to the other person to confirm, and track it to done.</p>
              <button onClick={() => setShowNew(true)} style={{ padding: '10px 22px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Create first agreement →</button>
            </div>
          ) : (
            shown.map((ag, i) => <div key={ag.id} style={{ animation: `fadeUp .3s ease ${i * .05}s both` }}><AgreementCard ag={ag} onUpdate={u => setAgs(p => p.map(x => x.id === u.id ? u : x))} onEdit={setEditing} /></div>)
          )}

          <p style={{ fontSize: 11, color: 'rgba(26,26,46,.35)', textAlign: 'center', marginTop: 28, lineHeight: 1.7 }}>
            A barter agreement is a timestamped, mutually-acknowledged record — not a legally binding contract or legal advice.<br />
            For high-value trades, consult an attorney. · <Link href="/terms" style={{ color: 'rgba(26,26,46,.35)' }}>Terms</Link> · <Link href="/privacy" style={{ color: 'rgba(26,26,46,.35)' }}>Privacy</Link>
          </p>
        </div>
      </div>
    </>
  );
}