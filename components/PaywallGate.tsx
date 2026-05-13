'use client'
// components/PaywallGate.tsx

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ── Hook ───────────────────────────────────────────────────────
export function usePaywall(planRequired: 'driver' | 'freelancer' | 'business' = 'driver') {
  const [allowed,     setAllowed]     = useState(false)
  const [checking,    setChecking]    = useState(true)
  const [user,        setUser]        = useState(null)
  const [profile,     setProfile]     = useState(null)
  const [daysLeft,    setDaysLeft]    = useState<number|null>(null)
  const [trialActive, setTrialActive] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_ends_at, plan, plan_status, user_type')
        .eq('id', user.id)
        .single()

      setProfile(profile)

      const now      = new Date()
      const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
      const onTrial  = trialEnd && trialEnd > now

      if (onTrial && trialEnd) {
        const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        setDaysLeft(days)
        setTrialActive(true)
      }

      // ── KEY FIX: during trial = full access to everything ──
      // Only check plan level if trial is over
      const paidActive = profile?.plan_status === 'active' 
        || profile?.plan_status === 'trialing'
        || (!!profile?.stripe_customer_id && profile?.plan_status !== 'canceled' && profile?.plan_status !== 'taste')
      const planHierarchy: Record<string, number> = { driver:1, freelancer:2, business:3, free:0 }
      const requiredLevel = planHierarchy[planRequired] || 1
      const userLevel     = planHierarchy[profile?.plan || 'free'] || 0

      const hasAccess = !!onTrial || (paidActive && userLevel >= requiredLevel)

      setAllowed(hasAccess)
      setChecking(false)
    }
    check()
  }, [])

  return { allowed, checking, user, profile, daysLeft, trialActive }
}

