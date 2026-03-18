'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─────────────────────────────────────────────────────────────────────────────
// QUICK SIGNUP MODAL
// Shows when someone clicks Gas Tracker or Get Started
// 3 steps: email → who are you → password
// ─────────────────────────────────────────────────────────────────────────────
function QuickSignupModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step,      setStep]     = useState<'gate' | 'type' | 'details'>('gate')
  const [email,     setEmail]    = useState('')
  const [password,  setPassword] = useState('')
  const [userCat,   setUserCat]  = useState('')
  const [loading,   setLoading]  = useState(false)
  const [error,     setError]    = useState('')

  const USER_TYPES = [
    { id:'gas',        icon:'⛽', label:'Gas prices only',   sub:'I just want to find cheap gas near me',          color:'#ff3b30' },
    { id:'driver',     icon:'🚗', label:'Gig driver',        sub:'Uber, Lyft, DoorDash — I need deductions too',   color:'#ff6b35' },
    { id:'freelancer', icon:'💼', label:'Freelancer',        sub:'Independent contractor or self-employed',        color:'#0a84ff' },
    { id:'business',   icon:'🏢', label:'Business owner',    sub:'I run a business and need compliance tools',     color:'#30d158' },
  ]

  const selectedType = USER_TYPES.find(t => t.id === userCat)

  const handleContinue = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setStep('type')
  }

  const handleCreate = async () => {
    if (password.length < 8) return
    setLoading(true)
    setError('')

    try {
      // TODO: replace with real Supabase call
      // const { data, error } = await supabase.auth.signUp({ email, password })
      // if (error) throw error
      // await supabase.from('profiles').upsert({
      //   id: data.user.id, email, user_type: userCat, onboarded: userCat === 'gas'
      // })
      await new Promise(r => setTimeout(r, 900)) // simulate network

      // Gas-only → straight to tracker
      // Others → pick up onboarding at step 3 (skipping email/password/type)
      if (userCat === 'gas') {
        router.push('/dashboard/gas')
      } else if (userCat === 'driver' || userCat === 'freelancer') {
        router.push(`/onboarding?prefill=${userCat}`)
      } else {
        router.push(`/onboarding?prefill=${userCat}`)
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,.45)',
      backdropFilter:'blur(10px)',
      WebkitBackdropFilter:'blur(10px)',
      padding:24,
    }}>
      <div style={{
        background:'#fff',
        borderRadius:26,
        padding:'36px 32px',
        maxWidth:420, width:'100%',
        boxShadow:'0 32px 80px rgba(0,0,0,.18)',
        fontFamily:"'DM Sans',system-ui,sans-serif",
        position:'relative',
        animation:'modalPop .35s cubic-bezier(.34,1.56,.64,1)',
      }}>

        {/* Close button */}
        <button onClick={onClose} style={{
          position:'absolute', top:14, right:14,
          width:32, height:32, borderRadius:'50%',
          background:'rgba(0,0,0,.06)',
          border:'none', cursor:'pointer',
          fontSize:14, color:'rgba(26,26,46,.5)',
          display:'flex', alignItems:'center', justifyContent:'center',
          lineHeight:1,
        }}>✕</button>

        {/* ── STEP 1: Email gate ── */}
        {step === 'gate' && <>
          {/* Icon */}
          <div style={{
            width:58, height:58, borderRadius:17,
            background:'linear-gradient(135deg,#ff3b30,#ff6b35)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:26, margin:'0 auto 20px',
            boxShadow:'0 8px 24px rgba(255,59,48,.35)',
          }}>⛽</div>

          <h2 style={{
            fontFamily:"'Sora',sans-serif",
            fontSize:22, fontWeight:800, letterSpacing:-.5,
            textAlign:'center', color:'#1a1a2e', marginBottom:8,
          }}>
            See gas prices near you
          </h2>
          <p style={{
            fontSize:14, color:'rgba(26,26,46,.55)',
            textAlign:'center', lineHeight:1.65, marginBottom:22,
          }}>
            Free account — no credit card, no commitment. Unlock real prices at stations near you in 30 seconds.
          </p>

          {/* What you get list */}
          <div style={{
            background:'#f8f7fc',
            borderRadius:14, padding:'14px 16px', marginBottom:22,
          }}>
            {[
              { icon:'📍', text:'Real-time prices at nearby stations' },
              { icon:'🛣️', text:'Cheapest gas on any route you drive' },
              { icon:'🧾', text:'IRS mileage deduction calculator' },
              { icon:'🔔', text:'Alerts when prices drop near you' },
            ].map((f, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:10,
                fontSize:13, color:'rgba(26,26,46,.75)',
                marginBottom: i < 3 ? 9 : 0,
              }}>
                <span style={{fontSize:15, flexShrink:0}}>{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>

          {/* Email field */}
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleContinue()}
            autoFocus
            style={{
              width:'100%', padding:'13px 16px',
              background:'#f8f7fc',
              border:`1.5px solid ${error ? '#ff453a' : 'rgba(0,0,0,.1)'}`,
              borderRadius:14, fontSize:15, color:'#1a1a2e',
              outline:'none', fontFamily:"'DM Sans',sans-serif",
              marginBottom: error ? 6 : 10,
              transition:'border-color .2s',
            }}
          />
          {error && (
            <div style={{fontSize:12, color:'#ff453a', marginBottom:10}}>{error}</div>
          )}

          <button
            onClick={handleContinue}
            style={{
              width:'100%', padding:14,
              background: email.trim()
                ? 'linear-gradient(135deg,#ff3b30,#ff6b35)'
                : 'rgba(255,59,48,.2)',
              color:'#fff', border:'none', borderRadius:100,
              fontSize:15, fontWeight:700,
              cursor: email.trim() ? 'pointer' : 'not-allowed',
              fontFamily:"'DM Sans',sans-serif",
              boxShadow: email.trim() ? '0 4px 16px rgba(255,59,48,.35)' : 'none',
              transition:'all .2s',
            }}
          >
            Continue — it's free →
          </button>

          <div style={{
            display:'flex', alignItems:'center', gap:10,
            margin:'14px 0', color:'rgba(26,26,46,.3)', fontSize:12,
          }}>
            <div style={{flex:1, height:1, background:'rgba(0,0,0,.08)'}}/>or
            <div style={{flex:1, height:1, background:'rgba(0,0,0,.08)'}}/>
          </div>

          <div style={{textAlign:'center', fontSize:13, color:'rgba(26,26,46,.45)'}}>
            Already have an account?{' '}
            <Link href="/login" style={{color:'#ff3b30', fontWeight:600, textDecoration:'none'}} onClick={onClose}>
              Log in →
            </Link>
          </div>

          <p style={{fontSize:11, color:'rgba(26,26,46,.3)', textAlign:'center', marginTop:14, lineHeight:1.6}}>
            No credit card · Free forever for basic use ·{' '}
            <a href="/privacy" style={{color:'rgba(26,26,46,.4)'}}>Privacy</a>
          </p>
        </>}

        {/* ── STEP 2: Who are you ── */}
        {step === 'type' && <>
          <h2 style={{
            fontFamily:"'Sora',sans-serif",
            fontSize:21, fontWeight:800, letterSpacing:-.5,
            color:'#1a1a2e', marginBottom:6,
          }}>
            One quick question
          </h2>
          <p style={{fontSize:13, color:'rgba(26,26,46,.5)', marginBottom:20, lineHeight:1.55}}>
            We use this to show you the right tools — takes 2 seconds.
          </p>

          <div style={{display:'flex', flexDirection:'column', gap:8, marginBottom:18}}>
            {USER_TYPES.map(t => (
              <button key={t.id} onClick={() => { setUserCat(t.id); setStep('details') }} style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'13px 16px',
                background: userCat === t.id ? `${t.color}10` : '#f8f7fc',
                border:`1.5px solid ${userCat === t.id ? t.color : 'rgba(0,0,0,.08)'}`,
                borderRadius:14, cursor:'pointer', textAlign:'left',
                fontFamily:"'DM Sans',sans-serif",
                transition:'all .18s cubic-bezier(.34,1.56,.64,1)',
              }}>
                <div style={{
                  width:42, height:42, borderRadius:12,
                  background:`${t.color}18`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:19, flexShrink:0,
                }}>{t.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14, fontWeight:600, color:'#1a1a2e', marginBottom:2}}>
                    {t.label}
                  </div>
                  <div style={{fontSize:11, color:'rgba(26,26,46,.45)'}}>
                    {t.sub}
                  </div>
                </div>
                <span style={{fontSize:16, color:'rgba(26,26,46,.2)'}}>›</span>
              </button>
            ))}
          </div>

          <button onClick={() => setStep('gate')} style={{
            background:'none', border:'none', color:'rgba(26,26,46,.4)',
            fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
            display:'flex', alignItems:'center', gap:4, padding:0,
          }}>← Back</button>
        </>}

        {/* ── STEP 3: Password ── */}
        {step === 'details' && <>
          <div style={{
            width:50, height:50, borderRadius:15,
            background:`linear-gradient(135deg,${selectedType?.color || '#ff3b30'},${selectedType?.color || '#ff3b30'}99)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, marginBottom:18,
            boxShadow:`0 6px 20px ${selectedType?.color || '#ff3b30'}35`,
          }}>
            {selectedType?.icon || '⛽'}
          </div>

          <h2 style={{
            fontFamily:"'Sora',sans-serif",
            fontSize:21, fontWeight:800, letterSpacing:-.5,
            color:'#1a1a2e', marginBottom:4,
          }}>
            Almost done
          </h2>
          <p style={{fontSize:13, color:'rgba(26,26,46,.5)', marginBottom:20, lineHeight:1.55}}>
            Creating account for{' '}
            <strong style={{color:'#1a1a2e', fontWeight:600}}>{email}</strong>
          </p>

          {/* What they'll see after signup */}
          <div style={{
            background:'#f8f7fc',
            borderRadius:14, padding:'12px 14px', marginBottom:18,
            fontSize:12, color:'rgba(26,26,46,.6)', lineHeight:1.6,
          }}>
            {userCat === 'gas' && '✓ Gas tracker opens immediately — no extra steps needed'}
            {userCat === 'driver' && '✓ Gas tracker + mileage deduction calculator ready instantly. We\'ll ask 2 more questions to personalize your deduction reports.'}
            {userCat === 'freelancer' && '✓ Gas tracker unlocked. We\'ll ask 2 quick questions to set up your deduction dashboard.'}
            {userCat === 'business' && '✓ Gas tracker unlocked. We\'ll walk you through a quick 2-min setup to personalize your compliance modules.'}
          </div>

          <input
            type="password"
            placeholder="Create a password (8+ characters)"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && password.length >= 8 && handleCreate()}
            autoFocus
            style={{
              width:'100%', padding:'13px 16px',
              background:'#f8f7fc',
              border:`1.5px solid ${error ? '#ff453a' : 'rgba(0,0,0,.1)'}`,
              borderRadius:14, fontSize:15, color:'#1a1a2e',
              outline:'none', fontFamily:"'DM Sans',sans-serif",
              marginBottom: error ? 6 : 10,
            }}
          />
          {error && (
            <div style={{fontSize:12, color:'#ff453a', marginBottom:10}}>{error}</div>
          )}

          <button
            onClick={handleCreate}
            disabled={password.length < 8 || loading}
            style={{
              width:'100%', padding:14,
              background: password.length >= 8 && !loading
                ? 'linear-gradient(135deg,#ff3b30,#ff6b35)'
                : 'rgba(255,59,48,.2)',
              color:'#fff', border:'none', borderRadius:100,
              fontSize:15, fontWeight:700,
              cursor: password.length >= 8 && !loading ? 'pointer' : 'not-allowed',
              fontFamily:"'DM Sans',sans-serif",
              boxShadow: password.length >= 8 ? '0 4px 16px rgba(255,59,48,.35)' : 'none',
              marginBottom:12,
              transition:'all .2s',
            }}
          >
            {loading
              ? 'Creating your account...'
              : userCat === 'gas'
                ? 'Create account & open Gas Tracker →'
                : 'Create account & continue →'}
          </button>

          <button onClick={() => setStep('type')} style={{
            background:'none', border:'none', color:'rgba(26,26,46,.4)',
            fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
            display:'flex', alignItems:'center', gap:4, padding:0,
          }}>← Back</button>

          <p style={{
            fontSize:11, color:'rgba(26,26,46,.3)',
            textAlign:'center', marginTop:14, lineHeight:1.6,
          }}>
            By creating an account you agree to our{' '}
            <a href="/terms" style={{color:'#ff3b30'}}>Terms</a> and{' '}
            <a href="/privacy" style={{color:'#ff3b30'}}>Privacy Policy</a>.
          </p>
        </>}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE — your existing design, untouched
// Modal wired to: Gas Tracker button, Get Started button, CTA button
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --red:        #ff3b30;
          --red-soft:   rgba(255,59,48,0.12);
          --red-glow:   rgba(255,59,48,0.22);
          --ash:        #f0eff4;
          --ash-2:      #e8e7ed;
          --ash-3:      #d8d7de;
          --ink:        #1a1a2e;
          --ink-2:      rgba(26,26,46,0.6);
          --ink-3:      rgba(26,26,46,0.35);
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--ash);
          font-family: 'DM Sans', system-ui, sans-serif;
          color: var(--ink);
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0; opacity: 0.4;
        }

        .bg-mesh {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 70% 50% at 15% 10%, rgba(255,59,48,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 80%, rgba(255,100,50,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,255,255,0.5) 0%, transparent 70%),
            linear-gradient(160deg, #f5f4f9 0%, #eceaf2 40%, #f2f0f7 100%);
        }

        .page { position: relative; z-index: 1; min-height: 100vh; }

        /* Modal animation */
        @keyframes modalPop {
          from { opacity: 0; transform: scale(.93) translateY(14px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Navbar ── */
        .navbar {
          position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
          width: calc(100% - 48px); max-width: 1100px; z-index: 998;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 6px 0 20px; height: 56px;
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.95); border-radius: 22px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06),0 8px 32px rgba(0,0,0,0.05),0 0 0 0.5px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,1);
          animation: navSlide 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        @keyframes navSlide {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .nav-logo {
          font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 800;
          letter-spacing: -0.5px; color: var(--ink); text-decoration: none;
          display: flex; align-items: center; gap: 8px;
        }
        .nav-logo-dot {
          width: 8px; height: 8px; background: var(--red); border-radius: 50%;
          box-shadow: 0 0 8px var(--red-glow);
          animation: dotPulse 2.5s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%,100% { transform: scale(1); box-shadow: 0 0 8px var(--red-glow); }
          50%      { transform: scale(1.3); box-shadow: 0 0 14px rgba(255,59,48,0.4); }
        }
        .nav-logo span { color: var(--red); }
        .nav-links {
          display: flex; align-items: center; gap: 2px;
          position: absolute; left: 50%; transform: translateX(-50%);
        }
        .nav-link {
          padding: 7px 16px; font-size: 13.5px; font-weight: 500;
          color: var(--ink-2); text-decoration: none; border-radius: 12px;
          transition: all 0.2s; letter-spacing: -0.1px;
        }
        .nav-link:hover { background: rgba(0,0,0,0.05); color: var(--ink); }
        .nav-actions { display: flex; align-items: center; gap: 8px; }
        .btn-login {
          padding: 8px 20px; font-size: 13.5px; font-weight: 600; color: var(--ink);
          background: transparent; border: 1px solid var(--ash-3); border-radius: 14px;
          cursor: pointer; text-decoration: none; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-login:hover { background: rgba(0,0,0,0.05); border-color: var(--ash-2); }
        .btn-signup {
          padding: 8px 20px; font-size: 13.5px; font-weight: 700; color: #fff;
          background: linear-gradient(135deg, #ff3b30, #ff6b35); border: none;
          border-radius: 14px; cursor: pointer; text-decoration: none;
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 2px 8px rgba(255,59,48,0.3),0 0 0 0.5px rgba(255,59,48,0.2);
        }
        .btn-signup:hover { transform: scale(1.04); box-shadow: 0 4px 16px rgba(255,59,48,0.4); }

        /* ── Hero ── */
        .hero { padding: 160px 24px 100px; text-align: center; max-width: 860px; margin: 0 auto; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.95);
          backdrop-filter: blur(20px); border-radius: 100px; padding: 6px 16px 6px 8px;
          font-size: 12px; font-weight: 600; color: var(--ink-2);
          letter-spacing: 0.2px; margin-bottom: 32px;
          animation: fadeUp 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,1);
        }
        .hero-badge-dot {
          width: 22px; height: 22px; background: linear-gradient(135deg,#ff3b30,#ff6b35);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          font-size: 11px; box-shadow: 0 2px 6px rgba(255,59,48,0.35);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero h1 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(52px, 8vw, 88px); font-weight: 900;
          letter-spacing: -4px; line-height: 0.95; color: var(--ink); margin-bottom: 24px;
          animation: fadeUp 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s both;
        }
        .hero h1 .accent { color: var(--red); }
        .hero h1 .light-word { color: var(--ink-3); font-weight: 300; }
        .hero-sub {
          font-size: 18px; font-weight: 400; color: var(--ink-2); line-height: 1.65;
          max-width: 520px; margin: 0 auto 48px;
          animation: fadeUp 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s both;
        }
        .hero-actions {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; flex-wrap: wrap;
          animation: fadeUp 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.4s both;
        }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 16px 32px; background: linear-gradient(135deg,#ff3b30,#ff6b35);
          color: #fff; border-radius: 18px; font-size: 15px; font-weight: 700;
          text-decoration: none; letter-spacing: -0.2px; border: none; cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 4px 16px rgba(255,59,48,0.35),inset 0 1px 0 rgba(255,255,255,0.2);
          font-family: 'DM Sans', sans-serif;
        }
        .btn-primary:hover { transform: scale(1.04) translateY(-1px); box-shadow: 0 8px 28px rgba(255,59,48,0.45); }
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 16px 28px; background: rgba(255,255,255,0.75); color: var(--ink);
          border-radius: 18px; font-size: 15px; font-weight: 600; text-decoration: none;
          letter-spacing: -0.2px; border: 1px solid rgba(255,255,255,0.95);
          backdrop-filter: blur(20px); transition: all 0.2s; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,1);
          font-family: 'DM Sans', sans-serif;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.9); transform: translateY(-1px); }
        .hero-trust {
          display: flex; align-items: center; justify-content: center;
          gap: 28px; margin-top: 52px; flex-wrap: wrap;
          animation: fadeUp 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.5s both;
        }
        .trust-item { font-size: 11.5px; font-weight: 600; color: var(--ink-3); letter-spacing: 1.5px; text-transform: uppercase; }
        .trust-dot { width: 3px; height: 3px; background: var(--ash-3); border-radius: 50%; }

        /* ── Stats ── */
        .stats-bar { max-width: 900px; margin: 0 auto 100px; padding: 0 24px; animation: fadeUp 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.5s both; }
        .stats-inner {
          display: grid; grid-template-columns: repeat(4,1fr);
          background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.95);
          backdrop-filter: blur(40px); border-radius: 24px; overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,1);
        }
        .stat-item { padding: 28px 24px; text-align: center; position: relative; }
        .stat-item::after { content:''; position:absolute; right:0; top:20%; height:60%; width:1px; background:var(--ash-3); }
        .stat-item:last-child::after { display: none; }
        .stat-val { font-family:'Sora',sans-serif; font-size:32px; font-weight:800; letter-spacing:-1.5px; color:var(--ink); line-height:1; margin-bottom:6px; }
        .stat-val span { color: var(--red); }
        .stat-lbl { font-size:12px; font-weight:500; color:var(--ink-3); }

        /* ── Modules ── */
        .section-label { font-size:11px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:var(--red); margin-bottom:12px; }
        .section-title { font-family:'Sora',sans-serif; font-size:clamp(32px,4vw,48px); font-weight:800; letter-spacing:-2px; line-height:1.1; color:var(--ink); margin-bottom:16px; }
        .section-sub { font-size:16px; color:var(--ink-2); line-height:1.6; max-width:480px; }
        .modules-section { padding: 0 24px 100px; max-width: 1100px; margin: 0 auto; }
        .modules-header { text-align: center; margin-bottom: 56px; }
        .modules-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        @media(max-width:860px){.modules-grid{grid-template-columns:1fr 1fr}.nav-links{display:none}.stat-val{font-size:24px}.stats-inner{grid-template-columns:1fr 1fr}}
        @media(max-width:540px){.modules-grid{grid-template-columns:1fr}.stats-inner{grid-template-columns:1fr 1fr}}
        .module-card {
          background:rgba(255,255,255,0.72); border:1px solid rgba(255,255,255,0.95);
          backdrop-filter:blur(40px) saturate(150%); -webkit-backdrop-filter:blur(40px) saturate(150%);
          border-radius:24px; padding:28px; position:relative; overflow:hidden;
          transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow:0 2px 8px rgba(0,0,0,0.05),0 8px 24px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,1);
          cursor:pointer; text-decoration:none; display:block; color:inherit;
        }
        .module-card:hover{transform:translateY(-4px) scale(1.01);box-shadow:0 8px 32px rgba(0,0,0,0.1),inset 0 1px 0 rgba(255,255,255,1);background:rgba(255,255,255,0.85)}
        .module-card.active{border-color:rgba(255,59,48,0.25);box-shadow:0 2px 8px rgba(255,59,48,0.08),0 8px 24px rgba(255,59,48,0.06),inset 0 1px 0 rgba(255,255,255,1)}
        .module-card.active::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,59,48,0.5),transparent)}
        .module-card.locked{opacity:0.75;cursor:default}
        .module-card.locked:hover{transform:none;box-shadow:0 2px 8px rgba(0,0,0,0.05),0 8px 24px rgba(0,0,0,0.04)}
        .module-card.featured{grid-column:span 2;background:linear-gradient(135deg,rgba(255,59,48,0.08),rgba(255,255,255,0.72));border-color:rgba(255,59,48,0.2)}
        .card-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px}
        .card-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 2px 8px rgba(0,0,0,0.1),inset 0 1px 0 rgba(255,255,255,0.5)}
        .card-status-live{display:flex;align-items:center;gap:5px;background:rgba(48,209,88,0.12);border:1px solid rgba(48,209,88,0.25);border-radius:100px;padding:4px 10px;font-size:10px;font-weight:700;color:#1a7a35;letter-spacing:0.5px}
        .live-dot{width:5px;height:5px;background:#30d158;border-radius:50%;animation:lp 1.4s ease-in-out infinite}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:0.3}}
        .card-status-soon{display:flex;align-items:center;gap:5px;background:rgba(0,0,0,0.05);border:1px solid var(--ash-3);border-radius:100px;padding:4px 10px;font-size:10px;font-weight:600;color:var(--ink-3);letter-spacing:0.5px}
        .card-title{font-family:'Sora',sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.5px;color:var(--ink);margin-bottom:8px}
        .card-desc{font-size:13.5px;color:var(--ink-2);line-height:1.55;margin-bottom:20px}
        .card-meta{font-size:12px;font-weight:600;color:var(--red);letter-spacing:-0.1px}
        .card-meta-grey{font-size:12px;font-weight:500;color:var(--ink-3)}
        .card-cta{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:linear-gradient(135deg,#ff3b30,#ff6b35);color:#fff;border-radius:12px;font-size:13px;font-weight:700;text-decoration:none;transition:all 0.2s;box-shadow:0 2px 8px rgba(255,59,48,0.3);font-family:'DM Sans',sans-serif;margin-top:4px;border:none;cursor:pointer}
        .card-cta:hover{box-shadow:0 4px 14px rgba(255,59,48,0.4);transform:translateY(-1px)}
        .notify-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:rgba(0,0,0,0.05);color:var(--ink-2);border-radius:12px;font-size:13px;font-weight:600;border:1px solid var(--ash-3);cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;margin-top:4px}
        .notify-btn:hover{background:rgba(0,0,0,0.08);color:var(--ink)}

        /* ── Who it's for ── */
        .who-section{padding:0 24px 100px;max-width:1100px;margin:0 auto}
        .who-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:48px}
        .who-card{background:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:20px;padding:24px 20px;text-align:center;transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 2px 8px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,1)}
        .who-card:hover{transform:translateY(-3px);background:rgba(255,255,255,0.85);box-shadow:0 8px 24px rgba(0,0,0,0.08)}
        .who-emoji{font-size:32px;margin-bottom:12px}
        .who-title{font-family:'Sora',sans-serif;font-size:15px;font-weight:700;color:var(--ink);margin-bottom:6px;letter-spacing:-0.3px}
        .who-sub{font-size:12px;color:var(--ink-3);line-height:1.5}

        /* ── CTA ── */
        .cta-section{padding:0 24px 120px;max-width:700px;margin:0 auto;text-align:center}
        .cta-card{background:rgba(255,255,255,0.72);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(40px);border-radius:32px;padding:60px 48px;position:relative;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1)}
        .cta-card::before{content:'';position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:300px;height:300px;background:radial-gradient(circle,rgba(255,59,48,0.08) 0%,transparent 70%);pointer-events:none}
        .cta-card h2{font-family:'Sora',sans-serif;font-size:40px;font-weight:800;letter-spacing:-2px;line-height:1.1;color:var(--ink);margin-bottom:14px}
        .cta-card h2 span{color:var(--red)}
        .cta-card p{font-size:16px;color:var(--ink-2);line-height:1.6;margin-bottom:36px}

        /* ── Footer ── */
        .footer{border-top:1px solid var(--ash-3);padding:32px 24px;max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
        .footer-logo{font-family:'Sora',sans-serif;font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-0.5px}
        .footer-logo span{color:var(--red)}
        .footer-links{display:flex;gap:24px;flex-wrap:wrap}
        .footer-link{font-size:12.5px;color:var(--ink-3);text-decoration:none;transition:color 0.2s}
        .footer-link:hover{color:var(--ink)}
        .footer-copy{font-size:12px;color:var(--ink-3)}
      `}</style>

      {/* Signup modal — shown when any CTA is clicked */}
      {showModal && <QuickSignupModal onClose={() => setShowModal(false)} />}

      <div className="bg-mesh" />

      <div className="page">

        {/* Navbar */}
        <nav className="navbar">
          <a href="/" className="nav-logo">
            <div className="nav-logo-dot" />
            CompliCore<span>OS</span>
          </a>
          <div className="nav-links">
            <a href="#modules" className="nav-link">Modules</a>
            <a href="#who" className="nav-link">Who it's for</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#about" className="nav-link">About</a>
          </div>
          <div className="nav-actions">
            <Link href="/login" className="btn-login">Log in</Link>
            {/* Get Started → triggers modal */}
            <button onClick={() => setShowModal(true)} className="btn-signup">
              Get Started →
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="hero-badge">
            <div className="hero-badge-dot">⚡</div>
            Now in Early Access · Free to start
          </div>
          <h1>
            Compliance<br/>
            <span className="accent">intelligence</span><br/>
            <span className="light-word">at your fingertips</span>
          </h1>
          <p className="hero-sub">
            Real-time gas prices, regulatory updates, tariff tracking,
            and tax deductions — all in one platform built for
            gig workers, freelancers, and growing businesses.
          </p>
          <div className="hero-actions">
            {/* Start Free → modal */}
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Start Free — No Card Needed →
            </button>
            {/* Gas Tracker → modal (soft gate) */}
            <button onClick={() => setShowModal(true)} className="btn-secondary">
              ⛽ Try Gas Tracker
            </button>
          </div>
          <div className="hero-trust">
            <span className="trust-item">For Drivers</span>
            <div className="trust-dot" />
            <span className="trust-item">For Freelancers</span>
            <div className="trust-dot" />
            <span className="trust-item">For Restaurants</span>
            <div className="trust-dot" />
            <span className="trust-item">For Businesses</span>
          </div>
        </section>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stats-inner">
            {[
              { val:"$8,736", suffix:"",  label:"Avg annual deductions missed by drivers" },
              { val:"145",    suffix:"x", label:"Average ROI for Business Pass users" },
              { val:"3,200+", suffix:"",  label:"Regulatory updates tracked per month" },
              { val:"Free",   suffix:"",  label:"To start — upgrade when you're ready" },
            ].map((s,i) => (
              <div className="stat-item" key={i}>
                <div className="stat-val">{s.val}<span>{s.suffix}</span></div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Modules */}
        <section className="modules-section" id="modules">
          <div className="modules-header">
            <div className="section-label">Platform Modules</div>
            <div className="section-title">Everything you need.<br/>Nothing you don't.</div>
            <p className="section-sub" style={{margin:"0 auto"}}>
              Each module is personalized to your type and connects to the others automatically.
            </p>
          </div>
          <div className="modules-grid">

            {/* Gas Tracker — featured, triggers modal */}
            <div className="module-card featured active" onClick={() => setShowModal(true)}>
              <div className="card-top">
                <div className="card-icon" style={{background:"linear-gradient(135deg,#ff3b30,#ff6b35)"}}>⛽</div>
                <div className="card-status-live"><div className="live-dot" />LIVE</div>
              </div>
              <div className="card-title">Gas Price Tracker</div>
              <div className="card-desc">
                Real-time gas prices at stations near you. Compare grades, track 7-day trends,
                and calculate your exact IRS mileage deduction — updated every hour from EIA.gov.
              </div>
              <div className="card-meta">$3.07 near you right now · ↓ Prices falling</div>
              <br/>
              <span className="card-cta">Open Gas Tracker →</span>
            </div>

            {/* Regulatory — coming soon */}
            <div className="module-card locked">
              <div className="card-top">
                <div className="card-icon" style={{background:"linear-gradient(135deg,#0a84ff,#30a0ff)"}}>📋</div>
                <div className="card-status-soon">🔒 Coming Soon</div>
              </div>
              <div className="card-title">Regulatory Updates</div>
              <div className="card-desc">
                IRS changes, OSHA rules, labor laws, and federal regulations filtered to your industry.
                Never miss a compliance change that affects your business.
              </div>
              <div className="card-meta-grey">IRS · OSHA · DOL · FDA</div>
              <br/>
              <button className="notify-btn">🔔 Notify Me</button>
            </div>

            <div className="module-card locked">
              <div className="card-top">
                <div className="card-icon" style={{background:"linear-gradient(135deg,#ff9f0a,#ffb340)"}}>🌐</div>
                <div className="card-status-soon">🔒 Coming Soon</div>
              </div>
              <div className="card-title">Tariff Intelligence</div>
              <div className="card-desc">
                Live import/export tariff rates by country and product. See exactly how tariff changes
                affect your cost of goods, with sourcing alternatives built in.
              </div>
              <div className="card-meta-grey">China · Mexico · Canada · EU</div>
              <br/>
              <button className="notify-btn">🔔 Notify Me</button>
            </div>

            <div className="module-card locked">
              <div className="card-top">
                <div className="card-icon" style={{background:"linear-gradient(135deg,#30d158,#4cd964)"}}>🧾</div>
                <div className="card-status-soon">🔒 Coming Soon</div>
              </div>
              <div className="card-title">Deduction Teller</div>
              <div className="card-desc">
                Enter what you spend monthly — we tell you exactly what's deductible,
                what you're missing, and how much you'll save at tax time.
              </div>
              <div className="card-meta-grey">Average user finds $5,760/yr unclaimed</div>
              <br/>
              <button className="notify-btn">🔔 Notify Me</button>
            </div>

            <div className="module-card locked">
              <div className="card-top">
                <div className="card-icon" style={{background:"linear-gradient(135deg,#bf5af2,#da8fff)"}}>📊</div>
                <div className="card-status-soon">🔒 Coming Soon</div>
              </div>
              <div className="card-title">Assets & Liabilities</div>
              <div className="card-desc">
                Track your net worth, debt-to-asset ratio, and monthly financial health.
                Generate a one-page balance sheet your bank or accountant actually wants.
              </div>
              <div className="card-meta-grey">PDF export · Bank-ready format</div>
              <br/>
              <button className="notify-btn">🔔 Notify Me</button>
            </div>

          </div>
        </section>

        {/* Who It's For */}
        <section className="who-section" id="who">
          <div style={{textAlign:"center"}}>
            <div className="section-label">Who It's For</div>
            <div className="section-title">Built for everyone<br/>who works for themselves</div>
          </div>
          <div className="who-grid">
            {[
              {emoji:"🚗",title:"Rideshare & Delivery",sub:"Uber, Lyft, DoorDash\nInstacart, Amazon Flex"},
              {emoji:"💼",title:"Freelancers",         sub:"Designers, developers\nconsultants, writers"},
              {emoji:"🍽️",title:"Restaurants & Cafes", sub:"Independent owners\ncaterers, food trucks"},
              {emoji:"🌿",title:"Cannabis & Dispensary",sub:"Retail, delivery\ncultivation operations"},
              {emoji:"🚛",title:"Trucking & Logistics", sub:"Owner-operators\nfleet managers"},
              {emoji:"🏗️",title:"Trades & Construction",sub:"GCs, subcontractors\nproperty managers"},
              {emoji:"🛒",title:"Retail & E-commerce",  sub:"Shopify, Amazon\nboutique stores"},
              {emoji:"📦",title:"Importers & Exporters", sub:"Manufacturers\ndistributors, wholesalers"},
            ].map((w,i) => (
              <div className="who-card" key={i}>
                <div className="who-emoji">{w.emoji}</div>
                <div className="who-title">{w.title}</div>
                <div className="who-sub" style={{whiteSpace:"pre-line"}}>{w.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="cta-card">
            <div className="section-label">Get Started Today</div>
            <h2>Your compliance<br/><span>starts here</span></h2>
            <p>
              Take 60 seconds to set up your profile. We'll personalize
              your entire dashboard to your type — automatically.
            </p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              {/* Both CTA buttons → modal */}
              <button onClick={() => setShowModal(true)} className="btn-primary" style={{fontSize:16,padding:"16px 36px",border:'none'}}>
                Create Free Account →
              </button>
              <Link href="/login" className="btn-secondary" style={{fontSize:16,padding:"16px 28px"}}>
                Log In
              </Link>
            </div>
            <div style={{marginTop:24,fontSize:12,color:"var(--ink-3)"}}>
              Free forever for basic use · No credit card required
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-logo">CompliCore<span>OS</span></div>
          <div className="footer-links">
            <a href="/privacy" className="footer-link">Privacy Policy</a>
            <a href="/terms" className="footer-link">Terms of Service</a>
            <a href="/about" className="footer-link">About</a>
            <a href="/contact" className="footer-link">Contact</a>
          </div>
          <div className="footer-copy">© 2025 CompliCoreOS. All rights reserved.</div>
        </footer>

      </div>
    </>
  )
}