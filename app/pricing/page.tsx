'use client'
// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function GCIcon({ size = 28 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}>
      <rect width="512" height="512" rx="114" fill="#ff3b30"/>
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  )
}

const PLANS = [
  {
    id: 'core',
    name: 'Core',
    price: 4.99,
    showPrice: true,
    color: '#ff3b30',
    gradient: 'linear-gradient(135deg,#ff3b30,#ff6b35)',
    live: true,
    badge: 'Live Now',
    desc: 'Gas intelligence for everyday drivers',
    features: [
      '⛽ Real-time gas prices near you',
      '🗺️ Route gas finder — cheapest on any trip',
      '📊 USA price map all 50 states',
      '🔔 Tank & price alerts',
      '💡 Idea Vault (coming)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: null,
    showPrice: false,
    color: '#0a84ff',
    gradient: 'linear-gradient(135deg,#0a84ff,#30a0ff)',
    live: false,
    badge: 'Coming Soon',
    desc: 'Full suite for freelancers & gig workers',
    features: [
      'Everything in Core',
      '🧾 Deduction Teller',
      '🤝 Barter & Trade Tracker',
      '📅 Tax deadline reminders',
      '🔔 Gas price drop email alerts',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    showPrice: false,
    color: '#bf5af2',
    gradient: 'linear-gradient(135deg,#bf5af2,#da8fff)',
    live: false,
    badge: 'Coming Soon',
    desc: 'Business intelligence for operators',
    features: [
      'Everything in Pro',
      '📋 Regulatory Updates',
      '🌐 Tariff Intelligence',
      '📈 Market Intelligence',
      '📊 Assets & Liabilities',
      '👥 3 team seats',
    ],
  },
]

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

export default function PricingPage() {
  const router = useRouter()
  const [loading,   setLoading]   = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [showPopup,  setShowPopup]  = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('gc_popup_seen')
    if (!seen) {
      const t = setTimeout(() => {
        setShowPopup(true)
        sessionStorage.setItem('gc_popup_seen', '1')
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [])

  const handleStart = () => setShowModal(true)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{
          background:#f0eff4;
          background-image:
            radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.09) 0%,transparent 55%),
            radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.07) 0%,transparent 50%);
          font-family:'DM Sans',system-ui,sans-serif;
          color:#1a1a2e;
          min-height:100vh;
          -webkit-font-smoothing:antialiased;
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
        .plan-card{background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;padding:28px 24px;position:relative;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s}
        .plan-card.live{cursor:pointer}
        .plan-card.live:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,0.10)}
        .gc-nav{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;max-width:1100px;margin:0 auto}
      `}</style>

      {showModal && <QuickSignupModal onClose={()=>setShowModal(false)}/>}
      {showPopup && <FoundingPopup onClose={()=>setShowPopup(false)}/>}

      {/* Nav */}
      <nav style={{position:'fixed',top:0,left:0,right:0,background:'rgba(255,255,255,0.65)',backdropFilter:'blur(40px)',borderBottom:'0.5px solid rgba(255,255,255,0.92)',zIndex:99,boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
        <div className="gc-nav">
          <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}>
            <GCIcon size={28}/>
            <span style={{fontFamily:"'Sora',sans-serif",fontSize:15,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e'}}>Gratia Core</span>
          </Link>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <Link href="/login" style={{padding:'7px 18px',borderRadius:100,border:'0.5px solid rgba(0,0,0,0.1)',background:'rgba(255,255,255,0.6)',fontSize:13,fontWeight:600,color:'rgba(26,26,46,.7)',textDecoration:'none'}}>Log in</Link>
            <Link href="/" style={{padding:'7px 18px',borderRadius:100,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',fontSize:13,fontWeight:700,color:'#fff',textDecoration:'none',boxShadow:'0 4px 12px rgba(255,59,48,.3)'}}>Get Started →</Link>
          </div>
        </div>
      </nav>

      <div style={{maxWidth:900,margin:'0 auto',padding:'100px 24px 80px'}}>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:48,animation:'fadeUp .5s ease both'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(48,209,88,0.1)',border:'0.5px solid rgba(48,209,88,0.3)',borderRadius:100,padding:'4px 14px',fontSize:11,fontWeight:700,color:'#1a7a35',letterSpacing:.5,textTransform:'uppercase',marginBottom:16}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'#30d158',display:'inline-block',animation:'lp 1.5s ease infinite'}}/>
            Core Pass live now
          </div>
          <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:'clamp(32px,5vw,52px)',fontWeight:900,letterSpacing:-2.5,color:'#1a1a2e',lineHeight:1,marginBottom:14}}>
            Simple, honest pricing
          </h1>
          <p style={{fontSize:16,color:'rgba(26,26,46,.55)',maxWidth:480,margin:'0 auto',lineHeight:1.7}}>
            Start with gas intelligence today. Pro and Enterprise modules launching soon — Core founding members get priority access and locked pricing.
          </p>
        </div>

        {/* Plans */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16,marginBottom:40}}>
          {PLANS.map((plan,i)=>(
            <div key={plan.id} className={`plan-card ${plan.live?'live':''}`} style={{animation:`fadeUp .5s ease ${.05+i*.08}s both`}}>

              {/* Top accent line for live plan */}
              {plan.live && <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${plan.color},transparent)`}}/>}

              {/* Badge */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div style={{display:'inline-flex',alignItems:'center',gap:5,background:plan.live?'rgba(48,209,88,0.1)':'rgba(0,0,0,0.05)',border:`0.5px solid ${plan.live?'rgba(48,209,88,0.3)':'rgba(0,0,0,0.08)'}`,borderRadius:100,padding:'3px 10px',fontSize:10,fontWeight:700,color:plan.live?'#1a7a35':'rgba(26,26,46,.4)',letterSpacing:.5}}>
                  {plan.live && <span style={{width:5,height:5,borderRadius:'50%',background:'#30d158',display:'inline-block',animation:'lp 1.5s ease infinite'}}/>}
                  {plan.badge}
                </div>
              </div>

              {/* Name + price */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                <div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e',marginBottom:4}}>{plan.name}</div>
                  <div style={{fontSize:12,color:'rgba(26,26,46,.5)',lineHeight:1.5}}>{plan.desc}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0,marginLeft:12}}>
                  {plan.showPrice ? (
                    <>
                      <div style={{fontFamily:"'Sora',sans-serif",fontSize:32,fontWeight:900,letterSpacing:-1.5,color:plan.color,lineHeight:1}}>${plan.price}</div>
                      <div style={{fontSize:11,color:'rgba(26,26,46,.4)'}}>/mo</div>
                    </>
                  ) : (
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:'rgba(26,26,46,.25)',filter:'blur(4px)',userSelect:'none'}}>$--.--</div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div style={{margin:'16px 0',filter:!plan.live?'blur(1.5px)':'none',opacity:!plan.live?.65:1,userSelect:!plan.live?'none':'auto'}}>
                {plan.features.map((f,j)=>(
                  <div key={j} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'rgba(26,26,46,.7)',marginBottom:8}}>
                    <span style={{color:plan.color,fontWeight:700,flexShrink:0,fontSize:11}}>✓</span>{f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              {plan.live ? (
                <button onClick={handleStart} disabled={loading}
                  style={{width:'100%',padding:13,borderRadius:100,border:'none',background:plan.gradient,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 16px ${plan.color}44`,marginTop:4}}>
                  {loading ? 'Loading...' : 'Start 7-Day Free Trial →'}
                </button>
              ) : (
                <div style={{width:'100%',padding:13,borderRadius:100,background:'rgba(0,0,0,0.04)',border:'0.5px solid rgba(0,0,0,0.07)',fontSize:13,fontWeight:600,color:'rgba(26,26,46,.35)',textAlign:'center',marginTop:4,filter:'blur(0.5px)'}}>
                  Coming soon
                </div>
              )}

              {plan.live && (
                <p style={{fontSize:11,color:'rgba(26,26,46,.35)',textAlign:'center',marginTop:10,lineHeight:1.6}}>
                  Card required · Not charged for 7 days · Cancel anytime
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Founding member callout */}
        <div style={{background:'rgba(255,59,48,0.06)',border:'0.5px solid rgba(255,59,48,0.2)',borderRadius:24,padding:'24px 28px',marginBottom:32,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,animation:'fadeUp .5s ease .3s both'}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase',marginBottom:6}}>🎁 Founding Member Offer</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',marginBottom:4}}>Lock in $4.99/mo for 6 months</div>
            <div style={{fontSize:13,color:'rgba(26,26,46,.55)'}}>Use code <strong style={{fontFamily:'monospace',fontSize:15,color:'#ff3b30',letterSpacing:2}}>FOUNDING100</strong> at signup · Rate locked even after we raise prices</div>
          </div>
          <button onClick={handleStart}
            style={{padding:'12px 28px',borderRadius:100,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 16px rgba(255,59,48,.35)',whiteSpace:'nowrap'}}>
            Claim Founding Price →
          </button>
        </div>

        {/* Trust signals */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,animation:'fadeUp .5s ease .35s both'}}>
          {[
            {icon:'🔒',title:'Stripe secured',sub:'Card data never touches our servers'},
            {icon:'📅',title:'Cancel anytime',sub:'No contracts, no cancellation fees'},
            {icon:'🎁',title:'7-day trial',sub:'Full access, not charged until day 8'},
          ].map((t,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.65)',backdropFilter:'blur(40px)',border:'0.5px solid rgba(255,255,255,0.92)',borderRadius:20,padding:'16px',textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
              <div style={{fontSize:24,marginBottom:6}}>{t.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:'#1a1a2e',marginBottom:3}}>{t.title}</div>
              <div style={{fontSize:11,color:'rgba(26,26,46,.45)',lineHeight:1.5}}>{t.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}