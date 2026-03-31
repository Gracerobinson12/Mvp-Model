'use client'
// components/PaywallGate.tsx
// ─────────────────────────────────────────────────────────────
// Drop this at the top of any protected page
// Usage:
//   const { allowed, checking } = usePaywall()
//   if (checking) return <LoadingScreen/>
//   if (!allowed) return <PaywallScreen planRequired="driver"/>
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ── Hook — use this in any page ────────────────────────────────
export function usePaywall(planRequired: 'driver' | 'freelancer' | 'business' = 'driver') {
  const [allowed,  setAllowed]  = useState(false)
  const [checking, setChecking] = useState(true)
  const [user,     setUser]     = useState(null)
  const [profile,  setProfile]  = useState(null)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_ends_at, plan, plan_status')
        .eq('id', user.id)
        .single()

      setProfile(profile)

      const trialActive = profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()
      const planActive  = profile?.plan_status === 'active' || profile?.plan_status === 'trialing'

      // Determine access based on plan hierarchy
      const planHierarchy = { driver: 1, freelancer: 2, business: 3 }
      const userPlanLevel    = planHierarchy[profile?.plan] || 0
      const requiredPlanLevel = planHierarchy[planRequired] || 1

      const hasAccess = (trialActive || planActive) && userPlanLevel >= requiredPlanLevel

      setAllowed(hasAccess)
      setChecking(false)
    }
    check()
  }, [])

  return { allowed, checking, user, profile }
}

// ── Paywall Screen ─────────────────────────────────────────────
export function PaywallScreen({ planRequired = 'driver' }: { planRequired?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const PLAN_INFO = {
    driver:     { name:'Driver Pass',     price:'$4.99/mo', color:'#ff3b30', emoji:'🚗', features:['Real-time gas prices','Route gas finder','Mileage deductions','Price drop alerts'] },
    freelancer: { name:'Freelancer Pass', price:'$7.99/mo', color:'#0a84ff', emoji:'💼', features:['Everything in Driver Pass','Full deduction teller','Home office tracker','IRS rule change alerts'] },
    business:   { name:'Business Pass',   price:'$14.99/mo',color:'#30d158', emoji:'🏢', features:['Everything in Freelancer Pass','Regulatory updates feed','Tariff intelligence','Labor law compliance'] },
  }

  const plan = PLAN_INFO[planRequired] || PLAN_INFO.driver

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('user_type').eq('id', user.id).single()

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:   user.id,
          email:    user.email,
          userType: profile?.user_type || planRequired,
        }),
      })

      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url

    } catch (e: any) {
      alert(e.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     '#f0eff4',
        fontFamily:     "'DM Sans',system-ui,sans-serif",
        padding:        24,
      }}>
        <div style={{
          maxWidth:       440,
          width:          '100%',
          background:     'rgba(255,255,255,.85)',
          border:         '1px solid rgba(255,255,255,.95)',
          borderRadius:   28,
          padding:        '40px 36px',
          backdropFilter: 'blur(40px)',
          boxShadow:      '0 8px 40px rgba(0,0,0,.1)',
          animation:      'fadeUp .4s ease',
          textAlign:      'center',
        }}>

          {/* Icon */}
          <div style={{
            width:          64,
            height:         64,
            borderRadius:   20,
            background:     `linear-gradient(135deg,${plan.color},${plan.color}99)`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       28,
            margin:         '0 auto 20px',
            boxShadow:      `0 8px 24px ${plan.color}44`,
          }}>
            {plan.emoji}
          </div>

          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:plan.color,textTransform:'uppercase',marginBottom:8}}>
            Trial Ended
          </div>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:900,letterSpacing:-1,color:'#1a1a2e',marginBottom:8,lineHeight:1.2}}>
            Your free trial has ended
          </h2>
          <p style={{fontSize:14,color:'rgba(26,26,46,.55)',lineHeight:1.65,marginBottom:24}}>
            Subscribe to keep your access. Your work doesn't stop — neither should your tools.
          </p>

          {/* Plan card */}
          <div style={{
            background:   `${plan.color}08`,
            border:       `1.5px solid ${plan.color}22`,
            borderRadius: 18,
            padding:      '20px',
            marginBottom: 20,
            textAlign:    'left',
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,color:'#1a1a2e'}}>{plan.name}</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,color:plan.color}}>{plan.price}</div>
            </div>
            {plan.features.map((f,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'rgba(26,26,46,.7)',marginBottom:i<plan.features.length-1?7:0}}>
                <span style={{color:plan.color,fontWeight:700}}>✓</span>{f}
              </div>
            ))}
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              width:        '100%',
              padding:      14,
              background:   loading ? 'rgba(255,59,48,.3)' : `linear-gradient(135deg,#ff3b30,#ff6b35)`,
              color:        '#fff',
              border:       'none',
              borderRadius: 100,
              fontSize:     15,
              fontWeight:   700,
              cursor:       loading ? 'not-allowed' : 'pointer',
              fontFamily:   "'DM Sans',sans-serif",
              boxShadow:    loading ? 'none' : '0 4px 16px rgba(255,59,48,.35)',
              marginBottom: 10,
              transition:   'all .2s',
            }}>
            {loading ? 'Redirecting to checkout...' : `Subscribe — ${plan.price} →`}
          </button>

          <p style={{fontSize:11,color:'rgba(26,26,46,.35)',lineHeight:1.6,margin:'0 0 16px'}}>
            Secure checkout via Stripe · Cancel anytime
          </p>

          <div style={{borderTop:'1px solid rgba(0,0,0,.07)',paddingTop:14,display:'flex',justifyContent:'center',gap:20}}>
            <button
              onClick={() => router.push('/pricing')}
              style={{background:'none',border:'none',color:'rgba(26,26,46,.4)',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
              View all plans
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              style={{background:'none',border:'none',color:'rgba(26,26,46,.4)',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  )
}