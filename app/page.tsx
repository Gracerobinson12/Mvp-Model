'use client'
import React, { useState, useEffect, useRef } from 'react'
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
            Gratia Core is in private beta. Enter your access code to get in, or join the waitlist.
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
          © 2025 Gratia Core LLC · Business Intelligence Agency
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
  const [firstName,  setFirstName] = useState('')
  const [lastName,   setLastName]  = useState('')
  const [stateName,  setStateName] = useState('')
  const [bizName,    setBizName]   = useState('')
  const [loading,    setLoading]   = useState(false)
  const [error,      setError]     = useState('')
  const [promoCode,  setPromoCode] = useState('')
  const [promoValid, setPromoValid]= useState<boolean|null>(null)
  const [promoDays,  setPromoDays] = useState(7)

  const USER_TYPES = [
    {
      id:'driver',
      icon:'⛽',
      label:'Personal',
      sub:'Everyday drivers, commuters, anyone who wants to save at the pump',
      color:'#ff3b30',
      plans:'Core Pass · $4.99/mo',
    },
    {
      id:'freelancer',
      icon:'💼',
      label:'Self-Employed',
      sub:'Gig drivers, freelancers, contractors — gas + mileage + deductions',
      color:'#0a84ff',
      plans:'Pro Pass · Coming Soon',
    },
    {
      id:'business',
      icon:'🏢',
      label:'Business',
      sub:'Owners and operators who need compliance, tariffs, and team tools',
      color:'#30d158',
      plans:'Business Pass · Coming Soon',
    },
  ]
  const selectedType = USER_TYPES.find(t => t.id === userCat) || USER_TYPES[0]

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
      // Gas-only users get NO trial until they pay via Stripe
      // All other users get trial immediately (they go through onboarding → pricing)
      // All users start with no trial — they get 30s taste then subscribe for Core Pass
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId, email,
        first_name:    firstName.trim() || null,
        last_name:     lastName.trim() || null,
        full_name:     [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null,
        business_name: bizName.trim() || null,
        state:         stateName || null,
        user_type:     userCat,
        account_type:  userCat === 'business' ? 'business' : 'personal',
        plan:          'free',
        plan_status:   'taste',
        onboarded:     true,
        trial_ends_at: null,
        notify_plan:   userCat === 'freelancer' ? 'pro' : userCat === 'business' ? 'enterprise' : null,
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
      // All users go to gas tracker — it's the only live module
      // Store signup time for 30-sec taste preview
      localStorage.setItem('gratia_signup_time', Date.now().toString())
      router.push('/dashboard/gas')
    } catch (e: any) {
      const msg = e?.message || ''
      if (msg.includes('already registered') || msg.includes('already been registered') || e?.status === 422) {
        setError('An account with this email already exists. Please log in instead.')
      } else {
        setError(msg || 'Something went wrong. Please try again.')
      }
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
          <p style={{fontSize:14,color:'rgba(26,26,46,.55)',textAlign:'center',lineHeight:1.65,marginBottom:22}}>7-day free trial · $4.99/mo after trial · Card required · Cancel anytime</p>
          <div style={{background:'#f8f7fc',borderRadius:14,padding:'14px 16px',marginBottom:22}}>
            {[
              {icon:'📍',text:'Real-time gas prices at stations near you',live:true},
              {icon:'🛣️',text:'Route gas finder — cheapest on any trip',live:true},
              {icon:'🗺️',text:'USA gas price map across all 50 states',live:true},
              {icon:'💡',text:'Idea Vault — timestamp & seal your ideas',live:false},
            ].map((f,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'rgba(26,26,46,.75)',marginBottom:i<3?9:0}}>
                <span style={{fontSize:15}}>{f.icon}</span>
                <span style={{flex:1}}>{f.text}</span>
                {f.live
                  ? <span style={{fontSize:9,fontWeight:700,color:'#1a7a35',background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.2)',borderRadius:100,padding:'1px 7px',flexShrink:0}}>Live</span>
                  : <span style={{fontSize:9,fontWeight:700,color:'#8a5c00',background:'rgba(255,159,10,.08)',border:'1px solid rgba(255,159,10,.2)',borderRadius:100,padding:'1px 7px',flexShrink:0}}>Soon</span>
                }
              </div>
            ))}
          </div>
          <input type="email" placeholder="Your email address" value={email}
            onChange={e=>{setEmail(e.target.value);setError('')}}
            onKeyDown={e=>e.key==='Enter'&&handleContinue()} autoFocus
            style={{...inp(),marginBottom:error?6:10,border:`1.5px solid ${error?'#ff453a':'rgba(0,0,0,.1)'}`}}/>
          {error && <div style={{fontSize:12,color:'#ff453a',marginBottom:10}}>{error}</div>}
          <button onClick={handleContinue} style={{width:'100%',padding:14,background:email.trim()?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(255,59,48,.2)',color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,cursor:email.trim()?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif"}}>
            Continue →
          </button>
          <div style={{display:'flex',alignItems:'center',gap:10,margin:'14px 0',color:'rgba(26,26,46,.3)',fontSize:12}}>
            <div style={{flex:1,height:1,background:'rgba(0,0,0,.08)'}}/>or<div style={{flex:1,height:1,background:'rgba(0,0,0,.08)'}}/>
          </div>
          <div style={{textAlign:'center',fontSize:13,color:'rgba(26,26,46,.45)'}}>Already have an account?{' '}<Link href="/login" style={{color:'#ff3b30',fontWeight:600,textDecoration:'none'}} onClick={onClose}>Log in →</Link></div>
          
        </>}

        {step === 'type' && <>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:21,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',marginBottom:4}}>Which plan fits you?</h2>
          <p style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:16,lineHeight:1.5}}>Everyone starts with gas intelligence. Select your path — we'll notify you when your plan launches.</p>

          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>

            {/* Personal */}
            <div
              onClick={()=>setUserCat('driver')}
              style={{border:`1.5px solid ${userCat==='driver'?'#ff3b30':'rgba(0,0,0,.08)'}`,borderRadius:16,padding:'14px 16px',cursor:'pointer',background:userCat==='driver'?'rgba(255,59,48,.04)':'#f8f7fc',transition:'all .2s'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,59,48,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>⛽</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                    <span style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>Personal</span>
                    <span style={{fontSize:9,fontWeight:700,color:'#1a7a35',background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.2)',borderRadius:100,padding:'1px 7px'}}>Live Now</span>
                  </div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.5)',marginBottom:2}}>Everyday drivers and creators</div>
                  <div style={{fontSize:10,fontWeight:700,color:'#ff3b30'}}>Core Pass · $4.99/mo</div>
                </div>
                <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${userCat==='driver'?'#ff3b30':'rgba(0,0,0,.15)'}`,background:userCat==='driver'?'#ff3b30':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {userCat==='driver' && <div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                </div>
              </div>
              {/* Personal features */}
              {userCat==='driver' && (
                <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(0,0,0,.06)',display:'flex',gap:6,flexWrap:'wrap'}}>
                  {['⛽ Gas tracker','🗺️ USA price map','💡 Idea Vault soon'].map((f,i)=>(
                    <span key={i} style={{fontSize:10,background:'rgba(255,59,48,.07)',color:'#cc2018',padding:'2px 8px',borderRadius:100,fontWeight:600}}>{f}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Pro */}
            <div
              onClick={()=>setUserCat('freelancer')}
              style={{border:`1.5px solid ${userCat==='freelancer'?'#0a84ff':'rgba(0,0,0,.08)'}`,borderRadius:16,padding:'14px 16px',cursor:'pointer',background:userCat==='freelancer'?'rgba(10,132,255,.04)':'#f8f7fc',transition:'all .2s'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:42,height:42,borderRadius:12,background:'rgba(10,132,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>💼</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                    <span style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>Pro</span>
                    <span style={{fontSize:9,fontWeight:700,color:'rgba(26,26,46,.4)',background:'rgba(0,0,0,.05)',border:'1px solid rgba(0,0,0,.08)',borderRadius:100,padding:'1px 7px'}}>Coming Soon</span>
                  </div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.5)',marginBottom:2}}>Freelancers, gig workers, contractors</div>
                  <div style={{fontSize:10,fontWeight:700,color:'#0a84ff'}}>Pro Pass · $9.99/mo</div>
                </div>
                <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${userCat==='freelancer'?'#0a84ff':'rgba(0,0,0,.15)'}`,background:userCat==='freelancer'?'#0a84ff':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {userCat==='freelancer' && <div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                </div>
              </div>
              {/* Pro notify checkboxes */}
              {userCat==='freelancer' && (
                <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(0,0,0,.06)'}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:8}}>Notify me when these launch:</div>
                  {[
                    {id:'pro_deduct',  label:'Deduction Teller',       sub:'Full deduction tracking + PDF export'},
                    {id:'pro_barter',  label:'Barter & Trade Tracker',  sub:'Legally timestamp trade agreements'},
                    {id:'pro_alerts',  label:'Gas price drop alerts',   sub:'Email when prices fall near you'},
                  ].map((item)=>(
                    <div key={item.id} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:8,cursor:'pointer'}}
                      onClick={e=>{e.stopPropagation();setPromoCode(p=>p===item.id?'':item.id)}}>
                      <div style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${promoCode===item.id?'#0a84ff':'rgba(0,0,0,.15)'}`,background:promoCode===item.id?'#0a84ff':'transparent',flexShrink:0,marginTop:1,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}>
                        {promoCode===item.id && <span style={{color:'#fff',fontSize:10,fontWeight:900}}>✓</span>}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>{item.label}</div>
                        <div style={{fontSize:11,color:'rgba(26,26,46,.45)'}}>{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enterprise */}
            <div
              onClick={()=>setUserCat('business')}
              style={{border:`1.5px solid ${userCat==='business'?'#30d158':'rgba(0,0,0,.08)'}`,borderRadius:16,padding:'14px 16px',cursor:'pointer',background:userCat==='business'?'rgba(48,209,88,.04)':'#f8f7fc',transition:'all .2s'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:42,height:42,borderRadius:12,background:'rgba(48,209,88,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🏢</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                    <span style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>Enterprise</span>
                    <span style={{fontSize:9,fontWeight:700,color:'rgba(26,26,46,.4)',background:'rgba(0,0,0,.05)',border:'1px solid rgba(0,0,0,.08)',borderRadius:100,padding:'1px 7px'}}>Coming Soon</span>
                  </div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.5)',marginBottom:2}}>Business owners, operators, teams</div>
                  <div style={{fontSize:10,fontWeight:700,color:'#30d158'}}>Enterprise Pass · $19.99/mo</div>
                </div>
                <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${userCat==='business'?'#30d158':'rgba(0,0,0,.15)'}`,background:userCat==='business'?'#30d158':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {userCat==='business' && <div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                </div>
              </div>
              {/* Enterprise notify checkboxes */}
              {userCat==='business' && (
                <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(0,0,0,.06)'}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:8}}>Notify me when these launch:</div>
                  {[
                    {id:'ent_reg',     label:'Regulatory Updates',      sub:'IRS, OSHA, labor laws for your industry'},
                    {id:'ent_tariff',  label:'Tariff Intelligence',     sub:'Live import/export cost tracking'},
                    {id:'ent_market',  label:'Market Intelligence',     sub:'Predict margins, spot trends early'},
                    {id:'ent_barter',  label:'Barter & Trade Tracker',  sub:'Legally timestamp trade agreements'},
                    {id:'ent_assets',  label:'Assets & Liabilities',    sub:'Balance sheet + PDF export'},
                  ].map((item)=>(
                    <div key={item.id} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:8,cursor:'pointer'}}
                      onClick={e=>{e.stopPropagation();setPromoCode(p=>p===item.id?'':item.id)}}>
                      <div style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${promoCode===item.id?'#30d158':'rgba(0,0,0,.15)'}`,background:promoCode===item.id?'#30d158':'transparent',flexShrink:0,marginTop:1,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}>
                        {promoCode===item.id && <span style={{color:'#fff',fontSize:10,fontWeight:900}}>✓</span>}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>{item.label}</div>
                        <div style={{fontSize:11,color:'rgba(26,26,46,.45)'}}>{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Notify message for Pro/Enterprise */}
          {(userCat==='freelancer'||userCat==='business') && (
            <div style={{background:'rgba(255,159,10,.06)',border:'1px solid rgba(255,159,10,.2)',borderRadius:12,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#8a5c00',lineHeight:1.5}}>
              ✓ You'll start with <strong>Personal (Core Pass $4.99/mo)</strong> today and be the first notified when your plan launches — at a founding member rate.
            </div>
          )}

          <button
            onClick={()=>{ if(userCat) setStep('details') }}
            disabled={!userCat}
            style={{width:'100%',padding:13,background:userCat?`linear-gradient(135deg,${userCat==='driver'?'#ff3b30,#ff6b35':userCat==='freelancer'?'#0a84ff,#30a0ff':'#30d158,#34c759'})`:'rgba(0,0,0,.08)',color:userCat?'#fff':'rgba(26,26,46,.3)',border:'none',borderRadius:100,fontSize:14,fontWeight:700,cursor:userCat?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif",marginBottom:10,transition:'all .2s'}}>
            {!userCat ? 'Select a plan to continue'
              : userCat==='driver' ? 'Continue with Personal →'
              : userCat==='freelancer' ? 'Start with Personal + Notify Me for Pro →'
              : 'Start with Personal + Notify Me for Enterprise →'}
          </button>
          <button onClick={()=>setStep('gate')} style={{background:'none',border:'none',color:'rgba(26,26,46,.4)',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",padding:0}}>← Back</button>
        </>}

        {step === 'details' && <>
          <div style={{width:50,height:50,borderRadius:15,background:`linear-gradient(135deg,${selectedType?.color||'#ff3b30'},${selectedType?.color||'#ff3b30'}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:18}}>{selectedType?.icon||'⛽'}</div>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:21,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',marginBottom:4}}>Almost done</h2>
          <p style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:16}}>Creating account for <strong style={{color:'#1a1a2e'}}>{email}</strong></p>

          {/* Name fields */}
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <input type="text" placeholder="First name" value={firstName}
              onChange={e=>setFirstName(e.target.value)}
              style={{flex:1,padding:'11px 14px',background:'#f8f7fc',border:'1.5px solid rgba(0,0,0,.1)',borderRadius:12,fontSize:14,color:'#1a1a2e',outline:'none',fontFamily:"'DM Sans',sans-serif"}}/>
            <input type="text" placeholder="Last name" value={lastName}
              onChange={e=>setLastName(e.target.value)}
              style={{flex:1,padding:'11px 14px',background:'#f8f7fc',border:'1.5px solid rgba(0,0,0,.1)',borderRadius:12,fontSize:14,color:'#1a1a2e',outline:'none',fontFamily:"'DM Sans',sans-serif"}}/>
          </div>

          {/* Business name — only for Enterprise */}
          {userCat==='business' && (
            <input type="text" placeholder="Business name" value={bizName}
              onChange={e=>setBizName(e.target.value)}
              style={{width:'100%',padding:'11px 14px',background:'#f8f7fc',border:'1.5px solid rgba(0,0,0,.1)',borderRadius:12,fontSize:14,color:'#1a1a2e',outline:'none',fontFamily:"'DM Sans',sans-serif",marginBottom:10}}/>
          )}

          {/* State */}
          <select value={stateName} onChange={e=>setStateName(e.target.value)}
            style={{width:'100%',padding:'11px 14px',background:'#f8f7fc',border:'1.5px solid rgba(0,0,0,.1)',borderRadius:12,fontSize:14,color:stateName?'#1a1a2e':'rgba(26,26,46,.4)',outline:'none',fontFamily:"'DM Sans',sans-serif",marginBottom:10,appearance:'none'}}>
            <option value="">Select your state</option>
            {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s=>(
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div style={{background:'#f8f7fc',borderRadius:14,padding:'12px 14px',marginBottom:16,fontSize:12,color:'rgba(26,26,46,.6)',lineHeight:1.6}}>
            {'✓ Gas tracker opens immediately · 7-day free trial · Core Pass $4.99/mo after · Cancel anytime'}
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
          <p style={{fontSize:11,color:'rgba(26,26,46,.3)',textAlign:'center',marginTop:14,lineHeight:1.6}}>Card required after trial · Cancel anytime · <a href="/terms" style={{color:'#ff3b30'}}>Terms</a> & <a href="/privacy" style={{color:'#ff3b30'}}>Privacy</a></p>
        </>}
      </div>
    </div>
  )
}

// ── Gas Tracker Live Preview ──────────────────────────────────
function GasTrackerPreview() {
  const mapRef = useRef(null)
  const [hoveredState, setHoveredState] = useState(null)

  const stateInfo = {
    "Alabama":{"low":2.89,"high":3.98,"avg":3.12},
    "Alaska":{"low":4.21,"high":5.48,"avg":4.82},
    "Arizona":{"low":3.34,"high":4.12,"avg":3.71},
    "Arkansas":{"low":2.81,"high":3.28,"avg":2.99},
    "California":{"low":2.79,"high":5.89,"avg":4.94},
    "Colorado":{"low":3.21,"high":3.98,"avg":3.58},
    "Connecticut":{"low":3.62,"high":4.21,"avg":3.89},
    "Delaware":{"low":3.41,"high":3.82,"avg":3.61},
    "Florida":{"low":3.21,"high":3.89,"avg":3.51},
    "Georgia":{"low":2.98,"high":3.61,"avg":3.19},
    "Hawaii":{"low":4.52,"high":5.62,"avg":5.12},
    "Idaho":{"low":3.42,"high":3.98,"avg":3.68},
    "Illinois":{"low":3.58,"high":4.62,"avg":4.21},
    "Indiana":{"low":3.28,"high":3.72,"avg":3.48},
    "Iowa":{"low":3.11,"high":3.48,"avg":3.28},
    "Kansas":{"low":2.91,"high":3.31,"avg":3.08},
    "Kentucky":{"low":2.88,"high":3.32,"avg":3.09},
    "Louisiana":{"low":2.89,"high":3.52,"avg":3.14},
    "Maine":{"low":3.51,"high":3.98,"avg":3.71},
    "Maryland":{"low":3.42,"high":3.91,"avg":3.65},
    "Massachusetts":{"low":3.71,"high":4.48,"avg":4.02},
    "Michigan":{"low":3.41,"high":3.92,"avg":3.64},
    "Minnesota":{"low":3.18,"high":3.62,"avg":3.38},
    "Mississippi":{"low":2.82,"high":3.28,"avg":3.01},
    "Missouri":{"low":2.88,"high":3.24,"avg":3.04},
    "Montana":{"low":3.31,"high":3.82,"avg":3.54},
    "Nebraska":{"low":2.95,"high":3.38,"avg":3.14},
    "Nevada":{"low":3.62,"high":4.41,"avg":4.08},
    "New Hampshire":{"low":3.52,"high":3.98,"avg":3.72},
    "New Jersey":{"low":3.51,"high":3.98,"avg":3.72},
    "New Mexico":{"low":3.01,"high":3.58,"avg":3.28},
    "New York":{"low":3.82,"high":4.92,"avg":4.35},
    "North Carolina":{"low":3.08,"high":3.52,"avg":3.28},
    "North Dakota":{"low":3.02,"high":3.48,"avg":3.22},
    "Ohio":{"low":3.32,"high":3.89,"avg":3.58},
    "Oklahoma":{"low":2.81,"high":3.24,"avg":2.98},
    "Oregon":{"low":3.71,"high":4.52,"avg":4.08},
    "Pennsylvania":{"low":3.58,"high":4.12,"avg":3.82},
    "Rhode Island":{"low":3.61,"high":4.02,"avg":3.79},
    "South Carolina":{"low":2.92,"high":3.38,"avg":3.12},
    "South Dakota":{"low":3.01,"high":3.45,"avg":3.21},
    "Tennessee":{"low":2.88,"high":3.28,"avg":3.08},
    "Texas":{"low":2.79,"high":3.45,"avg":2.94},
    "Utah":{"low":3.48,"high":3.98,"avg":3.71},
    "Vermont":{"low":3.62,"high":4.08,"avg":3.82},
    "Virginia":{"low":3.18,"high":3.72,"avg":3.42},
    "Washington":{"low":3.89,"high":4.78,"avg":4.28},
    "West Virginia":{"low":3.21,"high":3.68,"avg":3.42},
    "Wisconsin":{"low":3.18,"high":3.62,"avg":3.38},
    "Wyoming":{"low":3.08,"high":3.62,"avg":3.31}
  }

  const fipsToName = {
    "01":"Alabama","02":"Alaska","04":"Arizona","05":"Arkansas","06":"California",
    "08":"Colorado","09":"Connecticut","10":"Delaware","12":"Florida","13":"Georgia",
    "15":"Hawaii","16":"Idaho","17":"Illinois","18":"Indiana","19":"Iowa",
    "20":"Kansas","21":"Kentucky","22":"Louisiana","23":"Maine","24":"Maryland",
    "25":"Massachusetts","26":"Michigan","27":"Minnesota","28":"Mississippi","29":"Missouri",
    "30":"Montana","31":"Nebraska","32":"Nevada","33":"New Hampshire","34":"New Jersey",
    "35":"New Mexico","36":"New York","37":"North Carolina","38":"North Dakota","39":"Ohio",
    "40":"Oklahoma","41":"Oregon","42":"Pennsylvania","44":"Rhode Island","45":"South Carolina",
    "46":"South Dakota","47":"Tennessee","48":"Texas","49":"Utah","50":"Vermont",
    "51":"Virginia","53":"Washington","54":"West Virginia","55":"Wisconsin","56":"Wyoming"
  }

  function highColor(h) {
    if (h < 3.50) return '#30d158'
    if (h < 4.00) return '#a8d96a'
    if (h < 4.50) return '#ff9f0a'
    if (h < 5.00) return '#ff6b35'
    return '#ff3b30'
  }

  useEffect(() => {
    if (!mapRef.current) return

    const loadMap = (d3, topojson) => {
      if (!mapRef.current) return
      mapRef.current.innerHTML = ''

      const W = mapRef.current.offsetWidth || 500
      const H = 180

      const svg = d3.select(mapRef.current)
        .append('svg')
        .attr('width', '100%')
        .attr('height', H)
        .attr('viewBox', `0 0 ${W} ${H}`)
        .style('display', 'block')

      const proj = d3.geoAlbersUsa()
        .scale(W * 1.28)
        .translate([W / 2, H / 2])

      const path = d3.geoPath().projection(proj)

      fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
        .then(r => r.json())
        .then(us => {
          const feats = topojson.feature(us, us.objects.states).features

          // Draw state fills
          svg.selectAll('path.state')
            .data(feats)
            .enter()
            .append('path')
            .attr('class', 'state')
            .attr('d', path)
            .attr('fill', d => {
              const id   = String(d.id).padStart(2,'0')
              const name = fipsToName[id]
              const data = stateInfo[name]
              return data ? highColor(data.high) : '#c8d8c0'
            })
            .attr('opacity', 0.8)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.6)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
              const id   = String(d.id).padStart(2,'0')
              const name = fipsToName[id]
              const data = stateInfo[name]
              if (!name || !data) return
              d3.select(this).attr('opacity', 1).attr('stroke-width', 1.5)
              setHoveredState({name, data, x: event.offsetX, y: event.offsetY})
            })
            .on('mousemove', function(event) {
              setHoveredState(s => s ? {...s, x: event.offsetX, y: event.offsetY} : s)
            })
            .on('mouseout', function() {
              d3.select(this).attr('opacity', 0.8).attr('stroke-width', 0.6)
              setHoveredState(null)
            })
        })
        .catch(() => {})
    }

    // Load D3 + TopoJSON
    const loadScript = (src, id) => new Promise(resolve => {
      if (document.getElementById(id)) { resolve(); return }
      const s = document.createElement('script')
      s.id = id; s.src = src
      s.onload = resolve
      document.head.appendChild(s)
    })

    Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js', 'preview-d3'),
      loadScript('https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js', 'preview-topo'),
    ]).then(() => loadMap((window as any).d3, (window as any).topojson))

    return () => { if (mapRef.current) mapRef.current.innerHTML = '' }
  }, [])



  const cheapest = Object.entries(stateInfo).sort((a,b) => a[1].avg - b[1].avg)[0]
  const priciest  = Object.entries(stateInfo).sort((a,b) => b[1].high - a[1].high)[0]

  return (
    <div style={{background:'rgba(0,0,0,.04)',border:'1px solid rgba(0,0,0,.08)',borderRadius:14,overflow:'hidden',marginBottom:10}}>

      {/* KPI row */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(0,0,0,.06)',background:'rgba(255,255,255,.5)'}}>
        {[
          {label:'Cheapest State', val:`TX $${cheapest[1].avg.toFixed(2)}`, color:'#30d158'},
          {label:'Most Expensive', val:`CA $${priciest[1].high.toFixed(2)}`, color:'#ff3b30'},
          {label:'Natl Trend',     val:'Rising', color:'#ff453a'},
        ].map((k,i)=>(
          <div key={i} style={{flex:1,padding:'8px 10px',borderRight:i<2?'1px solid rgba(0,0,0,.06)':'none',textAlign:'center'}}>
            <div style={{fontSize:7,fontWeight:700,letterSpacing:1,color:'rgba(26,26,46,.35)',textTransform:'uppercase',marginBottom:2}}>{k.label}</div>
            <div style={{fontSize:12,fontWeight:800,color:k.color,letterSpacing:-.3}}>{i===2?'↑ ':''}{k.val}</div>
          </div>
        ))}
      </div>

      {/* Map container */}
      <div style={{position:'relative',height:180,overflow:'hidden',background:'#e8f2f8'}}>
        <div ref={mapRef} style={{width:'100%',height:'100%'}}/>

        {/* Hover tooltip */}
        {hoveredState && (
          <div style={{
            position:'absolute',
            left: Math.min(hoveredState.x, 280),
            top:  Math.max(hoveredState.y - 80, 4),
            background:'rgba(26,26,46,.95)',
            color:'#fff',
            borderRadius:10,
            padding:'8px 12px',
            pointerEvents:'none',
            zIndex:30,
            whiteSpace:'nowrap',
            boxShadow:'0 4px 16px rgba(0,0,0,.25)',
          }}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:1,color:'rgba(255,255,255,.5)',textTransform:'uppercase',marginBottom:3}}>
              {hoveredState.name} · Highest Pump
            </div>
            <div style={{fontSize:22,fontWeight:900,letterSpacing:-1,color:'#ff3b30',lineHeight:1,marginBottom:4}}>
              ${hoveredState.data.high.toFixed(2)}
            </div>
            <div style={{display:'flex',gap:10}}>
              <span style={{fontSize:10,color:'#30d158',fontWeight:700}}>Low ${hoveredState.data.low.toFixed(2)}</span>
              <span style={{fontSize:10,color:'rgba(255,255,255,.35)'}}>·</span>
              <span style={{fontSize:10,color:'rgba(255,255,255,.6)',fontWeight:600}}>Avg ${hoveredState.data.avg.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{position:'absolute',bottom:6,left:8,display:'flex',flexDirection:'column',gap:2}}>
          {[
            {color:'#30d158',label:'Under $3.50'},
            {color:'#ff9f0a',label:'$4.00–$4.50'},
            {color:'#ff3b30',label:'Over $5.00'},
          ].map((l,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:4}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:l.color,border:'1px solid rgba(255,255,255,.7)',flexShrink:0}}/>
              <span style={{fontSize:8,fontWeight:600,color:'rgba(26,26,46,.7)',background:'rgba(255,255,255,.7)',padding:'1px 5px',borderRadius:3}}>{l.label}</span>
            </div>
          ))}
        </div>


      </div>

      {/* Live bar */}
      <div style={{padding:'6px 12px',display:'flex',alignItems:'center',gap:6,background:'rgba(255,59,48,.04)'}}>
        <div style={{width:5,height:5,borderRadius:'50%',background:'#ff3b30',animation:'lp 1.4s ease-in-out infinite'}}/>
        <span style={{fontSize:9,color:'rgba(26,26,46,.4)',fontWeight:600,letterSpacing:.5}}>EIA.GOV · WEEKLY AVERAGES · HOVER STATE FOR HIGHEST PRICE</span>
      </div>
    </div>
  )
}


