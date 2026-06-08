'use client'
// @ts-nocheck
import { useEffect, useState } from 'react'
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

function Toast({ message, type }: { message: string, type: 'success'|'error' }) {
  return (
    <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',zIndex:9999,background:type==='success'?'rgba(26,26,46,.97)':'rgba(255,59,48,.97)',backdropFilter:'blur(20px)',border:`1px solid ${type==='success'?'rgba(48,209,88,.3)':'rgba(255,255,255,.1)'}`,borderRadius:100,padding:'12px 24px',fontSize:13,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',gap:10,boxShadow:'0 8px 32px rgba(0,0,0,.3)',animation:'toastUp .3s cubic-bezier(.34,1.56,.64,1)'}}>
      <span>{type==='success'?'✓':''}</span>{message}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [user,        setUser]       = useState(null)
  const [profile,     setProfile]    = useState(null)
  const [loading,     setLoading]    = useState(true)
  const [saving,      setSaving]     = useState(false)
  const [toast,       setToast]      = useState(null)
  const [activeTab,   setActiveTab]  = useState('profile')
  const [showDelete,  setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  // Profile fields
  const [firstName,   setFirstName]  = useState('')
  const [lastName,    setLastName]   = useState('')
  const [stateName,   setStateName]  = useState('')
  const [bizName,     setBizName]    = useState('')
  const [phone,       setPhone]      = useState('')

  // Password fields
  const [currentPw,   setCurrentPw]  = useState('')
  const [newPw,       setNewPw]      = useState('')
  const [confirmPw,   setConfirmPw]  = useState('')
  const [pwError,     setPwError]    = useState('')

  // Notifications
  const [alertGas,    setAlertGas]   = useState(true)
  const [alertWeekly, setAlertWeekly]= useState(true)
  const [alertPromo,  setAlertPromo] = useState(false)

  // Appearance
  const [isDark,      setIsDark]     = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p)
        setFirstName(p.first_name || '')
        setLastName(p.last_name || '')
        setStateName(p.state || '')
        setBizName(p.business_name || '')
        setPhone(p.phone || '')
        setAlertGas(p.alert_gas_price !== false)
        setAlertWeekly(p.alert_weekly !== false)
        setAlertPromo(p.alert_promo === true)
        setIsDark(p.dark_mode === true || localStorage.getItem('gc_dark') === 'true')
      }
      setLoading(false)
    }
    init()
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      first_name:    firstName.trim() || null,
      last_name:     lastName.trim() || null,
      full_name:     [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null,
      state:         stateName || null,
      business_name: bizName.trim() || null,
      phone:         phone.trim() || null,
      updated_at:    new Date().toISOString(),
    }).eq('id', user.id)
    setSaving(false)
    if (error) showToast('Failed to save. Please try again.', 'error')
    else showToast('Profile saved successfully ✓')
  }

  const saveNotifications = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      alert_gas_price: alertGas,
      alert_weekly:    alertWeekly,
      alert_promo:     alertPromo,
    }).eq('id', user.id)
    setSaving(false)
    if (error) showToast('Failed to save.', 'error')
    else showToast('Notification preferences saved ✓')
  }

  const saveAppearance = async () => {
    localStorage.setItem('gc_dark', isDark.toString())
    const { error } = await supabase.from('profiles').update({ dark_mode: isDark }).eq('id', user.id)
    if (!error) showToast('Appearance saved ✓')
  }

  const changePassword = async () => {
    setPwError('')
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSaving(false)
    if (error) { setPwError(error.message); return }
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    showToast('Password updated successfully ✓')
  }

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setSaving(true)
    // Mark for deletion — actual deletion via server function
    await supabase.from('profiles').update({ 
      plan_status: 'deleted',
      deleted_at: new Date().toISOString() 
    }).eq('id', user.id)
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0eff4',color:'rgba(26,26,46,.4)',fontSize:14,fontFamily:'system-ui'}}>Loading...</div>

  const planKey = profile?.user_type === 'business' ? 'enterprise' : profile?.user_type === 'freelancer' ? 'pro' : 'core'
  const planColor = planKey === 'enterprise' ? '#bf5af2' : planKey === 'pro' ? '#0a84ff' : '#ff3b30'
  const planLabel = planKey === 'enterprise' ? 'Enterprise' : planKey === 'pro' ? 'Pro' : 'Core'

  const glass = (extra = {}) => ({
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: '0.5px solid rgba(255,255,255,0.92)',
    borderRadius: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    ...extra,
  })

  const inp = (extra = {}) => ({
    width: '100%', padding: '12px 16px',
    background: 'rgba(0,0,0,.03)',
    border: '1.5px solid rgba(0,0,0,.08)',
    borderRadius: 14, fontSize: 14, color: '#1a1a2e',
    outline: 'none', fontFamily: "'DM Sans',sans-serif",
    transition: 'border-color .2s', ...extra,
  })

  const TABS = [
    { id: 'profile',       icon: '👤', label: 'Profile' },
    { id: 'password',      icon: '🔒', label: 'Password' },
    { id: 'notifications', icon: '🔔', label: 'Alerts' },
    { id: 'appearance',    icon: '🎨', label: 'Appearance' },
    { id: 'danger',        icon: '⚠️', label: 'Account' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;background:#f0eff4;background-image:radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.07) 0%,transparent 55%);min-height:100vh;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        input:focus{border-color:${planColor}!important;outline:none}
        select:focus{border-color:${planColor}!important;outline:none}
        .tab-btn{transition:all .2s}
        .tab-btn:hover{background:rgba(0,0,0,.06)!important}
        .save-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(255,59,48,.4)!important}
      `}</style>

      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div style={{maxWidth:680,margin:'0 auto',padding:'0 16px 80px'}}>

        {/* Nav */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 0',marginBottom:8}}>
          <button onClick={()=>router.push('/dashboard')} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,color:'rgba(26,26,46,.5)',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>← Dashboard</button>
          <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:8}}>
            <GCIcon size={26}/>
            <span style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e'}}>Gratia Core</span>
          </Link>
          <div style={{fontSize:12,fontWeight:600,color:planColor,background:`${planColor}12`,border:`0.5px solid ${planColor}30`,borderRadius:100,padding:'4px 12px'}}>{planLabel}</div>
        </div>

        {/* Header */}
        <div style={{...glass({padding:'20px 24px',marginBottom:16}),animation:'fadeUp .5s ease both',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${planColor},transparent)`}}/>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:52,height:52,borderRadius:16,background:`linear-gradient(135deg,${planColor},${planColor}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900,color:'#fff',flexShrink:0,boxShadow:`0 4px 16px ${planColor}40`}}>
              {(profile?.first_name?.[0] || user?.email?.[0] || 'G').toUpperCase()}
            </div>
            <div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e',marginBottom:3}}>
                {profile?.first_name || profile?.full_name || 'Your Account'}
              </div>
              <div style={{fontSize:12,color:'rgba(26,26,46,.5)'}}>{user?.email} · {planLabel} Plan</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:6,marginBottom:16,overflowX:'auto',paddingBottom:4}}>
          {TABS.map(t => (
            <button key={t.id} className="tab-btn" onClick={()=>setActiveTab(t.id)}
              style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:100,border:'none',background:activeTab===t.id?`${planColor}15`:'rgba(255,255,255,.6)',color:activeTab===t.id?planColor:'rgba(26,26,46,.5)',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif",boxShadow:activeTab===t.id?`0 0 0 1.5px ${planColor}40`:'none'}}>
              <span style={{fontSize:14}}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div style={{...glass({padding:'24px'}),animation:'fadeUp .4s ease both'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:20}}>Profile Information</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:6}}>First name</div>
                <input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" style={inp()}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:6}}>Last name</div>
                <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" style={inp()}/>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:6}}>State</div>
              <select value={stateName} onChange={e=>setStateName(e.target.value)} style={{...inp(),appearance:'none',cursor:'pointer'}}>
                <option value="">Select your state</option>
                {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s=>(
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {(planKey === 'pro' || planKey === 'enterprise') && (
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:6}}>Business name</div>
                <input value={bizName} onChange={e=>setBizName(e.target.value)} placeholder="Your business name" style={inp()}/>
              </div>
            )}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:6}}>Phone (optional)</div>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+1 (555) 000-0000" style={inp()} type="tel"/>
            </div>
            <div style={{borderTop:'0.5px solid rgba(0,0,0,.06)',paddingTop:16}}>
              <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.4)',marginBottom:4}}>Email address</div>
              <div style={{fontSize:14,color:'rgba(26,26,46,.5)',background:'rgba(0,0,0,.03)',borderRadius:12,padding:'12px 16px'}}>{user?.email}</div>
              <div style={{fontSize:11,color:'rgba(26,26,46,.35)',marginTop:6}}>Email cannot be changed here. Contact support if needed.</div>
            </div>
            <button className="save-btn" onClick={saveProfile} disabled={saving}
              style={{marginTop:20,width:'100%',padding:13,background:`linear-gradient(135deg,${planColor},${planColor}cc)`,color:'#fff',border:'none',borderRadius:100,fontSize:14,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 16px ${planColor}35`,transition:'all .2s',opacity:saving?.6:1}}>
              {saving ? 'Saving...' : 'Save Profile →'}
            </button>
          </div>
        )}

        {/* Password tab */}
        {activeTab === 'password' && (
          <div style={{...glass({padding:'24px'}),animation:'fadeUp .4s ease both'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:20}}>Change Password</div>
            <div style={{background:'rgba(255,159,10,.06)',border:'0.5px solid rgba(255,159,10,.2)',borderRadius:14,padding:'12px 16px',marginBottom:20,fontSize:12,color:'#8a5c00',lineHeight:1.6}}>
              ⚠️ Make sure you're logged in on all devices before changing your password. You'll need to log in again after changing.
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:6}}>New password</div>
              <input type="password" value={newPw} onChange={e=>{setNewPw(e.target.value);setPwError('')}} placeholder="8+ characters" style={inp()}/>
            </div>
            <div style={{marginBottom:pwError?8:20}}>
              <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:6}}>Confirm new password</div>
              <input type="password" value={confirmPw} onChange={e=>{setConfirmPw(e.target.value);setPwError('')}} placeholder="Repeat password" style={inp({border:pwError?'1.5px solid #ff453a':undefined})}/>
            </div>
            {pwError && <div style={{fontSize:12,color:'#ff453a',marginBottom:16}}>{pwError}</div>}
            {/* Password strength */}
            {newPw.length > 0 && (
              <div style={{marginBottom:16}}>
                <div style={{display:'flex',gap:4,marginBottom:4}}>
                  {[1,2,3,4].map(n => (
                    <div key={n} style={{flex:1,height:3,borderRadius:2,background:n<=1&&newPw.length<6?'#ff453a':n<=2&&newPw.length>=6?'#ff9f0a':n<=3&&newPw.length>=8?'#30d158':n<=4&&newPw.length>=12?'#30d158':'rgba(0,0,0,.1)',transition:'background .3s'}}/>
                  ))}
                </div>
                <div style={{fontSize:10,color:'rgba(26,26,46,.4)'}}>{newPw.length<6?'Too short':newPw.length<8?'Weak':newPw.length<12?'Good':'Strong'}</div>
              </div>
            )}
            <button className="save-btn" onClick={changePassword} disabled={saving||newPw.length<8}
              style={{width:'100%',padding:13,background:newPw.length>=8?`linear-gradient(135deg,${planColor},${planColor}cc)`:'rgba(0,0,0,.08)',color:newPw.length>=8?'#fff':'rgba(26,26,46,.3)',border:'none',borderRadius:100,fontSize:14,fontWeight:700,cursor:newPw.length>=8&&!saving?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif",transition:'all .2s'}}>
              {saving ? 'Updating...' : 'Update Password →'}
            </button>
          </div>
        )}

        {/* Notifications tab */}
        {activeTab === 'notifications' && (
          <div style={{...glass({padding:'24px'}),animation:'fadeUp .4s ease both'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:20}}>Alert Preferences</div>
            {[
              { label:'Gas price drop alerts', sub:'Email when gas prices drop near your location', val:alertGas, set:setAlertGas },
              { label:'Weekly price summary', sub:'Monday morning summary of local gas & EV trends', val:alertWeekly, set:setAlertWeekly },
              { label:'Promotions & offers', sub:'Founding member deals and new feature announcements', val:alertPromo, set:setAlertPromo },
            ].map((item, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,paddingBottom:i<2?16:0,marginBottom:i<2?16:0,borderBottom:i<2?'0.5px solid rgba(0,0,0,.06)':'none'}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:3}}>{item.label}</div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.45)',lineHeight:1.5}}>{item.sub}</div>
                </div>
                <div onClick={()=>item.set(v=>!v)} style={{width:48,height:28,borderRadius:14,background:item.val?planColor:'rgba(0,0,0,.12)',position:'relative',cursor:'pointer',transition:'background .2s',flexShrink:0}}>
                  <div style={{position:'absolute',top:3,left:item.val?22:3,width:22,height:22,borderRadius:'50%',background:'#fff',transition:'left .2s cubic-bezier(.34,1.56,.64,1)',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
                </div>
              </div>
            ))}
            <button className="save-btn" onClick={saveNotifications} disabled={saving}
              style={{marginTop:20,width:'100%',padding:13,background:`linear-gradient(135deg,${planColor},${planColor}cc)`,color:'#fff',border:'none',borderRadius:100,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .2s'}}>
              {saving ? 'Saving...' : 'Save Preferences →'}
            </button>
          </div>
        )}

        {/* Appearance tab */}
        {activeTab === 'appearance' && (
          <div style={{...glass({padding:'24px'}),animation:'fadeUp .4s ease both'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:20}}>Appearance</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:3}}>Dark mode</div>
                <div style={{fontSize:11,color:'rgba(26,26,46,.45)'}}>Easier on the eyes at night</div>
              </div>
              <div onClick={()=>setIsDark(d=>!d)} style={{width:48,height:28,borderRadius:14,background:isDark?planColor:'rgba(0,0,0,.12)',position:'relative',cursor:'pointer',transition:'background .2s',flexShrink:0}}>
                <div style={{position:'absolute',top:3,left:isDark?22:3,width:22,height:22,borderRadius:'50%',background:'#fff',transition:'left .2s cubic-bezier(.34,1.56,.64,1)',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
              </div>
            </div>
            {/* Preview */}
            <div style={{borderRadius:18,overflow:'hidden',border:'0.5px solid rgba(0,0,0,.08)',marginBottom:20}}>
              <div style={{background:isDark?'#0a0a0f':'#f0eff4',padding:'16px',transition:'background .4s'}}>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:800,color:isDark?'#ebebf5':'#1a1a2e',marginBottom:6}}>Preview</div>
                <div style={{background:isDark?'rgba(255,255,255,.06)':'rgba(255,255,255,.65)',borderRadius:12,padding:'12px',border:`0.5px solid ${isDark?'rgba(255,255,255,.1)':'rgba(255,255,255,.92)'}`}}>
                  <div style={{fontSize:11,color:isDark?'rgba(235,235,245,.55)':'rgba(26,26,46,.55)'}}>Gas Intelligence · Live</div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,color:'#ff3b30'}}>$3.06</div>
                </div>
              </div>
            </div>
            <button className="save-btn" onClick={saveAppearance}
              style={{width:'100%',padding:13,background:`linear-gradient(135deg,${planColor},${planColor}cc)`,color:'#fff',border:'none',borderRadius:100,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .2s'}}>
              Save Appearance →
            </button>
          </div>
        )}

        {/* Danger zone tab */}
        {activeTab === 'danger' && (
          <div style={{animation:'fadeUp .4s ease both'}}>
            <div style={{...glass({padding:'24px',marginBottom:12})}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:16}}>Account Info</div>
              {[
                { label:'Email', val: user?.email },
                { label:'Plan', val: planLabel },
                { label:'Member since', val: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : 'Unknown' },
                { label:'Account ID', val: user?.id?.slice(0,8)+'...' },
              ].map((item, i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:i<3?12:0,marginBottom:i<3?12:0,borderBottom:i<3?'0.5px solid rgba(0,0,0,.06)':'none'}}>
                  <div style={{fontSize:12,color:'rgba(26,26,46,.45)'}}>{item.label}</div>
                  <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>{item.val}</div>
                </div>
              ))}
            </div>
            <div style={{...glass({padding:'24px',border:'0.5px solid rgba(255,69,58,.2)',background:'rgba(255,69,58,.03)'})}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'#ff453a',textTransform:'uppercase',marginBottom:12}}>⚠️ Danger Zone</div>
              <div style={{fontSize:13,color:'rgba(26,26,46,.55)',lineHeight:1.6,marginBottom:16}}>Deleting your account is permanent. All your data, saved stations, ideas, and history will be removed and cannot be recovered.</div>
              {!showDelete ? (
                <button onClick={()=>setShowDelete(true)} style={{padding:'10px 20px',background:'rgba(255,69,58,.08)',border:'0.5px solid rgba(255,69,58,.3)',borderRadius:100,fontSize:13,fontWeight:700,color:'#ff453a',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                  Delete my account
                </button>
              ) : (
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'#ff453a',marginBottom:8}}>Type DELETE to confirm:</div>
                  <div style={{display:'flex',gap:8}}>
                    <input value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value.toUpperCase())} placeholder="DELETE" style={{...inp(),flex:1,border:'1.5px solid rgba(255,69,58,.3)',letterSpacing:3,textTransform:'uppercase'}}/>
                    <button onClick={deleteAccount} disabled={deleteConfirm!=='DELETE'||saving}
                      style={{padding:'12px 20px',background:deleteConfirm==='DELETE'?'#ff453a':'rgba(0,0,0,.08)',color:deleteConfirm==='DELETE'?'#fff':'rgba(26,26,46,.3)',border:'none',borderRadius:14,fontSize:13,fontWeight:700,cursor:deleteConfirm==='DELETE'?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>
                      {saving?'Deleting...':'Confirm delete'}
                    </button>
                  </div>
                  <button onClick={()=>{setShowDelete(false);setDeleteConfirm('')}} style={{marginTop:10,background:'none',border:'none',fontSize:12,color:'rgba(26,26,46,.4)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}