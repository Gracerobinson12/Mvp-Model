'use client'
// @ts-nocheck
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5 | 6

type Profile = {
  email:        string
  password:     string
  accountType:  'personal' | 'business' | null
  userType:     string
  zip:          string
  alertEmail:   boolean
  alertSMS:     boolean
  alertWeekly:  boolean
  plan:         string
}

// ── User type lists ───────────────────────────────────────────────────────────
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

// ── Accent colors per type ────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  driver:'#ff3b30', freelancer:'#0a84ff', trades:'#ff9f0a',
  seller:'#bf5af2', creative:'#ff375f',   other:'#636366',
  restaurant:'#ff9f0a', dispensary:'#30d158', healthcare:'#5ac8fa',
  retail:'#bf5af2', trucking:'#ff6b35', construction:'#ffd60a',
  services:'#ff375f', tech:'#0a84ff', importer:'#32ade6',
  realestate:'#34c759', otherbiz:'#636366',
}

// ── PERSONAL money hooks ──────────────────────────────────────────────────────
// These are shown on Step 4 for personal users only
const PERSONAL_HOOKS: Record<string, {
  headline: string
  risks: Array<{level:'red'|'yellow', text:string}>
  sliderLabel: string
  sliderMin: number; sliderMax: number; sliderStep: number
  sliderUnit: string
  calcLabel: string
  calcFn: (v:number) => string
  calcNote: string
}> = {
  driver: {
    headline:   'Most drivers leave $8,700+ on the table every year.',
    risks: [
      {level:'red',    text:'Mileage deductions missed — avg $8,736/yr unclaimed by drivers'},
      {level:'red',    text:'IRS contractor audit risk is rising for gig workers'},
      {level:'yellow', text:'Gas prices up 12% this quarter — route optimization saves real money'},
    ],
    sliderLabel: 'How many miles do you drive for work per week?',
    sliderMin:50, sliderMax:600, sliderStep:10, sliderUnit:'mi/wk',
    calcLabel:   'At {val} miles/week you could claim',
    calcFn:      (v) => `$${(v * 52 * 0.70).toLocaleString()}`,
    calcNote:    'per year in IRS mileage deductions — most drivers never claim this',
  },
  freelancer: {
    headline:   'Freelancers miss an average of $5,760 in deductions annually.',
    risks: [
      {level:'red',    text:'Home office deduction — most freelancers never claim it'},
      {level:'red',    text:'Self-employed health insurance deduction often missed entirely'},
      {level:'yellow', text:'New 1099-K rules affect anyone earning $600+ on platforms'},
    ],
    sliderLabel: 'What is your average monthly freelance income?',
    sliderMin:500, sliderMax:15000, sliderStep:250, sliderUnit:'$/mo',
    calcLabel:   'At ${val}/mo you could deduct',
    calcFn:      (v) => `$${Math.round(v * 0.28 * 12).toLocaleString()}`,
    calcNote:    'per year — reducing your tax bill significantly',
  },
  trades: {
    headline:   'Contractors miss thousands in tools, vehicle, and home office deductions.',
    risks: [
      {level:'red',    text:'Vehicle & mileage deductions — major write-off most contractors underreport'},
      {level:'red',    text:'Tools and equipment — fully deductible in year of purchase (Section 179)'},
      {level:'yellow', text:'Licensing & certification renewals are 100% deductible'},
    ],
    sliderLabel: 'How many miles do you drive for jobs per week?',
    sliderMin:50, sliderMax:600, sliderStep:10, sliderUnit:'mi/wk',
    calcLabel:   'At {val} miles/week you could claim',
    calcFn:      (v) => `$${(v * 52 * 0.70).toLocaleString()}`,
    calcNote:    'per year in mileage deductions alone',
  },
  seller: {
    headline:   'Online sellers often miss 30–40% of their eligible deductions.',
    risks: [
      {level:'red',    text:'Shipping, packaging, and platform fees are fully deductible'},
      {level:'red',    text:'Home office and storage space deduction often ignored'},
      {level:'yellow', text:'New IRS reporting: platforms report $600+ earnings to the IRS'},
    ],
    sliderLabel: 'What is your average monthly sales revenue?',
    sliderMin:500, sliderMax:20000, sliderStep:250, sliderUnit:'$/mo',
    calcLabel:   'At ${val}/mo revenue your deductions could total',
    calcFn:      (v) => `$${Math.round(v * 0.22 * 12).toLocaleString()}`,
    calcNote:    'per year — putting real money back in your pocket',
  },
  creative: {
    headline:   'Creative professionals have some of the richest deduction opportunities.',
    risks: [
      {level:'red',    text:'Equipment, software, and subscriptions — fully deductible'},
      {level:'red',    text:'Home studio or office space deduction — most creatives skip this'},
      {level:'yellow', text:'Education and courses in your craft are 100% deductible'},
    ],
    sliderLabel: 'What is your average monthly creative income?',
    sliderMin:500, sliderMax:15000, sliderStep:250, sliderUnit:'$/mo',
    calcLabel:   'At ${val}/mo you could deduct',
    calcFn:      (v) => `$${Math.round(v * 0.25 * 12).toLocaleString()}`,
    calcNote:    'per year in legitimate business deductions',
  },
  other: {
    headline:   'Self-employed workers miss an average of $4,200/year in deductions.',
    risks: [
      {level:'red',    text:'Mileage and vehicle expenses — the biggest missed deduction'},
      {level:'red',    text:'Home office deduction — most self-employed people never claim it'},
      {level:'yellow', text:'Health insurance premiums are deductible for self-employed workers'},
    ],
    sliderLabel: 'What is your average monthly self-employment income?',
    sliderMin:500, sliderMax:15000, sliderStep:250, sliderUnit:'$/mo',
    calcLabel:   'At ${val}/mo you could deduct',
    calcFn:      (v) => `$${Math.round(v * 0.26 * 12).toLocaleString()}`,
    calcNote:    'per year in business deductions',
  },
}

