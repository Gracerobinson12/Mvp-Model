'use client'
// @ts-nocheck
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import { Suspense } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
// Step 1 (email/password) is REMOVED — user already signed up via the modal
// Steps are now: 1=AccountType, 2=UserType, 3=MoneyHook, 4=Location/Alerts, 5=PlanReveal
type Step = 1 | 2 | 3 | 4 | 5

type Profile = {
  accountType:  'personal' | 'business' | null
  userType:     string
  zip:          string
  alertEmail:   boolean
  alertSMS:     boolean
  alertWeekly:  boolean
  plan:         string
}

const PERSONAL_TYPES = [
  { id:'driver',     emoji:'🚗', label:'Rideshare & Delivery',   sub:'Uber, Lyft, DoorDash, Instacart' },
  { id:'freelancer', emoji:'💼', label:'Freelancer / Contractor', sub:'Design, dev, writing, consulting' },
  { id:'trades',     emoji:'🔨', label:'Trades / Contractor',     sub:'Plumbing, electric, construction' },
  { id:'seller',     emoji:'📦', label:'Online Seller',           sub:'eBay, Etsy, Amazon, Shopify' },
  { id:'creative',   emoji:'🎨', label:'Creative Professional',   sub:'Photographer, artist, musician' },
  { id:'other',      emoji:'⚡', label:'Other Self-Employed',     sub:'Any independent work' },
]

const BUSINESS_TYPES = [
  { id:'restaurant',   emoji:'🍽️', label:'Food & Beverage',       sub:'Restaurant, cafe, catering, bar' },
  { id:'dispensary',   emoji:'🌿', label:'Cannabis / Dispensary',  sub:'Retail, delivery, cultivation' },
  { id:'healthcare',   emoji:'🏥', label:'Healthcare',             sub:'Clinic, dental, med spa, therapy' },
  { id:'retail',       emoji:'🛒', label:'Retail / E-commerce',    sub:'Store, boutique, online shop' },
  { id:'trucking',     emoji:'🚛', label:'Trucking / Logistics',   sub:'Fleet, freight, delivery ops' },
  { id:'construction', emoji:'🏗️', label:'Construction / Trades', sub:'GC, subcontractor, developer' },
  { id:'services',     emoji:'💈', label:'Personal Services',      sub:'Salon, spa, fitness, childcare' },
  { id:'tech',         emoji:'💻', label:'Tech / Agency',          sub:'SaaS, dev shop, marketing' },
  { id:'importer',     emoji:'🌐', label:'Import / Export',        sub:'Manufacturer, distributor' },
  { id:'realestate',   emoji:'🏠', label:'Real Estate',            sub:'Property mgmt, investor, agent' },
  { id:'otherbiz',     emoji:'🏢', label:'Other Business',         sub:'Describe your industry' },
]

const TYPE_COLORS = {
  driver:'#ff3b30', freelancer:'#0a84ff', trades:'#ff9f0a',
  seller:'#bf5af2', creative:'#ff375f',   other:'#636366',
  restaurant:'#ff9f0a', dispensary:'#30d158', healthcare:'#5ac8fa',
  retail:'#bf5af2', trucking:'#ff6b35', construction:'#ffd60a',
  services:'#ff375f', tech:'#0a84ff', importer:'#32ade6',
  realestate:'#34c759', otherbiz:'#636366',
}

