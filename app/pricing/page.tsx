'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function GratiaLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 270" height="28" style={{display:'block',flexShrink:0}}>
      <text x="60" y="250" fontFamily="'Arial Black','Arial Narrow',Arial,sans-serif" fontSize="180" fontWeight="900" fill="#1a1a2e" letterSpacing="-8">GRAT</text>
      <text x="554" y="250" fontFamily="'Arial Black','Arial Narrow',Arial,sans-serif" fontSize="180" fontWeight="900" fill="#ff3b30" letterSpacing="-8">IA</text>
      <text x="720" y="250" fontFamily="Arial,sans-serif" fontSize="180" fontWeight="100" fill="#1a1a2e" letterSpacing="-8"> CORE</text>
    </svg>
  )
}

const PLANS = [
  {
    id:         'driver',
    name:       'Driver Pass',
    price:      4.99,
    period:     '/mo',
    tagline:    'For gig drivers & delivery workers',
    color:      '#ff3b30',
    gradient:   'linear-gradient(135deg,#ff3b30,#ff6b35)',
    popular:    false,
    roi:        '$8,736',
    roiLabel:   'avg annual deductions found',
    features: [
      { text: 'Real-time gas prices near you',           included: true },
      { text: 'Route gas finder — cheapest on any trip', included: true },
      { text: 'IRS mileage deduction calculator',        included: true },
      { text: 'Mileage log + PDF export',                included: true },
      { text: 'Gas price drop alerts via email',         included: true },
      { text: 'Quarterly tax deadline reminders',        included: true },
      { text: 'Deduction teller',                        included: false },
      { text: 'Regulatory updates',                      included: false },
      { text: 'Tariff intelligence',                     included: false },
    ],
  },
  {
    id:         'freelancer',
    name:       'Freelancer Pass',
    price:      7.99,
    period:     '/mo',
    tagline:    'For freelancers & independent contractors',
    color:      '#0a84ff',
    gradient:   'linear-gradient(135deg,#0a84ff,#30a0ff)',
    popular:    true,
    roi:        '$5,760',
    roiLabel:   'avg annual deductions found',
    features: [
      { text: 'Everything in Driver Pass',               included: true },
      { text: 'Full deduction teller — all categories',  included: true },
      { text: 'Home office + equipment tracker',         included: true },
      { text: 'Monthly deduction PDF summary',           included: true },
      { text: 'Quarterly estimated tax reminders',       included: true },
      { text: 'IRS rule change alerts',                  included: true },
      { text: 'Self-employment health insurance tracker',included: true },
      { text: 'Regulatory updates',                      included: false },
      { text: 'Tariff intelligence',                     included: false },
    ],
  },
  {
    id:         'business',
    name:       'Business Pass',
    price:      14.99,
    period:     '/mo',
    tagline:    'For business owners & operators',
    color:      '#30d158',
    gradient:   'linear-gradient(135deg,#30d158,#34c759)',
    popular:    false,
    roi:        '$18,400',
    roiLabel:   'avg annual compliance savings',
    features: [
      { text: 'Everything in Freelancer Pass',           included: true },
      { text: 'Live regulatory feed — your industry',    included: true },
      { text: 'Tariff intelligence & import tracking',   included: true },
      { text: 'Minimum wage alerts by state',            included: true },
      { text: 'Labor law compliance updates',            included: true },
      { text: 'Assets & liabilities dashboard',          included: true },
      { text: 'Balance sheet PDF export',                included: true },
      { text: 'Priority compliance alerts via SMS',      included: true },
      { text: 'Cannabis 280E optimization (dispensaries)',included: true },
    ],
  },
]

