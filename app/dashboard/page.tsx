'use client'
// @ts-nocheck
import { useEffect, useState } from 'react'
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

const MODULES = [
  {
    id:       'gas',
    icon:     '⛽',
    title:    'Gas Price Tracker',
    desc:     'Real-time prices near you. Route finder, mileage deductions, and 7-day trend tracking.',
    status:   'live',
    href:     '/dashboard/gas',
    color:    '#ff3b30',
    bg:       'rgba(255,59,48,.1)',
    featured: true,
  },
  {
    id:       'regulatory',
    icon:     '📋',
    title:    'Regulatory Updates',
    desc:     'IRS changes, OSHA rules, labor laws filtered to your industry.',
    status:   'soon',
    color:    '#0a84ff',
    bg:       'rgba(10,132,255,.1)',
  },
  {
    id:       'deductions',
    icon:     '🧾',
    title:    'Deduction Teller',
    desc:     'Find every deduction you\'re missing at tax time.',
    status:   'soon',
    color:    '#30d158',
    bg:       'rgba(48,209,88,.1)',
  },
  {
    id:       'vault',
    icon:     '💡',
    title:    'Idea Vault',
    desc:     'Timestamp and seal your ideas with a PDF receipt.',
    status:   'soon',
    color:    '#ffd60a',
    bg:       'rgba(255,214,10,.1)',
  },
  {
    id:       'intelligence',
    icon:     '📈',
    title:    'Market Intelligence',
    desc:     'Predict profit margins and spot market trends before they happen.',
    status:   'soon',
    color:    '#bf5af2',
    bg:       'rgba(191,90,242,.1)',
  },
  {
    id:       'assets',
    icon:     '📊',
    title:    'Assets & Liabilities',
    desc:     'Track net worth and generate a bank-ready balance sheet.',
    status:   'soon',
    color:    '#ff9f0a',
    bg:       'rgba(255,159,10,.1)',
  },
]

