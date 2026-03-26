'use client'
// @ts-nocheck
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function GratiaLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 270" height="26"
      style={{ display:'block', flexShrink:0 }}>
      <text x="60" y="250" fontFamily="'Arial Black','Arial Narrow',Arial,sans-serif"
        fontSize="180" fontWeight="900" fill="#1a1a2e" letterSpacing="-8">GRAT</text>
      <text x="554" y="250" fontFamily="'Arial Black','Arial Narrow',Arial,sans-serif"
        fontSize="180" fontWeight="900" fill="#ff3b30" letterSpacing="-8">IA</text>
      <text x="720" y="250" fontFamily="Arial,sans-serif"
        fontSize="180" fontWeight="100" fill="#1a1a2e" letterSpacing="-8"> CORE</text>
    </svg>
  )
}

const MODULES = [
  {
    id:       'gas',
    icon:     '⛽',
    title:    'Gas Price Tracker',
    desc:     'Real-time gas prices at stations near you. Compare grades, track 7-day trends, and calculate your exact IRS mileage deduction.',
    status:   'live',
    href:     '/dashboard/gas',
    meta:     'Live prices near you · ↓ Prices falling',
    color:    '#ff3b30',
    gradient: 'linear-gradient(135deg,#ff3b30,#ff6b35)',
  },
  {
    id:       'regulatory',
    icon:     '📋',
    title:    'Regulatory Updates',
    desc:     'IRS changes, OSHA rules, labor laws filtered to your industry. Never miss a compliance change.',
    status:   'soon',
    meta:     'IRS · OSHA · DOL · FDA',
    color:    '#0a84ff',
    gradient: 'linear-gradient(135deg,#0a84ff,#30a0ff)',
  },
  {
    id:       'tariff',
    icon:     '🌐',
    title:    'Tariff Intelligence',
    desc:     'Live import/export tariff rates. See how changes affect your cost of goods in real time.',
    status:   'soon',
    meta:     'China · Mexico · Canada · EU',
    color:    '#ff9f0a',
    gradient: 'linear-gradient(135deg,#ff9f0a,#ffb340)',
  },
  {
    id:       'deductions',
    icon:     '🧾',
    title:    'Deduction Teller',
    desc:     'Enter monthly expenses — we find what\'s deductible and what you\'re missing at tax time.',
    status:   'soon',
    meta:     'Average user finds $5,760/yr',
    color:    '#30d158',
    gradient: 'linear-gradient(135deg,#30d158,#4cd964)',
  },
  {
    id:       'assets',
    icon:     '📊',
    title:    'Assets & Liabilities',
    desc:     'Track net worth and generate a bank-ready one-page balance sheet your accountant wants.',
    status:   'soon',
    meta:     'PDF export · Bank-ready format',
    color:    '#bf5af2',
    gradient: 'linear-gradient(135deg,#bf5af2,#da8fff)',
  },
]

