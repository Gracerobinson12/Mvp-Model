// @ts-nocheck
/* eslint-disable */
'use client';

/**
 * app/dashboard/market/page.tsx
 * Market Intelligence — Business plan module
 * Weekly demand signals specific to the user's industry
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

const SIGNAL_TYPES = {
  pricing:    { label: 'Pricing shift',     color: '#0a84ff',  bg: 'rgba(10,132,255,0.1)'  },
  demand:     { label: 'Demand signal',     color: '#7c3aed',  bg: 'rgba(124,58,237,0.1)'  },
  competitor: { label: 'Competitor move',   color: '#ff3b30',  bg: 'rgba(255,59,48,0.1)'   },
  trend:      { label: 'Emerging trend',    color: '#ff9500',  bg: 'rgba(255,149,0,0.1)'   },
};

const DIRECTION_CONFIG = {
  up:      { icon: '↑', color: '#1a7a35', bg: 'rgba(48,209,88,0.1)',  label: 'Up'      },
  down:    { icon: '↓', color: '#cc2018', bg: 'rgba(255,59,48,0.1)',  label: 'Down'    },
  neutral: { icon: '→', color: '#b45309', bg: 'rgba(255,149,0,0.1)', label: 'Neutral' },
};

export default function MarketIntelligencePage() {
  const router = useRouter();
  const [user,          setUser]          = useState(null);
  const [industry,      setIndustry]      = useState('');
  const [savedIndustry, setSavedIndustry] = useState('');
  const [subIndustry,   setSubIndustry]   = useState('');
  const [signals,       setSignals]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [mode,          setMode]          = useState('light');
  const [filter,        setFilter]        = useState('all');
  const [configOpen,    setConfigOpen]    = useState(false);

  const D    = mode === 'dark';
  const ink  = D ? '#fff' : '#1c1c1e';
  const ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(28,28,30,0.5)';
  const ink3 = D ? 'rgba(255,255,255,0.28)' : 'rgba(28,28,30,0.32)';
  const sep  = D ? 'rgba(255,255,255,0.08)' : 'rgba(28,28,46,0.07)';
  const glass = D ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.58)';
  const glassBdr = D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)';
  const glShadow = D ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.07)';
  const bg = D
    ? 'radial-gradient(ellipse 70% 60% at 20% -10%,rgba(10,132,255,0.15) 0%,transparent 60%),#08080f'
    : 'radial-gradient(ellipse 80% 60% at 15% -10%,rgba(10,132,255,0.12) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 85% 110%,rgba(52,170,220,0.1) 0%,transparent 60%),#e8eef5';

  const cardStyle = {
    background: glass,
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: `1px solid ${glassBdr}`,
    borderRadius: 18,
    boxShadow: `0 2px 0 rgba(255,255,255,${D ? '0.06' : '0.92'}) inset, ${glShadow}`,
  };

  useEffect(() => {
    const saved = localStorage.getItem('gc_dash_mode');
    if (saved) setMode(saved);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUser(user);

      const { data: indProf } = await supabase
        .from('industry_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (indProf?.industry) {
        setIndustry(indProf.industry);
        setSavedIndustry(indProf.industry);
        setSubIndustry(indProf.sub_industry || '');
      }

      setLoading(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!savedIndustry) return;
    const fetchSignals = async () => {
      const { data } = await supabase
        .from('market_signals')
        .select('*')
        .eq('industry', savedIndustry)
        .order('published_at', { ascending: false });
      setSignals(data || []);
    };
    fetchSignals();
  }, [savedIndustry]);

  const saveIndustry = async () => {
    if (!industry || !user) return;
    setSaving(true);
    await supabase.from('industry_profiles').upsert({
      user_id:      user.id,
      industry,
      sub_industry: subIndustry || null,
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setSavedIndustry(industry);
    setConfigOpen(false);
    setSaving(false);
  };

  const filtered = filter === 'all'
    ? signals
    : signals.filter(s => s.signal_type === filter);

  // Summary stats
  const ups      = signals.filter(s => s.direction === 'up').length;
  const downs    = signals.filter(s => s.direction === 'down').length;
  const neutrals = signals.filter(s => s.direction === 'neutral').length;

  const weekLabel = (() => {
    const d = new Date();
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    return `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  })();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
        @keyframes rainbowAnim{to{background-position:200% center;}}
        .pill-btn{padding:6px 14px;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid;transition:all 0.2s;font-family:inherit;}
        .sig-card{transition:transform 0.15s;}
        .sig-card:hover{transform:translateY(-2px);}
      `}</style>

      <div style={{ minHeight: '100vh', background: bg, backgroundAttachment: 'fixed', color: ink, fontFamily: "'DM Sans',sans-serif", paddingBottom: 60 }}>

        {/* Header */}
        <header style={{ background: D ? 'rgba(8,8,15,0.85)' : 'rgba(255,255,255,0.6)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderBottom: `0.5px solid ${sep}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#34aadc,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowAnim 3s linear infinite' }} />
          <Link href="/dashboard/personal" style={{ display: 'flex', alignItems: 'center', gap: 6, color: ink3, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>← Dashboard</Link>
          <div style={{ width: '0.5px', height: 16, background: sep }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg,#0a84ff,#34aadc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 2px 8px rgba(10,132,255,0.35)' }}>📈</div>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: ink, letterSpacing: '-0.3px' }}>Market Intelligence</span>
          </div>
          <div style={{ flex: 1 }} />
          {savedIndustry && (
            <button onClick={() => setConfigOpen(o => !o)} className="pill-btn" style={{ background: glass, borderColor: glassBdr, color: ink2 }}>
              ⚙ Configure
            </button>
          )}
          <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} style={{ background: D ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)', border: `0.5px solid ${glassBdr}`, borderRadius: 100, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: ink3, fontFamily: 'inherit', fontWeight: 500 }}>
            {D ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px' }}>

          {/* Industry setup */}
          {!savedIndustry || configOpen ? (
            <div style={{ ...cardStyle, padding: '32px 28px', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: ink, letterSpacing: '-0.6px', marginBottom: 6 }}>
                {configOpen ? 'Update your industry' : 'Set up your intelligence feed'}
              </h2>
              <p style={{ fontSize: 13, color: ink2, lineHeight: 1.6, marginBottom: 22 }}>
                We deliver weekly demand signals, pricing shifts, and competitor moves specific to your industry. Pick yours below.
              </p>

              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink3, marginBottom: 8 }}>Your industry</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
                {INDUSTRIES.map(ind => (
                  <button key={ind} onClick={() => setIndustry(ind)} className="pill-btn" style={{
                    background: industry === ind ? 'linear-gradient(135deg,#0a84ff,#34aadc)' : glass,
                    borderColor: industry === ind ? 'rgba(10,132,255,0.4)' : glassBdr,
                    color: industry === ind ? '#fff' : ink2,
                    boxShadow: industry === ind ? '0 4px 12px rgba(10,132,255,0.3)' : 'none',
                  }}>{ind}</button>
                ))}
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink3, marginBottom: 6 }}>Niche or sub-industry <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — makes signals more specific)</span></p>
              <input
                value={subIndustry}
                onChange={e => setSubIndustry(e.target.value)}
                placeholder="e.g. DTC supplements, B2B HR SaaS, luxury fashion import…"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: D ? 'rgba(255,255,255,0.07)' : 'rgba(120,120,128,0.08)', border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: ink, marginBottom: 20 }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={saveIndustry} disabled={!industry || saving} style={{ padding: '12px 24px', borderRadius: 100, background: industry ? 'linear-gradient(135deg,#0a84ff,#34aadc)' : D ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', color: industry ? '#fff' : ink3, border: 'none', fontSize: 14, fontWeight: 700, cursor: industry ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: industry ? '0 4px 16px rgba(10,132,255,0.3)' : 'none' }}>
                  {saving ? 'Saving…' : 'Show my signals →'}
                </button>
                {configOpen && <button onClick={() => setConfigOpen(false)} style={{ padding: '12px 20px', borderRadius: 100, background: 'none', border: `0.5px solid ${glassBdr}`, color: ink3, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>}
              </div>
            </div>
          ) : (
            <>
              {/* Week header + stats */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: ink, letterSpacing: '-0.6px' }}>{savedIndustry}</h2>
                    {subIndustry && <span style={{ fontSize: 11, color: ink3, background: D ? 'rgba(255,255,255,0.07)' : 'rgba(28,28,46,0.06)', border: `0.5px solid ${sep}`, borderRadius: 100, padding: '2px 8px' }}>{subIndustry}</span>}
                  </div>
                  <p style={{ fontSize: 12, color: ink3 }}>{weekLabel} · {signals.length} signal{signals.length !== 1 ? 's' : ''} this week</p>
                </div>

                {/* Summary stats */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { label: 'Up', count: ups,      color: '#1a7a35', bg: 'rgba(48,209,88,0.1)',  icon: '↑' },
                    { label: 'Down', count: downs,  color: '#cc2018', bg: 'rgba(255,59,48,0.1)',  icon: '↓' },
                    { label: 'Watch', count: neutrals, color: '#b45309', bg: 'rgba(255,149,0,0.1)', icon: '→' },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: `0.5px solid ${s.color}30`, borderRadius: 12, padding: '8px 12px', textAlign: 'center', minWidth: 60 }}>
                      <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: s.color, margin: 0, lineHeight: 1 }}>{s.count}</p>
                      <p style={{ fontSize: 10, color: s.color, margin: '2px 0 0', opacity: 0.8 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signal type filter */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={() => setFilter('all')} className="pill-btn" style={{ background: filter === 'all' ? D ? 'rgba(255,255,255,0.12)' : '#1c1c1e' : glass, borderColor: filter === 'all' ? D ? 'rgba(255,255,255,0.2)' : '#1c1c1e' : glassBdr, color: filter === 'all' ? '#fff' : ink2 }}>All signals</button>
                {Object.entries(SIGNAL_TYPES).map(([key, val]) => (
                  <button key={key} onClick={() => setFilter(key)} className="pill-btn" style={{ background: filter === key ? val.bg : glass, borderColor: filter === key ? `${val.color}40` : glassBdr, color: filter === key ? val.color : ink2 }}>{val.label}</button>
                ))}
              </div>

              {/* Signals */}
              {filtered.length === 0 ? (
                <div style={{ ...cardStyle, padding: '40px 28px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📡</div>
                  <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink, marginBottom: 6 }}>No signals yet for this filter</p>
                  <p style={{ fontSize: 13, color: ink2 }}>Try "All signals" or check back next week.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filtered.map((s, i) => {
                    const st  = SIGNAL_TYPES[s.signal_type]  || SIGNAL_TYPES.trend;
                    const dir = DIRECTION_CONFIG[s.direction] || DIRECTION_CONFIG.neutral;
                    return (
                      <div key={s.id || i} className="sig-card" style={{ ...cardStyle, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                          {/* Signal type */}
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: st.bg, color: st.color, border: `0.5px solid ${st.color}30` }}>{st.label}</span>
                          {/* Direction */}
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: dir.bg, color: dir.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ fontSize: 13 }}>{dir.icon}</span>{dir.label}
                          </span>
                          <span style={{ fontSize: 11, color: ink3, marginLeft: 'auto' }}>
                            {new Date(s.published_at || s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: ink, letterSpacing: '-0.3px', lineHeight: 1.3, marginBottom: 7 }}>{s.title}</h3>
                        <p style={{ fontSize: 13, color: ink2, lineHeight: 1.65 }}>{s.summary}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* What's next — intelligence grows */}
              <div style={{ ...cardStyle, padding: '16px 18px', marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(10,132,255,0.1)', border: '0.5px solid rgba(10,132,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📬</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: ink, margin: '0 0 2px' }}>Weekly digest coming soon</p>
                  <p style={{ fontSize: 12, color: ink2, margin: 0 }}>We'll email you a curated signal digest every Monday morning — specific to {savedIndustry}.</p>
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: `0.5px solid ${sep}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 11, color: ink3 }}>Market signals are curated for informational purposes. Past signals do not guarantee future market conditions.</p>
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