export default function DashboardPage() {
  const router  = useRouter()
  const [user,        setUser]        = useState(null)
  const [profile,     setProfile]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [daysLeft,    setDaysLeft]    = useState<number|null>(null)
  const [onTrial,     setOnTrial]     = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setProfile(profile)
        if (profile.trial_ends_at) {
          const end  = new Date(profile.trial_ends_at)
          const now  = new Date()
          if (end > now) {
            const days = Math.ceil((end.getTime() - now.getTime()) / (1000*60*60*24))
            setDaysLeft(days)
            setOnTrial(true)
          }
        }
        // Update last seen — so we know when they last logged in
        await supabase
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', user.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const firstName = user?.email?.split('@')[0]?.split('.')[0] || 'there'
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const initial   = user?.email?.[0]?.toUpperCase() || 'G'

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0eff4',fontFamily:"system-ui",color:'rgba(26,26,46,.4)',fontSize:14}}>
      Loading...
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;font-family:'DM Sans',system-ui,sans-serif;color:#1a1a2e}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes navSlide{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .navbar{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 14px;height:56px;background:rgba(255,255,255,0.82);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.95);border-radius:22px;box-shadow:0 2px 8px rgba(0,0,0,0.06);animation:navSlide 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .module-card{background:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.95);border-radius:22px;padding:22px;position:relative;overflow:hidden;transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .module-card.live{cursor:pointer;border-color:rgba(255,59,48,.2)}
        .module-card.live:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.1)}
        .module-card.locked{cursor:default;opacity:.8}
        .locked-overlay{position:absolute;inset:0;border-radius:22px;background:rgba(240,239,244,0);display:flex;align-items:center;justify-content:center;opacity:0;transition:all .3s ease;backdrop-filter:blur(0px);z-index:5}
        .module-card.locked:hover .locked-overlay{background:rgba(240,239,244,.92);opacity:1;backdrop-filter:blur(8px)}
        .coming-text{font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:rgba(26,26,46,.4)}
        .avatar-btn{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#ff3b30,#ff6b35);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;cursor:pointer;border:none;flex-shrink:0}
        .dropdown{position:absolute;top:46px;right:0;background:rgba(255,255,255,.97);border:1px solid rgba(0,0,0,.09);border-radius:16px;padding:8px;min-width:190px;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:999}
        .dropdown-item{display:block;width:100%;padding:9px 12px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:500;color:#1a1a2e;font-family:'DM Sans',sans-serif;border-radius:10px;text-align:left;text-decoration:none;transition:background .15s}
        .dropdown-item:hover{background:rgba(0,0,0,.05)}
        .stat-card{background:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.95);border-radius:18px;padding:16px 18px;backdrop-filter:blur(40px)}
      `}</style>

      <div style={{background:'#f0eff4',backgroundImage:'radial-gradient(ellipse 70% 50% at 15% 10%,rgba(255,59,48,0.07) 0%,transparent 60%)',minHeight:'100vh',paddingBottom:80}}>

        {/* Navbar */}
        <nav className="navbar">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <GCIcon size={32}/>
            <div style={{display:'flex',flexDirection:'column',lineHeight:1}}>
              <span style={{fontFamily:"'Arial Black',Arial,sans-serif",fontSize:13,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e'}}>GRAT<span style={{color:'#ff3b30'}}>IA</span> CORE</span>
              <span style={{fontSize:7,fontWeight:600,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>Business Intelligence</span>
            </div>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {/* Trial pill — only if on trial */}
            {onTrial && daysLeft !== null && (
              <div style={{display:'flex',alignItems:'center',gap:5,background:daysLeft<=2?'rgba(255,59,48,.1)':'rgba(48,209,88,.08)',border:`1px solid ${daysLeft<=2?'rgba(255,59,48,.25)':'rgba(48,209,88,.2)'}`,borderRadius:100,padding:'4px 12px',fontSize:11,fontWeight:700,color:daysLeft<=2?'#cc2018':'#1a7a35'}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:daysLeft<=2?'#ff3b30':'#30d158',animation:'lp 1.4s ease infinite'}}/>
                {daysLeft}d left in trial
              </div>
            )}

            {/* Avatar + dropdown */}
            <div style={{position:'relative'}}>
              <button className="avatar-btn" onClick={()=>setMenuOpen(o=>!o)}>
                {initial}
              </button>
              {menuOpen && (
                <div className="dropdown">
                  <div style={{padding:'8px 12px 10px',borderBottom:'1px solid rgba(0,0,0,.07)',marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#1a1a2e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{user?.email}</div>
                    <div style={{fontSize:11,color:'rgba(26,26,46,.4)',marginTop:2}}>
                      {onTrial ? `Trial · ${daysLeft} days left` : profile?.plan_status === 'active' ? 'Core Pass · Active' : 'Core Pass'}
                    </div>
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

          {/* Welcome */}
          <div style={{marginBottom:24,animation:'fadeUp .5s ease both'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:4}}>{greeting}</div>
            <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:32,fontWeight:900,letterSpacing:-1.5,color:'#1a1a2e',lineHeight:1}}>
              Welcome back, {firstName} 👋
            </h1>
          </div>

          {/* Trial banner — only if on trial */}
          {onTrial && daysLeft !== null && (
            <div style={{background:daysLeft<=2?'rgba(255,59,48,.08)':'rgba(255,255,255,.82)',border:`1px solid ${daysLeft<=2?'rgba(255,59,48,.2)':'rgba(255,255,255,.95)'}`,borderRadius:18,padding:'14px 20px',marginBottom:24,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',animation:'fadeUp .5s ease .05s both'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:38,height:38,borderRadius:11,background:'rgba(255,59,48,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🎁</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'#1a1a2e',marginBottom:2}}>
                    {daysLeft === 1 ? 'Last day of your free trial' : `${daysLeft} days left in your free trial`}
                  </div>
                  <div style={{fontSize:12,color:'rgba(26,26,46,.5)'}}>
                    Core Pass · $4.99/mo · Card not charged until trial ends · Cancel anytime
                  </div>
                </div>
              </div>
              <Link href="/pricing" style={{padding:'9px 20px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',borderRadius:100,fontSize:13,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap',boxShadow:'0 4px 12px rgba(255,59,48,.3)'}}>
                {daysLeft <= 2 ? 'Subscribe Now →' : 'View Plan →'}
              </Link>
            </div>
          )}

          {/* Quick stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:28,animation:'fadeUp .5s ease .08s both'}}>
            {[
              {label:'Best gas near you',   val:'$3.04',   sub:'Live · EIA data',          color:'#ff3b30'},
              {label:'Est. monthly deduction', val:'$453', sub:'Based on 150 mi/wk',       color:'#30d158'},
              {label:'National avg trend',  val:'↑ Rising', sub:'Up $0.18 this month',     color:'#ff453a'},
            ].map((s,i)=>(
              <div key={i} className="stat-card" style={{animation:`fadeUp .5s ease ${.1+i*.04}s both`}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:6}}>{s.label}</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:900,letterSpacing:-1,color:s.color,lineHeight:1,marginBottom:4}}>{s.val}</div>
                <div style={{fontSize:11,color:'rgba(26,26,46,.45)'}}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Modules */}
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:14}}>Your modules</div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
            {MODULES.map((mod, i) => (
              <div
                key={mod.id}
                className={`module-card ${mod.status === 'live' ? 'live' : 'locked'}`}
                style={{
                  gridColumn: mod.featured ? 'span 2' : 'span 1',
                  animation: `fadeUp .5s ease ${.15+i*.04}s both`,
                }}
                onClick={() => mod.status === 'live' && mod.href && router.push(mod.href)}
              >
                {/* Coming soon overlay */}
                {mod.status === 'soon' && (
                  <div className="locked-overlay">
                    <div className="coming-text">Coming Soon</div>
                  </div>
                )}

                {/* Top stripe for live module */}
                {mod.status === 'live' && (
                  <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#ff3b30,transparent)'}}/>
                )}

                <div style={{
                  display: mod.featured ? 'flex' : 'block',
                  alignItems: 'flex-start',
                  gap: 16,
                  filter: mod.status === 'soon' ? 'blur(2px)' : 'none',
                  userSelect: mod.status === 'soon' ? 'none' : 'auto',
                }}>
                  <div style={{
                    width: mod.featured ? 52 : 44,
                    height: mod.featured ? 52 : 44,
                    borderRadius: 15,
                    background: mod.bg,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize: mod.featured ? 24 : 20,
                    flexShrink: 0,
                    marginBottom: mod.featured ? 0 : 12,
                    boxShadow: mod.status === 'live' ? `0 4px 14px ${mod.color}33` : 'none',
                  }}>
                    {mod.icon}
                  </div>

                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                      <div style={{fontFamily:"'Sora',sans-serif",fontSize:mod.featured?18:15,fontWeight:800,letterSpacing:-.3,color:'#1a1a2e'}}>{mod.title}</div>
                      {mod.status === 'live' ? (
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.25)',borderRadius:100,padding:'3px 10px',fontSize:9,fontWeight:700,color:'#1a7a35',letterSpacing:.5,textTransform:'uppercase'}}>
                            <div style={{width:5,height:5,borderRadius:'50%',background:'#30d158',animation:'lp 1.4s ease infinite'}}/>
                            Live Now
                          </div>
                          <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(255,59,48,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#ff3b30'}}>→</div>
                        </div>
                      ) : (
                        <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(0,0,0,.05)',border:'1px solid rgba(0,0,0,.08)',borderRadius:100,padding:'3px 10px',fontSize:9,fontWeight:700,color:'rgba(26,26,46,.35)',letterSpacing:.5,textTransform:'uppercase'}}>
                          Soon
                        </div>
                      )}
                    </div>
                    <div style={{fontSize:13,color:'rgba(26,26,46,.55)',lineHeight:1.55}}>{mod.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div style={{marginTop:32,textAlign:'center',fontSize:12,color:'rgba(26,26,46,.3)',lineHeight:1.6}}>
            GratIA Core · Business Intelligence Agency · More modules shipping soon
          </div>
        </div>
      </div>
    </>
  )
}