// ── BUSINESS money hooks ──────────────────────────────────────────────────────
const BUSINESS_HOOKS: Record<string, {
  headline: string
  risks: Array<{level:'red'|'yellow', text:string}>
  sliderLabel: string
  sliderMin: number; sliderMax: number; sliderStep: number
  sliderUnit: string
  calcLabel: string
  calcFn: (v:number) => string
  calcNote: string
}> = {
  restaurant: {
    headline:   'Restaurants face more compliance changes right now than any other industry.',
    risks: [
      {level:'red',    text:'Beef & produce import tariffs up 18–26% this quarter — hitting your margins'},
      {level:'red',    text:'Minimum wage changing in 12 states in the next 90 days'},
      {level:'yellow', text:'FDA menu labeling rule update pending — affects all dine-in operations'},
    ],
    sliderLabel: 'What is your average monthly food & supply cost?',
    sliderMin:1000, sliderMax:50000, sliderStep:500, sliderUnit:'$/mo',
    calcLabel:   'At ${val}/mo in food costs, tariff exposure is',
    calcFn:      (v) => `$${Math.round(v * 0.22 * 12).toLocaleString()}`,
    calcNote:    'per year in additional import costs you may not have priced in yet',
  },
  dispensary: {
    headline:   'Cannabis businesses face unique compliance risks most platforms ignore.',
    risks: [
      {level:'red',    text:'280E tax code — most dispensaries overpay $40k–$200k/year'},
      {level:'red',    text:'3 state compliance rule changes in the last 30 days in your region'},
      {level:'yellow', text:'Hemp/CBD tariff changes affecting product sourcing costs now'},
    ],
    sliderLabel: 'What is your average monthly gross revenue?',
    sliderMin:5000, sliderMax:100000, sliderStep:1000, sliderUnit:'$/mo',
    calcLabel:   'At ${val}/mo revenue, 280E overpayment risk is',
    calcFn:      (v) => `$${Math.round(v * 0.15 * 12).toLocaleString()}`,
    calcNote:    'per year in potential tax overpayment without proper tracking',
  },
  trucking: {
    headline:   'Trucking compliance is changing faster than any time in the last decade.',
    risks: [
      {level:'red',    text:'Diesel prices volatile — avg trucker spends $8,400/mo on fuel'},
      {level:'red',    text:'DOT rule changes effective Q2 — 3 new HOS requirements'},
      {level:'yellow', text:'Mexico & Canada tariff changes hitting freight rates now'},
    ],
    sliderLabel: 'How many miles does your operation drive per week?',
    sliderMin:500, sliderMax:10000, sliderStep:100, sliderUnit:'mi/wk',
    calcLabel:   'At {val} miles/week, annual mileage deduction value is',
    calcFn:      (v) => `$${(v * 52 * 0.70).toLocaleString()}`,
    calcNote:    'per year — plus fuel cost tracking and IFTA report prep',
  },
  default: {
    headline:   'Most businesses miss thousands in compliance savings every year.',
    risks: [
      {level:'red',    text:'Regulatory changes specific to your industry updated this month'},
      {level:'red',    text:'Tax deductions for your business type often go unclaimed'},
      {level:'yellow', text:'Tariff changes may be affecting your supply chain costs'},
    ],
    sliderLabel: 'What is your average monthly operating cost?',
    sliderMin:1000, sliderMax:50000, sliderStep:500, sliderUnit:'$/mo',
    calcLabel:   'At ${val}/mo in costs, compliance savings potential is',
    calcFn:      (v) => `$${Math.round(v * 0.12 * 12).toLocaleString()}`,
    calcNote:    'per year in deductions and compliance cost avoidance',
  },
}

