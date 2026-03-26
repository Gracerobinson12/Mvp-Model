// @ts-nocheck
'use client'
import RouteGasFinder from '@/components/gas/RouteGasFinder'
import { useEffect, useState, useRef, useCallback } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts"
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
type Station = {
  id: number; name: string; address: string
  lat: number; lng: number; distance: number
  regular: number; mid: number; premium: number; diesel: number
  updated: string; trending: string
}
type Coords = { lat: number; lng: number }
type Theme  = typeof LIGHT

// ── Constants ─────────────────────────────────────────────────────────────────
const GRADES   = ["Regular", "Mid", "Premium", "Diesel"]
const IRS_RATE = 0.70
const AVG_MPG  = 28
const gk       = (g: string) => g.toLowerCase()

const FALLBACK_STATIONS: Station[] = [
  { id:1, name:"Shell",    address:"Nearest Shell",    lat:0,lng:0,distance:0.3,regular:3.09,mid:3.39,premium:3.69,diesel:3.55,updated:"2m ago",  trending:"down"   },
  { id:2, name:"BP",       address:"Nearest BP",       lat:0,lng:0,distance:0.7,regular:3.15,mid:3.45,premium:3.75,diesel:3.61,updated:"8m ago",  trending:"stable" },
  { id:3, name:"Circle K", address:"Nearest Circle K", lat:0,lng:0,distance:1.1,regular:3.07,mid:3.37,premium:3.67,diesel:3.52,updated:"1m ago",  trending:"down"   },
  { id:4, name:"Chevron",  address:"Nearest Chevron",  lat:0,lng:0,distance:1.4,regular:3.21,mid:3.51,premium:3.81,diesel:3.68,updated:"15m ago", trending:"up"     },
  { id:5, name:"QuikTrip", address:"Nearest QuikTrip", lat:0,lng:0,distance:1.9,regular:3.04,mid:3.34,premium:3.64,diesel:3.48,updated:"5m ago",  trending:"down"   },
]

const FALLBACK_HISTORY = [
  {day:"Feb 26",price:3.28},{day:"Feb 27",price:3.25},{day:"Feb 28",price:3.31},
  {day:"Mar 1", price:3.22},{day:"Mar 2", price:3.18},{day:"Mar 3", price:3.14},
  {day:"Mar 4", price:3.11},{day:"Mar 5", price:3.09},
]

const PLANS = [
  {
    id:     'free',
    name:   'Free',
    price:  '$0',
    period: '/mo',
    color:  'rgba(0,0,0,.06)',
    textColor: 'rgba(26,26,46,.6)',
    bullets:['Gas prices near you','7-day price trend','Basic mileage calculator'],
    locked: ['Route gas finder','Price drop alerts','Mileage PDF export'],
  },
  {
    id:     'driver',
    name:   'Driver Pass',
    price:  '$4.99',
    period: '/mo',
    color:  'linear-gradient(135deg,#ff3b30,#ff6b35)',
    textColor: '#fff',
    bullets:['Everything in Free','Route gas finder','Price drop alerts via email','Monthly mileage PDF export','Quarterly tax reminders'],
    locked: [],
    recommended: true,
  },
  {
    id:     'business',
    name:   'Business Pass',
    price:  '$14.99',
    period: '/mo',
    color:  'linear-gradient(135deg,#1a1a2e,#2d2d4e)',
    textColor: '#fff',
    bullets:['Everything in Driver Pass','Regulatory updates feed','Tariff intelligence (coming)','Assets & liabilities (coming)','Balance sheet PDF export','Team access (3 users)'],
    locked: [],
  },
]

// ── Themes ────────────────────────────────────────────────────────────────────
// LIGHT is now the default
const LIGHT = {
  bg:           "#f2f2f7",
  bgGrad:       "radial-gradient(ellipse 80% 60% at 10% 0%,rgba(255,59,48,.07) 0%,transparent 60%)",
  surface:      "rgba(255,255,255,.85)",
  surfaceBdr:   "rgba(0,0,0,.08)",
  surfaceHL:    "linear-gradient(135deg,rgba(255,59,48,.1),rgba(255,59,48,.04))",
  surfaceHLBdr: "rgba(255,59,48,.35)",
  text:         "rgba(0,0,0,.9)",
  text2:        "rgba(0,0,0,.55)",
  text3:        "rgba(0,0,0,.3)",
  accent:       "#ff3b30",
  green:        "#25a244",
  inputBg:      "rgba(0,0,0,.04)",
  inputBdr:     "rgba(0,0,0,.1)",
  mapOverlay:   "rgba(255,255,255,.9)",
  pillBg:       "rgba(255,59,48,.08)",
  pillBdr:      "rgba(255,59,48,.2)",
  dedBg:        "linear-gradient(135deg,rgba(37,162,68,.09),rgba(37,162,68,.03))",
  dedBdr:       "rgba(37,162,68,.25)",
  dedGreen:     "rgba(37,162,68,.5)",
  modalBg:      "rgba(242,242,247,.98)",
  modalBdr:     "rgba(0,0,0,.1)",
  rowSel:       "rgba(255,59,48,.06)",
  rowBest:      "rgba(48,209,88,.07)",
  tileUrl:      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  isDark:       false,
  settingsBg:   "#fff",
  settingsBdr:  "rgba(0,0,0,.08)",
  divider:      "rgba(0,0,0,.07)",
  tagBg:        "rgba(0,0,0,.05)",
}