function FoundingPopup({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const CODE = 'FOUNDING100'

  const copy = () => {
    navigator.clipboard?.writeText(CODE).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:9990,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',padding:'0 16px 24px'}}>
      <div style={{background:'rgba(255,255,255,.97)',backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',borderRadius:'28px 28px 20px 20px',padding:'22px 24px 24px',maxWidth:440,width:'100%',boxShadow:'0 -8px 40px rgba(0,0,0,.15)',animation:'slideUpPopup .4s cubic-bezier(.34,1.56,.64,1) both',fontFamily:"'DM Sans',system-ui,sans-serif",position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,width:28,height:28,borderRadius:'50%',background:'rgba(0,0,0,.06)',border:'none',cursor:'pointer',fontSize:12,color:'rgba(26,26,46,.4)',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>

        {/* Handle */}
        <div style={{width:36,height:4,borderRadius:2,background:'rgba(0,0,0,.1)',margin:'0 auto 18px'}}/>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
          <div style={{width:48,height:48,borderRadius:15,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,boxShadow:'0 4px 16px rgba(255,59,48,.35)'}}>⛽</div>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:3}}>Founding Member Offer</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e',lineHeight:1.1}}>$4.99/mo for your<br/>first 6 months</div>
          </div>
        </div>

        <div style={{fontSize:13,color:'rgba(26,26,46,.55)',lineHeight:1.65,marginBottom:4}}>
          Core Pass includes real-time gas prices, route finder, and trip mode. Use this code at signup — your rate is locked for 6 months.
        </div>

        {/* Code box */}
        <div
          onClick={copy}
          style={{background:copied?'rgba(48,209,88,.08)':'rgba(255,59,48,.05)',border:`1.5px dashed ${copied?'rgba(48,209,88,.4)':'rgba(255,59,48,.35)'}`,borderRadius:16,padding:'14px',textAlign:'center',cursor:'pointer',transition:'all .2s',margin:'14px 0'}}>
          <div style={{fontFamily:'monospace',fontSize:24,fontWeight:700,color:copied?'#30d158':'#ff3b30',letterSpacing:5}}>{CODE}</div>
          <div style={{fontSize:11,color:copied?'#30d158':'rgba(26,26,46,.4)',marginTop:4,fontWeight:copied?700:400}}>
            {copied ? '✓ Copied to clipboard!' : 'Tap to copy'}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{width:'100%',padding:14,borderRadius:100,border:'none',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(255,59,48,.35)',fontFamily:"'DM Sans',sans-serif",marginBottom:10}}>
          Start Free Trial → Apply Code at Signup
        </button>
        <button
          onClick={onClose}
          style={{width:'100%',padding:11,borderRadius:100,border:'0.5px solid rgba(0,0,0,.1)',background:'transparent',color:'rgba(26,26,46,.45)',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
          No thanks
        </button>
      </div>
    </div>
  )
}

function LandingPage() {
  const [showModal,  setShowModal]  = useState(false)
  const [showPopup,  setShowPopup]  = useState(false)

  useEffect(() => {
    // Show founding popup after 3 seconds, once per session
    const seen = sessionStorage.getItem('gc_popup_seen')
    if (!seen) {
      const t = setTimeout(() => {
        setShowPopup(true)
        sessionStorage.setItem('gc_popup_seen', '1')
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [])
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
        @keyframes slideUpPopup{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
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
        .module-card.locked{opacity:0.85;cursor:default;position:relative;overflow:hidden}
        .module-card.locked:hover{transform:none}
        .module-card.locked .locked-overlay{position:absolute;inset:0;background:rgba(240,239,244,0);display:flex;align-items:center;justify-content:center;opacity:0;transition:all .3s ease;border-radius:24px;backdrop-filter:blur(0px)}
        .module-card.locked:hover .locked-overlay{background:rgba(240,239,244,0.92);opacity:1;backdrop-filter:blur(8px)}
        .locked-overlay-text{font-family:'Sora',sans-serif;font-size:15px;font-weight:800;color:rgba(26,26,46,.5);letter-spacing:2px;text-transform:uppercase}
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
        .who-card{background:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:20px;padding:24px 20px;text-align:center;transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);position:relative;overflow:visible}
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
          <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}>
              <GCIcon size={34}/>
              <div style={{display:'flex',flexDirection:'column',lineHeight:1}}>
                <span style={{fontFamily:"'Arial Black',Arial,sans-serif",fontSize:15,fontWeight:900,letterSpacing:-0.5,color:'#1a1a2e'}}>Gratia Core</span>
                <span style={{fontSize:8,fontWeight:600,letterSpacing:2.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>Business Intelligence</span>
              </div>
            </a>
          <div className="nav-links">
            <a href="#modules" className="nav-link">Modules</a>
            <a href="#who" className="nav-link">Who it's for</a>
            <Link href="/pricing" className="nav-link">View Plans</Link>
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
            <Link href="/pricing" className="btn-secondary">View Plans</Link>
          </div>
          <div style={{marginTop:14,fontSize:13,color:'var(--ink-3)'}}>Card required after trial · $4.99/mo · Cancel anytime</div>
          <div className="hero-trust">
            <span className="trust-item">For Drivers</span><div className="trust-dot"/>
            <span className="trust-item">For Freelancers</span><div className="trust-dot"/>
            <span className="trust-item">For Restaurants</span><div className="trust-dot"/>
            <span className="trust-item">For Businesses</span>
          </div>
        </section>

        <div className="stats-bar">
          <div className="stats-inner">
            {[{val:"59M+",suffix:"",label:"Gig workers in the US who need this"},{val:"$0.70",suffix:"/mi",label:"IRS mileage rate — money you're leaving behind"},{val:"$3.00+",suffix:"",label:"Per gallon difference between TX and CA"},{val:"$5,760",suffix:"",label:"Avg deductions freelancers miss every year"}].map((s,i)=>(
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
            <p className="section-sub" style={{margin:"0 auto"}}>Start with gas intelligence today. More modules unlocking soon.</p>
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
              {icon:"💡",color:"linear-gradient(135deg,#ffd60a,#ff9f0a)",title:"Idea Vault",desc:"Timestamp and seal your ideas with a PDF receipt. Your proof of concept — on record forever.",meta:"Timestamped · PDF receipt · Blockchain anchored"},
            ].map((m,i)=>(
              <div key={i} className="module-card locked">
                {/* Blurred content — no details revealed */}
                <div style={{filter:'blur(6px)',userSelect:'none',pointerEvents:'none',opacity:0.4}}>
                  <div className="card-top">
                    <div className="card-icon" style={{background:m.color}}>{m.icon}</div>
                    <div className="card-status-soon">· · ·</div>
                  </div>
                  <div className="card-title" style={{color:'rgba(26,26,46,.15)',letterSpacing:8}}>{'█'.repeat(8)}</div>
                  <div style={{height:10,background:'rgba(0,0,0,.06)',borderRadius:6,marginBottom:8,width:'85%'}}/>
                  <div style={{height:10,background:'rgba(0,0,0,.06)',borderRadius:6,marginBottom:8,width:'65%'}}/>
                  <div style={{height:10,background:'rgba(0,0,0,.06)',borderRadius:6,width:'75%'}}/>
                </div>
                {/* Hover overlay — just "Coming Soon" */}
                <div className="locked-overlay">
                  <div className="locked-overlay-text">Coming Soon</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="who-section" id="who">
          <div style={{textAlign:"center"}}>
            <div className="section-label">Who It's For</div>
            <div className="section-title">Built for everyone<br/>who drives, works, or owns</div>
          </div>
          <div className="who-grid">
            {[
              {emoji:"⛽",title:"Everyday Drivers",sub:"Anyone who drives\nand wants to save at the pump",highlight:true},
              {emoji:"🚗",title:"Rideshare & Delivery",sub:"Uber, Lyft, DoorDash\nInstacart, Amazon Flex"},
              {emoji:"💼",title:"Freelancers",sub:"Designers, developers\nconsultants, writers"},
              {emoji:"🍽️",title:"Restaurants & Cafes",sub:"Independent owners\ncaterers, food trucks"},
              {emoji:"🌿",title:"Cannabis & Dispensary",sub:"Retail, delivery\ncultivation operations"},
              {emoji:"🚛",title:"Trucking & Logistics",sub:"Owner-operators\nfleet managers"},
              {emoji:"🏗️",title:"Trades & Construction",sub:"GCs, subcontractors\nproperty managers"},
              {emoji:"🛒",title:"Retail & E-commerce",sub:"Shopify, Amazon\nboutique stores"},
              {emoji:"📦",title:"Importers & Exporters",sub:"Manufacturers\ndistributors, wholesalers"},
            ].map((w,i)=>(
              <div className="who-card" key={i} style={w.highlight?{border:'1.5px solid rgba(255,59,48,.3)',background:'linear-gradient(135deg,rgba(255,59,48,.06),rgba(255,255,255,.72))'}:{}}>
                {w.highlight && <div style={{position:'absolute',top:-10,left:16,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',fontSize:9,fontWeight:700,padding:'3px 10px',borderRadius:100,letterSpacing:1}}>START HERE</div>}
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
            <p>Start with gas intelligence. 7-day free trial. $4.99/mo after trial. Cancel anytime.</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={() => setShowModal(true)} className="btn-primary" style={{fontSize:16,padding:"16px 36px",border:'none'}}>Start Free Trial →</button>
              <Link href="/login" className="btn-secondary" style={{fontSize:16,padding:"16px 28px"}}>Log In</Link>
            </div>
            <div style={{marginTop:16,fontSize:12,color:"var(--ink-3)"}}>No credit card · 7-day free trial · $4.99/mo after · Cancel anytime</div>
          </div>
        </section>

        <footer className="footer">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <GCIcon size={30}/>
            <span style={{fontFamily:"'Arial Black',Arial,sans-serif",fontSize:14,fontWeight:900,letterSpacing:-0.5,color:'#1a1a2e'}}>Gratia Core</span>
          </div>
          <div className="footer-links">
            <a href="/privacy" className="footer-link">Privacy</a>
            <a href="/terms" className="footer-link">Terms</a>
            <a href="/about" className="footer-link">About</a>
            <a href="/contact" className="footer-link">Contact</a>
          </div>
          <div className="footer-copy">© 2025 Gratia Core LLC. All rights reserved.</div>
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