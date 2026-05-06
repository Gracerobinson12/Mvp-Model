'use client'
// @ts-nocheck
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CARS = [
  { make:'Honda', model:'Civic', year:'2022', grade:'Regular', mpg:32, tank:12.4 },
  { make:'Toyota', model:'Camry', year:'2023', grade:'Regular', mpg:28, tank:15.8 },
  { make:'Ford', model:'F-150', year:'2022', grade:'Regular', mpg:24, tank:23.0 },
  { make:'BMW', model:'3 Series', year:'2023', grade:'Premium', mpg:30, tank:15.6 },
  { make:'Mercedes', model:'C-Class', year:'2023', grade:'Premium', mpg:26, tank:15.6 },
  { make:'Chevrolet', model:'Silverado', year:'2022', grade:'Regular', mpg:21, tank:24.0 },
  { make:'Toyota', model:'RAV4', year:'2023', grade:'Regular', mpg:29, tank:14.5 },
  { make:'Tesla', model:'Model 3', year:'2023', grade:'Electric', mpg:134, tank:0 },
  { make:'Jeep', model:'Wrangler', year:'2022', grade:'Regular', mpg:22, tank:21.5 },
  { make:'Dodge', model:'Charger', year:'2023', grade:'Premium', mpg:23, tank:18.5 },
]

const GRADE_COLOR = { Regular:'#ff3b30', 'Mid-grade':'#ff9f0a', Premium:'#0a84ff', Electric:'#30d158' }

