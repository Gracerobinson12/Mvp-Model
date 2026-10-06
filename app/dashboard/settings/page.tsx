'use client';
// @ts-nocheck
// app/dashboard/settings/page.tsx — account settings.
// Profile info (name/business) + change email + change password (Supabase Auth) + billing (Stripe portal).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('light');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [business, setBusiness] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [pwStep, setPwStep] = useState('verify'); // 'verify' | 'set'
  const [pwMsg, setPwMsg] = useState('');
  const [passDone, setPassDone] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => { const s = localStorage.getItem('gc_dash_mode'); if (s) setMode(s); }, []);
  useEffect(() => { localStorage.setItem('gc_dash_mode', mode); }, [mode]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setUser(user); setNewEmail(user.email || '');
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      setFirstName(prof?.first_name || ''); setLastName(prof?.last_name || ''); setBusiness(prof?.business_name || '');
      setLoading(false);
    })();
  }, [router]);

  const D = mode === 'dark';
  const bg = D ? '#0a0e17' : 'radial-gradient(ellipse 70% 60% at 12% -10%,rgba(48,209,88,0.1) 0%,transparent 60%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)';
  const ink = D ? '#fff' : '#1a1a2e', ink2 = D ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.55)', ink3 = D ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,46,0.4)';
  const card = D ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)', cardBdr = D ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';
  const inp = { width: '100%', padding: '11px 14px', borderRadius: 12, border: `0.5px solid ${D?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.12)'}`, background: D?'rgba(255,255,255,0.04)':'#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: ink, boxSizing: 'border-box', marginBottom: 10 };
  const lbl = { fontSize: 11, fontWeight: 600, color: ink3, display: 'block', marginBottom: 5 };
  const btn = { padding: '10px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#30d158,#1a7a35)' };
  const sectionCard = { background: card, border: `0.5px solid ${cardBdr}`, borderRadius: 18, padding: '20px 22px', marginBottom: 14, backdropFilter: 'blur(20px)' };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const saveProfile = async () => {
    setBusy('profile');
    await supabase.from('profiles').update({ first_name: firstName, last_name: lastName, business_name: business, full_name: `${firstName} ${lastName}`.trim() }).eq('id', user.id);
    setBusy(''); flash('Profile saved.');
  };
  const changeEmail = async () => {
    if (!newEmail.includes('@')) { flash('Enter a valid email.'); return; }
    setBusy('email');
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
    setBusy('');
    flash(error ? error.message : 'Check both inboxes — confirm the change from the email we just sent.');
  };
  const verifyCurrent = async () => {
    if (!curPass) { setPwMsg('Enter your current password.'); return; }
    setBusy('pwverify'); setPwMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: curPass });
    setBusy('');
    if (error) { setPwMsg('That password is incorrect.'); return; }
    setPwStep('set'); setPwMsg('');  // verified → reveal new-password fields
  };

  const setNewPassword = async () => {
    if (newPass.length < 8) { setPwMsg('New password must be at least 8 characters.'); return; }
    if (newPass !== confirmPass) { setPwMsg('New passwords don\'t match.'); return; }
    setBusy('pwset'); setPwMsg('');
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setBusy('');
    if (error) { setPwMsg(error.message); return; }
    // confirmed changed
    setCurPass(''); setNewPass(''); setConfirmPass(''); setPwStep('verify');
    flash('✓ Your password has been changed.');
  };
  const openBilling = async () => {
    setBusy('billing');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/billing/portal', { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
      const data = await res.json();
      if (data.url) window.location.href = data.url; else flash(data.error || 'Billing not available yet.');
    } catch { flash('Could not open billing.'); }
    setBusy('');
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef1f6', color: 'rgba(26,26,46,0.4)', fontFamily: "'DM Sans',sans-serif" }}>Loading…</div>;

  const trialDays = profile?.trial_ends_at ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at) - Date.now()) / 86400000)) : null;
  const planLabel = profile?.plan === 'bundle' ? 'Gratia Core (bundle)' : profile?.plan === 'intelligence' ? 'Intelligence' : profile?.has_solutions ? 'Solutions' : 'No active plan';

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}`}</style>
      <div style={{ minHeight: '100vh', background: bg, color: ink, fontFamily: "'DM Sans',sans-serif", padding: '18px 18px 60px' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/dashboard/solutions" style={{ textDecoration: 'none' }}><GCIcon size={28} /></Link>
              <div><p style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: ink }}>Settings</p><p style={{ fontSize: 11, color: ink3 }}>{user?.email}</p></div>
            </div>
            <Link href="/dashboard/solutions" style={{ fontSize: 13, color: ink2, textDecoration: 'none' }}>← Dashboard</Link>
          </div>

          {msg && <div style={{ background: 'rgba(48,209,88,0.1)', border: '0.5px solid rgba(48,209,88,0.3)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: D?'#4ade80':'#1a7a35', marginBottom: 14 }}>{msg}</div>}

          {/* Plan */}
          <div style={sectionCard}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, marginBottom: 10 }}>Your plan</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: ink }}>{planLabel}</p>
                <p style={{ fontSize: 12, color: ink2 }}>{profile?.plan_status === 'trialing' && trialDays !== null ? `Trial — ${trialDays} day${trialDays !== 1 ? 's' : ''} left` : profile?.plan_status === 'active' ? 'Active' : profile?.plan_status || ''}</p>
              </div>
              <button onClick={openBilling} disabled={busy === 'billing'} style={{ ...btn, background: D?'rgba(255,255,255,0.1)':'rgba(28,28,46,0.06)', color: ink }}>{busy === 'billing' ? 'Opening…' : 'Manage billing →'}</button>
            </div>
          </div>

          {/* Profile */}
          <div style={sectionCard}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>Profile</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>First name</label><input value={firstName} onChange={e => setFirstName(e.target.value)} style={inp} /></div>
              <div><label style={lbl}>Last name</label><input value={lastName} onChange={e => setLastName(e.target.value)} style={inp} /></div>
            </div>
            <label style={lbl}>Business</label>
            <input value={business} onChange={e => setBusiness(e.target.value)} style={inp} />
            <button onClick={saveProfile} disabled={busy === 'profile'} style={btn}>{busy === 'profile' ? 'Saving…' : 'Save profile'}</button>
          </div>

          {/* Email */}
          <div style={sectionCard}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>Email</p>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inp} />
            <button onClick={changeEmail} disabled={busy === 'email'} style={btn}>{busy === 'email' ? 'Sending…' : 'Change email'}</button>
            <p style={{ fontSize: 11, color: ink3, marginTop: 8, lineHeight: 1.5 }}>Changing your email requires confirming from a link we send to the new address.</p>
          </div>

          {/* Password — step 1: verify current, step 2: set new */}
          <div style={sectionCard}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>Password</p>
            {pwStep === 'verify' ? (
              <>
                <label style={lbl}>Current password</label>
                <input type="password" value={curPass} onChange={e => { setCurPass(e.target.value); setPwMsg(''); }} onKeyDown={e => e.key === 'Enter' && verifyCurrent()} placeholder="Enter your current password" style={inp} />
                {pwMsg && <p style={{ fontSize: 12, color: '#ff3b30', marginBottom: 10 }}>{pwMsg}</p>}
                <button onClick={verifyCurrent} disabled={busy === 'pwverify'} style={btn}>{busy === 'pwverify' ? 'Verifying…' : 'Verify to change password'}</button>
              </>
            ) : (
              <>
                <div style={{ background: 'rgba(48,209,88,0.1)', border: '0.5px solid rgba(48,209,88,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: D ? '#4ade80' : '#1a7a35', marginBottom: 12 }}>✓ Identity verified — set your new password</div>
                <label style={lbl}>New password</label>
                <input type="password" value={newPass} onChange={e => { setNewPass(e.target.value); setPwMsg(''); }} placeholder="New password (min 8 chars)" style={inp} />
                <label style={lbl}>Confirm new password</label>
                <input type="password" value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setPwMsg(''); }} onKeyDown={e => e.key === 'Enter' && setNewPassword()} placeholder="Re-enter new password" style={inp} />
                {pwMsg && <p style={{ fontSize: 12, color: '#ff3b30', marginBottom: 10 }}>{pwMsg}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setPwStep('verify'); setCurPass(''); setNewPass(''); setConfirmPass(''); setPwMsg(''); }} style={{ ...btn, background: D ? 'rgba(255,255,255,0.1)' : 'rgba(28,28,46,0.06)', color: ink }}>Cancel</button>
                  <button onClick={setNewPassword} disabled={busy === 'pwset'} style={{ ...btn, flex: 1 }}>{busy === 'pwset' ? 'Changing…' : 'Change password'}</button>
                </div>
              </>
            )}
          </div>

          {/* Report a problem */}
          <div style={sectionCard}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, marginBottom: 8 }}>Security &amp; support</p>
            <p style={{ fontSize: 13, color: ink2, lineHeight: 1.55, marginBottom: 12 }}>See something you didn\'t do, or something not working? Report it and we\'ll look into it.</p>
            <Link href="/report" style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 100, background: D ? 'rgba(255,255,255,0.1)' : 'rgba(28,28,46,0.06)', color: ink, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Report a problem →</Link>
          </div>

          {/* Sign out */}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button onClick={async () => { await supabase.auth.signOut(); router.replace('/'); }} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
          </div>
        </div>
      </div>
    </>
  );
}