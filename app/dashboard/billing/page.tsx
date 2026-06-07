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
    color: '#ff3b30',
    gradient: 'linear-gradient(135deg,#ff3b30,#ff6b35)',
    live: true,
    desc: 'Gas intelligence for everyday drivers',
    features: [
      '⛽ Real-time gas prices near you',
      '⚡ EV charger locations',
      '🛣️ Route gas finder',
      '🗺️ USA price map all 50 states',
      '🔔 Gas price drop alerts',
    ],
    soon: [],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    color: '#30d158',
    gradient: 'linear-gradient(135deg,#30d158,#34c759)',
    live: false,
    desc: 'Full suite for freelancers and gig workers',
    features: [
      'Everything in Core',
      '💡 Idea Vault — timestamp your ideas',
      '🤝 Barter & Trade Tracker',
      '📄 PDF receipts for agreements',
      '🔔 Gas price drop email alerts',
    ],
    soon: [],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 79.99,
    color: '#bf5af2',
    gradient: 'linear-gradient(135deg,#bf5af2,#da8fff)',
    live: false,
    desc: 'Business intelligence for operators',
    features: [
      'Everything in Pro',
      '📋 Regulatory Updates',
      '🌐 Tariff Intelligence',
      '📈 Market Intelligence',
      '📊 Assets & Liabilities',
      '👥 3 team seats',
    ],
    soon: [],
  },
]

