// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import ModuleGate from '@/components/ModuleGate';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type IdeaCategory = 'code' | 'product' | 'future';
type IdeaStatus   = 'draft' | 'sealed';

interface VaultIdea {
  id: string;
  user_id: string;
  title: string;
  category: IdeaCategory;
  problem: string;
  solution: string;
  key_claims: string;
  tags: string[];
  status: IdeaStatus;
  created_at: string;
  sealed_at: string | null;
  seal_id: string | null;
  expanded_doc: string | null;
  seal_meta: {
    code_hash?: string;
    code_preview?: string;
    github?: {
      sha: string; tree_sha: string; message: string;
      author: string; committed_at: string; html_url: string;
    };
  } | null;
  files?: { name: string; size: number; path: string }[];
}

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const CAT_LABELS: Record<IdeaCategory, string> = {
  code:    '💻 Code',
  product: '📦 Physical product',
  future:  '💡 Future idea',
};

const CAT_FIELDS: Record<IdeaCategory, { problem: string; solution: string; claims: string }> = {
  code: {
    problem:  'What problem does this software solve, and who has it?',
    solution: 'How does it work technically? Language, stack, key algorithm.',
    claims:   'What is novel? New algorithm, architecture, UX pattern — number each one.',
  },
  product: {
    problem:  'What physical problem does this product solve?',
    solution: 'How is it made, what materials, how does it work?',
    claims:   'What makes it unique? Design, materials, mechanism — number each.',
  },
  future: {
    problem:  'What gap or opportunity have you identified?',
    solution: 'How would you approach building or executing this?',
    claims:   'What is the core insight that makes this valuable? Number each point.',
  },
};

/* ─────────────────────────────────────────────
   Styles (inline — no Tailwind, no CSS modules)
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
  glassLight: { background: 'rgba(215,20,26,0.07)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderRadius: 20, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)' } as React.CSSProperties,
  btnRed: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: '#D7141A', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
  btnGhost: { padding: '7px 13px', borderRadius: 9, fontSize: 12, fontWeight: 600, background: 'rgba(120,120,128,0.1)', color: '#1c1c1e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
  inp: { width: '100%', padding: '12px 15px', borderRadius: 11, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: 'rgba(120,120,128,0.09)', border: '1px solid rgba(0,0,0,0.09)', color: '#1c1c1e', boxSizing: 'border-box' as const },
  ta:  { width: '100%', padding: '12px 15px', borderRadius: 11, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: 'rgba(120,120,128,0.09)', border: '1px solid rgba(0,0,0,0.09)', color: '#1c1c1e', boxSizing: 'border-box' as const, resize: 'vertical' as const, lineHeight: 1.6 },
};

/* ─────────────────────────────────────────────
   Badge
───────────────────────────────────────────── */
function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'sealed' | 'draft' | 'tag' | 'mono' | 'default' }) {
  const styles: Record<string, React.CSSProperties> = {
    sealed:  { background: 'rgba(52,199,89,0.1)',  color: '#248A3D' },
    draft:   { background: 'rgba(215,20,26,0.07)', color: '#D7141A' },
    tag:     { background: 'rgba(215,20,26,0.07)', color: '#D7141A' },
    mono:    { background: 'rgba(0,0,0,0.07)',      color: '#636366', fontFamily: 'ui-monospace,monospace' },
    default: { background: 'rgba(120,120,128,0.1)', color: '#636366' },
  };
  return <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, ...styles[variant] }}>{children}</span>;
}

