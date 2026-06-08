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

// Mock regulatory feed — real data comes from RSS cron
const REG_FEED = [
  { id:1, agency:'IRS', tag:'Tax', title:'IRS Announces 2025 Standard Mileage Rate Increase to $0.70/mile', date:'Jun 3, 2026', urgency:'high', summary:'The IRS updated the standard mileage rate for business use of a vehicle. Affects all sole proprietors, S-corps, and LLCs filing Schedule C.', link:'#', industry:['all'] },
  { id:2, agency:'DOL', tag:'Labor', title:'Department of Labor Finalizes New Overtime Threshold Rule', date:'May 28, 2026', urgency:'high', summary:'Employees earning under $58,656/yr are now eligible for overtime pay. Restaurants, retail, and logistics operators need to audit payroll immediately.', link:'#', industry:['restaurant','retail','logistics'] },
  { id:3, agency:'OSHA', tag:'Safety', title:'OSHA Issues New Heat Illness Prevention Standard for Outdoor Workers', date:'May 20, 2026', urgency:'medium', summary:'New requirements for water, rest breaks, shade access, and emergency response plans for outdoor and indoor heat environments above 80°F.', link:'#', industry:['construction','trucking','agriculture'] },
  { id:4, agency:'FDA', tag:'Food', title:'FDA Updates Food Safety Modernization Act Traceability Requirements', date:'May 15, 2026', urgency:'medium', summary:'Food businesses must implement enhanced traceability records for certain high-risk foods by January 2026. Restaurant and food truck operators should review now.', link:'#', industry:['restaurant','food'] },
  { id:5, agency:'FTC', tag:'Trade', title:'FTC Bans Non-Compete Clauses for Most Workers — What Employers Must Do', date:'May 10, 2026', urgency:'low', summary:'The FTC rule banning most non-compete agreements is now in effect. Employers must notify affected workers and cannot enforce existing non-competes.', link:'#', industry:['all'] },
  { id:6, agency:'SBA', tag:'Funding', title:'SBA Launches $500M Emergency Capital Access Program for Small Business', date:'May 5, 2026', urgency:'low', summary:'New low-interest loan program for businesses with fewer than 50 employees. Applications open through SBA district offices. Priority given to minority-owned businesses.', link:'#', industry:['all'] },
]

const MARKET_DATA = [
  { label:'National Gas Avg', val:'$3.14', change:'+0.08', trend:'up', sub:'Regular unleaded · EIA' },
  { label:'Diesel National Avg', val:'$3.82', change:'-0.04', trend:'down', sub:'Commercial diesel · EIA' },
  { label:'Consumer Price Index', val:'3.1%', change:'+0.2%', trend:'up', sub:'Year-over-year · BLS' },
  { label:'Fed Funds Rate', val:'5.25%', change:'→ Hold', trend:'flat', sub:'Federal Reserve · FOMC' },
  { label:'USD/EUR Exchange', val:'0.924', change:'+0.003', trend:'up', sub:'Forex · Live' },
  { label:'Small Biz Sentiment', val:'89.7', change:'-1.2', trend:'down', sub:'NFIB Index · Monthly' },
]

const urgencyColor = (u) => u === 'high' ? '#ff453a' : u === 'medium' ? '#ff9f0a' : '#30d158'
const urgencyBg    = (u) => u === 'high' ? 'rgba(255,69,58,.1)' : u === 'medium' ? 'rgba(255,159,10,.1)' : 'rgba(48,209,88,.1)'

