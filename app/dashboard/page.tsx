'use client'
// @ts-nocheck
import { useEffect, useState, useRef } from 'react'
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

const STATE_GAS_FALLBACK = {
  'Alabama':{'avg':3.12,'trend':'↓','change':'-0.04'},'Alaska':{'avg':4.82,'trend':'↑','change':'+0.08'},
  'Arizona':{'avg':3.71,'trend':'↓','change':'-0.06'},'Arkansas':{'avg':2.99,'trend':'↓','change':'-0.03'},
  'California':{'avg':4.94,'trend':'↑','change':'+0.12'},'Colorado':{'avg':3.58,'trend':'→','change':'+0.01'},
  'Florida':{'avg':3.51,'trend':'↑','change':'+0.03'},'Georgia':{'avg':3.19,'trend':'↓','change':'-0.05'},
  'Tennessee':{'avg':3.08,'trend':'↓','change':'-0.04'},'Texas':{'avg':2.94,'trend':'↓','change':'-0.02'},
  'New York':{'avg':4.35,'trend':'↑','change':'+0.09'},'Ohio':{'avg':3.58,'trend':'↑','change':'+0.04'},
}

// ── Plan → modules mapping ────────────────────────────────────
const PLAN_MODULES = {
  core:       ['gas','ev'],
  pro:        ['gas','ev','vault','barter'],
  enterprise: ['vault','barter','regulatory','tariff','market','assets'],
}

const MODULE_META = {
  gas:        { icon:'⛽', label:'Gas Intelligence',     sub:'Live prices near you',          live:true,  href:'/dashboard/gas',                  color:'rgba(255,59,48,0.12)'  },
  ev:         { icon:'⚡', label:'EV Intelligence',      sub:'Chargers near you',             live:true,  href:'/dashboard/ev',                   color:'rgba(48,209,88,0.12)'  },
  vault:      { icon:'💡', label:'Ideas Vault',          sub:'Protect your ideas',            live:true,  href:'/dashboard/vault',                color:'rgba(255,214,10,0.12)' },
  barter:     { icon:'🤝', label:'Barter & Trade',       sub:'Timestamp trade deals',         live:true,  href:'/dashboard/barter',               color:'rgba(10,132,255,0.12)' },
  regulatory: { icon:'📋', label:'Regulatory Updates',   sub:'IRS, OSHA, labor laws',         live:false, href:'/dashboard/regulations/setup',    color:'rgba(10,132,255,0.08)' },
  tariff:     { icon:'🌐', label:'Tariff Intelligence',  sub:'Import/export tracking',        live:false, href:null,                              color:'rgba(255,159,10,0.08)' },
  market:     { icon:'📈', label:'Market Intelligence',  sub:'Predict margins & trends',      live:false, href:null,                              color:'rgba(48,209,88,0.08)'  },
  assets:     { icon:'📊', label:'Assets & Liabilities', sub:'Balance sheet & net worth',     live:false, href:null,                              color:'rgba(191,90,242,0.08)' },
}

// ── Plan display info ─────────────────────────────────────────
const PLAN_INFO = {
  core:       { label:'Core',       price:'$9.99/mo',  color:'#ff3b30', upgrade:null },
  pro:        { label:'Pro',        price:'$19.99/mo', color:'#0a84ff', upgrade:null },
  enterprise: { label:'Enterprise', price:'$79.99/mo', color:'#bf5af2', upgrade:null },
}

// ── Nav items (plan-aware, rendered dynamically) ──────────────
function getNavItems(plan) {
  const base = [
    { icon:'🏠', label:'Dashboard',       sub:'Your home base',        href:'/dashboard',                   section:'main'    },
    { icon:'⛽', label:'Gas Intelligence', sub:'Live prices near you',  href:'/dashboard/gas',               section:'main'    },
    { icon:'⚡', label:'EV Intelligence',  sub:'Chargers near you',     href:'/dashboard/ev',                section:'main'    },
  ]
  const pro = [
    { icon:'💡', label:'Ideas Vault',      sub:'Protect your ideas',    href:'/dashboard/vault',             section:'main'    },
    { icon:'🤝', label:'Barter & Trade',   sub:'Timestamp trade deals', href:'/dashboard/barter',            section:'main'    },
  ]
  const enterprise = [
    { icon:'📋', label:'Regulations',      sub:'Stay ahead of rules',   href:'/dashboard/regulations/setup', section:'main'    },
  ]
  const account = [
    { icon:'💳', label:'My plan',          sub:'Billing & upgrades',    href:'/dashboard/billing',           section:'account' },
    { icon:'🚪', label:'Sign out',         sub:null,                    href:'signout',                      section:'account' },
  ]

  if (plan === 'enterprise') return [...base, ...pro, ...enterprise, ...account]
  if (plan === 'pro')        return [...base, ...pro, ...account]
  return [...base, ...account]
}