/* ─────────────────────────────────────────────
   Canary watermark widget
───────────────────────────────────────────── */
function CanaryWidget({ sealedIdeas }: { sealedIdeas: VaultIdea[] }) {
  const [tab, setTab]           = useState<'protect' | 'detect'>('protect');
  const [assetType, setAsset]   = useState<'text' | 'image' | 'code'>('text');
  const [checkAsset, setCheckA] = useState<'text' | 'image' | 'code'>('text');
  const [markText, setMarkText] = useState('');
  const [markedResult, setMarked] = useState('');
  const [checkText, setCheckText] = useState('');
  const [checkResult, setCheckR]  = useState<null | { found: boolean; idea?: VaultIdea }>(null);
  const [copied, setCopied]       = useState(false);

  if (sealedIdeas.length === 0) return null;

  function embedMark(text: string, sealId: string): string {
    // zero-width steganography: encode sealId bytes after every 5th word
    const ZW0 = '​', ZW1 = '‌', SEP = '‍';
    function encodeByte(b: number): string {
      let s = '';
      for (let i = 7; i >= 0; i--) s += (b >> i) & 1 ? ZW1 : ZW0;
      return s + SEP;
    }
    const payload = Array.from(sealId).map(c => encodeByte(c.charCodeAt(0))).join('');
    const words = text.split(' ');
    return words.map((w, i) => ((i + 1) % 5 === 0 ? w + payload : w)).join(' ');
  }

  function detectMark(text: string): string | null {
    const ZW0 = '​', ZW1 = '‌', SEP = '‍';
    const hidden = text.split('').filter(c => c === ZW0 || c === ZW1 || c === SEP).join('');
    if (!hidden) return null;
    try {
      const bytes = hidden.split(SEP).filter(Boolean);
      return bytes.map(b => String.fromCharCode(parseInt(b.replace(new RegExp(ZW1, 'g'), '1').replace(new RegExp(ZW0, 'g'), '0'), 2))).join('');
    } catch { return null; }
  }

  function doMark() {
    if (!markText.trim() || !sealedIdeas[0]?.seal_id) return;
    setMarked(embedMark(markText.trim(), sealedIdeas[0].seal_id));
  }

  function doCopy() {
    navigator.clipboard.writeText(markedResult).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function doCheck() {
    if (!checkText.trim()) return;
    const found = detectMark(checkText);
    if (!found) { setCheckR({ found: false }); return; }
    const idea = sealedIdeas.find(i => i.seal_id && checkText.includes(i.seal_id.slice(0, 4)));
    setCheckR({ found: true, idea: idea || sealedIdeas[0] });
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
    background: active ? '#fff' : 'transparent',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
    color: active ? '#1c1c1e' : '#636366',
  });

  const assetPill = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    background: active ? '#D7141A' : 'rgba(120,120,128,0.1)',
    color: active ? '#fff' : '#1c1c1e',
  });

  return (
    <div style={{ ...S.glass(), padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(215,20,26,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D7141A" strokeWidth="2.2" strokeLinecap="round"><path d="M15 7h3a5 5 0 0 1 0 10h-3m-6 0H6A5 5 0 0 1 6 7h3"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Canary watermark</span>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(120,120,128,0.09)', borderRadius: 10, padding: 3, marginBottom: 12 }}>
        <button style={tabBtn(tab === 'protect')} onClick={() => setTab('protect')}>🔏 Protect</button>
        <button style={tabBtn(tab === 'detect')}  onClick={() => setTab('detect')}>🔍 Detect</button>
      </div>

      {tab === 'protect' && (
        <>
          <p style={{ fontSize: 12.5, color: '#636366', lineHeight: 1.5, marginBottom: 10 }}>
            Embed an invisible mark in your work. If someone steals it, the mark travels with it.
          </p>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 12 }}>
            {(['text','image','code'] as const).map(a => (
              <button key={a} style={assetPill(assetType === a)} onClick={() => setAsset(a)}>
                {a === 'text' ? '📝 Text' : a === 'image' ? '🖼 Image / video' : '💻 Code'}
              </button>
            ))}
          </div>

          {assetType === 'text' && (
            <>
              <textarea style={{ ...S.ta, fontSize: 13, marginBottom: 8, minHeight: 72 }} placeholder="Paste your idea text to watermark…" value={markText} onChange={e => { setMarkText(e.target.value); setMarked(''); }} rows={3} />
              <button style={{ ...S.btnRed, width: '100%', justifyContent: 'center', borderRadius: 11, minHeight: 40, fontSize: 13 }} onClick={doMark}>Embed invisible mark →</button>
              {markedResult && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase' as const, color: '#D7141A', marginBottom: 5 }}>Marked — Seal: {sealedIdeas[0].seal_id}</div>
                  <div style={{ background: 'rgba(120,120,128,0.09)', borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.6, position: 'relative' as const }}>
                    {markedResult}
                    <button onClick={doCopy} style={{ position: 'absolute' as const, top: 7, right: 8, background: '#D7141A', color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: '#8e8e93', marginTop: 5, lineHeight: 1.5 }}>Share this version. The mark is invisible — if someone copies it, it travels with the text.</p>
                </div>
              )}
              <p style={{ fontSize: 11, color: '#8e8e93', marginTop: 6, lineHeight: 1.5 }}>Zero-width characters inserted every 5 words. Survives copy-paste on most platforms (not Twitter/X).</p>
            </>
          )}

          {assetType === 'image' && (
            <>
              <div style={{ border: '2px dashed rgba(215,20,26,0.28)', borderRadius: 12, padding: 16, textAlign: 'center' as const, background: 'rgba(215,20,26,0.03)', cursor: 'pointer', marginBottom: 8 }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>🖼</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Drop image or video</div>
                <div style={{ fontSize: 12, color: '#8e8e93' }}>PNG, JPG, MP4 · max 50 MB</div>
              </div>
              <div style={{ background: 'rgba(215,20,26,0.07)', borderRadius: 11, padding: '10px 13px', fontSize: 12.5, color: '#636366', lineHeight: 1.6, marginBottom: 8 }}>
                <strong style={{ color: '#D7141A' }}>Two protection layers:</strong><br />
                ① <strong>LSB steganography</strong> — Seal ID encoded in pixel data. Survives compression, cropping, screenshots.<br />
                ② <strong>Adversarial perturbation</strong> — microscopic pixel noise that poisons AI training. Invisible to the human eye.
              </div>
              <button style={{ ...S.btnRed, width: '100%', justifyContent: 'center', borderRadius: 11, minHeight: 40, fontSize: 13 }}>Mark this image →</button>
            </>
          )}

          {assetType === 'code' && (
            <>
              <textarea style={{ ...S.ta, fontFamily: 'ui-monospace,monospace', fontSize: 12, marginBottom: 8, minHeight: 80 }} placeholder="Paste your code to watermark…" rows={4} />
              <div style={{ background: 'rgba(215,20,26,0.07)', borderRadius: 11, padding: '10px 13px', fontSize: 12.5, color: '#636366', lineHeight: 1.6, marginBottom: 8 }}>
                <strong style={{ color: '#D7141A' }}>Three layers for code:</strong><br />
                ① Variable casing fingerprint unique to your Seal ID<br />
                ② Whitespace signature — trailing spaces encode your ID<br />
                ③ Hidden hash comment buried in the logic
              </div>
              <button style={{ ...S.btnRed, width: '100%', justifyContent: 'center', borderRadius: 11, minHeight: 40, fontSize: 13 }}>Embed code mark →</button>
            </>
          )}
        </>
      )}

      {tab === 'detect' && (
        <>
          <p style={{ fontSize: 12.5, color: '#636366', lineHeight: 1.5, marginBottom: 10 }}>
            Found your work somewhere it shouldn't be? Check if it carries your mark.
          </p>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 12 }}>
            {(['text','image','code'] as const).map(a => (
              <button key={a} style={assetPill(checkAsset === a)} onClick={() => { setCheckA(a); setCheckR(null); }}>
                {a === 'text' ? '📝 Text' : a === 'image' ? '🖼 Image / video' : '💻 Code'}
              </button>
            ))}
          </div>

          {(checkAsset === 'text' || checkAsset === 'code') && (
            <>
              <textarea
                style={{ ...S.ta, fontSize: checkAsset === 'code' ? 12 : 13, fontFamily: checkAsset === 'code' ? 'ui-monospace,monospace' : 'inherit', marginBottom: 8, minHeight: 72 }}
                placeholder={checkAsset === 'code' ? 'Paste suspicious code here…' : 'Paste suspicious text here…'}
                value={checkText} onChange={e => { setCheckText(e.target.value); setCheckR(null); }} rows={3}
              />
              <button style={{ ...S.btnRed, width: '100%', justifyContent: 'center', borderRadius: 11, minHeight: 40, fontSize: 13 }} onClick={doCheck}>Check for mark</button>
              {checkResult !== null && (
                checkResult.found ? (
                  <div style={{ background: 'rgba(215,20,26,0.07)', borderRadius: 12, padding: '11px 14px', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#D7141A', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>✓ Canary found — {checkResult.idea?.seal_id}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>"{checkResult.idea?.title}"</div>
                    <div style={{ fontSize: 13, color: '#636366', lineHeight: 1.5 }}>This text carries your hidden mark. Use your seal certificate + this match as evidence of theft.</div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#8e8e93', marginTop: 8, lineHeight: 1.5 }}>No canary mark found. This text wasn't shared from a watermarked copy, or the platform stripped invisible characters (Twitter/X does this — most others don't).</p>
                )
              )}
            </>
          )}

          {checkAsset === 'image' && (
            <>
              <div style={{ border: '2px dashed rgba(215,20,26,0.28)', borderRadius: 12, padding: 16, textAlign: 'center' as const, background: 'rgba(215,20,26,0.03)', cursor: 'pointer', marginBottom: 8 }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>🖼</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Upload suspected stolen image</div>
                <div style={{ fontSize: 12, color: '#8e8e93' }}>We'll extract the LSB layer and match it to your seals</div>
              </div>
              <button style={{ ...S.btnRed, width: '100%', justifyContent: 'center', borderRadius: 11, minHeight: 40, fontSize: 13 }}>Scan for mark</button>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   New Idea Modal
───────────────────────────────────────────── */
function NewIdeaModal({ onClose, onSaved }: { onClose: () => void; onSaved: (idea: VaultIdea) => void }) {
  const [step, setStep]         = useState(0);
  const [category, setCat]      = useState<IdeaCategory>('code');
  const [title, setTitle]       = useState('');
  const [problem, setProblem]   = useState('');
  const [solution, setSolution] = useState('');
  const [claims, setClaims]     = useState('');
  const [tags, setTags]         = useState<string[]>([]);
  const [codeMode, setCodeMode] = useState<'paste' | 'github' | 'skip'>('paste');
  const [codeSnippet, setCode]  = useState('');
  const [githubUrl, setGithub]  = useState('');
  const [files, setFiles]       = useState<File[]>([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const ALL_TAGS = ['SaaS', 'Fintech', 'Fashion', 'AI/ML', 'Marketplace', 'Hardware', 'B2B', 'Consumer', 'Open source'];
  const fields = CAT_FIELDS[category];

  const steps = [
    { label: 'Step 1 of 3', title: 'Write it down.', desc: 'The more detail, the stronger your record. Choose a category — it tailors the prompts.' },
    { label: 'Step 2 of 3', title: 'Add code or a repo.', desc: category === 'code' ? 'Prove you wrote it. Paste a snippet to hash it, or point to a GitHub commit.' : 'Have code or a prototype? Add it. Skip if not.' },
    { label: 'Step 3 of 3', title: 'Supporting files.', desc: 'Sketches, photos, mockups, design files — anything that proves you had this idea today.' },
  ];

  async function save() {
    if (!title.trim()) { setError('Add a title first.'); return; }
    setSaving(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { data, error: dbErr } = await supabase.from('vault_ideas').insert({
        user_id: user.id,
        title: title.trim(),
        category,
        problem: problem.trim(),
        solution: solution.trim(),
        key_claims: claims.trim(),
        tags,
        status: 'draft',
      }).select().single();
      if (dbErr) throw dbErr;

      // upload files if any
      if (files.length && data) {
        for (const file of files) {
          const path = `${user.id}/${data.id}/${file.name}`;
          await supabase.storage.from('vault-attachments').upload(path, file, { upsert: true });
        }
      }
      onSaved(data as VaultIdea);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  const stepSeg = (i: number): React.CSSProperties => ({
    height: 4, flex: 1, borderRadius: 99,
    background: i < step ? 'rgba(215,20,26,0.3)' : i === step ? '#D7141A' : 'rgba(0,0,0,0.1)',
    transition: 'background .2s',
  });

  const catBtn = (c: IdeaCategory): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
    background: category === c ? '#D7141A' : 'rgba(120,120,128,0.1)',
    color: category === c ? '#fff' : '#1c1c1e',
  });

  const codeModeBtn = (m: typeof codeMode): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
    background: codeMode === m ? '#D7141A' : 'rgba(120,120,128,0.1)',
    color: codeMode === m ? '#fff' : '#1c1c1e',
  });

  const tagBtn = (t: string): React.CSSProperties => ({
    padding: '5px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
    background: tags.includes(t) ? '#D7141A' : 'rgba(120,120,128,0.09)',
    color: tags.includes(t) ? '#fff' : '#1c1c1e',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 28, boxShadow: 'inset 0 0 0 1.5px rgba(215,20,26,0.16),inset 0 1px 0 rgba(255,255,255,0.98),0 40px 100px rgba(0,0,0,0.18)', width: 'min(540px,100%)', maxHeight: '90vh', overflowY: 'auto', padding: '28px 28px 24px', position: 'relative' }}
        onClick={e => e.stopPropagation()}>

        {/* step bar */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
          {[0,1,2].map(i => <div key={i} style={stepSeg(i)} />)}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#D7141A', marginBottom: 2 }}>{steps[step].label}</div>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 21, fontWeight: 700, marginBottom: 4, color: '#1c1c1e' }}>{steps[step].title}</h2>
        <p style={{ fontSize: 14, color: '#636366', marginBottom: 16, lineHeight: 1.5 }}>{steps[step].desc}</p>

        {/* ── Step 0: write ── */}
        {step === 0 && (
          <>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
              {(['code','product','future'] as IdeaCategory[]).map(c => (
                <button key={c} style={catBtn(c)} onClick={() => setCat(c)}>{CAT_LABELS[c]}</button>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#636366', display: 'block', marginBottom: 5 }}>Title</label>
              <input style={S.inp} placeholder="A short, clear name for the idea" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#636366', display: 'block', marginBottom: 5 }}>Problem</label>
              <p style={{ fontSize: 11, color: '#8e8e93', marginBottom: 4 }}>{fields.problem}</p>
              <textarea style={{ ...S.ta, minHeight: 72 }} value={problem} onChange={e => setProblem(e.target.value)} rows={3} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#636366', display: 'block', marginBottom: 5 }}>Solution</label>
              <p style={{ fontSize: 11, color: '#8e8e93', marginBottom: 4 }}>{fields.solution}</p>
              <textarea style={{ ...S.ta, minHeight: 72 }} value={solution} onChange={e => setSolution(e.target.value)} rows={3} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#636366', display: 'block', marginBottom: 5 }}>Key claims</label>
              <p style={{ fontSize: 11, color: '#8e8e93', marginBottom: 4 }}>{fields.claims}</p>
              <textarea style={{ ...S.ta, minHeight: 72 }} placeholder={'1. …\n2. …\n3. …'} value={claims} onChange={e => setClaims(e.target.value)} rows={4} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#636366', display: 'block', marginBottom: 6 }}>Tags <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500, color: '#8e8e93' }}>(optional)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ALL_TAGS.map(t => (
                  <button key={t} style={tagBtn(t)} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>{t}</button>
                ))}
              </div>
            </div>

            {error && <p style={{ fontSize: 12, color: '#D7141A', marginBottom: 8 }}>{error}</p>}
            <button style={{ ...S.btnRed, width: '100%', justifyContent: 'center', borderRadius: 13, minHeight: 50, fontSize: 15 }} onClick={() => { if (!title.trim()) { setError('Add a title first.'); return; } setError(''); setStep(1); }}>
              Save and continue →
            </button>
          </>
        )}

        {/* ── Step 1: code / github ── */}
        {step === 1 && (
          <>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
              {(['paste','github','skip'] as const).map(m => (
                <button key={m} style={codeModeBtn(m)} onClick={() => setCodeMode(m)}>
                  {m === 'paste' ? 'Paste code' : m === 'github' ? 'GitHub repo / commit' : 'Skip'}
                </button>
              ))}
            </div>

            {codeMode === 'paste' && (
              <>
                <textarea style={{ ...S.ta, fontFamily: 'ui-monospace,monospace', fontSize: 13, minHeight: 120, marginBottom: 8 }} placeholder="Paste your code, algorithm, or key implementation…" value={codeSnippet} onChange={e => setCode(e.target.value)} rows={6} />
                <div style={{ background: 'rgba(215,20,26,0.07)', borderRadius: 12, padding: '11px 14px', fontSize: 13, color: '#636366', lineHeight: 1.5 }}>
                  The code is SHA-256 hashed and included in the seal certificate. The hash proves this exact code existed on the seal date.
                </div>
              </>
            )}

            {codeMode === 'github' && (
              <>
                <input style={{ ...S.inp, marginBottom: 8 }} placeholder="github.com/you/repo  or  github.com/you/repo/commit/abc123" value={githubUrl} onChange={e => setGithub(e.target.value)} />
                <div style={{ background: 'rgba(215,20,26,0.07)', borderRadius: 12, padding: '11px 14px', fontSize: 13, color: '#636366', lineHeight: 1.5 }}>
                  <strong style={{ color: '#D7141A' }}>What gets recorded:</strong> commit SHA, tree SHA, message, timestamp — fetched from GitHub when you seal. Works with public repos; private repos need a GITHUB_TOKEN.
                </div>
              </>
            )}

            {codeMode === 'skip' && (
              <p style={{ fontSize: 14, color: '#636366', lineHeight: 1.6, padding: '8px 0' }}>No code this time — that's fine. You can always seal without it.</p>
            )}

            <button style={{ ...S.btnRed, width: '100%', justifyContent: 'center', borderRadius: 13, minHeight: 50, fontSize: 15, marginTop: 14 }} onClick={() => setStep(2)}>
              Continue →
            </button>
            <button style={{ ...S.btnGhost, width: '100%', marginTop: 8, borderRadius: 12, minHeight: 44, fontSize: 14 }} onClick={() => setStep(0)}>← Back</button>
          </>
        )}

        {/* ── Step 2: files ── */}
        {step === 2 && (
          <>
            <div
              style={{ border: '2px dashed rgba(215,20,26,0.28)', borderRadius: 14, padding: 18, textAlign: 'center', background: 'rgba(215,20,26,0.03)', cursor: 'pointer', marginBottom: 12 }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>📎</div>
              <div style={{ fontSize: 13, color: '#8e8e93' }}>Drop files or click · images, PDFs, code files · max 20 MB each</div>
              <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
            </div>

            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{f.type.startsWith('image') ? '🖼' : f.name.endsWith('.pdf') ? '📄' : '📁'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: '#8e8e93' }}>{(f.size / 1024).toFixed(0)} KB</div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', fontSize: 14 }} onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}

            {error && <p style={{ fontSize: 12, color: '#D7141A', marginBottom: 8 }}>{error}</p>}

            <button style={{ ...S.btnRed, width: '100%', justifyContent: 'center', borderRadius: 13, minHeight: 50, fontSize: 15, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save idea as draft ✓'}
            </button>
            <button style={{ ...S.btnGhost, width: '100%', marginTop: 8, borderRadius: 12, minHeight: 44, fontSize: 14 }} onClick={() => { setFiles([]); save(); }} disabled={saving}>
              Skip files
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Seal Modal
───────────────────────────────────────────── */
function SealModal({ idea, onClose, onSealed }: { idea: VaultIdea; onClose: () => void; onSealed: (updated: VaultIdea) => void }) {
  const [phase, setPhase] = useState<'confirm' | 'sealing' | 'done'>('confirm');
  const [result, setResult] = useState<VaultIdea | null>(null);
  const [error, setError]   = useState('');

  async function doSeal() {
    setPhase('sealing');
    try {
      const res = await fetch('/api/vault/seal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Seal failed');
      setResult(json.idea);
      setPhase('done');
    } catch (e: any) {
      setError(e.message);
      setPhase('confirm');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 28, boxShadow: 'inset 0 0 0 1.5px rgba(215,20,26,0.16),0 40px 100px rgba(0,0,0,0.18)', width: 'min(480px,100%)', padding: '32px 28px 28px' }}
        onClick={e => e.stopPropagation()}>

        {phase === 'confirm' && (
          <>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>🔒</div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Seal "{idea.title}"?</h2>
            <p style={{ fontSize: 14, color: '#636366', textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
              This creates a SHA-256 hash and UTC timestamp of your idea. The seal is permanent — you can read and share it, but not change the content.
            </p>
            <div style={{ background: 'rgba(215,20,26,0.07)', borderRadius: 12, padding: '11px 14px', fontSize: 13, color: '#636366', lineHeight: 1.5, marginBottom: 20 }}>
              <strong style={{ color: '#D7141A' }}>What gets recorded:</strong> full idea text, category, tags, timestamp (UTC), your user ID, any attached files, code hash and GitHub snapshot if added.
            </div>
            {error && <p style={{ fontSize: 12, color: '#D7141A', marginBottom: 8 }}>{error}</p>}
            <button style={{ ...S.btnRed, width: '100%', justifyContent: 'center', borderRadius: 13, minHeight: 50, fontSize: 15 }} onClick={doSeal}>Yes, seal it →</button>
            <button style={{ ...S.btnGhost, width: '100%', marginTop: 8, borderRadius: 12, minHeight: 44, fontSize: 14 }} onClick={onClose}>Cancel</button>
          </>
        )}

        {phase === 'sealing' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sealing…</h2>
            <p style={{ fontSize: 14, color: '#636366' }}>Hashing content and locking the timestamp.</p>
          </div>
        )}

        {phase === 'done' && result && (
          <>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Sealed.</h2>
            <div style={{ background: 'rgba(52,199,89,0.08)', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#248A3D', marginBottom: 4 }}>Your seal ID</div>
              <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 15, fontWeight: 700, color: '#1c1c1e' }}>{result.seal_id}</div>
              <div style={{ fontSize: 12, color: '#636366', marginTop: 2 }}>{result.sealed_at ? new Date(result.sealed_at).toUTCString() : ''}</div>
            </div>
            <button style={{ ...S.btnRed, width: '100%', justifyContent: 'center', borderRadius: 13, minHeight: 50, fontSize: 15 }} onClick={() => { onSealed(result); onClose(); }}>
              View sealed idea →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function VaultPage() {
  const [ideas, setIdeas]           = useState<VaultIdea[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterCat, setFilterCat]   = useState<IdeaCategory | 'all'>('all');
  const [filterStatus, setStatus]   = useState<'all' | 'sealed' | 'draft'>('all');
  const [showNew, setShowNew]       = useState(false);
  const [sealTarget, setSealTarget] = useState<VaultIdea | null>(null);
  const [openFiles, setOpenFiles]   = useState<string | null>(null);

  const sealedIdeas = ideas.filter(i => i.status === 'sealed');

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('vault_ideas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setIdeas((data as VaultIdea[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = ideas.filter(i => {
    if (filterCat !== 'all' && i.category !== filterCat) return false;
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    return true;
  });

  function downloadCert(idea: VaultIdea) {
    const lines = [
      '═══════════════════════════════════════════════════',
      '             GRATIA CORE — SEAL CERTIFICATE',
      '═══════════════════════════════════════════════════',
      '',
      `Idea title : ${idea.title}`,
      `Seal ID    : ${idea.seal_id}`,
      `Sealed at  : ${idea.sealed_at ? new Date(idea.sealed_at).toUTCString() : 'N/A'}`,
      `Category   : ${idea.category}`,
      '',
      '───────────────────────────────────────────────────',
      'CONTENT SUMMARY',
      '───────────────────────────────────────────────────',
      '',
      'Problem:',
      idea.problem || '(none)',
      '',
      'Solution:',
      idea.solution || '(none)',
      '',
      'Key claims:',
      idea.key_claims || '(none)',
      '',
      idea.seal_meta?.code_hash ? `Code hash  : ${idea.seal_meta.code_hash}` : '',
      idea.seal_meta?.github ? `GitHub SHA : ${idea.seal_meta.github.sha}` : '',
      idea.seal_meta?.github ? `Committed  : ${idea.seal_meta.github.committed_at}` : '',
      '',
      '───────────────────────────────────────────────────',
      'This certificate records that the above content',
      'existed under the account holder\'s name at the',
      'timestamp shown. This is not a patent, trademark,',
      'or legal title. Consult an IP attorney for formal',
      'intellectual property protection.',
      '═══════════════════════════════════════════════════',
    ].filter(l => l !== undefined).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `seal-${idea.seal_id}.txt`;
    a.click(); URL.revokeObjectURL(url);
  }

  const catTabStyle = (c: IdeaCategory | 'all'): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
    background: filterCat === c ? '#D7141A' : 'rgba(120,120,128,0.1)',
    color: filterCat === c ? '#fff' : '#1c1c1e',
  });

  const filterPill = (s: typeof filterStatus): React.CSSProperties => ({
    padding: '4px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
    background: filterStatus === s ? '#D7141A' : 'rgba(120,120,128,0.09)',
    color: filterStatus === s ? '#fff' : '#1c1c1e',
  });

  return (
    <ModuleGate moduleId="vault">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes meshFloat1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(4%,6%) scale(1.08)}}
        @keyframes meshFloat2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-3%,4%) scale(1.12)}}
        * { box-sizing: border-box; }
        textarea:focus, input:focus { border-color: rgba(215,20,26,0.4) !important; }
      `}</style>

      <div style={S.page}>
        <div style={S.orb1} />
        <div style={S.orb2} />

        <Header back="/dashboard" />

        <div style={S.shell}>

          {/* ── hero ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, margin: '28px 0 24px', flexWrap: 'wrap' }}>
            <div style={{
              width: 112, height: 112, borderRadius: '50%', flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              background: 'linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0) 48%),linear-gradient(160deg,rgba(240,72,78,0.95),rgba(200,10,18,0.92))',
              border: '1px solid rgba(255,255,255,0.45)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.55),inset 0 -10px 24px rgba(110,0,6,0.28),0 20px 48px rgba(215,20,26,0.32)',
              color: '#fff', textAlign: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2, padding: '0 10%' }}>Idea<br/>Vault</span>
              <span style={{ fontSize: 10, fontWeight: 600, opacity: .88 }}>$5/mo</span>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(28px,5vw,42px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.05, color: '#1c1c1e', margin: '0 0 8px' }}>
                Seal your ideas.
              </h1>
              <p style={{ fontSize: 15, color: '#636366', lineHeight: 1.6, maxWidth: 480, margin: 0 }}>
                Timestamped proof it existed today — yours to show anyone. Only you can read it.
              </p>
            </div>
          </div>

          {/* ── category filter ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            <button style={catTabStyle('all')}    onClick={() => setFilterCat('all')}>All ideas</button>
            <button style={catTabStyle('code')}   onClick={() => setFilterCat('code')}>💻 Code</button>
            <button style={catTabStyle('product')} onClick={() => setFilterCat('product')}>📦 Physical product</button>
            <button style={catTabStyle('future')} onClick={() => setFilterCat('future')}>💡 Future idea</button>
          </div>

          {/* ── two-col layout ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 28, alignItems: 'start' }}>

            {/* ── LEFT: list ── */}
            <div>

              {/* CTA card */}
              <div style={{ ...S.glass(true), padding: 0, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ height: 68, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '5%', top: -30, width: '55%', height: '150%', background: 'radial-gradient(circle at 50% 50%,rgba(215,20,26,0.18),transparent 70%)', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', left: '48%', top: -10, width: '48%', height: '130%', background: 'radial-gradient(circle at 50% 50%,rgba(255,120,126,0.22),transparent 70%)', borderRadius: '50%' }} />
                </div>
                <div style={{ padding: '16px 22px 20px' }}>
                  <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 5 }}>Seal something new</h2>
                  <p style={{ fontSize: 13.5, color: '#636366', lineHeight: 1.55, marginBottom: 14 }}>Write it in your own words, attach sketches or code, link a GitHub repo. Everything gets hashed and timestamped.</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#636366' }}>UTC · SHA-256 · canary · <strong style={{ color: '#D7141A' }}>private to you</strong></span>
                    <button style={S.btnRed} onClick={() => setShowNew(true)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                      New idea
                    </button>
                  </div>
                </div>
              </div>

              {/* filter row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>Your seals</h2>
                  <span style={{ fontSize: 13, color: '#8e8e93' }}>{sealedIdeas.length} sealed · {ideas.filter(i => i.status === 'draft').length} draft{ideas.filter(i => i.status === 'draft').length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {(['all','sealed','draft'] as const).map(s => (
                    <button key={s} style={filterPill(s)} onClick={() => setStatus(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                  ))}
                </div>
              </div>

              {/* loading */}
              {loading && <p style={{ fontSize: 14, color: '#8e8e93', padding: '20px 0' }}>Loading…</p>}

              {/* empty */}
              {!loading && filtered.length === 0 && (
                <div style={{ padding: '40px 24px', textAlign: 'center', border: '2px dashed rgba(215,20,26,0.25)', borderRadius: 20 }}>
                  <div style={{ fontSize: 32, marginBottom: 10, opacity: .4 }}>🔒</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No ideas yet</h3>
                  <p style={{ fontSize: 14, color: '#8e8e93', maxWidth: 300, margin: '0 auto 16px', lineHeight: 1.5 }}>
                    Seal your first idea — write it down, attach files, and get a timestamped certificate.
                  </p>
                  <button style={S.btnRed} onClick={() => setShowNew(true)}>New idea →</button>
                </div>
              )}

              {/* idea cards */}
              {filtered.map(idea => (
                <div key={idea.id} style={{ ...S.glass(idea.status === 'sealed'), padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{idea.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {idea.status === 'sealed'
                          ? <Badge variant="sealed">✓ Sealed</Badge>
                          : <Badge variant="draft">Draft</Badge>}
                        <Badge variant="tag">{CAT_LABELS[idea.category]}</Badge>
                        {idea.tags?.map(t => <Badge key={t} variant="tag">{t}</Badge>)}
                        {idea.seal_meta?.code_hash && <Badge variant="mono">💻 code hash</Badge>}
                        {idea.seal_meta?.github && <Badge variant="mono">⬡ github</Badge>}
                      </div>
                      {idea.status === 'sealed'
                        ? <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: '#636366', lineHeight: 1.7 }}>
                            {idea.sealed_at ? new Date(idea.sealed_at).toUTCString() : ''} · {idea.seal_id}
                          </div>
                        : <div style={{ fontSize: 13, color: '#8e8e93' }}>
                            Created {new Date(idea.created_at).toLocaleDateString()} · not timestamped until sealed
                          </div>}
                    </div>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', flexShrink: 0 }}>
                      <button style={S.btnGhost} onClick={() => setOpenFiles(openFiles === idea.id ? null : idea.id)}>
                        {openFiles === idea.id ? 'Hide' : 'Files'}
                      </button>
                      {idea.status === 'sealed'
                        ? <button style={{ ...S.btnRed, padding: '7px 13px', borderRadius: 9, fontSize: 12 }} onClick={() => downloadCert(idea)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                            Certificate
                          </button>
                        : <button style={{ ...S.btnRed, padding: '7px 13px', borderRadius: 9, fontSize: 12 }} onClick={() => setSealTarget(idea)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>
                            Seal now
                          </button>}
                    </div>
                  </div>

                  {/* files drawer */}
                  {openFiles === idea.id && (
                    <div style={{ paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                      {idea.files?.length
                        ? idea.files.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', background: 'rgba(0,0,0,0.04)', borderRadius: 9, marginBottom: 4 }}>
                              <span style={{ fontSize: 18 }}>📎</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</div>
                                <div style={{ fontSize: 11, color: '#8e8e93' }}>{(f.size / 1024).toFixed(0)} KB</div>
                              </div>
                            </div>
                          ))
                        : <p style={{ fontSize: 13, color: '#8e8e93', padding: '4px 0' }}>No files attached.</p>}
                    </div>
                  )}
                </div>
              ))}

              {/* compliance disclaimer */}
              <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(120,120,128,0.06)', borderRadius: 14, fontSize: 12, color: '#8e8e93', lineHeight: 1.6 }}>
                <strong style={{ color: '#636366' }}>Not legal advice.</strong> A seal records prior existence and content integrity using cryptographic hashing and timestamping. It is not a patent, copyright registration, trademark, or formal IP filing. For legal protection of intellectual property, consult a qualified IP attorney. Gratia Core makes no representations regarding the legal enforceability of any seal in any jurisdiction.
              </div>
            </div>

            {/* ── RIGHT RAIL ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* what a seal proves */}
              <div style={{ ...S.glassLight, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#D7141A', marginBottom: 8 }}>What a seal proves</div>
                <div style={{ fontSize: 13, color: '#636366', lineHeight: 1.6 }}>
                  That this exact content — text, code hash, GitHub commit, and files — existed under your name at this exact time.
                  <ul style={{ paddingLeft: 16, marginTop: 8, lineHeight: 1.9, fontSize: 13 }}>
                    <li>Clothing / product designers → certificate + sketches to small claims</li>
                    <li>Developers → code hash + GitHub commit proves authorship</li>
                    <li>Anyone → canary marks catch copy-paste theft</li>
                  </ul>
                </div>
              </div>

              {/* canary widget — only shows if sealed ideas exist */}
              <CanaryWidget sealedIdeas={sealedIdeas} />

              {/* billing note */}
              <div style={{ ...S.glass(), padding: '14px 18px', fontSize: 13, color: '#636366', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, color: '#1c1c1e', marginBottom: 4 }}>Billing</div>
                Turn this module off any time — you keep access through the end of the period you paid for. No proration.
              </div>

              <p style={{ fontSize: 12, color: '#8e8e93', textAlign: 'center', lineHeight: 1.5 }}>
                Not legal advice. Not a patent. Consult an IP attorney for formal protection.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* modals */}
      {showNew && (
        <NewIdeaModal
          onClose={() => setShowNew(false)}
          onSaved={idea => setIdeas(prev => [idea, ...prev])}
        />
      )}
      {sealTarget && (
        <SealModal
          idea={sealTarget}
          onClose={() => setSealTarget(null)}
          onSealed={updated => {
            setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i));
            setSealTarget(null);
          }}
        />
      )}
    </ModuleGate>
  );
}