export default function BillingPage() {
  const router = useRouter()
  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [upgrading, setUpgrading] = useState(null)
  const [success,   setSuccess]   = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile({ ...profile, email: user.email, id: user.id })
      setLoading(false)
    }
    init()
  }, [])

  const handleUpgrade = async (planId) => {
    setUpgrading(planId)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, email: profile.email, userType: planId }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch(e) {
      alert(e.message || 'Something went wrong')
      setUpgrading(null)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You keep access until the end of your billing period.')) return
    // In production: call Stripe cancel API
    alert('To cancel, go to your Stripe customer portal. We\'re adding self-serve cancellation soon.')
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0eff4',fontFamily:'system-ui',color:'rgba(26,26,46,.4)'}}>Loading...</div>
  )

  const currentPlan = profile?.plan || 'free'
  const planStatus  = profile?.plan_status || 'taste'
  const isActive    = planStatus === 'active' || planStatus === 'trialing'
  const initial     = (profile?.first_name?.[0] || profile?.email?.[0] || 'G').toUpperCase()
  const displayName = profile?.first_name || profile?.email?.split('@')[0] || 'there'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;background-image:radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.09) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.07) 0%,transparent 50%);font-family:'DM Sans',system-ui,sans-serif;color:#1a1a2e;min-height:100vh;-webkit-font-smoothing:antialiased;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes navSlide{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
        .gc-nav{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 18px;height:58px;background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06);animation:navSlide .5s cubic-bezier(.34,1.56,.64,1) both}
        .gc-card{background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06)}
        .plan-card{background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,0.06);position:relative;overflow:hidden;transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s}
        .plan-card:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(0,0,0,.10)}
        .plan-card.locked{opacity:.7;cursor:default}
        .plan-card.locked:hover{transform:none}
        .avatar-btn{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#ff3b30,#ff6b35);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
        .dropdown{position:absolute;top:48px;right:0;background:rgba(255,255,255,.97);backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,.95);border-radius:18px;padding:8px;min-width:190px;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:999}
        .dropdown-item{display:block;width:100%;padding:9px 12px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:500;color:#1a1a2e;font-family:'DM Sans',sans-serif;border-radius:10px;text-align:left;text-decoration:none;transition:background .15s}
        .dropdown-item:hover{background:rgba(0,0,0,.05)}
        .big-btn{width:100%;padding:13px;border-radius:100px;border:none;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s cubic-bezier(.34,1.56,.64,1);margin-top:14px}
      `}</style>

      <nav className="gc-nav">
        <Link href="/dashboard" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}>
          <GCIcon size={30}/>
          <div>
            <div style={{fontFamily:"'Arial Black',Arial,sans-serif",fontSize:13,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e'}}>GRAT<span style={{color:'#ff3b30'}}>IA</span> CORE</div>
            <div style={{fontSize:7,fontWeight:600,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>Business Intelligence</div>
          </div>
        </Link>

        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Link href="/dashboard" style={{padding:'7px 16px',borderRadius:100,background:'rgba(255,255,255,0.5)',border:'0.5px solid rgba(255,255,255,0.9)',fontSize:12,fontWeight:600,color:'rgba(26,26,46,.6)',textDecoration:'none',backdropFilter:'blur(20px)'}}>
            ← Dashboard
          </Link>
          <div style={{position:'relative'}}>
            <button className="avatar-btn" onClick={()=>setMenuOpen(o=>!o)}>{initial}</button>
            {menuOpen && (
              <div className="dropdown">
                <div style={{padding:'8px 12px 10px',borderBottom:'1px solid rgba(0,0,0,.07)',marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#1a1a2e'}}>{displayName}</div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.4)',marginTop:1}}>{profile?.email}</div>
                </div>
                <Link href="/dashboard" className="dropdown-item" onClick={()=>setMenuOpen(false)}>🏠 Dashboard</Link>
                <Link href="/dashboard/gas" className="dropdown-item" onClick={()=>setMenuOpen(false)}>⛽ Gas Tracker</Link>
                <div style={{borderTop:'1px solid rgba(0,0,0,.07)',marginTop:6,paddingTop:6}}>
                  <button className="dropdown-item" style={{color:'#ff453a'}} onClick={signOut}>Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div style={{maxWidth:900,margin:'0 auto',padding:'88px 20px 80px'}}>

        {/* Header */}
        <div style={{marginBottom:28,animation:'fadeUp .5s ease both'}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:8}}>Plan & Billing</div>
          <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:36,fontWeight:900,letterSpacing:-1.5,color:'#1a1a2e',marginBottom:6}}>Manage your plan</h1>
          <p style={{fontSize:14,color:'rgba(26,26,46,.5)'}}>Stay in your account — upgrade or manage from here.</p>
        </div>

        {/* Current plan status */}
        <div className="gc-card" style={{padding:'20px 24px',marginBottom:20,animation:'fadeUp .5s ease .05s both',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:44,height:44,borderRadius:13,background:currentPlan==='business'?'rgba(48,209,88,.1)':currentPlan==='freelancer'?'rgba(10,132,255,.1)':'rgba(255,59,48,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{currentPlan==='business'?'🏢':currentPlan==='freelancer'?'💼':'⛽'}</div>            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:3}}>Current plan</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',textTransform:'capitalize'}}>
              {currentPlan === 'driver' ? 'Core' : currentPlan === 'freelancer' ? 'Pro' : currentPlan === 'business' ? 'Enterprise' : currentPlan === 'free' ? 'No plan' : currentPlan}               </div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:5,background:isActive?'rgba(48,209,88,.08)':'rgba(255,59,48,.08)',border:`1px solid ${isActive?'rgba(48,209,88,.2)':'rgba(255,59,48,.2)'}`,borderRadius:100,padding:'5px 14px',fontSize:12,fontWeight:700,color:isActive?'#1a7a35':'#cc2018'}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:isActive?'#30d158':'#ff3b30',animation:'lp 1.4s ease infinite'}}/>
              {planStatus === 'trialing' ? `Trialing · ${profile?.trial_ends_at ? Math.ceil((new Date(profile.trial_ends_at) - Date.now())/(1000*60*60*24)) : 0}d left` : isActive ? 'Active' : 'Inactive'}
            </div>
            {isActive && (
              <button onClick={handleCancel} style={{padding:'5px 14px',borderRadius:100,border:'0.5px solid rgba(255,69,58,.3)',background:'rgba(255,69,58,.06)',fontSize:12,fontWeight:600,color:'#ff453a',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                Cancel plan
              </button>
            )}
          </div>
        </div>

        {/* Plan grid */}
        <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:14,animation:'fadeUp .5s ease .08s both'}}>Available plans</div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,animation:'fadeUp .5s ease .1s both'}}>
          {PLANS.map((plan, i) => {
            const isCurrent = currentPlan === plan.id || (currentPlan === 'driver' && plan.id === 'starter')
            return (
              <div key={plan.id} className={`plan-card ${!plan.live ? 'locked' : ''}`} style={{animationDelay:`${i*.05}s`}}>

                {/* Top accent line */}
                {isCurrent && <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${plan.color},transparent)`}}/>}

                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e'}}>{plan.name}</span>
                      {isCurrent && <span style={{fontSize:9,fontWeight:700,background:`${plan.color}18`,color:plan.color,border:`1px solid ${plan.color}30`,borderRadius:100,padding:'2px 8px',letterSpacing:.5}}>CURRENT</span>}
                      {!plan.live && <span style={{fontSize:9,fontWeight:700,background:'rgba(0,0,0,.05)',color:'rgba(26,26,46,.4)',border:'0.5px solid rgba(0,0,0,.08)',borderRadius:100,padding:'2px 8px',letterSpacing:.5}}>SOON</span>}
                      {plan.live && !isCurrent && <span style={{fontSize:9,fontWeight:700,background:'rgba(48,209,88,.1)',color:'#1a7a35',border:'1px solid rgba(48,209,88,.25)',borderRadius:100,padding:'2px 8px',letterSpacing:.5}}>LIVE</span>}
                    </div>
                    <div style={{fontSize:12,color:'rgba(26,26,46,.5)'}}>{plan.desc}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0,marginLeft:12}}>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:900,letterSpacing:-1,color:plan.color,lineHeight:1}}>${plan.price}</div>
                    <div style={{fontSize:11,color:'rgba(26,26,46,.4)'}}>/mo</div>
                  </div>
                </div>

                {/* Features */}
                <div style={{filter:!plan.live?'blur(2px)':'none',userSelect:!plan.live?'none':'auto',opacity:!plan.live?.6:1}}>
                  {plan.features.map((f,j)=>(
                    <div key={j} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'rgba(26,26,46,.7)',marginBottom:6}}>
                      <span style={{color:plan.color,fontWeight:700,flexShrink:0,fontSize:11}}>✓</span>{f}
                    </div>
                  ))}
                  {plan.soon.map((f,j)=>(
                    <div key={j} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'rgba(26,26,46,.35)',marginBottom:6,filter:'blur(2px)',userSelect:'none'}}>
                      <span style={{flexShrink:0,fontSize:11}}>·</span>{f}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {plan.live && !isCurrent && (
                  <button onClick={()=>handleUpgrade(plan.id)} disabled={!!upgrading} className="big-btn"
                    style={{background:`linear-gradient(135deg,${plan.color},${plan.color}cc)`,color:'#fff',boxShadow:`0 4px 16px ${plan.color}44`,opacity:upgrading?0.7:1}}>
                    {upgrading === plan.id ? 'Redirecting...' : `Upgrade to ${plan.name} →`}
                  </button>
                )}
                {isCurrent && (
                  <button disabled className="big-btn" style={{background:'rgba(0,0,0,.04)',color:'rgba(26,26,46,.4)',border:'0.5px solid rgba(0,0,0,.08)',cursor:'default',marginTop:14}}>
                    ✓ Your current plan
                  </button>
                )}
                {!plan.live && (
                  <button disabled className="big-btn" style={{background:'rgba(0,0,0,.04)',color:'rgba(26,26,46,.3)',border:'0.5px solid rgba(0,0,0,.06)',cursor:'default',marginTop:14,filter:'blur(1px)'}}>
                    Coming soon
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Trust signals */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:20,animation:'fadeUp .5s ease .2s both'}}>
          {[
            {icon:'🔒',title:'Stripe secured',sub:'Card data never touches our servers'},
            {icon:'📅',title:'Cancel anytime',sub:'No contracts, no cancellation fees'},
            {icon:'🎁',title:'7-day trial',sub:'Full access, card not charged until day 8'},
          ].map((t,i)=>(
            <div key={i} className="gc-card" style={{padding:'16px',textAlign:'center'}}>
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