export default function VehiclePage() {
  const router = useRouter()
  const [selectedCar, setSelectedCar] = useState(0)
  const [customMpg,   setCustomMpg]   = useState(null)
  const [customTank,  setCustomTank]  = useState(null)
  const [fillAlert,   setFillAlert]   = useState('half')
  const [stopPref,    setStopPref]    = useState('any')
  const [saved,       setSaved]       = useState(false)
  const [saving,      setSaving]      = useState(false)

  const car = CARS[selectedCar]
  const mpg  = customMpg  ?? car.mpg
  const tank = customTank ?? car.tank

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({
          grade_preference: car.grade,
          miles_per_week:   Math.round(mpg * 40),
          tank_size:        Math.round(tank),
        }).eq('id', user.id)
      }
    } catch(e) {}
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const FILL_OPTS = [
    { id:'quarter', label:'1/4 tank', sub:'~30 miles warning' },
    { id:'half',    label:'1/2 tank', sub:'~60 miles warning' },
    { id:'three',   label:'3/4 tank', sub:'~90 miles warning' },
    { id:'every',   label:'Every stop', sub:'always suggest gas' },
    { id:'never',   label:'Never', sub:'no reminders' },
  ]
  const STOP_OPTS = [
    { id:'any',     label:'Any station',    sub:'show all options' },
    { id:'travel',  label:'Travel centers', sub:"Love's, Pilot, Buc-ee's, Flying J" },
    { id:'bigname', label:'Big name only',  sub:'Shell, BP, Chevron, QuikTrip' },
    { id:'clean',   label:'Cleanest rated', sub:'4.0+ cleanliness score' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;background-image:radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.09) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.07) 0%,transparent 50%);font-family:'DM Sans',system-ui,sans-serif;color:#1a1a2e;min-height:100vh;-webkit-font-smoothing:antialiased;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes navSlide{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .gc-nav{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 18px;height:58px;background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06);animation:navSlide .5s cubic-bezier(.34,1.56,.64,1) both}
        .gc-card{background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;padding:22px;box-shadow:0 2px 12px rgba(0,0,0,0.06);margin-bottom:12px}
        .gc-label{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(26,26,46,.4);margin-bottom:12px}
        .car-chip{padding:8px 16px;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;border:0.5px solid;transition:all .2s;font-family:'DM Sans',sans-serif}
        .opt-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:0.5px solid rgba(0,0,0,0.05);cursor:pointer;transition:background .15s}
        .opt-row:last-child{border-bottom:none}
        .radio{width:20px;height:20px;border-radius:50%;border:2px solid rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
        .radio.on{background:#ff3b30;border-color:#ff3b30}
        .radio-dot{width:7px;height:7px;border-radius:50%;background:#fff}
        .gc-range{width:100%;accent-color:#ff3b30;margin:10px 0 4px}
        .big-btn{width:100%;padding:15px;border-radius:20px;border:none;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
      `}</style>

      <nav className="gc-nav">
        <Link href="/dashboard/gas" style={{display:'flex',alignItems:'center',gap:6,color:'#0a84ff',fontSize:14,fontWeight:500,textDecoration:'none'}}>
          <span style={{fontSize:18}}>‹</span> Gas Tracker
        </Link>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e'}}>My Vehicle</div>
          <div style={{fontSize:10,fontWeight:600,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>saved to your profile</div>
        </div>
        <div style={{width:60}}/>
      </nav>

      <div style={{maxWidth:700,margin:'0 auto',padding:'88px 20px 100px',animation:'fadeUp .5s ease both'}}>

        {/* Car selector */}
        <div className="gc-card">
          <div className="gc-label">Select your car</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
            {CARS.map((c,i)=>(
              <button key={i} className="car-chip"
                onClick={()=>{setSelectedCar(i);setCustomMpg(null);setCustomTank(null)}}
                style={{
                  background: selectedCar===i ? `${GRADE_COLOR[c.grade]}18` : 'rgba(255,255,255,0.5)',
                  borderColor: selectedCar===i ? `${GRADE_COLOR[c.grade]}50` : 'rgba(0,0,0,0.08)',
                  color: selectedCar===i ? GRADE_COLOR[c.grade] : 'rgba(26,26,46,.6)',
                }}>
                {c.year} {c.make} {c.model}
              </button>
            ))}
          </div>

          {/* Auto-detected grade */}
          <div style={{background:`${GRADE_COLOR[car.grade]}0d`,border:`1px solid ${GRADE_COLOR[car.grade]}30`,borderRadius:16,padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:`${GRADE_COLOR[car.grade]}1a`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
              {car.grade==='Electric'?'⚡':'⛽'}
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:GRADE_COLOR[car.grade],marginBottom:2}}>
                Auto-detected: {car.grade} {car.grade!=='Electric'?'unleaded':'(EV)'}
              </div>
              <div style={{fontSize:11,color:'rgba(26,26,46,.5)'}}>
                {car.year} {car.make} {car.model} · {car.mpg} mpg · {car.tank} gal tank
              </div>
            </div>
          </div>
        </div>

        {/* MPG + Tank tuning */}
        <div className="gc-card">
          <div className="gc-label">Fine-tune your numbers</div>

          <div style={{marginBottom:18}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:13,fontWeight:500,color:'rgba(26,26,46,.7)'}}>Miles per gallon</span>
              <span style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,color:'#ff3b30'}}>{mpg} mpg</span>
            </div>
            <input type="range" className="gc-range" min={10} max={80} step={1} value={mpg}
              onChange={e=>setCustomMpg(+e.target.value)}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'rgba(26,26,46,.35)'}}>
              <span>10</span><span>45</span><span>80 mpg</span>
            </div>
          </div>

          {car.grade !== 'Electric' && (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:500,color:'rgba(26,26,46,.7)'}}>Tank size</span>
                <span style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,color:'#ff3b30'}}>{tank.toFixed(1)} gal</span>
              </div>
              <input type="range" className="gc-range" min={8} max={36} step={0.5} value={tank}
                onChange={e=>setCustomTank(+e.target.value)}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'rgba(26,26,46,.35)'}}>
                <span>8</span><span>22</span><span>36 gal</span>
              </div>
            </div>
          )}

          <div style={{marginTop:14,padding:'12px 14px',background:'rgba(255,255,255,0.5)',border:'0.5px solid rgba(255,255,255,0.85)',borderRadius:14,display:'flex',gap:20}}>
            {[
              {label:'Range on full tank',val:`${Math.round(mpg*tank)} mi`},
              {label:'Cost to fill up',  val:`$${(tank*3.15).toFixed(2)}`},
            ].map(s=>(
              <div key={s.label}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:3}}>{s.label}</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e'}}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fill-up reminder */}
        <div className="gc-card">
          <div className="gc-label">Remind me to fill up when</div>
          {FILL_OPTS.map(o=>(
            <div key={o.id} className="opt-row" onClick={()=>setFillAlert(o.id)}>
              <div className={`radio ${fillAlert===o.id?'on':''}`}>
                {fillAlert===o.id && <div className="radio-dot"/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>{o.label}</div>
                <div style={{fontSize:11,color:'rgba(26,26,46,.45)',marginTop:1}}>{o.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stop preference */}
        <div className="gc-card">
          <div className="gc-label">Preferred stop type</div>
          {STOP_OPTS.map(o=>(
            <div key={o.id} className="opt-row" onClick={()=>setStopPref(o.id)}>
              <div className={`radio ${stopPref===o.id?'on':''}`}>
                {stopPref===o.id && <div className="radio-dot"/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>{o.label}</div>
                <div style={{fontSize:11,color:'rgba(26,26,46,.45)',marginTop:1}}>{o.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSave} className="big-btn" style={{
          background: saved ? 'rgba(48,209,88,0.12)' : 'linear-gradient(135deg,#ff3b30,#ff6b35)',
          color: saved ? '#1a7a35' : '#fff',
          border: saved ? '1px solid rgba(48,209,88,0.3)' : 'none',
          boxShadow: saved ? 'none' : '0 4px 20px rgba(255,59,48,0.35)',
        }}>
          {saving ? 'Saving...' : saved ? '✓ Vehicle settings saved' : 'Save vehicle settings'}
        </button>
      </div>
    </>
  )
}