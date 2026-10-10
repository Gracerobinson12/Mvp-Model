'use client';
// @ts-nocheck
// app/dashboard/vault/page.tsx — Ideas Vault. Honest sealing: SHA-256 + server timestamp.
// Now with "Bring it to life" → Launch HQ on sealed ideas.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Idea = {
  id: string; title: string; description: string; expanded_doc: string | null;
  tags: string[]; status: 'draft' | 'sealed';
  seal_hash: string | null; seal_id: string | null; seal_level: string | null;
  created_at: string; sealed_at: string | null;
};

const INDUSTRIES = ['Fintech','SaaS','Marketplace','Logistics','Healthcare','Education','Retail','Food & Bev','AI/ML','Hardware','Consumer','B2B'];

function FormField({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'rgba(26,26,46,.45)', marginBottom: 8, lineHeight: 1.5 }}>{hint}</div>
      {children}
    </div>
  );
}
const TA = { width: '100%', padding: '10px 14px', borderRadius: 12, border: '0.5px solid rgba(26,26,46,.15)', background: 'rgba(26,26,46,.03)', fontSize: 13, fontFamily: "'DM Sans',system-ui,sans-serif", outline: 'none', resize: 'vertical' as const, color: '#1a1a2e', lineHeight: 1.6 };

function NewIdeaModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [claims, setClaims] = useState('');
  const [users, setUsers] = useState('');
  const [diff, setDiff] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const FIELDS = [
    { label: 'Problem statement', hint: 'What problem does this solve, and who has it? Specific beats vague.', value: problem, set: setProblem, ph: 'e.g. Gig drivers lose thousands in unclaimed deductions because tracking is manual...', rows: 4 },
    { label: 'Proposed solution', hint: 'How does it work? What actually happens when someone uses it?', value: solution, set: setSolution, ph: 'e.g. An app that auto-detects trips via GPS, logs mileage, and maps expenses to IRS categories...', rows: 4 },
    { label: 'Key claims', hint: 'List 3-5 specific things that are new or different. Number them.', value: claims, set: setClaims, ph: '1. Automatic GPS trip detection\n2. Receipt scanning mapped to Schedule C\n3. Real-time deduction total...', rows: 5 },
    { label: 'Intended users', hint: 'Who exactly would use this? Be specific.', value: users, set: setUsers, ph: 'e.g. 1099 gig workers on Uber, Lyft, DoorDash, driving 20+ hrs/week...', rows: 3 },
    { label: 'How it differs', hint: 'What already exists, and how is yours different? Name competitors.', value: diff, set: setDiff, ph: 'e.g. MileIQ tracks mileage only; TurboTax needs manual entry. This combines both automatically...', rows: 4 },
  ];
  const complete = title.trim() && problem.trim() && solution.trim() && claims.trim() && users.trim() && diff.trim();
  const buildDoc = () => `PRIOR ART DISCLOSURE\n\nTitle: ${title}\n\nPROBLEM:\n${problem}\n\nSOLUTION:\n${solution}\n\nKEY CLAIMS:\n${claims}\n\nINTENDED USERS:\n${users}\n\nDIFFERENTIATION:\n${diff}`;

  const save = async () => {
    if (!complete) { setError('Fill in all sections before saving.'); return; }
    setLoading(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { data, error: dbErr } = await supabase.from('vault_ideas').insert({
        user_id: user.id, title: title.trim(), description: problem.trim(),
        expanded_doc: buildDoc(), tags, status: 'draft',
      }).select().single();
      if (dbErr) throw dbErr;
      onCreated(data); onClose();
    } catch (e) { setError(e.message || 'Something went wrong'); setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(12px)', padding: '0 14px 24px' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'rgba(255,255,255,.97)', borderRadius: '28px 28px 20px 20px', padding: '20px 22px 28px', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', fontFamily: "'DM Sans',system-ui,sans-serif", position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.06)', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(26,26,46,.4)' }}>✕</button>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,.1)', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#ff3b30', textTransform: 'uppercase', marginBottom: 4 }}>New idea</div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: -.5, color: '#1a1a2e', marginBottom: 4 }}>Document your idea</div>
        <div style={{ fontSize: 12, color: 'rgba(26,26,46,.45)', marginBottom: 20, lineHeight: 1.6 }}>The more detail, the stronger your record. Saved as a draft — seal it to lock in a timestamp.</div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>Idea title</div>
          <div style={{ fontSize: 11, color: 'rgba(26,26,46,.45)', marginBottom: 8 }}>A short, clear name — 5-10 words.</div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Automatic tax tracker for gig workers" style={{ ...TA, resize: 'none' }} />
        </div>
        {FIELDS.map((f, i) => (
          <FormField key={i} label={f.label} hint={f.hint}>
            <textarea value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} rows={f.rows} style={TA} />
          </FormField>
        ))}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Tags <span style={{ fontWeight: 400, color: 'rgba(26,26,46,.4)' }}>(optional)</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {INDUSTRIES.map(t => (
              <button key={t} onClick={() => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '0.5px solid', background: tags.includes(t) ? 'rgba(255,59,48,.1)' : 'rgba(26,26,46,.04)', borderColor: tags.includes(t) ? 'rgba(255,59,48,.35)' : 'rgba(26,26,46,.12)', color: tags.includes(t) ? '#cc2018' : 'rgba(26,26,46,.55)' }}>{t}</button>
            ))}
          </div>
        </div>
        {error && <div style={{ background: 'rgba(255,59,48,.08)', border: '1px solid rgba(255,59,48,.2)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#cc2018', marginBottom: 12 }}>{error}</div>}
        <button onClick={save} disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 100, border: 'none', background: complete ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(26,26,46,.08)', color: complete ? '#fff' : 'rgba(26,26,46,.35)', fontSize: 14, fontWeight: 700, cursor: complete ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: complete ? '0 4px 14px rgba(255,59,48,.35)' : 'none' }}>
          {loading ? 'Saving...' : complete ? 'Save to vault →' : 'Complete all sections to save'}
        </button>
      </div>
    </div>
  );
}