const PERSONAL_HOOKS = {
  driver: {
    headline:'Most drivers leave $8,700+ on the table every year.',
    risks:[
      {level:'red',    text:'Mileage deductions missed — avg $8,736/yr unclaimed by drivers'},
      {level:'red',    text:'IRS contractor audit risk is rising for gig workers'},
      {level:'yellow', text:'Gas prices up 12% this quarter — route optimization saves real money'},
    ],
    sliderLabel:'How many miles do you drive for work per week?',
    sliderMin:50, sliderMax:600, sliderStep:10, sliderUnit:'mi/wk',
    calcLabel:'At {val} miles/week you could claim',
    calcFn:(v)=>`$${(v*52*0.70).toLocaleString()}`,
    calcNote:'per year in IRS mileage deductions — most drivers never claim this',
  },
  freelancer: {
    headline:'Freelancers miss an average of $5,760 in deductions annually.',
    risks:[
      {level:'red',    text:'Home office deduction — most freelancers never claim it'},
      {level:'red',    text:'Self-employed health insurance deduction often missed entirely'},
      {level:'yellow', text:'New 1099-K rules affect anyone earning $600+ on platforms'},
    ],
    sliderLabel:'What is your average monthly freelance income?',
    sliderMin:500, sliderMax:15000, sliderStep:250, sliderUnit:'$/mo',
    calcLabel:'At ${val}/mo you could deduct',
    calcFn:(v)=>`$${Math.round(v*0.28*12).toLocaleString()}`,
    calcNote:'per year — reducing your tax bill significantly',
  },
  other: {
    headline:'Self-employed workers miss an average of $4,200/year in deductions.',
    risks:[
      {level:'red',    text:'Mileage and vehicle expenses — the biggest missed deduction'},
      {level:'red',    text:'Home office deduction — most self-employed people never claim it'},
      {level:'yellow', text:'Health insurance premiums are deductible for self-employed workers'},
    ],
    sliderLabel:'What is your average monthly self-employment income?',
    sliderMin:500, sliderMax:15000, sliderStep:250, sliderUnit:'$/mo',
    calcLabel:'At ${val}/mo you could deduct',
    calcFn:(v)=>`$${Math.round(v*0.26*12).toLocaleString()}`,
    calcNote:'per year in business deductions',
  },
}

const BUSINESS_HOOKS = {
  restaurant: {
    headline:'Restaurants face more compliance changes right now than any other industry.',
    risks:[
      {level:'red',    text:'Beef & produce import tariffs up 18–26% this quarter — hitting your margins'},
      {level:'red',    text:'Minimum wage changing in 12 states in the next 90 days'},
      {level:'yellow', text:'FDA menu labeling rule update pending — affects all dine-in operations'},
    ],
    sliderLabel:'What is your average monthly food & supply cost?',
    sliderMin:1000, sliderMax:50000, sliderStep:500, sliderUnit:'$/mo',
    calcLabel:'At ${val}/mo in food costs, tariff exposure is',
    calcFn:(v)=>`$${Math.round(v*0.22*12).toLocaleString()}`,
    calcNote:'per year in additional import costs you may not have priced in yet',
  },
  default: {
    headline:'Most businesses miss thousands in compliance savings every year.',
    risks:[
      {level:'red',    text:'Regulatory changes specific to your industry updated this month'},
      {level:'red',    text:'Tax deductions for your business type often go unclaimed'},
      {level:'yellow', text:'Tariff changes may be affecting your supply chain costs'},
    ],
    sliderLabel:'What is your average monthly operating cost?',
    sliderMin:1000, sliderMax:50000, sliderStep:500, sliderUnit:'$/mo',
    calcLabel:'At ${val}/mo in costs, compliance savings potential is',
    calcFn:(v)=>`$${Math.round(v*0.12*12).toLocaleString()}`,
    calcNote:'per year in deductions and compliance cost avoidance',
  },
}

