'use client'
// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────
type SealStrength = { hash: boolean; rfc: boolean; bitcoin: boolean }
type Idea = {
  id: string
  title: string
  description: string
  expanded_doc: string | null
  tags: string[]
  status: 'draft' | 'expanding' | 'sealed'
  seal_hash: string | null
  seal_id: string | null
  seal_tsr: string | null
  seal_ots: string | null
  bitcoin_block: string | null
  certificate_url: string | null
  created_at: string
  sealed_at: string | null
  strength: SealStrength
}

const INDUSTRIES = ['Fintech','SaaS','Marketplace','Safety','Logistics','Healthcare','Education','Real Estate','Retail','Food & Bev','Gig Workers','AI/ML','Hardware','Consumer','B2B']

// ── Seal Strength Bar ─────────────────────────────────────────────────────────
function SealStrengthBar({ strength, compact = false }: { strength: SealStrength; compact?: boolean }) {
  const layers = [
    { key: 'hash',    label: 'SHA-256',   done: strength.hash },
    { key: 'rfc',     label: 'RFC 3161',  done: strength.rfc  },
    { key: 'bitcoin', label: 'Bitcoin',   done: strength.bitcoin },
  ]
  const count = layers.filter(l => l.done).length
  return (
    <div>
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(26,26,46,.45)', marginBottom: 4 }}>
          <span>Seal strength</span>
          <span style={{ color: count === 3 ? '#30d158' : count > 0 ? '#ff9f0a' : 'rgba(26,26,46,.35)' }}>{count} / 3 layers</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 3 }}>
        {layers.map(l => (
          <div key={l.key} style={{ flex: 1, height: compact ? 4 : 5, borderRadius: 3, background: l.done ? (l.key === 'bitcoin' && !strength.bitcoin ? '#ff9f0a' : '#30d158') : 'rgba(26,26,46,.1)', transition: 'background .4s' }}/>
        ))}
      </div>
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(26,26,46,.35)', marginTop: 3 }}>
          {layers.map(l => <span key={l.key}>{l.label}</span>)}
        </div>
      )}
    </div>
  )
}

// ── New Idea Modal ─────────────────────────────────────────────────────────────
// ── Field component ───────────────────────────────────────────────────────────
function FormField({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'rgba(26,26,46,.45)', marginBottom: 8, lineHeight: 1.5 }}>{hint}</div>
      {children}
    </div>
  )
}

const TA_STYLE = { width: '100%', padding: '10px 14px', borderRadius: 12, border: '0.5px solid rgba(26,26,46,.15)', background: 'rgba(26,26,46,.03)', fontSize: 13, fontFamily: "'DM Sans',system-ui,sans-serif", outline: 'none', resize: 'vertical' as const, color: '#1a1a2e', lineHeight: 1.6 }

