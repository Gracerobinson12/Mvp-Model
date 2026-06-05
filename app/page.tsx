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
    if (localStorage.getItem('gratia_access') === 'true') { setShow(false) } else { setShow(true) }
  }, [])

  const handleUnlock = () => {
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      setLoading(true)
      localStorage.setItem('gratia_access', 'true')
      window.location.reload()
    } else { setError('Invalid access code. Try again.'); setCode('') }
  }

  const handleWaitlist = async () => {
    if (!email.trim() || !email.includes('@')) return
    try { await supabase.from('waitlist').insert({ email: email.trim(), module: 'launch' }) } catch {}
    setJoined(true); setEmail('')
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
          <div style={{fontSize:11,fontWeight:600,letterSpacing:4,color:'rgba(255,255,255,.35)',textTransform:'uppercase',marginTop:8}}>Business Intelligence Agency</div>
        </div>
        <div style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:28,padding:'44px 40px',maxWidth:460,width:'100%',backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',boxShadow:'0 32px 80px rgba(0,0,0,.4)',animation:'fadeUp .8s ease .2s both',textAlign:'center'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,59,48,.12)',border:'1px solid rgba(255,59,48,.25)',borderRadius:100,padding:'6px 16px',fontSize:11,fontWeight:700,letterSpacing:2,color:'#ff6b5b',textTransform:'uppercase',marginBottom:24}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#ff3b30',animation:'pulse 1.5s ease infinite'}}/>Private Beta
          </div>
          <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:36,fontWeight:900,letterSpacing:-1.5,lineHeight:1.1,color:'white',marginBottom:12}}>Something big<br/>is coming</h1>
          <p style={{fontSize:15,color:'rgba(255,255,255,.5)',lineHeight:1.65,marginBottom:36,maxWidth:340,margin:'0 auto 36px'}}>Gratia Core is in private beta. Enter your access code to get in, or join the waitlist.</p>
          <div style={{marginBottom:12}}>
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <input type="text" placeholder="Enter access code" value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setError('')}} onKeyDown={e=>e.key==='Enter'&&handleUnlock()} autoFocus style={{flex:1,padding:'13px 16px',background:'rgba(255,255,255,.07)',border:'1.5px solid rgba(255,255,255,.12)',borderRadius:14,fontSize:15,color:'white',fontFamily:"'DM Sans',sans-serif",letterSpacing:3,textTransform:'uppercase'}}/>
              <button onClick={handleUnlock} style={{padding:'13px 20px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:14,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>{loading ? '...' : 'Unlock →'}</button>
            </div>
            {error && <div style={{fontSize:12,color:'#ff6b5b',textAlign:'left',marginTop:4}}>{error}</div>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,margin:'24px 0',color:'rgba(255,255,255,.2)',fontSize:12}}>
            <div style={{flex:1,height:1,background:'rgba(255,255,255,.1)'}}/>or join the waitlist<div style={{flex:1,height:1,background:'rgba(255,255,255,.1)'}}/>
          </div>
          {!joined ? (
            <div style={{display:'flex',gap:8}}>
              <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleWaitlist()} style={{flex:1,padding:'13px 16px',background:'rgba(255,255,255,.07)',border:'1.5px solid rgba(255,255,255,.12)',borderRadius:14,fontSize:15,color:'white',fontFamily:"'DM Sans',sans-serif"}}/>
              <button onClick={handleWaitlist} style={{padding:'13px 20px',background:'rgba(255,255,255,.1)',color:'white',border:'1px solid rgba(255,255,255,.15)',borderRadius:14,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>Notify Me</button>
            </div>
          ) : (
            <div style={{padding:'14px',background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.25)',borderRadius:14,fontSize:14,color:'#30d158',fontWeight:600}}>✓ You're on the list — we'll email you when we launch!</div>
          )}
          <p style={{fontSize:11,color:'rgba(255,255,255,.2)',marginTop:20,lineHeight:1.6}}>Have an access code? You'll get full access instantly.<br/>No credit card needed to join the waitlist.</p>
        </div>
        <div style={{display:'flex',gap:16,marginTop:48,flexWrap:'wrap',justifyContent:'center',animation:'fadeUp .8s ease .4s both'}}>
          {[{icon:'⛽',label:'Gas Intelligence'},{icon:'⚡',label:'EV Intelligence'},{icon:'💡',label:'Ideas Vault'},{icon:'🤝',label:'Barter & Trade'},{icon:'📋',label:'Regulatory'}].map(m=>(
            <div key={m.label} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:100,padding:'8px 16px',fontSize:12,fontWeight:500,color:'rgba(255,255,255,.4)'}}>
              <span style={{fontSize:14}}>{m.icon}</span>{m.label}
            </div>
          ))}
        </div>
        <div style={{marginTop:32,fontSize:12,color:'rgba(255,255,255,.2)',textAlign:'center'}}>© 2026 Gratia Core Enterprise LLC · Business Intelligence Agency</div>
      </div>
    </>
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
    { id:'driver',     icon:'⛽', label:'Core',       sub:'Full gas intelligence + route finder + EV Intelligence', color:'#ff3b30', plans:'Core Pass · $9.99/mo' },
    { id:'freelancer', icon:'💼', label:'Pro',         sub:'Gas + Ideas Vault + Barter & Trade for freelancers',     color:'#0a84ff', plans:'Pro Pass · $19.99/mo' },
    { id:'business',   icon:'🏢', label:'Enterprise',  sub:'Full business intelligence suite for operators',          color:'#30d158', plans:'Enterprise Pass · $79.99/mo' },
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
      const trialDays = promoValid ? promoDays : 7
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
      await fetch('/api/send-welcome', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, userType: userCat, trialDays }) }).catch(()=>{})
      localStorage.setItem('gratia_signup_time', Date.now().toString())
      router.push('/dashboard/gas')
    } catch (e: any) {
      const msg = e?.message || ''
      if (msg.includes('already registered') || msg.includes('already been registered') || e?.status === 422) {
        setError('An account with this email already exists. Please log in instead.')
      } else { setError(msg || 'Something went wrong. Please try again.') }
      setLoading(false)
    }
  }

  const inp = (extra = {}) => ({ width:'100%', padding:'13px 16px', background:'#f8f7fc', border:'1.5px solid rgba(0,0,0,.1)', borderRadius:14, fontSize:15, color:'#1a1a2e', outline:'none', fontFamily:"'DM Sans',sans-serif", ...extra })

  const PLAN_COLORS = { driver:'#ff3b30,#ff6b35', freelancer:'#0a84ff,#30a0ff', business:'#30d158,#34c759' }

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',padding:24}}>
      <div style={{background:'#fff',borderRadius:26,padding:'36px 32px',maxWidth:420,width:'100%',boxShadow:'0 32px 80px rgba(0,0,0,.18)',fontFamily:"'DM Sans',system-ui,sans-serif",position:'relative',animation:'modalPop .35s cubic-bezier(.34,1.56,.64,1)'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,.06)',border:'none',cursor:'pointer',fontSize:14,color:'rgba(26,26,46,.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>

        {step === 'gate' && <>
          <div style={{display:'flex',justifyContent:'center',marginBottom:20}}><GCIcon size={52}/></div>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,letterSpacing:-.5,textAlign:'center',color:'#1a1a2e',marginBottom:8}}>Start your free trial</h2>
          <p style={{fontSize:14,color:'rgba(26,26,46,.55)',textAlign:'center',lineHeight:1.65,marginBottom:22}}>Core $9.99/mo · 7-day free trial · Cancel anytime</p>
          <div style={{background:'#f8f7fc',borderRadius:14,padding:'14px 16px',marginBottom:22}}>
            {[
              {icon:'⛽',text:'Real-time gas prices at stations near you',live:true},
              {icon:'⚡',text:'EV charger locations near you',live:true},
              {icon:'🛣️',text:'Route gas finder — cheapest on any trip',live:true},
              {icon:'💡',text:'Ideas Vault — timestamp & seal your ideas',live:true},
            ].map((f,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'rgba(26,26,46,.75)',marginBottom:i<3?9:0}}>
                <span style={{fontSize:15}}>{f.icon}</span>
                <span style={{flex:1}}>{f.text}</span>
                <span style={{fontSize:9,fontWeight:700,color:'#1a7a35',background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.2)',borderRadius:100,padding:'1px 7px',flexShrink:0}}>Live</span>
              </div>
            ))}
          </div>
          <input type="email" placeholder="Your email address" value={email} onChange={e=>{setEmail(e.target.value);setError('')}} onKeyDown={e=>e.key==='Enter'&&handleContinue()} autoFocus style={{...inp(),marginBottom:error?6:10,border:`1.5px solid ${error?'#ff453a':'rgba(0,0,0,.1)'}`}}/>
          {error && <div style={{fontSize:12,color:'#ff453a',marginBottom:10}}>{error}</div>}
          <button onClick={handleContinue} style={{width:'100%',padding:14,background:email.trim()?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(255,59,48,.2)',color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,cursor:email.trim()?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif"}}>Continue →</button>
          <div style={{display:'flex',alignItems:'center',gap:10,margin:'14px 0',color:'rgba(26,26,46,.3)',fontSize:12}}>
            <div style={{flex:1,height:1,background:'rgba(0,0,0,.08)'}}/>or<div style={{flex:1,height:1,background:'rgba(0,0,0,.08)'}}/>
          </div>
          <div style={{textAlign:'center',fontSize:13,color:'rgba(26,26,46,.45)'}}>Already have an account?{' '}<Link href="/login" style={{color:'#ff3b30',fontWeight:600,textDecoration:'none'}} onClick={onClose}>Log in →</Link></div>
        </>}

        {step === 'type' && <>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:21,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',marginBottom:4}}>Which plan fits you?</h2>
          <p style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:16,lineHeight:1.5}}>Choose your plan — all start with a 7-day free trial.</p>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>

            {/* Core */}
            <div onClick={()=>setUserCat('driver')} style={{border:`1.5px solid ${userCat==='driver'?'#ff3b30':'rgba(0,0,0,.08)'}`,borderRadius:16,padding:'14px 16px',cursor:'pointer',background:userCat==='driver'?'rgba(255,59,48,.04)':'#f8f7fc',transition:'all .2s'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,59,48,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>⛽</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                    <span style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>Core</span>
                    <span style={{fontSize:9,fontWeight:700,color:'#1a7a35',background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.2)',borderRadius:100,padding:'1px 7px'}}>Live Now</span>
                  </div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.5)',marginBottom:2}}>Full gas + EV intelligence for everyday drivers</div>
                  <div style={{fontSize:10,fontWeight:700,color:'#ff3b30'}}>Core Pass · $9.99/mo · FOUNDING100 = $4.99 for 6 months</div>
                </div>
                <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${userCat==='driver'?'#ff3b30':'rgba(0,0,0,.15)'}`,background:userCat==='driver'?'#ff3b30':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {userCat==='driver' && <div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                </div>
              </div>
              {userCat==='driver' && (
                <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(0,0,0,.06)',display:'flex',gap:6,flexWrap:'wrap'}}>
                  {['⛽ Gas Intelligence','⚡ EV Intelligence','🛣️ Route finder'].map((f,i)=>(
                    <span key={i} style={{fontSize:10,background:'rgba(255,59,48,.07)',color:'#cc2018',padding:'2px 8px',borderRadius:100,fontWeight:600}}>{f}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Pro */}
            <div onClick={()=>setUserCat('freelancer')} style={{border:`1.5px solid ${userCat==='freelancer'?'#0a84ff':'rgba(0,0,0,.08)'}`,borderRadius:16,padding:'14px 16px',cursor:'pointer',background:userCat==='freelancer'?'rgba(10,132,255,.04)':'#f8f7fc',transition:'all .2s'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:42,height:42,borderRadius:12,background:'rgba(10,132,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>💼</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                    <span style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>Pro</span>
                    <span style={{fontSize:9,fontWeight:700,color:'#1a7a35',background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.2)',borderRadius:100,padding:'1px 7px'}}>Live Now</span>
                  </div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.5)',marginBottom:2}}>Core + Ideas Vault + Barter & Trade</div>
                  <div style={{fontSize:10,fontWeight:700,color:'#0a84ff'}}>Pro Pass · $19.99/mo</div>
                </div>
                <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${userCat==='freelancer'?'#0a84ff':'rgba(0,0,0,.15)'}`,background:userCat==='freelancer'?'#0a84ff':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {userCat==='freelancer' && <div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                </div>
              </div>
              {userCat==='freelancer' && (
                <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(0,0,0,.06)',display:'flex',gap:6,flexWrap:'wrap'}}>
                  {['Everything in Core','💡 Ideas Vault','🤝 Barter & Trade'].map((f,i)=>(
                    <span key={i} style={{fontSize:10,background:'rgba(10,132,255,.07)',color:'#0055cc',padding:'2px 8px',borderRadius:100,fontWeight:600}}>{f}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Enterprise */}
            <div onClick={()=>setUserCat('business')} style={{border:`1.5px solid ${userCat==='business'?'#30d158':'rgba(0,0,0,.08)'}`,borderRadius:16,padding:'14px 16px',cursor:'pointer',background:userCat==='business'?'rgba(48,209,88,.04)':'#f8f7fc',transition:'all .2s'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:42,height:42,borderRadius:12,background:'rgba(48,209,88,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🏢</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                    <span style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>Enterprise</span>
                    <span style={{fontSize:9,fontWeight:700,color:'rgba(26,26,46,.4)',background:'rgba(0,0,0,.05)',border:'1px solid rgba(0,0,0,.08)',borderRadius:100,padding:'1px 7px'}}>Coming Soon</span>
                  </div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.5)',marginBottom:2}}>Full business intelligence for operators & teams</div>
                  <div style={{fontSize:10,fontWeight:700,color:'#30d158'}}>Enterprise Pass · $79.99/mo</div>
                </div>
                <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${userCat==='business'?'#30d158':'rgba(0,0,0,.15)'}`,background:userCat==='business'?'#30d158':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {userCat==='business' && <div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                </div>
              </div>
              {userCat==='business' && (
                <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(0,0,0,.06)'}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:8}}>Notify me when these launch:</div>
                  {[
                    {id:'ent_reg',    label:'Regulatory Updates',    sub:'IRS, OSHA, labor laws for your industry'},
                    {id:'ent_tariff', label:'Tariff Intelligence',   sub:'Live import/export cost tracking'},
                    {id:'ent_market', label:'Market Intelligence',   sub:'Predict margins, spot trends early'},
                    {id:'ent_assets', label:'Assets & Liabilities',  sub:'Balance sheet + PDF export'},
                  ].map((item)=>(
                    <div key={item.id} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:8,cursor:'pointer'}} onClick={e=>{e.stopPropagation();setPromoCode(p=>p===item.id?'':item.id)}}>
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

          {userCat==='business' && (
            <div style={{background:'rgba(255,159,10,.06)',border:'1px solid rgba(255,159,10,.2)',borderRadius:12,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#8a5c00',lineHeight:1.5}}>
              ✓ You'll start with <strong>Pro ($19.99/mo)</strong> today and be the first notified when Enterprise launches — at a founding member rate.
            </div>
          )}

          <button onClick={()=>{ if(userCat) setStep('details') }} disabled={!userCat}
            style={{width:'100%',padding:13,background:userCat?`linear-gradient(135deg,${userCat==='driver'?'#ff3b30,#ff6b35':userCat==='freelancer'?'#0a84ff,#30a0ff':'#30d158,#34c759'})`:'rgba(0,0,0,.08)',color:userCat?'#fff':'rgba(26,26,46,.3)',border:'none',borderRadius:100,fontSize:14,fontWeight:700,cursor:userCat?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif",marginBottom:10,transition:'all .2s'}}>
            {!userCat ? 'Select a plan to continue' : userCat==='driver' ? 'Continue with Core →' : userCat==='freelancer' ? 'Continue with Pro →' : 'Continue with Enterprise →'}
          </button>
          <button onClick={()=>setStep('gate')} style={{background:'none',border:'none',color:'rgba(26,26,46,.4)',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",padding:0}}>← Back</button>
        </>}

        {step === 'details' && <>
          <div style={{width:50,height:50,borderRadius:15,background:`linear-gradient(135deg,${selectedType?.color||'#ff3b30'},${selectedType?.color||'#ff3b30'}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:18}}>{selectedType?.icon||'⛽'}</div>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:21,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',marginBottom:4}}>Almost done</h2>
          <p style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:16}}>Creating account for <strong style={{color:'#1a1a2e'}}>{email}</strong></p>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <input type="text" placeholder="First name" value={firstName} onChange={e=>setFirstName(e.target.value)} style={{flex:1,padding:'11px 14px',background:'#f8f7fc',border:'1.5px solid rgba(0,0,0,.1)',borderRadius:12,fontSize:14,color:'#1a1a2e',outline:'none',fontFamily:"'DM Sans',sans-serif"}}/>
            <input type="text" placeholder="Last name" value={lastName} onChange={e=>setLastName(e.target.value)} style={{flex:1,padding:'11px 14px',background:'#f8f7fc',border:'1.5px solid rgba(0,0,0,.1)',borderRadius:12,fontSize:14,color:'#1a1a2e',outline:'none',fontFamily:"'DM Sans',sans-serif"}}/>
          </div>
          {userCat==='business' && (
            <input type="text" placeholder="Business name" value={bizName} onChange={e=>setBizName(e.target.value)} style={{width:'100%',padding:'11px 14px',background:'#f8f7fc',border:'1.5px solid rgba(0,0,0,.1)',borderRadius:12,fontSize:14,color:'#1a1a2e',outline:'none',fontFamily:"'DM Sans',sans-serif",marginBottom:10}}/>
          )}
          <select value={stateName} onChange={e=>setStateName(e.target.value)} style={{width:'100%',padding:'11px 14px',background:'#f8f7fc',border:'1.5px solid rgba(0,0,0,.1)',borderRadius:12,fontSize:14,color:stateName?'#1a1a2e':'rgba(26,26,46,.4)',outline:'none',fontFamily:"'DM Sans',sans-serif",marginBottom:10,appearance:'none'}}>
            <option value="">Select your state</option>
            {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s=>(
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div style={{background:'#f8f7fc',borderRadius:14,padding:'12px 14px',marginBottom:16,fontSize:12,color:'rgba(26,26,46,.6)',lineHeight:1.6}}>
            {userCat==='driver' ? '✓ Opens immediately · 7-day free trial · Core $9.99/mo · Use FOUNDING100 for $4.99 x 6 months' : userCat==='freelancer' ? '✓ Opens immediately · 7-day free trial · Pro $19.99/mo · Cancel anytime' : '✓ Opens immediately · 7-day free trial · Enterprise $79.99/mo · Cancel anytime'}
          </div>
          <div style={{marginBottom:14}}>
            <div style={{display:'flex',gap:8}}>
              <input type="text" placeholder="Promo code (optional)" value={promoCode} autoComplete="off" name="promo-code-field" onChange={e=>{setPromoCode(e.target.value.toUpperCase());setPromoValid(null)}} style={{flex:1,padding:'11px 14px',background:'#f8f7fc',border:`1.5px solid ${promoValid===true?'#30d158':promoValid===false?'#ff453a':'rgba(0,0,0,.1)'}`,borderRadius:12,fontSize:14,color:'#1a1a2e',outline:'none',fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:'uppercase'}}/>
              <button onClick={validatePromo} style={{padding:'11px 16px',background:'rgba(0,0,0,.06)',border:'none',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",color:'#1a1a2e',whiteSpace:'nowrap'}}>Apply</button>
            </div>
            {promoValid===true  && <div style={{fontSize:12,color:'#30d158',marginTop:6,fontWeight:600}}>✓ Code applied — {promoDays} days free!</div>}
            {promoValid===false && <div style={{fontSize:12,color:'#ff453a',marginTop:6}}>Invalid or expired code</div>}
          </div>
          <input type="password" placeholder="Create a password (8+ characters)" value={password} onChange={e=>{setPassword(e.target.value);setError('')}} onKeyDown={e=>e.key==='Enter'&&password.length>=8&&handleCreate()} autoFocus style={{...inp(),border:`1.5px solid ${error?'#ff453a':'rgba(0,0,0,.1)'}`,marginBottom:error?6:10}}/>
          {error && <div style={{fontSize:12,color:'#ff453a',marginBottom:10}}>{error}</div>}
          <button onClick={handleCreate} disabled={password.length<8||loading} style={{width:'100%',padding:14,background:password.length>=8&&!loading?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(255,59,48,.2)',color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,cursor:password.length>=8&&!loading?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif",marginBottom:12}}>
            {loading?'Creating your account...':'Create account & continue →'}
          </button>
          <button onClick={()=>setStep('type')} style={{background:'none',border:'none',color:'rgba(26,26,46,.4)',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",padding:0}}>← Back</button>
          <p style={{fontSize:11,color:'rgba(26,26,46,.3)',textAlign:'center',marginTop:14,lineHeight:1.6}}>Card required after trial · Cancel anytime · <a href="/terms" style={{color:'#ff3b30'}}>Terms</a> & <a href="/privacy" style={{color:'#ff3b30'}}>Privacy</a></p>
        </>}
      </div>
    </div>
  )
}

// ── Interactive Gas Tracker Demo ──────────────────────────────
function GasTrackerDemo({ onStart }: { onStart: () => void }) {
  const [phase, setPhase] = React.useState<'idle'|'typing'|'searching'|'results'|'route'|'done'>('idle')
  const [typed, setTyped] = React.useState('')
  const [stationsVisible, setStationsVisible] = React.useState(0)
  const [selectedStation, setSelectedStation] = React.useState<number|null>(null)
  const [routeProgress, setRouteProgress] = React.useState(0)
  const destination = 'Atlanta, GA'

  const stations = [
    { name:'Circle K', dist:'0.8 mi', price:'$3.06', savings:'Cheapest', color:'#30d158' },
    { name:'Exxon',    dist:'1.1 mi', price:'$3.09', savings:'',         color:'#a8e063' },
    { name:'Marathon', dist:'1.5 mi', price:'$3.14', savings:'',         color:'#ffd60a' },
    { name:'Shell',    dist:'2.2 mi', price:'$3.18', savings:'',         color:'#ff9500' },
  ]

  React.useEffect(() => {
    if (phase !== 'idle') return
    const t = setTimeout(() => setPhase('typing'), 800)
    return () => clearTimeout(t)
  }, [phase])

  React.useEffect(() => {
    if (phase !== 'typing') return
    if (typed.length < destination.length) {
      const t = setTimeout(() => setTyped(destination.slice(0, typed.length + 1)), 60)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setPhase('searching'), 600)
      return () => clearTimeout(t)
    }
  }, [phase, typed])

  React.useEffect(() => {
    if (phase !== 'searching') return
    const t = setTimeout(() => setPhase('results'), 1200)
    return () => clearTimeout(t)
  }, [phase])

  React.useEffect(() => {
    if (phase !== 'results') return
    let count = 0
    const t = setInterval(() => {
      count++
      setStationsVisible(count)
      if (count >= stations.length) {
        clearInterval(t)
        setTimeout(() => { setSelectedStation(0); setPhase('route') }, 800)
      }
    }, 300)
    return () => clearInterval(t)
  }, [phase])

  React.useEffect(() => {
    if (phase !== 'route') return
    let p = 0
    const t = setInterval(() => {
      p += 2
      setRouteProgress(p)
      if (p >= 100) { clearInterval(t); setTimeout(() => setPhase('done'), 400) }
    }, 30)
    return () => clearInterval(t)
  }, [phase])

  const reset = () => { setPhase('idle'); setTyped(''); setStationsVisible(0); setSelectedStation(null); setRouteProgress(0) }

  return (
    <div style={{position:'relative',borderRadius:20,overflow:'hidden',background:'rgba(0,0,0,.03)',border:'1px solid rgba(0,0,0,.07)',marginBottom:10}}>
      <style>{`@keyframes pinDrop{from{opacity:0;transform:translateY(-12px) scale(.7)}to{opacity:1;transform:translateY(0) scale(1)}} @keyframes spin2{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>

      {/* Header */}
      <div style={{background:'rgba(255,255,255,.9)',backdropFilter:'blur(20px)',borderBottom:'0.5px solid rgba(0,0,0,.06)',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:24,height:24,borderRadius:7,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>⛽</div>
          <span style={{fontSize:12,fontWeight:700,color:'#1a1a2e',fontFamily:"'Sora',sans-serif"}}>Gas Intelligence</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:4,background:'rgba(48,209,88,.1)',border:'0.5px solid rgba(48,209,88,.3)',borderRadius:100,padding:'2px 8px'}}>
          <div style={{width:4,height:4,borderRadius:'50%',background:'#30d158'}}/>
          <span style={{fontSize:9,fontWeight:700,color:'#1a7a35'}}>LIVE</span>
        </div>
      </div>

      {/* Route input */}
      <div style={{padding:'12px 14px',background:'rgba(255,255,255,.7)',borderBottom:'0.5px solid rgba(0,0,0,.05)'}}>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:6}}>🛣️ Route Gas Finder</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{flex:1,background:'rgba(255,59,48,.06)',border:'1px solid rgba(255,59,48,.2)',borderRadius:10,padding:'8px 12px',fontSize:12,color:'#1a1a2e',fontFamily:"'DM Sans',sans-serif",minHeight:34,display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:10}}>📍</span><span style={{color:'rgba(26,26,46,.4)'}}>My Location</span>
          </div>
          <span style={{fontSize:12,color:'rgba(26,26,46,.3)'}}>→</span>
          <div style={{flex:1,background:phase==='idle'?'rgba(0,0,0,.03)':'rgba(255,59,48,.06)',border:`1px solid ${phase==='idle'?'rgba(0,0,0,.08)':'rgba(255,59,48,.25)'}`,borderRadius:10,padding:'8px 12px',fontSize:12,color:'#1a1a2e',fontFamily:"'DM Sans',sans-serif",minHeight:34,display:'flex',alignItems:'center',gap:6,transition:'all .3s'}}>
            <span style={{fontSize:10}}>🏁</span>
            <span style={{color:typed?'#1a1a2e':'rgba(26,26,46,.3)'}}>{typed || 'Destination...'}{phase==='typing'&&<span style={{animation:'blink 1s ease infinite',opacity:.6}}>|</span>}</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{position:'relative',height:160,background:'linear-gradient(135deg,#e8f2f8,#ddeef5)',overflow:'hidden'}}>
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 400 160" preserveAspectRatio="none">
          <path d="M 0 90 C 80 85, 150 100, 200 80 S 320 60, 400 70" stroke="#d0d8e0" strokeWidth="18" fill="none" strokeLinecap="round"/>
          <path d="M 0 90 C 80 85, 150 100, 200 80 S 320 60, 400 70" stroke="#e8eef2" strokeWidth="14" fill="none" strokeLinecap="round"/>
          <path d="M 0 90 C 80 85, 150 100, 200 80 S 320 60, 400 70" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="12 8"/>
          {(phase==='route'||phase==='done') && <path d="M 0 90 C 80 85, 150 100, 200 80 S 320 60, 400 70" stroke="#ff3b30" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="400" strokeDashoffset={400-routeProgress*4} style={{transition:'stroke-dashoffset .1s linear'}}/>}
        </svg>
        <div style={{position:'absolute',left:20,top:82,width:14,height:14,borderRadius:'50%',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',border:'2px solid white',boxShadow:'0 0 0 4px rgba(255,59,48,.2)',zIndex:10}}/>
        {stations.slice(0,stationsVisible).map((s,i)=>{
          const pos=[{left:80,top:68},{left:130,top:74},{left:185,top:60},{left:240,top:62}][i]
          const isSel=selectedStation===i
          return (
            <div key={i} onClick={()=>setSelectedStation(i)} style={{position:'absolute',left:pos.left,top:pos.top-(isSel?8:0),zIndex:isSel?20:10,cursor:'pointer',animation:'pinDrop .3s cubic-bezier(.34,1.56,.64,1)',transition:'top .2s cubic-bezier(.34,1.56,.64,1)'}}>
              <div style={{background:isSel?s.color:'rgba(255,255,255,.95)',border:`1.5px solid ${s.color}`,borderRadius:8,padding:'3px 7px',fontSize:10,fontWeight:800,color:isSel?'white':'#1a1a2e',boxShadow:isSel?`0 4px 12px ${s.color}60`:'0 2px 6px rgba(0,0,0,.15)',whiteSpace:'nowrap',fontFamily:"'Sora',sans-serif"}}>{i===0?'★ ':''}{s.price}</div>
              <div style={{width:6,height:6,borderRadius:'50%',background:s.color,margin:'2px auto 0'}}/>
            </div>
          )
        })}
        {(phase==='route'||phase==='done')&&<div style={{position:'absolute',right:20,top:52,zIndex:10,animation:'pinDrop .4s cubic-bezier(.34,1.56,.64,1)'}}><div style={{background:'#1a1a2e',borderRadius:8,padding:'3px 8px',fontSize:10,fontWeight:700,color:'white',whiteSpace:'nowrap'}}>🏁 Atlanta</div></div>}
        {phase==='searching'&&<div style={{position:'absolute',inset:0,background:'rgba(255,255,255,.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><div style={{width:16,height:16,border:'2.5px solid rgba(255,59,48,.2)',borderTopColor:'#ff3b30',borderRadius:'50%',animation:'spin2 0.8s linear infinite'}}/><span style={{fontSize:12,fontWeight:600,color:'#ff3b30',fontFamily:"'DM Sans',sans-serif"}}>Finding cheapest stops...</span></div>}
      </div>

      {/* Results */}
      {(phase==='results'||phase==='route'||phase==='done')&&(
        <div style={{padding:'10px 14px',background:'rgba(255,255,255,.85)'}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:8}}>Stations along your route</div>
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
            {stations.slice(0,stationsVisible).map((s,i)=>(
              <div key={i} onClick={()=>setSelectedStation(i)} style={{flexShrink:0,background:selectedStation===i?`${s.color}12`:'rgba(0,0,0,.03)',border:`1px solid ${selectedStation===i?s.color:'rgba(0,0,0,.08)'}`,borderRadius:12,padding:'8px 12px',cursor:'pointer',transition:'all .2s'}}>
                <div style={{fontSize:9,fontWeight:700,color:'rgba(26,26,46,.4)',marginBottom:3}}>{s.dist}</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:900,color:s.color,lineHeight:1}}>{s.price}</div>
                <div style={{fontSize:9,color:'rgba(26,26,46,.5)',marginTop:2}}>{s.name}</div>
                {s.savings&&<div style={{fontSize:8,fontWeight:700,color:s.color,background:`${s.color}15`,borderRadius:100,padding:'1px 5px',marginTop:3,display:'inline-block'}}>{s.savings}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Savings */}
      {phase==='done'&&(
        <div style={{padding:'10px 14px',background:'linear-gradient(135deg,rgba(48,209,88,.12),rgba(48,209,88,.06))',borderTop:'0.5px solid rgba(48,209,88,.2)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#1a7a35'}}>✓ Route optimized · You save $0.12/gal</div>
            <div style={{fontSize:9,color:'rgba(26,26,46,.45)',marginTop:2}}>vs most expensive station on route</div>
          </div>
          <button onClick={onStart} style={{padding:'7px 14px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:100,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap',boxShadow:'0 3px 10px rgba(255,59,48,.35)'}}>Try it free →</button>
        </div>
      )}
      {phase==='done'&&<button onClick={reset} style={{position:'absolute',top:52,right:10,background:'rgba(255,255,255,.8)',border:'0.5px solid rgba(0,0,0,.1)',borderRadius:100,padding:'3px 8px',fontSize:9,fontWeight:600,cursor:'pointer',color:'rgba(26,26,46,.5)',fontFamily:"'DM Sans',sans-serif"}}>↺ Replay</button>}
    </div>
  )
}

function FoundingPopup({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const CODE = 'FOUNDING100'
  const copy = () => { navigator.clipboard?.writeText(CODE).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2500) }

  return (
    <div style={{position:'fixed',inset:0,zIndex:9990,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',padding:'0 16px 24px'}}>
      <div style={{background:'rgba(255,255,255,.97)',backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',borderRadius:'28px 28px 20px 20px',padding:'22px 24px 24px',maxWidth:440,width:'100%',boxShadow:'0 -8px 40px rgba(0,0,0,.15)',animation:'slideUpPopup .4s cubic-bezier(.34,1.56,.64,1) both',fontFamily:"'DM Sans',system-ui,sans-serif",position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,width:28,height:28,borderRadius:'50%',background:'rgba(0,0,0,.06)',border:'none',cursor:'pointer',fontSize:12,color:'rgba(26,26,46,.4)',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        <div style={{width:36,height:4,borderRadius:2,background:'rgba(0,0,0,.1)',margin:'0 auto 18px'}}/>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
          <div style={{width:48,height:48,borderRadius:15,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,boxShadow:'0 4px 16px rgba(255,59,48,.35)'}}>⛽</div>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:3}}>Founding Member Offer</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e',lineHeight:1.1}}>Core is $9.99/mo —<br/>lock in $4.99 for 6 months</div>
          </div>
        </div>
        <div style={{fontSize:13,color:'rgba(26,26,46,.55)',lineHeight:1.65,marginBottom:4}}>Use this code at signup — your rate is locked for 6 months. Route finder, EV Intelligence, and Ideas Vault included.</div>
        <div onClick={copy} style={{background:copied?'rgba(48,209,88,.08)':'rgba(255,59,48,.05)',border:`1.5px dashed ${copied?'rgba(48,209,88,.4)':'rgba(255,59,48,.35)'}`,borderRadius:16,padding:'14px',textAlign:'center',cursor:'pointer',transition:'all .2s',margin:'14px 0'}}>
          <div style={{fontFamily:'monospace',fontSize:24,fontWeight:700,color:copied?'#30d158':'#ff3b30',letterSpacing:5}}>{CODE}</div>
          <div style={{fontSize:11,color:copied?'#30d158':'rgba(26,26,46,.4)',marginTop:4,fontWeight:copied?700:400}}>{copied?'✓ Copied to clipboard!':'Tap to copy'}</div>
        </div>
        <button onClick={onClose} style={{width:'100%',padding:14,borderRadius:100,border:'none',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(255,59,48,.35)',fontFamily:"'DM Sans',sans-serif",marginBottom:10}}>Start Free Trial → Apply Code at Signup</button>
        <button onClick={onClose} style={{width:'100%',padding:11,borderRadius:100,border:'0.5px solid rgba(0,0,0,.1)',background:'transparent',color:'rgba(26,26,46,.45)',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>No thanks</button>
      </div>
    </div>
  )
}

function LandingPage() {
  const [showModal, setShowModal] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('gc_popup_seen')
    if (!seen) {
      const t = setTimeout(() => { setShowPopup(true); sessionStorage.setItem('gc_popup_seen','1') }, 2000)
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
        .card-cta{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:linear-gradient(135deg,#ff3b30,#ff6b35);color:#fff;border-radius:12px;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;margin-top:4px;border:none;cursor:pointer}
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

      {showModal && <QuickSignupModal onClose={()=>setShowModal(false)}/>}
      {showPopup && <FoundingPopup onClose={()=>setShowPopup(false)}/>}
      <div className="bg-mesh"/>
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
          </div>
          <div className="nav-actions">
            <Link href="/login" className="btn-login">Log in</Link>
            <button onClick={()=>setShowModal(true)} className="btn-signup">Get Started →</button>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-badge">
            <div className="hero-badge-dot">⚡</div>
            Now Live · Core $9.99/mo · Pro $19.99/mo
          </div>
          <h1>Business<br/><span className="accent">intelligence</span><br/><span className="light-word">at your fingertips</span></h1>
          <p className="hero-sub">Real-time gas prices, EV chargers, Ideas Vault, and Barter & Trade — built for drivers, freelancers, and growing businesses.</p>
          <div className="hero-actions">
            <button onClick={()=>setShowModal(true)} className="btn-primary">Start 7-Day Free Trial →</button>
            <Link href="/pricing" className="btn-secondary">View Plans</Link>
          </div>
          <div style={{marginTop:14,fontSize:13,color:'var(--ink-3)'}}>Core $9.99/mo · Use FOUNDING100 for $4.99 x 6 months · Cancel anytime</div>
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
            <p className="section-sub" style={{margin:"0 auto"}}>Gas + EV intelligence live now. Ideas Vault and Barter live for Pro.</p>
          </div>
          <div className="modules-grid">
            {/* Gas Intelligence — featured */}
            <div className="module-card featured active" style={{cursor:'default',gridColumn:'span 2'}}>
              <div className="card-top">
                <div className="card-icon" style={{background:"linear-gradient(135deg,#ff3b30,#ff6b35)"}}>⛽</div>
                <div className="card-status-live"><div className="live-dot"/>LIVE</div>
              </div>
              <div className="card-title">Gas Intelligence</div>
              <div className="card-desc" style={{marginBottom:16}}>Real-time gas prices at stations near you. Compare grades, find the cheapest route, and track trends.</div>
              <GasTrackerDemo onStart={()=>setShowModal(true)}/>
              <br/>
              <span className="card-cta" onClick={()=>setShowModal(true)} style={{cursor:'pointer'}}>Start Free Trial →</span>
            </div>

            {/* Ideas Vault — LIVE */}
            <div className="module-card active" onClick={()=>setShowModal(true)} style={{cursor:'pointer'}}>
              <div className="card-top">
                <div className="card-icon" style={{background:"linear-gradient(135deg,#ffd60a,#ff9f0a)"}}>💡</div>
                <div className="card-status-live"><div className="live-dot"/>LIVE</div>
              </div>
              <div className="card-title">Ideas Vault</div>
              <div className="card-desc">Timestamp and seal your ideas with SHA-256 + RFC 3161 + Bitcoin. Court-ready certificate included.</div>
              <div className="card-meta">Pro plan · SHA-256 · RFC 3161 · Bitcoin</div>
              <button className="card-cta" style={{marginTop:12}}>Protect an idea →</button>
            </div>

            {/* EV Intelligence — LIVE */}
            <div className="module-card active" onClick={()=>setShowModal(true)} style={{cursor:'pointer'}}>
              <div className="card-top">
                <div className="card-icon" style={{background:"linear-gradient(135deg,#30d158,#34c759)"}}>⚡</div>
                <div className="card-status-live"><div className="live-dot"/>LIVE</div>
              </div>
              <div className="card-title">EV Intelligence</div>
              <div className="card-desc">Find EV chargers near you. See network, speed, availability and cost — all in real time.</div>
              <div className="card-meta">Core plan · Open Charge Map · Live availability</div>
              <button className="card-cta" style={{marginTop:12}}>Find chargers →</button>
            </div>

            {/* Barter & Trade — LIVE */}
            <div className="module-card active" onClick={()=>setShowModal(true)} style={{cursor:'pointer'}}>
              <div className="card-top">
                <div className="card-icon" style={{background:"linear-gradient(135deg,#0a84ff,#30a0ff)"}}>🤝</div>
                <div className="card-status-live"><div className="live-dot"/>LIVE</div>
              </div>
              <div className="card-title">Barter & Trade</div>
              <div className="card-desc">Legally timestamp trade agreements. Agreement ID, fairness bar, and timestamped legal record.</div>
              <div className="card-meta">Pro plan · Agreement ID · Legal timestamp</div>
              <button className="card-cta" style={{marginTop:12}}>Log a trade →</button>
            </div>

            {/* Locked modules */}
            {[
              {icon:"📋",color:"linear-gradient(135deg,#0a84ff,#30a0ff)",title:"Regulatory Updates"},
              {icon:"📊",color:"linear-gradient(135deg,#bf5af2,#da8fff)",title:"Assets & Liabilities"},
            ].map((m,i)=>(
              <div key={i} className="module-card locked">
                <div style={{filter:'blur(6px)',userSelect:'none',pointerEvents:'none',opacity:0.4}}>
                  <div className="card-top">
                    <div className="card-icon" style={{background:m.color}}>{m.icon}</div>
                    <div className="card-status-soon">· · ·</div>
                  </div>
                  <div className="card-title" style={{color:'rgba(26,26,46,.15)',letterSpacing:8}}>{'█'.repeat(8)}</div>
                  <div style={{height:10,background:'rgba(0,0,0,.06)',borderRadius:6,marginBottom:8,width:'85%'}}/>
                  <div style={{height:10,background:'rgba(0,0,0,.06)',borderRadius:6,width:'65%'}}/>
                </div>
                <div className="locked-overlay"><div className="locked-overlay-text">Coming Soon</div></div>
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
            <p>Core $9.99/mo · Pro $19.99/mo · 7-day free trial · Cancel anytime. Use FOUNDING100 for $4.99 x 6 months on Core.</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={()=>setShowModal(true)} className="btn-primary" style={{fontSize:16,padding:"16px 36px",border:'none'}}>Start Free Trial →</button>
              <Link href="/login" className="btn-secondary" style={{fontSize:16,padding:"16px 28px"}}>Log In</Link>
            </div>
            <div style={{marginTop:16,fontSize:12,color:"var(--ink-3)"}}>· 7-day free trial · Core $9.99 · Pro $19.99 · Cancel anytime</div>
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
          <div className="footer-copy">© 2026 Gratia Core Enterprise LLC. All rights reserved.</div>
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
  if (COMING_SOON_ENV && !accessGranted) return <ComingSoonGate/>
  return <LandingPage/>
}