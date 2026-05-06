'use client'
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const RouteGasFinder = dynamic(() => import('@/components/gas/RouteGasFinder'), { ssr: false })

function GCIcon({ size = 28 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}>
      <rect width="512" height="512" rx="114" fill="#ff3b30"/>
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  )
}

export default function GasRoutePage() {
  const router = useRouter()
  const [userCoords, setUserCoords] = useState(null)
  const [minimized, setMinimized] = useState(false)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserCoords({ lat: 32.6099, lng: -85.4808 })
      )
    }
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{
          background:#f0eff4;
          background-image:
            radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.09) 0%,transparent 55%),
            radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.07) 0%,transparent 50%);
          font-family:'DM Sans',system-ui,sans-serif;
          color:#1a1a2e;
          min-height:100vh;
          -webkit-font-smoothing:antialiased;
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes navSlide{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes pip-in{from{opacity:0;transform:translateY(20px) scale(0.9)}to{opacity:1;transform:translateY(0) scale(1)}}

        .gc-nav{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 18px;height:58px;background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06);animation:navSlide .5s cubic-bezier(.34,1.56,.64,1) both}
        .gc-card{background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06)}
        .back-btn{display:flex;align-items:center;gap:6px;color:#0a84ff;font-size:14px;font-weight:500;cursor:pointer;background:none;border:none;font-family:'DM Sans',sans-serif;padding:0;text-decoration:none}
        .live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#30d158;animation:lp 1.5s ease infinite}

        /* Picture-in-picture */
        .pip-bar{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:999;background:rgba(26,26,46,0.88);backdrop-filter:blur(24px);border:0.5px solid rgba(255,255,255,0.15);border-radius:20px;padding:10px 16px;display:flex;align-items:center;gap:14px;animation:pip-in .35s cubic-bezier(.34,1.56,.64,1) both;box-shadow:0 8px 32px rgba(0,0,0,0.25);cursor:pointer;min-width:280px}
        .pip-bar:hover{background:rgba(26,26,46,0.95)}
      `}</style>

      {/* Navbar */}
      <nav className="gc-nav">
        <Link href="/dashboard/gas" className="back-btn">
          <span style={{fontSize:18}}>‹</span> Gas Tracker
        </Link>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',lineHeight:1}}>
          <span style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e'}}>Route Gas Finder</span>
          <span style={{fontSize:10,fontWeight:600,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>cheapest along your route</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span className="live-dot"/>
          <span style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.4)'}}>EIA live</span>
          {/* Minimize button */}
          <button
            onClick={() => setMinimized(m => !m)}
            style={{padding:'6px 14px',borderRadius:100,background:'rgba(255,255,255,0.5)',border:'0.5px solid rgba(255,255,255,0.9)',fontSize:11,fontWeight:600,cursor:'pointer',color:'rgba(26,26,46,.6)',backdropFilter:'blur(20px)',fontFamily:"'DM Sans',sans-serif"}}>
            {minimized ? 'Expand' : 'Minimize'}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div style={{maxWidth:1100,margin:'0 auto',padding:'88px 24px 120px',animation:'fadeUp .5s ease both'}}>
        {!minimized && (
          <RouteGasFinder
            userCoords={userCoords}
            basePrice={3.15}
            isDark={false}
          />
        )}

        {minimized && (
          <div className="gc-card" style={{padding:'60px 24px',textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:16}}>🗺️</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,letterSpacing:-1,color:'#1a1a2e',marginBottom:8}}>Route finder is minimized</div>
            <div style={{fontSize:14,color:'rgba(26,26,46,.5)',marginBottom:24}}>Tap "Expand" in the top bar to bring it back</div>
            <button onClick={() => setMinimized(false)} style={{padding:'12px 32px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:100,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
              Expand Route Finder
            </button>
          </div>
        )}
      </div>

      {/* PiP bar when minimized */}
      {minimized && (
        <div className="pip-bar" onClick={() => setMinimized(false)}>
          <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,59,48,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>⛽</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:2}}>Route Gas Finder</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.5)'}}>Tap to expand · Finding cheapest stops</div>
          </div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.4)'}}>↑</div>
        </div>
      )}
    </>
  )
}