const PLANS = {
  driver:      { name:'Driver Pass',     price:'$4.99/mo', roi:'145x', roiLabel:'vs avg unclaimed deductions',
    bullets:['Real-time gas prices near you','Route gas finder — cheapest stop on any trip','Full mileage log + IRS report exports','Instant gas price drop alerts','Quarterly tax deadline reminders'] },
  freelancer:  { name:'Freelancer Pass', price:'$7.99/mo', roi:'60x',  roiLabel:'vs avg deductions found',
    bullets:['Full deduction teller — all categories','Monthly deduction PDF summary','Home office + equipment tracking','Quarterly estimated tax reminders','IRS rule change alerts'] },
  default_personal: { name:'Personal Pass', price:'$4.99/mo', roi:'80x', roiLabel:'vs avg annual savings found',
    bullets:['Gas tracker — cheapest near you','Full mileage deduction calculator','IRS update alerts for your work type','Quarterly tax reminders','Early access to all new modules'] },
  restaurant:  { name:'Business Pass',   price:'$14.99/mo', roi:'17x', roiLabel:'avg restaurant saves annually',
    bullets:['Food tariff tracker — live import prices','Minimum wage alerts by state','FDA & health code regulatory feed','Labor law compliance updates','Assets & liabilities dashboard'] },
  default_business: { name:'Business Pass', price:'$14.99/mo', roi:'17x', roiLabel:'avg business saves annually',
    bullets:['Industry-specific regulatory feed','Tariff intelligence for your sector','Assets & liabilities dashboard','Monthly deduction summary','Balance sheet PDF export'] },
}

