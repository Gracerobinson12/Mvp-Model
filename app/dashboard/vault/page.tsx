'use client';
// @ts-nocheck
// app/dashboard/vault/page.tsx — Idea Vault
// Red bubble aesthetic matching dashboard. SHA-256 seal, file attachments,
// code hash, GitHub commit snapshot, canary mark checker.

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useModules } from '@/components/gc/useModules';
import { Header, Icon, Modal, ModuleGate, fmtDate } from '@/components/gc/ui';
import { readCanary } from '@/lib/canary';

const BUCKET = 'vault-attachments';
const MAX_FILE_MB = 20;
const ACCEPT = 'image/*,.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp,.heic,.svg,.ts,.tsx,.js,.jsx,.py,.sol,.go,.rs,.java,.swift,.kt,.rb,.php,.html,.css,.json,.md';

const INDUSTRIES = ['Fintech', 'SaaS', 'Marketplace', 'Logistics', 'Healthcare', 'Education', 'Retail', 'Food & Bev', 'AI/ML', 'Hardware', 'Consumer', 'B2B', 'Fashion', 'Legal', 'Real Estate'];

// ── helpers ───────────────────────────────────────────────────────────────────

function storagePath(userId: string, ideaId: string, fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${ideaId}/${Date.now()}_${safe}`;
}
async function uploadFile(userId: string, ideaId: string, file: File) {
  const path = storagePath(userId, ideaId, file.name);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  await supabase.from('vault_attachments').insert({
    idea_id: ideaId, user_id: userId,
    storage_path: path, file_name: file.name, file_type: file.type, file_size: file.size,
  });
  return path;
}
async function getSignedUrl(path: string) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}
async function deleteAttachment(id: string, path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
  await supabase.from('vault_attachments').delete().eq('id', id);
}
function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}
function fileIcon(type: string) {
  if (type.startsWith('image/')) return '🖼';
  if (type === 'application/pdf') return '📄';
  if (type.includes('javascript') || type.includes('typescript') || type.includes('python') || type.includes('text/x-')) return '💻';
  return '📎';
}

// ── inline styles matching dashboard aesthetic ────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 15,
  fontFamily: 'inherit', outline: 'none', background: 'rgba(120,120,128,0.08)',
  border: '1px solid rgba(0,0,0,0.1)', color: '#1c1c1e', boxSizing: 'border-box',
};
const ta: React.CSSProperties = { ...inp, resize: 'vertical', lineHeight: 1.6 };
const sectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)', borderRadius: 24,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.08)',
  padding: '22px 24px',
};
const primarySection: React.CSSProperties = {
  ...sectionStyle,
  boxShadow: 'inset 0 0 0 2px rgba(215,20,26,0.18), inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(215,20,26,0.08)',
};
const pinkSection: React.CSSProperties = {
  ...sectionStyle,
  background: 'rgba(255,59,48,0.07)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 4px 16px rgba(215,20,26,0.06)',
};

// ── FileAttachments ───────────────────────────────────────────────────────────

function FileAttachments({ ideaId, userId, sealed }: { ideaId: string; userId: string; sealed: boolean }) {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from('vault_attachments').select('*').eq('idea_id', ideaId).order('created_at');
    setFiles(data || []);
  };
  useEffect(() => { load(); }, [ideaId]);

  const handleFiles = async (list: FileList | null) => {
    if (!list || sealed) return;
    setErr('');
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_MB * 1048576) { setErr(`${file.name} is over ${MAX_FILE_MB} MB.`); continue; }
      setUploading(true);
      try { await uploadFile(userId, ideaId, file); }
      catch (e: any) { setErr(`Could not upload ${file.name}.`); }
      setUploading(false);
    }
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {!sealed && (
        <div
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed rgba(215,20,26,0.3)', borderRadius: 14,
            padding: '14px 16px', cursor: 'pointer', textAlign: 'center',
            background: 'rgba(215,20,26,0.03)', transition: 'border-color .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(215,20,26,0.65)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(215,20,26,0.3)')}
        >
          <input ref={inputRef} type="file" multiple accept={ACCEPT} style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
          <span style={{ fontSize: 13, color: '#8e8e93' }}>
            {uploading ? 'Uploading…' : 'Drop files or click · images, PDFs, code files · max 20 MB each'}
          </span>
        </div>
      )}
      {err && <p style={{ fontSize: 13, color: '#D7141A', margin: 0 }}>{err}</p>}
      {files.map(f => (
        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: 10 }}>
          <span style={{ fontSize: 18 }}>{fileIcon(f.file_type)}</span>
          <button onClick={async () => { const url = await getSignedUrl(f.storage_path); if (url) window.open(url, '_blank', 'noopener'); }}
            style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file_name}</span>
            <span style={{ fontSize: 11, color: '#8e8e93' }}>{formatBytes(f.file_size)}</span>
          </button>
          {!sealed && (
            <button onClick={() => deleteAttachment(f.id, f.storage_path).then(load)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}>
              <Icon.close size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── NewIdeaModal ──────────────────────────────────────────────────────────────

function NewIdeaModal({ onClose, onCreated, userId }) {
  const [step, setStep] = useState<'write' | 'code' | 'files'>('write');
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [claims, setClaims] = useState('');
  const [users2, setUsers2] = useState('');
  const [diff, setDiff] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  // code/repo step
  const [codeType, setCodeType] = useState<'none' | 'paste' | 'github'>('none');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedIdea, setSavedIdea] = useState<any>(null);

  const FIELDS = [
    { label: 'Problem', hint: 'What problem does this solve, and who has it?', value: problem, set: setProblem, ph: 'e.g. Night-market food vendors lose sales to long lines…', rows: 3 },
    { label: 'Solution', hint: 'How does it work when someone uses it?', value: solution, set: setSolution, ph: 'e.g. Customers pre-order and pay from a QR code at the stall…', rows: 3 },
    { label: 'Key claims', hint: '3–5 things that are new or different. Number them.', value: claims, set: setClaims, ph: '1. …\n2. …\n3. …', rows: 4 },
    { label: 'Intended users', hint: 'Who exactly would use this?', value: users2, set: setUsers2, ph: 'e.g. Street-food vendors doing 100+ orders a night…', rows: 2 },
    { label: 'How it differs', hint: 'What exists today and how is yours different?', value: diff, set: setDiff, ph: 'e.g. Square handles payment but not the queue…', rows: 3 },
  ];

  const complete = title.trim() && problem.trim() && solution.trim() && claims.trim() && users2.trim() && diff.trim();
  const buildDoc = () => `PRIOR ART DISCLOSURE\n\nTitle: ${title}\n\nPROBLEM:\n${problem}\n\nSOLUTION:\n${solution}\n\nKEY CLAIMS:\n${claims}\n\nINTENDED USERS:\n${users2}\n\nDIFFERENTIATION:\n${diff}`;

  const saveIdea = async () => {
    if (!complete) { setError('Fill in every section before saving.'); return; }
    setLoading(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { data, error: dbErr } = await supabase.from('vault_ideas').insert({
        user_id: user.id, title: title.trim(), description: problem.trim(),
        expanded_doc: buildDoc(), tags, status: 'draft',
      }).select().single();
      if (dbErr) throw dbErr;
      setSavedIdea(data);
      setStep('code');
    } catch { setError('Could not save that. Try again.'); }
    setLoading(false);
  };

  const done = () => { onCreated(savedIdea); onClose(); };

  const stepLabel = step === 'write' ? 'Step 1 of 3' : step === 'code' ? 'Step 2 of 3' : 'Step 3 of 3';
  const stepTitle = step === 'write' ? 'Write it down, then seal it.'
    : step === 'code' ? 'Add code or a GitHub repo'
    : 'Add supporting files';

  return (
    <Modal onClose={onClose}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
        {['write', 'code', 'files'].map((s, i) => (
          <div key={s} style={{
            height: 4, flex: 1, borderRadius: 99,
            background: step === s ? '#D7141A' : ((['write','code','files'].indexOf(step) > i) ? 'rgba(215,20,26,0.35)' : 'rgba(0,0,0,0.1)'),
            transition: 'background .2s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D7141A' }}>{stepLabel}</span>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0', fontFamily: 'Sora, sans-serif' }}>{stepTitle}</h2>

      {/* ── Step 1: write the idea ── */}
      {step === 'write' && (
        <>
          <p style={{ fontSize: 14, color: '#636366', margin: '6px 0 0' }}>The more detail, the stronger your record. Saved as a draft — sealing locks the timestamp.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#636366', display: 'block', marginBottom: 6 }}>Title</label>
              <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="A short, clear name for the idea" />
            </div>
            {FIELDS.map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#636366', display: 'block', marginBottom: 2 }}>
                  {f.label} <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: '#8e8e93' }}>— {f.hint}</span>
                </label>
                <textarea style={{ ...ta, minHeight: f.rows * 24 + 26 }} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#636366', display: 'block', marginBottom: 6 }}>
                Tags <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: '#8e8e93' }}>(optional)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {INDUSTRIES.map(t => (
                  <button key={t} type="button"
                    onClick={() => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}
                    style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                      background: tags.includes(t) ? '#D7141A' : 'rgba(0,0,0,0.07)',
                      color: tags.includes(t) ? '#fff' : '#1c1c1e',
                      transition: 'background .15s, color .15s',
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>
          </div>
          {error && <p style={{ fontSize: 13, color: '#D7141A', margin: '8px 0 0' }}>{error}</p>}
          <button
            disabled={loading || !complete}
            onClick={saveIdea}
            style={{
              width: '100%', minHeight: 52, borderRadius: 14, fontWeight: 700, fontSize: 16,
              background: complete ? '#D7141A' : 'rgba(0,0,0,0.1)', color: complete ? '#fff' : '#8e8e93',
              border: 'none', cursor: complete ? 'pointer' : 'default', marginTop: 8, transition: 'background .2s',
            }}
          >
            {loading ? 'Saving…' : complete ? 'Save and continue →' : 'Complete all sections to continue'}
          </button>
        </>
      )}

      {/* ── Step 2: code or repo ── */}
      {step === 'code' && (
        <>
          <p style={{ fontSize: 14, color: '#636366', margin: '6px 0 12px' }}>
            Prove you wrote the code. Paste a snippet to hash it, or point to a GitHub repo to snapshot the latest commit.
            Both get included in the seal. Skip if this is not a code idea.
          </p>

          {/* Choice pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['none', 'Skip this step'], ['paste', 'Paste code'], ['github', 'GitHub repo / commit']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setCodeType(v as any)}
                style={{
                  padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: 'none', transition: 'background .15s, color .15s',
                  background: codeType === v ? '#D7141A' : 'rgba(0,0,0,0.07)',
                  color: codeType === v ? '#fff' : '#1c1c1e',
                }}>{l}</button>
            ))}
          </div>

          {codeType === 'paste' && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#636366' }}>Paste your code</label>
              <textarea
                value={codeSnippet}
                onChange={e => setCodeSnippet(e.target.value)}
                placeholder="Paste your code, algorithm, or key implementation here…"
                style={{ ...ta, fontFamily: 'ui-monospace, monospace', fontSize: 13, minHeight: 160 }}
              />
              <div style={{ ...pinkSection, padding: '12px 14px' }}>
                <span style={{ fontSize: 13, color: '#636366' }}>
                  The code will be SHA-256 hashed separately and included in the seal certificate.
                  The hash proves this exact code existed on the seal date.
                </span>
              </div>
            </div>
          )}

          {codeType === 'github' && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#636366' }}>GitHub URL</label>
              <input
                style={inp}
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="github.com/you/your-repo  or  github.com/you/repo/commit/abc123"
              />
              <div style={{ ...pinkSection, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#D7141A' }}>What gets recorded</span>
                <span style={{ fontSize: 13, color: '#636366', lineHeight: 1.5 }}>
                  The commit SHA, tree SHA, commit message, and timestamp — fetched from GitHub at the moment you seal.
                  Anyone can verify the commit still exists on GitHub. Works with public repos; private repos need a
                  <code style={{ background: 'rgba(0,0,0,0.07)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>GITHUB_TOKEN</code> env var.
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setStep('files')}
              style={{
                flex: 1, minHeight: 52, borderRadius: 14, fontWeight: 700, fontSize: 15,
                background: '#D7141A', color: '#fff', border: 'none', cursor: 'pointer',
              }}>
              {codeType === 'none' ? 'Skip → add files' : 'Save and continue →'}
            </button>
          </div>
        </>
      )}

      {/* ── Step 3: files ── */}
      {step === 'files' && savedIdea && (
        <>
          <p style={{ fontSize: 14, color: '#636366', margin: '6px 0 12px' }}>
            Sketches, photos, mockups, design files — anything that proves you had this idea today.
            Only you can see these. Skip if you have nothing to add right now; you can add files before sealing.
          </p>
          <FileAttachments ideaId={savedIdea.id} userId={userId} sealed={false} />
          <button onClick={done}
            style={{
              width: '100%', minHeight: 52, borderRadius: 14, fontWeight: 700, fontSize: 16,
              background: '#D7141A', color: '#fff', border: 'none', cursor: 'pointer', marginTop: 8,
            }}>
            Done — idea saved ✓
          </button>
          <p style={{ fontSize: 12, color: '#8e8e93', textAlign: 'center', margin: '6px 0 0' }}>
            You can add more files and seal from your vault list.
          </p>
        </>
      )}
    </Modal>
  );
}

// ── SealModal ─────────────────────────────────────────────────────────────────

function SealModal({ idea, ownerName, onClose, onSealed }) {
  const [step, setStep] = useState<'confirm' | 'sealing' | 'done'>('confirm');
  const [sealed, setSealed] = useState<any>(null);
  const [githubRes, setGithubRes] = useState<any>(null);
  const [codeHash, setCodeHash] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Pull code/github from the idea's draft state if it had them added
  // (they come from the new-idea flow's step 2 — stored in seal_meta on the idea row if partially saved)
  // For sealing an existing draft, the user just presses Seal — no re-entry needed.

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
      setSealed(data.idea);
      setGithubRes(data.github_snapshot);
      setCodeHash(data.code_hash);
      setStep('done');
      onSealed(data.idea);
    } catch (e: any) { setError(e?.message || 'Sealing did not go through. Nothing changed — try again.'); setStep('confirm'); }
  };

  return (
    <Modal onClose={onClose} maxWidth={480}>
      {step === 'confirm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D7141A' }}>Seal this idea</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: 'Sora, sans-serif' }}>{idea.title}</h2>
          <p style={{ fontSize: 14, color: '#636366', margin: 0, lineHeight: 1.6 }}>
            Sealing hashes the exact text (SHA-256) and records the UTC time. Any later change would break the fingerprint.
            An invisible canary mark is woven into the text — if someone copy-pastes your idea, you can prove where it came from.
            <strong style={{ color: '#1c1c1e' }}> Sealing is permanent.</strong>
          </p>
          <div style={{ ...pinkSection, padding: '12px 16px', fontSize: 14 }}>
            Certificate issued to <strong style={{ color: '#D7141A' }}>{ownerName}</strong> · UTC timestamp · SHA-256 · canary mark
          </div>
          {error && <p style={{ fontSize: 13, color: '#D7141A', margin: 0 }}>{error}</p>}
          <button onClick={doSeal}
            style={{ width: '100%', minHeight: 52, borderRadius: 14, fontWeight: 700, fontSize: 16, background: '#D7141A', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Seal it
          </button>
        </div>
      )}

      {step === 'sealing' && (
        <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(215,20,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.vault size={24} style={{ color: '#D7141A' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Sealing…</h2>
          <p style={{ fontSize: 14, color: '#636366', margin: 0 }}>Hashing, timestamping, weaving canary mark.</p>
        </div>
      )}

      {step === 'done' && sealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(52,199,89,0.12)', color: '#248A3D', fontSize: 12, fontWeight: 700, alignSelf: 'flex-start' }}>
            <Icon.check size={14} /> Sealed
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: 'Sora, sans-serif' }}>Done. It existed today, and you can prove it.</h2>
          <div style={sectionStyle}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.9, wordBreak: 'break-all', color: '#1c1c1e' }}>
              ID: {sealed.seal_id}<br />
              SHA-256: {sealed.seal_hash}<br />
              Sealed: {sealed.sealed_at ? new Date(sealed.sealed_at).toUTCString() : ''}
              {codeHash && <><br />Code hash: {codeHash.slice(0, 16)}…</>}
              {githubRes && <><br />GitHub: {githubRes.owner}/{githubRes.repo} @ {githubRes.sha?.slice(0, 10)}</>}
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: '100%', minHeight: 48, borderRadius: 14, fontWeight: 700, fontSize: 15, background: 'rgba(0,0,0,0.07)', color: '#1c1c1e', border: 'none', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      )}
    </Modal>
  );
}

// ── CanaryChecker ─────────────────────────────────────────────────────────────

function CanaryChecker({ ideas }: { ideas: any[] }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<null | { found: boolean; sealId?: string; idea?: any }>(null);

  const check = () => {
    const decoded = readCanary(text);
    if (!decoded) { setResult({ found: false }); return; }
    const match = ideas.find(i => i.seal_id === decoded);
    setResult({ found: true, sealId: decoded, idea: match || null });
  };

  return (
    <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(215,20,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon.bulb size={16} style={{ color: '#D7141A' }} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Canary checker</span>
      </div>
      <p style={{ fontSize: 13, color: '#636366', margin: 0, lineHeight: 1.5 }}>
        Paste text you found online. If it was copy-pasted from one of your sealed ideas, the hidden zero-width mark will still be there — this will tell you which idea it came from.
      </p>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setResult(null); }}
        placeholder="Paste suspicious text here…"
        style={{ ...ta, minHeight: 90 }}
      />
      <button
        disabled={!text.trim()}
        onClick={check}
        style={{
          minHeight: 44, borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: text.trim() ? 'pointer' : 'default',
          background: text.trim() ? '#D7141A' : 'rgba(0,0,0,0.07)', color: text.trim() ? '#fff' : '#8e8e93',
        }}>
        Check for canary mark
      </button>
      {result && (
        result.found ? (
          <div style={{ ...pinkSection, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#D7141A', fontWeight: 700, fontSize: 13 }}>
              <Icon.check size={14} /> Canary found — Seal ID: {result.sealId}
            </div>
            {result.idea && <span style={{ fontSize: 14, fontWeight: 600 }}>"{result.idea.title}"</span>}
            <span style={{ fontSize: 13, color: '#636366', lineHeight: 1.5 }}>
              This text contains a hidden mark from your vault. Use your certificate and this match as evidence the content originated from your sealed idea.
            </span>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: '#8e8e93', margin: 0 }}>No canary mark found. It may not have come from your vault, or the platform stripped invisible characters (Twitter/X does this — most others don't).</p>
        )
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VaultPage() {
  const m = useModules();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [sealTarget, setSealTarget] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!m.user) return;
    supabase.from('vault_ideas').select('*').eq('user_id', m.user.id).is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setIdeas(data || []); setLoading(false); });
  }, [m.user]);

  const downloadCert = (idea: any) => {
    const body = idea.expanded_doc || idea.description || '';
    const sealedUtc = idea.sealed_at ? new Date(idea.sealed_at).toUTCString() : '';
    const ownerName = m.name || 'the account holder';
    const meta = idea.seal_meta || {};
    const div = '═'.repeat(60), thin = '─'.repeat(60);
    const lines = [
      div, '        GRATIA CORE — IDEA VAULT', '        CERTIFICATE OF SEALED RECORD', div, '',
      'This certifies that the idea and details below were recorded and',
      'cryptographically sealed in Gratia Core on the date and time shown.', '',
      `Certified to:   ${ownerName}`,
      `Account email:  ${m.user?.email || '—'}`,
      `Title:          ${idea.title}`,
      `Seal ID:        ${idea.seal_id}`,
      `Sealed (UTC):   ${sealedUtc}`,
      `SHA-256:        ${idea.seal_hash}`,
    ];
    if (meta.code_hash) {
      lines.push('', thin, 'CODE FINGERPRINT', thin, '');
      lines.push(`Code SHA-256:   ${meta.code_hash}`);
      if (meta.code_preview) lines.push(`Code preview:   ${meta.code_preview}`);
    }
    if (meta.github) {
      lines.push('', thin, 'GITHUB SNAPSHOT', thin, '');
      lines.push(`Repository:     ${meta.github.owner}/${meta.github.repo}`);
      lines.push(`Commit SHA:     ${meta.github.sha}`);
      lines.push(`Tree SHA:       ${meta.github.tree_sha}`);
      lines.push(`Committed at:   ${meta.github.committed_at}`);
      lines.push(`Commit message: ${meta.github.message}`);
      lines.push(`GitHub URL:     ${meta.github.html_url}`);
    }
    lines.push(
      '', thin, 'SEALED DETAILS — the exact content this certificate covers', thin, '', body, '',
      thin, 'WHAT THIS PROVES', thin, '',
      'The SHA-256 value above is a unique fingerprint of the sealed record.',
      'Any change to a single character of the details would produce a',
      'different fingerprint. Because the fingerprint matches, this document',
      'proves the details existed in exactly this form, under this account,',
      'on the date and time recorded above.', '',
      'CANARY MARK: An invisible zero-width character watermark was woven into',
      'the sealed text. If this idea\'s text appears elsewhere, paste it into',
      'the Canary Checker in your Gratia Core vault to confirm it came from here.', '',
      thin, 'ATTESTATION', thin, '',
      `Sealed by:  ${ownerName}`, '',
      'Signature:  __________________________________    Date: ____________', '',
      'Issued by Gratia Core — gratiacore.com',
      `Verification reference: ${idea.seal_id}`, '',
      thin,
      'This is a record of prior existence and authorship on the recorded date.',
      'It is NOT a patent, copyright, trademark, or government registration, and',
      'it is not legal advice. Gratia Core is not a law firm. For legal protection',
      'of an idea, consult a licensed attorney.',
      div,
    );
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = `GC-${idea.seal_id}-certificate.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const sealedCount = ideas.filter(i => i.status === 'sealed').length;
  const shown = ideas.filter(i => filter === 'all' || i.status === filter);

  return (
    <div className="gc-wrap">
      <Header back right={
        <span className="gc-pill gc-glass gc-glass--pink" style={{ borderRadius: 999 }}>
          <span className="gc-dot" />{m.loading ? '…' : m.access.vault ? 'On · $5/mo' : 'Off'}
        </span>
      } />

      <ModuleGate id="vault" state={m.stateOf('vault')} busy={m.busy === 'vault'} onTurnOn={() => m.toggle('vault', true)}>

        {showNew && m.user && (
          <NewIdeaModal userId={m.user.id} onClose={() => setShowNew(false)} onCreated={i => setIdeas(p => [i, ...p])} />
        )}
        {sealTarget && (
          <SealModal idea={sealTarget} ownerName={m.name} onClose={() => setSealTarget(null)}
            onSealed={u => setIdeas(p => p.map(i => i.id === u.id ? u : i))} />
        )}

        {/* ── header ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ fontSize: 'clamp(28px,5vw,38px)', fontWeight: 500, lineHeight: 1.12, margin: 0, fontFamily: 'Sora, sans-serif' }}>
            Idea Vault
          </h1>
          <p style={{ fontSize: 16, color: '#636366', margin: 0 }}>
            Seal an idea. Timestamped proof it existed today — yours to show anyone.
          </p>
        </div>

        {/* ── two-column layout ── */}
        <div className="gc-two" style={{ gap: 32 }}>

          {/* left: seal CTA + idea list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* seal CTA card */}
            <div style={{ ...primarySection, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* orb */}
              <div style={{ position: 'relative', overflow: 'hidden', margin: '-22px -24px 0', height: 80, borderRadius: '24px 24px 0 0' }}>
                <div style={{ position: 'absolute', left: '10%', top: '-20px', width: '60%', height: '120%', background: 'radial-gradient(circle at 50% 50%, rgba(215,20,26,0.22), rgba(215,20,26,0) 70%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', left: '50%', top: '-10px', width: '50%', height: '100%', background: 'radial-gradient(circle at 50% 50%, rgba(255,120,126,0.28), rgba(255,120,126,0) 70%)', borderRadius: '50%' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>Seal something new</h2>
                <p style={{ fontSize: 14, color: '#636366', margin: 0, lineHeight: 1.5 }}>
                  Write the idea in your own words, attach sketches or code, link a GitHub repo.
                  Everything gets hashed and timestamped. Only you can read it.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#636366' }}>
                  Issued to <strong style={{ color: '#D7141A' }}>{m.name || '…'}</strong> · UTC · SHA-256 · canary
                </span>
                <button onClick={() => setShowNew(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: '#D7141A', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  <Icon.plus size={16} /> New idea
                </button>
              </div>
            </div>

            {/* filter + list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Your seals</h2>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#8e8e93', marginRight: 4 }}>
                    {sealedCount} sealed · {ideas.length - sealedCount} draft{ideas.length - sealedCount === 1 ? '' : 's'}
                  </span>
                  {[['all', 'All'], ['sealed', 'Sealed'], ['draft', 'Drafts']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setFilter(v)}
                      style={{
                        padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', border: 'none', transition: 'background .15s, color .15s',
                        background: filter === v ? '#D7141A' : 'rgba(0,0,0,0.07)',
                        color: filter === v ? '#fff' : '#1c1c1e',
                      }}>{l}</button>
                  ))}
                </div>
              </div>

              {loading
                ? <p style={{ fontSize: 14, color: '#8e8e93', textAlign: 'center', padding: 40 }}>Loading your vault…</p>
                : ideas.length === 0
                  ? (
                    <div style={{ ...sectionStyle, textAlign: 'center', padding: 36, border: '2px dashed rgba(215,20,26,0.3)' }}>
                      <Icon.vault size={32} style={{ color: 'rgba(215,20,26,0.4)', marginBottom: 10 }} />
                      <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>Nothing sealed yet</p>
                      <p style={{ fontSize: 14, color: '#8e8e93', maxWidth: 380, margin: '0 auto 16px' }}>Document it before you share it. Write the idea, attach your sketches or code, seal it.</p>
                      <button onClick={() => setShowNew(true)}
                        style={{ padding: '10px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: '#D7141A', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        Write your first idea
                      </button>
                    </div>
                  )
                  : shown.length === 0
                    ? <p style={{ fontSize: 14, color: '#8e8e93', textAlign: 'center', padding: 24 }}>No {filter} ideas.</p>
                    : shown.map((idea, i) => {
                      const sealed = idea.status === 'sealed';
                      const isOpen = expanded.has(idea.id);
                      const meta = idea.seal_meta || {};
                      return (
                        <article key={idea.id} style={{
                          ...(sealed ? primarySection : sectionStyle),
                          animationDelay: `${i * 0.04}s`,
                          display: 'flex', flexDirection: 'column', gap: 10,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, fontSize: 16 }}>{idea.title}</span>
                                {sealed
                                  ? <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(52,199,89,0.12)', color: '#248A3D', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.check size={11} /> Sealed</span>
                                  : <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(215,20,26,0.1)', color: '#D7141A' }}>Draft</span>}
                                {(idea.tags || []).slice(0, 3).map((t: string) => (
                                  <span key={t} style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(215,20,26,0.07)', color: '#D7141A' }}>{t}</span>
                                ))}
                              </div>
                              {sealed
                                ? <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#636366', lineHeight: 1.6 }}>
                                    {idea.sealed_at ? new Date(idea.sealed_at).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : ''} · {idea.seal_id} · sha256 {idea.seal_hash?.slice(0, 4)}…{idea.seal_hash?.slice(-4)}
                                    {meta.github && <> · <Icon.globe size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> github</>}
                                    {meta.code_hash && <> · 💻 code hash</>}
                                  </span>
                                : <span style={{ fontSize: 13, color: '#8e8e93' }}>Created {fmtDate(idea.created_at)} · not timestamped until you seal it</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button onClick={() => toggleExpand(idea.id)}
                                style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(0,0,0,0.07)', color: '#1c1c1e', border: 'none', cursor: 'pointer' }}>
                                {isOpen ? 'Hide files' : 'Files'}
                              </button>
                              {sealed
                                ? <button onClick={() => downloadCert(idea)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#D7141A', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                    <Icon.download size={15} /> Certificate
                                  </button>
                                : <button onClick={() => setSealTarget(idea)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#D7141A', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                    <Icon.vault size={15} /> Seal now
                                  </button>}
                            </div>
                          </div>

                          {isOpen && m.user && (
                            <div style={{ marginTop: 6, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                              {sealed && <p style={{ fontSize: 12, color: '#8e8e93', margin: '0 0 8px' }}>Files attached at sealing — read only.</p>}
                              <FileAttachments ideaId={idea.id} userId={m.user.id} sealed={sealed} />
                            </div>
                          )}
                        </article>
                      );
                    })}
            </div>
          </div>

          {/* right rail */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* what a seal proves */}
            <div style={{ ...pinkSection, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#D7141A' }}>What a seal proves</span>
              <p style={{ fontSize: 14, color: '#636366', margin: 0, lineHeight: 1.5 }}>
                That this exact content — text, code hash, GitHub commit, and files — existed under your name at this exact time.
                Useful for small claims court, IP disputes, or showing a client you created it first.
                It is not a patent — it is evidence you can bring to one.
              </p>
              <ul style={{ fontSize: 13, color: '#636366', margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                <li>Clothing or product designers → bring the certificate + sealed sketches to small claims</li>
                <li>Developers → code hash + GitHub snapshot proves the commit was yours</li>
                <li>Anyone → canary marks let you catch copy-paste theft</li>
              </ul>
            </div>

            {/* canary checker */}
            <CanaryChecker ideas={ideas} />

            {/* disclaimer */}
            <p style={{ fontSize: 12, color: '#8e8e93', textAlign: 'center', lineHeight: 1.5 }}>
              A seal records prior existence and integrity. It is not a patent and not legal advice — for full protection, talk to a licensed IP attorney.
            </p>
          </aside>
        </div>
      </ModuleGate>
    </div>
  );
}
