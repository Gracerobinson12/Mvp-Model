'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
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
    price: 9.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CORE || '',
    color: '#ff3b30',
    gradient: 'linear-gradient(135deg,#ff3b30,#ff6b35)',
    live: true,
    badge: 'Live Now',
    badgeLive: true,
    desc: 'Full Gas and EV Intelligence',
    features: [
      'Gas and EV Intelligence Finder',
      '🗺️ Full radius — 5 / 10 / 15 / 30 miles',
      '🛣️ Route finder — cheapest on any trip',
      '✓🔔 Gas price drop alerts',
      '✓📊 Price trend tracking — 30 days',
    ],
    locked: [],
    cta: 'Start 7-Day Free Trial →',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    priceId: '',
    color: '#0a84ff',
    gradient: 'linear-gradient(135deg,#0a84ff,#30a0ff)',
    live: true,
    badge: 'Live Now',
    badgeLive: true,
    desc: 'For freelancers and self-employed',
    tag: '',
    features: [
      'Everything in Core',
      '🤝 Barter & Trade Tracker',
      'Ideas Vault',
      '🔔 Gas price drop email alerts',
      '📅 Tax deadline reminders',
    ],
    cta: 'Start 7-Day Free Trial →',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 79.99,
    priceId: '',
    color: '#bf5af2',
    gradient: 'linear-gradient(135deg,#bf5af2,#da8fff)',
    live: true,
    badge: 'Coming Soon',
    badgeLive: false,
    desc: 'Business intelligence for operators',
    tag: '3 team seats included',
    features: [
      'Everything in Pro',
      '📋 Regulatory Updates — city/county/state',
      '🌐 Tariff Intelligence',
      '📈 Market Intelligence',
      '📊 Assets & Liabilities tracker',
      '👥 3 team seats',
    ],
    cta: 'Start 7-Day Free Trial →',
  },
]