const FAQS = [
  {
    q: 'Do I need a credit card to start?',
    a: 'Yes — we collect your card upfront but you are NOT charged for 7 days. Cancel before your trial ends and you pay nothing. We do this so you can experience the full product without limits.',
  },
  {
    q: 'What happens after the 7-day trial?',
    a: 'Your card is automatically charged at the monthly rate for your plan. You\'ll receive an email reminder on day 5 and day 7 before any charge.',
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes, upgrade or downgrade anytime from your dashboard. Upgrades take effect immediately. Downgrades take effect at the next billing cycle.',
  },
  {
    q: 'What if I\'m a founding member?',
    a: 'The first 20 members who sign up with a founding promo code lock in their current rate forever — even as prices increase when we add more modules.',
  },
  {
    q: 'Is this actual legal or tax advice?',
    a: 'No. GratIA Core provides regulatory information and deduction tracking tools. Always consult a qualified CPA or attorney for your specific situation.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings in 30 seconds. No cancellation fees, no questions asked. Your access continues until the end of the billing period.',
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const displayPrice = (price) => annual ? (price * 10).toFixed(2) : price.toFixed(2)
  const savings = (price) => (price * 12 - price * 10).toFixed(2)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--red:#ff3b30;--ash:#f0eff4;--ash-3:#d8d7de;--ink:#1a1a2e;--ink-2:rgba(26,26,46,0.6);--ink-3:rgba(26,26,46,0.35)}
        html{scroll-behavior:smooth}
        body{background:var(--ash);font-family:'DM Sans',system-ui,sans-serif;color:var(--ink);overflow-x:hidden}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E");pointer-events:none;z-index:0;opacity:0.4}
        .bg-mesh{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 70% 50% at 15% 10%,rgba(255,59,48,0.08) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 85% 80%,rgba(255,100,50,0.06) 0%,transparent 55%),linear-gradient(160deg,#f5f4f9 0%,#eceaf2 40%,#f2f0f7 100%)}
        .page{position:relative;z-index:1;min-height:100vh;padding-bottom:100px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes navSlide{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .navbar{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 10px;height:56px;background:rgba(255,255,255,0.72);backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);border:1px solid rgba(255,255,255,0.95);border-radius:22px;box-shadow:0 2px 8px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,1);animation:navSlide 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .plan-card{background:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.95);backdrop-filter:blur(40px);border-radius:28px;padding:32px 28px;position:relative;overflow:hidden;transition:all .3s cubic-bezier(.34,1.56,.64,1);box-shadow:0 2px 8px rgba(0,0,0,.05),inset 0 1px 0 rgba(255,255,255,1)}
        .plan-card:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(0,0,0,.1)}
        .plan-card.popular{border:2px solid rgba(10,132,255,.3);box-shadow:0 4px 20px rgba(10,132,255,.1),inset 0 1px 0 rgba(255,255,255,1)}
        .cta-btn{width:100%;padding:14px;border:none;border-radius:100px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;margin-top:8px}
        .cta-btn:hover{transform:scale(1.02)}
        .feature-row{display:flex;align-items:flex-start;gap:10px;padding:6px 0;font-size:13px;color:var(--ink-2);line-height:1.4}
        .toggle-track{width:52px;height:28px;border-radius:14px;position:relative;cursor:pointer;transition:background .25s;flex-shrink:0}
        .toggle-thumb{position:absolute;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .25s cubic-bezier(.34,1.56,.64,1);box-shadow:0 1px 4px rgba(0,0,0,.2)}
        .faq-item{background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.95);border-radius:18px;overflow:hidden;transition:all .2s}
        .faq-q{padding:18px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-size:15px;font-weight:600;color:var(--ink);gap:12px}
        .faq-a{padding:0 20px 18px;font-size:13px;color:var(--ink-2);line-height:1.65}
        .compare-table{width:100%;border-collapse:collapse;font-size:13px}
        .compare-table th{padding:12px 16px;text-align:center;font-weight:700;font-size:12px;letter-spacing:.5px}
        .compare-table td{padding:11px 16px;border-top:1px solid rgba(0,0,0,.06);text-align:center}
        .compare-table tr td:first-child{text-align:left;color:var(--ink-2);font-weight:500}
      `}</style>

      <div className="bg-mesh"/>
      <div className="page">

        {/* Navbar */}
        <nav className="navbar">
          <Link href="/" style={{textDecoration:'none'}}><GratiaLogo/></Link>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Link href="/login" style={{padding:'8px 18px',fontSize:13,fontWeight:600,color:'var(--ink)',background:'transparent',border:'1px solid var(--ash-3)',borderRadius:14,textDecoration:'none',fontFamily:"'DM Sans',sans-serif"}}>
              Log in
            </Link>
            <Link href="/" style={{padding:'8px 18px',fontSize:13,fontWeight:700,color:'#fff',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',border:'none',borderRadius:14,textDecoration:'none',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 2px 8px rgba(255,59,48,.3)'}}>
              Get Started →
            </Link>
          </div>
        </nav>

        <div style={{maxWidth:1100,margin:'0 auto',padding:'96px 24px 0'}}>

          {/* Header */}
          <div style={{textAlign:'center',marginBottom:48,animation:'fadeUp .6s ease both'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.8)',border:'1px solid rgba(255,255,255,.95)',borderRadius:100,padding:'6px 16px 6px 8px',fontSize:12,fontWeight:600,color:'var(--ink-2)',marginBottom:24}}>
              <div style={{width:22,height:22,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>💰</div>
              7-day free trial · Cancel anytime · No contracts
            </div>
            <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:'clamp(40px,6vw,72px)',fontWeight:900,letterSpacing:-3,lineHeight:.95,color:'var(--ink)',marginBottom:16}}>
              Simple, honest<br/><span style={{color:'var(--red)'}}>pricing</span>
            </h1>
            <p style={{fontSize:18,color:'var(--ink-2)',maxWidth:480,margin:'0 auto 32px',lineHeight:1.6}}>
              Pay for what you use. Cancel anytime. Your card isn't charged for 7 days.
            </p>

            {/* Annual toggle */}
            <div style={{display:'inline-flex',alignItems:'center',gap:12,background:'rgba(255,255,255,.8)',border:'1px solid rgba(255,255,255,.95)',borderRadius:100,padding:'8px 20px'}}>
              <span style={{fontSize:14,fontWeight:600,color:!annual?'var(--ink)':'var(--ink-3)'}}>Monthly</span>
              <div className="toggle-track" style={{background:annual?'#ff3b30':'rgba(0,0,0,.15)'}} onClick={()=>setAnnual(a=>!a)}>
                <div className="toggle-thumb" style={{transform:annual?'translateX(24px)':'translateX(0)'}}/>
              </div>
              <span style={{fontSize:14,fontWeight:600,color:annual?'var(--ink)':'var(--ink-3)'}}>
                Annual <span style={{fontSize:12,color:'#30d158',fontWeight:700}}>Save 2 months</span>
              </span>
            </div>
          </div>

          {/* Plan cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginBottom:64,animation:'fadeUp .6s ease .1s both'}}>
            {PLANS.map(plan => (
              <div key={plan.id} className={`plan-card ${plan.popular?'popular':''}`}>

                {plan.popular && (
                  <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#0a84ff,transparent)'}}/>
                )}
                {plan.popular && (
                  <div style={{position:'absolute',top:-1,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#0a84ff,#30a0ff)',color:'#fff',fontSize:10,fontWeight:700,padding:'4px 14px',borderRadius:'0 0 10px 10px',letterSpacing:1,textTransform:'uppercase'}}>
                    Most Popular
                  </div>
                )}

                <div style={{marginBottom:20}}>
                  <div style={{width:44,height:44,borderRadius:14,background:plan.gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:14,boxShadow:`0 4px 14px ${plan.color}44`}}>
                    {plan.id==='driver'?'🚗':plan.id==='freelancer'?'💼':'🏢'}
                  </div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:'var(--ink)',letterSpacing:-.5,marginBottom:4}}>{plan.name}</div>
                  <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:16}}>{plan.tagline}</div>

                  <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:4}}>
                    <span style={{fontFamily:"'Sora',sans-serif",fontSize:48,fontWeight:900,letterSpacing:-2,color:plan.color,lineHeight:1}}>
                      ${displayPrice(plan.price)}
                    </span>
                    <span style={{fontSize:14,color:'var(--ink-3)',fontWeight:500}}>{annual?'/yr':'/mo'}</span>
                  </div>

                  {annual && (
                    <div style={{fontSize:12,color:'#30d158',fontWeight:600,marginBottom:4}}>
                      Save ${savings(plan.price)}/year
                    </div>
                  )}

                  <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:20}}>
                    after 7-day free trial
                  </div>

                  {/* ROI callout */}
                  <div style={{background:`${plan.color}0D`,border:`1px solid ${plan.color}22`,borderRadius:12,padding:'10px 14px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.4}}>{plan.roiLabel}</div>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:plan.color,letterSpacing:-1,flexShrink:0,marginLeft:8}}>{plan.roi}</div>
                  </div>
                </div>

                {/* Features */}
                <div style={{marginBottom:24}}>
                  {plan.features.map((f,i)=>(
                    <div key={i} className="feature-row" style={{opacity:f.included?1:.4}}>
                      <span style={{fontSize:14,color:f.included?plan.color:'rgba(26,26,46,.3)',flexShrink:0,marginTop:0}}>
                        {f.included?'✓':'✕'}
                      </span>
                      <span style={{textDecoration:f.included?'none':'line-through',color:f.included?'var(--ink-2)':'rgba(26,26,46,.35)'}}>{f.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={()=>router.push('/')}
                  className="cta-btn"
                  style={{background:plan.popular?plan.gradient:'rgba(0,0,0,.06)',color:plan.popular?'#fff':'var(--ink)',boxShadow:plan.popular?`0 4px 16px ${plan.color}44`:'none'}}>
                  Start 7-Day Free Trial →
                </button>

                <p style={{fontSize:11,color:'var(--ink-3)',textAlign:'center',marginTop:10}}>
                  Card required · Not charged for 7 days
                </p>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div style={{background:'rgba(255,255,255,.72)',border:'1px solid rgba(255,255,255,.95)',backdropFilter:'blur(40px)',borderRadius:28,padding:32,marginBottom:64,animation:'fadeUp .6s ease .2s both'}}>
            <div style={{textAlign:'center',marginBottom:28}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:2.5,color:'#ff3b30',textTransform:'uppercase',marginBottom:8}}>Compare Plans</div>
              <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,letterSpacing:-1,color:'var(--ink)'}}>Everything side by side</h2>
            </div>
            <div style={{overflowX:'auto'}}>
              <table className="compare-table">
                <thead>
                  <tr style={{background:'rgba(0,0,0,.03)',borderRadius:12}}>
                    <th style={{textAlign:'left',padding:'14px 16px',color:'var(--ink-3)',fontWeight:600,fontSize:11,letterSpacing:1,textTransform:'uppercase'}}>Feature</th>
                    {PLANS.map(p=>(
                      <th key={p.id} style={{color:p.color,fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:800}}>
                        {p.name}<br/>
                        <span style={{fontSize:11,fontWeight:600,color:'var(--ink-3)'}}>
                          ${p.price}/mo
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Real-time gas prices',          '✓','✓','✓'],
                    ['Route gas finder',               '✓','✓','✓'],
                    ['Mileage deduction calculator',   '✓','✓','✓'],
                    ['Gas price drop alerts',          '✓','✓','✓'],
                    ['Deduction teller',               '—','✓','✓'],
                    ['Home office tracker',            '—','✓','✓'],
                    ['Quarterly tax reminders',        '✓','✓','✓'],
                    ['Regulatory updates feed',        '—','—','✓'],
                    ['Tariff intelligence',            '—','—','✓'],
                    ['Min. wage alerts by state',      '—','—','✓'],
                    ['Assets & liabilities',           '—','—','✓'],
                    ['Balance sheet PDF export',       '—','—','✓'],
                    ['Cannabis 280E tracking',         '—','—','✓'],
                    ['Priority SMS alerts',            '—','—','✓'],
                  ].map(([feature,...vals],i)=>(
                    <tr key={i} style={{background:i%2===0?'transparent':'rgba(0,0,0,.02)'}}>
                      <td style={{fontWeight:500}}>{feature}</td>
                      {vals.map((v,j)=>(
                        <td key={j} style={{color:v==='✓'?PLANS[j].color:v==='—'?'rgba(26,26,46,.2)':'var(--ink)',fontWeight:v==='✓'?700:400,fontSize:v==='✓'?16:13}}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust signals */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:64,animation:'fadeUp .6s ease .25s both'}}>
            {[
              {icon:'🔒', title:'Bank-level security',   sub:'Payments processed by Stripe. We never store your card details.'},
              {icon:'📅', title:'Cancel anytime',        sub:'No contracts. No cancellation fees. Cancel in 30 seconds from settings.'},
              {icon:'🎯', title:'7-day free trial',      sub:'Full access to your plan for 7 days. Card not charged until day 8.'},
            ].map((t,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,.72)',border:'1px solid rgba(255,255,255,.95)',borderRadius:20,padding:'24px 20px',textAlign:'center'}}>
                <div style={{fontSize:32,marginBottom:10}}>{t.icon}</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:'var(--ink)',marginBottom:6}}>{t.title}</div>
                <div style={{fontSize:13,color:'var(--ink-3)',lineHeight:1.55}}>{t.sub}</div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div style={{maxWidth:700,margin:'0 auto 64px',animation:'fadeUp .6s ease .3s both'}}>
            <div style={{textAlign:'center',marginBottom:32}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:2.5,color:'#ff3b30',textTransform:'uppercase',marginBottom:8}}>FAQ</div>
              <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,letterSpacing:-1,color:'var(--ink)'}}>Common questions</h2>
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
          <div style={{textAlign:'center',padding:'60px 48px',background:'rgba(255,255,255,.72)',border:'1px solid rgba(255,255,255,.95)',backdropFilter:'blur(40px)',borderRadius:32,boxShadow:'0 8px 40px rgba(0,0,0,.06)',position:'relative',overflow:'hidden',animation:'fadeUp .6s ease .35s both'}}>
            <div style={{position:'absolute',top:-60,left:'50%',transform:'translateX(-50%)',width:300,height:300,background:'radial-gradient(circle,rgba(255,59,48,0.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:2.5,color:'#ff3b30',textTransform:'uppercase',marginBottom:12}}>Get Started Today</div>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:36,fontWeight:900,letterSpacing:-1.5,color:'var(--ink)',marginBottom:12}}>
              Start free. Stay because it works.
            </h2>
            <p style={{fontSize:16,color:'var(--ink-2)',maxWidth:400,margin:'0 auto 28px',lineHeight:1.6}}>
              Join founders, drivers, freelancers, and business owners saving thousands with GratIA Core.
            </p>
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={()=>router.push('/')}
                style={{padding:'16px 36px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:18,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 16px rgba(255,59,48,.35)'}}>
                Start 7-Day Free Trial →
              </button>
              <Link href="/login"
                style={{padding:'16px 28px',background:'rgba(255,255,255,.8)',color:'var(--ink)',border:'1px solid rgba(255,255,255,.95)',borderRadius:18,fontSize:15,fontWeight:600,textDecoration:'none',fontFamily:"'DM Sans',sans-serif",display:'inline-flex',alignItems:'center'}}>
                Log In
              </Link>
            </div>
            <p style={{fontSize:12,color:'var(--ink-3)',marginTop:16}}>
              No credit card charged for 7 days · Cancel anytime · $4.99/mo after trial
            </p>
          </div>
        </div>
      </div>
    </>
  )
}