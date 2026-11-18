// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';

/* ─────────────────────────────────────────────
   Public confirm page — no auth required
   Route: /barter/confirm/[token]
   The counterparty sees this when they click the
   emailed link. They can review and confirm, or
   decline, without an account.
───────────────────────────────────────────── */

interface AgreementData {
  id: string;
  title: string;
  counterparty_name: string;
  counterparty_email: string;
  my_offer: string;
  their_offer: string;
  deadline: string | null;
  notes: string;
  status: string;
  owner_name: string;
  owner_email: string;
}

type Phase = 'loading' | 'review' | 'confirming' | 'confirmed' | 'declined' | 'already_done' | 'error';

const S = {
  page: { minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif", WebkitFontSmoothing: 'antialiased' as const },
  orb1: { position: 'fixed' as const, top: '-12%', left: '-5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,59,48,0.08) 0%,rgba(255,255,255,0) 70%)', filter: 'blur(40px)', animation: 'meshFloat1 18s ease-in-out infinite', pointerEvents: 'none' as const, zIndex: 0 },
  orb2: { position: 'fixed' as const, top: '25%', right: '-8%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,132,255,0.06) 0%,rgba(255,255,255,0) 70%)', filter: 'blur(50px)', animation: 'meshFloat2 22s ease-in-out infinite', pointerEvents: 'none' as const, zIndex: 0 },
  card: { background: 'rgba(255,255,255,0.97)', borderRadius: 28, boxShadow: 'inset 0 0 0 1.5px rgba(215,20,26,0.11),0 32px 80px rgba(0,0,0,0.13)', width: 'min(520px,100%)', padding: '32px 28px 28px', position: 'relative' as const, zIndex: 1 },
  btnRed: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '14px 24px', borderRadius: 14, fontWeight: 700, fontSize: 15, background: '#D7141A', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' } as React.CSSProperties,
  btnGhost: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 24px', borderRadius: 14, fontWeight: 600, fontSize: 14, background: 'rgba(120,120,128,0.1)', color: '#1c1c1e', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%' } as React.CSSProperties,
};

export default function BarterConfirmPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [phase, setPhase]   = useState<Phase>('loading');
  const [data, setData]     = useState<AgreementData | null>(null);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!token) { setPhase('error'); return; }
    fetch(`/api/barter/lookup?token=${token}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); setPhase('error'); return; }
        setData(json.agreement);
        if (json.agreement.status === 'complete' || json.agreement.status === 'active') {
          setPhase('already_done');
        } else {
          setPhase('review');
        }
      })
      .catch(() => setPhase('error'));
  }, [token]);

  async function confirm() {
    setPhase('confirming');
    const res  = await fetch('/api/barter/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error || 'Could not confirm.'); setPhase('error'); return; }
    setPhase('confirmed');
  }

  async function decline() {
    await fetch('/api/barter/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    setPhase('declined');
  }

  const logo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 24 }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, background: 'linear-gradient(160deg,rgba(240,72,78,0.95),rgba(200,10,18,0.92))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: "'Sora',sans-serif" }}>G</span>
      </div>
      <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: '-0.4px' }}>Gratia Core</span>
      <span style={{ fontSize: 12, color: '#8e8e93', fontWeight: 600 }}>· Barter</span>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes meshFloat1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(4%,6%) scale(1.08)}}
        @keyframes meshFloat2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-3%,4%) scale(1.12)}}
        * { box-sizing: border-box; margin: 0; }
      `}</style>

      <div style={S.page}>
        <div style={S.orb1} />
        <div style={S.orb2} />

        {/* Loading */}
        {phase === 'loading' && (
          <div style={S.card}>
            {logo}
            <p style={{ color: '#8e8e93', fontSize: 15 }}>Loading agreement…</p>
          </div>
        )}

        {/* Confirming */}
        {phase === 'confirming' && (
          <div style={S.card}>
            {logo}
            <p style={{ color: '#8e8e93', fontSize: 15 }}>Confirming…</p>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div style={S.card}>
            {logo}
            <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Link not found</h2>
            <p style={{ fontSize: 14, color: '#636366', lineHeight: 1.6 }}>
              {error || 'This confirmation link is invalid or has expired. Ask the sender to resend it.'}
            </p>
          </div>
        )}

        {/* Already done */}
        {phase === 'already_done' && data && (
          <div style={S.card}>
            {logo}
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Already confirmed</h2>
            <p style={{ fontSize: 14, color: '#636366', lineHeight: 1.6 }}>
              The barter agreement <strong>"{data.title}"</strong> has already been confirmed and is {data.status}. No further action needed.
            </p>
          </div>
        )}

        {/* Confirmed */}
        {phase === 'confirmed' && data && (
          <div style={S.card}>
            {logo}
            <div style={{ fontSize: 48, marginBottom: 12, textAlign: 'center' as const }}>🤝</div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: 'center' as const }}>Deal confirmed!</h2>
            <p style={{ fontSize: 14, color: '#636366', lineHeight: 1.6, textAlign: 'center' as const, marginBottom: 20 }}>
              You've confirmed <strong>"{data.title}"</strong>. Both sides now have a written record of this exchange.
            </p>
            <div style={{ background: 'rgba(52,199,89,0.08)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' as const, marginBottom: 16 }}>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#1c1c1e' }}>
                <strong>You deliver:</strong> {data.their_offer}<br />
                <strong style={{ marginTop: 4, display: 'block' }}>{data.owner_name || 'The other side'} delivers:</strong> {data.my_offer}
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#8e8e93', textAlign: 'center' as const, lineHeight: 1.5 }}>
              Not a legal contract. This is an informal record of a mutual agreement. No money changed hands through Gratia Core.
            </p>
          </div>
        )}

        {/* Declined */}
        {phase === 'declined' && (
          <div style={S.card}>
            {logo}
            <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Agreement declined</h2>
            <p style={{ fontSize: 14, color: '#636366', lineHeight: 1.6 }}>
              You've declined this agreement. The sender will be notified. No further action is needed.
            </p>
          </div>
        )}

        {/* Review */}
        {phase === 'review' && data && (
          <div style={S.card}>
            {logo}

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(215,20,26,0.07)', borderRadius: 99, padding: '4px 12px', marginBottom: 14 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: '#D7141A', display: 'inline-block' }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#D7141A' }}>Awaiting your confirmation</span>
            </div>

            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 5 }}>{data.title}</h2>
            <p style={{ fontSize: 14, color: '#636366', marginBottom: 20, lineHeight: 1.5 }}>
              <strong style={{ color: '#1c1c1e' }}>{data.owner_name || 'Someone'}</strong> has proposed a barter exchange with you. Review the terms below and confirm or decline.
            </p>

            {/* terms */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'rgba(10,132,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: '#0A54E8', marginBottom: 7 }}>
                  {data.owner_name || 'They'} offer
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{data.my_offer}</p>
              </div>
              <div style={{ background: 'rgba(215,20,26,0.07)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: '#D7141A', marginBottom: 7 }}>You offer</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{data.their_offer}</p>
              </div>
            </div>

            {data.deadline && (
              <div style={{ marginBottom: 12, fontSize: 13.5 }}>
                <strong>Deadline:</strong> {new Date(data.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}

            {data.notes && (
              <div style={{ background: 'rgba(120,120,128,0.07)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase' as const, color: '#8e8e93', marginBottom: 5 }}>Notes from sender</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{data.notes}</p>
              </div>
            )}

            <div style={{ background: 'rgba(215,20,26,0.06)', borderRadius: 12, padding: '11px 14px', fontSize: 13, color: '#636366', lineHeight: 1.5, marginBottom: 20 }}>
              <strong style={{ color: '#D7141A' }}>Not a legal contract.</strong> Confirming creates an informal written record of this exchange. It has no legal enforceability. Gratia Core is not a party to this agreement and handles no payments.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              <button style={S.btnRed} onClick={confirm}>
                ✓ Confirm this agreement
              </button>
              <button style={S.btnGhost} onClick={decline}>
                Decline
              </button>
            </div>

            <p style={{ fontSize: 11, color: '#8e8e93', marginTop: 14, lineHeight: 1.5, textAlign: 'center' as const }}>
              By confirming, you acknowledge this is an informal exchange record only — not a legally enforceable contract.
            </p>
          </div>
        )}
      </div>
    </>
  );
}