// ── Trial Countdown Banner ─────────────────────────────────────
export function TrialBanner({ daysLeft }: { daysLeft: number | null }) {
  const router = useRouter()
  if (daysLeft === null || daysLeft <= 0) return null
  const urgent  = daysLeft <= 2
  const warning = daysLeft <= 5
  const color   = urgent ? '#ff3b30' : warning ? '#ff9f0a' : '#30d158'
  const bg      = urgent ? 'rgba(255,59,48,.08)' : warning ? 'rgba(255,159,10,.08)' : 'rgba(48,209,88,.08)'
  const border  = urgent ? 'rgba(255,59,48,.2)'  : warning ? 'rgba(255,159,10,.2)'  : 'rgba(48,209,88,.2)'
  const text    = urgent ? '#cc2018' : warning ? '#8a5c00' : '#1a7a35'

  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
        <span style={{ fontSize:13, fontWeight:600, color:text }}>
          {daysLeft === 1 ? '⚠️ Last day of your free trial —' : `${daysLeft} days left in your trial —`}
        </span>
        <span style={{ fontSize:12, color:'rgba(26,26,46,.45)' }}>
          {urgent ? 'Subscribe today to keep access' : 'no charge until trial ends'}
        </span>
      </div>
      <button onClick={() => router.push('/pricing')} style={{ padding:'7px 16px', background: urgent ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(0,0,0,.07)', color: urgent ? '#fff' : 'rgba(26,26,46,.7)', border:'none', borderRadius:100, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>
        {urgent ? 'Subscribe Now →' : 'View Plans'}
      </button>
    </div>
  )
}

// ── Paywall Screen ─────────────────────────────────────────────
export function PaywallScreen({ planRequired = 'driver' }: { planRequired?: string }) {
  const router    = useRouter()
  const [loading, setLoading] = useState(false)

  const PLAN_INFO: Record<string, any> = {
    driver:     { name:'Driver Pass',     price:'$4.99/mo',  color:'#ff3b30', emoji:'🚗', features:['Real-time gas prices near you','Route gas finder — cheapest on any trip','IRS mileage deduction calculator','Gas price drop alerts'] },
    freelancer: { name:'Freelancer Pass', price:'$7.99/mo',  color:'#0a84ff', emoji:'💼', features:['Everything in Driver Pass','Full deduction teller','Home office tracker','IRS rule change alerts'] },
    business:   { name:'Business Pass',   price:'$14.99/mo', color:'#30d158', emoji:'🏢', features:['Everything in Freelancer Pass','Live regulatory feed','Tariff intelligence','Labor law compliance updates'] },
  }
  const plan = PLAN_INFO[planRequired] || PLAN_INFO.driver

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()
      const res = await fetch('/api/create-checkout', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId: user.id, email: user.email, userType: profile?.user_type || planRequired }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (e: any) {
      alert(e.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0eff4', fontFamily:"'DM Sans',system-ui,sans-serif", padding:24 }}>
        <div style={{ maxWidth:440, width:'100%', background:'rgba(255,255,255,.9)', border:'1px solid rgba(255,255,255,.95)', borderRadius:28, padding:'40px 36px', backdropFilter:'blur(40px)', boxShadow:'0 8px 40px rgba(0,0,0,.1)', animation:'fadeUp .4s ease', textAlign:'center' }}>

          <div style={{ width:64, height:64, borderRadius:20, background:`linear-gradient(135deg,${plan.color},${plan.color}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 20px', boxShadow:`0 8px 24px ${plan.color}44` }}>
            {plan.emoji}
          </div>

          <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:plan.color, textTransform:'uppercase', marginBottom:8 }}>Trial Ended</div>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:24, fontWeight:900, letterSpacing:-1, color:'#1a1a2e', marginBottom:8, lineHeight:1.2 }}>Your free trial has ended</h2>
          <p style={{ fontSize:14, color:'rgba(26,26,46,.55)', lineHeight:1.65, marginBottom:24 }}>Subscribe to keep your access. Your work doesn't stop — neither should your tools.</p>

          <div style={{ background:`${plan.color}08`, border:`1.5px solid ${plan.color}22`, borderRadius:18, padding:'20px', marginBottom:20, textAlign:'left' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:17, fontWeight:800, color:'#1a1a2e' }}>{plan.name}</div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:900, color:plan.color }}>{plan.price}</div>
            </div>
            {plan.features.map((f: string, i: number) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(26,26,46,.7)', marginBottom:i<plan.features.length-1?7:0 }}>
                <span style={{ color:plan.color, fontWeight:700 }}>✓</span>{f}
              </div>
            ))}
          </div>

          <button onClick={handleUpgrade} disabled={loading} style={{ width:'100%', padding:14, background: loading ? 'rgba(255,59,48,.3)' : 'linear-gradient(135deg,#ff3b30,#ff6b35)', color:'#fff', border:'none', borderRadius:100, fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow: loading ? 'none' : '0 4px 16px rgba(255,59,48,.35)', marginBottom:10 }}>
            {loading ? 'Redirecting to checkout...' : `Subscribe — ${plan.price} →`}
          </button>

          <p style={{ fontSize:11, color:'rgba(26,26,46,.35)', lineHeight:1.6, margin:'0 0 16px' }}>Secure checkout via Stripe · Cancel anytime</p>

          <div style={{ borderTop:'1px solid rgba(0,0,0,.07)', paddingTop:14, display:'flex', justifyContent:'center', gap:20 }}>
            <button onClick={() => router.push('/pricing')} style={{ background:'none', border:'none', color:'rgba(26,26,46,.4)', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>View all plans</button>
            <button onClick={() => router.push('/dashboard')} style={{ background:'none', border:'none', color:'rgba(26,26,46,.4)', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Back to dashboard</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Taste Timer — 30 second preview before paywall ────────────
export function TasteTimer({ onExpire }: { onExpire: () => void }) {
  const [seconds, setSeconds] = React.useState(30)
  const [visible, setVisible] = React.useState(true)

  React.useEffect(() => {
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(t)
          onExpire()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  if (!visible) return null

  const pct = (seconds / 30) * 100
  const urgent = seconds <= 10

  return (
    <div style={{
      position:   'fixed',
      bottom:     24,
      left:       '50%',
      transform:  'translateX(-50%)',
      zIndex:     9998,
      background: urgent ? 'rgba(255,59,48,.97)' : 'rgba(26,26,46,.97)',
      backdropFilter: 'blur(20px)',
      border:     `1px solid ${urgent ? 'rgba(255,59,48,.4)' : 'rgba(255,255,255,.1)'}`,
      borderRadius: 100,
      padding:    '12px 20px',
      display:    'flex',
      alignItems: 'center',
      gap:        14,
      boxShadow:  '0 8px 32px rgba(0,0,0,.3)',
      fontFamily: "'DM Sans',system-ui,sans-serif",
      minWidth:   320,
      animation:  'tasteSlideUp .4s cubic-bezier(.34,1.56,.64,1)',
    }}>
      <style>{`@keyframes tasteSlideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* Progress ring */}
      <div style={{position:'relative',width:36,height:36,flexShrink:0}}>
        <svg width="36" height="36" style={{transform:'rotate(-90deg)'}}>
          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="3"/>
          <circle cx="18" cy="18" r="14" fill="none"
            stroke={urgent?'#fff':'#ff3b30'}
            strokeWidth="3"
            strokeDasharray={`${2*Math.PI*14}`}
            strokeDashoffset={`${2*Math.PI*14*(1-pct/100)}`}
            strokeLinecap="round"
            style={{transition:'stroke-dashoffset 1s linear'}}
          />
        </svg>
        <div style={{
          position:'absolute',inset:0,display:'flex',
          alignItems:'center',justifyContent:'center',
          fontSize:11,fontWeight:800,color:'#fff',
        }}>{seconds}</div>
      </div>

      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:2}}>
          {urgent ? '⚡ Preview ending soon!' : '⛽ Free preview — enjoy Gratia Core'}
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,.6)'}}>
          {urgent ? 'Subscribe to keep full access' : `${seconds}s left · No card required to explore`}
        </div>
      </div>

      <button
        onClick={onExpire}
        style={{
          padding:'8px 16px',
          background:'linear-gradient(135deg,#ff3b30,#ff6b35)',
          color:'#fff',
          border:'none',
          borderRadius:100,
          fontSize:12,
          fontWeight:700,
          cursor:'pointer',
          fontFamily:"'DM Sans',sans-serif",
          whiteSpace:'nowrap',
          flexShrink:0,
          boxShadow: urgent ? '0 0 16px rgba(255,255,255,.3)' : 'none',
        }}>
        Subscribe →
      </button>

      <button
        onClick={()=>setVisible(false)}
        style={{background:'none',border:'none',color:'rgba(255,255,255,.4)',cursor:'pointer',fontSize:16,padding:'4px',flexShrink:0,lineHeight:1}}>
        ✕
      </button>
    </div>
  )
}