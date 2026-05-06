'use client'
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const STATIONS_AHEAD = [
  { id:1, name:'Shell', exit:'Exit 199', miles:8,  price:3.12, clean:3.8, type:'travel center', detour:0.3, trend:'↓' },
  { id:2, name:'QuikTrip', exit:'Exit 188', miles:19, price:3.04, clean:4.1, type:'gas + food',  detour:0.2, trend:'↓', cheapest:true },
  { id:3, name:'BP',    exit:'Exit 175', miles:34, price:3.28, clean:4.8, type:'gas only',    detour:0.1, trend:'↑' },
]

export default function TripModePage() {
  const router = useRouter()
  const [running,   setRunning]   = useState(false)
  const [milesDriven, setMilesDriven] = useState(0)
  const [tankPct,   setTankPct]   = useState(50)
  const [alertIdx,  setAlertIdx]  = useState(0)
  const [dismissed, setDismissed] = useState([])
  const [tripSaved, setTripSaved] = useState(false)
  const [elapsed,   setElapsed]   = useState(0)
  const [savedAmt,  setSavedAmt]  = useState(0)
  const intervalRef = useRef(null)
  const MPG = 32, TANK = 14

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setMilesDriven(m => {
        const nm = +(m + 0.3).toFixed(1)
        setTankPct(p => Math.max(0, +(p - (0.3/MPG/TANK*100)).toFixed(2)))
        return nm
      })
      setElapsed(e => e + 1)
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  const milesLeft = +((tankPct/100) * TANK * MPG).toFixed(0)
  const nextStation = STATIONS_AHEAD.filter(s => !dismissed.includes(s.id))[0]
  const isLow = tankPct < 25
  const isHalf = tankPct < 52 && tankPct >= 25

  const endTrip = async () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setTripSaved(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('gas_searches').insert({
          user_id: user.id,
          lat: 32.6099,
          lng: -85.4808,
          grade: 'Regular',
          best_price: 3.04,
        })
      }
    } catch(e) {}
  }

  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

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
        @keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}

        .gc-nav{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 18px;height:58px;background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06);animation:navSlide .5s cubic-bezier(.34,1.56,.64,1) both}
        .gc-card{background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06)}
        .kpi-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .kpi-card{background:rgba(255,255,255,0.50);backdrop-filter:blur(24px);border:0.5px solid rgba(255,255,255,0.85);border-radius:22px;padding:16px 18px}
        .alert-card{border-radius:24px;padding:16px 18px;border:1px solid;animation:slideDown .35s cubic-bezier(.34,1.56,.64,1) both}
        .alert-green{background:rgba(48,209,88,0.10);border-color:rgba(48,209,88,0.28)}
        .alert-amber{background:rgba(255,159,10,0.10);border-color:rgba(255,159,10,0.28);animation:pulse 2s ease infinite}
        .alert-red{background:rgba(255,59,48,0.10);border-color:rgba(255,59,48,0.28)}
        .sm-btn{padding:8px 16px;border-radius:100px;border:0.5px solid;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
        .sm-btn-green{background:rgba(48,209,88,0.12);border-color:rgba(48,209,88,0.3);color:#1a7a35}
        .sm-btn-ghost{background:rgba(255,255,255,0.5);border-color:rgba(0,0,0,0.1);color:rgba(26,26,46,.6)}
        .big-btn{width:100%;padding:15px;border-radius:20px;border:none;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
        .tank-wrap{height:8px;border-radius:4px;background:rgba(0,0,0,0.08);overflow:hidden;margin-top:8px}
        .tank-fill{height:100%;border-radius:4px;transition:width .8s ease}
        .station-ahead{display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:0.5px solid rgba(0,0,0,0.05);cursor:pointer;transition:background .15s}
        .station-ahead:last-child{border-bottom:none}
        .station-ahead:hover{background:rgba(255,255,255,0.4)}
      `}</style>

      <nav className="gc-nav">
        <Link href="/dashboard/gas" style={{display:'flex',alignItems:'center',gap:6,color:'#0a84ff',fontSize:14,fontWeight:500,textDecoration:'none'}}>
          <span style={{fontSize:18}}>‹</span> Gas Tracker
        </Link>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',lineHeight:1}}>
          <span style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e'}}>Trip Mode</span>
          {running && <span style={{fontSize:10,fontWeight:700,color:'#30d158',letterSpacing:1}}>● LIVE {fmtTime(elapsed)}</span>}
        </div>
        <div style={{fontSize:13,fontWeight:700,color:'rgba(26,26,46,.5)'}}>{milesDriven.toFixed(1)} mi</div>
      </nav>

      <div style={{maxWidth:700,margin:'0 auto',padding:'88px 20px 100px'}}>

        {/* Start screen */}
        {!running && !tripSaved && (
          <div style={{animation:'fadeUp .5s ease both'}}>
            <div className="gc-card" style={{padding:'36px 28px',textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:52,marginBottom:16}}>🚗</div>
              <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:900,letterSpacing:-1.5,color:'#1a1a2e',marginBottom:8}}>Ready to drive?</h1>
              <p style={{fontSize:14,color:'rgba(26,26,46,.5)',lineHeight:1.65,marginBottom:28}}>
                Trip mode tracks your route live, alerts you when approaching cheap gas, and warns you before your tank runs low.
              </p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
                {[
                  {label:'Your car',val:'Honda Civic'},
                  {label:'Fuel grade',val:'Regular'},
                  {label:'Tank size',val:'14 gallons'},
                  {label:'Current tank',val:'50% full'},
                ].map(s=>(
                  <div key={s.label} style={{background:'rgba(255,255,255,0.5)',border:'0.5px solid rgba(255,255,255,0.85)',borderRadius:16,padding:'12px 14px',textAlign:'left'}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:4}}>{s.label}</div>
                    <div style={{fontSize:16,fontWeight:700,color:'#1a1a2e',letterSpacing:-.3}}>{s.val}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setRunning(true)} className="big-btn"
                style={{background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',boxShadow:'0 4px 20px rgba(255,59,48,0.35)'}}>
                Start Trip ›
              </button>
              <p style={{fontSize:11,color:'rgba(26,26,46,.3)',marginTop:12}}>GPS activates automatically · Works in background</p>
            </div>
            <Link href="/dashboard/gas/route" style={{display:'block',textDecoration:'none'}}>
              <div className="gc-card" style={{padding:'14px 20px',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,59,48,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🗺️</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>Plan your route first</div>
                  <div style={{fontSize:11,color:'rgba(26,26,46,.45)'}}>Find cheapest gas stops before you leave</div>
                </div>
                <span style={{fontSize:16,color:'rgba(26,26,46,.25)'}}>›</span>
              </div>
            </Link>
          </div>
        )}

        {/* Active trip */}
        {running && (
          <div style={{animation:'fadeUp .4s ease both'}}>

            {/* Alert for next station */}
            {nextStation && !isLow && (
              <div className={`alert-card ${nextStation.cheapest ? 'alert-green' : 'alert-amber'}`} style={{marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:nextStation.cheapest?'#1a7a35':'#854F0B',textTransform:'uppercase',marginBottom:5}}>
                  {nextStation.cheapest ? '★ Cheapest on route · ' : ''}{nextStation.miles} miles ahead
                </div>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
                  <div>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e',marginBottom:4}}>
                      {nextStation.name} · {nextStation.exit}
                    </div>
                    <div style={{fontSize:12,color:'rgba(26,26,46,.55)',marginBottom:10}}>
                      +{nextStation.detour} mi detour · {nextStation.clean}/5 clean · {nextStation.type}
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button className="sm-btn sm-btn-green"
                        onClick={()=>{
                        // Apple Maps: start=current location, destination=final dest, via=gas station
                        // If on iPhone → opens Apple Maps automatically
                        // If on Android → opens Google Maps
                        const isApple = /iPhone|iPad|iPod|Mac/.test(navigator.userAgent)
                        const stLat = nextStation.id === 1 ? 33.12 : nextStation.id === 2 ? 33.28 : 33.45
                        const stLng = nextStation.id === 1 ? -85.11 : nextStation.id === 2 ? -85.08 : -85.02
                        if (isApple) {
                          // Apple Maps with waypoint
                          window.open(`maps://maps.apple.com/?saddr=Current+Location&daddr=${stLat},${stLng}&dirflag=d`)
                        } else {
                          // Google Maps fallback
                          window.open(`https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${stLat},${stLng}&travelmode=driving`)
                        }
                      }}>
                        Navigate in Apple Maps
                      </button>
                      <button className="sm-btn sm-btn-ghost" onClick={()=>{setDismissed(d=>[...d,nextStation.id])}}>
                        Skip
                      </button>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:32,fontWeight:900,letterSpacing:-2,color:nextStation.cheapest?'#30d158':'#ff9f0a',lineHeight:1}}>
                      ${nextStation.price.toFixed(2)}
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:nextStation.cheapest?'#30d158':'#ff9f0a',marginTop:4}}>{nextStation.trend} Regular</div>
                  </div>
                </div>
              </div>
            )}

            {/* Low tank warning */}
            {isLow && (
              <div className="alert-card alert-red" style={{marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'#cc2018',textTransform:'uppercase',marginBottom:5}}>⚠ LOW FUEL · FILL UP NOW</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,color:'#1a1a2e',marginBottom:4}}>
                  ~{milesLeft} miles remaining
                </div>
                <div style={{fontSize:12,color:'rgba(26,26,46,.55)'}}>Next station in {nextStation?.miles || '?'} miles</div>
              </div>
            )}

            {/* Stats grid */}
            <div className="kpi-grid" style={{marginBottom:14}}>
              <div className="kpi-card">
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:6}}>Miles driven</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:36,fontWeight:900,letterSpacing:-2,color:'#1a1a2e',lineHeight:1}}>{milesDriven.toFixed(1)}</div>
              </div>
              <div className="kpi-card">
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:6}}>Tank remaining</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:36,fontWeight:900,letterSpacing:-2,color:isLow?'#ff3b30':isHalf?'#ff9f0a':'#30d158',lineHeight:1}}>{milesLeft} mi</div>
                <div className="tank-wrap">
                  <div className="tank-fill" style={{width:`${tankPct}%`,background:isLow?'#ff3b30':isHalf?'#ff9f0a':'#30d158'}}/>
                </div>
              </div>
              <div className="kpi-card">
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:6}}>Trip time</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:36,fontWeight:900,letterSpacing:-2,color:'#1a1a2e',lineHeight:1}}>{fmtTime(elapsed)}</div>
              </div>
              <div className="kpi-card">
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:6}}>Saved this trip</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:36,fontWeight:900,letterSpacing:-2,color:'#30d158',lineHeight:1}}>${savedAmt.toFixed(2)}</div>
              </div>
            </div>

            {/* Stations ahead list */}
            <div className="gc-card" style={{marginBottom:14,overflow:'hidden'}}>
              <div style={{padding:'14px 18px',borderBottom:'0.5px solid rgba(0,0,0,0.05)'}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>Stations ahead</div>
              </div>
              {STATIONS_AHEAD.filter(s=>!dismissed.includes(s.id)).map((st,i)=>(
                <div key={st.id} className="station-ahead">
                  <div style={{width:32,height:32,borderRadius:10,background:st.cheapest?'rgba(48,209,88,0.12)':'rgba(255,255,255,0.5)',border:`0.5px solid ${st.cheapest?'rgba(48,209,88,0.3)':'rgba(0,0,0,0.08)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:st.cheapest?'#1a7a35':'rgba(26,26,46,.4)',flexShrink:0}}>
                    {st.cheapest?'★':i+1}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                      <span style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>{st.name}</span>
                      {st.cheapest && <span style={{fontSize:9,fontWeight:700,background:'rgba(48,209,88,0.1)',color:'#1a7a35',border:'1px solid rgba(48,209,88,0.25)',borderRadius:5,padding:'1px 6px'}}>CHEAPEST</span>}
                    </div>
                    <div style={{fontSize:11,color:'rgba(26,26,46,.45)'}}>In {st.miles} mi · {st.exit} · {st.type}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,color:st.cheapest?'#30d158':'#1a1a2e'}}>${st.price.toFixed(2)}</div>
                    <div style={{fontSize:10,fontWeight:700,color:st.trend==='↓'?'#30d158':'#ff453a'}}>{st.trend}</div>
                  </div>
                </div>
              ))}
              {STATIONS_AHEAD.filter(s=>!dismissed.includes(s.id)).length === 0 && (
                <div style={{padding:'20px',textAlign:'center',color:'rgba(26,26,46,.4)',fontSize:13}}>No more stations — check route finder</div>
              )}
            </div>

            <button onClick={endTrip} className="big-btn" style={{background:'rgba(255,59,48,0.08)',color:'#cc2018',border:'1px solid rgba(255,59,48,0.2)'}}>
              End Trip
            </button>
          </div>
        )}

        {/* Trip summary */}
        {tripSaved && (
          <div style={{animation:'fadeUp .5s ease both'}}>
            <div className="gc-card" style={{padding:'36px 28px',textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:52,marginBottom:16}}>🏁</div>
              <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:900,letterSpacing:-1.5,color:'#1a1a2e',marginBottom:8}}>Trip complete</h1>
              <p style={{fontSize:14,color:'rgba(26,26,46,.5)',marginBottom:28}}>Saved to your trip history</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:28}}>
                {[
                  {label:'Miles driven',val:`${milesDriven.toFixed(1)} mi`},
                  {label:'Trip time',val:fmtTime(elapsed)},
                  {label:'Fuel used est.',val:`${(milesDriven/32).toFixed(1)} gal`},
                  {label:'Money saved',val:`$${savedAmt.toFixed(2)}`},
                ].map(s=>(
                  <div key={s.label} style={{background:'rgba(255,255,255,0.5)',border:'0.5px solid rgba(255,255,255,0.85)',borderRadius:16,padding:'12px 14px',textAlign:'left'}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:4}}>{s.label}</div>
                    <div style={{fontSize:18,fontWeight:700,color:'#1a1a2e',letterSpacing:-.3}}>{s.val}</div>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/gas" style={{display:'block',textDecoration:'none'}}>
                <button className="big-btn" style={{background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',boxShadow:'0 4px 20px rgba(255,59,48,0.35)'}}>
                  Back to Gas Tracker
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}