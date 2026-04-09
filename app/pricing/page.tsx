'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function GCIcon({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}>
      <rect width="512" height="512" rx="114" fill="#ff3b30"/>
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  )
}

// What's actually live vs coming soon
const LIVE_FEATURES = [
  'Real-time gas prices near you',
  'Route gas finder — cheapest on any trip',
  'IRS mileage deduction calculator',
  'USA gas price map by state',
  'Price trend tracking — 7 days',
]

const COMING_FEATURES = [
  'Mileage log + PDF export',
  'Gas price drop alerts via email',
  'Quarterly tax deadline reminders',
]

const PLANS = [
  {
    id:       'driver',
    name:     'Core Pass',
    price:    4.99,
    tagline:  'Your first module. Gas intelligence, right now.',
    color:    '#ff3b30',
    gradient: 'linear-gradient(135deg,#ff3b30,#ff6b35)',
    popular:  true,
    live: [
      'Real-time gas prices near you',
      'Route gas finder — cheapest on any trip',
      'IRS mileage deduction calculator',
      'USA gas price map by state',
      'Price trend tracking — 7 days',
    ],
    soon: [
      'Mileage log + PDF export',
      'Gas price drop alerts via email',
      'Quarterly tax deadline reminders',
    ],
  },
  {
    id:       'freelancer',
    name:     'Pro Pass',
    price:    7.99,
    tagline:  'Everything in Core + deduction tools.',
    color:    '#0a84ff',
    gradient: 'linear-gradient(135deg,#0a84ff,#30a0ff)',
    popular:  false,
    comingSoon: true,
    live: [],
    soon: [
      'Everything in Core Pass',
      'Full deduction teller',
      'Home office + equipment tracker',
      'Monthly deduction PDF summary',
      'IRS rule change alerts',
    ],
  },
  {
    id:       'business',
    name:     'Business Pass',
    price:    14.99,
    tagline:  'Full intelligence suite for operators.',
    color:    '#30d158',
    gradient: 'linear-gradient(135deg,#30d158,#34c759)',
    popular:  false,
    comingSoon: true,
    live: [],
    soon: [
      'Everything in Pro Pass',
      'Live regulatory feed',
      'Tariff intelligence',
      'Labor law compliance',
      'Assets & liabilities dashboard',
      'Balance sheet PDF export',
    ],
  },
]

const FAQS = [
  { q: 'Do I need a credit card to start?', a: 'Yes — we collect your card upfront but you are NOT charged for 7 days. Cancel before your trial ends and you pay nothing.' },
  { q: 'What happens after the 7-day trial?', a: 'Your card is automatically charged at the monthly rate. You\'ll receive a reminder on day 5 and day 7 before any charge.' },
  { q: 'What is the Core Pass?', a: 'Core Pass is our first module — gas price intelligence. Real-time prices, route finder, mileage deductions. More features are being added every week.' },
  { q: 'When are Pro and Business launching?', a: 'Pro Pass launches when the deduction teller is complete — targeting next month. Business Pass follows after. Join Core Pass now and you\'ll get founding member pricing when they launch.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your account settings in 30 seconds. No cancellation fees. Access continues until end of billing period.' },
]

