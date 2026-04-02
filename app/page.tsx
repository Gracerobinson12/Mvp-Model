'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const COMING_SOON_ENV = process.env.NEXT_PUBLIC_COMING_SOON === 'true'
const ACCESS_CODE     = 'GRATIA2025'

function ComingSoonGate() {
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [email,   setEmail]   = useState('')
  const [joined,  setJoined]  = useState(false)
  const [show,    setShow]    = useState(false)

  useEffect(() => {
    if (localStorage.getItem('gratia_access') === 'true') {
      setShow(false)
    } else {
      setShow(true)
    }
  }, [])

  const handleUnlock = () => {
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      setLoading(true)
      localStorage.setItem('gratia_access', 'true')
      window.location.reload()
    } else {
      setError('Invalid access code. Try again.')
      setCode('')
    }
  }

  const handleWaitlist = async () => {
    if (!email.trim() || !email.includes('@')) return
    try {
      await supabase.from('waitlist').insert({ email: email.trim(), module: 'launch' })
    } catch {}
    setJoined(true)
    setEmail('')
  }

  if (!show) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0a0f;font-family:'DM Sans',sans-serif;color:white;min-height:100vh;overflow:hidden}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
        input:focus{outline:none;border-color:rgba(255,255,255,.4)!important}
      `}</style>

      <div style={{position:'fixed',inset:0,zIndex:0,background:`radial-gradient(ellipse 80% 60% at 20% 20%,rgba(255,59,48,.18) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 80%,rgba(255,80,40,.1) 0%,transparent 55%),radial-gradient(ellipse 100% 80% at 50% 50%,rgba(20,10,30,.8) 0%,#0a0a0f 100%)`}}/>

      <div style={{position:'relative',zIndex:1,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>

        <div style={{marginBottom:48,animation:'fadeUp .8s ease .1s both',textAlign:'center'}}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 270" height="32" style={{display:'block'}}>
            <text x="60" y="250" fontFamily="'Arial Black',Arial,sans-serif" fontSize="180" fontWeight="900" fill="white" letterSpacing="-8">GRAT</text>
            <text x="554" y="250" fontFamily="'Arial Black',Arial,sans-serif" fontSize="180" fontWeight="900" fill="rgba(255,255,255,0.5)" letterSpacing="-8">IA</text>
            <text x="720" y="250" fontFamily="Arial,sans-serif" fontSize="180" fontWeight="100" fill="rgba(255,255,255,0.8)" letterSpacing="-8"> CORE</text>
          </svg>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:4,color:'rgba(255,255,255,.35)',textTransform:'uppercase',marginTop:8}}>
            Business Intelligence Agency
          </div>
        </div>

        <div style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:28,padding:'44px 40px',maxWidth:460,width:'100%',backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',boxShadow:'0 32px 80px rgba(0,0,0,.4)',animation:'fadeUp .8s ease .2s both',textAlign:'center'}}>

          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,59,48,.12)',border:'1px solid rgba(255,59,48,.25)',borderRadius:100,padding:'6px 16px',fontSize:11,fontWeight:700,letterSpacing:2,color:'#ff6b5b',textTransform:'uppercase',marginBottom:24}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#ff3b30',animation:'pulse 1.5s ease infinite'}}/>
            Private Beta
          </div>

          <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:36,fontWeight:900,letterSpacing:-1.5,lineHeight:1.1,color:'white',marginBottom:12}}>
            Something big<br/>is coming
          </h1>
          <p style={{fontSize:15,color:'rgba(255,255,255,.5)',lineHeight:1.65,marginBottom:36,maxWidth:340,margin:'0 auto 36px'}}>
            GratIA Core is in private beta. Enter your access code to get in, or join the waitlist.
          </p>

          <div style={{marginBottom:12}}>
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <input type="text" placeholder="Enter access code" value={code}
                onChange={e=>{setCode(e.target.value.toUpperCase());setError('')}}
                onKeyDown={e=>e.key==='Enter'&&handleUnlock()} autoFocus
                style={{flex:1,padding:'13px 16px',background:'rgba(255,255,255,.07)',border:'1.5px solid rgba(255,255,255,.12)',borderRadius:14,fontSize:15,color:'white',fontFamily:"'DM Sans',sans-serif",letterSpacing:3,textTransform:'uppercase'}}/>
              <button onClick={handleUnlock} style={{padding:'13px 20px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:14,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 16px rgba(255,59,48,.4)',whiteSpace:'nowrap'}}>
                {loading ? '...' : 'Unlock →'}
              </button>
            </div>
            {error && <div style={{fontSize:12,color:'#ff6b5b',textAlign:'left',marginTop:4}}>{error}</div>}
          </div>

          <div style={{display:'flex',alignItems:'center',gap:12,margin:'24px 0',color:'rgba(255,255,255,.2)',fontSize:12}}>
            <div style={{flex:1,height:1,background:'rgba(255,255,255,.1)'}}/>or join the waitlist
            <div style={{flex:1,height:1,background:'rgba(255,255,255,.1)'}}/>
          </div>

          {!joined ? (
            <div style={{display:'flex',gap:8}}>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleWaitlist()}
                style={{flex:1,padding:'13px 16px',background:'rgba(255,255,255,.07)',border:'1.5px solid rgba(255,255,255,.12)',borderRadius:14,fontSize:15,color:'white',fontFamily:"'DM Sans',sans-serif"}}/>
              <button onClick={handleWaitlist} style={{padding:'13px 20px',background:'rgba(255,255,255,.1)',color:'white',border:'1px solid rgba(255,255,255,.15)',borderRadius:14,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>
                Notify Me
              </button>
            </div>
          ) : (
            <div style={{padding:'14px',background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.25)',borderRadius:14,fontSize:14,color:'#30d158',fontWeight:600}}>
              ✓ You're on the list — we'll email you when we launch!
            </div>
          )}

          <p style={{fontSize:11,color:'rgba(255,255,255,.2)',marginTop:20,lineHeight:1.6}}>
            Have an access code? You'll get full access instantly.<br/>
            No credit card needed to join the waitlist.
          </p>
        </div>

        <div style={{display:'flex',gap:16,marginTop:48,flexWrap:'wrap',justifyContent:'center',animation:'fadeUp .8s ease .4s both'}}>
          {[{icon:'⛽',label:'Gas Tracker'},{icon:'📋',label:'Regulatory'},{icon:'🌐',label:'Tariff Intel'},{icon:'🧾',label:'Deductions'},{icon:'📊',label:'Assets'}].map(m=>(
            <div key={m.label} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:100,padding:'8px 16px',fontSize:12,fontWeight:500,color:'rgba(255,255,255,.4)'}}>
              <span style={{fontSize:14}}>{m.icon}</span>{m.label}
            </div>
          ))}
        </div>

        <div style={{marginTop:32,fontSize:12,color:'rgba(255,255,255,.2)',textAlign:'center'}}>
          © 2025 GratIA Core LLC · Business Intelligence Agency
        </div>
      </div>
    </>
  )
}

function GratiaLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 270" height="32" style={{display:'block',flexShrink:0}}>
      <text x="60" y="250" fontFamily="'Arial Black','Arial Narrow',Arial,sans-serif" fontSize="180" fontWeight="900" fill="#1a1a2e" letterSpacing="-8">GRAT</text>
      <text x="554" y="250" fontFamily="'Arial Black','Arial Narrow',Arial,sans-serif" fontSize="180" fontWeight="900" fill="#ff3b30" letterSpacing="-8">IA</text>
      <text x="720" y="250" fontFamily="Arial,sans-serif" fontSize="180" fontWeight="100" fill="#1a1a2e" letterSpacing="-8"> CORE</text>
    </svg>
  )
}

function GCIcon({ size = 36 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}>
      <rect width="512" height="512" rx="114" fill="#ff3b30"/>
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  )
}

function QuickSignupModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step,       setStep]      = useState<'gate'|'type'|'details'>('gate')
  const [email,      setEmail]     = useState('')
  const [password,   setPassword]  = useState('')
  const [userCat,    setUserCat]   = useState('')
  const [loading,    setLoading]   = useState(false)
  const [error,      setError]     = useState('')
  const [promoCode,  setPromoCode] = useState('')
  const [promoValid, setPromoValid]= useState<boolean|null>(null)
  const [promoDays,  setPromoDays] = useState(7)

  const USER_TYPES = [
    { id:'gas',        icon:'⛽', label:'Gas prices only',  sub:'I just want to find cheap gas near me',        color:'#ff3b30' },
    { id:'driver',     icon:'🚗', label:'Gig driver',       sub:'Uber, Lyft, DoorDash — I need deductions too', color:'#ff6b35' },
    { id:'freelancer', icon:'💼', label:'Freelancer',       sub:'Independent contractor or self-employed',      color:'#0a84ff' },
    { id:'business',   icon:'🏢', label:'Business owner',   sub:'I run a business and need compliance tools',   color:'#30d158' },
  ]
  const selectedType = USER_TYPES.find(t => t.id === userCat)

  const validatePromo = async () => {
    if (!promoCode.trim()) return
    const { data, error: err } = await supabase.from('promo_codes').select('*').eq('code', promoCode.trim()).eq('active', true).single()
    if (err || !data || data.uses_count >= data.max_uses) { setPromoValid(false); return }
    setPromoValid(true); setPromoDays(data.trial_days)
  }

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
      const trialDays   = promoValid ? promoDays : 7
      const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId, email,
        user_type:     userCat,
        account_type:  userCat === 'business' ? 'business' : 'personal',
        plan:          'free',
        onboarded:     userCat === 'gas',
        trial_ends_at: trialEndsAt,
      })
      if (profileError) throw profileError
      if (promoValid && promoCode) {
        await supabase.from('promo_redemptions').insert({ user_id: userId, code: promoCode })
        await supabase.rpc('increment_promo_uses', { code_input: promoCode })
      }
      await fetch('/api/send-welcome', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, userType: userCat, trialDays }),
      }).catch(()=>{})
      // Gas only → straight to tracker, others → onboarding for extra info
      if (userCat === 'gas') {
        // Store signup time so gas tracker shows 30-sec taste preview
        localStorage.setItem('gratia_signup_time', Date.now().toString())
        router.push('/dashboard/gas')
      }
      else router.push(`/onboarding?prefill=${userCat}`)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const inp = (extra = {}) => ({
    width:'100%', padding:'13px 16px', background:'#f8f7fc',
    border:'1.5px solid rgba(0,0,0,.1)',
    borderRadius:14, fontSize:15, color:'#1a1a2e',
    outline:'none', fontFamily:"'DM Sans',sans-serif", ...extra,
  })

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',padding:24}}>
      <div style={{background:'#fff',borderRadius:26,padding:'36px 32px',maxWidth:420,width:'100%',boxShadow:'0 32px 80px rgba(0,0,0,.18)',fontFamily:"'DM Sans',system-ui,sans-serif",position:'relative',animation:'modalPop .35s cubic-bezier(.34,1.56,.64,1)'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,.06)',border:'none',cursor:'pointer',fontSize:14,color:'rgba(26,26,46,.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>

        {step === 'gate' && <>
          <div style={{display:'flex',justifyContent:'center',marginBottom:20}}><GCIcon size={52}/></div>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,letterSpacing:-.5,textAlign:'center',color:'#1a1a2e',marginBottom:8}}>Start your free trial</h2>
          <p style={{fontSize:14,color:'rgba(26,26,46,.55)',textAlign:'center',lineHeight:1.65,marginBottom:22}}>7 days full access — no credit card needed. $4.99/mo after trial.</p>
          <div style={{background:'#f8f7fc',borderRadius:14,padding:'14px 16px',marginBottom:22}}>
            {[{icon:'📍',text:'Real-time prices at nearby stations'},{icon:'🛣️',text:'Cheapest gas on any route you drive'},{icon:'🧾',text:'IRS mileage deduction calculator'},{icon:'🔔',text:'Price drop alerts via email'}].map((f,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'rgba(26,26,46,.75)',marginBottom:i<3?9:0}}>
                <span style={{fontSize:15}}>{f.icon}</span>{f.text}
              </div>
            ))}
          </div>
          <input type="email" placeholder="Your email address" value={email}
            onChange={e=>{setEmail(e.target.value);setError('')}}
            onKeyDown={e=>e.key==='Enter'&&handleContinue()} autoFocus
            style={{...inp(),marginBottom:error?6:10,border:`1.5px solid ${error?'#ff453a':'rgba(0,0,0,.1)'}`}}/>
          {error && <div style={{fontSize:12,color:'#ff453a',marginBottom:10}}>{error}</div>}
          <button onClick={handleContinue} style={{width:'100%',padding:14,background:email.trim()?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(255,59,48,.2)',color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,cursor:email.trim()?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif"}}>
            Continue — it's free →
          </button>
          <div style={{display:'flex',alignItems:'center',gap:10,margin:'14px 0',color:'rgba(26,26,46,.3)',fontSize:12}}>
            <div style={{flex:1,height:1,background:'rgba(0,0,0,.08)'}}/>or<div style={{flex:1,height:1,background:'rgba(0,0,0,.08)'}}/>
          </div>
          <div style={{textAlign:'center',fontSize:13,color:'rgba(26,26,46,.45)'}}>Already have an account?{' '}<Link href="/login" style={{color:'#ff3b30',fontWeight:600,textDecoration:'none'}} onClick={onClose}>Log in →</Link></div>
          <p style={{fontSize:11,color:'rgba(26,26,46,.3)',textAlign:'center',marginTop:14,lineHeight:1.6}}>No card needed · 7-day free trial · Cancel anytime · <a href="/privacy" style={{color:'rgba(26,26,46,.4)'}}>Privacy</a></p>
        </>}

        {step === 'type' && <>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:21,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',marginBottom:6}}>One quick question</h2>
          <p style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:20}}>We use this to show you the right tools.</p>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18}}>
            {USER_TYPES.map(t=>(
              <button key={t.id} onClick={()=>{setUserCat(t.id);setStep('details')}}
                style={{display:'flex',alignItems:'center',gap:14,padding:'13px 16px',background:'#f8f7fc',border:'1.5px solid rgba(0,0,0,.08)',borderRadius:14,cursor:'pointer',textAlign:'left',fontFamily:"'DM Sans',sans-serif"}}>
                <div style={{width:42,height:42,borderRadius:12,background:`${t.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0}}>{t.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:2}}>{t.label}</div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.45)'}}>{t.sub}</div>
                </div>
                <span style={{fontSize:16,color:'rgba(26,26,46,.2)'}}>›</span>
              </button>
            ))}
          </div>
          <button onClick={()=>setStep('gate')} style={{background:'none',border:'none',color:'rgba(26,26,46,.4)',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",padding:0}}>← Back</button>
        </>}

        {step === 'details' && <>
          <div style={{width:50,height:50,borderRadius:15,background:`linear-gradient(135deg,${selectedType?.color||'#ff3b30'},${selectedType?.color||'#ff3b30'}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:18}}>{selectedType?.icon||'⛽'}</div>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:21,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',marginBottom:4}}>Almost done</h2>
          <p style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:16}}>Creating account for <strong style={{color:'#1a1a2e'}}>{email}</strong></p>
          <div style={{background:'#f8f7fc',borderRadius:14,padding:'12px 14px',marginBottom:16,fontSize:12,color:'rgba(26,26,46,.6)',lineHeight:1.6}}>
            {userCat==='gas'       && '✓ Gas tracker opens immediately · 7-day free trial · $4.99/mo after'}
            {userCat==='driver'    && "✓ Full access for 7 days free · Gas tracker + deduction tools · $4.99/mo after"}
            {userCat==='freelancer'&& "✓ Full access for 7 days free · Deduction dashboard · $7.99/mo after"}
            {userCat==='business'  && "✓ Full access for 7 days free · All compliance modules · $14.99/mo after"}
          </div>

          {/* ── FIXED: autoComplete="off" stops browser filling email into promo field ── */}
          <div style={{marginBottom:14}}>
            <div style={{display:'flex',gap:8}}>
              <input
                type="text"
                placeholder="Promo code (optional)"
                value={promoCode}
                autoComplete="off"
                name="promo-code-field"
                onChange={e=>{setPromoCode(e.target.value.toUpperCase());setPromoValid(null)}}
                style={{flex:1,padding:'11px 14px',background:'#f8f7fc',border:`1.5px solid ${promoValid===true?'#30d158':promoValid===false?'#ff453a':'rgba(0,0,0,.1)'}`,borderRadius:12,fontSize:14,color:'#1a1a2e',outline:'none',fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:'uppercase'}}/>
              <button onClick={validatePromo} style={{padding:'11px 16px',background:'rgba(0,0,0,.06)',border:'none',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",color:'#1a1a2e',whiteSpace:'nowrap'}}>Apply</button>
            </div>
            {promoValid===true  && <div style={{fontSize:12,color:'#30d158',marginTop:6,fontWeight:600}}>✓ Code applied — {promoDays} days free!</div>}
            {promoValid===false && <div style={{fontSize:12,color:'#ff453a',marginTop:6}}>Invalid or expired code</div>}
          </div>

          <input type="password" placeholder="Create a password (8+ characters)" value={password}
            onChange={e=>{setPassword(e.target.value);setError('')}}
            onKeyDown={e=>e.key==='Enter'&&password.length>=8&&handleCreate()} autoFocus
            style={{...inp(),border:`1.5px solid ${error?'#ff453a':'rgba(0,0,0,.1)'}`,marginBottom:error?6:10}}/>
          {error && <div style={{fontSize:12,color:'#ff453a',marginBottom:10}}>{error}</div>}
          <button onClick={handleCreate} disabled={password.length<8||loading}
            style={{width:'100%',padding:14,background:password.length>=8&&!loading?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(255,59,48,.2)',color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,cursor:password.length>=8&&!loading?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif",marginBottom:12}}>
            {loading?'Creating your account...':userCat==='gas'?'Start Free Trial →':'Create account & continue →'}
          </button>
          <button onClick={()=>setStep('type')} style={{background:'none',border:'none',color:'rgba(26,26,46,.4)',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",padding:0}}>← Back</button>
          <p style={{fontSize:11,color:'rgba(26,26,46,.3)',textAlign:'center',marginTop:14,lineHeight:1.6}}>No card needed · Cancel anytime · <a href="/terms" style={{color:'#ff3b30'}}>Terms</a> & <a href="/privacy" style={{color:'#ff3b30'}}>Privacy</a></p>
        </>}
      </div>
    </div>
  )
}

// ── Gas Tracker Live Preview ──────────────────────────────────
function GasTrackerPreview() {
  const [activeStation, setActiveStation] = useState(0)
  const stations = [
    { name:'QuikTrip', price:3.04, dist:'0.4 mi', trend:'down',   color:'#30d158' },
    { name:'Shell',    price:3.09, dist:'0.7 mi', trend:'down',   color:'#30d158' },
    { name:'Circle K', price:3.15, dist:'1.1 mi', trend:'stable', color:'#ff9f0a' },
    { name:'BP',       price:3.21, dist:'1.4 mi', trend:'up',     color:'#ff453a' },
  ]
  useEffect(() => {
    const t = setInterval(() => setActiveStation(s => (s + 1) % stations.length), 1600)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{background:'rgba(0,0,0,.04)',border:'1px solid rgba(0,0,0,.08)',borderRadius:14,overflow:'hidden',marginBottom:10}}>
      <div style={{display:'flex',borderBottom:'1px solid rgba(0,0,0,.06)'}}>
        {[{label:'Best Price',val:'$3.04',color:'#ff3b30'},{label:'Deduction',val:'$182/mo',color:'#30d158'},{label:'Trend',val:'↓ Falling',color:'#25a244'}].map((k,i)=>(
          <div key={i} style={{flex:1,padding:'8px 10px',borderRight:i<2?'1px solid rgba(0,0,0,.06)':'none',textAlign:'center'}}>
            <div style={{fontSize:7,fontWeight:700,letterSpacing:1,color:'rgba(26,26,46,.35)',textTransform:'uppercase',marginBottom:2}}>{k.label}</div>
            <div style={{fontSize:14,fontWeight:800,color:k.color,letterSpacing:-.3}}>{k.val}</div>
          </div>
        ))}
      </div>
      {stations.map((st,i)=>{
        const isActive=i===activeStation
        const icon=st.trend==='down'?'↓':st.trend==='up'?'↑':'→'
        return (
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',borderBottom:i<stations.length-1?'1px solid rgba(0,0,0,.04)':'none',background:isActive?'rgba(255,59,48,.04)':'transparent',borderLeft:`2px solid ${isActive?'#ff3b30':'transparent'}`,transition:'all .35s ease'}}>
            <div style={{fontSize:9,fontWeight:700,color:i===0?'#30d158':'rgba(26,26,46,.25)',minWidth:12}}>{i===0?'★':`${i+1}`}</div>
            <div style={{flex:1,fontSize:12,fontWeight:600,color:'#1a1a2e'}}>{st.name}</div>
            <div style={{fontSize:9,color:'rgba(26,26,46,.35)'}}>{st.dist}</div>
            <div style={{fontSize:9,fontWeight:700,color:st.color,minWidth:12}}>{icon}</div>
            <div style={{fontSize:14,fontWeight:800,color:i===0?'#30d158':'#1a1a2e',letterSpacing:-.3}}>${st.price.toFixed(2)}</div>
          </div>
        )
      })}
      <div style={{padding:'6px 12px',display:'flex',alignItems:'center',gap:6,background:'rgba(255,59,48,.04)'}}>
        <div style={{width:5,height:5,borderRadius:'50%',background:'#ff3b30',animation:'lp 1.4s ease-in-out infinite'}}/>
        <span style={{fontSize:9,color:'rgba(26,26,46,.4)',fontWeight:600,letterSpacing:.5}}>LIVE · EIA.GOV · UPDATES HOURLY</span>
      </div>
    </div>
  )
}

function LandingPage() {
  const [showModal, setShowModal] = useState(false)
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--red:#ff3b30;--ash:#f0eff4;--ash-2:#e8e7ed;--ash-3:#d8d7de;--ink:#1a1a2e;--ink-2:rgba(26,26,46,0.6);--ink-3:rgba(26,26,46,0.35)}
        html{scroll-behavior:smooth}
        body{background:var(--ash);font-family:'DM Sans',system-ui,sans-serif;color:var(--ink);overflow-x:hidden}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E");pointer-events:none;z-index:0;opacity:0.4}
        .bg-mesh{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 70% 50% at 15% 10%,rgba(255,59,48,0.08) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 85% 80%,rgba(255,100,50,0.06) 0%,transparent 55%),linear-gradient(160deg,#f5f4f9 0%,#eceaf2 40%,#f2f0f7 100%)}
        .page{position:relative;z-index:1;min-height:100vh}
        @keyframes modalPop{from{opacity:0;transform:scale(.93) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes navSlide{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:0.3}}
        .navbar{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 10px;height:56px;background:rgba(255,255,255,0.72);backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);border:1px solid rgba(255,255,255,0.95);border-radius:22px;box-shadow:0 2px 8px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,1);animation:navSlide 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .nav-links{display:flex;align-items:center;gap:2px;position:absolute;left:50%;transform:translateX(-50%)}
        .nav-link{padding:7px 16px;font-size:13.5px;font-weight:500;color:var(--ink-2);text-decoration:none;border-radius:12px;transition:all 0.2s}
        .nav-link:hover{background:rgba(0,0,0,0.05);color:var(--ink)}
        .nav-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
        .btn-login{padding:8px 18px;font-size:13px;font-weight:600;color:var(--ink);background:transparent;border:1px solid var(--ash-3);border-radius:14px;cursor:pointer;text-decoration:none;font-family:'DM Sans',sans-serif}
        .btn-signup{padding:8px 18px;font-size:13px;font-weight:700;color:#fff;background:linear-gradient(135deg,#ff3b30,#ff6b35);border:none;border-radius:14px;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 2px 8px rgba(255,59,48,0.3);white-space:nowrap}
        .btn-signup:hover{transform:scale(1.04)}
        .hero{padding:160px 24px 100px;text-align:center;max-width:860px;margin:0 auto}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:100px;padding:6px 16px 6px 8px;font-size:12px;font-weight:600;color:var(--ink-2);margin-bottom:32px;animation:fadeUp 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.1s both}
        .hero-badge-dot{width:22px;height:22px;background:linear-gradient(135deg,#ff3b30,#ff6b35);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px}
        .hero h1{font-family:'Sora',sans-serif;font-size:clamp(52px,8vw,88px);font-weight:900;letter-spacing:-4px;line-height:0.95;color:var(--ink);margin-bottom:24px;animation:fadeUp 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s both}
        .hero h1 .accent{color:var(--red)}
        .hero h1 .light-word{color:var(--ink-3);font-weight:300}
        .hero-sub{font-size:18px;color:var(--ink-2);line-height:1.65;max-width:520px;margin:0 auto 48px;animation:fadeUp 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s both}
        .hero-actions{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;animation:fadeUp 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.4s both}
        .btn-primary{display:inline-flex;align-items:center;gap:8px;padding:16px 32px;background:linear-gradient(135deg,#ff3b30,#ff6b35);color:#fff;border-radius:18px;font-size:15px;font-weight:700;border:none;cursor:pointer;transition:all 0.25s;box-shadow:0 4px 16px rgba(255,59,48,0.35);font-family:'DM Sans',sans-serif}
        .btn-primary:hover{transform:scale(1.04) translateY(-1px)}
        .btn-secondary{display:inline-flex;align-items:center;gap:8px;padding:16px 28px;background:rgba(255,255,255,0.75);color:var(--ink);border-radius:18px;font-size:15px;font-weight:600;border:1px solid rgba(255,255,255,0.95);transition:all 0.2s;cursor:pointer;font-family:'DM Sans',sans-serif}
        .hero-trust{display:flex;align-items:center;justify-content:center;gap:28px;margin-top:52px;flex-wrap:wrap}
        .trust-item{font-size:11.5px;font-weight:600;color:var(--ink-3);letter-spacing:1.5px;text-transform:uppercase}
        .trust-dot{width:3px;height:3px;background:var(--ash-3);border-radius:50%}
        .stats-bar{max-width:900px;margin:0 auto 100px;padding:0 24px}
        .stats-inner{display:grid;grid-template-columns:repeat(4,1fr);background:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(40px);border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
        .stat-item{padding:28px 24px;text-align:center;position:relative}
        .stat-item::after{content:'';position:absolute;right:0;top:20%;height:60%;width:1px;background:var(--ash-3)}
        .stat-item:last-child::after{display:none}
        .stat-val{font-family:'Sora',sans-serif;font-size:32px;font-weight:800;letter-spacing:-1.5px;color:var(--ink);line-height:1;margin-bottom:6px}
        .stat-val span{color:var(--red)}
        .stat-lbl{font-size:12px;font-weight:500;color:var(--ink-3)}
        .section-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--red);margin-bottom:12px}
        .section-title{font-family:'Sora',sans-serif;font-size:clamp(32px,4vw,48px);font-weight:800;letter-spacing:-2px;line-height:1.1;color:var(--ink);margin-bottom:16px}
        .section-sub{font-size:16px;color:var(--ink-2);line-height:1.6;max-width:480px}
        .modules-section{padding:0 24px 100px;max-width:1100px;margin:0 auto}
        .modules-header{text-align:center;margin-bottom:56px}
        .modules-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        @media(max-width:860px){.modules-grid{grid-template-columns:1fr 1fr}.nav-links{display:none}.stats-inner{grid-template-columns:1fr 1fr}}
        @media(max-width:540px){.modules-grid{grid-template-columns:1fr}}
        .module-card{background:rgba(255,255,255,0.72);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(40px);border-radius:24px;padding:28px;position:relative;overflow:hidden;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1);cursor:pointer;display:block;color:inherit}
        .module-card:hover{transform:translateY(-4px) scale(1.01);box-shadow:0 8px 32px rgba(0,0,0,0.1)}
        .module-card.active{border-color:rgba(255,59,48,0.25)}
        .module-card.active::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,59,48,0.5),transparent)}
        .module-card.locked{opacity:0.75;cursor:default}
        .module-card.locked:hover{transform:none}
        .module-card.featured{grid-column:span 2;background:linear-gradient(135deg,rgba(255,59,48,0.08),rgba(255,255,255,0.72));border-color:rgba(255,59,48,0.2)}
        .card-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px}
        .card-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px}
        .card-status-live{display:flex;align-items:center;gap:5px;background:rgba(48,209,88,0.12);border:1px solid rgba(48,209,88,0.25);border-radius:100px;padding:4px 10px;font-size:10px;font-weight:700;color:#1a7a35;letter-spacing:0.5px}
        .live-dot{width:5px;height:5px;background:#30d158;border-radius:50%;animation:lp 1.4s ease-in-out infinite}
        .card-status-soon{display:flex;align-items:center;gap:5px;background:rgba(0,0,0,0.05);border:1px solid var(--ash-3);border-radius:100px;padding:4px 10px;font-size:10px;font-weight:600;color:var(--ink-3)}
        .card-title{font-family:'Sora',sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.5px;color:var(--ink);margin-bottom:8px}
        .card-desc{font-size:13.5px;color:var(--ink-2);line-height:1.55;margin-bottom:20px}
        .card-meta{font-size:12px;font-weight:600;color:var(--red)}
        .card-meta-grey{font-size:12px;font-weight:500;color:var(--ink-3)}
        .card-cta{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:linear-gradient(135deg,#ff3b30,#ff6b35);color:#fff;border-radius:12px;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;margin-top:4px;border:none;cursor:pointer}
        .notify-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:rgba(0,0,0,0.05);color:var(--ink-2);border-radius:12px;font-size:13px;font-weight:600;border:1px solid var(--ash-3);cursor:pointer;font-family:'DM Sans',sans-serif;margin-top:4px}
        .who-section{padding:0 24px 100px;max-width:1100px;margin:0 auto}
        .who-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:48px}
        .who-card{background:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:20px;padding:24px 20px;text-align:center;transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1)}
        .who-card:hover{transform:translateY(-3px);background:rgba(255,255,255,0.85)}
        .who-emoji{font-size:32px;margin-bottom:12px}
        .who-title{font-family:'Sora',sans-serif;font-size:15px;font-weight:700;color:var(--ink);margin-bottom:6px}
        .who-sub{font-size:12px;color:var(--ink-3);line-height:1.5}
        .cta-section{padding:0 24px 120px;max-width:700px;margin:0 auto;text-align:center}
        .cta-card{background:rgba(255,255,255,0.72);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(40px);border-radius:32px;padding:60px 48px;position:relative;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.08)}
        .cta-card::before{content:'';position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:300px;height:300px;background:radial-gradient(circle,rgba(255,59,48,0.08) 0%,transparent 70%);pointer-events:none}
        .cta-card h2{font-family:'Sora',sans-serif;font-size:40px;font-weight:800;letter-spacing:-2px;line-height:1.1;color:var(--ink);margin-bottom:14px}
        .cta-card h2 span{color:var(--red)}
        .cta-card p{font-size:16px;color:var(--ink-2);line-height:1.6;margin-bottom:36px}
        .footer{border-top:1px solid var(--ash-3);padding:32px 24px;max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
        .footer-links{display:flex;gap:24px;flex-wrap:wrap}
        .footer-link{font-size:12.5px;color:var(--ink-3);text-decoration:none;transition:color 0.2s}
        .footer-link:hover{color:var(--ink)}
        .footer-copy{font-size:12px;color:var(--ink-3)}
      `}</style>

      {showModal && <QuickSignupModal onClose={() => setShowModal(false)} />}
      <div className="bg-mesh" />
      <div className="page">
        <nav className="navbar">
          <a href="/" style={{textDecoration:'none'}}><GratiaLogo/></a>
          <div className="nav-links">
            <a href="#modules" className="nav-link">Modules</a>
            <a href="#who" className="nav-link">Who it's for</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#about" className="nav-link">About</a>
          </div>
          <div className="nav-actions">
            <Link href="/login" className="btn-login">Log in</Link>
            <button onClick={() => setShowModal(true)} className="btn-signup">Get Started →</button>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-badge">
            <div className="hero-badge-dot">⚡</div>
            Now in Early Access · First 20 members get 20 days free
          </div>
          <h1>Business<br/><span className="accent">intelligence</span><br/><span className="light-word">at your fingertips</span></h1>
          <p className="hero-sub">Real-time gas prices, regulatory updates, tariff tracking, and tax deductions — all in one platform built for gig workers, freelancers, and growing businesses.</p>
          <div className="hero-actions">
            <button onClick={() => setShowModal(true)} className="btn-primary">Start 7-Day Free Trial →</button>
            <button onClick={() => setShowModal(true)} className="btn-secondary">⛽ Try Gas Tracker</button>
          </div>
          <div style={{marginTop:14,fontSize:13,color:'var(--ink-3)'}}>No credit card needed · $4.99/mo after trial · Cancel anytime</div>
          <div className="hero-trust">
            <span className="trust-item">For Drivers</span><div className="trust-dot"/>
            <span className="trust-item">For Freelancers</span><div className="trust-dot"/>
            <span className="trust-item">For Restaurants</span><div className="trust-dot"/>
            <span className="trust-item">For Businesses</span>
          </div>
        </section>

        <div className="stats-bar">
          <div className="stats-inner">
            {[{val:"$8,736",suffix:"",label:"Avg annual deductions missed by drivers"},{val:"145",suffix:"x",label:"Average ROI for Business Pass users"},{val:"3,200+",suffix:"",label:"Regulatory updates tracked per month"},{val:"$4.99",suffix:"",label:"Per month after your free trial"}].map((s,i)=>(
              <div className="stat-item" key={i}>
                <div className="stat-val">{s.val}<span>{s.suffix}</span></div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <section className="modules-section" id="modules">
          <div className="modules-header">
            <div className="section-label">Platform Modules</div>
            <div className="section-title">Everything you need.<br/>Nothing you don't.</div>
            <p className="section-sub" style={{margin:"0 auto"}}>Each module is personalized to your type and connects to the others automatically.</p>
          </div>
          <div className="modules-grid">
            <div className="module-card featured active" style={{cursor:'default',gridColumn:'span 2'}}>
              <div className="card-top">
                <div className="card-icon" style={{background:"linear-gradient(135deg,#ff3b30,#ff6b35)"}}>⛽</div>
                <div className="card-status-live"><div className="live-dot"/>LIVE</div>
              </div>
              <div className="card-title">Gas Price Tracker</div>
              <div className="card-desc" style={{marginBottom:16}}>Real-time gas prices at stations near you. Compare grades, track trends, and calculate your IRS mileage deduction.</div>

              {/* ── Live Preview ── */}
              <GasTrackerPreview/>

              <br/>
              <span className="card-cta" onClick={() => setShowModal(true)} style={{cursor:'pointer'}}>Start Free Trial →</span>
            </div>
            {[
              {icon:"📋",color:"linear-gradient(135deg,#0a84ff,#30a0ff)",title:"Regulatory Updates",desc:"IRS changes, OSHA rules, labor laws filtered to your industry.",meta:"IRS · OSHA · DOL · FDA"},
              {icon:"🌐",color:"linear-gradient(135deg,#ff9f0a,#ffb340)",title:"Tariff Intelligence",desc:"Live import/export tariff rates. See how changes affect your costs.",meta:"China · Mexico · Canada · EU"},
              {icon:"🧾",color:"linear-gradient(135deg,#30d158,#4cd964)",title:"Deduction Teller",desc:"Enter monthly expenses — we find what's deductible and what you're missing.",meta:"Average user finds $5,760/yr"},
              {icon:"📊",color:"linear-gradient(135deg,#bf5af2,#da8fff)",title:"Assets & Liabilities",desc:"Track net worth and generate a bank-ready one-page balance sheet.",meta:"PDF export · Bank-ready"},
            ].map((m,i)=>(
              <div key={i} className="module-card locked">
                <div className="card-top">
                  <div className="card-icon" style={{background:m.color}}>{m.icon}</div>
                  <div className="card-status-soon">🔒 Coming Soon</div>
                </div>
                <div className="card-title">{m.title}</div>
                <div className="card-desc">{m.desc}</div>
                <div className="card-meta-grey">{m.meta}</div>
                <br/><button className="notify-btn">🔔 Notify Me</button>
              </div>
            ))}
          </div>
        </section>

        <section className="who-section" id="who">
          <div style={{textAlign:"center"}}>
            <div className="section-label">Who It's For</div>
            <div className="section-title">Built for everyone<br/>who works for themselves</div>
          </div>
          <div className="who-grid">
            {[
              {emoji:"🚗",title:"Rideshare & Delivery",sub:"Uber, Lyft, DoorDash\nInstacart, Amazon Flex"},
              {emoji:"💼",title:"Freelancers",sub:"Designers, developers\nconsultants, writers"},
              {emoji:"🍽️",title:"Restaurants & Cafes",sub:"Independent owners\ncaterers, food trucks"},
              {emoji:"🌿",title:"Cannabis & Dispensary",sub:"Retail, delivery\ncultivation operations"},
              {emoji:"🚛",title:"Trucking & Logistics",sub:"Owner-operators\nfleet managers"},
              {emoji:"🏗️",title:"Trades & Construction",sub:"GCs, subcontractors\nproperty managers"},
              {emoji:"🛒",title:"Retail & E-commerce",sub:"Shopify, Amazon\nboutique stores"},
              {emoji:"📦",title:"Importers & Exporters",sub:"Manufacturers\ndistributors, wholesalers"},
            ].map((w,i)=>(
              <div className="who-card" key={i}>
                <div className="who-emoji">{w.emoji}</div>
                <div className="who-title">{w.title}</div>
                <div className="who-sub" style={{whiteSpace:"pre-line"}}>{w.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-card">
            <div className="section-label">Get Started Today</div>
            <h2>Your intelligence<br/><span>starts here</span></h2>
            <p>Take 60 seconds to set up your profile. 7 days free — no card needed. $4.99/mo after trial, cancel anytime.</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={() => setShowModal(true)} className="btn-primary" style={{fontSize:16,padding:"16px 36px",border:'none'}}>Start Free Trial →</button>
              <Link href="/login" className="btn-secondary" style={{fontSize:16,padding:"16px 28px"}}>Log In</Link>
            </div>
            <div style={{marginTop:16,fontSize:12,color:"var(--ink-3)"}}>No credit card · 7-day free trial · $4.99/mo after · Cancel anytime</div>
          </div>
        </section>

        <footer className="footer">
          <GratiaLogo/>
          <div className="footer-links">
            <a href="/privacy" className="footer-link">Privacy Policy</a>
            <a href="/terms" className="footer-link">Terms of Service</a>
            <a href="/about" className="footer-link">About</a>
            <a href="/contact" className="footer-link">Contact</a>
          </div>
          <div className="footer-copy">© 2025 GratIA Core LLC. All rights reserved.</div>
        </footer>
      </div>
    </>
  )
}

export default function Home() {
  const [accessGranted, setAccessGranted] = useState(false)
  const [checked,       setChecked]       = useState(false)

  useEffect(() => {
    const hasAccess = localStorage.getItem('gratia_access') === 'true'
    setAccessGranted(hasAccess)
    setChecked(true)
  }, [])

  if (!checked) return null

  if (COMING_SOON_ENV && !accessGranted) {
    return <ComingSoonGate/>
  }

  return <LandingPage/>
}