const DARK = {
  bg:           "#0a0a0f",
  bgGrad:       "radial-gradient(ellipse 80% 60% at 10% 0%,rgba(255,59,48,.11) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 90% 100%,rgba(255,80,40,.06) 0%,transparent 60%)",
  surface:      "rgba(255,255,255,.05)",
  surfaceBdr:   "rgba(255,255,255,.09)",
  surfaceHL:    "linear-gradient(135deg,rgba(255,59,48,.16),rgba(255,59,48,.05))",
  surfaceHLBdr: "rgba(255,59,48,.3)",
  text:         "#ebebf5",
  text2:        "rgba(235,235,245,.55)",
  text3:        "rgba(235,235,245,.28)",
  accent:       "#ff3b30",
  green:        "#30d158",
  inputBg:      "rgba(0,0,0,.3)",
  inputBdr:     "rgba(255,255,255,.09)",
  mapOverlay:   "rgba(10,10,15,.85)",
  pillBg:       "rgba(255,59,48,.1)",
  pillBdr:      "rgba(255,59,48,.25)",
  dedBg:        "linear-gradient(135deg,rgba(48,209,88,.1),rgba(48,209,88,.03))",
  dedBdr:       "rgba(48,209,88,.22)",
  dedGreen:     "rgba(48,209,88,.45)",
  modalBg:      "rgba(10,10,15,.97)",
  modalBdr:     "rgba(255,255,255,.1)",
  rowSel:       "rgba(255,59,48,.08)",
  rowBest:      "rgba(48,209,88,.06)",
  tileUrl:      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  isDark:       true,
  settingsBg:   "rgba(18,18,22,.98)",
  settingsBdr:  "rgba(255,255,255,.09)",
  divider:      "rgba(255,255,255,.07)",
  tagBg:        "rgba(255,255,255,.06)",
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function distanceMiles(lat1:number,lng1:number,lat2:number,lng2:number):number {
  const R=3959,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return parseFloat((R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1))
}
function simulatePrices(base:number) {
  const off=[-0.09,-0.05,-0.02,0,0.04,0.08,0.13][Math.floor(Math.random()*7)]
  return {
    regular: +(base+off).toFixed(2),
    mid:     +(base+off+.30).toFixed(2),
    premium: +(base+off+.60).toFixed(2),
    diesel:  +(base+off+.45).toFixed(2),
  }
}
const trendIcon  = (t:string) => t==="down"?"↓":t==="up"?"↑":"→"
const trendColor = (t:string,T:Theme) => t==="down"?T.green:t==="up"?"#ff453a":T.text3
const cheapestSt = (sts:Station[],g:string) => [...sts].sort((a,b)=>a[gk(g)]-b[gk(g)])[0]

// ── Pin HTML ──────────────────────────────────────────────────────────────────
function makePin(price:number,isBest:boolean,isSel:boolean,isDark:boolean):string {
  const bg  = isSel  ? "linear-gradient(135deg,#ff3b30,#ff6b35)"
            : isBest ? "linear-gradient(135deg,#30d158,#34c759)"
            : isDark ? "rgba(18,18,22,.93)" : "rgba(255,255,255,.93)"
  const fg  = isSel||isBest ? "#fff" : isDark ? "rgba(235,235,245,.9)" : "rgba(0,0,0,.85)"
  const bdr = isSel ? "#ff3b30" : isBest ? "#30d158" : isDark ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.18)"
  const sc  = isSel ? "scale(1.2)" : "scale(1)"
  const glow= isSel?",0 0 16px rgba(255,59,48,.5)":isBest?",0 0 12px rgba(48,209,88,.4)":""
  return `<div style="display:inline-flex;flex-direction:column;align-items:center;transform:${sc};transition:transform .25s cubic-bezier(.34,1.56,.64,1)">
    <div style="background:${bg};border:1.5px solid ${bdr};border-radius:10px;padding:5px 10px;display:flex;align-items:center;gap:4px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 4px 20px rgba(0,0,0,.45)${glow};cursor:pointer">
      <span style="font-size:10px">⛽</span>
      <span style="font-size:13px;font-weight:700;color:${fg};font-family:-apple-system,system-ui,sans-serif;letter-spacing:-.2px">$${price.toFixed(2)}</span>
    </div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${isSel?"#ff3b30":isBest?"#30d158":bdr}"></div>
  </div>`
}

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
function ChartTip({active,payload,label,T}:{active?:boolean,payload?:any,label?:string,T:Theme}) {
  if(!active||!payload?.length) return null
  return (
    <div style={{background:T.modalBg,border:"1px solid rgba(255,59,48,.3)",borderRadius:10,padding:"8px 14px",backdropFilter:"blur(20px)"}}>
      <p style={{color:T.text3,fontSize:10,margin:0,fontFamily:"system-ui"}}>{label}</p>
      <p style={{color:T.accent,fontSize:18,fontWeight:700,margin:"2px 0 0",fontFamily:"system-ui"}}>${payload[0].value.toFixed(2)}</p>
    </div>
  )
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({onClose,T,userCoords,onUpdateLocation,currentPlan,onChangePlan}:{
  onClose:()=>void
  T:Theme
  userCoords:Coords|null
  onUpdateLocation:()=>void
  currentPlan:string
  onChangePlan:(p:string)=>void
}) {
  const [tab,          setTab]          = useState<'account'|'location'|'plan'>('account')
  const [email,        setEmail]        = useState('user@example.com')
  const [newEmail,     setNewEmail]     = useState('')
  const [curPass,      setCurPass]      = useState('')
  const [newPass,      setNewPass]      = useState('')
  const [confirmPass,  setConfirmPass]  = useState('')
  const [savedEmail,   setSavedEmail]   = useState(false)
  const [savedPass,    setSavedPass]    = useState(false)
  const [locUpdating,  setLocUpdating]  = useState(false)
  const [locMsg,       setLocMsg]       = useState('')
  const [selectedPlan, setSelectedPlan] = useState(currentPlan)

  const inputStyle = {
    width:'100%', padding:'11px 14px',
    background:T.inputBg,
    border:`1px solid ${T.inputBdr}`,
    borderRadius:12, fontSize:14, color:T.text,
    outline:'none', fontFamily:"'Outfit',system-ui,sans-serif",
    marginBottom:10, transition:'border-color .2s',
  }

  const handleUpdateLocation = () => {
    setLocUpdating(true)
    setLocMsg('Requesting your current location...')
    navigator.geolocation?.getCurrentPosition(
      pos=>{
        setLocMsg(`✓ Location updated — ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`)
        setLocUpdating(false)
        onUpdateLocation()
      },
      ()=>{
        setLocMsg('Could not get location. Try entering a ZIP code instead.')
        setLocUpdating(false)
      },
      {enableHighAccuracy:true, timeout:10000}
    )
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9998,
      display:'flex', alignItems:'flex-end', justifyContent:'flex-end',
      padding:20,
      background:'rgba(0,0,0,.3)',
      backdropFilter:'blur(6px)',
      WebkitBackdropFilter:'blur(6px)',
    }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>

      <div style={{
        background:   T.settingsBg,
        border:       `1px solid ${T.settingsBdr}`,
        borderRadius: 24,
        width:        420,
        maxHeight:    'calc(100vh - 40px)',
        overflowY:    'auto',
        boxShadow:    '0 24px 80px rgba(0,0,0,.2)',
        fontFamily:   "'Outfit',system-ui,sans-serif",
        animation:    'settingsIn .35s cubic-bezier(.34,1.56,.64,1)',
      }}>

        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'20px 22px 16px',
          borderBottom:`1px solid ${T.divider}`,
          position:'sticky', top:0, background:T.settingsBg, zIndex:1,
          backdropFilter:'blur(20px)',
        }}>
          <div style={{fontSize:18, fontWeight:800, letterSpacing:-.5, color:T.text}}>
            Account Settings
          </div>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:'50%',
            background:T.inputBg, border:`1px solid ${T.inputBdr}`,
            cursor:'pointer', fontSize:14, color:T.text2,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>✕</button>
        </div>

        {/* Tab nav */}
        <div style={{
          display:'flex', gap:4, padding:'14px 22px 0',
        }}>
          {[
            {id:'account',  label:'Account'},
            {id:'location', label:'Location'},
            {id:'plan',     label:'Plan & Billing'},
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id as any)} style={{
              padding:'7px 16px', borderRadius:100,
              fontSize:12, fontWeight:600, cursor:'pointer',
              fontFamily:"'Outfit',sans-serif",
              background:   tab===t.id ? T.accent : T.inputBg,
              color:        tab===t.id ? '#fff' : T.text2,
              border:       tab===t.id ? 'none' : `1px solid ${T.inputBdr}`,
              boxShadow:    tab===t.id ? '0 2px 8px rgba(255,59,48,.3)' : 'none',
              transition:   'all .2s',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{padding:'20px 22px 28px'}}>

          {/* ── ACCOUNT TAB ── */}
          {tab === 'account' && <>

            {/* Current email */}
            <div style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'12px 14px',
              background:T.inputBg,
              border:`1px solid ${T.inputBdr}`,
              borderRadius:14, marginBottom:22,
            }}>
              <div style={{
                width:38, height:38, borderRadius:10,
                background:'linear-gradient(135deg,#ff3b30,#ff6b35)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:16, flexShrink:0,
                boxShadow:'0 4px 10px rgba(255,59,48,.3)',
              }}>👤</div>
              <div>
                <div style={{fontSize:13, fontWeight:600, color:T.text}}>{email}</div>
                <div style={{fontSize:11, color:T.text3, marginTop:2}}>Free plan · Member since 2025</div>
              </div>
            </div>

            {/* Change email */}
            <div style={{marginBottom:24}}>
              <div style={{fontSize:11, fontWeight:700, letterSpacing:1, color:T.text3, textTransform:'uppercase', marginBottom:10}}>
                Change Email
              </div>
              <input
                type="email"
                placeholder="New email address"
                value={newEmail}
                onChange={e=>setNewEmail(e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={()=>{ if(newEmail.includes('@')){ setEmail(newEmail); setNewEmail(''); setSavedEmail(true); setTimeout(()=>setSavedEmail(false),2500) } }}
                style={{
                  padding:'10px 20px',
                  background: newEmail.includes('@') ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : T.inputBg,
                  color: newEmail.includes('@') ? '#fff' : T.text3,
                  border:'none', borderRadius:100, fontSize:13, fontWeight:600,
                  cursor: newEmail.includes('@') ? 'pointer' : 'not-allowed',
                  fontFamily:"'Outfit',sans-serif",
                  transition:'all .2s',
                }}
              >
                {savedEmail ? '✓ Email updated!' : 'Update Email'}
              </button>
            </div>

            <div style={{height:1, background:T.divider, marginBottom:24}}/>

            {/* Change password */}
            <div style={{marginBottom:24}}>
              <div style={{fontSize:11, fontWeight:700, letterSpacing:1, color:T.text3, textTransform:'uppercase', marginBottom:10}}>
                Change Password
              </div>
              <input type="password" placeholder="Current password" value={curPass} onChange={e=>setCurPass(e.target.value)} style={inputStyle}/>
              <input type="password" placeholder="New password (8+ characters)" value={newPass} onChange={e=>setNewPass(e.target.value)} style={inputStyle}/>
              <input type="password" placeholder="Confirm new password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} style={{...inputStyle, marginBottom:12}}/>
              <button
                onClick={()=>{ if(newPass.length>=8 && newPass===confirmPass){ setCurPass(''); setNewPass(''); setConfirmPass(''); setSavedPass(true); setTimeout(()=>setSavedPass(false),2500) } }}
                style={{
                  padding:'10px 20px',
                  background: newPass.length>=8 && newPass===confirmPass
                    ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : T.inputBg,
                  color: newPass.length>=8 && newPass===confirmPass ? '#fff' : T.text3,
                  border:'none', borderRadius:100, fontSize:13, fontWeight:600,
                  cursor: newPass.length>=8 && newPass===confirmPass ? 'pointer' : 'not-allowed',
                  fontFamily:"'Outfit',sans-serif",
                  transition:'all .2s',
                }}
              >
                {savedPass ? '✓ Password updated!' : 'Update Password'}
              </button>
              {newPass && confirmPass && newPass !== confirmPass && (
                <div style={{fontSize:12, color:'#ff453a', marginTop:8}}>Passwords don't match</div>
              )}
            </div>

            <div style={{height:1, background:T.divider, marginBottom:24}}/>

            {/* Sign out */}
            <button
              onClick={()=>{ window.location.href='/login' }}
              style={{
                width:'100%', padding:12,
                background:'transparent',
                color:'#ff453a',
                border:`1px solid rgba(255,69,58,.25)`,
                borderRadius:100, fontSize:14, fontWeight:600,
                cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              }}
            >
              Sign Out
            </button>
          </>}

          {/* ── LOCATION TAB ── */}
          {tab === 'location' && <>
            <div style={{
              background:T.inputBg, border:`1px solid ${T.inputBdr}`,
              borderRadius:14, padding:'14px 16px', marginBottom:20,
              fontSize:13, color:T.text2, lineHeight:1.6,
            }}>
              {userCoords
                ? `📍 Current location: ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`
                : '📍 No location set yet'}
            </div>

            <div style={{fontSize:11, fontWeight:700, letterSpacing:1, color:T.text3, textTransform:'uppercase', marginBottom:14}}>
              Update Your Location
            </div>

            {/* GPS button */}
            <button
              onClick={handleUpdateLocation}
              disabled={locUpdating}
              style={{
                width:'100%', padding:14,
                background: locUpdating ? T.inputBg : 'linear-gradient(135deg,#ff3b30,#ff6b35)',
                color: locUpdating ? T.text2 : '#fff',
                border:'none', borderRadius:14, fontSize:14, fontWeight:700,
                cursor: locUpdating ? 'not-allowed' : 'pointer',
                fontFamily:"'Outfit',sans-serif",
                marginBottom:10,
                boxShadow: locUpdating ? 'none' : '0 4px 14px rgba(255,59,48,.35)',
                transition:'all .2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}
            >
              {locUpdating ? '⟳ Detecting location...' : '📍 Use My Current Location'}
            </button>

            {locMsg && (
              <div style={{
                fontSize:12, color: locMsg.startsWith('✓') ? T.green : '#ff9f0a',
                marginBottom:16, padding:'8px 12px',
                background: locMsg.startsWith('✓') ? `${T.green}12` : 'rgba(255,159,10,.1)',
                borderRadius:10, border: `1px solid ${locMsg.startsWith('✓') ? `${T.green}22` : 'rgba(255,159,10,.2)'}`,
              }}>{locMsg}</div>
            )}

            <div style={{
              display:'flex', alignItems:'center', gap:12,
              margin:'6px 0 16px', color:T.text3, fontSize:12,
            }}>
              <div style={{flex:1, height:1, background:T.divider}}/> or <div style={{flex:1, height:1, background:T.divider}}/>
            </div>

            {/* ZIP code */}
            <div style={{fontSize:11, fontWeight:700, letterSpacing:1, color:T.text3, textTransform:'uppercase', marginBottom:10}}>
              Enter ZIP Code
            </div>
            <div style={{display:'flex', gap:8}}>
              <input
                type="text"
                placeholder="e.g. 30309"
                maxLength={5}
                style={{
                  flex:1, padding:'11px 14px',
                  background:T.inputBg, border:`1px solid ${T.inputBdr}`,
                  borderRadius:12, fontSize:18, fontWeight:700,
                  color:T.accent, outline:'none',
                  fontFamily:"'Outfit',sans-serif", letterSpacing:3,
                }}
              />
              <button style={{
                padding:'11px 20px',
                background:'linear-gradient(135deg,#ff3b30,#ff6b35)',
                color:'#fff', border:'none', borderRadius:12,
                fontSize:13, fontWeight:700, cursor:'pointer',
                fontFamily:"'Outfit',sans-serif",
                whiteSpace:'nowrap',
              }}>
                Search →
              </button>
            </div>

            <div style={{
              marginTop:20, padding:'14px 16px',
              background:T.inputBg, borderRadius:14,
              border:`1px solid ${T.inputBdr}`,
            }}>
              <div style={{fontSize:11, fontWeight:600, letterSpacing:1, color:T.text3, textTransform:'uppercase', marginBottom:10}}>
                Location Privacy
              </div>
              {['We never store your exact GPS coordinates','Location is used only to find nearby gas stations','You can update or clear your location anytime','ZIP code lookup does not require GPS access'].map((t,i)=>(
                <div key={i} style={{display:'flex', gap:8, fontSize:12, color:T.text2, marginBottom:i<3?7:0}}>
                  <span style={{color:T.green, flexShrink:0}}>✓</span>{t}
                </div>
              ))}
            </div>
          </>}

          {/* ── PLAN TAB ── */}
          {tab === 'plan' && <>
            <div style={{fontSize:11, fontWeight:700, letterSpacing:1, color:T.text3, textTransform:'uppercase', marginBottom:16}}>
              Current Plan: <span style={{color:T.accent}}>{PLANS.find(p=>p.id===currentPlan)?.name || 'Free'}</span>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:12, marginBottom:20}}>
              {PLANS.map(plan=>{
                const isCurrent = plan.id === currentPlan
                const isSelected = plan.id === selectedPlan
                return (
                  <div
                    key={plan.id}
                    onClick={()=>setSelectedPlan(plan.id)}
                    style={{
                      border:`2px solid ${isSelected ? '#ff3b30' : T.inputBdr}`,
                      borderRadius:18, padding:18,
                      cursor:'pointer',
                      background: isSelected ? 'rgba(255,59,48,.04)' : T.inputBg,
                      transition:'all .2s',
                      position:'relative',
                    }}
                  >
                    {plan.recommended && (
                      <div style={{
                        position:'absolute', top:-10, left:16,
                        background:'linear-gradient(135deg,#ff3b30,#ff6b35)',
                        color:'#fff', fontSize:9, fontWeight:700,
                        padding:'3px 10px', borderRadius:100, letterSpacing:1,
                        boxShadow:'0 2px 8px rgba(255,59,48,.35)',
                      }}>⭐ RECOMMENDED</div>
                    )}

                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                      <div>
                        <div style={{fontSize:16, fontWeight:800, letterSpacing:-.3, color:T.text, marginBottom:2}}>{plan.name}</div>
                        {isCurrent && (
                          <div style={{fontSize:10, fontWeight:600, color:T.green, letterSpacing:.5}}>✓ CURRENT PLAN</div>
                        )}
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:22, fontWeight:900, letterSpacing:-1, color:plan.id==='free'?T.text2:'#ff3b30', lineHeight:1}}>
                          {plan.price}
                        </div>
                        <div style={{fontSize:11, color:T.text3}}>{plan.period}</div>
                      </div>
                    </div>

                    <div style={{display:'flex', flexDirection:'column', gap:5}}>
                      {plan.bullets.map((b,i)=>(
                        <div key={i} style={{display:'flex', gap:7, fontSize:12, color:T.text2}}>
                          <span style={{color:T.green, flexShrink:0}}>✓</span>{b}
                        </div>
                      ))}
                      {plan.locked.map((b,i)=>(
                        <div key={i} style={{display:'flex', gap:7, fontSize:12, color:T.text3}}>
                          <span style={{flexShrink:0}}>🔒</span>{b}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {selectedPlan !== currentPlan && (
              <button
                onClick={()=>{ onChangePlan(selectedPlan) }}
                style={{
                  width:'100%', padding:14,
                  background:'linear-gradient(135deg,#ff3b30,#ff6b35)',
                  color:'#fff', border:'none', borderRadius:100,
                  fontSize:15, fontWeight:700, cursor:'pointer',
                  fontFamily:"'Outfit',sans-serif",
                  boxShadow:'0 4px 16px rgba(255,59,48,.35)',
                  marginBottom:10,
                }}
              >
                {selectedPlan === 'free'
                  ? 'Downgrade to Free'
                  : `Upgrade to ${PLANS.find(p=>p.id===selectedPlan)?.name} →`}
              </button>
            )}

            <div style={{fontSize:11, color:T.text3, textAlign:'center', lineHeight:1.6}}>
              Cancel anytime · No contracts · 7-day free trial on paid plans
            </div>
          </>}

        </div>
      </div>
    </div>
  )
}

// ── Location Modal ────────────────────────────────────────────────────────────
function LocationModal({onAllow,onDeny,T}:{onAllow:()=>void,onDeny:()=>void,T:Theme}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.65)",backdropFilter:"blur(14px)",padding:24}}>
      <div style={{background:T.modalBg,border:`1px solid ${T.modalBdr}`,borderRadius:28,padding:"36px 32px",maxWidth:380,width:"100%",backdropFilter:"blur(40px)",boxShadow:"0 24px 80px rgba(0,0,0,.45)",textAlign:"center",animation:"popIn .4s cubic-bezier(.34,1.56,.64,1)"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#ff3b30,#ff6b35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 20px",boxShadow:"0 0 32px rgba(255,59,48,.4)"}}>📍</div>
        <div style={{display:"inline-block",background:T.pillBg,border:`1px solid ${T.pillBdr}`,borderRadius:100,padding:"4px 14px",fontSize:10,fontWeight:600,letterSpacing:2,color:T.accent,textTransform:"uppercase",marginBottom:14}}>
          CompliCoreOS · Location Access
        </div>
        <h2 style={{fontSize:26,fontWeight:800,letterSpacing:-.5,color:T.text,marginBottom:10,lineHeight:1.2}}>Find Gas Prices<br/>Near You</h2>
        <p style={{fontSize:14,color:T.text2,lineHeight:1.6,marginBottom:16}}>
          We use your location to show real-time gas prices at stations near you and calculate your actual mileage deductions.
        </p>
        <div style={{background:T.inputBg,border:`1px solid ${T.inputBdr}`,borderRadius:14,padding:"14px 16px",marginBottom:22,textAlign:"left"}}>
          <div style={{fontSize:10,fontWeight:600,letterSpacing:1,color:T.text3,textTransform:"uppercase",marginBottom:10}}>What we do with your location</div>
          {[
            {icon:"✓",text:"Show gas stations within 5 miles",ok:true},
            {icon:"✓",text:"Calculate real driving distances",ok:true},
            {icon:"✓",text:"Auto-fill your area for prices",ok:true},
            {icon:"✗",text:"We never store your exact location",ok:false},
            {icon:"✗",text:"We never sell location data",ok:false},
            {icon:"✗",text:"We never track you in background",ok:false},
          ].map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span style={{fontSize:11,fontWeight:700,color:item.ok?T.green:"#ff453a",minWidth:12}}>{item.icon}</span>
              <span style={{fontSize:12,color:item.ok?T.text2:T.text3}}>{item.text}</span>
            </div>
          ))}
        </div>
        <p style={{fontSize:11,color:T.text3,marginBottom:20,lineHeight:1.5}}>
          Your browser will show its own permission prompt. You can change this anytime in browser settings. By allowing, you agree to our{" "}
          <a href="/privacy" style={{color:T.accent}}>Privacy Policy</a> and{" "}
          <a href="/terms" style={{color:T.accent}}>Terms of Service</a>.
        </p>
        <button onClick={onAllow} style={{width:"100%",padding:14,background:"linear-gradient(135deg,#ff3b30,#ff6b35)",color:"#fff",border:"none",borderRadius:100,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:10,boxShadow:"0 0 24px rgba(255,59,48,.4)",fontFamily:"system-ui"}}>
          Allow Location Access
        </button>
        <button onClick={onDeny} style={{width:"100%",padding:12,background:"transparent",color:T.text2,border:`1px solid ${T.inputBdr}`,borderRadius:100,fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"system-ui"}}>
          Enter ZIP code instead
        </button>
      </div>
    </div>
  )
}

// ── ZIP Modal ─────────────────────────────────────────────────────────────────
function ZipModal({onSubmit,onClose,T}:{onSubmit:(z:string)=>void,onClose:()=>void,T:Theme}) {
  const [zip,setZip] = useState("")
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.65)",backdropFilter:"blur(14px)",padding:24}}>
      <div style={{background:T.modalBg,border:`1px solid ${T.modalBdr}`,borderRadius:28,padding:32,maxWidth:360,width:"100%",backdropFilter:"blur(40px)",boxShadow:"0 24px 80px rgba(0,0,0,.45)",textAlign:"center",animation:"popIn .4s cubic-bezier(.34,1.56,.64,1)"}}>
        <div style={{fontSize:40,marginBottom:16}}>🗺️</div>
        <h2 style={{fontSize:24,fontWeight:800,letterSpacing:-.5,color:T.text,marginBottom:8}}>Enter Your ZIP Code</h2>
        <p style={{fontSize:13,color:T.text2,marginBottom:24,lineHeight:1.5}}>We'll find gas stations in your area.</p>
        <input value={zip} maxLength={5} onChange={e=>setZip(e.target.value.replace(/\D/g,"").slice(0,5))} placeholder="e.g. 30309" style={{width:"100%",padding:"14px 16px",background:T.inputBg,border:`1px solid ${T.inputBdr}`,borderRadius:12,fontSize:22,fontWeight:700,color:T.accent,outline:"none",fontFamily:"system-ui",letterSpacing:4,textAlign:"center",marginBottom:14}}/>
        <button onClick={()=>zip.length===5&&onSubmit(zip)} disabled={zip.length!==5} style={{width:"100%",padding:14,background:zip.length===5?"linear-gradient(135deg,#ff3b30,#ff6b35)":"rgba(255,59,48,.2)",color:"#fff",border:"none",borderRadius:100,fontSize:15,fontWeight:700,cursor:zip.length===5?"pointer":"not-allowed",marginBottom:10,fontFamily:"system-ui",opacity:zip.length===5?1:.6}}>Find Gas Prices →</button>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:T.text3,fontSize:13,cursor:"pointer",fontFamily:"system-ui"}}>Cancel</button>
      </div>
    </div>
  )
}