export default function DashboardPage() {
  const router  = useRouter()
  const [user,         setUser]        = useState(null)
  const [profile,      setProfile]     = useState(null)
  const [loading,      setLoading]     = useState(true)
  const [trialDaysLeft,setTrialDaysLeft]= useState(0)
  const [menuOpen,     setMenuOpen]    = useState(false)

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
          const days = Math.max(0, Math.ceil(
            (new Date(profile.trial_ends_at).getTime() - Date.now())
            / (1000 * 60 * 60 * 24)
          ))
          setTrialDaysLeft(days)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleNotifyMe = async (module) => {
    if (!user) return
    await supabase.from('waitlist').insert({
      email:  user.email,
      module,
    })
    alert(`✓ You'll be notified when ${module} launches!`)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',
      justifyContent:'center',background:'#f0eff4',
      fontFamily:"'DM Sans',sans-serif",color:'rgba(26,26,46,.5)',fontSize:14}}>
      Loading your dashboard...
    </div>
  )

  const firstName = profile?.email?.split('@')[0] || 'there'
  const isTrialActive = trialDaysLeft > 0
  const isPaid = profile?.plan === 'driver' || profile?.plan === 'business'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--red:#ff3b30;--ash:#f0eff4;--ash-3:#d8d7de;--ink:#1a1a2e;--ink-2:rgba(26,26,46,0.6);--ink-3:rgba(26,26,46,0.35)}
        body{background:var(--ash);font-family:'DM Sans',system-ui,sans-serif;color:var(--ink);overflow-x:hidden}
        body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 70% 50% at 15% 10%,rgba(255,59,48,0.06) 0%,transparent 60%),linear-gradient(160deg,#f5f4f9 0%,#eceaf2 40%,#f2f0f7 100%);pointer-events:none;z-index:0}
        .page{position:relative;z-index:1;min-height:100vh;padding-bottom:80px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes navSlide{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .navbar{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 10px 0 16px;height:56px;background:rgba(255,255,255,0.72);backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);border:1px solid rgba(255,255,255,0.95);border-radius:22px;box-shadow:0 2px 8px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,1);animation:navSlide 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .module-card{background:rgba(255,255,255,0.72);border:1px solid rgba(255,255,255,0.95);backdrop-filter:blur(40px) saturate(150%);border-radius:24px;padding:28px;position:relative;overflow:hidden;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1);color:inherit}
        .module-card.live{cursor:pointer}
        .module-card.live:hover{transform:translateY(-4px) scale(1.01);box-shadow:0 8px 32px rgba(0,0,0,0.1)}
        .module-card.live.active{border-color:rgba(255,59,48,0.25);box-shadow:0 2px 8px rgba(255,59,48,0.08),0 8px 24px rgba(255,59,48,0.06)}
        .module-card.live.active::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,59,48,0.5),transparent)}
        .module-card.locked{opacity:0.75}
        .live-dot{width:5px;height:5px;background:#30d158;border-radius:50%;animation:lp 1.4s ease-in-out infinite}
        .card-cta{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:linear-gradient(135deg,#ff3b30,#ff6b35);color:#fff;border-radius:12px;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;margin-top:4px;border:none;cursor:pointer;text-decoration:none;transition:all .2s}
        .card-cta:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(255,59,48,.3)}
        .notify-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:rgba(0,0,0,0.05);color:var(--ink-2);border-radius:12px;font-size:13px;font-weight:600;border:1px solid var(--ash-3);cursor:pointer;font-family:'DM Sans',sans-serif;margin-top:4px;transition:all .2s}
        .notify-btn:hover{background:rgba(0,0,0,.09)}
        .avatar-btn{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#ff3b30,#ff6b35);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;position:relative;flex-shrink:0}
        .dropdown{position:absolute;top:46px;right:0;background:rgba(255,255,255,.97);border:1px solid rgba(0,0,0,.09);border-radius:16px;padding:8px;min-width:180px;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:999}
        .dropdown-item{display:block;width:100%;padding:9px 12px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:500;color:#1a1a2e;font-family:'DM Sans',sans-serif;border-radius:10px;text-align:left;text-decoration:none;transition:background .15s}
        .dropdown-item:hover{background:rgba(0,0,0,.05)}
        .dropdown-item.danger{color:#ff3b30}
      `}</style>

      <div className="page">

        {/* ── Navbar ── */}
        <nav className="navbar">
          <Link href="/dashboard" style={{textDecoration:'none'}}>
            <GratiaLogo/>
          </Link>

          <div style={{display:'flex',alignItems:'center',gap:10,position:'relative'}}>
            {/* Trial badge */}
            {isTrialActive && !isPaid && (
              <div style={{
                fontSize:11,fontWeight:600,
                background:'rgba(255,159,10,.1)',
                border:'1px solid rgba(255,159,10,.25)',
                borderRadius:100,padding:'4px 12px',
                color:'#854f0b',whiteSpace:'nowrap',
              }}>
                {trialDaysLeft}d trial left
              </div>
            )}

            {/* Upgrade button */}
            {!isPaid && (
              <button style={{
                padding:'7px 16px',fontSize:12,fontWeight:700,
                background:'linear-gradient(135deg,#ff3b30,#ff6b35)',
                color:'#fff',border:'none',borderRadius:12,cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif",
                boxShadow:'0 2px 8px rgba(255,59,48,.3)',
                whiteSpace:'nowrap',
              }}>
                Upgrade $4.99 →
              </button>
            )}

            {/* Avatar dropdown */}
            <div style={{position:'relative'}}>
              <button className="avatar-btn" onClick={()=>setMenuOpen(o=>!o)}>
                {firstName[0]?.toUpperCase()}
              </button>
              {menuOpen && (
                <div className="dropdown">
                  <div style={{padding:'8px 12px 10px',borderBottom:'1px solid rgba(0,0,0,.07)',marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#1a1a2e',
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                      maxWidth:160}}>
                      {user?.email}
                    </div>
                    <div style={{fontSize:11,color:'rgba(26,26,46,.4)',marginTop:2}}>
                      {isPaid ? `${profile?.plan} plan` : isTrialActive ? `Trial — ${trialDaysLeft}d left` : 'Free plan'}
                    </div>
                  </div>
                  <Link href="/dashboard" className="dropdown-item" onClick={()=>setMenuOpen(false)}>
                    🏠 Dashboard
                  </Link>
                  <Link href="/dashboard/gas" className="dropdown-item" onClick={()=>setMenuOpen(false)}>
                    ⛽ Gas Tracker
                  </Link>
                  <Link href="/settings" className="dropdown-item" onClick={()=>setMenuOpen(false)}>
                    ⚙️ Settings
                  </Link>
                  <div style={{borderTop:'1px solid rgba(0,0,0,.07)',marginTop:6,paddingTop:6}}>
                    <button className="dropdown-item danger" onClick={signOut}>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* ── Main content ── */}
        <div style={{maxWidth:1100,margin:'0 auto',padding:'96px 24px 0'}}>

          {/* Welcome header */}
          <div style={{marginBottom:40,animation:'fadeUp .5s ease both'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,
              color:'#ff3b30',textTransform:'uppercase',marginBottom:8}}>
              GratIA Core · Business Intelligence Agency
            </div>
            <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:36,
              fontWeight:900,letterSpacing:-1.5,color:'#1a1a2e',marginBottom:8}}>
              Welcome back{firstName !== 'there' ? `, ${firstName}` : ''} 👋
            </h1>
            <p style={{fontSize:15,color:'rgba(26,26,46,.5)',lineHeight:1.6}}>
              {isTrialActive
                ? `You have ${trialDaysLeft} days left in your free trial. Explore your modules below.`
                : isPaid
                  ? 'Your account is active. All modules are available below.'
                  : 'Your trial has ended. Upgrade to continue full access.'}
            </p>
          </div>

          {/* Trial expiry warning */}
          {isTrialActive && trialDaysLeft <= 3 && !isPaid && (
            <div style={{
              background:'rgba(255,159,10,.09)',
              border:'1px solid rgba(255,159,10,.25)',
              borderRadius:16,padding:'14px 20px',marginBottom:28,
              display:'flex',alignItems:'center',justifyContent:'space-between',
              flexWrap:'wrap',gap:12,
              animation:'fadeUp .4s ease both',
            }}>
              <div style={{fontSize:14,color:'#854f0b',fontWeight:500}}>
                ⚠️ Your trial ends in {trialDaysLeft} day{trialDaysLeft!==1?'s':''} — upgrade to keep full access
              </div>
              <button style={{
                padding:'8px 20px',fontSize:13,fontWeight:700,
                background:'linear-gradient(135deg,#ff3b30,#ff6b35)',
                color:'#fff',border:'none',borderRadius:100,cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif",
                boxShadow:'0 4px 12px rgba(255,59,48,.3)',
              }}>
                Upgrade Now — $4.99/mo →
              </button>
            </div>
          )}

          {/* ── Module grid ── */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(3,1fr)',
            gap:16,
          }}>
            {MODULES.map((m, i) => (
              <div
                key={m.id}
                className={`module-card ${m.status === 'live' ? 'live active' : 'locked'}`}
                style={{
                  gridColumn: i === 0 ? 'span 2' : 'span 1',
                  animation:`fadeUp .5s ease ${i * .07}s both`,
                  ...(m.status === 'soon' ? {cursor:'default'} : {}),
                }}
                onClick={m.status === 'live' ? () => router.push(m.href) : undefined}
              >
                {/* Top row */}
                <div style={{display:'flex',alignItems:'flex-start',
                  justifyContent:'space-between',marginBottom:18}}>
                  <div style={{
                    width:48,height:48,borderRadius:14,
                    background:m.gradient,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:22,
                    boxShadow:`0 4px 12px ${m.color}33`,
                  }}>
                    {m.icon}
                  </div>

                  {m.status === 'live' ? (
                    <div style={{display:'flex',alignItems:'center',gap:5,
                      background:'rgba(48,209,88,0.12)',
                      border:'1px solid rgba(48,209,88,0.25)',
                      borderRadius:100,padding:'4px 10px',
                      fontSize:10,fontWeight:700,color:'#1a7a35',letterSpacing:.5}}>
                      <div className="live-dot"/>LIVE
                    </div>
                  ) : (
                    <div style={{display:'flex',alignItems:'center',gap:5,
                      background:'rgba(0,0,0,0.05)',
                      border:'1px solid rgba(0,0,0,.1)',
                      borderRadius:100,padding:'4px 10px',
                      fontSize:10,fontWeight:600,
                      color:'rgba(26,26,46,.35)',letterSpacing:.5}}>
                      🔒 Coming Soon
                    </div>
                  )}
                </div>

                {/* Title */}
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,
                  fontWeight:700,letterSpacing:-.5,color:'#1a1a2e',marginBottom:8}}>
                  {m.title}
                </div>

                {/* Description */}
                <div style={{fontSize:13.5,color:'rgba(26,26,46,.55)',
                  lineHeight:1.55,marginBottom:16}}>
                  {m.desc}
                </div>

                {/* Meta */}
                <div style={{
                  fontSize:12,fontWeight:600,marginBottom:16,
                  color: m.status === 'live' ? m.color : 'rgba(26,26,46,.35)',
                }}>
                  {m.meta}
                </div>

                {/* CTA */}
                {m.status === 'live' ? (
                  <Link href={m.href} className="card-cta"
                    onClick={e => e.stopPropagation()}>
                    Open {m.title} →
                  </Link>
                ) : (
                  <button className="notify-btn"
                    onClick={e => { e.stopPropagation(); handleNotifyMe(m.id) }}>
                    🔔 Notify Me
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div style={{marginTop:48,textAlign:'center',
            fontSize:12,color:'rgba(26,26,46,.3)',letterSpacing:.3}}>
            New modules launch every 4–6 weeks · Pro plan gets early access to everything
          </div>

        </div>
      </div>
    </>
  )
}