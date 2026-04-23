'use client'
// @ts-nocheck
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function GCIcon({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}>
      <rect width="512" height="512" rx="114" fill="#ff3b30"/>
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  )
}

// State gas price averages (EIA-based weekly data)
const STATE_GAS = {
  'Alabama':{'avg':3.12,'trend':'↓','change':'-0.04'},'Alaska':{'avg':4.82,'trend':'↑','change':'+0.08'},
  'Arizona':{'avg':3.71,'trend':'↓','change':'-0.06'},'Arkansas':{'avg':2.99,'trend':'↓','change':'-0.03'},
  'California':{'avg':4.94,'trend':'↑','change':'+0.12'},'Colorado':{'avg':3.58,'trend':'→','change':'+0.01'},
  'Connecticut':{'avg':3.89,'trend':'↑','change':'+0.05'},'Delaware':{'avg':3.61,'trend':'→','change':'+0.00'},
  'Florida':{'avg':3.51,'trend':'↑','change':'+0.03'},'Georgia':{'avg':3.19,'trend':'↓','change':'-0.05'},
  'Hawaii':{'avg':5.12,'trend':'↑','change':'+0.09'},'Idaho':{'avg':3.68,'trend':'→','change':'+0.01'},
  'Illinois':{'avg':4.21,'trend':'↑','change':'+0.07'},'Indiana':{'avg':3.48,'trend':'↓','change':'-0.02'},
  'Iowa':{'avg':3.28,'trend':'→','change':'+0.00'},'Kansas':{'avg':3.08,'trend':'↓','change':'-0.03'},
  'Kentucky':{'avg':3.09,'trend':'↓','change':'-0.04'},'Louisiana':{'avg':3.14,'trend':'→','change':'+0.01'},
  'Maine':{'avg':3.71,'trend':'↑','change':'+0.04'},'Maryland':{'avg':3.65,'trend':'↑','change':'+0.03'},
  'Massachusetts':{'avg':4.02,'trend':'↑','change':'+0.06'},'Michigan':{'avg':3.64,'trend':'→','change':'+0.01'},
  'Minnesota':{'avg':3.38,'trend':'↓','change':'-0.02'},'Mississippi':{'avg':3.01,'trend':'↓','change':'-0.05'},
  'Missouri':{'avg':3.04,'trend':'↓','change':'-0.03'},'Montana':{'avg':3.54,'trend':'→','change':'+0.00'},
  'Nebraska':{'avg':3.14,'trend':'↓','change':'-0.01'},'Nevada':{'avg':4.08,'trend':'↑','change':'+0.08'},
  'New Hampshire':{'avg':3.72,'trend':'↑','change':'+0.04'},'New Jersey':{'avg':3.72,'trend':'↑','change':'+0.03'},
  'New Mexico':{'avg':3.28,'trend':'→','change':'+0.00'},'New York':{'avg':4.35,'trend':'↑','change':'+0.09'},
  'North Carolina':{'avg':3.28,'trend':'↓','change':'-0.03'},'North Dakota':{'avg':3.22,'trend':'→','change':'+0.01'},
  'Ohio':{'avg':3.58,'trend':'↑','change':'+0.04'},'Oklahoma':{'avg':2.98,'trend':'↓','change':'-0.04'},
  'Oregon':{'avg':4.08,'trend':'↑','change':'+0.07'},'Pennsylvania':{'avg':3.82,'trend':'↑','change':'+0.05'},
  'Rhode Island':{'avg':3.79,'trend':'↑','change':'+0.04'},'South Carolina':{'avg':3.12,'trend':'↓','change':'-0.04'},
  'South Dakota':{'avg':3.21,'trend':'→','change':'+0.00'},'Tennessee':{'avg':3.08,'trend':'↓','change':'-0.04'},
  'Texas':{'avg':2.94,'trend':'↓','change':'-0.02'},'Utah':{'avg':3.71,'trend':'↑','change':'+0.03'},
  'Vermont':{'avg':3.82,'trend':'↑','change':'+0.05'},'Virginia':{'avg':3.42,'trend':'↑','change':'+0.03'},
  'Washington':{'avg':4.28,'trend':'↑','change':'+0.08'},'West Virginia':{'avg':3.42,'trend':'→','change':'+0.01'},
  'Wisconsin':{'avg':3.38,'trend':'↓','change':'-0.02'},'Wyoming':{'avg':3.31,'trend':'→','change':'+0.00'},
}

