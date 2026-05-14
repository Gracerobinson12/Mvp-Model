'use client'
// @ts-nocheck
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    router.push('/?signup=true')
  }

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