export default function DashboardPage() {
  const router  = useRouter()
  const [user,            setUser]          = useState(null)
  const [profile,         setProfile]       = useState(null)
  const [loading,         setLoading]       = useState(true)
  const [menuOpen,        setMenuOpen]      = useState(false)
  const [liveGasPrices,   setLiveGasPrices] = useState(STATE_GAS_FALLBACK)
  const [gasPriceUpdated, setGasPriceUpdated] = useState('')
  const [isDark,          setIsDark]        = useState(false)
  const [selectedState,   setSelectedState] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('gc_dark')
    if (saved === 'true') setIsDark(true)
  }, [])

  useEffect(() => { localStorage.setItem('gc_dark', isDark) }, [isDark])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const sessionId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('session_id') : null
      if (sessionId) {
        try {
          await fetch('/api/verify-session', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, userId: user.id }) })
          window.history.replaceState({}, '', '/dashboard')
        } catch(e) {}
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        setProfile(profile)
        setSelectedState(profile.state || 'Alabama')
        await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    fetch('/api/gas-prices').then(r=>r.json()).then(data=>{
      if (data.prices?.length) {
        const latestPrice = parseFloat(data.prices[0]?.price)
        const prevPrice   = data.prices[1] ? parseFloat(data.prices[1].price) : null
        const targetState = selectedState || profile?.state
        if (latestPrice && targetState) {
          const diff   = prevPrice ? latestPrice - prevPrice : 0
          const change = (diff >= 0 ? '+' : '') + diff.toFixed(2)
          const trend  = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
          setLiveGasPrices(prev => ({ ...prev, [targetState]: { avg: latestPrice, trend, change } }))
          setGasPriceUpdated(data.prices[0]?.period || '')
        }
      }
    }).catch(()=>{})
  }, [selectedState, profile?.state])

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }
  const handleNavClick = (item) => {
    setMenuOpen(false)
    if (!item.href) return
    if (item.href === 'signout') { signOut(); return }
    router.push(item.href)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0eff4',fontFamily:'system-ui',color:'rgba(26,26,46,.4)',fontSize:14}}>Loading...</div>
  )

  // ── Derived values ────────────────────────────────────────────
  const hour        = new Date().getHours()
  const greeting    = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = profile?.first_name || profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const initial     = (profile?.first_name?.[0] || user?.email?.[0] || 'G').toUpperCase()

  // Map user_type to plan key
  const planKey  = profile?.user_type === 'business' ? 'enterprise' : profile?.user_type === 'freelancer' ? 'pro' : 'core'
  const planInfo = PLAN_INFO[planKey] || PLAN_INFO.core
  const planStatus = profile?.plan_status
  const isActive = planStatus === 'active' || planStatus === 'trialing' || !!profile?.stripe_customer_id

  const state          = profile?.state
  const selectedStateGas = selectedState ? (liveGasPrices[selectedState] ?? STATE_GAS_FALLBACK[selectedState]) : null
  const myModules      = PLAN_MODULES[planKey] || PLAN_MODULES.core
  const NAV_ITEMS      = getNavItems(planKey)

  let daysLeft = null, onTrial = false
  if (profile?.trial_ends_at) {
    const end = new Date(profile.trial_ends_at)
    if (end > new Date()) {
      daysLeft = Math.ceil((end.getTime() - Date.now()) / (1000*60*60*24))
      onTrial  = true
    }
  }

  // ── Theme ────────────────────────────────────────────────────
  const D       = isDark
  const bg      = D ? '#0a0a0f' : '#f0eff4'
  const mesh    = D
    ? 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.12) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.08) 0%,transparent 50%)'
    : 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.09) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.07) 0%,transparent 50%)'
  const glass   = D ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)'
  const glassBdr= D ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.92)'
  const ink     = D ? '#ebebf5' : '#1a1a2e'
  const ink2    = D ? 'rgba(235,235,245,0.55)' : 'rgba(26,26,46,0.55)'
  const ink3    = D ? 'rgba(235,235,245,0.30)' : 'rgba(26,26,46,0.32)'
  const ddBg    = D ? 'rgba(18,18,24,0.97)' : 'rgba(255,255,255,0.97)'
  const ddBdr   = D ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const itemBg  = D ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'
  const itemHov = D ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'
  const sepClr  = D ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'

  const card = (extra = {}) => ({
    background: glass, backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
    border: `0.5px solid ${glassBdr}`, borderRadius:24,
    boxShadow: D ? '0 2px 20px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.06)', ...extra,
  })

  const navSections = [
    { key:'main',    label:'Navigation' },
    { key:'account', label:'Account'   },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes ddOpen{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .burger-bar{display:block;width:20px;height:1.5px;border-radius:1px;transition:all .25s cubic-bezier(.4,0,.2,1)}
        .gc-nav-item:hover{background:${itemHov}!important}
        .gc-mod-card:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(0,0,0,0.12)!important}
      `}</style>

      <div style={{background:bg,backgroundImage:mesh,minHeight:'100vh',color:ink,transition:'background .4s,color .3s',paddingBottom:60}}>

        {/* ── Navbar ── */}
        <div ref={menuRef} style={{position:'fixed',top:0,left:0,right:0,zIndex:998}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',maxWidth:1100,margin:'0 auto'}}>

            {/* Burger */}
            <button onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu"
              style={{background:'none',border:'none',cursor:'pointer',padding:'6px 4px',display:'flex',flexDirection:'column',gap:5,flexShrink:0}}>
              <span className="burger-bar" style={{background:ink,transform:menuOpen?'rotate(45deg) translate(4.5px,4.5px)':'none'}}/>
              <span className="burger-bar" style={{background:ink,opacity:menuOpen?0:1,transform:menuOpen?'translateX(-8px)':'none'}}/>
              <span className="burger-bar" style={{background:ink,transform:menuOpen?'rotate(-45deg) translate(4.5px,-4.5px)':'none'}}/>
            </button>

            {/* Logo */}
            <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:8}}>
              <GCIcon size={28}/>
              <span style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:800,letterSpacing:-.5,color:ink}}>Gratia Core</span>
            </Link>

            {/* Right */}
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:5,background:isActive?'rgba(48,209,88,0.10)':'rgba(255,59,48,0.10)',border:`0.5px solid ${isActive?'rgba(48,209,88,0.28)':'rgba(255,59,48,0.28)'}`,borderRadius:100,padding:'4px 12px',fontSize:11,fontWeight:700,color:isActive?'#1a7a35':'#cc2018'}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:isActive?'#30d158':'#ff3b30',animation:'lp 1.4s ease infinite'}}/>
                {onTrial ? `${daysLeft}d trial` : isActive ? planInfo.label : 'Subscribe'}
              </div>
              <div style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,${planInfo.color},${planInfo.color}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0,boxShadow:`0 2px 10px ${planInfo.color}55`}}>
                {initial}
              </div>
            </div>
          </div>

          {/* Dropdown */}
          {menuOpen && (
            <div style={{position:'absolute',top:'100%',left:0,right:0,background:ddBg,backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',borderBottom:`0.5px solid ${ddBdr}`,animation:'ddOpen .2s ease both',boxShadow:D?'0 16px 40px rgba(0,0,0,0.5)':'0 16px 40px rgba(0,0,0,0.12)',zIndex:997}}>
              <div style={{maxWidth:1100,margin:'0 auto',padding:'16px 20px'}}>

                {/* Header */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,paddingBottom:14,borderBottom:`0.5px solid ${sepClr}`}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:ink}}>{greeting}, {displayName}</div>
                    <div style={{fontSize:11,color:ink3,marginTop:2}}>{user?.email} · {planInfo.label} Plan</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:12,color:ink2}}>{isDark?'🌙 Dark':'☀️ Light'}</span>
                    <div onClick={()=>setIsDark(d=>!d)} style={{width:44,height:26,borderRadius:13,background:isDark?'#30d158':'rgba(0,0,0,0.15)',position:'relative',cursor:'pointer',transition:'background .2s',flexShrink:0}}>
                      <div style={{position:'absolute',top:3,left:isDark?21:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .2s cubic-bezier(.34,1.56,.64,1)',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
                    </div>
                  </div>
                </div>

                {/* Nav */}
                {navSections.map(sec => {
                  const items = NAV_ITEMS.filter(i => i.section === sec.key)
                  return (
                    <div key={sec.key} style={{marginBottom:14}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:ink3,textTransform:'uppercase',marginBottom:8}}>{sec.label}</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:6}}>
                        {items.map(item => {
                          const isSignout = item.href === 'signout'
                          return (
                            <div key={item.label} className="gc-nav-item" onClick={()=>handleNavClick(item)}
                              style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:14,border:`0.5px solid ${glassBdr}`,background:itemBg,cursor:'pointer',transition:'background .15s'}}>
                              <div style={{width:32,height:32,borderRadius:10,background:isSignout?'rgba(255,59,48,0.1)':itemHov,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{item.icon}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600,color:isSignout?'#ff3b30':ink,lineHeight:1.2}}>{item.label}</div>
                                {item.sub && <div style={{fontSize:10,color:ink3,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.sub}</div>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Main content ── */}
        <div style={{maxWidth:1100,margin:'0 auto',padding:'88px 20px 0',display:'grid',gridTemplateColumns:'1fr 260px',gap:16}}>

          <div>
            {/* Hero card */}
            <div style={{...card({padding:'24px 28px',marginBottom:14}),animation:'fadeUp .5s ease both',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,transparent,${planInfo.color},transparent)`}}/>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16,position:'relative',zIndex:1}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:ink3,textTransform:'uppercase',marginBottom:6}}>{greeting}{profile?.first_name?`, ${profile.first_name}`:''}</div>
                  <div style={{display:'inline-flex',alignItems:'center',gap:6,background:`${planInfo.color}12`,border:`0.5px solid ${planInfo.color}30`,borderRadius:100,padding:'5px 14px',marginBottom:12}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:planInfo.color,animation:'lp 1.4s ease infinite'}}/>
                    <span style={{fontSize:12,fontWeight:700,color:planInfo.color}}>{planInfo.label} Plan · {planInfo.price}</span>
                  </div>
                  <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,59,48,0.06)',border:'0.5px solid rgba(255,59,48,0.2)',borderRadius:100,padding:'6px 8px 6px 12px',marginBottom:12,marginLeft:8}}>
                    <span style={{fontSize:13}}>📍</span>
                    <select value={selectedState} onChange={e=>{setSelectedState(e.target.value);supabase.from('profiles').update({state:e.target.value}).eq('id',user?.id).then(()=>{})}}
                      style={{background:'none',border:'none',outline:'none',fontSize:13,fontWeight:700,color:'#cc2018',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",padding:0,appearance:'none',WebkitAppearance:'none'}}>
                      {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s=>(
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <span style={{fontSize:10,color:'#cc2018',opacity:.7}}>▾</span>
                  </div>
                  <div style={{fontSize:13,color:ink2,lineHeight:1.7}}>Your intelligence platform is ready.<br/>All modules below are live for your plan.</div>
                </div>
                {selectedStateGas && (
                  <div style={{background:'rgba(255,59,48,0.08)',border:'0.5px solid rgba(255,59,48,0.2)',borderRadius:18,padding:'14px 20px',textAlign:'center',minWidth:160,flexShrink:0}}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(255,59,48,.6)',textTransform:'uppercase',marginBottom:6}}>{selectedState} avg gas</div>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:42,fontWeight:900,letterSpacing:-2.5,color:'#ff3b30',lineHeight:1}}>${selectedStateGas.avg.toFixed(2)}</div>
                    <div style={{fontSize:11,fontWeight:700,marginTop:6,color:selectedStateGas.trend==='↓'?'#30d158':selectedStateGas.trend==='↑'?'#ff453a':ink3}}>
                      {selectedStateGas.trend} {selectedStateGas.change} this week
                    </div>
                    <div style={{fontSize:9,color:ink3,marginTop:2}}>Regular · EIA.gov</div>
                  </div>
                )}
              </div>
              <div style={{height:'0.5px',background:sepClr,margin:'16px 0'}}/>
              <div style={{fontSize:12,color:ink3}}>Gratia Core · Business Intelligence Agency</div>
            </div>

            {/* Subscribe banner */}
            {!isActive && (
              <div style={{...card({padding:'14px 20px',marginBottom:14}),background:'rgba(255,59,48,0.07)',border:'0.5px solid rgba(255,59,48,0.22)',animation:'fadeUp .5s ease .05s both',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:ink,marginBottom:2}}>Subscribe to keep access</div>
                  <div style={{fontSize:12,color:ink2}}>{planInfo.label} · {planInfo.price} · Cancel anytime</div>
                </div>
                <Link href="/dashboard/billing" style={{padding:'9px 20px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',borderRadius:100,fontSize:13,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap',boxShadow:'0 4px 12px rgba(255,59,48,.3)'}}>
                  Subscribe →
                </Link>
              </div>
            )}

            {/* Modules grid */}
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:ink3,textTransform:'uppercase',marginBottom:10,animation:'fadeUp .5s ease .08s both'}}>
              Your modules · {planInfo.label} plan
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,animation:'fadeUp .5s ease .1s both'}}>
              {myModules.map((modId, i) => {
                const m = MODULE_META[modId]
                if (!m) return null
                const isFeatured = modId === 'gas'
                return (
                  <div key={modId} className={m.live?'gc-mod-card':''} onClick={()=>m.live&&m.href&&router.push(m.href)}
                    style={{...card({padding:'18px 20px'}),gridColumn:isFeatured?'span 2':'span 1',cursor:m.live?'pointer':'default',opacity:m.live?1:0.6,transition:'transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s',border:isFeatured?`0.5px solid ${planInfo.color}40`:`0.5px solid ${glassBdr}`,position:'relative',overflow:'hidden',animation:`fadeUp .5s ease ${.12+i*.04}s both`}}>
                    {isFeatured && <div style={{position:'absolute',top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,transparent,${planInfo.color},transparent)`}}/>}
                    <div style={{display:'flex',alignItems:'center',gap:14,filter:!m.live?'blur(1px)':'none',userSelect:!m.live?'none':'auto'}}>
                      <div style={{width:isFeatured?48:40,height:isFeatured?48:40,borderRadius:13,background:m.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:isFeatured?22:18,flexShrink:0,border:`0.5px solid ${glassBdr}`,boxShadow:m.live?`0 4px 12px ${planInfo.color}30`:'none'}}>
                        {m.icon}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontFamily:"'Sora',sans-serif",fontSize:isFeatured?17:14,fontWeight:800,letterSpacing:-.3,color:ink}}>{m.label}</span>
                          {m.live
                            ? <span style={{display:'inline-flex',alignItems:'center',gap:3,background:'rgba(48,209,88,0.12)',border:'0.5px solid rgba(48,209,88,0.3)',borderRadius:100,padding:'2px 8px',fontSize:9,fontWeight:700,color:'#1a7a35',letterSpacing:.5}}><span style={{width:4,height:4,borderRadius:'50%',background:'#30d158',animation:'lp 1.4s ease infinite'}}/>Live</span>
                            : <span style={{display:'inline-flex',background:'rgba(0,0,0,0.06)',border:`0.5px solid ${glassBdr}`,borderRadius:100,padding:'2px 8px',fontSize:9,fontWeight:700,color:ink3,letterSpacing:.5}}>Soon</span>
                          }
                        </div>
                        <div style={{fontSize:12,color:ink2,lineHeight:1.5}}>{m.sub}</div>
                      </div>
                      {m.live && <div style={{width:28,height:28,borderRadius:'50%',background:`${planInfo.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:planInfo.color,flexShrink:0}}>→</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>

            {/* Plan card */}
            <div style={{...card({padding:'18px 20px'}),animation:'fadeUp .5s ease .04s both',border:`0.5px solid ${planInfo.color}30`}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:ink3,textTransform:'uppercase',marginBottom:12}}>Your plan</div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:`${planInfo.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                  {planKey==='enterprise'?'🏢':planKey==='pro'?'💼':'⛽'}
                </div>
                <div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:planInfo.color}}>{planInfo.label}</div>
                  <div style={{fontSize:11,color:ink3}}>{planInfo.price}</div>
                </div>
              </div>
              <div style={{fontSize:12,color:isActive?'#1a7a35':'#cc2018',fontWeight:600,marginBottom:10}}>
                {onTrial?`⏱ ${daysLeft} days left in trial`:isActive?'✓ Active subscription':'⚠ No active subscription'}
              </div>
              <Link href="/dashboard/billing" style={{display:'block',textAlign:'center',padding:'8px',background:`${planInfo.color}12`,border:`0.5px solid ${planInfo.color}30`,borderRadius:12,fontSize:12,fontWeight:700,color:planInfo.color,textDecoration:'none'}}>
                Manage plan →
              </Link>
            </div>

            {/* Quick stats */}
            <div style={{...card({padding:'18px 20px'}),animation:'fadeUp .5s ease .06s both'}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:ink3,textTransform:'uppercase',marginBottom:14}}>Quick stats</div>
              {[
                {label:'National gas trend', val:'↑ Rising',  sub:'Up $0.18 this month', color:'#ff453a'},
                {label:'EIA last updated',   val:gasPriceUpdated?new Date(gasPriceUpdated).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'This week', sub:'Live from EIA.gov API', color:ink2},
                {label:'Modules active',     val:`${myModules.filter(m=>MODULE_META[m]?.live).length}/${myModules.length}`, sub:`${planInfo.label} plan`, color:planInfo.color},
              ].map((s,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',paddingBottom:i<2?12:0,marginBottom:i<2?12:0,borderBottom:i<2?`0.5px solid ${sepClr}`:'none'}}>
                  <div>
                    <div style={{fontSize:11,color:ink3,marginBottom:2}}>{s.label}</div>
                    <div style={{fontSize:11,color:ink2}}>{s.sub}</div>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:s.color,textAlign:'right'}}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* All modules list */}
            <div style={{...card({padding:'18px 20px'}),animation:'fadeUp .5s ease .1s both'}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:ink3,textTransform:'uppercase',marginBottom:14}}>All modules</div>
              {myModules.map((modId,i)=>{
                const m = MODULE_META[modId]
                if (!m) return null
                return (
                  <div key={modId} onClick={()=>m.live&&m.href&&router.push(m.href)}
                    style={{display:'flex',alignItems:'center',gap:10,paddingBottom:i<myModules.length-1?10:0,marginBottom:i<myModules.length-1?10:0,borderBottom:i<myModules.length-1?`0.5px solid ${sepClr}`:'none',opacity:m.live?1:0.45,cursor:m.live?'pointer':'default'}}>
                    <span style={{fontSize:16,flexShrink:0}}>{m.icon}</span>
                    <span style={{flex:1,fontSize:13,fontWeight:500,color:ink}}>{m.label}</span>
                    {m.live
                      ? <span style={{fontSize:9,fontWeight:700,background:'rgba(48,209,88,0.12)',color:'#1a7a35',border:'0.5px solid rgba(48,209,88,0.25)',borderRadius:100,padding:'2px 7px'}}>Live</span>
                      : <span style={{fontSize:9,fontWeight:700,background:'rgba(0,0,0,0.05)',color:ink3,border:`0.5px solid ${glassBdr}`,borderRadius:100,padding:'2px 7px'}}>Soon</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{textAlign:'center',padding:'32px 20px 0',fontSize:11,color:ink3}}>
          Gratia Core · Business Intelligence Agency · {state||'Add your state for local prices'}
        </div>
      </div>
    </>
  )
}