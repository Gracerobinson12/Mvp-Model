'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ROLES = ['Freelancer','Entrepreneur','Side hustler','Creator','Consultant','Small business owner','Student','Other'];
const SKILLS = ['Design','Development','Writing','Marketing','Photography','Video editing','SEO','Social media','Audio','Consulting'];

export default function IndividualOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState('');
  const [offeredSkills, setOfferedSkills] = useState<string[]>([]);
  const [imports, setImports] = useState<boolean | null>(null);
  const [alertFreq, setAlertFreq] = useState('daily');

useEffect(() => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const sessionId = params.get('session_id');
  
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) {
    localStorage.setItem('gc_post_login', '/onboarding/individual');
    router.push('/login');
    return;
}
    setUser(user);
    if (sessionId) {
      fetch('/api/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId: user.id }),
      }).catch(() => {});
    }
  });
}, [router]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
    });
  }, [router]);

  const toggleSkill = (s: string) => {
    setOfferedSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  };

  const save = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.from('industry_profiles').upsert({
        user_id: user.id,
        industry: offeredSkills.join(', ') || skills,
        alert_frequency: alertFreq,
        imports_goods: imports === true,
        onboarding_complete: true,
      }, { onConflict: 'user_id' });
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const chip = (active: boolean) => ({
    padding: '7px 14px',
    borderRadius: 100,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid',
    fontFamily: 'inherit',
    background: active ? '#0a84ff' : '#fff',
    borderColor: active ? '#0a84ff' : '#e5e7eb',
    color: active ? '#fff' : '#374151',
  } as React.CSSProperties);

  const progress = ((step + 1) / 3) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Step {step + 1} of 3</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>About 90 seconds</span>
          </div>
          <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2 }}>
            <div style={{ height: 4, width: `${progress}%`, background: '#0a84ff', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>

        {step === 0 && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 }}>What do you do?</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Personalizes your Ideas Vault and barter profile.</p>

            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>I am a</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {ROLES.map(r => (
                <button key={r} onClick={() => setRole(r)} style={chip(role === r)}>{r}</button>
              ))}
            </div>

            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>My main skill</p>
            <input
              value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder="e.g. Graphic designer, copywriter, developer"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 24, boxSizing: 'border-box' }}
            />

            <button onClick={() => setStep(1)} style={{ width: '100%', padding: 13, borderRadius: 100, background: '#0a84ff', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Next →
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 }}>What can you offer?</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Pre-fills your barter listing on the community board.</p>

            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Skills I offer</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {SKILLS.map(s => (
                <button key={s} onClick={() => toggleSkill(s)} style={chip(offeredSkills.includes(s))}>{s}</button>
              ))}
            </div>

            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Do you order samples from other countries?</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <button onClick={() => setImports(true)} style={chip(imports === true)}>Yes</button>
              <button onClick={() => setImports(false)} style={chip(imports === false)}>No</button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(0)} style={{ padding: '13px 20px', borderRadius: 100, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#6b7280' }}>
                Back
              </button>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: 13, borderRadius: 100, background: '#0a84ff', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Almost done.</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>How often should we send you alerts?</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {([['daily', 'Daily digest'], ['immediately', 'Immediately'], ['weekly', 'Weekly']] as [string, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setAlertFreq(key)} style={{ ...chip(alertFreq === key), flex: 1, textAlign: 'center' }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px', marginBottom: 24, fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
              Your plan includes:<br />
              <strong>Ideas Vault</strong> · <strong>Barter Exchange</strong> · <strong>Sample Duty Lookup</strong>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(1)} style={{ padding: '13px 20px', borderRadius: 100, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#6b7280' }}>
                Back
              </button>
              <button
                onClick={save}
                disabled={loading}
                style={{ flex: 1, padding: 13, borderRadius: 100, background: '#0a84ff', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Setting up...' : 'Go to my dashboard →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}