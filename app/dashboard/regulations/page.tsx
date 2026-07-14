// @ts-nocheck
/* eslint-disable */
'use client';

/**
 * app/dashboard/regulations/page.tsx
 * Regulatory Updates — Business plan module
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const INDUSTRIES = [
  'E-commerce', 'SaaS', 'Technology', 'Health & Wellness',
  'Food & Beverage', 'Beauty', 'Fashion', 'Import/Export',
  'Manufacturing', 'Construction', 'Finance', 'Real Estate',
  'Healthcare', 'Retail', 'Warehousing', 'Other',
];

const AGENCIES = ['All', 'FTC', 'FDA', 'OSHA', 'CBP', 'SEC', 'State'];

const IMPACT_COLORS = {
  high:   { bg: 'rgba(255,59,48,0.1)',  border: 'rgba(255,59,48,0.25)',  text: '#cc2018',  label: 'High impact'   },
  medium: { bg: 'rgba(255,149,0,0.1)', border: 'rgba(255,149,0,0.25)', text: '#b45309', label: 'Medium impact' },
  low:    { bg: 'rgba(48,209,88,0.1)', border: 'rgba(48,209,88,0.25)', text: '#1a7a35', label: 'Low impact'    },
};

export default function RegulationsPage() {
  const router = useRouter();
  const [user,        setUser]        = useState(null);
  const [industry,    setIndustry]    = useState('');
  const [savedIndustry, setSavedIndustry] = useState('');
  const [agency,      setAgency]      = useState('All');
  const [updates,     setUpdates]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [mode,        setMode]        = useState('light');
  const [search,      setSearch]      = useState('');

  const D    = mode === 'dark';
  const ink  = D ? '#fff' : '#1c1c1e';
  const ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(28,28,30,0.5)';
  const ink3 = D ? 'rgba(255,255,255,0.28)' : 'rgba(28,28,30,0.32)';
  const sep  = D ? 'rgba(255,255,255,0.08)' : 'rgba(28,28,46,0.07)';
  const glass = D ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.58)';
  const glassBdr = D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)';
  const glShadow = D ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.07)';
  const bg = D
    ? 'radial-gradient(ellipse 70% 60% at 20% -10%,rgba(124,58,237,0.15) 0%,transparent 60%),#08080f'
    : 'radial-gradient(ellipse 80% 60% at 15% -10%,rgba(124,58,237,0.12) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 85% 110%,rgba(10,132,255,0.1) 0%,transparent 60%),#e8eef5';

  useEffect(() => {
    const saved = localStorage.getItem('gc_dash_mode');
    if (saved) setMode(saved);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUser(user);

      // Load industry preference
      const { data: indProf } = await supabase
        .from('industry_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (indProf?.industry) {
        setIndustry(indProf.industry);
        setSavedIndustry(indProf.industry);
      }

      setLoading(false);
    };
    init();
  }, [router]);

  // Load updates when industry or agency changes
  useEffect(() => {
    if (!savedIndustry) return;
    const fetchUpdates = async () => {
      let query = supabase
        .from('reg_updates')
        .select('*')
        .order('published_at', { ascending: false });

      if (agency !== 'All') {
        query = query.eq('agency', agency);
      }

      const { data } = await query;
      // Filter by industry client-side
      const filtered = (data || []).filter(u =>
        u.industries?.includes(savedIndustry) ||
        u.industries?.includes('All')
      );
      setUpdates(filtered);
    };
    fetchUpdates();
  }, [savedIndustry, agency]);

  const saveIndustry = async () => {
    if (!industry || !user) return;
    setSaving(true);
    await supabase.from('industry_profiles').upsert({
      user_id:    user.id,
      industry,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setSavedIndustry(industry);
    setSaving(false);
  };

  const filtered = updates.filter(u =>
    !search || u.title.toLowerCase().includes(search.toLowerCase()) ||
    u.summary.toLowerCase().includes(search.toLowerCase())
  );

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const cardStyle = {
    background: glass,
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: `1px solid ${glassBdr}`,
    borderRadius: 18,
    boxShadow: `0 2px 0 rgba(255,255,255,${D ? '0.06' : '0.92'}) inset, ${glShadow}`,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
        @keyframes rainbowAnim{to{background-position:200% center;}}
        @keyframes spin{to{transform:rotate(360deg);}}
        .pill-btn{padding:6px 14px;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid;transition:all 0.2s;font-family:inherit;}
        .update-card{transition:transform 0.15s,box-shadow 0.15s;}
        .update-card:hover{transform:translateY(-2px);}
      `}</style>

      <div style={{ minHeight: '100vh', background: bg, backgroundAttachment: 'fixed', color: ink, fontFamily: "'DM Sans',sans-serif", paddingBottom: 60 }}>

        {/* Header */}
        <header style={{ background: D ? 'rgba(8,8,15,0.85)' : 'rgba(255,255,255,0.6)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderBottom: `0.5px solid ${sep}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#34aadc,#7c3aed,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowAnim 3s linear infinite' }} />

          <Link href="/dashboard/personal" style={{ display: 'flex', alignItems: 'center', gap: 6, color: ink3, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
            ← Dashboard
          </Link>
          <div style={{ width: '0.5px', height: 16, background: sep }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#bf5af2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}>⚖️</div>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: ink, letterSpacing: '-0.3px' }}>Regulatory Updates</span>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} style={{ background: D ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)', border: `0.5px solid ${glassBdr}`, borderRadius: 100, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: ink3, fontFamily: 'inherit', fontWeight: 500 }}>
            {D ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px' }}>

          {/* Industry selector */}
          {!savedIndustry ? (
            <div style={{ ...cardStyle, padding: '32px 28px', marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>⚖️</div>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: ink, letterSpacing: '-0.8px', marginBottom: 8 }}>Which industry are you in?</h2>
              <p style={{ fontSize: 14, color: ink2, lineHeight: 1.65, marginBottom: 24, maxWidth: 440, margin: '0 auto 24px' }}>We'll filter regulatory updates to only what's relevant to your business. You can change this anytime in settings.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {INDUSTRIES.map(ind => (
                  <button key={ind} onClick={() => setIndustry(ind)} className="pill-btn" style={{
                    background: industry === ind ? 'linear-gradient(135deg,#7c3aed,#bf5af2)' : glass,
                    borderColor: industry === ind ? 'rgba(124,58,237,0.4)' : glassBdr,
                    color: industry === ind ? '#fff' : ink2,
                    boxShadow: industry === ind ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                  }}>{ind}</button>
                ))}
              </div>
              <button onClick={saveIndustry} disabled={!industry || saving} style={{ padding: '12px 28px', borderRadius: 100, background: industry ? 'linear-gradient(135deg,#7c3aed,#bf5af2)' : D ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', color: industry ? '#fff' : ink3, border: 'none', fontSize: 14, fontWeight: 700, cursor: industry ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: industry ? '0 4px 16px rgba(124,58,237,0.35)' : 'none' }}>
                {saving ? 'Saving…' : `Show ${industry || 'my'} updates →`}
              </button>
            </div>
          ) : (
            <>
              {/* Industry + filter bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ ...cardStyle, borderRadius: 100, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: ink3 }}>Industry:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>{savedIndustry}</span>
                  <button onClick={() => { setSavedIndustry(''); setIndustry(''); setUpdates([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: ink3, padding: 0, marginLeft: 2 }}>✕</button>
                </div>

                {/* Agency filter */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {AGENCIES.map(a => (
                    <button key={a} onClick={() => setAgency(a)} className="pill-btn" style={{
                      background: agency === a ? D ? 'rgba(255,255,255,0.12)' : '#1c1c1e' : glass,
                      borderColor: agency === a ? D ? 'rgba(255,255,255,0.2)' : '#1c1c1e' : glassBdr,
                      color: agency === a ? D ? '#fff' : '#fff' : ink2,
                    }}>{a}</button>
                  ))}
                </div>

                <div style={{ flex: 1 }} />

                {/* Search */}
                <input placeholder="Search updates…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px 14px', borderRadius: 100, border: `0.5px solid ${glassBdr}`, background: glass, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', color: ink, fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 180 }} />
              </div>

              {/* Results count */}
              <p style={{ fontSize: 12, color: ink3, marginBottom: 14 }}>
                {filtered.length} update{filtered.length !== 1 ? 's' : ''} for <strong style={{ color: '#7c3aed' }}>{savedIndustry}</strong>{agency !== 'All' ? ` · ${agency}` : ''}
              </p>

              {/* Updates list */}
              {filtered.length === 0 ? (
                <div style={{ ...cardStyle, padding: '40px 28px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                  <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink, marginBottom: 6 }}>No updates found</p>
                  <p style={{ fontSize: 13, color: ink2 }}>Try a different agency filter or search term.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filtered.map((u, i) => {
                    const imp = IMPACT_COLORS[u.impact] || IMPACT_COLORS.medium;
                    return (
                      <div key={u.id || i} className="update-card" style={{ ...cardStyle, padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {/* Agency badge */}
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 100, background: D ? 'rgba(255,255,255,0.08)' : 'rgba(28,28,46,0.08)', color: ink2, border: `0.5px solid ${sep}` }}>{u.agency}</span>
                            {/* Impact badge */}
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: imp.bg, border: `0.5px solid ${imp.border}`, color: imp.text }}>{imp.label}</span>
                          </div>
                          <span style={{ fontSize: 11, color: ink3, flexShrink: 0 }}>{timeAgo(u.published_at)}</span>
                        </div>

                        <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: ink, letterSpacing: '-0.3px', lineHeight: 1.3, marginBottom: 8 }}>{u.title}</h3>
                        <p style={{ fontSize: 13, color: ink2, lineHeight: 1.65, marginBottom: u.source_url ? 12 : 0 }}>{u.summary}</p>

                        {u.source_url && (
                          <a href={u.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            Read full update ↗
                          </a>
                        )}

                        {/* Industries this applies to */}
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 12 }}>
                          {(u.industries || []).map(ind => (
                            <span key={ind} style={{ fontSize: 10, color: ink3, background: D ? 'rgba(255,255,255,0.05)' : 'rgba(28,28,46,0.05)', border: `0.5px solid ${sep}`, borderRadius: 100, padding: '2px 7px' }}>{ind}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Footer legal */}
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: `0.5px solid ${sep}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 11, color: ink3 }}>Regulatory updates are for informational purposes only and do not constitute legal advice. Consult a qualified attorney for guidance specific to your business.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/privacy" style={{ fontSize: 11, color: ink3, textDecoration: 'none' }}>Privacy</Link>
              <Link href="/terms" style={{ fontSize: 11, color: ink3, textDecoration: 'none' }}>Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}