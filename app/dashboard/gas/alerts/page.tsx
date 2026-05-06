'use client'
// @ts-nocheck
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function GasAlertsPage() {
  const [alerts, setAlerts] = useState({
    approaching:  true,
    halfTank:     true,
    quarterTank:  true,
    bigNameOnly:  false,
    travelCenter: false,
    priceDropEmail: true,
  })
  const [threshold, setThreshold] = useState(50)
  const [alertStyle, setAlertStyle] = useState('banner')
  const [saved, setSaved] = useState(false)

  const toggle = key => setAlerts(a => ({...a, [key]: !a[key]}))

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({
          dark_mode: false,
        }).eq('id', user.id)
      }
    } catch(e) {}
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const ITEMS = [
    { key:'approaching',    label:'Approaching cheap station',  sub:'Banner appears 1 mile before a cheap stop on your route' },
    { key:'halfTank',       label:'Tank reaches half full',     sub:'Suggest a fill-up stop to save the most' },
    { key:'quarterTank',    label:'Tank below a quarter',       sub:'Urgent warning — fill up soon' },
    { key:'bigNameOnly',    label:'Big name chains only',       sub:'Shell, BP, Chevron, QuikTrip, Wawa, Exxon' },
    { key:'travelCenter',   label:'Travel centers only',        sub:"Love's, Pilot, Flying J, Buc-ee's — bathroom + food" },
    { key:'priceDropEmail', label:'Price drop email alerts',    sub:'Email when regular gas drops near your saved location' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;background-image:radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.09) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.07) 0%,transparent 50%);font-family:'DM Sans',system-ui,sans-serif;color:#1a1a2e;min-height:100vh;-webkit-font-smoothing:antialiased;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes navSlide{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        .gc-nav{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 18px;height:58px;background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06);animation:navSlide .5s cubic-bezier(.34,1.56,.64,1) both}
        .gc-card{background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;padding:20px 22px;box-shadow:0 2px 12px rgba(0,0,0,0.06);margin-bottom:12px}
        .gc-label{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(26,26,46,.4);margin-bottom:14px}
        .toggle-row{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:0.5px solid rgba(0,0,0,0.05)}
        .toggle-row:last-child{border-bottom:none}
        .sw{width:44px;height:26px;border-radius:13px;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0}
        .sw.on{background:#30d158}
        .sw.off{background:rgba(0,0,0,0.14)}
        .sw-dot{position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s cubic-bezier(.34,1.56,.64,1);box-shadow:0 1px 4px rgba(0,0,0,0.18)}
        .sw.on .sw-dot{left:21px}
        .sw.off .sw-dot{left:3px}
        .style-chip{padding:8px 18px;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;border:0.5px solid;transition:all .2s;font-family:'DM Sans',sans-serif}
        .gc-range{width:100%;accent-color:#ff3b30;margin:10px 0 4px}
        .big-btn{width:100%;padding:15px;border-radius:20px;border:none;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
        .preview-alert{border-radius:20px;padding:14px 16px;border:1px solid;margin-bottom:12px;animation:slideDown .3s ease}
      `}</style>

      <nav className="gc-nav">
        <Link href="/dashboard/gas" style={{display:'flex',alignItems:'center',gap:6,color:'#0a84ff',fontSize:14,fontWeight:500,textDecoration:'none'}}>
          <span style={{fontSize:18}}>‹</span> Gas Tracker
        </Link>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e'}}>Driving Alerts</div>
          <div style={{fontSize:10,fontWeight:600,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>while you're on the road</div>
        </div>
        <div style={{width:60}}/>
      </nav>

      <div style={{maxWidth:700,margin:'0 auto',padding:'88px 20px 100px',animation:'fadeUp .5s ease both'}}>

        {/* Alert preview */}
        <div className="preview-alert" style={{background:'rgba(255,159,10,0.09)',borderColor:'rgba(255,159,10,0.28)'}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'#854F0B',textTransform:'uppercase',marginBottom:4}}>Preview · 0.8 miles ahead</div>
          <div style={{fontSize:15,fontWeight:700,color:'#1a1a2e',marginBottom:2}}>QuikTrip · right side of highway</div>
          <div style={{fontSize:12,color:'rgba(26,26,46,.55)'}}>Regular $3.04 · cheapest on route · travel center</div>
        </div>

        {/* Alert style */}
        <div className="gc-card">
          <div className="gc-label">Alert style</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[
              {id:'banner',  label:'Banner', sub:'slides from top'},
              {id:'sound',   label:'Sound',  sub:'chime + banner'},
              {id:'vibrate', label:'Vibrate',sub:'haptic + banner'},
            ].map(s=>(
              <button key={s.id} className="style-chip"
                onClick={()=>setAlertStyle(s.id)}
                style={{
                  background:alertStyle===s.id?'rgba(255,59,48,0.08)':'rgba(255,255,255,0.5)',
                  borderColor:alertStyle===s.id?'rgba(255,59,48,0.3)':'rgba(0,0,0,0.08)',
                  color:alertStyle===s.id?'#cc2018':'rgba(26,26,46,.6)',
                }}>
                <div>{s.label}</div>
                <div style={{fontSize:10,opacity:.6,marginTop:2}}>{s.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="gc-card">
          <div className="gc-label">Alert me when</div>
          {ITEMS.map(item=>(
            <div key={item.key} className="toggle-row" onClick={()=>toggle(item.key)}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:500,color:'#1a1a2e',marginBottom:2}}>{item.label}</div>
                <div style={{fontSize:11,color:'rgba(26,26,46,.45)'}}>{item.sub}</div>
              </div>
              <div className={`sw ${alerts[item.key]?'on':'off'}`} onClick={e=>{e.stopPropagation();toggle(item.key)}}>
                <div className="sw-dot"/>
              </div>
            </div>
          ))}
        </div>

        {/* Tank threshold */}
        <div className="gc-card">
          <div className="gc-label">Fill-up reminder threshold</div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4}}>
            <span style={{fontSize:13,color:'rgba(26,26,46,.6)'}}>Alert me when tank drops below</span>
            <span style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:900,letterSpacing:-1,color:'#ff3b30'}}>{threshold}%</span>
          </div>
          <input type="range" className="gc-range" min={10} max={90} step={5} value={threshold}
            onChange={e=>setThreshold(+e.target.value)}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'rgba(26,26,46,.35)',marginTop:4}}>
            <span>10%</span>
            <span style={{color:'rgba(26,26,46,.6)',fontWeight:500}}>
              ~{Math.round((threshold/100)*14*32)} miles remaining at alert
            </span>
            <span>90%</span>
          </div>
        </div>

        {/* Apple Maps note */}
        <div className="gc-card" style={{background:'rgba(10,132,255,0.05)',border:'1px solid rgba(10,132,255,0.15)'}}>
          <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
            <div style={{width:36,height:36,borderRadius:10,background:'rgba(10,132,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🗺️</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'#0a84ff',marginBottom:4}}>Apple Maps integration</div>
              <div style={{fontSize:12,color:'rgba(26,26,46,.55)',lineHeight:1.55}}>
                When you tap "Navigate there" on a gas alert, it opens Apple Maps with the station set as a waypoint on your route. Works automatically on iPhone.
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="big-btn" style={{
          background: saved ? 'rgba(48,209,88,0.12)' : 'linear-gradient(135deg,#ff3b30,#ff6b35)',
          color: saved ? '#1a7a35' : '#fff',
          border: saved ? '1px solid rgba(48,209,88,0.3)' : 'none',
          boxShadow: saved ? 'none' : '0 4px 20px rgba(255,59,48,0.35)',
        }}>
          {saved ? '✓ Alert settings saved' : 'Save alert settings'}
        </button>
      </div>
    </>
  )
}