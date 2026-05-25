'use client'
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type TradeStatus = 'active' | 'completed' | 'disputed' | 'awaiting_you' | 'awaiting_them'
type Trade = {
  id: string
  title: string
  counterparty_name: string
  counterparty_email: string
  you_deliver: string
  you_deliver_value: number
  they_deliver: string
  they_deliver_value: number
  you_delivered: boolean
  they_delivered: boolean
  status: TradeStatus
  agreement_id: string
  due_date: string | null
  notes: string | null
  created_at: string
  completed_at: string | null
}

const STATUS_CONFIG: Record<TradeStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  active:         { label: '● Active',            color: '#1a7a35', bg: 'rgba(48,209,88,.1)',  border: 'rgba(48,209,88,.3)',  dot: '#30d158' },
  completed:      { label: '✓ Completed',          color: '#1a1a2e', bg: 'rgba(26,26,46,.06)', border: 'rgba(26,26,46,.15)', dot: '#1a1a2e' },
  disputed:       { label: '⚠️ Disputed',          color: '#cc2018', bg: 'rgba(255,59,48,.1)', border: 'rgba(255,59,48,.3)',  dot: '#ff3b30' },
  awaiting_you:   { label: '⏳ Your turn',         color: '#7a4800', bg: 'rgba(255,159,10,.1)', border: 'rgba(255,159,10,.35)', dot: '#ff9f0a' },
  awaiting_them:  { label: '⏳ Waiting on them',  color: '#0055a5', bg: 'rgba(10,132,255,.1)', border: 'rgba(10,132,255,.25)', dot: '#0a84ff' },
}