const MODULES = {
  personal: [
    { id:'gas',    icon:'⛽', title:'Gas Price Tracker', desc:'Real-time prices near you. Route finder and price map.', status:'live', href:'/dashboard/gas', color:'#ff3b30', bg:'rgba(255,59,48,.1)', featured:true },
    { id:'vault',  icon:'💡', title:'Idea Vault',        desc:'Timestamp and seal your ideas with a PDF receipt.',    status:'soon', color:'#ffd60a', bg:'rgba(255,214,10,.1)' },
  ],
  pro: [
    { id:'gas',        icon:'⛽', title:'Gas Price Tracker',   desc:'Real-time prices near you. Route finder and price map.',        status:'live', href:'/dashboard/gas', color:'#ff3b30', bg:'rgba(255,59,48,.1)', featured:true },
    { id:'vault',      icon:'💡', title:'Idea Vault',           desc:'Timestamp and seal your ideas with a PDF receipt.',             status:'soon', color:'#ffd60a', bg:'rgba(255,214,10,.1)' },
    { id:'deductions', icon:'🧾', title:'Deduction Teller',     desc:'Find every deduction you\'re missing at tax time.',            status:'soon', color:'#30d158', bg:'rgba(48,209,88,.1)' },
    { id:'barter',     icon:'🤝', title:'Barter & Trade',       desc:'Legally timestamp trade agreements with PDF receipts.',        status:'soon', color:'#0a84ff', bg:'rgba(10,132,255,.1)' },
  ],
  enterprise: [
    { id:'gas',        icon:'⛽', title:'Gas Price Tracker',   desc:'Real-time prices near you. Route finder and price map.',        status:'live', href:'/dashboard/gas', color:'#ff3b30', bg:'rgba(255,59,48,.1)', featured:true },
    { id:'regulatory', icon:'📋', title:'Regulatory Updates',  desc:'IRS changes, OSHA rules, labor laws for your industry.',       status:'soon', color:'#0a84ff', bg:'rgba(10,132,255,.1)' },
    { id:'tariff',     icon:'🌐', title:'Tariff Intelligence',  desc:'Live import/export tariff rates and cost tracking.',           status:'soon', color:'#ff9f0a', bg:'rgba(255,159,10,.1)' },
    { id:'market',     icon:'📈', title:'Market Intelligence',  desc:'Predict profit margins and spot trends before they happen.',   status:'soon', color:'#bf5af2', bg:'rgba(191,90,242,.1)' },
    { id:'barter',     icon:'🤝', title:'Barter & Trade',       desc:'Legally timestamp trade agreements with PDF receipts.',        status:'soon', color:'#30d158', bg:'rgba(48,209,88,.1)' },
    { id:'assets',     icon:'📊', title:'Assets & Liabilities', desc:'Track net worth and generate a bank-ready balance sheet.',     status:'soon', color:'#ff6b35', bg:'rgba(255,107,53,.1)' },
  ],
}

