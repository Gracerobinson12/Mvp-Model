'use client';
// @ts-nocheck
// app/barter/confirm/[token]/page.tsx — PUBLIC. Counterparty confirms without an account.
// Reads + acts only through /api/barter/confirm (token-gated, service-key server side).

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ConfirmAgreementPage() {
  const params = useParams();
  const token = params?.token as string;
  const [ag, setAg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/barter/confirm?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        setAg(data.agreement);
        if (data.agreement.status !== 'sent') setResult(data.agreement.status);
      } catch (e) { setError(e.message || 'Invalid link'); }
      setLoading(false);
    })();
  }, [token]);

  const act = async (action) => {
    setActing(true);
    try {
      const res = await fetch('/api/barter/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, action }) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setResult(data.status);
    } catch (e) { setError(e.message); }
    setActing(false);
  };

  const wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif", background: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(48,209,88,.1) 0%,transparent 55%),linear-gradient(160deg,#f0eff4,#eae9f2 50%,#f2f0f7)' };
  const card = { width: 'min(460px,100%)', background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(40px)', border: '.5px solid rgba(255,255,255,.92)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,.1)' };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={wrap}>
        <div style={card}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#30d158,#0a84ff,#30d158)' }} />
          <div style={{ padding: '30px 30px 28px' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'rgba(26,26,46,.5)', fontSize: 14 }}>Loading…</p>
            ) : error ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>Link not valid</h1>
                <p style={{ fontSize: 14, color: 'rgba(26,26,46,.55)', lineHeight: 1.6 }}>{error}. Ask the sender for a fresh confirmation link.</p>
              </div>
            ) : result ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>{result === 'declined' ? '✕' : '✓'}</div>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>{result === 'declined' ? 'Declined' : 'Confirmed'}</h1>
                <p style={{ fontSize: 14, color: 'rgba(26,26,46,.55)', lineHeight: 1.6 }}>
                  {result === 'declined' ? 'You declined this agreement. The sender has been notified.' : `You've confirmed this agreement with ${ag?.counterparty_name}. It's now a mutually agreed, timestamped record.`}
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#1a7a35', marginBottom: 6 }}>Confirm a trade</p>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 21, fontWeight: 900, letterSpacing: '-.5px', color: '#1a1a2e', marginBottom: 6 }}>{ag.title}</h1>
                <p style={{ fontSize: 13, color: 'rgba(26,26,46,.55)', lineHeight: 1.6, marginBottom: 18 }}>{ag.counterparty_name}, please review the terms below and confirm they&apos;re correct.</p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1, background: 'rgba(48,209,88,.06)', border: '.5px solid rgba(48,209,88,.18)', borderRadius: 12, padding: '11px 12px' }}>
                    <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#1a7a35', margin: '0 0 4px' }}>They give you</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', margin: 0, lineHeight: 1.35 }}>{ag.you_deliver}</p>
                    {ag.you_deliver_value > 0 && <p style={{ fontSize: 11, color: 'rgba(26,26,46,.4)', margin: '4px 0 0' }}>Est. ${ag.you_deliver_value.toLocaleString()}</p>}
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,59,48,.05)', border: '.5px solid rgba(255,59,48,.14)', borderRadius: 12, padding: '11px 12px' }}>
                    <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#cc2018', margin: '0 0 4px' }}>You give them</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', margin: 0, lineHeight: 1.35 }}>{ag.they_deliver}</p>
                    {ag.they_deliver_value > 0 && <p style={{ fontSize: 11, color: 'rgba(26,26,46,.4)', margin: '4px 0 0' }}>Est. ${ag.they_deliver_value.toLocaleString()}</p>}
                  </div>
                </div>

                {ag.due_date && <p style={{ fontSize: 12, color: 'rgba(26,26,46,.5)', marginBottom: 8 }}>📅 Due {new Date(ag.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                {ag.notes && <p style={{ fontSize: 12, color: 'rgba(26,26,46,.5)', background: 'rgba(28,28,46,.03)', borderRadius: 10, padding: '8px 12px', marginBottom: 14, lineHeight: 1.5 }}>📝 {ag.notes}</p>}

                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button onClick={() => act('decline')} disabled={acting} style={{ padding: '13px 18px', borderRadius: 100, border: '.5px solid rgba(255,59,48,.25)', background: 'rgba(255,59,48,.06)', color: '#cc2018', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Decline</button>
                  <button onClick={() => act('accept')} disabled={acting} style={{ flex: 1, padding: 13, borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(48,209,88,.3)' }}>{acting ? 'Confirming…' : '✓ Confirm agreement'}</button>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(26,26,46,.4)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>Confirming records a timestamped acknowledgment. This is a record, not a legally binding contract.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}