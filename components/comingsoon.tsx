'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function GratiaLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 270" height="32"
      style={{ display:'block', flexShrink:0 }}>
      <text x="60" y="250" fontFamily="'Arial Black','Arial Narrow',Arial,sans-serif"
        fontSize="180" fontWeight="900" fill="white" letterSpacing="-8">GRAT</text>
      <text x="554" y="250" fontFamily="'Arial Black','Arial Narrow',Arial,sans-serif"
        fontSize="180" fontWeight="900" fill="rgba(255,255,255,0.5)" letterSpacing="-8">IA</text>
      <text x="720" y="250" fontFamily="Arial,sans-serif"
        fontSize="180" fontWeight="100" fill="rgba(255,255,255,0.8)" letterSpacing="-8"> CORE</text>
    </svg>
  )
}

// ── Change this to whatever password you want ──────────────────────────────
const ACCESS_CODE = 'GRATIA2025'

export default function ComingSoon() {
  const router  = useRouter()
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [email,   setEmail]   = useState('')
  const [joined,  setJoined]  = useState(false)

  // If already unlocked — redirect to main site
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gratia_access') === 'true') {
        router.push('/home')
      }
    }
  }, [])

  const handleUnlock = () => {
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      setLoading(true)
      localStorage.setItem('gratia_access', 'true')
      setTimeout(() => router.push('/home'), 600)
    } else {
      setError('Invalid access code. Try again.')
      setCode('')
    }
  }

  const handleWaitlist = async () => {
    if (!email.trim() || !email.includes('@')) return
    // Save to Supabase waitlist
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), module: 'launch' }),
      })
      setJoined(true)
      setEmail('')
    } catch {
      setJoined(true)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0a0f;font-family:'DM Sans',sans-serif;color:white;min-height:100vh;overflow:hidden}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        input:focus{outline:none;border-color:rgba(255,255,255,.4)!important}
      `}</style>

      {/* Background */}
      <div style={{position:'fixed',inset:0,zIndex:0,
        background:`
          radial-gradient(ellipse 80% 60% at 20% 20%, rgba(255,59,48,.18) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 80%, rgba(255,80,40,.1) 0%, transparent 55%),
          radial-gradient(ellipse 100% 80% at 50% 50%, rgba(20,10,30,.8) 0%, #0a0a0f 100%)
        `}}/>

      {/* Noise texture */}
      <div style={{position:'fixed',inset:0,zIndex:0,opacity:.04,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`}}/>

      <div style={{position:'relative',zIndex:1,minHeight:'100vh',
        display:'flex',flexDirection:'column',alignItems:'center',
        justifyContent:'center',padding:'40px 24px'}}>

        {/* Logo */}
        <div style={{marginBottom:48,animation:'fadeUp .8s ease .1s both'}}>
          <GratiaLogo/>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:4,
            color:'rgba(255,255,255,.35)',textTransform:'uppercase',
            textAlign:'center',marginTop:8}}>
            Business Intelligence Agency
          </div>
        </div>

        {/* Main card */}
        <div style={{
          background:'rgba(255,255,255,.05)',
          border:'1px solid rgba(255,255,255,.1)',
          borderRadius:28,
          padding:'44px 40px',
          maxWidth:460, width:'100%',
          backdropFilter:'blur(40px)',
          WebkitBackdropFilter:'blur(40px)',
          boxShadow:'0 32px 80px rgba(0,0,0,.4)',
          animation:'fadeUp .8s ease .2s both',
          textAlign:'center',
        }}>

          {/* Status badge */}
          <div style={{
            display:'inline-flex',alignItems:'center',gap:8,
            background:'rgba(255,59,48,.12)',
            border:'1px solid rgba(255,59,48,.25)',
            borderRadius:100,padding:'6px 16px',
            fontSize:11,fontWeight:700,letterSpacing:2,
            color:'#ff6b5b',textTransform:'uppercase',
            marginBottom:24,
          }}>
            <div style={{width:6,height:6,borderRadius:'50%',
              background:'#ff3b30',animation:'pulse 1.5s ease infinite'}}/>
            Private Beta
          </div>

          <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:36,
            fontWeight:900,letterSpacing:-1.5,lineHeight:1.1,
            color:'white',marginBottom:12}}>
            Something big<br/>is coming
          </h1>

          <p style={{fontSize:15,color:'rgba(255,255,255,.5)',
            lineHeight:1.65,marginBottom:36,maxWidth:340,margin:'0 auto 36px'}}>
            GratIA Core is in private beta. Enter your access code to get in early, or join the waitlist.
          </p>

          {/* Access code input */}
          <div style={{marginBottom:12}}>
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <input
                type="text"
                placeholder="Enter access code"
                value={code}
                onChange={e=>{setCode(e.target.value.toUpperCase());setError('')}}
                onKeyDown={e=>e.key==='Enter'&&handleUnlock()}
                autoFocus
                style={{
                  flex:1,padding:'13px 16px',
                  background:'rgba(255,255,255,.07)',
                  border:'1.5px solid rgba(255,255,255,.12)',
                  borderRadius:14,fontSize:15,color:'white',
                  fontFamily:"'DM Sans',sans-serif",
                  letterSpacing:3,textTransform:'uppercase',
                  transition:'border-color .2s',
                }}
              />
              <button onClick={handleUnlock} style={{
                padding:'13px 20px',
                background:'linear-gradient(135deg,#ff3b30,#ff6b35)',
                color:'#fff',border:'none',borderRadius:14,
                fontSize:14,fontWeight:700,cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif",
                boxShadow:'0 4px 16px rgba(255,59,48,.4)',
                whiteSpace:'nowrap',
              }}>
                {loading ? '...' : 'Unlock →'}
              </button>
            </div>
            {error && (
              <div style={{fontSize:12,color:'#ff6b5b',textAlign:'left',
                marginTop:4}}>
                {error}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{display:'flex',alignItems:'center',gap:12,
            margin:'24px 0',color:'rgba(255,255,255,.2)',fontSize:12}}>
            <div style={{flex:1,height:1,background:'rgba(255,255,255,.1)'}}/>
            or join the waitlist
            <div style={{flex:1,height:1,background:'rgba(255,255,255,.1)'}}/>
          </div>

          {/* Waitlist */}
          {!joined ? (
            <div style={{display:'flex',gap:8}}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleWaitlist()}
                style={{
                  flex:1,padding:'13px 16px',
                  background:'rgba(255,255,255,.07)',
                  border:'1.5px solid rgba(255,255,255,.12)',
                  borderRadius:14,fontSize:15,color:'white',
                  fontFamily:"'DM Sans',sans-serif",
                  transition:'border-color .2s',
                }}
              />
              <button onClick={handleWaitlist} style={{
                padding:'13px 20px',
                background:'rgba(255,255,255,.1)',
                color:'white',
                border:'1px solid rgba(255,255,255,.15)',
                borderRadius:14,fontSize:14,fontWeight:600,
                cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
                whiteSpace:'nowrap',
              }}>
                Notify Me
              </button>
            </div>
          ) : (
            <div style={{
              padding:'14px',
              background:'rgba(48,209,88,.1)',
              border:'1px solid rgba(48,209,88,.25)',
              borderRadius:14,fontSize:14,color:'#30d158',fontWeight:600,
            }}>
              ✓ You're on the list — we'll email you when we launch!
            </div>
          )}

          <p style={{fontSize:11,color:'rgba(255,255,255,.2)',marginTop:20,lineHeight:1.6}}>
            Have an access code? You'll get full access instantly.<br/>
            No credit card needed to join the waitlist.
          </p>

        </div>

        {/* Bottom modules preview */}
        <div style={{display:'flex',gap:16,marginTop:48,flexWrap:'wrap',
          justifyContent:'center',animation:'fadeUp .8s ease .4s both'}}>
          {[
            {icon:'⛽',label:'Gas Tracker'},
            {icon:'📋',label:'Regulatory'},
            {icon:'🌐',label:'Tariff Intel'},
            {icon:'🧾',label:'Deductions'},
            {icon:'📊',label:'Assets'},
          ].map(m=>(
            <div key={m.label} style={{
              display:'flex',alignItems:'center',gap:8,
              background:'rgba(255,255,255,.05)',
              border:'1px solid rgba(255,255,255,.08)',
              borderRadius:100,padding:'8px 16px',
              fontSize:12,fontWeight:500,
              color:'rgba(255,255,255,.4)',
            }}>
              <span style={{fontSize:14}}>{m.icon}</span>
              {m.label}
            </div>
          ))}
        </div>

        <div style={{marginTop:32,fontSize:12,color:'rgba(255,255,255,.2)',
          textAlign:'center',animation:'fadeUp .8s ease .5s both'}}>
          © 2025 GratIA Core LLC · Business Intelligence Agency
        </div>

      </div>
    </>
  )
}