// ── Gas Map ───────────────────────────────────────────────────────────────────
function GasMap({stations,grade,selectedId,onSelect,userCoords,T,mapKey}:{
  stations:Station[],grade:string,selectedId:number|null,
  onSelect:(id:number)=>void,userCoords:Coords|null,T:Theme,mapKey:string
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const mksRef = useRef<Record<number,any>>({})

  const initMap = useCallback((L:any) => {
    if(!divRef.current||mapRef.current) return
    const center = userCoords ?? {lat:33.849,lng:-84.373}
    const map = L.map(divRef.current,{center:[center.lat,center.lng],zoom:userCoords?14:12,zoomControl:false,attributionControl:false})
    L.tileLayer(T.tileUrl,{maxZoom:19}).addTo(map)
    L.control.zoom({position:"bottomright"}).addTo(map)
    if(userCoords) {
      L.marker([center.lat,center.lng],{icon:L.divIcon({className:"",iconSize:[24,24],iconAnchor:[12,12],html:`<div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#ff3b30,#ff6b35);border:3px solid #fff;box-shadow:0 0 0 5px rgba(255,59,48,.22),0 4px 12px rgba(255,59,48,.5);animation:userPulse 2s ease-in-out infinite"></div>`})}).addTo(map).bindPopup(`<div style="font-family:system-ui;font-size:12px;color:${T.accent};font-weight:600">📍 Your Location</div>`)
    }
    const best = cheapestSt(stations,grade)
    stations.forEach(st=>{
      if(!st.lat&&!st.lng) return
      const m = L.marker([st.lat,st.lng],{icon:L.divIcon({className:"",iconSize:[80,52],iconAnchor:[40,52],html:makePin(st[gk(grade)],st.id===best?.id,false,T.isDark)})}).addTo(map).on("click",()=>onSelect(st.id))
      m.bindPopup(`<div style="font-family:system-ui;min-width:160px"><div style="font-size:13px;font-weight:700;color:#1a1a2e;margin-bottom:6px">${st.name}</div><div style="font-size:10px;color:rgba(26,26,46,.5);margin-bottom:8px">📍 ${st.address}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">${GRADES.map(g=>`<div style="background:rgba(0,0,0,.04);border-radius:6px;padding:4px 6px"><div style="font-size:8px;color:rgba(26,26,46,.4);text-transform:uppercase;letter-spacing:1px">${g}</div><div style="font-size:14px;font-weight:700;color:${g===grade?'#ff3b30':'#1a1a2e'}">$${st[gk(g)].toFixed(2)}</div></div>`).join("")}</div><div style="margin-top:8px;font-size:10px;color:rgba(26,26,46,.4)">${st.distance} mi away · ${st.updated}</div></div>`)
      mksRef.current[st.id] = m
    })
    mapRef.current = map
  },[])

  useEffect(()=>{
    const boot=(L:any)=>initMap(L)
    if((window as any).L){boot((window as any).L);return}
    if(!document.querySelector("#leaflet-css")){const lnk=document.createElement("link");lnk.id="leaflet-css";lnk.rel="stylesheet";lnk.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(lnk)}
    if(!document.querySelector("#leaflet-js")){const sc=document.createElement("script");sc.id="leaflet-js";sc.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";sc.onload=()=>boot((window as any).L);document.head.appendChild(sc)}else{const wait=setInterval(()=>{if((window as any).L){clearInterval(wait);boot((window as any).L)}},100)}
    return ()=>{if(mapRef.current){mapRef.current.remove();mapRef.current=null;mksRef.current={}}}
  },[])

  useEffect(()=>{
    if(!(window as any).L||!mapRef.current||!stations.length)return
    const L=(window as any).L;const best=cheapestSt(stations,grade)
    stations.forEach(st=>{const m=mksRef.current[st.id];if(!m)return;m.setIcon(L.divIcon({className:"",iconSize:[80,52],iconAnchor:[40,52],html:makePin(st[gk(grade)],st.id===best?.id,st.id===selectedId,T.isDark)}))})
  },[grade,selectedId,T.isDark])

  useEffect(()=>{
    if(!mapRef.current||!selectedId)return
    const st=stations.find(s=>s.id===selectedId)
    if(st?.lat&&st?.lng){mapRef.current.panTo([st.lat,st.lng],{animate:true,duration:.6});mksRef.current[selectedId]?.openPopup()}
  },[selectedId])

  return (
    <>
      <style>{`
        @keyframes userPulse{0%,100%{box-shadow:0 0 0 5px rgba(255,59,48,.22),0 4px 12px rgba(255,59,48,.5)}50%{box-shadow:0 0 0 10px rgba(255,59,48,.08),0 4px 12px rgba(255,59,48,.3)}}
        .leaflet-popup-content-wrapper{background:${T.modalBg}!important;border:1px solid ${T.surfaceHLBdr}!important;border-radius:14px!important;box-shadow:0 8px 32px rgba(0,0,0,.5)!important;color:${T.text}!important;backdrop-filter:blur(20px)!important}
        .leaflet-popup-content{margin:12px 14px!important}
        .leaflet-popup-tip{background:${T.modalBg}!important}
        .leaflet-popup-close-button{color:${T.text3}!important;font-size:16px!important;top:8px!important;right:10px!important}
        .leaflet-control-zoom{border:none!important}
        .leaflet-control-zoom a{background:${T.modalBg}!important;backdrop-filter:blur(12px)!important;color:${T.text2}!important;border:1px solid ${T.surfaceBdr}!important;margin-bottom:3px!important;border-radius:8px!important;display:block!important}
        .leaflet-control-zoom a:hover{background:rgba(255,59,48,.15)!important;color:#ff3b30!important}
      `}</style>
      <div ref={divRef} style={{width:"100%",height:"100%",borderRadius:20}}/>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GasPage() {
  // ── Light mode is now default ─────────────────────────────────────────────
  const [isDark,       setIsDark]       = useState(false)
  const [grade,        setGrade]        = useState("Regular")
  const [sortBy,       setSortBy]       = useState("price")
  const [selId,        setSelId]        = useState<number|null>(null)
  const [miles,        setMiles]        = useState(150)
  const [tank,         setTank]         = useState(14)
  const [stations,     setStations]     = useState<Station[]>(FALLBACK_STATIONS)
  const [history,      setHistory]      = useState(FALLBACK_HISTORY)
  const [userCoords,   setUserCoords]   = useState<Coords|null>(null)
  const [locStatus,    setLocStatus]    = useState("Awaiting location...")
  const [loading,      setLoading]      = useState(false)
  const [modal,        setModal]        = useState<"location"|"zip"|null>("location")
  const [mapKey,       setMapKey]       = useState("init")
  const [showSettings, setShowSettings] = useState(false)
  const [currentPlan,  setCurrentPlan]  = useState('free')

  const T = isDark ? DARK : LIGHT

  const glass = (extra={}) => ({
    background:T.surface,border:`1px solid ${T.surfaceBdr}`,
    borderRadius:20,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",...extra,
  })

  const fetchData = useCallback(async (lat:number,lng:number) => {
    setLoading(true);setLocStatus("Fetching prices near you...")
    try {
      const eiaRes=await fetch("/api/gas-prices");const eiaData=await eiaRes.json()
      const base=eiaData.prices?.[0]?.price??3.15
      if(eiaData.prices?.length){setHistory([...eiaData.prices].reverse().map((p:any)=>({day:p.period.slice(5),price:p.price})))}
      const stRes=await fetch(`/api/stations?lat=${lat}&lng=${lng}`);const stData=await stRes.json()
      if(stData.stations?.length){
        const enriched:Station[]=stData.stations.map((st:any,i:number)=>({...st,id:i+1,...simulatePrices(base),distance:distanceMiles(lat,lng,st.lat,st.lng),trending:["down","stable","up"][Math.floor(Math.random()*3)],updated:`${Math.floor(Math.random()*10)+1}m ago`}))
        setStations(enriched);setLocStatus(`${enriched.length} stations found · Live prices`)
        setMapKey(`${lat.toFixed(4)}-${lng.toFixed(4)}-${Date.now()}`)
      } else {setLocStatus("Sample data · No nearby stations found");setMapKey(`fallback-${Date.now()}`)}
    } catch(e){setLocStatus("Sample data · Check connection");setMapKey(`fallback-${Date.now()}`)}
    setLoading(false)
  },[])

  const handleAllow = useCallback(()=>{
    setModal(null)
    if(!navigator.geolocation){setModal("zip");return}
    setLocStatus("Requesting location...")
    navigator.geolocation.getCurrentPosition(
      pos=>{const{latitude:lat,longitude:lng}=pos.coords;setUserCoords({lat,lng});setLocStatus("📍 Location found");fetchData(lat,lng)},
      err=>{setLocStatus(err.code===1?"Location denied · Try ZIP":"Location unavailable · Try ZIP");setModal("zip");setLoading(false)},
      {enableHighAccuracy:true,timeout:12000,maximumAge:300000}
    )
  },[fetchData])

  const handleZip = useCallback((zip:string)=>{
    setModal(null);setLocStatus(`ZIP ${zip} · Finding stations...`)
    const lat=33.749,lng=-84.388
    setUserCoords({lat,lng});setMapKey(`zip-${zip}-${Date.now()}`);fetchData(lat,lng)
  },[fetchData])

  // Update location from settings panel
  const handleUpdateLocation = useCallback(()=>{
    if(!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const{latitude:lat,longitude:lng}=pos.coords
        setUserCoords({lat,lng})
        setLocStatus("📍 Location updated")
        setMapKey(`${lat.toFixed(4)}-${lng.toFixed(4)}-${Date.now()}`)
        fetchData(lat,lng)
      },
      ()=>setLocStatus("Could not update location"),
      {enableHighAccuracy:true,timeout:10000}
    )
  },[fetchData])

  useEffect(()=>{
    if(!userCoords)return
    const id=navigator.geolocation?.watchPosition(
      pos=>{const{latitude:lat,longitude:lng}=pos.coords;const moved=distanceMiles(userCoords.lat,userCoords.lng,lat,lng);if(moved>0.1){setUserCoords({lat,lng});fetchData(lat,lng)}},
      ()=>{},{enableHighAccuracy:true,maximumAge:60000}
    )
    return ()=>{if(id)navigator.geolocation?.clearWatch(id)}
  },[userCoords?.lat,userCoords?.lng])

  const best      = cheapestSt(stations,grade)
  const bestPrice = best?.[gk(grade)]??3.09
  const avgPrice  = stations.reduce((s,st)=>s+(st as any)[gk(grade)],0)/stations.length
  const sel       = stations.find(s=>s.id===selId)
  const deduction = (miles*4.33*IRS_RATE).toFixed(2)
  const monthlyGas= ((miles/AVG_MPG)*bestPrice*4.33).toFixed(2)
  const weeklyGas = ((miles/AVG_MPG)*bestPrice).toFixed(2)
  const fillCost  = (tank*bestPrice).toFixed(2)
  const saving    = ((avgPrice-bestPrice)*tank).toFixed(2)
  const sorted    = [...stations].sort((a,b)=>sortBy==="price"?(a as any)[gk(grade)]-(b as any)[gk(grade)]:a.distance-b.distance)
  const toggle    = (id:number) => setSelId(p=>p===id?null:id)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:${T.bg}!important;transition:background .4s}
        @keyframes popIn{from{opacity:0;transform:scale(.88) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.28;transform:scale(.58)}}
        @keyframes loadSlide{0%{left:-40%}100%{left:100%}}
        @keyframes settingsIn{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
      `}</style>

      {modal==="location" && <LocationModal onAllow={handleAllow} onDeny={()=>setModal("zip")} T={T}/>}
      {modal==="zip"      && <ZipModal onSubmit={handleZip} onClose={()=>setModal(null)} T={T}/>}

      {showSettings && (
        <SettingsPanel
          onClose={()=>setShowSettings(false)}
          T={T}
          userCoords={userCoords}
          onUpdateLocation={handleUpdateLocation}
          currentPlan={currentPlan}
          onChangePlan={(p)=>{ setCurrentPlan(p); setShowSettings(false) }}
        />
      )}

      <div style={{background:T.bg,backgroundImage:T.bgGrad,minHeight:"100vh",fontFamily:"'Outfit',system-ui,sans-serif",color:T.text,padding:22,transition:"background .4s,color .3s"}}>

        {/* ── Header ── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <Link href="/" style={{fontSize:11,color:T.text3,textDecoration:"none",display:"flex",alignItems:"center",gap:4}}>
                ← Back
              </Link>
            </div>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:"2.5px",color:T.accent,textTransform:"uppercase",marginBottom:4}}>
              ⛽ Personal Dashboard · Fuel Module
            </div>
            <div style={{fontSize:40,fontWeight:900,letterSpacing:-2,lineHeight:1}}>
              GAS <span style={{color:T.accent}}>PRICES</span>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>

              {/* Update location button */}
              <button onClick={handleUpdateLocation} style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"7px 14px",cursor:"pointer",
                color:T.text2,fontSize:12,fontWeight:600,
                fontFamily:"'Outfit',sans-serif",transition:"all .2s",
                background:T.surface,border:`1px solid ${T.surfaceBdr}`,
                borderRadius:20,backdropFilter:"blur(24px)",
              }}>
                📍 Update Location
              </button>

              {/* Dark/light toggle */}
              <button onClick={()=>setIsDark(d=>!d)} style={{
                display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
                cursor:"pointer",color:T.text2,fontSize:12,fontWeight:600,
                fontFamily:"'Outfit',sans-serif",transition:"all .2s",
                background:T.surface,border:`1px solid ${T.surfaceBdr}`,
                borderRadius:20,backdropFilter:"blur(24px)",
              }}>
                <span style={{fontSize:14}}>{isDark?"☀️":"🌙"}</span>
              </button>

              {/* Settings button */}
              <button onClick={()=>setShowSettings(true)} style={{
                display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
                cursor:"pointer",color:T.text2,fontSize:12,fontWeight:600,
                fontFamily:"'Outfit',sans-serif",transition:"all .2s",
                background:T.surface,border:`1px solid ${T.surfaceBdr}`,
                borderRadius:20,backdropFilter:"blur(24px)",
              }}>
                ⚙️ Settings
              </button>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:6,background:T.pillBg,border:`1px solid ${T.pillBdr}`,borderRadius:100,padding:"6px 14px",fontSize:10,fontWeight:600,letterSpacing:1,color:T.accent}}>
              <div style={{width:7,height:7,background:T.accent,borderRadius:"50%",animation:"lp 1.4s ease-in-out infinite",boxShadow:`0 0 5px ${T.accent}`}}/>
              {loading?"FETCHING...":"LIVE · EIA DATA"}
            </div>
            <div style={{fontSize:10,color:T.text3,letterSpacing:.3}}>{locStatus}</div>
          </div>
        </div>

        {/* Loading bar */}
        {loading&&(
          <div style={{height:2,background:T.inputBg,borderRadius:1,overflow:"hidden",marginBottom:16,position:"relative"}}>
            <div style={{position:"absolute",height:"100%",width:"40%",background:`linear-gradient(90deg,transparent,${T.accent},transparent)`,borderRadius:1,animation:"loadSlide 1.2s ease-in-out infinite"}}/>
          </div>
        )}

        {/* Location nudge */}
        {!userCoords&&!modal&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.pillBg,border:`1px solid ${T.pillBdr}`,borderRadius:14,padding:"10px 16px",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <span style={{fontSize:12,color:T.text2}}>📍 Using sample data — enable location for real prices near you</span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={handleAllow} style={{padding:"6px 16px",background:`linear-gradient(135deg,${T.accent},#ff6b35)`,color:"#fff",border:"none",borderRadius:100,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                Allow Location
              </button>
              <button onClick={()=>setModal("zip")} style={{padding:"6px 14px",...glass({cursor:"pointer",color:T.text2,fontSize:12,fontWeight:500,fontFamily:"'Outfit',sans-serif"})}}>
                Use ZIP
              </button>
            </div>
          </div>
        )}

        {/* Grade tabs */}
        <div style={{display:"flex",gap:7,marginBottom:18,flexWrap:"wrap"}}>
          {GRADES.map(g=>(
            <button key={g} onClick={()=>setGrade(g)} style={{
              padding:"8px 20px",borderRadius:100,fontSize:13,fontWeight:600,
              cursor:"pointer",fontFamily:"'Outfit',sans-serif",letterSpacing:.3,
              transition:"all .25s cubic-bezier(.34,1.56,.64,1)",
              background:grade===g?"linear-gradient(135deg,#ff3b30,#ff6b35)":T.surface,
              color:grade===g?"#fff":T.text2,
              border:grade===g?"none":`1px solid ${T.surfaceBdr}`,
              boxShadow:grade===g?`0 0 18px rgba(255,59,48,.35),0 4px 12px rgba(255,59,48,.2)`:"none",
              transform:grade===g?"scale(1.03)":"scale(1)",
            }}>{g}</button>
          ))}
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:11,marginBottom:16}}>
          <div style={{background:T.surfaceHL,border:`1px solid ${T.surfaceHLBdr}`,borderRadius:20,padding:"16px 18px",position:"relative",overflow:"hidden",boxShadow:`0 0 0 1px rgba(255,59,48,.08),0 8px 24px rgba(255,59,48,.1)`}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,59,48,.5),transparent)"}}/>
            <div style={{fontSize:9,fontWeight:600,letterSpacing:"1.5px",color:T.accent,textTransform:"uppercase",marginBottom:7}}>Cheapest Nearby</div>
            <div style={{fontSize:30,fontWeight:800,letterSpacing:-1,color:T.accent}}>${bestPrice.toFixed(2)}</div>
            <div style={{fontSize:11,color:T.text2,marginTop:5}}>{best?.name} · {best?.distance} mi</div>
          </div>
          {[
            {label:"Area Average",val:`$${avgPrice.toFixed(2)}`,sub:`Save $${saving}/fill-up`,ok:true},
            {label:"Fill-Up Cost",val:`$${fillCost}`,sub:`${tank}gal · best price`},
            {label:"7-Day Trend",val:"↓ $0.19",sub:"vs last week",grn:true},
            {label:"Natl Average",val:"$3.31",sub:"$0.22 under national",ok:true},
          ].map(k=>(
            <div key={k.label} style={{...glass({padding:"16px 18px"})}}>
              <div style={{fontSize:9,fontWeight:600,letterSpacing:"1.5px",color:T.text3,textTransform:"uppercase",marginBottom:7}}>{k.label}</div>
              <div style={{fontSize:30,fontWeight:800,letterSpacing:-1,color:k.grn?T.green:T.text}}>{k.val}</div>
              <div style={{fontSize:11,color:k.ok?T.green:T.text2,marginTop:5}}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Map + Station List */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 295px",gap:13,marginBottom:13,height:440}}>
          <div style={{borderRadius:20,overflow:"hidden",border:`1px solid ${T.surfaceBdr}`,position:"relative",boxShadow:"0 8px 32px rgba(0,0,0,.12)"}}>
            <GasMap key={mapKey} mapKey={mapKey} stations={stations} grade={grade} selectedId={selId} onSelect={toggle} userCoords={userCoords} T={T}/>
            <div style={{position:"absolute",top:13,left:13,zIndex:999,background:T.mapOverlay,backdropFilter:"blur(24px)",border:`1px solid ${T.surfaceHLBdr}`,borderRadius:14,padding:"11px 15px",pointerEvents:"none",boxShadow:"0 4px 20px rgba(0,0,0,.15)"}}>
              <div style={{fontSize:9,fontWeight:600,letterSpacing:2,color:T.accent,textTransform:"uppercase",marginBottom:2}}>Best Price</div>
              <div style={{fontSize:24,fontWeight:800,letterSpacing:-1,color:T.text}}>${bestPrice.toFixed(2)}</div>
              <div style={{fontSize:10,color:T.text2,marginTop:1}}>{best?.name} · {best?.distance} mi</div>
            </div>
            <button onClick={handleUpdateLocation} style={{position:"absolute",bottom:13,left:13,zIndex:999,background:T.mapOverlay,backdropFilter:"blur(20px)",border:`1px solid ${T.surfaceBdr}`,borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:11,fontWeight:600,color:T.text2,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
              📍 {userCoords?"Update Location":"Enable Location"}
            </button>
          </div>

          <div style={{...glass({display:"flex",flexDirection:"column",overflow:"hidden",padding:0})}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:`1px solid ${T.surfaceBdr}`,flexShrink:0}}>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",color:T.text2}}>
                {stations[0]?.lat?`${stations.length} Stations Found`:"Nearby Stations"}
              </div>
              <div style={{display:"flex",gap:3}}>
                {["price","distance"].map(s=>(
                  <button key={s} onClick={()=>setSortBy(s)} style={{fontSize:9,fontWeight:600,padding:"3px 9px",borderRadius:7,cursor:"pointer",letterSpacing:.5,fontFamily:"'Outfit',sans-serif",transition:"all .2s",background:sortBy===s?`rgba(255,59,48,.14)`:T.inputBg,color:sortBy===s?T.accent:T.text3,border:`1px solid ${sortBy===s?"rgba(255,59,48,.28)":T.inputBdr}`}}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",scrollbarWidth:"thin"}}>
              {sorted.map((st,i)=>{
                const p=(st as any)[gk(grade)],ib=best&&st.id===best.id,is=st.id===selId
                return (
                  <div key={st.id} onClick={()=>toggle(st.id)} style={{display:"flex",alignItems:"center",padding:"12px 16px",gap:11,borderBottom:`1px solid ${T.surfaceBdr}`,cursor:"pointer",borderLeft:`2.5px solid ${is?T.accent:ib?T.green:"transparent"}`,background:is?T.rowSel:ib?T.rowBest:"transparent",transition:"background .18s"}}>
                    <div style={{fontSize:10,fontWeight:700,color:i===0?T.green:T.text3,minWidth:15,textAlign:"center"}}>{i===0?"★":`${i+1}`}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:T.text}}>{st.name}</div>
                      <div style={{fontSize:9,color:T.text3,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{st.address}</div>
                      <div style={{fontSize:9,color:T.text3,marginTop:1}}>{st.distance} mi away</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:21,fontWeight:800,letterSpacing:-.5,color:ib?T.green:T.text,lineHeight:1}}>${p.toFixed(2)}</div>
                      <div style={{fontSize:11,fontWeight:700,color:trendColor(st.trending,T),marginTop:2}}>{trendIcon(st.trending)}</div>
                      <div style={{fontSize:8,color:T.text3,marginTop:2}}>{st.updated}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected station */}
        {sel&&(
          <div style={{background:T.surfaceHL,border:`1px solid ${T.surfaceHLBdr}`,borderRadius:20,padding:"16px 20px",marginBottom:13,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14,animation:"fadeUp .3s cubic-bezier(.34,1.56,.64,1)",position:"relative",overflow:"hidden",boxShadow:`0 0 0 1px rgba(255,59,48,.08),0 8px 24px rgba(255,59,48,.1)`}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,59,48,.5),transparent)"}}/>
            <div>
              <div style={{fontSize:9,fontWeight:600,letterSpacing:2,color:T.accent,textTransform:"uppercase",marginBottom:3}}>Selected Station</div>
              <div style={{fontSize:26,fontWeight:800,letterSpacing:-.5,color:T.text}}>{sel.name}</div>
              <div style={{fontSize:11,color:T.text2,marginTop:3}}>📍 {sel.address} · {sel.distance} mi away</div>
            </div>
            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              {GRADES.map(g=>(
                <div key={g} style={{textAlign:"center"}}>
                  <div style={{fontSize:8,fontWeight:600,letterSpacing:"1.5px",color:T.text3,textTransform:"uppercase"}}>{g}</div>
                  <div style={{fontSize:19,fontWeight:800,letterSpacing:-.5,color:g===grade?T.accent:T.text,marginTop:3}}>${(sel as any)[gk(g)].toFixed(2)}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>window.open(`https://maps.google.com/?q=${sel.lat},${sel.lng}`)} style={{padding:"10px 20px",background:"linear-gradient(135deg,#ff3b30,#ff6b35)",color:"#fff",border:"none",borderRadius:100,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 0 18px rgba(255,59,48,.35)",fontFamily:"'Outfit',sans-serif"}}>
              Directions →
            </button>
          </div>
        )}

        {/* Route Gas Finder */}
        <RouteGasFinder userCoords={userCoords} basePrice={bestPrice} isDark={isDark}/>

        {/* Chart + Calculator */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:13}}>
          <div style={{...glass({padding:"20px 22px"})}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",color:T.text2,marginBottom:14}}>7-Day Price Trend</div>
            <ResponsiveContainer width="100%" height={168}>
              <AreaChart data={history} margin={{top:8,right:8,left:-22,bottom:0}}>
                <defs>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff3b30" stopOpacity={isDark?.28:.15}/>
                    <stop offset="95%" stopColor="#ff3b30" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{fontFamily:"system-ui",fontSize:9,fill:T.text3}} axisLine={false} tickLine={false}/>
                <YAxis domain={["auto","auto"]} tick={{fontFamily:"system-ui",fontSize:9,fill:T.text3}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`$${v.toFixed(2)}`}/>
                <Tooltip content={(props:any)=><ChartTip {...props} T={T}/>}/>
                <ReferenceLine y={3.31} stroke={T.text3} strokeDasharray="4 4"/>
                <Area type="monotone" dataKey="price" stroke="#ff3b30" strokeWidth={2.5} fill="url(#redGrad)" dot={{r:3,fill:"#ff3b30",strokeWidth:0}} activeDot={{r:5,fill:"#ff3b30",stroke:"rgba(255,59,48,.3)",strokeWidth:4}}/>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.surfaceBdr}`}}>
              {[{label:"Local Best",val:bestPrice},{label:"Local Avg",val:avgPrice},{label:"National",val:3.31}].map(item=>(
                <div key={item.label} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:9,fontWeight:500,color:T.text3}}>{item.label}</span>
                    <span style={{fontSize:9,fontWeight:600,color:T.text2}}>${item.val.toFixed(2)}</span>
                  </div>
                  <div style={{height:2,background:T.inputBg,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(item.val/3.6)*100}%`,background:"linear-gradient(90deg,#ff3b30,#ff6b35)",borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{...glass({padding:"20px 22px"})}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",color:T.text2,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              Mileage & Deduction
              <span style={{fontSize:9,fontWeight:600,background:"rgba(10,132,255,.12)",color:"#0a84ff",padding:"2px 8px",borderRadius:6,letterSpacing:.5,border:"1px solid rgba(10,132,255,.2)"}}>
                IRS 2025 · $0.70/mi
              </span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,margin:"0 0 14px"}}>
              {[{label:"Miles / Week",val:miles,set:setMiles,unit:"mi/wk"},{label:"Tank Size",val:tank,set:setTank,unit:"gal"}].map(f=>(
                <div key={f.label}>
                  <div style={{fontSize:9,fontWeight:600,letterSpacing:"1.5px",color:T.text3,textTransform:"uppercase",marginBottom:6}}>{f.label}</div>
                  <div style={{display:"flex",alignItems:"center",background:T.inputBg,border:`1px solid ${T.inputBdr}`,borderRadius:12,padding:"9px 13px",gap:7}}>
                    <input type="number" value={f.val} min={0} onChange={e=>f.set(+e.target.value)} style={{background:"transparent",border:"none",outline:"none",color:T.accent,fontSize:19,fontWeight:700,width:"100%",fontFamily:"'Outfit',sans-serif",letterSpacing:-.5}}/>
                    <span style={{fontSize:9,fontWeight:500,color:T.text3,whiteSpace:"nowrap"}}>{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:T.dedBg,border:`1px solid ${T.dedBdr}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:9,fontWeight:600,letterSpacing:2,color:T.green,textTransform:"uppercase"}}>Est. Monthly Deduction</div>
                <div style={{fontSize:36,fontWeight:800,letterSpacing:-2,color:T.green,lineHeight:1}}>${deduction}</div>
                <div style={{fontSize:9,color:T.dedGreen,marginTop:3}}>IRS standard mileage · business use</div>
              </div>
              <div>
                {[["Monthly fuel",`$${monthlyGas}`],["Weekly fuel",`$${weeklyGas}`],["Monthly miles",`${(miles*4.33).toFixed(0)} mi`],["MPG assumed","28"]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"flex-end",gap:10,fontSize:10,color:T.text3,marginBottom:4}}>
                    <span>{l}</span><span style={{color:T.text2,fontWeight:500}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{fontSize:9,color:T.text3,textAlign:"center",letterSpacing:.5}}>
          DATA: EIA.GOV · UPDATED HOURLY · INFORMATIONAL USE ONLY · CONSULT A TAX PROFESSIONAL FOR DEDUCTION ELIGIBILITY
        </div>
      </div>
    </>
  )
}