// ── Plan recommendations ──────────────────────────────────────────────────────
const PLANS: Record<string, {name:string;price:string;bullets:string[];roiLabel:string;roi:string}> = {
  driver:      { name:'Driver Pass',     price:'$4.99/mo', roi:'145x', roiLabel:'vs avg unclaimed deductions',
    bullets:['Real-time gas prices near you','Route gas finder — cheapest stop on any trip','Full mileage log + IRS report exports','Instant gas price drop alerts','Quarterly tax deadline reminders'] },
  freelancer:  { name:'Freelancer Pass', price:'$7.99/mo', roi:'60x',  roiLabel:'vs avg deductions found',
    bullets:['Full deduction teller — all categories','Monthly deduction PDF summary','Home office + equipment tracking','Quarterly estimated tax reminders','IRS rule change alerts'] },
  default_personal: { name:'Personal Pass', price:'$4.99/mo', roi:'80x', roiLabel:'vs avg annual savings found',
    bullets:['Gas tracker — cheapest near you','Full mileage deduction calculator','IRS update alerts for your work type','Quarterly tax reminders','Early access to all new modules'] },
  restaurant:  { name:'Business Pass',   price:'$14.99/mo', roi:'17x', roiLabel:'avg restaurant saves annually',
    bullets:['Food tariff tracker — live import prices','Minimum wage alerts by state','FDA & health code regulatory feed','Labor law compliance updates','Assets & liabilities dashboard','Balance sheet PDF export'] },
  dispensary:  { name:'Business Pass',   price:'$14.99/mo', roi:'220x',roiLabel:'potential 280E overpayment recovered',
    bullets:['280E tax optimization tracking','State cannabis compliance feed','Hemp/CBD tariff updates','Banking compliance alerts','Assets & liabilities dashboard','Monthly compliance score'] },
  default_business: { name:'Business Pass', price:'$14.99/mo', roi:'17x', roiLabel:'avg business saves annually',
    bullets:['Industry-specific regulatory feed','Tariff intelligence for your sector','Assets & liabilities dashboard','Monthly deduction summary','Balance sheet PDF export','Priority compliance alerts'] },
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step,      setStep]      = useState<Step>(1)
  const [animating, setAnimating] = useState(false)
  const [sliderVal, setSliderVal] = useState(200)
  const [profile,   setProfile]   = useState<Profile>({
    email:'', password:'', accountType:null,
    userType:'', zip:'', alertEmail:true,
    alertSMS:false, alertWeekly:true, plan:'free',
  })

  const router = useRouter()

  const accent = profile.userType
    ? (TYPE_COLORS[profile.userType] || '#ff3b30')
    : '#ff3b30'

  const isPersonal = profile.accountType === 'personal'
  const isBusiness = profile.accountType === 'business'

  // Get the right hook data based on account type + user type
  const hookData = isPersonal
    ? (PERSONAL_HOOKS[profile.userType] || PERSONAL_HOOKS.other)
    : (BUSINESS_HOOKS[profile.userType] || BUSINESS_HOOKS.default)

  // Get the right plan
  const planData = (() => {
    if (PLANS[profile.userType]) return PLANS[profile.userType]
    return isPersonal ? PLANS.default_personal : PLANS.default_business
  })()

  const totalSteps = 6
  const progress   = ((step - 1) / (totalSteps - 1)) * 100

  const stepLabel  = ['Create Account','Account Type','Your Profile','Your Situation','Preferences','Your Plan'][step-1]

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goTo = useCallback((target: Step) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => { setStep(target); setAnimating(false) }, 220)
  }, [animating])

  const next = (updates?: Partial<Profile>) => {
    if (updates) setProfile(p => ({...p, ...updates}))
    goTo((step + 1) as Step)
  }
  const back = () => step > 1 && goTo((step - 1) as Step)

  // ── Finish ──────────────────────────────────────────────────────────────────
  const finish = async (selectedPlan: string) => {
    // TODO: wire to supabase.auth.signUp + profiles.upsert
    router.push('/dashboard')
  }

  // ── Slider init value based on hook ────────────────────────────────────────
  const sliderDefault = Math.round((hookData.sliderMin + hookData.sliderMax) / 2)
  const hookCalcLabel = hookData.calcLabel
    .replace('{val}', sliderVal.toLocaleString())
    .replace('${val}', sliderVal.toLocaleString())
  const hookValue = hookData.calcFn(sliderVal)

  // ── Shared styles ───────────────────────────────────────────────────────────
  const inputStyle = {
    width:'100%', padding:'13px 16px',
    background:'rgba(0,0,0,.04)',
    border:'1.5px solid rgba(0,0,0,.09)',
    borderRadius:14, fontSize:15, fontWeight:500,
    color:'#1a1a2e', outline:'none',
    fontFamily:"'DM Sans',system-ui,sans-serif",
    transition:'border-color .2s',
  }

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
        @keyframes popIn{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        input:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px rgba(255,59,48,.1)!important;background:rgba(255,255,255,.8)!important}
        input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;background:rgba(0,0,0,.1);outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--accent);box-shadow:0 2px 8px rgba(255,59,48,.4);border:2.5px solid #fff;cursor:pointer;transition:transform .15s}
        input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.15)}
        .opt-btn:hover{background:rgba(255,255,255,.85)!important;border-color:rgba(0,0,0,.15)!important;transform:translateY(-2px)!important;box-shadow:0 4px 14px rgba(0,0,0,.08)!important}
        .big-opt:hover{background:rgba(255,255,255,.9)!important;transform:translateY(-2px)!important;box-shadow:0 6px 20px rgba(0,0,0,.09)!important}
        .alert-row:hover{background:rgba(255,255,255,.7)!important}
      `}</style>

      <div style={{position:'relative',zIndex:1,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 16px 60px'}}>

        {/* Top bar */}
        <div style={{width:'100%',maxWidth:560,display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:36}}>
          <Link href="/" style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',textDecoration:'none',display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:accent,boxShadow:`0 0 8px ${accent}55`,transition:'background .4s'}}/>
            CompliCore<span style={{color:accent}}>OS</span>
          </Link>
          <Link href="/login" style={{fontSize:13,fontWeight:500,color:'rgba(26,26,46,.45)',textDecoration:'none'}}>
            Already have an account? Log in →
          </Link>
        </div>

        {/* Progress */}
        <div style={{width:'100%',maxWidth:560,marginBottom:32}}>
          <div style={{height:3,background:'rgba(0,0,0,.08)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${progress}%`,background:accent,borderRadius:2,transition:'width .5s cubic-bezier(.4,0,.2,1), background .4s',boxShadow:`0 0 8px ${accent}55`}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:7,fontSize:10,fontWeight:600,letterSpacing:.5,color:'rgba(26,26,46,.35)',textTransform:'uppercase'}}>
            <span>Step {step} of {totalSteps}</span>
            <span>{stepLabel}</span>
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

          {/* ── STEP 1: Create Account ── */}
          {step === 1 && (
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'2px',color:accent,textTransform:'uppercase',marginBottom:10}}>Step 1 · Welcome</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:8,lineHeight:1.15}}>Create your<br/>free account</div>
              <div style={{fontSize:14,color:'rgba(26,26,46,.5)',marginBottom:26,lineHeight:1.6}}>Takes 60 seconds. No credit card required.</div>

              <div style={{marginBottom:14}}>
                <label style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',display:'block',marginBottom:7}}>Email Address</label>
                <input type="email" style={inputStyle} placeholder="you@example.com" value={profile.email} onChange={e=>setProfile(p=>({...p,email:e.target.value}))}/>
              </div>
              <div style={{marginBottom:24}}>
                <label style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',display:'block',marginBottom:7}}>Password</label>
                <input type="password" style={inputStyle} placeholder="At least 8 characters" value={profile.password} onChange={e=>setProfile(p=>({...p,password:e.target.value}))}/>
              </div>

              <button onClick={()=>profile.email&&profile.password.length>=8&&next()} style={{
                width:'100%',padding:14,background:`linear-gradient(135deg,#ff3b30,#ff6b35)`,
                color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,
                cursor:profile.email&&profile.password.length>=8?'pointer':'not-allowed',
                fontFamily:"'DM Sans',sans-serif",marginBottom:14,
                boxShadow:'0 4px 16px rgba(255,59,48,.35)',
                opacity:profile.email&&profile.password.length>=8?1:.5,
                transition:'opacity .2s',
              }}>Continue →</button>

              <div style={{display:'flex',alignItems:'center',gap:12,margin:'4px 0 14px',color:'rgba(26,26,46,.3)',fontSize:12}}>
                <div style={{flex:1,height:1,background:'rgba(0,0,0,.08)'}}/>or<div style={{flex:1,height:1,background:'rgba(0,0,0,.08)'}}/>
              </div>

              <button style={{width:'100%',padding:12,background:'rgba(0,0,0,.04)',color:'rgba(26,26,46,.65)',border:'1.5px solid rgba(0,0,0,.09)',borderRadius:100,fontSize:14,fontWeight:500,cursor:'pointer',marginBottom:8,fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                🍎 Continue with Apple
              </button>
              <button style={{width:'100%',padding:12,background:'rgba(0,0,0,.04)',color:'rgba(26,26,46,.65)',border:'1.5px solid rgba(0,0,0,.09)',borderRadius:100,fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                G&nbsp; Continue with Google
              </button>

              <p style={{fontSize:11,color:'rgba(26,26,46,.3)',textAlign:'center',marginTop:20,lineHeight:1.6}}>
                By continuing you agree to our <a href="/terms" style={{color:accent}}>Terms</a> and <a href="/privacy" style={{color:accent}}>Privacy Policy</a>.
              </p>
            </div>
          )}

          {/* ── STEP 2: Personal vs Business ── */}
          {step === 2 && (
            <div>
              <button onClick={back} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(26,26,46,.4)',fontSize:13,fontWeight:500,padding:'0 0 20px',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:5}}>← Back</button>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'2px',color:accent,textTransform:'uppercase',marginBottom:10}}>Step 2 · Account Type</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:8,lineHeight:1.15}}>Who is this<br/>account for?</div>
              <div style={{fontSize:14,color:'rgba(26,26,46,.5)',marginBottom:26}}>This personalizes your entire dashboard.</div>

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

          {/* ── STEP 3: Type selection ── */}
          {step === 3 && (
            <div>
              <button onClick={back} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(26,26,46,.4)',fontSize:13,fontWeight:500,padding:'0 0 20px',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:5}}>← Back</button>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'2px',color:accent,textTransform:'uppercase',marginBottom:10}}>Step 3 · Your Profile</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:8,lineHeight:1.15}}>
                {isPersonal ? 'What kind of work\ndo you do?' : 'What type of\nbusiness do you run?'}
              </div>
              <div style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:22}}>
                {isPersonal ? "We'll show you deductions and tools that fit your work." : "We'll filter compliance updates and tools to your industry."}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
                {(isPersonal ? PERSONAL_TYPES : BUSINESS_TYPES).map(t=>(
                  <button key={t.id} className="opt-btn" onClick={()=>{
                    // Set default slider value for this type
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

          {/* ── STEP 4: Money Hook — fully different for personal vs business ── */}
          {step === 4 && (
            <div>
              <button onClick={back} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(26,26,46,.4)',fontSize:13,fontWeight:500,padding:'0 0 20px',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:5}}>← Back</button>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'2px',color:accent,textTransform:'uppercase',marginBottom:10}}>
                Step 4 · {isPersonal ? 'Your Deductions' : 'Your Risks'}
              </div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:8,lineHeight:1.15}}>
                {isPersonal ? "Here's what you\nmight be missing" : "Here's what's\naffecting you now"}
              </div>
              <div style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:20,lineHeight:1.6}}>
                {hookData.headline}
              </div>

              {/* Risk / opportunity list */}
              <div style={{marginBottom:20}}>
                {hookData.risks.map((r,i)=>(
                  <div key={i} style={{
                    display:'flex',alignItems:'flex-start',gap:10,padding:'11px 14px',
                    borderRadius:12,marginBottom:8,fontSize:13,lineHeight:1.45,
                    background:r.level==='red'?'rgba(255,59,48,.07)':'rgba(255,159,10,.07)',
                    border:`1px solid ${r.level==='red'?'rgba(255,59,48,.15)':'rgba(255,159,10,.2)'}`,
                    color:'rgba(26,26,46,.8)',
                  }}>
                    <div style={{width:7,height:7,borderRadius:'50%',marginTop:4,flexShrink:0,background:r.level==='red'?'#ff3b30':'#ff9f0a',boxShadow:`0 0 6px ${r.level==='red'?'rgba(255,59,48,.4)':'rgba(255,159,10,.4)'}`}}/>
                    {r.text}
                  </div>
                ))}
              </div>

              {/* Slider */}
              <div style={{background:`${accent}0D`,border:`1px solid ${accent}22`,borderRadius:18,padding:'18px 20px',marginBottom:22}}>
                <div style={{fontSize:11,fontWeight:600,letterSpacing:'1px',color:'rgba(26,26,46,.5)',textTransform:'uppercase',marginBottom:14}}>
                  {hookData.sliderLabel}
                </div>
                <input
                  type="range"
                  min={hookData.sliderMin}
                  max={hookData.sliderMax}
                  step={hookData.sliderStep}
                  value={sliderVal}
                  onChange={e=>setSliderVal(+e.target.value)}
                  style={{marginBottom:6}}
                />
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'rgba(26,26,46,.35)',marginBottom:18}}>
                  <span>{hookData.sliderUnit === 'mi/wk' ? `${hookData.sliderMin} mi` : `$${hookData.sliderMin.toLocaleString()}`}</span>
                  <span style={{color:accent,fontWeight:700,fontSize:15}}>
                    {hookData.sliderUnit === 'mi/wk' ? `${sliderVal} mi/wk` : `$${sliderVal.toLocaleString()}/mo`}
                  </span>
                  <span>{hookData.sliderUnit === 'mi/wk' ? `${hookData.sliderMax} mi` : `$${hookData.sliderMax.toLocaleString()}`}</span>
                </div>

                <div style={{paddingTop:14,borderTop:`1px solid ${accent}18`}}>
                  <div style={{fontSize:12,color:'rgba(26,26,46,.5)',marginBottom:4}}>{hookCalcLabel}</div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:46,fontWeight:900,letterSpacing:-3,color:accent,lineHeight:1}}>{hookValue}</div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.4)',marginTop:4}}>{hookData.calcNote}</div>
                </div>
              </div>

              <button onClick={()=>next()} style={{
                width:'100%',padding:14,background:`linear-gradient(135deg,#ff3b30,#ff6b35)`,
                color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,
                cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
                boxShadow:'0 4px 16px rgba(255,59,48,.35)',
              }}>
                {isPersonal ? 'Show Me My Savings →' : 'Show Me My Risks →'}
              </button>
            </div>
          )}

          {/* ── STEP 5: Location + Alerts — different copy for personal vs business ── */}
          {step === 5 && (
            <div>
              <button onClick={back} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(26,26,46,.4)',fontSize:13,fontWeight:500,padding:'0 0 20px',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:5}}>← Back</button>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'2px',color:accent,textTransform:'uppercase',marginBottom:10}}>Step 5 · {isPersonal ? 'Your Location' : 'Preferences'}</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:8,lineHeight:1.15}}>
                {isPersonal ? 'Where are you\nbased?' : 'Stay ahead of\nevery change'}
              </div>
              <div style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:24,lineHeight:1.6}}>
                {isPersonal
                  ? 'We use your location to find gas stations near you and show real prices in your area — nothing else.'
                  : 'Set your location and how you want to be notified about regulatory updates.'}
              </div>

              {/* Location */}
              <div style={{marginBottom:24}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:10}}>
                  {isPersonal ? 'Your Location — Used for Gas Prices Near You' : 'Business Location'}
                </div>
                <div style={{display:'flex',gap:10,marginBottom:8}}>
                  <button
                    onClick={()=>{
                      navigator.geolocation?.getCurrentPosition(
                        pos=>setProfile(p=>({...p,zip:`${pos.coords.latitude.toFixed(3)},${pos.coords.longitude.toFixed(3)}`})),
                        ()=>{}
                      )
                    }}
                    style={{flex:1,padding:12,background:`linear-gradient(135deg,#ff3b30,#ff6b35)`,color:'#fff',border:'none',borderRadius:14,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:'0 4px 12px rgba(255,59,48,.3)'}}>
                    📍 {isPersonal ? 'Use My Location' : 'Use Business Location'}
                  </button>
                  <div style={{display:'flex',alignItems:'center',gap:8,flex:'0 0 auto',background:'rgba(0,0,0,.04)',border:'1.5px solid rgba(0,0,0,.09)',borderRadius:14,padding:'0 14px'}}>
                    <span style={{fontSize:13,color:'rgba(26,26,46,.4)',fontWeight:600}}>ZIP</span>
                    <input
                      type="text" maxLength={5} placeholder="30309"
                      value={profile.zip.length<=5?profile.zip:''}
                      onChange={e=>setProfile(p=>({...p,zip:e.target.value.replace(/\D/g,'').slice(0,5)}))}
                      style={{background:'transparent',border:'none',outline:'none',fontSize:18,fontWeight:700,color:accent,width:70,fontFamily:"'DM Sans',sans-serif",letterSpacing:2}}
                    />
                  </div>
                </div>
                {profile.zip && (
                  <div style={{fontSize:12,color:'#30d158',fontWeight:600,display:'flex',alignItems:'center',gap:5}}>
                    ✓ {isPersonal ? 'Location set — we\'ll find gas near you' : 'Business location set'}
                  </div>
                )}
              </div>

              {/* Notifications — simplified for personal users */}
              <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:12}}>
                {isPersonal ? 'Alert Me When' : 'Notification Preferences'}
              </div>

              {/* Personal alerts — gas-focused */}
              {isPersonal && [
                {key:'alertEmail',  icon:'⛽', label:'Gas Prices Drop Near Me',      sub:'Email alert when prices fall in your area',      on:profile.alertEmail,  set:(v)=>setProfile(p=>({...p,alertEmail:v})),  bg:'rgba(255,59,48,.1)'},
                {key:'alertWeekly', icon:'📅', label:'Weekly Fuel Cost Summary',     sub:'Your mileage deduction estimate every Monday',   on:profile.alertWeekly, set:(v)=>setProfile(p=>({...p,alertWeekly:v})), bg:'rgba(48,209,88,.1)'},
                {key:'alertSMS',    icon:'💬', label:'Urgent Price Alerts via SMS',  sub:'Text when prices spike · Pro feature',           on:profile.alertSMS,    set:(v)=>setProfile(p=>({...p,alertSMS:v})),   bg:'rgba(255,159,10,.1)'},
              ].map(a=>(
                <div key={a.key} className="alert-row" onClick={()=>a.set(!a.on)} style={{
                  display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'13px 16px',background:a.on?`${accent}08`:'rgba(0,0,0,.03)',
                  border:`1.5px solid ${a.on?`${accent}22`:'rgba(0,0,0,.08)'}`,
                  borderRadius:14,marginBottom:8,cursor:'pointer',transition:'all .2s',
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:a.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{a.icon}</div>
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

              {/* Business alerts — regulatory-focused */}
              {isBusiness && [
                {key:'alertEmail',  icon:'📋', label:'Regulatory Change Alerts',     sub:'Email when rules affecting your business change', on:profile.alertEmail,  set:(v)=>setProfile(p=>({...p,alertEmail:v})),  bg:'rgba(10,132,255,.1)'},
                {key:'alertWeekly', icon:'📅', label:'Weekly Compliance Digest',     sub:'Summary of all changes every Monday at 8am',     on:profile.alertWeekly, set:(v)=>setProfile(p=>({...p,alertWeekly:v})), bg:'rgba(48,209,88,.1)'},
                {key:'alertSMS',    icon:'💬', label:'Urgent Compliance SMS',        sub:'Text for high-impact changes only · Pro feature', on:profile.alertSMS,    set:(v)=>setProfile(p=>({...p,alertSMS:v})),   bg:'rgba(255,159,10,.1)'},
              ].map(a=>(
                <div key={a.key} className="alert-row" onClick={()=>a.set(!a.on)} style={{
                  display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'13px 16px',background:a.on?`${accent}08`:'rgba(0,0,0,.03)',
                  border:`1.5px solid ${a.on?`${accent}22`:'rgba(0,0,0,.08)'}`,
                  borderRadius:14,marginBottom:8,cursor:'pointer',transition:'all .2s',
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:a.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{a.icon}</div>
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

              <button onClick={()=>next()} style={{
                width:'100%',padding:14,background:`linear-gradient(135deg,#ff3b30,#ff6b35)`,
                color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,
                cursor:'pointer',fontFamily:"'DM Sans',sans-serif",marginTop:6,
                boxShadow:'0 4px 16px rgba(255,59,48,.35)',
              }}>
                {isPersonal ? 'See My Plan →' : 'See My Plan →'}
              </button>
            </div>
          )}

          {/* ── STEP 6: Plan Reveal ── */}
          {step === 6 && (
            <div>
              <button onClick={back} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(26,26,46,.4)',fontSize:13,fontWeight:500,padding:'0 0 20px',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:5}}>← Back</button>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'2px',color:accent,textTransform:'uppercase',marginBottom:10}}>Step 6 · Your Plan</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:6,lineHeight:1.15}}>
                Built for {isPersonal ? 'how you work' : 'your business'}
              </div>
              <div style={{fontSize:13,color:'rgba(26,26,46,.5)',marginBottom:22}}>Based on your profile, here's what we recommend.</div>

              {/* Plan card */}
              <div style={{
                background:'rgba(255,255,255,.8)',border:`2px solid ${accent}`,
                borderRadius:20,padding:22,marginBottom:14,position:'relative',overflow:'hidden',
                boxShadow:`0 0 0 1px ${accent}18,0 8px 32px ${accent}14`,
              }}>
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
                      <span style={{color:accent,fontWeight:700,fontSize:13,marginTop:1,flexShrink:0}}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>

                <div style={{background:`${accent}0A`,border:`1px solid ${accent}18`,borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:11,color:'rgba(26,26,46,.5)',lineHeight:1.4}}>{planData.roiLabel}</div>
                    <div style={{fontSize:10,color:'rgba(26,26,46,.3)',marginTop:2}}>Plan costs {planData.price.replace('/mo','')}/mo · {isPersonal?'$60':'$180'}/yr</div>
                  </div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,color:accent,letterSpacing:-1,whiteSpace:'nowrap'}}>{planData.roi} ROI</div>
                </div>
              </div>

              <button onClick={()=>finish('paid')} style={{
                width:'100%',padding:14,background:`linear-gradient(135deg,#ff3b30,#ff6b35)`,
                color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:700,
                cursor:'pointer',fontFamily:"'DM Sans',sans-serif",marginBottom:10,
                boxShadow:'0 4px 16px rgba(255,59,48,.35)',
              }}>
                Start {planData.name} — {planData.price} →
              </button>
              <button onClick={()=>finish('free')} style={{
                width:'100%',padding:12,background:'transparent',
                color:'rgba(26,26,46,.5)',border:'1.5px solid rgba(0,0,0,.1)',
                borderRadius:100,fontSize:14,fontWeight:500,cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif",
              }}>
                Start Free Instead
              </button>

              <p style={{fontSize:11,color:'rgba(26,26,46,.3)',textAlign:'center',marginTop:16,lineHeight:1.6}}>
                Cancel anytime · No contracts · 7-day free trial on paid plans
              </p>
            </div>
          )}

        </div>

        {step === 1 && (
          <p style={{marginTop:20,fontSize:13,color:'rgba(26,26,46,.4)'}}>
            Already have an account?{' '}
            <Link href="/login" style={{color:accent,fontWeight:600,textDecoration:'none'}}>Log in →</Link>
          </p>
        )}

      </div>
    </>
  )
}