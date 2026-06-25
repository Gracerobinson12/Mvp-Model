'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function GCIcon({ size = 36 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}>
      <rect width="512" height="512" rx="114" fill="#ff3b30"/>
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  )
}

// ── Quick Signup Modal ──────────────────────────────────────
function QuickSignupModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState<'gate'|'type'|'details'>('gate')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userCat, setUserCat] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [stateName, setStateName] = useState('')
  const [bizName, setBizName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleContinue = () => {
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address.'); return }
    setError(''); setStep('type')
  }

  const handleCreate = async () => {
    if (password.length < 8) return
    setLoading(true); setError('')
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError
      const userId = data.user?.id
      if (!userId) throw new Error('No user ID returned')
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId, email,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        full_name: [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null,
        business_name: bizName.trim() || null,
        state: stateName || null,
        user_type: userCat,
        account_type: userCat === 'business' ? 'business' : 'personal',
        plan: 'free',
        plan_status: 'taste',
        onboarded: true,
        trial_ends_at: null,
      })
      if (profileError) throw profileError
      localStorage.setItem('gratia_signup_time', Date.now().toString())
      if (userCat === 'business') router.push('/dashboard/enterprise')
      else router.push('/dashboard/gas')
    } catch (e: any) {
      const msg = e?.message || ''
      if (msg.includes('already registered') || e?.status === 422) {
        setError('An account with this email already exists. Please log in instead.')
      } else { setError(msg || 'Something went wrong. Please try again.') }
      setLoading(false)
    }
  }

  const inp = (extra = {}) => ({ width:'100%', padding:'13px 16px', background:'#f8f7fc', border:'1.5px solid rgba(0,0,0,.1)', borderRadius:14, fontSize:15, color:'#1a1a2e', outline:'none', fontFamily:"'DM Sans',sans-serif", ...extra })

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)',padding:24}}>
      <div style={{background:'#fff',borderRadius:26,padding:'36px 32px',maxWidth:420,width:'100%',boxShadow:'0 32px 80px rgba(0,0,0,.18)',fontFamily:"'DM Sans',system-ui,sans-serif",position:'relative',animation:'modalPop .35s cubic-bezier(.34,1.56,.64,1)'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,.06)',border:'none',cursor:'pointer',fontSize:14,color:'rgba(26,26,46,.5)'}}>✕</button>

        {step === 'gate' && <>
          <div style={{display:'flex',justifyContent:'center',marginBottom:20}}><GCIcon size={52}/></div>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,letterSpacing:-.5,textAlign:'center',color:'#1a1a2e',marginBottom:8}}>Pick your plan</h2>
          <p style={{fontSize:14,color:'rgba(26,26,46,.55)',textAlign:'center',lineHeight:1.65,marginBottom:22}}>7-day free trial · No card to start</p>
          <input type="email" placeholder="Your email address" value={email} onChange={e=>{setEmail(e.target.value);setError('')}} onKeyDown={e=>e.key==='Enter'&&handleContinue()} autoFocus style={{...inp(),marginBottom:error?6:10,border:`1.5px solid ${error?'#ff453a':'rgba(0,0,0,.1)'}`}}/>
          {error && <div style={{fontSize:12,color:'#ff453a',marginBottom:10}}>{error}</div>}
          <button onClick={handleContinue} style={{width:'100%',padding:14,background:email.trim()?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(255,59,48,.2)',color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,cursor:email.trim()?'pointer':'not-allowed'}}>Continue →</button>
          <div style={{textAlign:'center',fontSize:13,color:'rgba(26,26,46,.45)',marginTop:16}}>Already have an account?{' '}<Link href="/login" style={{color:'#ff3b30',fontWeight:600,textDecoration:'none'}} onClick={onClose}>Log in →</Link></div>
        </>}

        {step === 'type' && <>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:21,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',marginBottom:16}}>Which plan fits you?</h2>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
            <div onClick={()=>setUserCat('driver')} style={{border:`1.5px solid ${userCat==='driver'?'#ff3b30':'rgba(0,0,0,.08)'}`,borderRadius:16,padding:'14px 16px',cursor:'pointer',background:userCat==='driver'?'rgba(255,59,48,.04)':'#f8f7fc'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,59,48,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>⛽</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>Core · $9.99/mo</div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.5)'}}>Gas + EV intelligence, route finder</div>
                </div>
              </div>
            </div>
            <div onClick={()=>setUserCat('business')} style={{border:`1.5px solid ${userCat==='business'?'#bf5af2':'rgba(0,0,0,.08)'}`,borderRadius:16,padding:'14px 16px',cursor:'pointer',background:userCat==='business'?'rgba(191,90,242,.04)':'#f8f7fc'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:42,height:42,borderRadius:12,background:'rgba(191,90,242,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🏢</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>Enterprise · $79.99/mo</div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.5)'}}>Ideas Vault, Barter, Regulatory, Market Intel</div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={()=>{ if(userCat) setStep('details') }} disabled={!userCat}
            style={{width:'100%',padding:13,background:userCat?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(0,0,0,.08)',color:userCat?'#fff':'rgba(26,26,46,.3)',border:'none',borderRadius:100,fontSize:14,fontWeight:700,cursor:userCat?'pointer':'not-allowed'}}>
            {!userCat ? 'Select a plan to continue' : 'Continue →'}
          </button>
          <button onClick={()=>setStep('gate')} style={{background:'none',border:'none',color:'rgba(26,26,46,.4)',fontSize:13,cursor:'pointer',marginTop:10,padding:0}}>← Back</button>
        </>}

        {step === 'details' && <>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:21,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',marginBottom:16}}>Almost done</h2>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <input type="text" placeholder="First name" value={firstName} onChange={e=>setFirstName(e.target.value)} style={{...inp(),flex:1}}/>
            <input type="text" placeholder="Last name" value={lastName} onChange={e=>setLastName(e.target.value)} style={{...inp(),flex:1}}/>
          </div>
          {userCat==='business' && (
            <input type="text" placeholder="Business name" value={bizName} onChange={e=>setBizName(e.target.value)} style={{...inp(),marginBottom:10}}/>
          )}
          <select value={stateName} onChange={e=>setStateName(e.target.value)} style={{...inp(),marginBottom:10,appearance:'none',color:stateName?'#1a1a2e':'rgba(26,26,46,.4)'}}>
            <option value="">Select your state</option>
            {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s=>(
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input type="password" placeholder="Create a password (8+ characters)" value={password} onChange={e=>{setPassword(e.target.value);setError('')}} onKeyDown={e=>e.key==='Enter'&&password.length>=8&&handleCreate()} style={{...inp(),marginBottom:error?6:10}}/>
          {error && <div style={{fontSize:12,color:'#ff453a',marginBottom:10}}>{error}</div>}
          <button onClick={handleCreate} disabled={password.length<8||loading} style={{width:'100%',padding:14,background:password.length>=8&&!loading?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(255,59,48,.2)',color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,cursor:password.length>=8&&!loading?'pointer':'not-allowed',marginBottom:12}}>
            {loading?'Creating your account...':'Create account →'}
          </button>
          <button onClick={()=>setStep('type')} style={{background:'none',border:'none',color:'rgba(26,26,46,.4)',fontSize:13,cursor:'pointer',padding:0}}>← Back</button>
        </>}
      </div>
    </div>
  )
}

const CORE_MODULES = [
  { icon:'⛽', color:'linear-gradient(135deg,#ff3b30,#ff6b35)', title:'Gas Intelligence', desc:'Real-time gas prices at every station near you. Compare grades — regular, mid, premium, diesel — and see exactly which pump saves you the most today.', meta:'Live · Updated every refresh' },
  { icon:'⚡', color:'linear-gradient(135deg,#0a84ff,#30a0ff)', title:'EV Intelligence', desc:'Find EV chargers near you with live availability. See network, charging speed, cost per kWh, and whether a port is actually open before you drive there.', meta:'Live · Open Charge Map data' },
  { icon:'🛣️', color:'linear-gradient(135deg,#30d158,#34c759)', title:'Route Finder', desc:'Enter a destination and we calculate the cheapest fuel stop along your actual route — not just nearby, but on the way, so you never backtrack to save.', meta:'Live · Real route calculation' },
]

const ENTERPRISE_MODULES = [
  { icon:'💡', color:'linear-gradient(135deg,#ffd60a,#ff9f0a)', title:'Ideas Vault', desc:'Timestamp and seal your ideas with SHA-256 hashing, RFC 3161 timestamping, and Bitcoin blockchain anchoring. Establish prior art before anyone else files — with a court-ready certificate.', meta:'SHA-256 · RFC 3161 · Bitcoin proof' },
  { icon:'🤝', color:'linear-gradient(135deg,#0a84ff,#30a0ff)', title:'Barter & Trade', desc:'Legally timestamp trade and barter agreements between businesses. Get an Agreement ID, a fairness scoring bar, and a permanent legal record if a dispute ever comes up.', meta:'Agreement ID · Legal timestamp' },
  { icon:'📋', color:'linear-gradient(135deg,#ff453a,#ff6b5b)', title:'Regulatory Updates', desc:'IRS mileage changes, OSHA safety standards, DOL overtime rules, FDA and FTC updates — filtered to your industry so you find out before it costs you.', meta:'IRS · OSHA · DOL · FDA · FTC' },
  { icon:'📈', color:'linear-gradient(135deg,#bf5af2,#da8fff)', title:'Market Intelligence', desc:'Track margins, spot pricing trends, and catch early signals in your market — gas prices, consumer spending shifts, and competitor positioning before they hit the news.', meta:'Live margins · Trend signals' },
]

function LandingPage() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--red:#ff3b30;--ash:#f0eff4;--ash-3:#d8d7de;--ink:#1a1a2e;--ink-2:rgba(26,26,46,0.6);--ink-3:rgba(26,26,46,0.35)}
        html{scroll-behavior:smooth}
        body{background:var(--ash);font-family:'DM Sans',system-ui,sans-serif;color:var(--ink);overflow-x:hidden}

        @keyframes modalPop{from{opacity:0;transform:scale(.93) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes drift1{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,40px)}}
        @keyframes drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,50px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes ping{75%,100%{transform:scale(2);opacity:0}}

        .bg-mesh{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
        .glow1{position:absolute;top:-200px;left:-200px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(255,59,48,.14),transparent 70%);animation:drift1 12s ease-in-out infinite;filter:blur(40px)}
        .glow2{position:absolute;top:30%;right:-200px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(191,90,242,.10),transparent 70%);animation:drift2 14s ease-in-out infinite;filter:blur(40px)}
        .grid-fade{position:absolute;inset:0;background-image:linear-gradient(rgba(26,26,46,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(26,26,46,.025) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 70% 45% at 50% 8%,black 35%,transparent 100%)}

        .page{position:relative;z-index:1;min-height:100vh}
        .navbar{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 10px;height:56px;background:rgba(255,255,255,0.72);backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);border:1px solid rgba(255,255,255,0.95);border-radius:22px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
        .nav-pill{display:flex;align-items:center;gap:2px;background:rgba(0,0,0,.03);border-radius:100px;padding:4px;position:absolute;left:50%;transform:translateX(-50%)}
        .nav-item{padding:7px 16px;font-size:13.5px;font-weight:500;color:var(--ink-2);text-decoration:none;border-radius:100px;cursor:pointer}
        .btn-login{padding:8px 18px;font-size:13px;font-weight:600;color:var(--ink);background:transparent;border:1px solid var(--ash-3);border-radius:14px;cursor:pointer;text-decoration:none}
        .btn-signup{padding:8px 18px;font-size:13px;font-weight:700;color:#fff;background:linear-gradient(135deg,#ff3b30,#ff6b35);border:none;border-radius:14px;cursor:pointer;box-shadow:0 2px 8px rgba(255,59,48,0.3);white-space:nowrap}

        .hero{padding:160px 24px 60px;text-align:center;max-width:780px;margin:0 auto;position:relative;z-index:1}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:100px;padding:6px 16px;font-size:12px;font-weight:600;color:var(--ink-2);margin-bottom:24px;animation:fadeUp .6s ease both}
        .live-dot-wrap{position:relative;display:flex;width:8px;height:8px}
        .live-dot-ping{position:absolute;inset:0;border-radius:50%;background:#30d158;opacity:.75;animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite}
        .live-dot-core{position:relative;border-radius:50%;width:8px;height:8px;background:#30d158}
        .hero h1{font-family:'Sora',sans-serif;font-size:clamp(40px,6vw,68px);font-weight:900;letter-spacing:-2.5px;line-height:1.02;color:var(--ink);margin-bottom:18px;animation:fadeUp .6s ease .1s both}
        .hero h1 .accent{color:var(--red)}
        .hero-sub{font-size:16px;color:var(--ink-2);line-height:1.65;max-width:560px;margin:0 auto 32px;animation:fadeUp .6s ease .2s both}
        .hero-actions{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;animation:fadeUp .6s ease .3s both}
        .btn-primary{display:inline-flex;align-items:center;gap:8px;padding:15px 30px;background:linear-gradient(135deg,#ff3b30,#ff6b35);color:#fff;border-radius:18px;font-size:15px;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(255,59,48,0.35)}
        .btn-secondary{display:inline-flex;align-items:center;gap:8px;padding:15px 26px;background:rgba(255,255,255,0.75);color:var(--ink);border-radius:18px;font-size:15px;font-weight:600;border:1px solid rgba(255,255,255,0.95);cursor:pointer;text-decoration:none}

        .stats-bar{max-width:900px;margin:0 auto 90px;padding:0 24px;position:relative;z-index:1}
        .stats-inner{display:grid;grid-template-columns:repeat(4,1fr);background:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(40px);border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
        .stat-item{padding:24px 20px;text-align:center;position:relative}
        .stat-item::after{content:'';position:absolute;right:0;top:20%;height:60%;width:1px;background:var(--ash-3)}
        .stat-item:last-child::after{display:none}
        .stat-val{font-family:'Sora',sans-serif;font-size:26px;font-weight:800;letter-spacing:-1.2px;color:var(--ink);line-height:1;margin-bottom:6px}
        .stat-val span{color:var(--red)}
        .stat-lbl{font-size:11.5px;font-weight:500;color:var(--ink-3)}

        .section-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--red);margin-bottom:12px}
        .section-label.purple{color:#bf5af2}
        .section-title{font-family:'Sora',sans-serif;font-size:clamp(28px,3.6vw,40px);font-weight:800;letter-spacing:-1.5px;line-height:1.1;color:var(--ink);margin-bottom:14px}
        .section-sub{font-size:15px;color:var(--ink-2);line-height:1.6;max-width:520px}

        .modules-section{padding:0 24px 90px;max-width:1100px;margin:0 auto;position:relative;z-index:1}
        .modules-header{margin-bottom:36px}
        .modules-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        @media(max-width:860px){.modules-grid{grid-template-columns:1fr 1fr}.nav-pill{display:none}.stats-inner{grid-template-columns:1fr 1fr}}
        @media(max-width:540px){.modules-grid{grid-template-columns:1fr}}
        .module-card{background:rgba(255,255,255,0.72);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(40px);border-radius:22px;padding:24px;position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
        .module-card.first{grid-column:span 1}
        .card-icon{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:16px}
        .card-status-live{display:inline-flex;align-items:center;gap:5px;background:rgba(48,209,88,0.12);border:1px solid rgba(48,209,88,0.25);border-radius:100px;padding:3px 9px;font-size:9px;font-weight:700;color:#1a7a35;letter-spacing:0.5px;margin-bottom:14px;float:right}
        .live-dot{width:5px;height:5px;background:#30d158;border-radius:50%;animation:pulse 1.4s ease-in-out infinite;display:inline-block}
        .card-title{font-family:'Sora',sans-serif;font-size:17px;font-weight:700;letter-spacing:-0.3px;color:var(--ink);margin-bottom:8px;clear:both}
        .card-desc{font-size:13px;color:var(--ink-2);line-height:1.55;margin-bottom:14px}
        .card-meta{font-size:11px;font-weight:600;color:var(--red)}
        .card-meta.purple{color:#bf5af2}

        .plan-strip{max-width:760px;margin:0 auto 90px;padding:0 24px;position:relative;z-index:1}
        .plan-card{background:rgba(255,255,255,0.72);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(40px);border-radius:24px;padding:28px;position:relative;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
        .plan-card.enterprise{border-color:rgba(191,90,242,.25)}
        .plan-card.core{border-color:rgba(255,59,48,.25)}
        .feature-row{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink-2);margin-bottom:8px}

        .who-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:36px}
        .who-card{background:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:18px;padding:20px 16px;text-align:center}
        .who-emoji{font-size:26px;margin-bottom:10px}
        .who-title{font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:var(--ink);margin-bottom:4px}
        .who-sub{font-size:11px;color:var(--ink-3);line-height:1.5}

        .footer{border-top:1px solid var(--ash-3);padding:28px 24px;max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;position:relative;z-index:1}
        .footer-link{font-size:12.5px;color:var(--ink-3);text-decoration:none}
      `}</style>

      {showModal && <QuickSignupModal onClose={()=>setShowModal(false)}/>}

      <div className="bg-mesh">
        <div className="glow1"/>
        <div className="glow2"/>
        <div className="grid-fade"/>
      </div>

      <div className="page">
        <nav className="navbar">
          <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:8}}>
            <GCIcon size={28}/>
            <span style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:800,letterSpacing:-.3,color:'#1a1a2e'}}>Gratia Core</span>
          </a>
          <div className="nav-pill">
            <a href="#core" className="nav-item">Core</a>
            <a href="#enterprise" className="nav-item">Enterprise</a>
            <a href="#pricing" className="nav-item">Pricing</a>
          </div>
          <div style={{display:'flex',gap:8}}>
            <Link href="/login" className="btn-login">Log in</Link>
            <button onClick={()=>setShowModal(true)} className="btn-signup">Get Started →</button>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">
            <span className="live-dot-wrap"><span className="live-dot-ping"/><span className="live-dot-core"/></span>
            Core live now · Enterprise for operators
          </div>
          <h1>Business <span className="accent">intelligence</span><br/>for drivers and operators.</h1>
          <p className="hero-sub">Core gives drivers real-time gas prices, EV chargers, and route savings. Enterprise gives operators ideas protection, trade agreements, regulatory tracking, and market signals. No middle tier — just the right tool.</p>
          <div className="hero-actions">
            <button onClick={()=>setShowModal(true)} className="btn-primary">Start free trial →</button>
            <a href="#pricing" className="btn-secondary">View pricing</a>
          </div>
        </section>

        {/* STATS */}
        <div className="stats-bar">
          <div className="stats-inner">
            {[
              {val:'59M+',suffix:'',label:'Gig workers who need fuel savings'},
              {val:'$0.70',suffix:'/mi',label:'IRS mileage rate, 2026'},
              {val:'$3.00+',suffix:'',label:'Gas delta between TX and CA'},
              {val:'$5,760',suffix:'',label:'Avg deductions businesses miss yearly'},
            ].map((s,i)=>(
              <div className="stat-item" key={i}>
                <div className="stat-val">{s.val}<span>{s.suffix}</span></div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CORE MODULES */}
        <section className="modules-section" id="core">
          <div className="modules-header">
            <div className="section-label">Core · $9.99/mo</div>
            <div className="section-title">Built for everyday drivers.</div>
            <p className="section-sub">Gas prices, EV chargers, and route savings — all live, all real-time.</p>
          </div>
          <div className="modules-grid">
            {CORE_MODULES.map((m,i)=>(
              <div className="module-card" key={i}>
                <div className="card-status-live"><span className="live-dot"/>LIVE</div>
                <div className="card-icon" style={{background:m.color}}>{m.icon}</div>
                <div className="card-title">{m.title}</div>
                <div className="card-desc">{m.desc}</div>
                <div className="card-meta">{m.meta}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ENTERPRISE MODULES */}
        <section className="modules-section" id="enterprise">
          <div className="modules-header">
            <div className="section-label purple">Enterprise · $79.99/mo</div>
            <div className="section-title">Built for operators who need more.</div>
            <p className="section-sub">Protect your ideas, formalize trades, and stay ahead of regulations and markets.</p>
          </div>
          <div className="modules-grid">
            {ENTERPRISE_MODULES.map((m,i)=>(
              <div className="module-card" key={i}>
                <div className="card-status-live" style={{background:'rgba(191,90,242,0.12)',borderColor:'rgba(191,90,242,0.25)',color:'#6b21a8'}}><span className="live-dot" style={{background:'#bf5af2'}}/>LIVE</div>
                <div className="card-icon" style={{background:m.color}}>{m.icon}</div>
                <div className="card-title">{m.title}</div>
                <div className="card-desc">{m.desc}</div>
                <div className="card-meta purple">{m.meta}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="plan-strip">
          <div style={{textAlign:'center',marginBottom:32}}>
            <div className="section-label" style={{color:'var(--ink-3)'}}>Pricing</div>
            <div className="section-title">Simple, honest pricing.</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div className="plan-card core">
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,color:'#1a1a2e'}}>Core</span>
                <span style={{fontSize:9,fontWeight:700,color:'#1a7a35',background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.2)',borderRadius:100,padding:'2px 8px'}}>Live now</span>
              </div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:32,fontWeight:900,color:'#ff3b30',marginBottom:16}}>$9.99<span style={{fontSize:13,color:'rgba(26,26,46,.4)',fontWeight:400}}>/mo</span></div>
              {CORE_MODULES.map((m,i)=>(<div className="feature-row" key={i}>{m.icon} {m.title}</div>))}
              <button onClick={()=>setShowModal(true)} className="btn-primary" style={{width:'100%',marginTop:16,justifyContent:'center'}}>Start free trial →</button>
            </div>
            <div className="plan-card enterprise">
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,color:'#1a1a2e'}}>Enterprise</span>
                <span style={{fontSize:9,fontWeight:700,color:'#6b21a8',background:'rgba(191,90,242,.1)',border:'1px solid rgba(191,90,242,.2)',borderRadius:100,padding:'2px 8px'}}>For operators</span>
              </div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:32,fontWeight:900,color:'#bf5af2',marginBottom:16}}>$79.99<span style={{fontSize:13,color:'rgba(26,26,46,.4)',fontWeight:400}}>/mo</span></div>
              {ENTERPRISE_MODULES.map((m,i)=>(<div className="feature-row" key={i}>{m.icon} {m.title}</div>))}
              <button onClick={()=>setShowModal(true)} className="btn-secondary" style={{width:'100%',marginTop:16,justifyContent:'center',display:'flex'}}>Explore Enterprise →</button>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section style={{maxWidth:1000,margin:'0 auto 90px',padding:'0 24px',position:'relative',zIndex:1}}>
          <div style={{textAlign:'center'}}>
            <div className="section-label" style={{color:'var(--ink-3)'}}>Who it's for</div>
            <div className="section-title">Drivers, operators, and everyone between.</div>
          </div>
          <div className="who-grid">
            {[
              {e:'⛽',t:'Everyday Drivers',s:'Save at the pump, every fill-up'},
              {e:'🚗',t:'Rideshare & Delivery',s:'Uber, Lyft, DoorDash, Instacart'},
              {e:'💡',t:'Inventors & Founders',s:'Protect ideas before you pitch'},
              {e:'🏗️',t:'Contractors & Operators',s:'Stay ahead of regulatory changes'},
            ].map((w,i)=>(
              <div className="who-card" key={i}>
                <div className="who-emoji">{w.e}</div>
                <div className="who-title">{w.t}</div>
                <div className="who-sub">{w.s}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <GCIcon size={26}/>
            <span style={{fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:800,color:'#1a1a2e'}}>Gratia Core</span>
          </div>
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            <a href="/privacy" className="footer-link">Privacy</a>
            <a href="/terms" className="footer-link">Terms</a>
          </div>
          <div style={{fontSize:12,color:'var(--ink-3)'}}>© 2026 Gratia Core Enterprise LLC.</div>
        </footer>
      </div>
    </>
  )
}

export default function Home() {
  return <LandingPage/>
}