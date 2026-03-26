'use client'
// @ts-nocheck
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ── Logo ──────────────────────────────────────────────────────────────────────
function GratiaLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 270" height="28"
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

// ── Admin Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router  = useRouter()
  const [loading,    setLoading]    = useState(true)
  const [isAdmin,    setIsAdmin]    = useState(false)
  const [users,      setUsers]      = useState([])
  const [promoCodes, setPromoCodes] = useState([])
  const [waitlist,   setWaitlist]   = useState([])
  const [stats,      setStats]      = useState({
    totalUsers: 0, activeTrials: 0, paidUsers: 0, waitlistCount: 0
  })

  // New promo code form
  const [newCode,    setNewCode]    = useState('')
  const [newDays,    setNewDays]    = useState(20)
  const [newMaxUses, setNewMaxUses] = useState(20)
  const [creating,   setCreating]   = useState(false)
  const [activeTab,  setActiveTab]  = useState('overview')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!admin) { router.push('/'); return }

      setIsAdmin(true)
      await loadData()
      setLoading(false)
    }
    init()
  }, [])

  const loadData = async () => {
    // Load profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profiles) {
      setUsers(profiles)
      const now = new Date()
      setStats(s => ({
        ...s,
        totalUsers:   profiles.length,
        activeTrials: profiles.filter(p =>
          p.trial_ends_at && new Date(p.trial_ends_at) > now
        ).length,
        paidUsers: profiles.filter(p =>
          p.plan === 'driver' || p.plan === 'business'
        ).length,
      }))
    }

    // Load promo codes
    const { data: codes } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })
    if (codes) setPromoCodes(codes)

    // Load waitlist
    const { data: wl } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false })
    if (wl) {
      setWaitlist(wl)
      setStats(s => ({ ...s, waitlistCount: wl.length }))
    }
  }

  const createCode = async () => {
    if (!newCode.trim()) return
    setCreating(true)
    await supabase.from('promo_codes').insert({
      code:          newCode.toUpperCase().trim(),
      discount_type: 'trial_days',
      trial_days:    newDays,
      max_uses:      newMaxUses,
    })
    setNewCode('')
    await loadData()
    setCreating(false)
  }

  const toggleCode = async (id, active) => {
    await supabase.from('promo_codes').update({ active: !active }).eq('id', id)
    await loadData()
  }

  const deleteCode = async (id) => {
    await supabase.from('promo_codes').delete().eq('id', id)
    await loadData()
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',
      justifyContent:'center',fontFamily:"'DM Sans',sans-serif",
      background:'#f0eff4',color:'#1a1a2e',fontSize:15}}>
      Verifying access...
    </div>
  )

  if (!isAdmin) return null

  const now = new Date()

  const STAT_CARDS = [
    { label:'Total Users',   val:stats.totalUsers,    color:'#ff3b30', bg:'rgba(255,59,48,.08)'   },
    { label:'Active Trials', val:stats.activeTrials,  color:'#ff9f0a', bg:'rgba(255,159,10,.08)'  },
    { label:'Paid Users',    val:stats.paidUsers,     color:'#30d158', bg:'rgba(48,209,88,.08)'   },
    { label:'Waitlist',      val:stats.waitlistCount, color:'#0a84ff', bg:'rgba(10,132,255,.08)'  },
  ]

  const TABS = [
    { id:'overview', label:'Overview'   },
    { id:'users',    label:'Users'      },
    { id:'promos',   label:'Promo Codes'},
    { id:'waitlist', label:'Waitlist'   },
  ]

  const glass = {
    background:     'rgba(255,255,255,0.72)',
    border:         '1px solid rgba(255,255,255,0.95)',
    backdropFilter: 'blur(40px)',
    borderRadius:   24,
    boxShadow:      '0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1)',
  }

  const inp = {
    padding:    '10px 14px',
    background: 'rgba(0,0,0,.04)',
    border:     '1.5px solid rgba(0,0,0,.1)',
    borderRadius: 12,
    fontSize:   14,
    color:      '#1a1a2e',
    outline:    'none',
    fontFamily: "'DM Sans',sans-serif",
    width:      '100%',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;font-family:'DM Sans',sans-serif;color:#1a1a2e;overflow-x:hidden}
        body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 70% 50% at 15% 10%,rgba(255,59,48,0.06) 0%,transparent 60%),linear-gradient(160deg,#f5f4f9 0%,#eceaf2 40%,#f2f0f7 100%);pointer-events:none;z-index:0}
        .page{position:relative;z-index:1;min-height:100vh;padding:0 0 80px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .tab-btn:hover{background:rgba(0,0,0,.04)!important}
        .row-hover:hover{background:rgba(255,59,48,.03)!important}
        .code-row:hover{background:rgba(0,0,0,.02)!important}
        input:focus{border-color:#ff3b30!important;box-shadow:0 0 0 3px rgba(255,59,48,.1)!important}
      `}</style>

      <div className="page">

        {/* ── Topbar ── */}
        <div style={{
          ...glass,
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          padding: '0 32px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 40,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <GratiaLogo/>
            <div style={{
              width:1, height:20,
              background:'rgba(0,0,0,.1)',
            }}/>
            <span style={{
              fontSize:11,fontWeight:700,letterSpacing:2,
              color:'#ff3b30',textTransform:'uppercase',
            }}>Admin</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <a href="/" style={{
              fontSize:13,fontWeight:500,color:'rgba(26,26,46,.5)',
              textDecoration:'none',
            }}>← Back to site</a>
            <button onClick={signOut} style={{
              padding:'7px 16px',
              background:'rgba(255,59,48,.08)',
              border:'1px solid rgba(255,59,48,.2)',
              borderRadius:12,fontSize:13,fontWeight:600,
              cursor:'pointer',color:'#ff3b30',
              fontFamily:"'DM Sans',sans-serif",
            }}>Sign Out</button>
          </div>
        </div>

        <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px'}}>

          {/* ── Page title ── */}
          <div style={{marginBottom:32,animation:'fadeUp .5s ease'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,
              color:'#ff3b30',textTransform:'uppercase',marginBottom:6}}>
              GratIA Core · Business Intelligence Agency
            </div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:36,
              fontWeight:900,letterSpacing:-1.5,color:'#1a1a2e'}}>
              Dashboard
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',
            gap:14,marginBottom:32,animation:'fadeUp .5s ease .05s both'}}>
            {STAT_CARDS.map(s => (
              <div key={s.label} style={{
                ...glass,
                padding:'22px 24px',
                borderLeft:`3px solid ${s.color}`,
              }}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:1,
                  background:`linear-gradient(90deg,${s.color}44,transparent)`}}/>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,
                  color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:8}}>
                  {s.label}
                </div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:42,
                  fontWeight:900,letterSpacing:-2,color:s.color,lineHeight:1}}>
                  {s.val}
                </div>
              </div>
            ))}
          </div>

          {/* ── Tab nav ── */}
          <div style={{display:'flex',gap:6,marginBottom:24,
            animation:'fadeUp .5s ease .1s both'}}>
            {TABS.map(t => (
              <button key={t.id} className="tab-btn"
                onClick={()=>setActiveTab(t.id)}
                style={{
                  padding:'8px 20px',borderRadius:100,
                  fontSize:13,fontWeight:600,cursor:'pointer',
                  fontFamily:"'DM Sans',sans-serif",
                  background:   activeTab===t.id
                    ? 'linear-gradient(135deg,#ff3b30,#ff6b35)'
                    : 'rgba(255,255,255,.7)',
                  color:        activeTab===t.id ? '#fff' : 'rgba(26,26,46,.6)',
                  border:       activeTab===t.id
                    ? 'none'
                    : '1px solid rgba(0,0,0,.08)',
                  boxShadow:    activeTab===t.id
                    ? '0 4px 12px rgba(255,59,48,.3)' : 'none',
                  transition:   'all .2s',
                }}>
                {t.label}
                {t.id==='users'    && ` (${stats.totalUsers})`}
                {t.id==='promos'   && ` (${promoCodes.length})`}
                {t.id==='waitlist' && ` (${stats.waitlistCount})`}
              </button>
            ))}
          </div>

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === 'overview' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>

              {/* Recent signups */}
              <div style={{...glass,padding:24}}>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,
                  fontWeight:800,letterSpacing:-.5,marginBottom:20}}>
                  Recent signups
                </div>
                {users.slice(0,8).map((u:any) => {
                  const trialActive = u.trial_ends_at && new Date(u.trial_ends_at) > now
                  const daysLeft = u.trial_ends_at
                    ? Math.max(0, Math.ceil(
                        (new Date(u.trial_ends_at).getTime() - Date.now())
                        / (1000*60*60*24)
                      ))
                    : 0
                  return (
                    <div key={u.id} className="row-hover" style={{
                      display:'flex',alignItems:'center',justifyContent:'space-between',
                      padding:'10px 8px',borderBottom:'1px solid rgba(0,0,0,.06)',
                      borderRadius:8,transition:'background .15s',
                    }}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>
                          {u.email}
                        </div>
                        <div style={{fontSize:11,color:'rgba(26,26,46,.4)',marginTop:2}}>
                          {u.user_type||'unknown'} · {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{
                        fontSize:10,fontWeight:700,padding:'3px 10px',
                        borderRadius:100,whiteSpace:'nowrap',
                        background: trialActive
                          ? 'rgba(255,159,10,.12)'
                          : u.plan==='free'
                            ? 'rgba(0,0,0,.05)'
                            : 'rgba(48,209,88,.12)',
                        color: trialActive
                          ? '#854f0b'
                          : u.plan==='free'
                            ? 'rgba(26,26,46,.4)'
                            : '#1a7a35',
                        border: `1px solid ${trialActive
                          ? 'rgba(255,159,10,.25)'
                          : u.plan==='free'
                            ? 'rgba(0,0,0,.1)'
                            : 'rgba(48,209,88,.25)'}`,
                      }}>
                        {trialActive ? `${daysLeft}d left` : u.plan}
                      </div>
                    </div>
                  )
                })}
                {users.length > 8 && (
                  <button onClick={()=>setActiveTab('users')} style={{
                    marginTop:12,width:'100%',padding:'8px',
                    background:'transparent',border:'1px solid rgba(0,0,0,.08)',
                    borderRadius:10,fontSize:12,color:'rgba(26,26,46,.4)',
                    cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
                  }}>
                    View all {users.length} users →
                  </button>
                )}
              </div>

              {/* Active promo codes */}
              <div style={{...glass,padding:24}}>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,
                  fontWeight:800,letterSpacing:-.5,marginBottom:20}}>
                  Active promo codes
                </div>
                {promoCodes.filter((c:any)=>c.active).map((c:any) => (
                  <div key={c.id} style={{
                    padding:'12px 14px',background:'rgba(255,59,48,.04)',
                    border:'1px solid rgba(255,59,48,.12)',
                    borderRadius:14,marginBottom:10,
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',
                      alignItems:'center',marginBottom:6}}>
                      <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,
                        fontWeight:800,letterSpacing:1,color:'#ff3b30'}}>
                        {c.code}
                      </div>
                      <div style={{fontSize:12,fontWeight:600,color:'rgba(26,26,46,.5)'}}>
                        {c.uses_count}/{c.max_uses} uses
                      </div>
                    </div>
                    <div style={{height:4,background:'rgba(0,0,0,.08)',
                      borderRadius:2,overflow:'hidden'}}>
                      <div style={{
                        height:'100%',borderRadius:2,
                        background:'linear-gradient(90deg,#ff3b30,#ff6b35)',
                        width:`${Math.min((c.uses_count/c.max_uses)*100,100)}%`,
                      }}/>
                    </div>
                    <div style={{fontSize:11,color:'rgba(26,26,46,.4)',marginTop:6}}>
                      {c.trial_days} days free · {c.max_uses - c.uses_count} remaining
                    </div>
                  </div>
                ))}
                <button onClick={()=>setActiveTab('promos')} style={{
                  marginTop:4,width:'100%',padding:'8px',
                  background:'transparent',border:'1px solid rgba(0,0,0,.08)',
                  borderRadius:10,fontSize:12,color:'rgba(26,26,46,.4)',
                  cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
                }}>
                  Manage all codes →
                </button>
              </div>

            </div>
          )}

          {/* ══ USERS TAB ══ */}
          {activeTab === 'users' && (
            <div style={{...glass,padding:0,overflow:'hidden'}}>
              <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(0,0,0,.07)',
                display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,
                  fontWeight:800,letterSpacing:-.5}}>
                  All Users
                </div>
                <div style={{fontSize:12,color:'rgba(26,26,46,.4)'}}>
                  {users.length} total
                </div>
              </div>

              {/* Header row */}
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',
                padding:'10px 24px',background:'rgba(0,0,0,.02)',
                borderBottom:'1px solid rgba(0,0,0,.06)'}}>
                {['Email','Type','Plan','Trial ends','Joined'].map(h => (
                  <div key={h} style={{fontSize:10,fontWeight:700,
                    letterSpacing:1,color:'rgba(26,26,46,.35)',
                    textTransform:'uppercase'}}>{h}</div>
                ))}
              </div>

              {users.map((u:any) => {
                const trialActive = u.trial_ends_at && new Date(u.trial_ends_at) > now
                const daysLeft = u.trial_ends_at
                  ? Math.max(0, Math.ceil(
                      (new Date(u.trial_ends_at).getTime()-Date.now())
                      /(1000*60*60*24)
                    ))
                  : 0
                return (
                  <div key={u.id} className="row-hover" style={{
                    display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',
                    padding:'13px 24px',borderBottom:'1px solid rgba(0,0,0,.05)',
                    transition:'background .15s',
                  }}>
                    <div style={{fontSize:13,fontWeight:500,color:'#1a1a2e',
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                      paddingRight:12}}>
                      {u.email}
                    </div>
                    <div style={{fontSize:12,color:'rgba(26,26,46,.5)'}}>
                      {u.user_type||'—'}
                    </div>
                    <div>
                      <span style={{
                        fontSize:10,fontWeight:700,padding:'3px 9px',
                        borderRadius:100,
                        background: u.plan==='driver'||u.plan==='business'
                          ? 'rgba(48,209,88,.12)' : 'rgba(0,0,0,.05)',
                        color: u.plan==='driver'||u.plan==='business'
                          ? '#1a7a35' : 'rgba(26,26,46,.4)',
                        border: `1px solid ${u.plan==='driver'||u.plan==='business'
                          ? 'rgba(48,209,88,.25)' : 'rgba(0,0,0,.1)'}`,
                      }}>{u.plan||'free'}</span>
                    </div>
                    <div style={{fontSize:12,color: trialActive?'#ff9f0a':'rgba(26,26,46,.35)'}}>
                      {u.trial_ends_at
                        ? trialActive
                          ? `${daysLeft}d left`
                          : 'Expired'
                        : '—'}
                    </div>
                    <div style={{fontSize:12,color:'rgba(26,26,46,.4)'}}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ══ PROMO CODES TAB ══ */}
          {activeTab === 'promos' && (
            <div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:20}}>

              {/* Create new code */}
              <div style={{...glass,padding:24,height:'fit-content'}}>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,
                  fontWeight:800,letterSpacing:-.5,marginBottom:20}}>
                  Create code
                </div>

                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:1,
                    color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:6}}>
                    Code name
                  </div>
                  <input
                    placeholder="e.g. FOUNDING50"
                    value={newCode}
                    onChange={e=>setNewCode(e.target.value.toUpperCase())}
                    style={{...inp,letterSpacing:2,fontWeight:700,fontSize:16}}
                  />
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1,
                      color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:6}}>
                      Trial days
                    </div>
                    <input type="number" value={newDays}
                      onChange={e=>setNewDays(+e.target.value)} style={inp}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1,
                      color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:6}}>
                      Max uses
                    </div>
                    <input type="number" value={newMaxUses}
                      onChange={e=>setNewMaxUses(+e.target.value)} style={inp}/>
                  </div>
                </div>

                <button onClick={createCode} disabled={!newCode.trim()||creating}
                  style={{
                    width:'100%',padding:13,
                    background:newCode.trim()
                      ?'linear-gradient(135deg,#ff3b30,#ff6b35)'
                      :'rgba(255,59,48,.2)',
                    color:'#fff',border:'none',borderRadius:100,
                    fontSize:14,fontWeight:700,
                    cursor:newCode.trim()?'pointer':'not-allowed',
                    fontFamily:"'DM Sans',sans-serif",
                    boxShadow:newCode.trim()?'0 4px 14px rgba(255,59,48,.3)':'none',
                  }}>
                  {creating ? 'Creating...' : 'Create Code →'}
                </button>

                {/* Default codes reminder */}
                <div style={{marginTop:16,padding:'12px 14px',
                  background:'rgba(10,132,255,.06)',
                  border:'1px solid rgba(10,132,255,.15)',borderRadius:12}}>
                  <div style={{fontSize:11,fontWeight:600,color:'#0a84ff',marginBottom:4}}>
                    Your founding codes
                  </div>
                  {['GRATIA20','LAUNCH','FOUNDING'].map(c=>(
                    <div key={c} style={{fontSize:12,color:'rgba(26,26,46,.6)',
                      fontFamily:'monospace',marginBottom:2}}>
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* All codes list */}
              <div style={{...glass,padding:0,overflow:'hidden'}}>
                <div style={{padding:'18px 24px',borderBottom:'1px solid rgba(0,0,0,.07)'}}>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,
                    fontWeight:800,letterSpacing:-.5}}>
                    All codes
                  </div>
                </div>

                {promoCodes.map((c:any) => (
                  <div key={c.id} className="code-row" style={{
                    padding:'16px 24px',borderBottom:'1px solid rgba(0,0,0,.05)',
                    transition:'background .15s',
                  }}>
                    <div style={{display:'flex',alignItems:'center',
                      justifyContent:'space-between',marginBottom:10}}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,
                          fontWeight:900,letterSpacing:1,
                          color:c.active?'#ff3b30':'rgba(26,26,46,.3)'}}>
                          {c.code}
                        </div>
                        <div style={{
                          fontSize:10,fontWeight:700,padding:'3px 9px',
                          borderRadius:100,
                          background:c.active?'rgba(48,209,88,.12)':'rgba(0,0,0,.05)',
                          color:c.active?'#1a7a35':'rgba(26,26,46,.35)',
                          border:`1px solid ${c.active?'rgba(48,209,88,.25)':'rgba(0,0,0,.1)'}`,
                        }}>
                          {c.active?'Active':'Disabled'}
                        </div>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={()=>toggleCode(c.id,c.active)} style={{
                          padding:'6px 14px',
                          background:c.active?'rgba(255,159,10,.1)':'rgba(48,209,88,.1)',
                          border:`1px solid ${c.active?'rgba(255,159,10,.25)':'rgba(48,209,88,.25)'}`,
                          borderRadius:10,fontSize:12,fontWeight:600,
                          cursor:'pointer',
                          color:c.active?'#854f0b':'#1a7a35',
                          fontFamily:"'DM Sans',sans-serif",
                        }}>
                          {c.active?'Disable':'Enable'}
                        </button>
                        <button onClick={()=>deleteCode(c.id)} style={{
                          padding:'6px 12px',
                          background:'rgba(255,59,48,.08)',
                          border:'1px solid rgba(255,59,48,.2)',
                          borderRadius:10,fontSize:12,fontWeight:600,
                          cursor:'pointer',color:'#ff3b30',
                          fontFamily:"'DM Sans',sans-serif",
                        }}>
                          Delete
                        </button>
                      </div>
                    </div>

                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{flex:1,height:5,background:'rgba(0,0,0,.07)',
                        borderRadius:3,overflow:'hidden'}}>
                        <div style={{
                          height:'100%',borderRadius:3,
                          background:'linear-gradient(90deg,#ff3b30,#ff6b35)',
                          width:`${Math.min((c.uses_count/c.max_uses)*100,100)}%`,
                          transition:'width .3s ease',
                        }}/>
                      </div>
                      <div style={{fontSize:12,color:'rgba(26,26,46,.5)',
                        whiteSpace:'nowrap'}}>
                        {c.uses_count}/{c.max_uses} uses · {c.trial_days} days
                      </div>
                    </div>
                  </div>
                ))}

                {promoCodes.length === 0 && (
                  <div style={{padding:40,textAlign:'center',
                    color:'rgba(26,26,46,.3)',fontSize:14}}>
                    No promo codes yet. Create one on the left.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ WAITLIST TAB ══ */}
          {activeTab === 'waitlist' && (
            <div style={{...glass,padding:0,overflow:'hidden'}}>
              <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(0,0,0,.07)',
                display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,
                  fontWeight:800,letterSpacing:-.5}}>
                  Module Waitlist
                </div>
                <div style={{fontSize:12,color:'rgba(26,26,46,.4)'}}>
                  {waitlist.length} signups · Export from Supabase → Table Editor → waitlist → Export CSV
                </div>
              </div>

              {/* Group by module */}
              {['regulatory','tariff','deductions','assets'].map(mod => {
                const entries = waitlist.filter((w:any) => w.module === mod)
                if (!entries.length) return null
                return (
                  <div key={mod}>
                    <div style={{padding:'10px 24px',
                      background:'rgba(0,0,0,.02)',
                      borderBottom:'1px solid rgba(0,0,0,.05)'}}>
                      <span style={{fontSize:11,fontWeight:700,letterSpacing:1,
                        color:'#ff3b30',textTransform:'uppercase'}}>
                        {mod} — {entries.length} signups
                      </span>
                    </div>
                    {entries.map((w:any) => (
                      <div key={w.id} className="row-hover" style={{
                        display:'flex',justifyContent:'space-between',
                        padding:'11px 24px',borderBottom:'1px solid rgba(0,0,0,.04)',
                        transition:'background .15s',
                      }}>
                        <div style={{fontSize:13,color:'#1a1a2e'}}>{w.email}</div>
                        <div style={{fontSize:11,color:'rgba(26,26,46,.35)'}}>
                          {new Date(w.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}

              {waitlist.length === 0 && (
                <div style={{padding:60,textAlign:'center',
                  color:'rgba(26,26,46,.3)',fontSize:14}}>
                  No waitlist signups yet. They appear when someone clicks "Notify Me" on a coming soon module.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}