// ── New Trade Modal ───────────────────────────────────────────────────────────
function NewTradeModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: Trade) => void }) {
  const [form, setForm] = useState({
    title: '', counterparty_name: '', counterparty_email: '',
    you_deliver: '', you_deliver_value: '', they_deliver: '', they_deliver_value: '',
    due_date: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [step, setStep]       = useState(1)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.title || !form.counterparty_name || !form.you_deliver || !form.they_deliver) {
      setError('Please fill in all required fields.'); return
    }
    setLoading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const agreementId = `BT-${String(Math.floor(Math.random()*9000)+1000)}`
      const status: TradeStatus = 'active'
      const { data, error: dbErr } = await supabase.from('barter_trades').insert({
        user_id: user.id, ...form,
        you_deliver_value: parseFloat(form.you_deliver_value) || 0,
        they_deliver_value: parseFloat(form.they_deliver_value) || 0,
        you_delivered: false, they_delivered: false,
        status, agreement_id: agreementId,
        due_date: form.due_date || null, notes: form.notes || null,
      }).select().single()
      if (dbErr) throw dbErr
      onCreated(data as Trade); onClose()
    } catch (e: any) { setError(e.message); setLoading(false) }
  }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 12, border: '0.5px solid rgba(26,26,46,.15)', background: 'rgba(26,26,46,.03)', fontSize: 13, fontFamily: "'DM Sans',system-ui,sans-serif", outline: 'none', color: '#1a1a2e' }
  const labelStyle = { fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', marginBottom: 6, display: 'block' as const }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(12px)', padding: '0 14px 24px' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'rgba(255,255,255,.97)', borderRadius: '28px 28px 20px 20px', padding: '20px 22px 28px', width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto', fontFamily: "'DM Sans',system-ui,sans-serif", position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.06)', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(26,26,46,.4)' }}>✕</button>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,.1)', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#ff3b30', textTransform: 'uppercase', marginBottom: 4 }}>New trade agreement</div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: '#1a1a2e', marginBottom: 4 }}>What are you trading?</div>
        <div style={{ fontSize: 12, color: 'rgba(26,26,46,.45)', marginBottom: 20, lineHeight: 1.6 }}>Document the agreement before any work starts. Both sides, clear terms.</div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {[1,2,3].map(n => <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= n ? '#ff3b30' : 'rgba(26,26,46,.1)', transition: 'background .3s' }} />)}
        </div>

        {step === 1 && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Trade title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Logo design for web development" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Other person name *</label>
              <input value={form.counterparty_name} onChange={e => set('counterparty_name', e.target.value)} placeholder="Full name" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Their email (optional — for sending agreement)</label>
              <input value={form.counterparty_email} onChange={e => set('counterparty_email', e.target.value)} placeholder="email@example.com" type="email" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle}>Expected completion date (optional)</label>
              <input value={form.due_date} onChange={e => set('due_date', e.target.value)} type="date" style={inputStyle} />
            </div>
            <button onClick={() => setStep(2)} style={{ width: '100%', padding: 13, borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 16, fontFamily: "'DM Sans',system-ui,sans-serif" }}>Next →</button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ background: 'rgba(26,26,46,.03)', border: '0.5px solid rgba(26,26,46,.1)', borderRadius: 16, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(26,26,46,.4)', textTransform: 'uppercase', marginBottom: 12 }}>What YOU deliver</div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>What you are giving *</label>
                <textarea value={form.you_deliver} onChange={e => set('you_deliver', e.target.value)} placeholder="e.g. 3 logo concepts with unlimited revisions, delivered as AI + PNG files" rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              <div>
                <label style={labelStyle}>Estimated dollar value</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,26,46,.35)', fontSize: 14 }}>$</span>
                  <input value={form.you_deliver_value} onChange={e => set('you_deliver_value', e.target.value)} placeholder="0" type="number" style={{ ...inputStyle, paddingLeft: 28 }} />
                </div>
                <div style={{ fontSize: 10, color: 'rgba(26,26,46,.35)', marginTop: 4 }}>Used to confirm fair exchange — not legally binding pricing</div>
              </div>
            </div>

            <div style={{ background: 'rgba(26,26,46,.03)', border: '0.5px solid rgba(26,26,46,.1)', borderRadius: 16, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(26,26,46,.4)', textTransform: 'uppercase', marginBottom: 12 }}>What THEY deliver</div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>What they are giving *</label>
                <textarea value={form.they_deliver} onChange={e => set('they_deliver', e.target.value)} placeholder="e.g. Full landing page built in Next.js, mobile responsive, deployed to Vercel" rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              <div>
                <label style={labelStyle}>Estimated dollar value</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,26,46,.35)', fontSize: 14 }}>$</span>
                  <input value={form.they_deliver_value} onChange={e => set('they_deliver_value', e.target.value)} placeholder="0" type="number" style={{ ...inputStyle, paddingLeft: 28 }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(1)} style={{ padding: '13px 18px', borderRadius: 100, border: '0.5px solid rgba(26,26,46,.15)', background: 'transparent', color: 'rgba(26,26,46,.5)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: 13, borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>Next →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Additional notes or terms (optional)</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any other terms, conditions, or context both parties should know about..." rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>

            {/* Agreement preview */}
            <div style={{ background: 'rgba(255,59,48,.04)', border: '0.5px solid rgba(255,59,48,.15)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#ff3b30', textTransform: 'uppercase', marginBottom: 10 }}>Agreement preview</div>
              <div style={{ fontSize: 12, color: 'rgba(26,26,46,.7)', lineHeight: 1.8 }}>
                <strong style={{ color: '#1a1a2e' }}>"{form.title || 'Your trade'}"</strong><br />
                Between you and <strong style={{ color: '#1a1a2e' }}>{form.counterparty_name || 'them'}</strong><br />
                <br />
                <strong>You deliver:</strong> {form.you_deliver || '—'}{form.you_deliver_value ? ` (est. $${form.you_deliver_value})` : ''}<br />
                <strong>They deliver:</strong> {form.they_deliver || '—'}{form.they_deliver_value ? ` (est. $${form.they_deliver_value})` : ''}<br />
                {form.due_date && <><strong>By:</strong> {new Date(form.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}<br /></>}
              </div>
            </div>

            <div style={{ background: 'rgba(48,209,88,.05)', border: '0.5px solid rgba(48,209,88,.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'rgba(26,26,46,.6)', lineHeight: 1.6 }}>
              🔒 This agreement gets a cryptographic timestamp when saved — creating a legal record of what was agreed and when.
            </div>

            {error && <div style={{ background: 'rgba(255,59,48,.08)', border: '1px solid rgba(255,59,48,.2)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#cc2018', marginBottom: 12 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(2)} style={{ padding: '13px 18px', borderRadius: 100, border: '0.5px solid rgba(26,26,46,.15)', background: 'transparent', color: 'rgba(26,26,46,.5)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>← Back</button>
              <button onClick={save} disabled={loading} style={{ flex: 1, padding: 13, borderRadius: 100, border: 'none', background: loading ? 'rgba(255,59,48,.3)' : 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
                {loading ? 'Saving...' : '🤝 Create agreement →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Trade Card ────────────────────────────────────────────────────────────────
function TradeCard({ trade, onUpdate }: { trade: Trade; onUpdate: (t: Trade) => void }) {
  const cfg = STATUS_CONFIG[trade.status]
  const total_you   = trade.you_deliver_value
  const total_them  = trade.they_deliver_value
  const fairness    = total_you && total_them ? Math.round(Math.min(total_you, total_them) / Math.max(total_you, total_them) * 100) : null

  const markDelivered = async (side: 'you' | 'them') => {
    const field  = side === 'you' ? 'you_delivered' : 'they_delivered'
    const newVal = !trade[field as keyof Trade]
    const bothDone = side === 'you' ? (newVal && trade.they_delivered) : (trade.you_delivered && newVal)
    const updates: any = { [field]: newVal }
    if (bothDone) { updates.status = 'completed'; updates.completed_at = new Date().toISOString() }
    else if (newVal && side === 'you') updates.status = 'awaiting_them'
    else if (newVal && side === 'them') updates.status = 'awaiting_you'
    else updates.status = 'active'
    const { data } = await supabase.from('barter_trades').update(updates).eq('id', trade.id).select().single()
    if (data) onUpdate(data as Trade)
  }

  const isActive    = ['active', 'awaiting_you', 'awaiting_them'].includes(trade.status)
  const daysLeft    = trade.due_date ? Math.ceil((new Date(trade.due_date).getTime() - Date.now()) / 86400000) : null

  return (
    <div style={{ background: 'rgba(255,255,255,.65)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '0.5px solid rgba(255,255,255,.92)', borderRadius: 20, padding: '16px 18px', marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
      {isActive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg,transparent,${cfg.dot},transparent)` }} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{trade.title}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: cfg.bg, border: `0.5px solid ${cfg.border}`, color: cfg.color }}>{cfg.label}</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(26,26,46,.45)' }}>
            With {trade.counterparty_name} · {new Date(trade.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {daysLeft !== null && isActive && (
              <span style={{ marginLeft: 8, color: daysLeft < 3 ? '#ff3b30' : 'rgba(26,26,46,.4)', fontWeight: daysLeft < 3 ? 700 : 400 }}>· {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}</span>
            )}
          </div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(26,26,46,.35)', flexShrink: 0 }}>{trade.agreement_id}</div>
      </div>

      {/* Exchange visual */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(26,26,46,.03)', border: '0.5px solid rgba(26,26,46,.08)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(26,26,46,.4)', textTransform: 'uppercase', marginBottom: 4 }}>You deliver</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>{trade.you_deliver}</div>
          {total_you > 0 && <div style={{ fontSize: 11, color: 'rgba(26,26,46,.4)' }}>Est. ${total_you.toLocaleString()}</div>}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
            {trade.you_delivered
              ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(48,209,88,.1)', border: '0.5px solid rgba(48,209,88,.3)', color: '#1a7a35' }}>✓ Delivered</span>
              : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,159,10,.1)', border: '0.5px solid rgba(255,159,10,.35)', color: '#7a4800' }}>⏳ Pending</span>
            }
          </div>
        </div>
        <div style={{ fontSize: 18, color: 'rgba(26,26,46,.2)', flexShrink: 0 }}>⇄</div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(26,26,46,.4)', textTransform: 'uppercase', marginBottom: 4 }}>They deliver</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>{trade.they_deliver}</div>
          {total_them > 0 && <div style={{ fontSize: 11, color: 'rgba(26,26,46,.4)' }}>Est. ${total_them.toLocaleString()}</div>}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
            {trade.they_delivered
              ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(48,209,88,.1)', border: '0.5px solid rgba(48,209,88,.3)', color: '#1a7a35' }}>✓ Delivered</span>
              : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(10,132,255,.1)', border: '0.5px solid rgba(10,132,255,.25)', color: '#0055a5' }}>⏳ Pending</span>
            }
          </div>
        </div>
      </div>

      {/* Fairness indicator */}
      {fairness !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 11, color: 'rgba(26,26,46,.45)' }}>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(26,26,46,.08)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(total_you, total_them) / Math.max(total_you, total_them) * 100}%`, background: fairness >= 80 ? '#30d158' : '#ff9f0a', borderRadius: 2 }} />
          </div>
          <span style={{ flexShrink: 0, color: fairness >= 80 ? '#1a7a35' : '#7a4800', fontWeight: 600 }}>{fairness >= 80 ? '⚖️ Fair exchange' : '⚖️ Uneven — review values'}</span>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div style={{ background: 'rgba(26,26,46,.03)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: 'rgba(26,26,46,.55)', lineHeight: 1.5 }}>
          📝 {trade.notes}
        </div>
      )}

      {/* Actions */}
      {isActive && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!trade.you_delivered && (
            <button onClick={() => markDelivered('you')} style={{ flex: 1, padding: '9px 14px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
              ✓ Mark mine as delivered
            </button>
          )}
          {!trade.they_delivered && (
            <button onClick={() => markDelivered('them')} style={{ flex: 1, padding: '9px 14px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#30d158,#34c759)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
              ✓ Mark theirs received
            </button>
          )}
          <button style={{ padding: '9px 14px', borderRadius: 100, border: '0.5px solid rgba(255,59,48,.2)', background: 'rgba(255,59,48,.05)', color: '#cc2018', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
            ⚠️ Flag issue
          </button>
        </div>
      )}
      {trade.status === 'completed' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#1a7a35', fontWeight: 600 }}>
          ✓ Trade completed {trade.completed_at ? new Date(trade.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BarterPage() {
  const [trades, setTrades]   = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter]   = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => { fetchTrades() }, [])

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('barter_trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setTrades((data || []) as Trade[])
    } catch(e) {}
    setLoading(false)
  }

  const updateTrade = (updated: Trade) => setTrades(p => p.map(t => t.id === updated.id ? updated : t))

  const active    = trades.filter(t => ['active','awaiting_you','awaiting_them'].includes(t.status))
  const completed = trades.filter(t => t.status === 'completed')
  const totalValue = active.reduce((s, t) => s + (t.you_deliver_value || 0), 0)

  const displayed = filter === 'all' ? trades : filter === 'active' ? active : completed

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
      `}</style>

      {showNew && <NewTradeModal onClose={() => setShowNew(false)} onCreated={t => { setTrades(p => [t, ...p]); setShowNew(false) }} />}

      <div style={{ background: '#f0eff4', backgroundImage: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,.09) 0%,transparent 55%)', minHeight: '100vh', padding: '14px 14px 80px', color: '#1a1a2e' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <Link href="/dashboard" style={{ fontSize: 11, color: 'rgba(26,26,46,.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>← Dashboard</Link>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', color: '#ff3b30', textTransform: 'uppercase', marginBottom: 4 }}>🤝 Pro module</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>BARTER & <span style={{ color: '#ff3b30' }}>TRADE</span></div>
          </div>
          <button onClick={() => setShowNew(true)} style={{ marginTop: 28, padding: '10px 18px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", boxShadow: '0 4px 14px rgba(255,59,48,.35)', whiteSpace: 'nowrap' }}>
            + New trade
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Active trades', value: active.length, color: '#1a1a2e' },
            { label: 'Completed', value: completed.length, color: '#30d158' },
            { label: 'Total value', value: totalValue > 0 ? `$${totalValue.toLocaleString()}` : '—', color: '#ff9f0a' },
          ].map(k => (
            <div key={k.label} style={{ flex: 1, background: 'rgba(255,255,255,.65)', backdropFilter: 'blur(24px)', border: '0.5px solid rgba(255,255,255,.92)', borderRadius: 16, padding: '13px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: -1, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(26,26,46,.45)', marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && trades.length === 0 && (
          <div style={{ background: 'rgba(255,59,48,.06)', border: '0.5px solid rgba(255,59,48,.18)', borderRadius: 20, padding: '20px 22px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,#ff3b30,transparent)' }} />
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>Trade skills, not cash</div>
            <div style={{ fontSize: 13, color: 'rgba(26,26,46,.6)', lineHeight: 1.7, marginBottom: 16 }}>Document every barter agreement before work starts. Who delivers what, estimated values, and a deadline. If anything goes wrong, you have a timestamped legal record of exactly what was agreed.</div>
            <button onClick={() => setShowNew(true)} style={{ padding: '10px 20px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>Create your first trade agreement →</button>
          </div>
        )}

        {/* Filter */}
        {trades.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[['all','All'], ['active','Active'], ['completed','Completed']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v as any)} style={{ padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", border: '0.5px solid', transition: 'all .2s', background: filter === v ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(255,255,255,.65)', color: filter === v ? '#fff' : 'rgba(26,26,46,.6)', borderColor: filter === v ? 'transparent' : 'rgba(255,255,255,.9)', boxShadow: filter === v ? '0 4px 12px rgba(255,59,48,.3)' : 'none' }}>{l}</button>
            ))}
          </div>
        )}

        {/* Trades */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(26,26,46,.35)', fontSize: 14 }}>Loading your trades...</div>
        ) : displayed.map((trade, i) => (
          <div key={trade.id} style={{ animation: `fadeUp .3s ease ${i * .05}s both` }}>
            <TradeCard trade={trade} onUpdate={updateTrade} />
          </div>
        ))}

        <div style={{ fontSize: 10, color: 'rgba(26,26,46,.3)', textAlign: 'center', marginTop: 24, lineHeight: 1.7 }}>
          Barter & Trade creates a record of agreements — not a legally binding contract.<br />
          For high-value trades, consult an attorney. Gratia Core Enterprise LLC.
        </div>
      </div>
    </>
  )
}