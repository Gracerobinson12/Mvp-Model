'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

export default function LoginPage() {
  const router  = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (loginError) throw loginError

      const userId = data.user?.id

      // Check if admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('id', userId)
        .single()

      if (adminData) {
        router.push('/admin')
        return
      }

      // Check user type and redirect accordingly
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, onboarded')
        .eq('id', userId)
        .single()

      if (!profile?.onboarded) {
        router.push(`/onboarding?prefill=${profile?.user_type || ''}`)
      } else {
        router.push('/dashboard/gas')
      }

    } catch (e: any) {
      setError(e?.message || 'Invalid email or password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;font-family:'DM Sans',sans-serif;color:#1a1a2e;min-height:100vh}
        body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 70% 50% at 15% 10%,rgba(255,59,48,0.07) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 85% 80%,rgba(255,100,50,0.05) 0%,transparent 55%),linear-gradient(160deg,#f5f4f9 0%,#eceaf2 40%,#f2f0f7 100%);pointer-events:none;z-index:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        input:focus{border-color:#ff3b30!important;box-shadow:0 0 0 3px rgba(255,59,48,.1)!important;outline:none}
      `}</style>

      <div style={{position:'relative',zIndex:1,minHeight:'100vh',
        display:'flex',flexDirection:'column'}}>

        {/* ── Top bar ── */}
        <div style={{padding:'20px 32px',display:'flex',alignItems:'center',
          justifyContent:'space-between'}}>
          <Link href="/" style={{textDecoration:'none'}}>
            <GratiaLogo/>
          </Link>
          <div style={{fontSize:13,color:'rgba(26,26,46,.45)'}}>
            Don't have an account?{' '}
            <Link href="/" style={{color:'#ff3b30',fontWeight:600,textDecoration:'none'}}>
              Sign up →
            </Link>
          </div>
        </div>

        {/* ── Login card ── */}
        <div style={{flex:1,display:'flex',alignItems:'center',
          justifyContent:'center',padding:'24px'}}>
          <div style={{
            background:'rgba(255,255,255,.82)',
            border:'1px solid rgba(255,255,255,.95)',
            borderRadius:28,
            padding:'44px 40px',
            maxWidth:420, width:'100%',
            backdropFilter:'blur(40px)',
            WebkitBackdropFilter:'blur(40px)',
            boxShadow:'0 4px 24px rgba(0,0,0,.07),0 16px 48px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,1)',
            animation:'fadeUp .5s cubic-bezier(.34,1.56,.64,1)',
          }}>

            {/* Header */}
            <div style={{marginBottom:32}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,
                color:'#ff3b30',textTransform:'uppercase',marginBottom:8}}>
                Welcome back
              </div>
              <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:32,
                fontWeight:900,letterSpacing:-1.5,color:'#1a1a2e',
                lineHeight:1.1,marginBottom:8}}>
                Sign in to<br/>GratIA Core
              </h1>
              <p style={{fontSize:14,color:'rgba(26,26,46,.5)',lineHeight:1.6}}>
                Business Intelligence Agency
              </p>
            </div>

            {/* Email */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:700,letterSpacing:1.5,
                color:'rgba(26,26,46,.4)',textTransform:'uppercase',
                display:'block',marginBottom:7}}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoFocus
                style={{
                  width:'100%', padding:'13px 16px',
                  background:'rgba(0,0,0,.04)',
                  border:'1.5px solid rgba(0,0,0,.09)',
                  borderRadius:14, fontSize:15, color:'#1a1a2e',
                  fontFamily:"'DM Sans',sans-serif",
                  transition:'border-color .2s,box-shadow .2s',
                }}
              />
            </div>

            {/* Password */}
            <div style={{marginBottom:24}}>
              <div style={{display:'flex',justifyContent:'space-between',
                alignItems:'center',marginBottom:7}}>
                <label style={{fontSize:10,fontWeight:700,letterSpacing:1.5,
                  color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>
                  Password
                </label>
                <Link href="/reset-password" style={{fontSize:12,
                  color:'#ff3b30',textDecoration:'none',fontWeight:500}}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{
                  width:'100%', padding:'13px 16px',
                  background:'rgba(0,0,0,.04)',
                  border:'1.5px solid rgba(0,0,0,.09)',
                  borderRadius:14, fontSize:15, color:'#1a1a2e',
                  fontFamily:"'DM Sans',sans-serif",
                  transition:'border-color .2s,box-shadow .2s',
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background:'rgba(255,59,48,.07)',
                border:'1px solid rgba(255,59,48,.2)',
                borderRadius:12, padding:'10px 14px',
                fontSize:13, color:'#ff3b30',
                marginBottom:16, lineHeight:1.5,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={!email.trim() || !password || loading}
              style={{
                width:'100%', padding:15,
                background: email.trim() && password && !loading
                  ? 'linear-gradient(135deg,#ff3b30,#ff6b35)'
                  : 'rgba(255,59,48,.2)',
                color:'#fff', border:'none', borderRadius:100,
                fontSize:15, fontWeight:700,
                cursor: email.trim() && password && !loading
                  ? 'pointer' : 'not-allowed',
                fontFamily:"'DM Sans',sans-serif",
                boxShadow: email.trim() && password
                  ? '0 4px 16px rgba(255,59,48,.35)' : 'none',
                transition:'all .2s',
                marginBottom:20,
              }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>

            {/* Divider */}
            <div style={{display:'flex',alignItems:'center',gap:12,
              marginBottom:20,color:'rgba(26,26,46,.3)',fontSize:12}}>
              <div style={{flex:1,height:1,background:'rgba(0,0,0,.08)'}}/>
              or
              <div style={{flex:1,height:1,background:'rgba(0,0,0,.08)'}}/>
            </div>

            {/* Sign up link */}
            <div style={{textAlign:'center',fontSize:13,color:'rgba(26,26,46,.5)'}}>
              New to GratIA Core?{' '}
              <Link href="/" style={{color:'#ff3b30',fontWeight:600,
                textDecoration:'none'}}>
                Start free trial →
              </Link>
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{padding:'20px 32px',display:'flex',justifyContent:'center',
          gap:24,flexWrap:'wrap'}}>
          {['Privacy Policy','Terms of Service','Contact'].map(l => (
            <a key={l}
              href={`/${l.toLowerCase().replace(/ /g,'-')}`}
              style={{fontSize:12,color:'rgba(26,26,46,.35)',textDecoration:'none'}}>
              {l}
            </a>
          ))}
        </div>

      </div>
    </>
  )
}