export default function EnterpriseDashboard() {
  const router  = useRouter()
  const [user,       setUser]      = useState(null)
  const [profile,    setProfile]   = useState(null)
  const [loading,    setLoading]   = useState(true)
  const [menuOpen,   setMenuOpen]  = useState(false)
  const [filterTag,  setFilterTag] = useState('all')
  const [savedIds,   setSavedIds]  = useState([])
  const menuRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p)
        if (p.user_type !== 'business') { router.push('/dashboard'); return }
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

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }
  const toggleSave = (id) => setSavedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#08080f',color:'rgba(255,255,255,.3)',fontSize:14,fontFamily:'system-ui'}}>
      Initializing Enterprise Intelligence...
    </div>
  )

  const hour        = new Date().getHours()
  const greeting    = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = profile?.first_name || profile?.business_name || profile?.full_name?.split(' ')[0] || 'Executive'
  const initial     = (profile?.first_name?.[0] || user?.email?.[0] || 'E').toUpperCase()
  const bizName     = profile?.business_name || 'Your Business'

  const tags = ['all', ...Array.from(new Set(REG_FEED.map(r => r.tag)))]
  const filtered = filterTag === 'all' ? REG_FEED : REG_FEED.filter(r => r.tag === filterTag)
  const highCount = REG_FEED.filter(r => r.urgency === 'high').length

  const NAV_ITEMS = [
    { icon:'🏠', label:'Dashboard',        href:'/dashboard'                    },
    { icon:'⚙️', label:'Settings',         href:'/dashboard/settings'           },
    { icon:'💡', label:'Ideas Vault',      href:'/dashboard/vault'              },
    { icon:'🤝', label:'Barter & Trade',   href:'/dashboard/barter'             },
    { icon:'📋', label:'Regulations',      href:'/dashboard/regulations/setup'  },
    { icon:'💳', label:'Billing',          href:'/dashboard/billing'            },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;700;800;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;background:#08080f;color:#e8e8f0;overflow-x:hidden;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes ddOpen{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .reg-card{transition:all .2s;border:0.5px solid rgba(255,255,255,.06)!important}
        .reg-card:hover{background:rgba(255,255,255,.06)!important;border-color:rgba(191,90,242,.2)!important;transform:translateY(-1px)}
        .market-card:hover{background:rgba(255,255,255,.08)!important}
        .nav-item:hover{background:rgba(255,255,255,.08)!important}
        .burger-bar{display:block;width:20px;height:1.5px;background:rgba(255,255,255,.7);border-radius:1px;transition:all .25s cubic-bezier(.4,0,.2,1)}
      `}</style>

      <div style={{minHeight:'100vh',background:'#08080f',backgroundImage:'radial-gradient(ellipse 60% 40% at 10% 0%,rgba(191,90,242,0.12) 0%,transparent 50%),radial-gradient(ellipse 40% 30% at 90% 100%,rgba(10,132,255,0.08) 0%,transparent 50%)',paddingBottom:80}}>

        {/* ── Top navbar ── */}
        <div ref={menuRef} style={{position:'fixed',top:0,left:0,right:0,zIndex:998,borderBottom:'0.5px solid rgba(255,255,255,.06)',backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',background:'rgba(8,8,15,.85)'}}>
          <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>

            {/* Left — burger + logo */}
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <button onClick={()=>setMenuOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',padding:'4px',display:'flex',flexDirection:'column',gap:5,flexShrink:0}}>
                <span className="burger-bar" style={{transform:menuOpen?'rotate(45deg) translate(4.5px,4.5px)':'none'}}/>
                <span className="burger-bar" style={{opacity:menuOpen?0:1}}/>
                <span className="burger-bar" style={{transform:menuOpen?'rotate(-45deg) translate(4.5px,-4.5px)':'none'}}/>
              </button>
              <div style={{width:1,height:20,background:'rgba(255,255,255,.1)'}}/>
              <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:8}}>
                <GCIcon size={24}/>
                <span style={{fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:800,color:'rgba(255,255,255,.9)',letterSpacing:-.3}}>Gratia Core</span>
                <span style={{fontSize:9,fontWeight:700,color:'#bf5af2',background:'rgba(191,90,242,.15)',border:'0.5px solid rgba(191,90,242,.3)',borderRadius:100,padding:'1px 7px',letterSpacing:.5}}>ENTERPRISE</span>
              </Link>
            </div>

            {/* Center — time */}
            <div style={{fontSize:11,color:'rgba(255,255,255,.25)',fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>
              {new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})} · {new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
            </div>

            {/* Right — alerts + avatar */}
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,69,58,.1)',border:'0.5px solid rgba(255,69,58,.25)',borderRadius:100,padding:'4px 12px',fontSize:11,fontWeight:700,color:'#ff453a'}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:'#ff453a',animation:'pulse 1.4s ease infinite'}}/>
                {highCount} High Priority
              </div>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#bf5af2,#da8fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0,cursor:'pointer'}}>{initial}</div>
            </div>
          </div>

          {/* Dropdown nav */}
          {menuOpen && (
            <div style={{position:'absolute',top:'100%',left:0,right:0,background:'rgba(8,8,15,.98)',backdropFilter:'blur(40px)',borderBottom:'0.5px solid rgba(255,255,255,.08)',animation:'ddOpen .2s ease',boxShadow:'0 20px 60px rgba(0,0,0,.6)',zIndex:997}}>
              <div style={{maxWidth:1200,margin:'0 auto',padding:'20px 24px'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,.25)',fontWeight:700,letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>Intelligence Suite · {bizName}</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:6}}>
                  {NAV_ITEMS.map(item => (
                    <div key={item.label} className="nav-item" onClick={()=>{router.push(item.href);setMenuOpen(false)}}
                      style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,.06)',background:'rgba(255,255,255,.03)',cursor:'pointer',transition:'all .15s'}}>
                      <span style={{fontSize:16}}>{item.icon}</span>
                      <span style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,.7)'}}>{item.label}</span>
                    </div>
                  ))}
                  <div className="nav-item" onClick={signOut}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:12,border:'0.5px solid rgba(255,69,58,.15)',background:'rgba(255,69,58,.05)',cursor:'pointer',transition:'all .15s'}}>
                    <span style={{fontSize:16}}>🚪</span>
                    <span style={{fontSize:13,fontWeight:600,color:'#ff453a'}}>Sign out</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Main content ── */}
        <div style={{maxWidth:1200,margin:'0 auto',padding:'72px 24px 0'}}>

          {/* Hero greeting */}
          <div style={{padding:'32px 0 28px',animation:'fadeUp .5s ease both'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:3,color:'rgba(191,90,242,.6)',textTransform:'uppercase',marginBottom:8}}>{greeting}, {displayName}</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:32,fontWeight:900,letterSpacing:-1.5,color:'#f0f0fa',lineHeight:1,marginBottom:6}}>Enterprise Intelligence</div>
            <div style={{fontSize:14,color:'rgba(255,255,255,.35)'}}>Regulatory updates · Market data · Business analytics</div>
          </div>

          {/* Market data ticker */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:24,animation:'fadeUp .5s ease .05s both'}}>
            {MARKET_DATA.slice(0,6).map((m,i)=>(
              <div key={i} className="market-card" style={{background:'rgba(255,255,255,.04)',border:'0.5px solid rgba(255,255,255,.06)',borderRadius:16,padding:'14px 18px',transition:'background .2s',cursor:'default'}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:'rgba(255,255,255,.25)',textTransform:'uppercase',marginBottom:4}}>{m.label}</div>
                <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:600,color:'#f0f0fa',lineHeight:1}}>{m.val}</div>
                  <div style={{fontSize:11,fontWeight:700,color:m.trend==='up'?'#ff453a':m.trend==='down'?'#30d158':'rgba(255,255,255,.3)'}}>{m.trend==='up'?'↑':m.trend==='down'?'↓':'→'} {m.change}</div>
                </div>
                <div style={{fontSize:9,color:'rgba(255,255,255,.2)',marginTop:4}}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16,animation:'fadeUp .5s ease .1s both'}}>

            {/* Left — Regulatory feed */}
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
                <div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:'#f0f0fa',marginBottom:2}}>Regulatory Updates</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>IRS · DOL · OSHA · FDA · FTC · SBA · Updated daily</div>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {tags.map(tag=>(
                    <button key={tag} onClick={()=>setFilterTag(tag)}
                      style={{padding:'5px 12px',borderRadius:100,border:`0.5px solid ${filterTag===tag?'rgba(191,90,242,.5)':'rgba(255,255,255,.08)'}`,background:filterTag===tag?'rgba(191,90,242,.15)':'transparent',color:filterTag===tag?'#bf5af2':'rgba(255,255,255,.4)',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",textTransform:'capitalize',transition:'all .2s'}}>
                      {tag === 'all' ? 'All' : tag}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {filtered.map((reg,i)=>(
                  <div key={reg.id} className="reg-card"
                    style={{background:'rgba(255,255,255,.03)',borderRadius:18,padding:'18px 20px',animation:`fadeUp .4s ease ${.1+i*.05}s both`,cursor:'default'}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:10}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                        <span style={{fontSize:10,fontWeight:700,color:urgencyColor(reg.urgency),background:urgencyBg(reg.urgency),border:`0.5px solid ${urgencyColor(reg.urgency)}40`,borderRadius:100,padding:'2px 8px',letterSpacing:.5}}>{reg.urgency.toUpperCase()}</span>
                        <span style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.4)',background:'rgba(255,255,255,.06)',borderRadius:100,padding:'2px 8px'}}>{reg.agency}</span>
                        <span style={{fontSize:10,fontWeight:700,color:'#bf5af2',background:'rgba(191,90,242,.1)',borderRadius:100,padding:'2px 8px'}}>{reg.tag}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                        <span style={{fontSize:10,color:'rgba(255,255,255,.25)',whiteSpace:'nowrap'}}>{reg.date}</span>
                        <button onClick={()=>toggleSave(reg.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:14,color:savedIds.includes(reg.id)?'#bf5af2':'rgba(255,255,255,.2)',transition:'color .2s',padding:0,lineHeight:1}}>
                          {savedIds.includes(reg.id)?'★':'☆'}
                        </button>
                      </div>
                    </div>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:700,color:'#f0f0fa',lineHeight:1.4,marginBottom:8}}>{reg.title}</div>
                    <div style={{fontSize:12,color:'rgba(255,255,255,.4)',lineHeight:1.65,marginBottom:12}}>{reg.summary}</div>
                    <div style={{display:'flex',gap:8}}>
                      <button style={{fontSize:11,fontWeight:700,color:'#bf5af2',background:'rgba(191,90,242,.1)',border:'0.5px solid rgba(191,90,242,.25)',borderRadius:100,padding:'5px 12px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .2s'}}>
                        Read full update →
                      </button>
                      <button style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.3)',background:'rgba(255,255,255,.04)',border:'0.5px solid rgba(255,255,255,.08)',borderRadius:100,padding:'5px 12px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                        Save for later
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{display:'flex',flexDirection:'column',gap:12}}>

              {/* Status card */}
              <div style={{background:'rgba(191,90,242,.08)',border:'0.5px solid rgba(191,90,242,.2)',borderRadius:20,padding:'18px 20px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:1.5,background:'linear-gradient(90deg,transparent,#bf5af2,transparent)'}}/>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(191,90,242,.6)',textTransform:'uppercase',marginBottom:10}}>Intelligence Status</div>
                {[
                  { label:'Regulatory feed', status:'Live', color:'#30d158' },
                  { label:'Market data', status:'Live', color:'#30d158' },
                  { label:'Tariff Intel', status:'Soon', color:'#ff9f0a' },
                  { label:'Market Intel', status:'Soon', color:'#ff9f0a' },
                  { label:'Assets & Liab', status:'Soon', color:'#ff9f0a' },
                ].map((s,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:i<4?10:0,marginBottom:i<4?10:0,borderBottom:i<4?'0.5px solid rgba(255,255,255,.06)':'none'}}>
                    <span style={{fontSize:12,color:'rgba(255,255,255,.5)'}}>{s.label}</span>
                    <span style={{fontSize:10,fontWeight:700,color:s.color,display:'flex',alignItems:'center',gap:4}}>
                      <span style={{width:5,height:5,borderRadius:'50%',background:s.color,display:'inline-block',animation:s.color==='#30d158'?'pulse 1.4s ease infinite':'none'}}/>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* High priority alerts */}
              <div style={{background:'rgba(255,69,58,.06)',border:'0.5px solid rgba(255,69,58,.2)',borderRadius:20,padding:'18px 20px'}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'#ff453a',textTransform:'uppercase',marginBottom:12}}>⚠️ Action Required</div>
                {REG_FEED.filter(r=>r.urgency==='high').map((r,i)=>(
                  <div key={i} style={{paddingBottom:i<REG_FEED.filter(x=>x.urgency==='high').length-1?10:0,marginBottom:i<REG_FEED.filter(x=>x.urgency==='high').length-1?10:0,borderBottom:i<REG_FEED.filter(x=>x.urgency==='high').length-1?'0.5px solid rgba(255,69,58,.1)':'none'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.7)',lineHeight:1.4,marginBottom:3}}>{r.title.length>60?r.title.slice(0,60)+'...':r.title}</div>
                    <div style={{fontSize:10,color:'rgba(255,69,58,.7)'}}>{r.agency} · {r.date}</div>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div style={{background:'rgba(255,255,255,.03)',border:'0.5px solid rgba(255,255,255,.06)',borderRadius:20,padding:'18px 20px'}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(255,255,255,.25)',textTransform:'uppercase',marginBottom:12}}>Quick Access</div>
                {[
                  { icon:'💡', label:'Ideas Vault',       href:'/dashboard/vault'   },
                  { icon:'🤝', label:'Barter & Trade',    href:'/dashboard/barter'  },
                  { icon:'💳', label:'Billing & Plan',    href:'/dashboard/billing' },
                  { icon:'⚙️', label:'Settings',          href:'/dashboard/settings'},
                ].map((l,i)=>(
                  <div key={i} onClick={()=>router.push(l.href)}
                    style={{display:'flex',alignItems:'center',gap:10,paddingBottom:i<3?10:0,marginBottom:i<3?10:0,borderBottom:i<3?'0.5px solid rgba(255,255,255,.05)':'none',cursor:'pointer',opacity:.8,transition:'opacity .15s'}}
                    onMouseOver={e=>e.currentTarget.style.opacity='1'} onMouseOut={e=>e.currentTarget.style.opacity='.8'}>
                    <span style={{fontSize:16}}>{l.icon}</span>
                    <span style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.6)'}}>{l.label}</span>
                    <span style={{marginLeft:'auto',fontSize:12,color:'rgba(255,255,255,.2)'}}>→</span>
                  </div>
                ))}
              </div>

              {/* Coming soon modules */}
              <div style={{background:'rgba(255,255,255,.02)',border:'0.5px solid rgba(255,255,255,.05)',borderRadius:20,padding:'18px 20px'}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(255,255,255,.2)',textTransform:'uppercase',marginBottom:12}}>Coming to Enterprise</div>
                {[
                  { icon:'🌐', label:'Tariff Intelligence', sub:'Import/export tracking' },
                  { icon:'📈', label:'Market Intelligence', sub:'Margins & trend analysis' },
                  { icon:'📊', label:'Assets & Liabilities', sub:'Balance sheet + PDF' },
                ].map((m,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,paddingBottom:i<2?10:0,marginBottom:i<2?10:0,borderBottom:i<2?'0.5px solid rgba(255,255,255,.04)':'none',opacity:.5}}>
                    <div style={{width:32,height:32,borderRadius:9,background:'rgba(255,255,255,.04)',border:'0.5px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{m.icon}</div>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.4)',filter:'blur(3px)'}}>{m.label}</div>
                      <div style={{fontSize:9,color:'rgba(255,255,255,.2)'}}>{m.sub}</div>
                    </div>
                    <span style={{marginLeft:'auto',fontSize:8,fontWeight:700,color:'rgba(255,255,255,.2)',background:'rgba(255,255,255,.04)',borderRadius:100,padding:'2px 7px'}}>SOON</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{textAlign:'center',padding:'32px 24px 0',fontSize:11,color:'rgba(255,255,255,.12)'}}>
          Gratia Core Enterprise · Business Intelligence Agency · 2026
        </div>
      </div>
    </>
  )
}