function QuickSignupModal({ onClose, defaultPlan = 'core' }: { onClose: () => void; defaultPlan?: string }) {
  const router = useRouter()
  const [step,       setStep]      = useState<'gate'|'details'>('gate')
  const [email,      setEmail]     = useState('')
  const [password,   setPassword]  = useState('')
  const [firstName,  setFirstName] = useState('')
  const [lastName,   setLastName]  = useState('')
  const [stateName,  setStateName] = useState('')
  const [loading,    setLoading]   = useState(false)
  const [error,      setError]     = useState('')
  const [promoCode,  setPromoCode] = useState('')
  const [promoValid, setPromoValid]= useState<boolean|null>(null)
  const [promoDays,  setPromoDays] = useState(7)
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan)

  const plan = PLANS.find(p => p.id === selectedPlan) || PLANS[1]

  const validatePromo = async () => {
    if (!promoCode.trim()) return
    const { data } = await supabase.from('promo_codes').select('*').eq('code', promoCode.trim()).eq('active', true).single()
    if (!data || data.uses_count >= data.max_uses) { setPromoValid(false); return }
    setPromoValid(true); setPromoDays(data.trial_days)
  }

  const handleContinue = () => {
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return }
    setError(''); setStep('details')
  }

  const handleCreate = async () => {
    if (password.length < 8) return
    setLoading(true); setError('')
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError
      const userId = data.user?.id
      if (!userId) throw new Error('No user ID')
      await supabase.from('profiles').upsert({
        id: userId, email,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        full_name: [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null,
        state: stateName || null,
        plan: 'trialing',
        plan_status: 'trialing',
        selected_plan: selectedPlan,
        onboarded: true,
      })
      if (promoValid && promoCode) {
        await supabase.from('promo_redemptions').insert({ user_id: userId, code: promoCode }).catch(()=>{})
        await supabase.rpc('increment_promo_uses', { code_input: promoCode }).catch(()=>{})
      }
      await fetch('/api/send-welcome', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, plan: selectedPlan }),
      }).catch(()=>{})
      localStorage.setItem('gratia_signup_time', Date.now().toString())
      // Redirect to Stripe checkout for selected plan
      if (plan.priceId) {
        const res = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId: plan.priceId, userId, email }),
        })
        const { url } = await res.json()
        if (url) { window.location.href = url; return }
      }
      router.push('/dashboard/gas')
    } catch (e: any) {
      const msg = e?.message || ''
      if (msg.includes('already registered') || e?.status === 422) {
        setError('Account already exists. Please log in instead.')
      } else {
        setError(msg || 'Something went wrong.')
      }
      setLoading(false)
    }
  }

  const inp = { width:'100%', padding:'12px 14px', background:'#f8f7fc', border:'1.5px solid rgba(0,0,0,.1)', borderRadius:12, fontSize:14, color:'#1a1a2e', outline:'none', fontFamily:"'DM Sans',sans-serif" } as any

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)',padding:24}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'#fff',borderRadius:26,padding:'32px 28px',maxWidth:440,width:'100%',boxShadow:'0 32px 80px rgba(0,0,0,.18)',fontFamily:"'DM Sans',system-ui,sans-serif",position:'relative',maxHeight:'90vh',overflowY:'auto'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,width:30,height:30,borderRadius:'50%',background:'rgba(0,0,0,.06)',border:'none',cursor:'pointer',fontSize:14,color:'rgba(26,26,46,.5)'}}>✕</button>

        {step === 'gate' && <>
          <div style={{display:'flex',justifyContent:'center',marginBottom:16}}><GCIcon size={48}/></div>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,letterSpacing:-.5,textAlign:'center',color:'#1a1a2e',marginBottom:6}}>Start your free trial</h2>
          <p style={{fontSize:13,color:'rgba(26,26,46,.5)',textAlign:'center',marginBottom:20}}>7 days free · Card required · Cancel anytime</p>

          {/* Plan selector */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.45)',marginBottom:8,letterSpacing:.5,textTransform:'uppercase'}}>Select your plan</div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {PLANS.filter(p=>p.live).map(p=>(
                <div key={p.id} onClick={()=>setSelectedPlan(p.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',border:`1.5px solid ${selectedPlan===p.id?p.color:'rgba(0,0,0,.08)'}`,borderRadius:14,cursor:'pointer',background:selectedPlan===p.id?`${p.color}08`:'#f8f7fc',transition:'all .15s'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                      <span style={{fontSize:13,fontWeight:700,color:'#1a1a2e'}}>{p.name}</span>
                      {p.tag && <span style={{fontSize:9,fontWeight:700,padding:'1px 7px',borderRadius:100,background:`${p.color}15`,color:p.color,border:`0.5px solid ${p.color}40`}}>{p.tag}</span>}
                    </div>
                    <div style={{fontSize:11,color:'rgba(26,26,46,.5)'}}>{p.desc}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:900,color:selectedPlan===p.id?p.color:'#1a1a2e',letterSpacing:-.5}}>${p.price}</div>
                    <div style={{fontSize:10,color:'rgba(26,26,46,.35)'}}>/mo</div>
                  </div>
                  <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${selectedPlan===p.id?p.color:'rgba(0,0,0,.15)'}`,background:selectedPlan===p.id?p.color:'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {selectedPlan===p.id && <div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <input type="email" placeholder="Your email address" value={email}
            onChange={e=>{setEmail(e.target.value);setError('')}}
            onKeyDown={e=>e.key==='Enter'&&handleContinue()} autoFocus
            style={{...inp,marginBottom:error?6:10,border:`1.5px solid ${error?'#ff453a':'rgba(0,0,0,.1)'}`}}/>
          {error && <div style={{fontSize:12,color:'#ff453a',marginBottom:8}}>{error}</div>}
          <button onClick={handleContinue} style={{width:'100%',padding:13,background:email.trim()?plan.gradient:'rgba(0,0,0,.08)',color:email.trim()?'#fff':'rgba(26,26,46,.3)',border:'none',borderRadius:100,fontSize:14,fontWeight:700,cursor:email.trim()?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif"}}>
            Continue →
          </button>
          <div style={{textAlign:'center',fontSize:13,color:'rgba(26,26,46,.4)',marginTop:12}}>
            Already have an account? <Link href="/login" style={{color:'#ff3b30',fontWeight:600,textDecoration:'none'}} onClick={onClose}>Log in →</Link>
          </div>
        </>}

        {step === 'details' && <>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:`${plan.color}12`,border:`0.5px solid ${plan.color}40`,borderRadius:100,padding:'4px 12px',fontSize:11,fontWeight:700,color:plan.color,marginBottom:14}}>{plan.name} Plan · ${plan.price}/mo</div>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:900,color:'#1a1a2e',marginBottom:4}}>Almost done</h2>
          <p style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:16}}>Creating account for <strong style={{color:'#1a1a2e'}}>{email}</strong></p>

          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <input placeholder="First name" value={firstName} onChange={e=>setFirstName(e.target.value)} style={inp}/>
            <input placeholder="Last name" value={lastName} onChange={e=>setLastName(e.target.value)} style={inp}/>
          </div>

          <select value={stateName} onChange={e=>setStateName(e.target.value)} style={{...inp,marginBottom:10,appearance:'none' as any}}>
            <option value="">Select your state</option>
            {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s=><option key={s}>{s}</option>)}
          </select>

          <div style={{marginBottom:12}}>
            <div style={{display:'flex',gap:8}}>
              <input placeholder="Promo code (optional)" value={promoCode} autoComplete="off"
                onChange={e=>{setPromoCode(e.target.value.toUpperCase());setPromoValid(null)}}
                style={{...inp,flex:1,letterSpacing:2,textTransform:'uppercase' as any}}/>
              <button onClick={validatePromo} style={{padding:'12px 16px',background:'rgba(0,0,0,.06)',border:'none',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",color:'#1a1a2e'}}>Apply</button>
            </div>
            {promoValid===true  && <div style={{fontSize:12,color:'#30d158',marginTop:5,fontWeight:600}}>✓ Code applied — {promoDays} days free!</div>}
            {promoValid===false && <div style={{fontSize:12,color:'#ff453a',marginTop:5}}>Invalid or expired code</div>}
          </div>

          <input type="password" placeholder="Create a password (8+ characters)" value={password}
            onChange={e=>{setPassword(e.target.value);setError('')}}
            onKeyDown={e=>e.key==='Enter'&&password.length>=8&&handleCreate()}
            style={{...inp,border:`1.5px solid ${error?'#ff453a':'rgba(0,0,0,.1)'}`,marginBottom:error?6:12}}/>
          {error && <div style={{fontSize:12,color:'#ff453a',marginBottom:10}}>{error}</div>}

          <div style={{background:'#f8f7fc',borderRadius:12,padding:'10px 14px',marginBottom:12,fontSize:12,color:'rgba(26,26,46,.6)',lineHeight:1.6}}>
            ✓ 7-day free trial · {plan.name} at ${plan.price}/mo after · Cancel anytime
          </div>

          <button onClick={handleCreate} disabled={password.length<8||loading}
            style={{width:'100%',padding:13,background:password.length>=8&&!loading?plan.gradient:'rgba(0,0,0,.08)',color:password.length>=8&&!loading?'#fff':'rgba(26,26,46,.3)',border:'none',borderRadius:100,fontSize:14,fontWeight:700,cursor:password.length>=8&&!loading?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif",marginBottom:10}}>
            {loading?'Creating account...':'Create account & continue →'}
          </button>
          <button onClick={()=>setStep('gate')} style={{background:'none',border:'none',color:'rgba(26,26,46,.4)',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'block',width:'100%',textAlign:'center'}}>← Back</button>
          <p style={{fontSize:11,color:'rgba(26,26,46,.3)',textAlign:'center',marginTop:12,lineHeight:1.6}}>
            Card required after trial · Cancel anytime · <a href="/terms" style={{color:'#ff3b30'}}>Terms</a> & <a href="/privacy" style={{color:'#ff3b30'}}>Privacy</a>
          </p>
        </>}
      </div>
    </div>
  )
}

export default function PricingPage() {
  const [showModal, setShowModal] = useState(false)
  const [modalPlan, setModalPlan] = useState('core')
  const [notify,    setNotify]    = useState<Record<string,boolean>>({})

  const openPlan = (id: string) => { setModalPlan(id); setShowModal(true) }

  const submitNotify = async (planId: string) => {
    const email = prompt('Enter your email to be notified when ' + planId + ' launches:')
    if (!email || !email.includes('@')) return
    await supabase.from('waitlist').insert({ email, module: planId }).catch(()=>{})
    setNotify(p=>({...p,[planId]:true}))
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;background-image:radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,.09) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,.07) 0%,transparent 50%);font-family:'DM Sans',system-ui,sans-serif;color:#1a1a2e;min-height:100vh;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
      `}</style>

      {showModal && <QuickSignupModal onClose={()=>setShowModal(false)} defaultPlan={modalPlan}/>}

      {/* Nav */}
      <nav style={{position:'fixed',top:0,left:0,right:0,background:'rgba(255,255,255,.65)',backdropFilter:'blur(40px)',borderBottom:'0.5px solid rgba(255,255,255,.92)',zIndex:99,boxShadow:'0 2px 12px rgba(0,0,0,.05)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 24px',maxWidth:1100,margin:'0 auto'}}>
          <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}>
            <GCIcon size={28}/>
            <span style={{fontFamily:"'Sora',sans-serif",fontSize:15,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e'}}>Gratia Core</span>
          </Link>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <Link href="/login" style={{padding:'7px 18px',borderRadius:100,border:'0.5px solid rgba(0,0,0,.1)',background:'rgba(255,255,255,.6)',fontSize:13,fontWeight:600,color:'rgba(26,26,46,.7)',textDecoration:'none'}}>Log in</Link>
            <button onClick={()=>openPlan('core')} style={{padding:'7px 18px',borderRadius:100,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',fontSize:13,fontWeight:700,color:'#fff',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 12px rgba(255,59,48,.3)'}}>Get started →</button>
          </div>
        </div>
      </nav>

      <div style={{maxWidth:960,margin:'0 auto',padding:'110px 24px 80px'}}>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:48,animation:'fadeUp .5s ease both'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(48,209,88,.1)',border:'0.5px solid rgba(48,209,88,.3)',borderRadius:100,padding:'4px 14px',fontSize:11,fontWeight:700,color:'#1a7a35',letterSpacing:.5,textTransform:'uppercase',marginBottom:16}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'#30d158',display:'inline-block',animation:'lp 1.5s ease infinite'}}/>
             Core live now
          </div>
          <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:'clamp(30px,5vw,52px)',fontWeight:900,letterSpacing:-2.5,color:'#1a1a2e',lineHeight:1,marginBottom:14}}>
            Simple, honest pricing
          </h1>
          <p style={{fontSize:15,color:'rgba(26,26,46,.55)',maxWidth:480,margin:'0 auto',lineHeight:1.7}}>
            Start with gas intelligence today. Pro and Enterprise launching soon — founding members get priority access and locked pricing.
          </p>
        </div>

        {/* Founding member callout */}
        <div style={{background:'rgba(255,59,48,.06)',border:'0.5px solid rgba(255,59,48,.2)',borderRadius:24,padding:'22px 26px',marginBottom:32,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,animation:'fadeUp .5s ease .1s both'}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase',marginBottom:6}}>🎁 Founding Member Offer</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:19,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e',marginBottom:4}}>Lock in $4.99/mo Core for 6 months</div>
            <div style={{fontSize:12,color:'rgba(26,26,46,.55)'}}>Use code <strong style={{fontFamily:'monospace',fontSize:14,color:'#ff3b30',letterSpacing:2}}>FOUNDING100</strong> · Rate locked even after we raise prices</div>
          </div>
          <button onClick={()=>openPlan('core')} style={{padding:'12px 24px',borderRadius:100,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 14px rgba(255,59,48,.35)',whiteSpace:'nowrap'}}>
            Claim Founding Price →
          </button>
        </div>

        {/* Plans grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:14,marginBottom:40}}>
          {PLANS.map((plan,i)=>(
            <div key={plan.id} style={{background:'rgba(255,255,255,.65)',backdropFilter:'blur(40px)',border:`0.5px solid ${plan.popular?'rgba(255,59,48,.3)':'rgba(255,255,255,.92)'}`,borderRadius:26,padding:'24px 20px',position:'relative',overflow:'hidden',boxShadow:`0 2px 12px rgba(0,0,0,.06)`,animation:`fadeUp .5s ease ${.05+i*.06}s both`,transition:'transform .25s cubic-bezier(.34,1.56,.64,1)'}}>

              {/* Top accent */}
              {plan.live && <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${plan.color},transparent)`}}/>}

              {/* Popular badge */}
              {plan.popular && <div style={{position:'absolute',top:14,right:14,fontSize:9,fontWeight:700,padding:'2px 10px',borderRadius:100,background:'rgba(255,59,48,.1)',color:'#cc2018',border:'0.5px solid rgba(255,59,48,.25)'}}>Most popular</div>}

              {/* Status badge */}
              <div style={{display:'inline-flex',alignItems:'center',gap:5,background:plan.live?'rgba(48,209,88,.1)':'rgba(0,0,0,.05)',border:`0.5px solid ${plan.live?'rgba(48,209,88,.3)':'rgba(0,0,0,.08)'}`,borderRadius:100,padding:'3px 10px',fontSize:10,fontWeight:700,color:plan.live?'#1a7a35':'rgba(26,26,46,.4)',marginBottom:16}}>
                {plan.badgeLive && <span style={{width:5,height:5,borderRadius:'50%',background:'#30d158',display:'inline-block',animation:'lp 1.5s ease infinite'}}/>}
                {plan.badge}
              </div>

              {/* Name + price */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                <div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e',marginBottom:3}}>{plan.name}</div>
                  <div style={{fontSize:12,color:'rgba(26,26,46,.5)',lineHeight:1.4}}>{plan.desc}</div>
                  {plan.tag && <div style={{fontSize:10,fontWeight:700,color:plan.color,marginTop:4}}>{plan.tag}</div>}
                </div>
                <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
                  {plan.live ? (
                    <>
                      <div style={{fontFamily:"'Sora',sans-serif",fontSize:30,fontWeight:900,letterSpacing:-1.5,color:plan.color,lineHeight:1}}>${plan.price}</div>
                      <div style={{fontSize:11,color:'rgba(26,26,46,.4)'}}>/mo</div>
                    </>
                  ) : (
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:'rgba(26,26,46,.2)',filter:'blur(5px)',userSelect:'none'}}>$--.--</div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div style={{margin:'14px 0',filter:!plan.live?'blur(1.5px)':'none',opacity:!plan.live?.6:1}}>
                {plan.features.map((f,j)=>(
                  <div key={j} style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:12,color:'rgba(26,26,46,.7)',marginBottom:7,lineHeight:1.4}}>
                    <span style={{color:plan.color,fontWeight:700,flexShrink:0,fontSize:11,marginTop:1}}>✓</span>{f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              {plan.live ? (
                <button onClick={()=>openPlan(plan.id)}
                  style={{width:'100%',padding:12,borderRadius:100,border:'none',background:plan.gradient,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 14px ${plan.color}40`,marginTop:4}}>
                  {plan.cta}
                </button>
              ) : (
                <button onClick={()=>submitNotify(plan.id)}
                  style={{width:'100%',padding:12,borderRadius:100,background:notify[plan.id]?'rgba(48,209,88,.08)':'rgba(0,0,0,.05)',border:`0.5px solid ${notify[plan.id]?'rgba(48,209,88,.3)':'rgba(0,0,0,.08)'}`,fontSize:13,fontWeight:600,color:notify[plan.id]?'#1a7a35':'rgba(26,26,46,.4)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",marginTop:4}}>
                  {notify[plan.id]?'✓ You\'re on the list':plan.cta}
                </button>
              )}

              {plan.live && <p style={{fontSize:10,color:'rgba(26,26,46,.3)',textAlign:'center',marginTop:8,lineHeight:1.5}}>Card required · Not charged for 7 days · Cancel anytime</p>}
            </div>
          ))}
        </div>

       

        {/* Trust signals */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,animation:'fadeUp .5s ease .35s both'}}>
          {[
            {icon:'🔒',title:'Stripe secured',sub:'Card data never touches our servers'},
            {icon:'📅',title:'Cancel anytime',sub:'No contracts, no cancellation fees'},
            {icon:'🗑️',title:'Account deletion',sub:'Cancel = 30-day grace then full deletion'},
          ].map((t,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,.65)',backdropFilter:'blur(40px)',border:'0.5px solid rgba(255,255,255,.92)',borderRadius:18,padding:'14px',textAlign:'center'}}>
              <div style={{fontSize:22,marginBottom:5}}>{t.icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:'#1a1a2e',marginBottom:2}}>{t.title}</div>
              <div style={{fontSize:11,color:'rgba(26,26,46,.45)',lineHeight:1.4}}>{t.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}