export default function PricingPage() {
  const router      = useRouter()
  const [openFaq,   setOpenFaq]   = useState<number|null>(null)
  const [loadingId, setLoadingId] = useState<string|null>(null)

  const handleSubscribe = async (planId: string) => {
    setLoadingId(planId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email, userType: profile?.user_type || planId }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (e: any) {
      alert(e.message || 'Something went wrong.')
      setLoadingId(null)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--red:#ff3b30;--ash:#f0eff4;--ink:#1a1a2e;--ink-2:rgba(26,26,46,0.6);--ink-3:rgba(26,26,46,0.35)}
        html{scroll-behavior:smooth}
        body{background:var(--ash);font-family:'DM Sans',system-ui,sans-serif;color:var(--ink);overflow-x:hidden}
        .bg-mesh{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 70% 50% at 15% 10%,rgba(255,59,48,0.08) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 85% 80%,rgba(255,100,50,0.06) 0%,transparent 55%),linear-gradient(160deg,#f5f4f9 0%,#eceaf2 40%,#f2f0f7 100%)}
        .page{position:relative;z-index:1;min-height:100vh;padding-bottom:100px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes navSlide{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .navbar{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 14px;height:56px;background:rgba(255,255,255,0.72);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.95);border-radius:22px;box-shadow:0 2px 8px rgba(0,0,0,0.06);animation:navSlide 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .plan-card{background:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.95);backdrop-filter:blur(40px);border-radius:28px;padding:32px 28px;position:relative;overflow:hidden;transition:transform .3s cubic-bezier(.34,1.56,.64,1);box-shadow:0 2px 8px rgba(0,0,0,.05)}
        .plan-card:hover{transform:translateY(-4px)}
        .plan-card.popular{border:2px solid rgba(255,59,48,.3)}
        .plan-card.locked-plan{cursor:default}
        .plan-card.locked-plan:hover{transform:none}
        .locked-plan-overlay{position:absolute;inset:0;background:rgba(240,239,244,0);display:flex;align-items:center;justify-content:center;opacity:0;transition:all .3s ease;border-radius:28px;backdrop-filter:blur(0px);z-index:10}
        .locked-plan:hover .locked-plan-overlay{background:rgba(240,239,244,.93);opacity:1;backdrop-filter:blur(8px)}
        .locked-plan-text{font-family:'Sora',sans-serif;font-size:16px;font-weight:800;color:rgba(26,26,46,.45);letter-spacing:3px;text-transform:uppercase}
        .cta-btn{width:100%;padding:14px;border:none;border-radius:100px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;margin-top:8px}
        .faq-item{background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.95);border-radius:18px;overflow:hidden}
        .faq-q{padding:18px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-size:15px;font-weight:600;color:var(--ink);gap:12px}
        .faq-a{padding:0 20px 18px;font-size:13px;color:var(--ink-2);line-height:1.65}
        .live-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(48,209,88,.1);border:1px solid rgba(48,209,88,.25);border-radius:100px;padding:2px 8px;font-size:9px;font-weight:700;color:#1a7a35;letter-spacing:.5px;text-transform:uppercase}
        .soon-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(255,159,10,.08);border:1px solid rgba(255,159,10,.2);border-radius:100px;padding:2px 8px;font-size:9px;font-weight:700;color:#8a5c00;letter-spacing:.5px;text-transform:uppercase}
      `}</style>

      <div className="bg-mesh"/>
      <div className="page">

        {/* Navbar */}
        <nav className="navbar">
          <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}>
            <GCIcon size={32}/>
            <div style={{display:'flex',flexDirection:'column',lineHeight:1}}>
              <span style={{fontFamily:"'Arial Black',Arial,sans-serif",fontSize:14,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e'}}>GRAT<span style={{color:'#ff3b30'}}>IA</span> CORE</span>
              <span style={{fontSize:7,fontWeight:600,letterSpacing:2.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>Business Intelligence</span>
            </div>
          </Link>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Link href="/login" style={{padding:'8px 18px',fontSize:13,fontWeight:600,color:'var(--ink)',background:'transparent',border:'1px solid rgba(0,0,0,.1)',borderRadius:14,textDecoration:'none',fontFamily:"'DM Sans',sans-serif"}}>
              Log in
            </Link>
            <button onClick={()=>router.push('/')} style={{padding:'8px 18px',fontSize:13,fontWeight:700,color:'#fff',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',border:'none',borderRadius:14,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 2px 8px rgba(255,59,48,.3)'}}>
              Get Started →
            </button>
          </div>
        </nav>

        <div style={{maxWidth:1100,margin:'0 auto',padding:'96px 24px 0'}}>

          {/* Header */}
          <div style={{textAlign:'center',marginBottom:48,animation:'fadeUp .6s ease both'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.8)',border:'1px solid rgba(255,255,255,.95)',borderRadius:100,padding:'6px 16px 6px 8px',fontSize:12,fontWeight:600,color:'var(--ink-2)',marginBottom:24}}>
              <div style={{width:22,height:22,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>⛽</div>
              Gas module live now · More modules launching soon
            </div>
            <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:'clamp(40px,6vw,68px)',fontWeight:900,letterSpacing:-3,lineHeight:.95,color:'var(--ink)',marginBottom:16}}>
              Simple, honest<br/><span style={{color:'var(--red)'}}>pricing</span>
            </h1>
            <p style={{fontSize:17,color:'var(--ink-2)',maxWidth:480,margin:'0 auto',lineHeight:1.6}}>
              Start with gas intelligence today. Pro and Business modules coming soon — Core Pass founding members get priority access.
            </p>
          </div>

          {/* Plan cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginBottom:64,animation:'fadeUp .6s ease .1s both'}}>
            {PLANS.map(plan => (
              <div key={plan.id} className={`plan-card ${plan.popular?'popular':''} ${plan.comingSoon?'locked-plan':''}`}>

                {/* Coming soon overlay on hover */}
                {plan.comingSoon && (
                  <div className="locked-plan-overlay">
                    <div className="locked-plan-text">Coming Soon</div>
                  </div>
                )}

                {plan.popular && (
                  <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#ff3b30,transparent)'}}/>
                )}
                {plan.popular && (
                  <div style={{position:'absolute',top:-1,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',fontSize:10,fontWeight:700,padding:'4px 14px',borderRadius:'0 0 10px 10px',letterSpacing:1,textTransform:'uppercase'}}>
                    Live Now
                  </div>
                )}

                {/* Blur content for coming soon plans */}
                <div style={{filter: plan.comingSoon ? 'blur(4px)' : 'none', opacity: plan.comingSoon ? 0.5 : 1, userSelect: plan.comingSoon ? 'none' : 'auto'}}>

                  <div style={{marginBottom:20}}>
                    <div style={{width:44,height:44,borderRadius:14,background:plan.gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:14,boxShadow:`0 4px 14px ${plan.color}44`}}>
                      {plan.id==='driver'?'⛽':plan.id==='freelancer'?'💼':'🏢'}
                    </div>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,marginBottom:4}}>{plan.name}</div>
                    <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:16}}>{plan.tagline}</div>
                    <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:4}}>
                      <span style={{fontFamily:"'Sora',sans-serif",fontSize:44,fontWeight:900,letterSpacing:-2,color:plan.color,lineHeight:1}}>
                        ${plan.price.toFixed(2)}
                      </span>
                      <span style={{fontSize:14,color:'var(--ink-3)',fontWeight:500}}>/mo</span>
                    </div>
                    <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:16}}>after 7-day free trial</div>
                  </div>

                  {/* Live features */}
                  {plan.live.length > 0 && (
                    <>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                        <span className="live-badge">● Live Now</span>
                      </div>
                      {plan.live.map((f,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:13,color:'var(--ink-2)',marginBottom:7,lineHeight:1.4}}>
                          <span style={{color:plan.color,fontWeight:700,flexShrink:0,fontSize:14}}>✓</span>{f}
                        </div>
                      ))}
                    </>
                  )}

                  {/* Coming soon features — blurred */}
                  {plan.soon.length > 0 && (
                    <>
                      <div style={{display:'flex',alignItems:'center',gap:6,margin:'12px 0 10px'}}>
                        <span className="soon-badge">⏳ Coming Soon</span>
                      </div>
                      <div style={{filter:'blur(3px)',userSelect:'none'}}>
                        {plan.soon.map((f,i)=>(
                          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:13,color:'var(--ink-3)',marginBottom:7,lineHeight:1.4}}>
                            <span style={{flexShrink:0,fontSize:14}}>·</span>{f}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                </div>

                {/* CTA — only on live plan */}
                {!plan.comingSoon && (
                  <>
                    <button
                      onClick={()=>handleSubscribe(plan.id)}
                      disabled={loadingId===plan.id}
                      className="cta-btn"
                      style={{background:`linear-gradient(135deg,#ff3b30,#ff6b35)`,color:'#fff',boxShadow:'0 4px 16px rgba(255,59,48,.35)',opacity:loadingId===plan.id?.7:1}}>
                      {loadingId===plan.id?'Redirecting...':'Start 7-Day Free Trial →'}
                    </button>
                    <p style={{fontSize:11,color:'var(--ink-3)',textAlign:'center',marginTop:10}}>
                      Card required · Not charged for 7 days
                    </p>
                  </>
                )}

              </div>
            ))}
          </div>

          {/* Live now callout */}
          <div style={{background:'linear-gradient(135deg,rgba(255,59,48,.08),rgba(255,107,53,.04))',border:'1.5px solid rgba(255,59,48,.2)',borderRadius:24,padding:'28px 32px',marginBottom:48,display:'flex',alignItems:'center',gap:24,flexWrap:'wrap',animation:'fadeUp .6s ease .15s both'}}>
            <div style={{width:52,height:52,borderRadius:16,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:'0 4px 16px rgba(255,59,48,.35)',flexShrink:0}}>⛽</div>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',marginBottom:4}}>Core Pass is live right now</div>
              <div style={{fontSize:13,color:'rgba(26,26,46,.55)',lineHeight:1.6}}>Gas price intelligence across all 50 states. Route finder. IRS mileage calculator. More features shipping weekly. Founding members lock in $4.99/mo forever.</div>
            </div>
            <button onClick={()=>handleSubscribe('driver')} style={{padding:'13px 28px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:100,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 14px rgba(255,59,48,.35)',whiteSpace:'nowrap'}}>
              Start Free Trial →
            </button>
          </div>

          {/* Trust signals */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:48,animation:'fadeUp .6s ease .2s both'}}>
            {[
              {icon:'🔒',title:'Bank-level security',sub:'Payments via Stripe. We never store your card.'},
              {icon:'📅',title:'Cancel anytime',sub:'No contracts. Cancel in 30 seconds from settings.'},
              {icon:'🎯',title:'7-day free trial',sub:'Full access for 7 days. Not charged until day 8.'},
            ].map((t,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,.72)',border:'1px solid rgba(255,255,255,.95)',borderRadius:20,padding:'22px 18px',textAlign:'center'}}>
                <div style={{fontSize:28,marginBottom:8}}>{t.icon}</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:15,fontWeight:700,color:'var(--ink)',marginBottom:5}}>{t.title}</div>
                <div style={{fontSize:12,color:'var(--ink-3)',lineHeight:1.55}}>{t.sub}</div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div style={{maxWidth:680,margin:'0 auto 64px',animation:'fadeUp .6s ease .25s both'}}>
            <div style={{textAlign:'center',marginBottom:28}}>
              <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,letterSpacing:-1,color:'var(--ink)'}}>Common questions</h2>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {FAQS.map((faq,i)=>(
                <div key={i} className="faq-item" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                  <div className="faq-q">
                    {faq.q}
                    <span style={{fontSize:18,color:'rgba(26,26,46,.3)',transition:'transform .2s',transform:openFaq===i?'rotate(45deg)':'rotate(0deg)',flexShrink:0}}>+</span>
                  </div>
                  {openFaq===i && <div className="faq-a">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div style={{textAlign:'center',padding:'56px 40px',background:'rgba(255,255,255,.72)',border:'1px solid rgba(255,255,255,.95)',backdropFilter:'blur(40px)',borderRadius:28,animation:'fadeUp .6s ease .3s both'}}>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:32,fontWeight:900,letterSpacing:-1.5,color:'var(--ink)',marginBottom:10}}>
              Start with gas. Grow with us.
            </h2>
            <p style={{fontSize:15,color:'var(--ink-2)',maxWidth:400,margin:'0 auto 24px',lineHeight:1.6}}>
              Core Pass is $4.99/mo. Founding members lock in this rate forever when Pro and Business launch.
            </p>
            <button onClick={()=>handleSubscribe('driver')}
              style={{padding:'16px 36px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:18,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 16px rgba(255,59,48,.35)'}}>
              Start 7-Day Free Trial →
            </button>
            <p style={{fontSize:11,color:'var(--ink-3)',marginTop:14}}>
              Card required · Not charged for 7 days · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </>
  )
}