function SealModal({ idea, onClose, onSealed }) {
  const [step, setStep] = useState<'confirm' | 'sealing' | 'done'>('confirm');
  const [sealed, setSealed] = useState<Idea | null>(null);
  const [error, setError] = useState('');

  const doSeal = async () => {
    setStep('sealing'); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/vault/seal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ ideaId: idea.id }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Seal failed');
      setSealed(data.idea); setStep('done'); onSealed(data.idea);
    } catch (e) { setError(e.message || 'Something went wrong'); setStep('confirm'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(12px)', padding: 24 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'rgba(255,255,255,.97)', borderRadius: 28, padding: '28px 24px', width: '100%', maxWidth: 460, fontFamily: "'DM Sans',system-ui,sans-serif", position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.06)', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(26,26,46,.4)' }}>✕</button>

        {step === 'confirm' && <>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#ff3b30', textTransform: 'uppercase', marginBottom: 6 }}>Seal this idea</div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: '#1a1a2e', marginBottom: 4 }}>{idea.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(26,26,46,.5)', marginBottom: 18, lineHeight: 1.6 }}>Sealing locks your document and records a timestamp. Once sealed, any change to the content would break the fingerprint — that&apos;s the proof.</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, padding: '11px 14px', background: 'rgba(48,209,88,.06)', borderRadius: 12, border: '0.5px solid rgba(48,209,88,.2)' }}>
              <div style={{ fontSize: 20 }}>🔐</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>SHA-256 fingerprint</div>
                <div style={{ fontSize: 11, color: 'rgba(26,26,46,.5)', lineHeight: 1.5 }}>A unique hash of your exact document. Any edit changes it — proves the content is unaltered.</div>
              </div>
              <div style={{ fontSize: 10, color: '#1a7a35', fontWeight: 700, alignSelf: 'center' }}>Active</div>
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '11px 14px', background: 'rgba(48,209,88,.06)', borderRadius: 12, border: '0.5px solid rgba(48,209,88,.2)' }}>
              <div style={{ fontSize: 20 }}>🕐</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Recorded timestamp</div>
                <div style={{ fontSize: 11, color: 'rgba(26,26,46,.5)', lineHeight: 1.5 }}>The date and time your sealed record was created in Gratia Core.</div>
              </div>
              <div style={{ fontSize: 10, color: '#1a7a35', fontWeight: 700, alignSelf: 'center' }}>Active</div>
            </div>
          </div>

          {error && <div style={{ background: 'rgba(255,59,48,.08)', border: '1px solid rgba(255,59,48,.2)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#cc2018', marginBottom: 12 }}>{error}</div>}
          <button onClick={doSeal} style={{ width: '100%', padding: 14, borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#30d158,#34c759)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(48,209,88,.35)' }}>
            🔒 Seal this idea →
          </button>
          <p style={{ fontSize: 11, color: 'rgba(26,26,46,.35)', textAlign: 'center', marginTop: 10 }}>Sealing is permanent · Included in your plan</p>
        </>}

        {step === 'sealing' && (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔒</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>Sealing…</div>
            <div style={{ fontSize: 13, color: 'rgba(26,26,46,.5)', lineHeight: 1.6, marginBottom: 20 }}>Hashing your document and recording the timestamp.</div>
            <div style={{ height: 3, background: 'rgba(0,0,0,.06)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', height: '100%', width: '40%', background: 'linear-gradient(90deg,transparent,#30d158,transparent)', animation: 'loadSlide 1.2s ease-in-out infinite' }} />
            </div>
          </div>
        )}

        {step === 'done' && sealed && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1a1a2e', marginBottom: 6 }}>Sealed</div>
            <div style={{ fontSize: 13, color: 'rgba(26,26,46,.5)', lineHeight: 1.6, marginBottom: 16 }}>Your idea now has a fingerprint and a recorded timestamp.</div>
            <div style={{ background: 'rgba(48,209,88,.06)', border: '0.5px solid rgba(48,209,88,.2)', borderRadius: 16, padding: '14px 16px', marginBottom: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#1a7a35', textTransform: 'uppercase', marginBottom: 6 }}>Seal certificate</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(26,26,46,.5)', lineHeight: 1.8, wordBreak: 'break-all' }}>
                ID: {sealed.seal_id}<br />
                SHA-256: {sealed.seal_hash?.slice(0, 40)}…<br />
                Sealed: {sealed.sealed_at ? new Date(sealed.sealed_at).toLocaleString() : ''}
              </div>
            </div>
            <button onClick={onClose} style={{ width: '100%', padding: 12, borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function IdeaCard({ idea, onSeal, onDownload, onLaunch }) {
  const isSealed = idea.status === 'sealed';
  return (
    <div style={{ background: 'rgba(255,255,255,.65)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: `0.5px solid ${isSealed ? 'rgba(48,209,88,.25)' : 'rgba(255,255,255,.92)'}`, borderRadius: 18, padding: '16px 18px', marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
      {isSealed && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,#30d158,transparent)' }} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{idea.title}</span>
            {isSealed
              ? <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(48,209,88,.1)', border: '0.5px solid rgba(48,209,88,.3)', color: '#1a7a35', fontWeight: 700 }}>🔒 Sealed</span>
              : <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,159,10,.1)', border: '0.5px solid rgba(255,159,10,.35)', color: '#7a4800', fontWeight: 700 }}>✏️ Draft</span>}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(26,26,46,.5)', lineHeight: 1.6, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{idea.description}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {idea.tags?.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(26,26,46,.05)', border: '0.5px solid rgba(26,26,46,.08)', color: 'rgba(26,26,46,.5)' }}>{t}</span>)}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: 'rgba(26,26,46,.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{isSealed ? 'Sealed' : 'Created'}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{new Date(isSealed ? idea.sealed_at : idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          {isSealed && idea.seal_id && <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(26,26,46,.35)', marginTop: 3 }}>{idea.seal_id}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {!isSealed && <button onClick={() => onSeal(idea)} style={{ flex: 1, padding: '9px 14px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#30d158,#34c759)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(48,209,88,.3)' }}>🔒 Seal now</button>}
        {isSealed && <button onClick={() => onDownload(idea)} style={{ flex: 1, padding: '9px 14px', borderRadius: 100, border: '0.5px solid rgba(48,209,88,.3)', background: 'rgba(48,209,88,.08)', color: '#1a7a35', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>📄 Certificate</button>}
        <button onClick={() => onLaunch(idea)} style={{ flex: 1, padding: '9px 14px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#1f45c7,#3a6ff0)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(31,69,199,.3)' }}>🚀 Bring it to life</button>
      </div>
    </div>
  );
}

export default function IdeasVaultPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [sealTarget, setSealTarget] = useState<Idea | null>(null);
  const [filter, setFilter] = useState<'all' | 'sealed' | 'draft'>('all');

  useEffect(() => { fetchIdeas(); }, []);
  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from('vault_ideas').select('*').eq('user_id', user.id).is('deleted_at', null).order('created_at', { ascending: false });
      setIdeas((data || []) as Idea[]);
    } catch (e) {}
    setLoading(false);
  };

  const launchIdea = (idea: Idea) => { router.push(`/dashboard/vault/launch/${idea.id}`); };

  const downloadCert = (idea: Idea) => {
    const body = idea.expanded_doc || idea.description || '';
    const divider = '='.repeat(64);
    const text = `GRATIA CORE — IDEAS VAULT · SEAL CERTIFICATE\n\n` +
      `Title: ${idea.title}\nSeal ID: ${idea.seal_id}\n` +
      `Sealed: ${idea.sealed_at ? new Date(idea.sealed_at).toUTCString() : ''}\n` +
      `SHA-256: ${idea.seal_hash}\n\n` +
      `${divider}\nSEALED DOCUMENT (the exact content this fingerprint covers)\n${divider}\n\n` +
      `${body}\n\n` +
      `${divider}\n\n` +
      `This certificate records a SHA-256 fingerprint of the sealed record — the document\n` +
      `shown above together with its title and the timestamp it was recorded in Gratia Core.\n` +
      `Any change to the document above would change the fingerprint, which proves the\n` +
      `content is unaltered since sealing and existed on the recorded date.\n\n` +
      `This is a record of prior existence, not a patent, and not legal advice.\n` +
      `Gratia Core is not a law firm. Consult a licensed attorney for IP protection.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `GC-${idea.seal_id}-certificate.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const displayed = ideas.filter(i => filter === 'all' || i.status === filter);
  const sealedCount = ideas.filter(i => i.status === 'sealed').length;
  const draftCount = ideas.filter(i => i.status === 'draft').length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes loadSlide{0%{left:-40%}100%{left:100%}}
      `}</style>

      {showNew && <NewIdeaModal onClose={() => setShowNew(false)} onCreated={idea => { setIdeas(p => [idea, ...p]); setShowNew(false); }} />}
      {sealTarget && <SealModal idea={sealTarget} onClose={() => setSealTarget(null)} onSealed={u => { setIdeas(p => p.map(i => i.id === u.id ? u : i)); setSealTarget(null); }} />}

      <div style={{ background: '#f0eff4', backgroundImage: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,.09) 0%,transparent 55%)', minHeight: '100vh', padding: '14px 14px 80px', color: '#1a1a2e' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <Link href="/dashboard/solutions" style={{ fontSize: 11, color: 'rgba(26,26,46,.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>← Dashboard</Link>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', color: '#ff3b30', textTransform: 'uppercase', marginBottom: 4 }}>💡 Ideas Vault</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>PROTECT YOUR <span style={{ color: '#ff3b30' }}>IDEAS</span></div>
          </div>
          <button onClick={() => setShowNew(true)} style={{ marginTop: 28, padding: '10px 18px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#ff3b30,#ff6b35)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(255,59,48,.35)', whiteSpace: 'nowrap' }}>+ New idea</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[{ label: 'Sealed', value: sealedCount, color: '#30d158' }, { label: 'Drafts', value: draftCount, color: '#ff9f0a' }, { label: 'Total', value: ideas.length, color: '#1a1a2e' }].map(k => (
            <div key={k.label} style={{ flex: 1, background: 'rgba(255,255,255,.65)', backdropFilter: 'blur(32px)', border: '0.5px solid rgba(255,255,255,.92)', borderRadius: 16, padding: '13px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 900, letterSpacing: -1.5, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(26,26,46,.45)', marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {ideas.length === 0 && !loading && (
          <div style={{ background: 'rgba(255,59,48,.06)', border: '0.5px solid rgba(255,59,48,.18)', borderRadius: 20, padding: '20px 22px', marginBottom: 16, animation: 'fadeUp .4s ease both' }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>Document it before you share it</div>
            <div style={{ fontSize: 13, color: 'rgba(26,26,46,.6)', lineHeight: 1.7, marginBottom: 16 }}>
              Write your idea, then seal it. Sealing creates a SHA-256 fingerprint of your document and records the exact time — so if ownership is ever questioned, you have proof it existed, unaltered, on that date. Then bring it to life with a real launch plan.
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[['🔐', 'SHA-256 fingerprint'], ['🕐', 'Recorded timestamp'], ['🚀', 'Launch plan']].map(([icon, label]) => (
                <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(26,26,46,.6)', background: 'rgba(255,255,255,.5)', border: '0.5px solid rgba(255,255,255,.9)', borderRadius: 100, padding: '4px 12px' }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ideas.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[['all', 'All ideas'], ['sealed', '🔒 Sealed'], ['draft', '✏️ Drafts']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val as any)} style={{ padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '0.5px solid', background: filter === val ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(255,255,255,.65)', color: filter === val ? '#fff' : 'rgba(26,26,46,.6)', borderColor: filter === val ? 'transparent' : 'rgba(255,255,255,.9)' }}>{label}</button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(26,26,46,.35)', fontSize: 14 }}>Loading your vault…</div>
        ) : displayed.length === 0 && ideas.length > 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(26,26,46,.35)', fontSize: 14 }}>No {filter} ideas yet.</div>
        ) : displayed.map((idea, i) => (
          <div key={idea.id} style={{ animation: `fadeUp .3s ease ${i * .04}s both` }}>
            <IdeaCard idea={idea} onSeal={setSealTarget} onDownload={downloadCert} onLaunch={launchIdea} />
          </div>
        ))}

        {!loading && ideas.length === 0 && (
          <button onClick={() => setShowNew(true)} style={{ width: '100%', padding: '18px', borderRadius: 20, border: '2px dashed rgba(255,59,48,.2)', background: 'rgba(255,59,48,.03)', color: 'rgba(26,26,46,.4)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add your first idea</button>
        )}

        <div style={{ fontSize: 10, color: 'rgba(26,26,46,.3)', textAlign: 'center', marginTop: 24, lineHeight: 1.7 }}>
          A seal records prior existence and integrity — it is not a patent and not legal advice.<br />
          Consult a licensed IP attorney for full protection. Gratia Core.
        </div>
      </div>
    </>
  );
}