export default function DashboardPage() {
  const router  = useRouter()
  const [user,     setUser]     = useState(null)
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // If coming from Stripe checkout, verify payment immediately
      const sessionId = searchParams.get('session_id')
      if (sessionId) {
        try {
          await fetch('/api/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, userId: user.id }),
          })
          // Remove session_id from URL without reload
          window.history.replaceState({}, '', '/dashboard')
        } catch(e) { console.error('Session verify error', e) }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profile) {
        setProfile(profile)
        await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0eff4',fontFamily:'system-ui',color:'rgba(26,26,46,.4)',fontSize:14}}>Loading...</div>
  )

  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = profile?.first_name || profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const initial    = (profile?.first_name?.[0] || user?.email?.[0] || 'G').toUpperCase()
  const userPlan   = profile?.user_type === 'business' ? 'enterprise' : profile?.user_type === 'freelancer' ? 'pro' : 'personal'
  const planStatus = profile?.plan_status
  const isActive   = planStatus === 'active' || planStatus === 'trialing'
  const state      = profile?.state
  const stateGas   = state ? STATE_GAS[state] : null

  // Trial days left
  let daysLeft: number|null = null
  let onTrial = false
  if (profile?.trial_ends_at) {
    const end = new Date(profile.trial_ends_at)
    if (end > new Date()) {
      daysLeft = Math.ceil((end.getTime() - Date.now()) / (1000*60*60*24))
      onTrial  = true
    }
  }

  const modules = MODULES[userPlan] || MODULES.personal

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;font-family:'DM Sans',system-ui,sans-serif;color:#1a1a2e;overflow-x:hidden}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes navSlide{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        .navbar{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(255,255,255,0.85);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.95);border-radius:22px;box-shadow:0 2px 8px rgba(0,0,0,0.06);animation:navSlide 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .module-card{background:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.95);border-radius:22px;padding:22px;position:relative;overflow:hidden;transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s ease;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .module-card.live{cursor:pointer}
        .module-card.live:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.1)}
        .module-card.locked{cursor:default;opacity:.8}
        .locked-overlay{position:absolute;inset:0;border-radius:22px;background:rgba(240,239,244,0);display:flex;align-items:center;justify-content:center;opacity:0;transition:all .3s;backdrop-filter:blur(0px);z-index:5}
        .module-card.locked:hover .locked-overlay{background:rgba(240,239,244,.92);opacity:1;backdrop-filter:blur(8px)}
        .avatar-btn{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#ff3b30,#ff6b35);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;cursor:pointer;border:none;flex-shrink:0;font-family:'DM Sans',sans-serif}
        .dropdown{position:absolute;top:46px;right:0;background:rgba(255,255,255,.97);border:1px solid rgba(0,0,0,.09);border-radius:16px;padding:8px;min-width:190px;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:999}
        .dropdown-item{display:block;width:100%;padding:9px 12px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:500;color:#1a1a2e;font-family:'DM Sans',sans-serif;border-radius:10px;text-align:left;text-decoration:none;transition:background .15s}
        .dropdown-item:hover{background:rgba(0,0,0,.05)}
        .stat-card{background:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.95);border-radius:18px;padding:18px;backdrop-filter:blur(40px)}
        .hero-bg{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,59,48,.06) 0%,rgba(255,107,53,.03) 50%,transparent 100%);pointer-events:none}
      `}</style>

      <div style={{background:'#f0eff4',backgroundImage:'radial-gradient(ellipse 80% 60% at 20% 0%,rgba(255,59,48,0.07) 0%,transparent 55%)',minHeight:'100vh',paddingBottom:80}}>

        {/* Navbar */}
        <nav className="navbar">
          <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}>
            <GCIcon size={32}/>
            <div style={{display:'flex',flexDirection:'column',lineHeight:1}}>
              <span style={{fontFamily:"'Arial Black',Arial,sans-serif",fontSize:13,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e'}}>GRAT<span style={{color:'#ff3b30'}}>IA</span> CORE</span>
              <span style={{fontSize:7,fontWeight:600,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>Business Intelligence</span>
            </div>
          </Link>

          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {/* Plan badge */}
            <div style={{display:'flex',alignItems:'center',gap:5,background:isActive?'rgba(48,209,88,.08)':'rgba(255,59,48,.08)',border:`1px solid ${isActive?'rgba(48,209,88,.2)':'rgba(255,59,48,.2)'}`,borderRadius:100,padding:'4px 12px',fontSize:11,fontWeight:700,color:isActive?'#1a7a35':'#cc2018'}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:isActive?'#30d158':'#ff3b30',animation:'lp 1.4s ease infinite'}}/>
              {onTrial ? `${daysLeft}d trial left` : isActive ? 'Core Pass Active' : 'Not subscribed'}
            </div>
            <div style={{position:'relative'}}>
              <button className="avatar-btn" onClick={()=>setMenuOpen(o=>!o)}>{initial}</button>
              {menuOpen && (
                <div className="dropdown">
                  <div style={{padding:'8px 12px 10px',borderBottom:'1px solid rgba(0,0,0,.07)',marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#1a1a2e'}}>{profile?.full_name || displayName}</div>
                    <div style={{fontSize:11,color:'rgba(26,26,46,.4)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{user?.email}</div>
                    {profile?.business_name && <div style={{fontSize:10,color:'rgba(26,26,46,.35)',marginTop:1}}>{profile.business_name}</div>}
                    <div style={{fontSize:10,color:'rgba(26,26,46,.35)',marginTop:2,textTransform:'capitalize'}}>{userPlan} plan</div>
                  </div>
                  <Link href="/dashboard/gas" className="dropdown-item" onClick={()=>setMenuOpen(false)}>⛽ Gas Tracker</Link>
                  <Link href="/pricing" className="dropdown-item" onClick={()=>setMenuOpen(false)}>💳 Manage Plan</Link>
                  <div style={{borderTop:'1px solid rgba(0,0,0,.07)',marginTop:6,paddingTop:6}}>
                    <button className="dropdown-item" style={{color:'#ff453a'}} onClick={signOut}>Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div style={{maxWidth:1100,margin:'0 auto',padding:'88px 24px 0'}}>

          {/* Hero greeting section */}
          <div style={{position:'relative',background:'rgba(255,255,255,.85)',border:'1px solid rgba(255,255,255,.95)',borderRadius:28,padding:'32px 36px',marginBottom:20,overflow:'hidden',animation:'fadeUp .5s ease both'}}>
            <div className="hero-bg"/>
            <div style={{position:'relative',display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:6}}>{greeting}</div>
                <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:'clamp(28px,4vw,42px)',fontWeight:900,letterSpacing:-1.5,color:'#1a1a2e',lineHeight:1.05,marginBottom:8}}>
                  Welcome back,<br/><span style={{color:'#ff3b30'}}>{profile?.first_name || displayName}</span> 👋
                </h1>
                {profile?.business_name && (
                  <div style={{fontSize:14,color:'rgba(26,26,46,.5)',fontWeight:500}}>{profile.business_name}</div>
                )}
                {state && (
                  <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,59,48,.06)',border:'1px solid rgba(255,59,48,.12)',borderRadius:100,padding:'4px 12px',fontSize:12,fontWeight:600,color:'#cc2018',marginTop:10}}>
                    📍 {state}
                  </div>
                )}
              </div>

              {/* State gas price — real EIA data */}
              {stateGas && (
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:4}}>{state} avg gas price</div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:48,fontWeight:900,letterSpacing:-2,color:'#ff3b30',lineHeight:1}}>${stateGas.avg.toFixed(2)}</div>
                  <div style={{fontSize:13,fontWeight:700,color:stateGas.trend==='↓'?'#30d158':stateGas.trend==='↑'?'#ff453a':'rgba(26,26,46,.4)',marginTop:4}}>
                    {stateGas.trend} {stateGas.change} this week · EIA.gov
                  </div>
                </div>
              )}
              {!stateGas && (
                <div style={{textAlign:'right',opacity:.5}}>
                  <div style={{fontSize:12,color:'rgba(26,26,46,.4)'}}>Add your state to see</div>
                  <div style={{fontSize:12,color:'rgba(26,26,46,.4)'}}>local gas prices here</div>
                </div>
              )}
            </div>
          </div>

          {/* Trial / Subscribe banner */}
          {!isActive && (
            <div style={{background:'rgba(255,59,48,.06)',border:'1px solid rgba(255,59,48,.18)',borderRadius:18,padding:'14px 20px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',animation:'fadeUp .5s ease .05s both'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,59,48,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>⛽</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'#1a1a2e',marginBottom:2}}>Subscribe to keep access</div>
                  <div style={{fontSize:12,color:'rgba(26,26,46,.5)'}}>Core Pass · $4.99/mo · 7-day free trial · Cancel anytime</div>
                </div>
              </div>
              <Link href="/pricing" style={{padding:'9px 20px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',borderRadius:100,fontSize:13,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap',boxShadow:'0 4px 12px rgba(255,59,48,.3)'}}>Subscribe Now →</Link>
            </div>
          )}

          {/* Modules label */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>Your modules</div>
            <div style={{fontSize:11,color:'rgba(26,26,46,.4)',fontWeight:500,textTransform:'capitalize'}}>{userPlan} plan</div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
            {modules.map((mod, i) => (
              <div
                key={mod.id}
                className={`module-card ${mod.status==='live'?'live':'locked'}`}
                style={{
                  gridColumn: mod.featured ? 'span 2' : 'span 1',
                  animation:`fadeUp .5s ease ${.1+i*.05}s both`,
                }}
                onClick={()=>mod.status==='live'&&mod.href&&router.push(mod.href)}
              >
                {mod.status==='soon' && (
                  <div className="locked-overlay">
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:800,letterSpacing:3,textTransform:'uppercase',color:'rgba(26,26,46,.4)'}}>Coming Soon</div>
                  </div>
                )}
                {mod.status==='live' && <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#ff3b30,transparent)'}}/>}

                <div style={{
                  display:mod.featured?'flex':'block',
                  alignItems:'flex-start',gap:16,
                  filter:mod.status==='soon'?'blur(2px)':'none',
                  userSelect:mod.status==='soon'?'none':'auto',
                  opacity:mod.status==='soon'?.5:1,
                }}>
                  <div style={{width:mod.featured?52:44,height:mod.featured?52:44,borderRadius:15,background:mod.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:mod.featured?24:20,flexShrink:0,marginBottom:mod.featured?0:12,boxShadow:mod.status==='live'?`0 4px 14px ${mod.color}33`:'none'}}>
                    {mod.icon}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                      <div style={{fontFamily:"'Sora',sans-serif",fontSize:mod.featured?18:15,fontWeight:800,letterSpacing:-.3,color:'#1a1a2e'}}>{mod.title}</div>
                      {mod.status==='live' ? (
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.25)',borderRadius:100,padding:'3px 10px',fontSize:9,fontWeight:700,color:'#1a7a35',letterSpacing:.5,textTransform:'uppercase'}}>
                            <div style={{width:5,height:5,borderRadius:'50%',background:'#30d158',animation:'lp 1.4s ease infinite'}}/>Live
                          </div>
                          <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(255,59,48,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#ff3b30'}}>→</div>
                        </div>
                      ) : (
                        <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(0,0,0,.05)',border:'1px solid rgba(0,0,0,.08)',borderRadius:100,padding:'3px 10px',fontSize:9,fontWeight:700,color:'rgba(26,26,46,.35)',letterSpacing:.5,textTransform:'uppercase'}}>Soon</div>
                      )}
                    </div>
                    <div style={{fontSize:13,color:'rgba(26,26,46,.55)',lineHeight:1.55}}>{mod.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div style={{marginTop:28,textAlign:'center',fontSize:11,color:'rgba(26,26,46,.3)',lineHeight:1.6}}>
            GratIA Core · {state||'Set your state in profile for local prices'} · More modules shipping soon
          </div>
        </div>
      </div>
    </>
  )
}