function OnboardingContent() {
  const router     = useRouter()
  const params     = useSearchParams()
  const prefill    = params.get('prefill') || ''

  // ── Session state — loaded from Supabase, no re-entry needed ──
  const [user,      setUser]      = useState(null)
  const [loading,   setLoading]   = useState(true)

  // ── Onboarding state ──
  const [step,      setStep]      = useState<Step>(1)
  const [animating, setAnimating] = useState(false)
  const [sliderVal, setSliderVal] = useState(300)
  const [profile,   setProfile]   = useState<Profile>({
    accountType:  null,
    userType:     prefill || '',
    zip:          '',
    alertEmail:   true,
    alertSMS:     false,
    alertWeekly:  true,
    plan:         'free',
  })

  // ── Load existing session on mount — never ask for email/password again ──
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Not logged in — send back to home
        router.push('/')
        return
      }
      setUser(user)

      // Load their existing profile to pre-fill anything we know
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_type, account_type, zip_code')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        setProfile(p => ({
          ...p,
          userType:    existingProfile.user_type    || prefill || '',
          accountType: existingProfile.account_type as any || null,
          zip:         existingProfile.zip_code     || '',
        }))

        // If we already know their account type and user type, skip ahead
        if (existingProfile.account_type && existingProfile.user_type) {
          setStep(3) // skip to money hook
        } else if (existingProfile.account_type) {
          setStep(2) // skip to user type selection
        }
      } else if (prefill) {
        // We know their user type from the modal, try to infer account type
        const isBusinessType = ['restaurant','dispensary','healthcare','retail','trucking','construction','services','tech','importer','realestate','otherbiz'].includes(prefill)
        setProfile(p => ({
          ...p,
          accountType: isBusinessType ? 'business' : 'personal',
          userType: prefill,
        }))
        setStep(3) // skip straight to money hook since we know type
      }

      setLoading(false)
    }
    init()
  }, [])

  // ── Save everything to Supabase and go to dashboard ──
  const finish = async (selectedPlan: string) => {
    if (!user) return
    await supabase.from('profiles').update({
      onboarded:    true,
      user_type:    profile.userType,
      account_type: profile.accountType,
      zip_code:     profile.zip,
      plan:         'free', // Stripe handles paid plan separately
    }).eq('id', user.id)
    router.push('/dashboard')
  }

  const accent = profile.userType ? (TYPE_COLORS[profile.userType] || '#ff3b30') : '#ff3b30'
  const isPersonal = profile.accountType === 'personal'
  const isBusiness = profile.accountType === 'business'
  const hookData = isPersonal
    ? (PERSONAL_HOOKS[profile.userType] || PERSONAL_HOOKS.other)
    : (BUSINESS_HOOKS[profile.userType] || BUSINESS_HOOKS.default)
  const planData = (() => {
    if (PLANS[profile.userType]) return PLANS[profile.userType]
    return isPersonal ? PLANS.default_personal : PLANS.default_business
  })()

  const totalSteps = 5
  const progress   = ((step - 1) / (totalSteps - 1)) * 100
  const stepLabels = ['Account Type','Your Profile','Your Situation','Preferences','Your Plan']

  const goTo = useCallback((target: Step) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => { setStep(target); setAnimating(false) }, 180)
  }, [animating])

  const next = (updates?: Partial<Profile>) => {
    if (updates) setProfile(p => ({...p, ...updates}))
    goTo((step + 1) as Step)
  }
  const back = () => step > 1 && goTo((step - 1) as Step)

  const hookCalcLabel = hookData.calcLabel
    .replace('{val}', sliderVal.toLocaleString())
    .replace('${val}', sliderVal.toLocaleString())
  const hookValue = hookData.calcFn(sliderVal)

  const inputStyle = {
    width:'100%', padding:'13px 16px',
    background:'rgba(0,0,0,.04)',
    border:'1.5px solid rgba(0,0,0,.09)',
    borderRadius:14, fontSize:15, fontWeight:500,
    color:'#1a1a2e', outline:'none',
    fontFamily:"'DM Sans',system-ui,sans-serif",
    transition:'border-color .2s',
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0eff4',fontFamily:"'DM Sans',sans-serif",color:'rgba(26,26,46,.5)',fontSize:14}}>
      Loading your profile...
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        body{font-family:'DM Sans',system-ui,sans-serif;background:#f0eff4;color:#1a1a2e;overflow-x:hidden}
        body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 70% 50% at 15% 10%,rgba(255,59,48,.07) 0%,transparent 60%),linear-gradient(160deg,#f5f4f9 0%,#eceaf2 100%);pointer-events:none;z-index:0}
        :root{--accent:${accent}}
        @keyframes cardIn{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}
        input:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px rgba(255,59,48,.1)!important;background:rgba(255,255,255,.8)!important}
        input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;background:rgba(0,0,0,.1);outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--accent);box-shadow:0 2px 8px rgba(255,59,48,.4);border:2.5px solid #fff;cursor:pointer;transition:transform .15s}
        input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.15)}
        .opt-btn:hover{background:rgba(255,255,255,.85)!important;transform:translateY(-2px)!important}
        .big-opt:hover{background:rgba(255,255,255,.9)!important;transform:translateY(-2px)!important}
        .alert-row:hover{background:rgba(255,255,255,.7)!important}
      `}</style>

      <div style={{position:'relative',zIndex:1,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 16px 60px'}}>

        {/* Top bar */}
        <div style={{width:'100%',maxWidth:560,display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:36}}>
          <Link href="/" style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',textDecoration:'none',display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:accent,boxShadow:`0 0 8px ${accent}55`}}/>
            GratIA<span style={{color:accent}}>Core</span>
          </Link>
          {/* Show user email so they know we remember them */}
          <div style={{fontSize:12,color:'rgba(26,26,46,.4)',fontWeight:500}}>
            {user?.email}
          </div>
        </div>

        {/* Progress */}
        <div style={{width:'100%',maxWidth:560,marginBottom:32}}>
          <div style={{height:3,background:'rgba(0,0,0,.08)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${progress}%`,background:accent,borderRadius:2,transition:'width .5s cubic-bezier(.4,0,.2,1)',boxShadow:`0 0 8px ${accent}55`}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:7,fontSize:10,fontWeight:600,letterSpacing:.5,color:'rgba(26,26,46,.35)',textTransform:'uppercase'}}>
            <span>Step {step} of {totalSteps}</span>
            <span>{stepLabels[step-1]}</span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          width:'100%', maxWidth:560,
          background:'rgba(255,255,255,.78)',
          border:'1px solid rgba(255,255,255,.95)',
          borderRadius:28, padding:'36px 32px',
          backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
          boxShadow:'0 2px 8px rgba(0,0,0,.05),0 16px 48px rgba(0,0,0,.07),inset 0 1px 0 rgba(255,255,255,1)',
          animation:'cardIn .3s cubic-bezier(.34,1.56,.64,1) both',
          opacity: animating ? 0 : 1,
          transition:'opacity .18s',
        }}>

          {/* ── STEP 1: Account Type (was step 2) ── */}
          {step === 1 && (
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'2px',color:accent,textTransform:'uppercase',marginBottom:10}}>Step 1 · Account Type</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:8,lineHeight:1.15}}>
                Welcome back!<br/>Who is this for?
              </div>
              <div style={{fontSize:14,color:'rgba(26,26,46,.5)',marginBottom:26}}>
                We'll personalize your entire dashboard based on this.
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[
                  {type:'personal', icon:'👤', bg:'linear-gradient(135deg,#ff3b30,#ff6b35)', label:'Just Me', sub:'Freelancer, gig worker, independent contractor'},
                  {type:'business', icon:'🏢', bg:'linear-gradient(135deg,#0a84ff,#30a0ff)', label:'My Business', sub:'I own or manage a business with operations'},
                ].map(o=>(
                  <button key={o.type} className="big-opt" onClick={()=>next({accountType:o.type as any})} style={{
                    display:'flex',alignItems:'center',gap:16,padding:'20px 18px',
                    background:'rgba(0,0,0,.03)',border:'1.5px solid rgba(0,0,0,.08)',
                    borderRadius:18,cursor:'pointer',textAlign:'left',
                    fontFamily:"'DM Sans',sans-serif",transition:'all .25s cubic-bezier(.34,1.56,.64,1)',
                  }}>
                    <div style={{width:50,height:50,borderRadius:14,background:o.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0,boxShadow:'0 4px 12px rgba(0,0,0,.12)'}}>
                      {o.icon}
                    </div>
                    <div>
                      <div style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:700,color:'#1a1a2e',marginBottom:3}}>{o.label}</div>
                      <div style={{fontSize:13,color:'rgba(26,26,46,.5)'}}>{o.sub}</div>
                    </div>
                    <span style={{marginLeft:'auto',fontSize:18,color:'rgba(26,26,46,.2)'}}>›</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: User Type (was step 3) ── */}
          {step === 2 && (
            <div>
              <button onClick={back} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(26,26,46,.4)',fontSize:13,fontWeight:500,padding:'0 0 20px',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:5}}>← Back</button>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'2px',color:accent,textTransform:'uppercase',marginBottom:10}}>Step 2 · Your Profile</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:8,lineHeight:1.15}}>
                {isPersonal ? 'What kind of work do you do?' : 'What type of business do you run?'}
              </div>
              <div style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:22}}>
                {isPersonal ? "We'll show you deductions and tools that fit your work." : "We'll filter compliance updates to your industry."}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
                {(isPersonal ? PERSONAL_TYPES : BUSINESS_TYPES).map(t=>(
                  <button key={t.id} className="opt-btn" onClick={()=>{
                    const h = isPersonal ? (PERSONAL_HOOKS[t.id]||PERSONAL_HOOKS.other) : (BUSINESS_HOOKS[t.id]||BUSINESS_HOOKS.default)
                    setSliderVal(Math.round((h.sliderMin+h.sliderMax)/2))
                    next({userType:t.id})
                  }} style={{
                    display:'flex',flexDirection:'column',alignItems:'flex-start',gap:4,
                    padding:'14px',borderRadius:14,background:'rgba(0,0,0,.03)',
                    border:`1.5px solid ${profile.userType===t.id?TYPE_COLORS[t.id]:'rgba(0,0,0,.08)'}`,
                    cursor:'pointer',textAlign:'left',
                    transition:'all .2s cubic-bezier(.34,1.56,.64,1)',
                    fontFamily:"'DM Sans',sans-serif",
                  }}>
                    <span style={{fontSize:22}}>{t.emoji}</span>
                    <span style={{fontSize:13,fontWeight:700,color:'#1a1a2e',lineHeight:1.2}}>{t.label}</span>
                    <span style={{fontSize:11,color:'rgba(26,26,46,.45)',lineHeight:1.3}}>{t.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Money Hook (was step 4) ── */}
          {step === 3 && (
            <div>
              <button onClick={back} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(26,26,46,.4)',fontSize:13,fontWeight:500,padding:'0 0 20px',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:5}}>← Back</button>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'2px',color:accent,textTransform:'uppercase',marginBottom:10}}>
                Step 3 · {isPersonal ? 'Your Deductions' : 'Your Risks'}
              </div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:8,lineHeight:1.15}}>
                {isPersonal ? "Here's what you might be missing" : "Here's what's affecting you now"}
              </div>
              <div style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:20,lineHeight:1.6}}>{hookData.headline}</div>

              <div style={{marginBottom:20}}>
                {hookData.risks.map((r,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'11px 14px',borderRadius:12,marginBottom:8,fontSize:13,lineHeight:1.45,background:r.level==='red'?'rgba(255,59,48,.07)':'rgba(255,159,10,.07)',border:`1px solid ${r.level==='red'?'rgba(255,59,48,.15)':'rgba(255,159,10,.2)'}`,color:'rgba(26,26,46,.8)'}}>
                    <div style={{width:7,height:7,borderRadius:'50%',marginTop:4,flexShrink:0,background:r.level==='red'?'#ff3b30':'#ff9f0a'}}/>
                    {r.text}
                  </div>
                ))}
              </div>

              <div style={{background:`${accent}0D`,border:`1px solid ${accent}22`,borderRadius:18,padding:'18px 20px',marginBottom:22}}>
                <div style={{fontSize:11,fontWeight:600,letterSpacing:'1px',color:'rgba(26,26,46,.5)',textTransform:'uppercase',marginBottom:14}}>
                  {hookData.sliderLabel}
                </div>
                <input type="range" min={hookData.sliderMin} max={hookData.sliderMax} step={hookData.sliderStep} value={sliderVal} onChange={e=>setSliderVal(+e.target.value)} style={{marginBottom:6}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'rgba(26,26,46,.35)',marginBottom:18}}>
                  <span>{hookData.sliderUnit==='mi/wk'?`${hookData.sliderMin} mi`:`$${hookData.sliderMin.toLocaleString()}`}</span>
                  <span style={{color:accent,fontWeight:700,fontSize:15}}>
                    {hookData.sliderUnit==='mi/wk'?`${sliderVal} mi/wk`:`$${sliderVal.toLocaleString()}/mo`}
                  </span>
                  <span>{hookData.sliderUnit==='mi/wk'?`${hookData.sliderMax} mi`:`$${hookData.sliderMax.toLocaleString()}`}</span>
                </div>
                <div style={{paddingTop:14,borderTop:`1px solid ${accent}18`}}>
                  <div style={{fontSize:12,color:'rgba(26,26,46,.5)',marginBottom:4}}>{hookCalcLabel}</div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:46,fontWeight:900,letterSpacing:-3,color:accent,lineHeight:1}}>{hookValue}</div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.4)',marginTop:4}}>{hookData.calcNote}</div>
                </div>
              </div>

              <button onClick={()=>next()} style={{width:'100%',padding:14,background:`linear-gradient(135deg,#ff3b30,#ff6b35)`,color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 16px rgba(255,59,48,.35)'}}>
                {isPersonal ? 'Show Me My Savings →' : 'Show Me My Risks →'}
              </button>
            </div>
          )}

          {/* ── STEP 4: Location + Alerts (was step 5) ── */}
          {step === 4 && (
            <div>
              <button onClick={back} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(26,26,46,.4)',fontSize:13,fontWeight:500,padding:'0 0 20px',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:5}}>← Back</button>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'2px',color:accent,textTransform:'uppercase',marginBottom:10}}>Step 4 · {isPersonal ? 'Your Location' : 'Preferences'}</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:8,lineHeight:1.15}}>
                {isPersonal ? 'Where are you based?' : 'Stay ahead of every change'}
              </div>
              <div style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:24,lineHeight:1.6}}>
                {isPersonal ? 'We use your location to find gas stations near you — nothing else.' : 'Set your location and how you want to be notified.'}
              </div>

              <div style={{marginBottom:24}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:10}}>
                  {isPersonal ? 'Your Location — Used for Gas Prices Near You' : 'Business Location'}
                </div>
                <div style={{display:'flex',gap:10,marginBottom:8}}>
                  <button onClick={()=>{ navigator.geolocation?.getCurrentPosition(pos=>setProfile(p=>({...p,zip:`${pos.coords.latitude.toFixed(3)},${pos.coords.longitude.toFixed(3)}`})),()=>{}) }}
                    style={{flex:1,padding:12,background:`linear-gradient(135deg,#ff3b30,#ff6b35)`,color:'#fff',border:'none',borderRadius:14,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:'0 4px 12px rgba(255,59,48,.3)'}}>
                    📍 Use My Location
                  </button>
                  <div style={{display:'flex',alignItems:'center',gap:8,flex:'0 0 auto',background:'rgba(0,0,0,.04)',border:'1.5px solid rgba(0,0,0,.09)',borderRadius:14,padding:'0 14px'}}>
                    <span style={{fontSize:13,color:'rgba(26,26,46,.4)',fontWeight:600}}>ZIP</span>
                    <input type="text" maxLength={5} placeholder="30309" value={profile.zip.length<=5?profile.zip:''} onChange={e=>setProfile(p=>({...p,zip:e.target.value.replace(/\D/g,'').slice(0,5)}))}
                      style={{background:'transparent',border:'none',outline:'none',fontSize:18,fontWeight:700,color:accent,width:70,fontFamily:"'DM Sans',sans-serif",letterSpacing:2}}/>
                  </div>
                </div>
                {profile.zip && <div style={{fontSize:12,color:'#30d158',fontWeight:600}}>✓ Location set</div>}
              </div>

              <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:12}}>Notification Preferences</div>

              {[
                {key:'alertEmail',  icon:'⛽', label:isPersonal?'Gas Prices Drop Near Me':'Regulatory Change Alerts',   sub:isPersonal?'Email alert when prices fall in your area':'Email when rules affecting your business change', on:profile.alertEmail,  set:(v)=>setProfile(p=>({...p,alertEmail:v}))},
                {key:'alertWeekly', icon:'📅', label:isPersonal?'Weekly Fuel Cost Summary':'Weekly Compliance Digest',   sub:isPersonal?'Your mileage deduction estimate every Monday':'Summary of all changes every Monday at 8am',     on:profile.alertWeekly, set:(v)=>setProfile(p=>({...p,alertWeekly:v}))},
                {key:'alertSMS',    icon:'💬', label:'Urgent Alerts via SMS',                                           sub:'Text for high-impact changes only · Pro feature',                                                     on:profile.alertSMS,    set:(v)=>setProfile(p=>({...p,alertSMS:v}))},
              ].map(a=>(
                <div key={a.key} className="alert-row" onClick={()=>a.set(!a.on)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',background:a.on?`${accent}08`:'rgba(0,0,0,.03)',border:`1.5px solid ${a.on?`${accent}22`:'rgba(0,0,0,.08)'}`,borderRadius:14,marginBottom:8,cursor:'pointer',transition:'all .2s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,59,48,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{a.icon}</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:'#1a1a2e'}}>{a.label}</div>
                      <div style={{fontSize:11,color:'rgba(26,26,46,.45)'}}>{a.sub}</div>
                    </div>
                  </div>
                  <div style={{width:44,height:26,borderRadius:13,background:a.on?accent:'rgba(0,0,0,.15)',position:'relative',transition:'background .25s',flexShrink:0}}>
                    <div style={{position:'absolute',top:3,left:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'transform .25s cubic-bezier(.34,1.56,.64,1)',transform:a.on?'translateX(18px)':'translateX(0)',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
                  </div>
                </div>
              ))}

              <button onClick={()=>next()} style={{width:'100%',padding:14,background:`linear-gradient(135deg,#ff3b30,#ff6b35)`,color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",marginTop:6,boxShadow:'0 4px 16px rgba(255,59,48,.35)'}}>
                See My Plan →
              </button>
            </div>
          )}

          {/* ── STEP 5: Plan Reveal (was step 6) ── */}
          {step === 5 && (
            <div>
              <button onClick={back} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(26,26,46,.4)',fontSize:13,fontWeight:500,padding:'0 0 20px',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:5}}>← Back</button>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'2px',color:accent,textTransform:'uppercase',marginBottom:10}}>Step 5 · Your Plan</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:6,lineHeight:1.15}}>
                Built for {isPersonal ? 'how you work' : 'your business'}
              </div>
              <div style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:22}}>Based on your profile, here's what we recommend.</div>

              <div style={{background:'rgba(255,255,255,.8)',border:`2px solid ${accent}`,borderRadius:20,padding:22,marginBottom:14,position:'relative',overflow:'hidden',boxShadow:`0 0 0 1px ${accent}18,0 8px 32px ${accent}14`}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${accent},transparent)`}}/>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:accent,textTransform:'uppercase',marginBottom:5}}>⭐ Recommended</div>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e'}}>{planData.name}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:30,fontWeight:900,letterSpacing:-1.5,color:accent,lineHeight:1}}>{planData.price.replace('/mo','')}</div>
                    <div style={{fontSize:12,color:'rgba(26,26,46,.4)'}}>/mo</div>
                  </div>
                </div>

                <ul style={{listStyle:'none',marginBottom:16}}>
                  {planData.bullets.map((b,i)=>(
                    <li key={i} style={{display:'flex',alignItems:'flex-start',gap:9,fontSize:13,color:'rgba(26,26,46,.75)',marginBottom:8,lineHeight:1.4}}>
                      <span style={{color:accent,fontWeight:700,fontSize:13,marginTop:1,flexShrink:0}}>✓</span>{b}
                    </li>
                  ))}
                </ul>

                <div style={{background:`${accent}0A`,border:`1px solid ${accent}18`,borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:11,color:'rgba(26,26,46,.5)'}}>{planData.roiLabel}</div>
                    <div style={{fontSize:10,color:'rgba(26,26,46,.3)',marginTop:2}}>Plan costs {planData.price.replace('/mo','')}/mo</div>
                  </div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,color:accent,letterSpacing:-1}}>{planData.roi} ROI</div>
                </div>
              </div>

              <button onClick={()=>finish('paid')} style={{width:'100%',padding:14,background:`linear-gradient(135deg,#ff3b30,#ff6b35)`,color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",marginBottom:10,boxShadow:'0 4px 16px rgba(255,59,48,.35)'}}>
                Start {planData.name} — {planData.price} →
              </button>
              <button onClick={()=>finish('free')} style={{width:'100%',padding:12,background:'transparent',color:'rgba(26,26,46,.5)',border:'1.5px solid rgba(0,0,0,.1)',borderRadius:100,fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                Continue with Free Plan
              </button>

              <p style={{fontSize:11,color:'rgba(26,26,46,.3)',textAlign:'center',marginTop:16,lineHeight:1.6}}>
                Cancel anytime · No contracts · 7-day free trial on paid plans
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',
        justifyContent:'center',background:'#f0eff4',
        fontFamily:"'DM Sans',sans-serif",color:'rgba(26,26,46,.5)',fontSize:14}}>
        Loading...
      </div>
    }>
      <OnboardingContent/>
    </Suspense>
  )
}