function NewIdeaModal({ onClose, onCreated }: { onClose: () => void; onCreated: (idea: Idea) => void }) {
  const [title,         setTitle]         = useState('')
  const [problem,       setProblem]       = useState('')
  const [solution,      setSolution]      = useState('')
  const [claims,        setClaims]        = useState('')
  const [users,         setUsers]         = useState('')
  const [differentiation, setDifferentiation] = useState('')
  const [tags,          setTags]          = useState<string[]>([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')

  const FIELDS = [
    {
      label: 'Problem statement',
      hint:  'What problem does this solve? Who has this problem and how bad is it? The more specific the better — "gig workers lose $3,200/year in missed deductions" beats "taxes are hard."',
      value: problem, set: setProblem,
      placeholder: 'e.g. Rideshare and delivery drivers lose thousands in tax deductions every year because tracking mileage and expenses manually is too tedious...',
      rows: 4,
    },
    {
      label: 'Proposed solution',
      hint:  'How does your idea solve it? What does it actually do? Describe the core mechanism — what happens when someone uses it.',
      value: solution, set: setSolution,
      placeholder: 'e.g. A mobile app that automatically detects when a trip starts using GPS, logs the mileage, photographs receipts, and maps every expense to its IRS deduction category in real time...',
      rows: 4,
    },
    {
      label: 'Key technical claims',
      hint:  'List 3–5 specific things your idea does that are new or different. Number them. These are what a patent examiner looks at — be specific, not vague.',
      value: claims, set: setClaims,
      placeholder: '1. Automatic GPS trip detection (business vs personal)\n2. AI receipt scanning mapped to IRS Schedule C\n3. Real-time deduction total after every trip...',
      rows: 5,
    },
    {
      label: 'Intended users',
      hint:  'Who exactly would use this? Be specific — job title, situation, platform they use, income range. The more specific, the stronger the prior art.',
      value: users, set: setUsers,
      placeholder: 'e.g. 1099 gig workers earning income through Uber, Lyft, DoorDash, Instacart, and similar platforms. Primarily ages 22–45, driving 20+ hours per week...',
      rows: 3,
    },
    {
      label: 'Prior art differentiation',
      hint:  'What already exists that is similar, and how is your idea different? Name specific competing products or approaches. This is what proves yours is new.',
      value: differentiation, set: setDifferentiation,
      placeholder: 'e.g. MileIQ tracks mileage only but does not connect to tax categories. TurboTax Self-Employed is tax software but requires manual entry. This solution combines automatic tracking with real-time IRS mapping...',
      rows: 4,
    },
  ]

  const isComplete = title.trim() && problem.trim() && solution.trim() && claims.trim() && users.trim() && differentiation.trim()

  const buildDoc = () =>
    `PRIOR ART DISCLOSURE DOCUMENT

Title: ${title}

PROBLEM STATEMENT:
${problem}

PROPOSED SOLUTION:
${solution}

KEY TECHNICAL CLAIMS:
${claims}

INTENDED USERS:
${users}

PRIOR ART DIFFERENTIATION:
${differentiation}`

  const save = async () => {
    if (!isComplete) { setError('Please fill in all sections before saving.'); return }
    setLoading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const expanded_doc = buildDoc()
      const { data, error: dbErr } = await supabase.from('vault_ideas').insert({
        user_id: user.id,
        title: title.trim(),
        description: problem.trim(),
        expanded_doc,
        tags,
        status: 'draft',
        strength: { hash: false, rfc: false, bitcoin: false },
      }).select().single()
      if (dbErr) throw dbErr
      onCreated(data as Idea)
      onClose()
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(12px)', padding: '0 14px 24px' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'rgba(255,255,255,.97)', borderRadius: '28px 28px 20px 20px', padding: '20px 22px 28px', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', fontFamily: "'DM Sans',system-ui,sans-serif", position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.06)', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(26,26,46,.4)' }}>✕</button>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,.1)', margin: '0 auto 16px' }} />

        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#ff3b30', textTransform: 'uppercase', marginBottom: 4 }}>New idea</div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: -.5, color: '#1a1a2e', marginBottom: 4 }}>Document your idea</div>
        <div style={{ fontSize: 12, color: 'rgba(26,26,46,.45)', marginBottom: 20, lineHeight: 1.6 }}>Fill in each section. The more detail you provide, the stronger your legal record.</div>

        {/* Title */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>Idea title</div>
          <div style={{ fontSize: 11, color: 'rgba(26,26,46,.45)', marginBottom: 8 }}>A short clear name for your idea — 5–10 words max.</div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Automatic tax tracker for gig economy workers" style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '0.5px solid rgba(26,26,46,.15)', background: 'rgba(26,26,46,.03)', fontSize: 14, fontFamily: "'DM Sans',system-ui,sans-serif", outline: 'none', color: '#1a1a2e' }} />
        </div>

        {/* Structured fields */}
        {FIELDS.map((f, i) => (
          <FormField key={i} label={f.label} hint={f.hint}>
            <textarea value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} rows={f.rows} style={TA_STYLE} />
          </FormField>
        ))}

        {/* Tags */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>Industry tags</div>
          <div style={{ fontSize: 11, color: 'rgba(26,26,46,.45)', marginBottom: 8 }}>Optional — helps you organize your vault.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {INDUSTRIES.map(t => (
              <button key={t} onClick={() => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", border: '0.5px solid', transition: 'all .15s', background: tags.includes(t) ? 'rgba(255,59,48,.1)' : 'rgba(26,26,46,.04)', borderColor: tags.includes(t) ? 'rgba(255,59,48,.35)' : 'rgba(26,26,46,.12)', color: tags.includes(t) ? '#cc2018' : 'rgba(26,26,46,.55)' }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div style={{ background: 'rgba(26,26,46,.04)', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(26,26,46,.45)', marginBottom: 6 }}>
            <span>Sections completed</span>
            <span style={{ color: isComplete ? '#30d158' : '#ff9f0a', fontWeight: 700 }}>
              {[title,problem,solution,claims,users,differentiation].filter(v=>v.trim()).length} / 6
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[title,problem,solution,claims,users,differentiation].map((v,i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: v.trim() ? '#30d158' : 'rgba(26,26,46,.1)', transition: 'background .3s' }} />
            ))}
          </div>
        </div>

        {error && <div style={{ background: 'rgba(255,59,48,.08)', border: '1px solid rgba(255,59,48,.2)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#cc2018', marginBottom: 12 }}>{error}</div>}

        <button onClick={save} disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 100, border: 'none', background: isComplete ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(26,26,46,.08)', color: isComplete ? '#fff' : 'rgba(26,26,46,.35)', fontSize: 14, fontWeight: 700, cursor: isComplete ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans',system-ui,sans-serif", boxShadow: isComplete ? '0 4px 14px rgba(255,59,48,.35)' : 'none', transition: 'all .2s' }}>
          {loading ? 'Saving...' : isComplete ? 'Save to vault →' : 'Complete all sections to save'}
        </button>
        <p style={{ fontSize: 11, color: 'rgba(26,26,46,.35)', textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>Saved as a draft — seal it from your vault to add legal timestamp protection</p>
      </div>
    </div>
  )
}

// ── Seal Modal ────────────────────────────────────────────────────────────────
function SealModal({ idea, onClose, onSealed }: { idea: Idea; onClose: () => void; onSealed: (idea: Idea) => void }) {
  const [step, setStep]     = useState<'confirm' | 'sealing' | 'done'>('confirm')
  const [sealed, setSealed] = useState<Idea | null>(null)
  const [error, setError]   = useState('')

  const doSeal = async () => {
    setStep('sealing'); setError('')
    try {
      const res = await fetch('/api/vault/seal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Seal failed')
      setSealed(data.idea)
      setStep('done')
      onSealed(data.idea)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setStep('confirm')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(12px)', padding: 24 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'rgba(255,255,255,.97)', borderRadius: 28, padding: '28px 24px', width: '100%', maxWidth: 460, fontFamily: "'DM Sans',system-ui,sans-serif", position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.06)', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(26,26,46,.4)' }}>✕</button>

        {step === 'confirm' && <>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#ff3b30', textTransform: 'uppercase', marginBottom: 6 }}>Seal this idea</div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: '#1a1a2e', marginBottom: 4 }}>{idea.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(26,26,46,.5)', marginBottom: 20 }}>This action is permanent and creates a tamper-proof legal record.</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {[
              { icon: '🔐', title: 'SHA-256 hash', desc: 'Unique fingerprint of your document — any change makes it invalid', time: 'Instant' },
              { icon: '🏦', title: 'RFC 3161 timestamp', desc: 'Signed by a government-accredited timestamp authority — court admissible', time: 'Instant' },
              { icon: '₿', title: 'Bitcoin blockchain anchor', desc: 'Your hash embedded permanently in Bitcoin — impossible to fake', time: '~1 hour' },
            ].map(l => (
              <div key={l.title} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'rgba(26,26,46,.03)', borderRadius: 12, border: '0.5px solid rgba(26,26,46,.08)' }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{l.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 }}>{l.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(26,26,46,.5)', lineHeight: 1.5 }}>{l.desc}</div>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(26,26,46,.4)', fontWeight: 600, flexShrink: 0, alignSelf: 'center' }}>{l.time}</div>
              </div>
            ))}
          </div>

          {error && <div style={{ background: 'rgba(255,59,48,.08)', border: '1px solid rgba(255,59,48,.2)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#cc2018', marginBottom: 12 }}>{error}</div>}

          <button onClick={doSeal} style={{ width: '100%', padding: 14, borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#30d158,#34c759)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", boxShadow: '0 4px 14px rgba(48,209,88,.35)' }}>
            🔒 Seal this idea forever →
          </button>
          <p style={{ fontSize: 11, color: 'rgba(26,26,46,.35)', textAlign: 'center', marginTop: 10 }}>This cannot be undone · Free for Core plan members</p>
        </>}

        {step === 'sealing' && (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔒</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>Sealing your idea</div>
            <div style={{ fontSize: 13, color: 'rgba(26,26,46,.5)', lineHeight: 1.6, marginBottom: 20 }}>Hashing document · Requesting RFC 3161 timestamp · Anchoring to Bitcoin...</div>
            <div style={{ height: 3, background: 'rgba(0,0,0,.06)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', height: '100%', width: '40%', background: 'linear-gradient(90deg,transparent,#30d158,transparent)', animation: 'loadSlide 1.2s ease-in-out infinite' }} />
            </div>
          </div>
        )}

        {step === 'done' && sealed && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1a1a2e', marginBottom: 6 }}>Sealed successfully</div>
            <div style={{ fontSize: 13, color: 'rgba(26,26,46,.5)', lineHeight: 1.6, marginBottom: 16 }}>Your idea is now protected with a legal timestamp. Bitcoin confirmation takes ~1 hour.</div>

            <div style={{ background: 'rgba(48,209,88,.06)', border: '0.5px solid rgba(48,209,88,.2)', borderRadius: 16, padding: '14px 16px', marginBottom: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#1a7a35', textTransform: 'uppercase', marginBottom: 6 }}>Seal certificate</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(26,26,46,.5)', lineHeight: 1.8 }}>
                ID: {sealed.seal_id}<br />
                Hash: {sealed.seal_hash?.slice(0, 32)}...<br />
                Sealed: {new Date(sealed.sealed_at!).toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => window.open(`/verify/${sealed.seal_id}`)} style={{ flex: 1, padding: 12, borderRadius: 100, border: '0.5px solid rgba(26,26,46,.15)', background: 'transparent', color: 'rgba(26,26,46,.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
                View certificate
              </button>
              <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Idea Card ─────────────────────────────────────────────────────────────────
function IdeaCard({ idea, onSeal, onDownload }: { idea: Idea; onSeal: (i: Idea) => void; onDownload: (i: Idea) => void }) {
  const isSealed = idea.status === 'sealed'
  const isDraft  = idea.status === 'draft'

  return (
    <div style={{ background: 'rgba(255,255,255,.65)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: `0.5px solid ${isSealed ? 'rgba(48,209,88,.25)' : 'rgba(255,255,255,.92)'}`, borderRadius: 18, padding: '16px 18px', marginBottom: 10, position: 'relative', overflow: 'hidden', transition: 'all .2s' }}>
      {isSealed && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,#30d158,transparent)' }} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{idea.title}</span>
            {isSealed
              ? <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(48,209,88,.1)', border: '0.5px solid rgba(48,209,88,.3)', color: '#1a7a35', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>🔒 Sealed</span>
              : <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,159,10,.1)', border: '0.5px solid rgba(255,159,10,.35)', color: '#7a4800', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>✏️ Draft</span>
            }
          </div>
          <div style={{ fontSize: 12, color: 'rgba(26,26,46,.5)', lineHeight: 1.6, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {idea.description}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {idea.tags?.map(t => (
              <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(26,26,46,.05)', border: '0.5px solid rgba(26,26,46,.08)', color: 'rgba(26,26,46,.5)' }}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: 'rgba(26,26,46,.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{isSealed ? 'Sealed' : 'Created'}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{new Date(isSealed ? idea.sealed_at! : idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          {isSealed && idea.seal_id && <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(26,26,46,.35)', marginTop: 3 }}>{idea.seal_id}</div>}
        </div>
      </div>

      <SealStrengthBar strength={idea.strength} />

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {isDraft && (
          <button onClick={() => onSeal(idea)} style={{ flex: 1, padding: '9px 14px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#30d158,#34c759)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", boxShadow: '0 3px 10px rgba(48,209,88,.3)' }}>
            🔒 Seal now — protect it
          </button>
        )}
        {isSealed && (
          <>
            <button onClick={() => onDownload(idea)} style={{ flex: 1, padding: '9px 14px', borderRadius: 100, border: '0.5px solid rgba(48,209,88,.3)', background: 'rgba(48,209,88,.08)', color: '#1a7a35', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
              📄 Download certificate
            </button>
            <button onClick={() => window.open(`/verify/${idea.seal_id}`)} style={{ padding: '9px 14px', borderRadius: 100, border: '0.5px solid rgba(26,26,46,.12)', background: 'transparent', color: 'rgba(26,26,46,.5)', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
              Verify
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IdeasVaultPage() {
  const [ideas, setIdeas]         = useState<Idea[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [sealTarget, setSealTarget] = useState<Idea | null>(null)
  const [filter, setFilter]       = useState<'all' | 'sealed' | 'draft'>('all')

  useEffect(() => { fetchIdeas() }, [])

  const fetchIdeas = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('vault_ideas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setIdeas((data || []) as Idea[])
    } catch (e) {}
    setLoading(false)
  }

  const addIdea = (idea: Idea) => setIdeas(p => [idea, ...p])

  const updateIdea = (updated: Idea) => setIdeas(p => p.map(i => i.id === updated.id ? updated : i))

  const downloadCert = async (idea: Idea) => {
    // Simple certificate download — in production this calls /api/vault/certificate
    const text = `GRATIA CORE ENTERPRISE LLC\nIDEAS VAULT — SEAL CERTIFICATE\n\n` +
      `Title: ${idea.title}\n` +
      `Seal ID: ${idea.seal_id}\n` +
      `Sealed: ${new Date(idea.sealed_at!).toUTCString()}\n` +
      `SHA-256: ${idea.seal_hash}\n\n` +
      `Description:\n${idea.description}\n\n` +
      `Verification: https://gratiacore.com/verify/${idea.seal_id}\n\n` +
      `This document establishes prior art for the described idea. It does not constitute a patent.\n` +
      `Consult a licensed patent attorney for full intellectual property protection.\n` +
      `Gratia Core Enterprise LLC is not a law firm and does not provide legal advice.`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `GC-${idea.seal_id}-certificate.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  const displayed = ideas.filter(i => filter === 'all' || i.status === filter)
  const sealedCount = ideas.filter(i => i.status === 'sealed').length
  const draftCount  = ideas.filter(i => i.status === 'draft').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes loadSlide{0%{left:-40%}100%{left:100%}}
      `}</style>

      {showNew && <NewIdeaModal onClose={() => setShowNew(false)} onCreated={idea => { addIdea(idea); setShowNew(false) }} />}
      {sealTarget && <SealModal idea={sealTarget} onClose={() => setSealTarget(null)} onSealed={updated => { updateIdea(updated); setSealTarget(null) }} />}

      <div style={{ background: '#f0eff4', backgroundImage: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,.09) 0%,transparent 55%)', minHeight: '100vh', padding: '14px 14px 80px', color: '#1a1a2e' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <Link href="/dashboard" style={{ fontSize: 11, color: 'rgba(26,26,46,.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>← Dashboard</Link>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', color: '#ff3b30', textTransform: 'uppercase', marginBottom: 4 }}>💡 Ideas Vault</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>PROTECT YOUR <span style={{ color: '#ff3b30' }}>IDEAS</span></div>
          </div>
          <button onClick={() => setShowNew(true)} style={{ marginTop: 28, padding: '10px 18px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", boxShadow: '0 4px 14px rgba(255,59,48,.35)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            + New idea
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Ideas sealed', value: sealedCount, color: '#30d158' },
            { label: 'Drafts', value: draftCount, color: '#ff9f0a' },
            { label: 'Total', value: ideas.length, color: '#1a1a2e' },
          ].map(k => (
            <div key={k.label} style={{ flex: 1, background: 'rgba(255,255,255,.65)', backdropFilter: 'blur(32px)', border: '0.5px solid rgba(255,255,255,.92)', borderRadius: 16, padding: '13px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 900, letterSpacing: -1.5, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(26,26,46,.45)', marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* How it works banner — show when no ideas */}
        {ideas.length === 0 && !loading && (
          <div style={{ background: 'rgba(255,59,48,.06)', border: '0.5px solid rgba(255,59,48,.18)', borderRadius: 20, padding: '20px 22px', marginBottom: 16, position: 'relative', overflow: 'hidden', animation: 'fadeUp .4s ease both' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,#ff3b30,transparent)' }} />
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>Before someone else files first</div>
            <div style={{ fontSize: 13, color: 'rgba(26,26,46,.6)', lineHeight: 1.7, marginBottom: 16 }}>
              A patent takes 2–7 years and $15,000+. Ideas Vault gives you legal proof your idea existed — today — for free. Write it, expand it with AI, seal it with a Bitcoin blockchain anchor. If anyone ever disputes ownership, you have timestamped evidence.
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[['🔐', 'SHA-256 hash'], ['🏦', 'RFC 3161 timestamp'], ['₿', 'Bitcoin anchor'], ['📄', 'Court-ready certificate']].map(([icon, label]) => (
                <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(26,26,46,.6)', background: 'rgba(255,255,255,.5)', border: '0.5px solid rgba(255,255,255,.9)', borderRadius: 100, padding: '4px 12px' }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter pills */}
        {ideas.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[['all', 'All ideas'], ['sealed', '🔒 Sealed'], ['draft', '✏️ Drafts']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val as any)} style={{ padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", border: '0.5px solid', transition: 'all .2s', background: filter === val ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(255,255,255,.65)', color: filter === val ? '#fff' : 'rgba(26,26,46,.6)', borderColor: filter === val ? 'transparent' : 'rgba(255,255,255,.9)', boxShadow: filter === val ? '0 4px 12px rgba(255,59,48,.3)' : 'none' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Ideas list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(26,26,46,.35)', fontSize: 14 }}>Loading your vault...</div>
        ) : displayed.length === 0 && ideas.length > 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(26,26,46,.35)', fontSize: 14 }}>No {filter} ideas yet.</div>
        ) : displayed.map((idea, i) => (
          <div key={idea.id} style={{ animation: `fadeUp .3s ease ${i * .04}s both` }}>
            <IdeaCard idea={idea} onSeal={setSealTarget} onDownload={downloadCert} />
          </div>
        ))}

        {/* Add first idea CTA */}
        {!loading && ideas.length === 0 && (
          <button onClick={() => setShowNew(true)} style={{ width: '100%', padding: '18px', borderRadius: 20, border: '2px dashed rgba(255,59,48,.2)', background: 'rgba(255,59,48,.03)', color: 'rgba(26,26,46,.4)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            + Add your first idea
          </button>
        )}

        {/* Footer note */}
        <div style={{ fontSize: 10, color: 'rgba(26,26,46,.3)', textAlign: 'center', marginTop: 24, lineHeight: 1.7 }}>
          Ideas Vault does not constitute legal advice or replace a patent.<br />
          Consult a licensed IP attorney for full protection. Gratia Core Enterprise LLC.
        </div>
      </div>
    </>
  )
}