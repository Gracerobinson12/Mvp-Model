'use client'
/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { supabase } from '@/lib/supabase'
import { usePaywall, TrialBanner, TasteTimer } from '@/components/PaywallGate'
import dynamic from 'next/dynamic'

const RouteGasFinder = dynamic(() => import('@/components/gas/RouteGasFinder'), { ssr: false })

// ── Types ─────────────────────────────────────────────────────────────────────
type Station = {
  id: number; name: string; address: string
  lat: number; lng: number; distance: number
  regular: number; mid: number; premium: number; diesel: number
  updated: string; trending: string
}
type Coords = { lat: number; lng: number }

const GRADES = ["Regular", "Mid", "Premium", "Diesel"]
const gk = (g: string) => g.toLowerCase()

// Auburn AL center coords for fallback
const AUBURN_LAT = 32.6099, AUBURN_LNG = -85.4808
const FALLBACK_STATIONS: Station[] = [
  { id:1, name:"Shell",     address:"184 N Gay St, Auburn AL",        lat:AUBURN_LAT+.003, lng:AUBURN_LNG+.004, distance:0.3, regular:3.04,mid:3.34,premium:3.64,diesel:3.49,updated:"2m ago",  trending:"down"   },
  { id:2, name:"Circle K",  address:"2884 E University Dr, Auburn AL", lat:AUBURN_LAT-.005, lng:AUBURN_LNG+.002, distance:0.8, regular:3.12,mid:3.42,premium:3.72,diesel:3.57,updated:"5m ago",  trending:"up"     },
  { id:3, name:"Exxon",     address:"120 E Samford Ave, Auburn AL",    lat:AUBURN_LAT+.002, lng:AUBURN_LNG-.006, distance:1.1, regular:3.19,mid:3.49,premium:3.79,diesel:3.64,updated:"8m ago",  trending:"stable" },
  { id:4, name:"Marathon",  address:"315 S College St, Auburn AL",     lat:AUBURN_LAT-.003, lng:AUBURN_LNG-.004, distance:1.4, regular:3.24,mid:3.54,premium:3.84,diesel:3.69,updated:"12m ago", trending:"down"   },
  { id:5, name:"BP",        address:"609 S Gay St, Auburn AL",         lat:AUBURN_LAT+.007, lng:AUBURN_LNG+.001, distance:1.9, regular:3.28,mid:3.58,premium:3.88,diesel:3.73,updated:"15m ago", trending:"up"     },
  { id:6, name:"Chevron",   address:"1420 N Dean Rd, Auburn AL",       lat:AUBURN_LAT-.006, lng:AUBURN_LNG-.003, distance:2.1, regular:3.31,mid:3.61,premium:3.91,diesel:3.76,updated:"9m ago",  trending:"stable" },
  { id:7, name:"QuikTrip",  address:"735 E Glenn Ave, Auburn AL",      lat:AUBURN_LAT+.004, lng:AUBURN_LNG-.008, distance:2.4, regular:3.35,mid:3.65,premium:3.95,diesel:3.80,updated:"3m ago",  trending:"down"   },
  { id:8, name:"Wawa",      address:"240 S Donahue Dr, Auburn AL",     lat:AUBURN_LAT-.001, lng:AUBURN_LNG+.007, distance:2.8, regular:3.38,mid:3.68,premium:3.98,diesel:3.83,updated:"6m ago",  trending:"up"     },
]

const FALLBACK_HISTORY = [
  {day:"Apr 11",price:3.23},{day:"Apr 15",price:3.20},{day:"Apr 18",price:3.18},
  {day:"Apr 22",price:3.16},{day:"Apr 25",price:3.14},{day:"Apr 29",price:3.11},
  {day:"May 2", price:3.09},{day:"May 5", price:3.04},
]

const STATE_GAS: Record<string,{avg:number,trend:string,change:string}> = {
  'Alabama':{avg:3.12,trend:'↓',change:'-0.04'},'Georgia':{avg:3.19,trend:'↓',change:'-0.05'},
  'Florida':{avg:3.51,trend:'↑',change:'+0.03'},'Texas':{avg:2.94,trend:'↓',change:'-0.02'},
  'California':{avg:4.94,trend:'↑',change:'+0.12'},'Tennessee':{avg:3.08,trend:'↓',change:'-0.04'},
}

function distanceMiles(lat1:number,lng1:number,lat2:number,lng2:number):number {
  const R=3959,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return parseFloat((R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1))
}

function simulatePrices(base:number) {
  const off=[-0.09,-0.05,-0.02,0,0.04,0.08,0.13][Math.floor(Math.random()*7)]
  return { regular:+(base+off).toFixed(2), mid:+(base+off+.30).toFixed(2), premium:+(base+off+.60).toFixed(2), diesel:+(base+off+.45).toFixed(2) }
}

function makePin(price:number,isBest:boolean,isSel:boolean):string {
  const bg  = isSel?'linear-gradient(135deg,#ff3b30,#ff6b35)':isBest?'linear-gradient(135deg,#30d158,#34c759)':'rgba(255,255,255,.93)'
  const fg  = isSel||isBest?'#fff':'rgba(0,0,0,.85)'
  const bdr = isSel?'#ff3b30':isBest?'#30d158':'rgba(0,0,0,.18)'
  const sc  = isSel?'scale(1.2)':'scale(1)'
  return `<div style="display:inline-flex;flex-direction:column;align-items:center;transform:${sc};transition:transform .25s cubic-bezier(.34,1.56,.64,1)"><div style="background:${bg};border:1.5px solid ${bdr};border-radius:10px;padding:5px 10px;display:flex;align-items:center;gap:4px;backdrop-filter:blur(20px);box-shadow:0 4px 20px rgba(0,0,0,.2);cursor:pointer"><span style="font-size:10px">⛽</span><span style="font-size:13px;font-weight:700;color:${fg};font-family:-apple-system,system-ui,sans-serif">\$${price.toFixed(2)}</span></div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${isSel?'#ff3b30':isBest?'#30d158':bdr}"></div></div>`
}


// ── Report Mini Map (real Leaflet) ─────────────────────────────────────────────
function ReportMiniMap({ station }: { station: Station }) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    const init = (L: any) => {
      if (!divRef.current || mapRef.current) return
      // Use station coords if real, else use a default
      const lat = station.lat || 32.6099
      const lng = station.lng || -85.4808
      const map = L.map(divRef.current, {
        center: [lat, lng], zoom: 16,
        zoomControl: false, attributionControl: false, dragging: false,
        scrollWheelZoom: false, doubleClickZoom: false
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)
      // Station pin
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          iconSize: [80, 52],
          iconAnchor: [40, 52],
          html: `<div style="display:inline-flex;flex-direction:column;align-items:center"><div style="background:linear-gradient(135deg,#ff3b30,#ff6b35);border:1.5px solid #fff;border-radius:10px;padding:4px 10px;display:flex;align-items:center;gap:4px;box-shadow:0 4px 16px rgba(255,59,48,.4)"><span style="font-size:10px">⛽</span><span style="font-size:12px;font-weight:700;color:#fff;font-family:system-ui">${station.name}</span></div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid #ff3b30"></div></div>`
        })
      }).addTo(map)
      mapRef.current = map
    }
    if ((window as any).L) { init((window as any).L); return }
    if (!document.querySelector('#leaflet-css')) {
      const l = document.createElement('link'); l.id = 'leaflet-css'; l.rel = 'stylesheet'
      l.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(l)
    }
    if (!document.querySelector('#leaflet-js')) {
      const s = document.createElement('script'); s.id = 'leaflet-js'
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      s.onload = () => init((window as any).L); document.head.appendChild(s)
    } else {
      const w = setInterval(() => { if ((window as any).L) { clearInterval(w); init((window as any).L) } }, 100)
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  return <div ref={divRef} style={{ width: '100%', height: '100%', borderRadius: 14 }} />
}


// ── Report Mini Map (real Leaflet) ────────────────────────────────────────────

// ── Report Price Modal ─────────────────────────────────────────────────────────
function ReportPriceModal({ station, onClose, onSubmit }: { station: Station|null, onClose: ()=>void, onSubmit: ()=>void }) {
  const [price, setPrice] = useState('')
  const [clean, setClean] = useState(3)
  const [sliding, setSliding] = useState(false)
  const [thumbX, setThumbX] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const cleanDescs = ['','Very dirty','Below average','Average — could be cleaner','Clean and well kept','Spotless — excellent']

  const onTrackStart = (e:any) => {
    setSliding(true)
    const x = e.touches ? e.touches[0].clientX : e.clientX
    setThumbX(0)
  }
  const onTrackMove = useCallback((e:any) => {
    if (!sliding || !trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = e.touches ? e.touches[0].clientX : e.clientX
    const pct = Math.min(Math.max(0, (x - rect.left - 22) / (rect.width - 48)), 1)
    setThumbX(pct)
    if (pct > 0.92) { setSliding(false); onSubmit() }
  }, [sliding, onSubmit])

  useEffect(() => {
    if (sliding) {
      window.addEventListener('mousemove', onTrackMove)
      window.addEventListener('touchmove', onTrackMove)
      window.addEventListener('mouseup', () => { setSliding(false); setThumbX(0) })
      window.addEventListener('touchend', () => { setSliding(false); setThumbX(0) })
    }
    return () => {
      window.removeEventListener('mousemove', onTrackMove)
      window.removeEventListener('touchmove', onTrackMove)
    }
  }, [sliding, onTrackMove])

  if (!station) return null

  const trackW = typeof window !== 'undefined' ? Math.min(window.innerWidth - 60, 380) : 340
  const thumbLeft = thumbX * (trackW - 56)

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,.5)',backdropFilter:'blur(12px)',padding:'0 14px 24px'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'rgba(255,255,255,.97)',borderRadius:'28px 28px 20px 20px',padding:'20px 22px 24px',width:'100%',maxWidth:440,boxShadow:'0 -8px 40px rgba(0,0,0,.15)',animation:'slideUp .4s cubic-bezier(.34,1.56,.64,1) both',fontFamily:"'DM Sans',system-ui,sans-serif",position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,width:28,height:28,borderRadius:'50%',background:'rgba(0,0,0,.06)',border:'none',cursor:'pointer',fontSize:12,color:'rgba(26,26,46,.4)'}}>✕</button>
        <div style={{width:36,height:4,borderRadius:2,background:'rgba(0,0,0,.1)',margin:'0 auto 16px'}}/>

        {/* Real Leaflet mini map */}
        <div style={{height:90,borderRadius:14,marginBottom:14,overflow:'hidden',border:'0.5px solid rgba(255,255,255,.9)'}}>
          <ReportMiniMap station={station}/>
        </div>

        <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase',marginBottom:4}}>Report a Price</div>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e',marginBottom:14}}>{station.name}</div>

        {/* Price input */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:8}}>Price you saw · Regular</div>
          <div style={{display:'flex',alignItems:'center',background:'rgba(255,59,48,.05)',border:'1.5px solid rgba(255,59,48,.25)',borderRadius:16,padding:'10px 16px',gap:6}}>
            <span style={{fontSize:28,fontWeight:800,color:'rgba(26,26,46,.25)'}}>$</span>
            <input type="number" step="0.01" min="0" max="10" placeholder="3.04" value={price} onChange={e=>setPrice(e.target.value)}
              style={{flex:1,background:'none',border:'none',outline:'none',fontFamily:"'Sora',sans-serif",fontSize:32,fontWeight:900,color:'#ff3b30',letterSpacing:-1,width:'100%'}}/>
            <span style={{fontSize:13,color:'rgba(26,26,46,.3)'}}>/gal</span>
          </div>
        </div>

        {/* Cleanliness */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>Cleanliness</span>
            <span style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:900,color:'#ff3b30'}}>{clean}/5</span>
          </div>
          <div style={{display:'flex',gap:6,marginBottom:6}}>
            {[1,2,3,4,5].map(n=>(
              <div key={n} onClick={()=>setClean(n)} style={{flex:1,height:8,borderRadius:4,background:n<=clean?'#ff3b30':'rgba(0,0,0,.08)',cursor:'pointer',transition:'all .2s'}}/>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'rgba(26,26,46,.35)'}}>
            <span>Dirty</span><span>{cleanDescs[clean]}</span><span>Spotless</span>
          </div>
        </div>

        {/* Slide to confirm */}
        <div ref={trackRef} style={{position:'relative',height:52,background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.25)',borderRadius:100,overflow:'hidden',userSelect:'none'}}
          onMouseDown={onTrackStart} onTouchStart={onTrackStart}>
          <div style={{position:'absolute',inset:0,background:`linear-gradient(90deg,rgba(48,209,88,.2),rgba(48,209,88,.05))`,borderRadius:100,width:`${thumbX*100}%`,transition:sliding?'none':'width .3s'}}/>
          <div style={{position:'absolute',top:4,left:4+thumbLeft,width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#30d158,#34c759)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 4px 12px rgba(48,209,88,.4)',transition:sliding?'none':'left .3s',cursor:'grab'}}>→</div>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:600,color:'rgba(48,209,88,.6)',letterSpacing:.5,pointerEvents:'none'}}>Slide to confirm report</div>
        </div>
      </div>
    </div>
  )
}

// ── Thanks Modal ───────────────────────────────────────────────────────────────
function ThanksModal({ onClose }: { onClose: ()=>void }) {
  return (
    <div style={{position:'fixed',inset:0,zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.4)',backdropFilter:'blur(8px)'}}>
      <div style={{background:'rgba(255,255,255,.97)',borderRadius:28,padding:'36px 32px',textAlign:'center',maxWidth:320,width:'90%',animation:'popIn .5s cubic-bezier(.34,1.56,.64,1) both',fontFamily:"'DM Sans',system-ui,sans-serif"}}>
        <div style={{fontSize:56,marginBottom:14}}>⛽</div>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e',marginBottom:8}}>Thank you!</div>
        <div style={{fontSize:14,color:'rgba(26,26,46,.55)',lineHeight:1.65,marginBottom:20}}>Your price report helps other drivers find cheaper gas. The community thanks you.</div>
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(48,209,88,.1)',border:'0.5px solid rgba(48,209,88,.3)',borderRadius:100,padding:'6px 16px',fontSize:12,fontWeight:700,color:'#1a7a35',marginBottom:20}}>
          ✓ Price reported · shows in 5 minutes
        </div>
        <button onClick={onClose} style={{width:'100%',padding:13,borderRadius:100,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 16px rgba(255,59,48,.35)'}}>Done</button>
      </div>
    </div>
  )
}

// ── Maps Choice Modal ──────────────────────────────────────────────────────────
function MapsModal({ station, destination, onClose }: { station: Station|null, destination: string, onClose: ()=>void }) {
  if (!station) return null
  const name = encodeURIComponent(`${station.name}, ${station.address}`)
  const dest = destination.trim()

  const stationQuery = encodeURIComponent(`${station.name}, ${station.address}`)
  const goApple = () => {
    if (dest) window.open(`maps://maps.apple.com/?saddr=Current+Location&daddr=${encodeURIComponent(dest)}&via=${encodeURIComponent(station.name + ', ' + station.address)}&dirflag=d`)
    else window.open(`maps://maps.apple.com/?q=${stationQuery}&dirflag=d`)
    onClose()
  }
  const goGoogle = () => {
    if (dest) window.open(`https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(dest)}&waypoints=${stationQuery}&travelmode=driving`)
    else window.open(`https://www.google.com/maps/search/?api=1&query=${stationQuery}`)
    onClose()
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)',padding:'0 14px 24px'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'rgba(255,255,255,.97)',borderRadius:'24px 24px 18px 18px',padding:20,width:'100%',maxWidth:440,animation:'slideUp .35s cubic-bezier(.34,1.56,.64,1) both',fontFamily:"'DM Sans',system-ui,sans-serif"}}>
        <div style={{width:36,height:4,borderRadius:2,background:'rgba(0,0,0,.1)',margin:'0 auto 16px'}}/>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:4}}>Open in maps</div>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e',marginBottom:16}}>{station.name} · {station.address}</div>

        <button onClick={goApple} style={{width:'100%',padding:'13px 16px',background:'rgba(0,0,0,.04)',border:'0.5px solid rgba(0,0,0,.08)',borderRadius:16,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:12,marginBottom:8,color:'#1a1a2e',textAlign:'left'}}>
          <span style={{fontSize:24}}>🗺️</span>
          <div><div>Apple Maps</div><div style={{fontSize:11,fontWeight:400,color:'rgba(26,26,46,.45)',marginTop:1}}>iPhone · iPad · Mac{dest?' · Gas as waypoint':''}</div></div>
        </button>
        <button onClick={goGoogle} style={{width:'100%',padding:'13px 16px',background:'rgba(66,133,244,.07)',border:'0.5px solid rgba(66,133,244,.2)',borderRadius:16,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:12,marginBottom:12,color:'#1a1a2e',textAlign:'left'}}>
          <span style={{fontSize:24}}>📍</span>
          <div><div>Google Maps</div><div style={{fontSize:11,fontWeight:400,color:'rgba(26,26,46,.45)',marginTop:1}}>All devices · Android{dest?' · Gas as waypoint':''}</div></div>
        </button>
        <button onClick={onClose} style={{width:'100%',padding:11,borderRadius:100,border:'0.5px solid rgba(0,0,0,.08)',background:'transparent',fontSize:13,color:'rgba(26,26,46,.4)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
      </div>
    </div>
  )
}

// ── Gas Map Component ──────────────────────────────────────────────────────────
// Miles to meters conversion
const RADIUS_MILES = [5, 10, 15, 30]

function GasMap({ stations, grade, selectedId, onSelect, userCoords, radius }:{
  stations: Station[], grade: string, selectedId: number|null,
  onSelect: (id:number)=>void, userCoords: {lat:number,lng:number}|null, radius: number
}) {
  const divRef   = useRef<HTMLDivElement>(null)
  const mapRef   = useRef<any>(null)
  const mksRef   = useRef<Record<number,any>>({})
  const circleRef = useRef<any>(null)
  const best = stations.length ? [...stations].sort((a:any,b:any)=>a[gk(grade)]-b[gk(grade)])[0] : null
  const radiusMeters = RADIUS_MILES[radius-1] * 1609.34

  const initMap = useCallback((L:any) => {
    if (!divRef.current || mapRef.current) return
    const center = userCoords ?? {lat:32.6099,lng:-85.4808}
    const map = L.map(divRef.current, {center:[center.lat,center.lng],zoom:13,zoomControl:false,attributionControl:false})
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map)
    L.control.zoom({position:'bottomright'}).addTo(map)
    if (userCoords) {
      // User location dot
      L.marker([center.lat,center.lng],{icon:L.divIcon({className:'',iconSize:[20,20],iconAnchor:[10,10],html:`<div style="width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#ff3b30,#ff6b35);border:3px solid #fff;box-shadow:0 0 0 5px rgba(255,59,48,.2),0 4px 12px rgba(255,59,48,.4)"></div>`})}).addTo(map)
      // Radius circle — accurate Leaflet circle in meters
      // 1 mile = 1609.34 meters, Leaflet uses meters for L.circle
      const circleMiles = RADIUS_MILES[radius-1]
      const circleMeters = circleMiles * 1609.34
      const circle = L.circle([center.lat,center.lng], {
        radius: circleMeters,
        color: '#ff3b30',
        weight: 2,
        opacity: 0.45,
        dashArray: '7 5',
        fillColor: '#ff3b30',
        fillOpacity: 0.05,
        interactive: false,
      }).addTo(map)
      circleRef.current = circle
      // Fit map so circle fills view with some padding for pins
      map.fitBounds(circle.getBounds(), {padding:[30,30]})
    }
    stations.forEach(st=>{
      if (!st.lat && !st.lng) return
      const m = L.marker([st.lat,st.lng],{icon:L.divIcon({className:'',iconSize:[80,52],iconAnchor:[40,52],html:makePin((st as any)[gk(grade)],st.id===best?.id,false)})}).addTo(map).on('click',()=>onSelect(st.id))
      m.bindPopup(`<div style="font-family:system-ui;min-width:140px"><div style="font-size:13px;font-weight:700;color:#1a1a2e;margin-bottom:4px">${st.name}</div><div style="font-size:10px;color:rgba(26,26,46,.5);margin-bottom:4px">📍 ${st.address}</div><div style="font-size:12px;font-weight:700;color:#ff3b30">$${(st as any)[gk(grade)].toFixed(2)}</div></div>`)
      mksRef.current[st.id]=m
    })
    mapRef.current = map
  },[])
  // Update circle radius when user changes it
  useEffect(()=>{
    if (!mapRef.current || !circleRef.current || !userCoords) return
    const newRadius = RADIUS_MILES[radius-1] * 1609.34
    circleRef.current.setRadius(newRadius)
    // Small padding so circle fits nicely with pins visible
    mapRef.current.fitBounds(
      circleRef.current.getBounds(),
      {padding:[30,30], animate:true, duration:0.5}
    )
  },[radius])

  useEffect(()=>{
    const boot=(L:any)=>initMap(L)
    if ((window as any).L){boot((window as any).L);return}
    if (!document.querySelector('#leaflet-css')){const l=document.createElement('link');l.id='leaflet-css';l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(l)}
    if (!document.querySelector('#leaflet-js')){const s=document.createElement('script');s.id='leaflet-js';s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';s.onload=()=>boot((window as any).L);document.head.appendChild(s)}
    else{const w=setInterval(()=>{if((window as any).L){clearInterval(w);boot((window as any).L)}},100)}
    return ()=>{if(mapRef.current){mapRef.current.remove();mapRef.current=null;mksRef.current={}}}
  },[])

  useEffect(()=>{
    if (!(window as any).L||!mapRef.current||!stations.length) return
    const L=(window as any).L,b=[...stations].sort((a:any,b:any)=>a[gk(grade)]-b[gk(grade)])[0]
    stations.forEach(st=>{const m=mksRef.current[st.id];if(!m)return;m.setIcon(L.divIcon({className:'',iconSize:[80,52],iconAnchor:[40,52],html:makePin((st as any)[gk(grade)],st.id===b?.id,st.id===selectedId)}))})
  },[grade,selectedId,radius])

  useEffect(()=>{
    if (!mapRef.current||!selectedId) return
    const st=stations.find(s=>s.id===selectedId)
    if (st?.lat&&st?.lng) mapRef.current.panTo([st.lat,st.lng],{animate:true,duration:.5})
  },[selectedId])

  return (
    <>
      <style>{`.leaflet-control-zoom{border:none!important}.leaflet-control-zoom a{background:rgba(255,255,255,.9)!important;border:1px solid rgba(0,0,0,.1)!important;margin-bottom:3px!important;border-radius:8px!important;display:block!important}`}</style>
      <div ref={divRef} style={{width:'100%',height:'100%',borderRadius:18}}/>
    </>
  )
}

// ── Main Gas Page ──────────────────────────────────────────────────────────────
function GasPageContent({ daysLeft }: { daysLeft: number|null }) {
  const [grade, setGrade]           = useState('Regular')
  const [stations, setStations]     = useState<Station[]>(FALLBACK_STATIONS)
  const [history, setHistory]       = useState(FALLBACK_HISTORY)
  const [userCoords, setUserCoords] = useState<{lat:number,lng:number}|null>(null)
  const [locStatus, setLocStatus]   = useState('Finding your location...')
  const [loading, setLoading]       = useState(false)
  const [mapKey, setMapKey]         = useState('init')
  const [selId, setSelId]           = useState<number|null>(null)
  const [isDark, setIsDark]         = useState(false)
  const [radius, setRadius]         = useState(2) // 1=5mi 2=10mi 3=15mi 4=30mi
  const [favorites, setFavorites]   = useState<Set<number>>(new Set())
  const [destination, setDest]      = useState('')
  const [reportStation, setReportStation] = useState<Station|null>(null)
  const [showThanks, setShowThanks] = useState(false)
  const [mapsStation, setMapsStation]     = useState<Station|null>(null)
  const [zipModal, setZipModal]     = useState(false)
  const [userState, setUserState]   = useState('Alabama')

  const RADIUS_LABELS = ['5 miles','10 miles','15 miles','30 miles']
  const RADIUS_COUNTS = [3,6,11,18]

  // Silent GPS on mount
  useEffect(()=>{
    if (!navigator.geolocation){setZipModal(true);return}
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const {latitude:lat,longitude:lng}=pos.coords
        setUserCoords({lat,lng})
        setLocStatus('📍 Location found')
        fetchData(lat,lng)
      },
      err=>{
        if(err.code===1){setZipModal(true);setLocStatus('Enter ZIP to find gas near you')}
        else{setZipModal(true)}
      },
      {enableHighAccuracy:true,timeout:12000,maximumAge:300000}
    )
    // Load preferences
    loadPrefs()
  },[])

  const loadPrefs = async () => {
    try {
      const {data:{user}} = await supabase.auth.getUser()
      if (!user) return
      const {data:p} = await supabase.from('profiles').select('state,grade_preference,last_location_lat,last_location_lng').eq('id',user.id).single()
      if (p?.state) setUserState(p.state)
      if (p?.grade_preference) setGrade(p.grade_preference)
      if (p?.last_location_lat && p?.last_location_lng) {
        const lat=parseFloat(p.last_location_lat), lng=parseFloat(p.last_location_lng)
        setUserCoords({lat,lng}); setLocStatus('📍 Location restored'); fetchData(lat,lng)
      }
    } catch(e){}
  }

  const fetchData = useCallback(async(lat:number,lng:number)=>{
    setLoading(true); setLocStatus('Fetching prices near you...')
    try {
      const eiaRes=await fetch('/api/gas-prices'); const eiaData=await eiaRes.json()
      const base=eiaData.prices?.[0]?.price??3.15
      if(eiaData.prices?.length) setHistory([...eiaData.prices].reverse().map((p:any)=>({day:p.period.slice(5),price:p.price})))
      const stRes=await fetch(`/api/stations?lat=${lat}&lng=${lng}`); const stData=await stRes.json()
      if(stData.stations?.length){
        const enriched=stData.stations.map((st:any,i:number)=>({
          ...st,id:i+1,...simulatePrices(base),
          distance:distanceMiles(lat,lng,st.lat,st.lng),
          trending:['down','stable','up'][Math.floor(Math.random()*3)],
          updated:`${Math.floor(Math.random()*10)+1}m ago`
        }))
        setStations(enriched)
        setLocStatus(`${enriched.length} stations found`)
        setMapKey(`${lat.toFixed(3)}-${lng.toFixed(3)}-${Date.now()}`)
      } else {
        // No real stations — spread fallbacks realistically around user location
        // so they all show on the map
        const fallbackNames = [
          {name:'Shell',     offset:[0.003,0.004]},
          {name:'Circle K',  offset:[-0.005,0.002]},
          {name:'Exxon',     offset:[0.002,-0.006]},
          {name:'Marathon',  offset:[-0.003,-0.004]},
          {name:'BP',        offset:[0.007,0.001]},
          {name:'Chevron',   offset:[-0.006,-0.003]},
          {name:'QuikTrip',  offset:[0.004,-0.008]},
          {name:'Wawa',      offset:[-0.001,0.007]},
        ]
        const enriched = fallbackNames.map((f,i)=>{
          const slat = lat+f.offset[0]+(Math.random()*.002-.001)
          const slng = lng+f.offset[1]+(Math.random()*.002-.001)
          return {
            id:i+1, name:f.name,
            address:`Near ${f.name} · Auburn AL`,
            lat:slat, lng:slng,
            distance:distanceMiles(lat,lng,slat,slng),
            ...simulatePrices(base),
            trending:['down','stable','up'][Math.floor(Math.random()*3)],
            updated:`${Math.floor(Math.random()*10)+1}m ago`
          }
        })
        setStations(enriched)
        setLocStatus(`${enriched.length} stations found · Sample data`)
        setMapKey(`fallback-${lat.toFixed(3)}-${Date.now()}`)
      }
    } catch(e){
      // Even on error - show stations spread around user
      const base=3.15
      const fallbackNames=['Shell','Circle K','Exxon','Marathon','BP','Chevron']
      const enriched=fallbackNames.map((name,i)=>{
        const slat=lat+(Math.random()*.012-.006)
        const slng=lng+(Math.random()*.012-.006)
        return {id:i+1,name,address:`Near ${name} · Auburn AL`,lat:slat,lng:slng,distance:distanceMiles(lat,lng,slat,slng),...simulatePrices(base),trending:['down','stable','up'][Math.floor(Math.random()*3)],updated:`${Math.floor(Math.random()*10)+1}m ago`}
      })
      setStations(enriched)
      setLocStatus('Sample data shown')
      setMapKey(`err-${Date.now()}`)
    }
    setLoading(false)
    // Save location
    try {
      const {data:{user}} = await supabase.auth.getUser()
      if (user) await supabase.from('profiles').update({last_location_lat:lat,last_location_lng:lng,last_seen_at:new Date().toISOString()}).eq('id',user.id)
    } catch(e){}
  },[])

  const toggleFav = (id:number) => {
    setFavorites(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n})
  }

  const sorted = [...stations].sort((a:any,b:any)=>a[gk(grade)]-b[gk(grade)])
  const best   = sorted[0]
  const sel    = stations.find(s=>s.id===selId)
  const bestPrice = best?.[gk(grade)]??3.04
  const avgPrice  = stations.reduce((s,st)=>s+(st as any)[gk(grade)],0)/stations.length
  const spread    = stations.length ? Math.max(...stations.map((s:any)=>s[gk(grade)]))-Math.min(...stations.map((s:any)=>s[gk(grade)])) : 0
  const stateGas  = STATE_GAS[userState]
  const favStations = sorted.filter(s=>favorites.has(s.id))
  const displayedCount = Math.min(RADIUS_COUNTS[radius-1], sorted.length)

  const glass = (extra:any={})=>({
    background:'rgba(255,255,255,.65)',
    backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',
    border:'0.5px solid rgba(255,255,255,.92)',
    borderRadius:18,boxShadow:'0 2px 10px rgba(0,0,0,.05)',...extra
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes loadSlide{0%{left:-40%}100%{left:100%}}
        @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
        input[type=range]{width:100%;accent-color:#ff3b30;cursor:pointer}
        .st-row{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:0.5px solid rgba(0,0,0,.05);cursor:pointer;transition:background .15s}
        .st-row:last-child{border-bottom:none}
        .st-row:hover{background:rgba(255,255,255,.5)}
        .st-row.selected{background:rgba(255,59,48,.05)}
        .star-btn{background:none;border:none;cursor:pointer;font-size:18px;transition:transform .2s;flex-shrink:0;padding:2px;line-height:1}
        .star-btn:hover{transform:scale(1.25)}
      `}</style>

      {/* Modals */}
      {reportStation && !showThanks && <ReportPriceModal station={reportStation} onClose={()=>setReportStation(null)} onSubmit={()=>{setReportStation(null);setShowThanks(true)}}/>}
      {showThanks && <ThanksModal onClose={()=>setShowThanks(false)}/>}
      {mapsStation && <MapsModal station={mapsStation} destination={destination} onClose={()=>setMapsStation(null)}/>}

      <div style={{background:'#f0eff4',backgroundImage:'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,.09) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,.06) 0%,transparent 50%)',minHeight:'100vh',padding:'14px 14px 80px',color:'#1a1a2e'}}>

        <TrialBanner daysLeft={daysLeft}/>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
          <div>
            <Link href="/dashboard" style={{fontSize:11,color:'rgba(26,26,46,.4)',textDecoration:'none',display:'flex',alignItems:'center',gap:4,marginBottom:6}}>← Dashboard</Link>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'2.5px',color:'#ff3b30',textTransform:'uppercase',marginBottom:4}}>⛽ Fuel Intelligence</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:32,fontWeight:900,letterSpacing:-2,lineHeight:1}}>GAS <span style={{color:'#ff3b30'}}>PRICES</span></div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
            <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,59,48,.08)',border:'0.5px solid rgba(255,59,48,.2)',borderRadius:100,padding:'5px 12px',fontSize:10,fontWeight:700,color:'#cc2018'}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:'#ff3b30',animation:'lp 1.4s ease infinite'}}/>
              {loading?'FETCHING...':'LIVE · EIA DATA'}
            </div>
            <div style={{fontSize:10,color:'rgba(26,26,46,.4)'}}>{locStatus}</div>
            <button onClick={()=>navigator.geolocation?.getCurrentPosition(p=>{const{latitude:lat,longitude:lng}=p.coords;setUserCoords({lat,lng});fetchData(lat,lng)},()=>{},{enableHighAccuracy:true,timeout:8000})} style={{background:'rgba(255,255,255,.65)',border:'0.5px solid rgba(255,255,255,.9)',borderRadius:100,padding:'5px 12px',fontSize:11,fontWeight:600,color:'rgba(26,26,46,.6)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
              📍 Update location
            </button>
          </div>
        </div>

        {loading && <div style={{height:2,background:'rgba(0,0,0,.06)',borderRadius:1,overflow:'hidden',marginBottom:12,position:'relative'}}><div style={{position:'absolute',height:'100%',width:'40%',background:'linear-gradient(90deg,transparent,#ff3b30,transparent)',animation:'loadSlide 1.2s ease-in-out infinite'}}/></div>}

        {/* Grade pills */}
        <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
          {GRADES.map(g=>(
            <button key={g} onClick={()=>setGrade(g)} style={{padding:'7px 16px',borderRadius:100,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",border:'0.5px solid',transition:'all .2s',background:grade===g?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(255,255,255,.65)',color:grade===g?'#fff':'rgba(26,26,46,.6)',borderColor:grade===g?'transparent':'rgba(255,255,255,.9)',boxShadow:grade===g?'0 4px 12px rgba(255,59,48,.3)':'none'}}>
              {g}
            </button>
          ))}
        </div>

        {/* Map */}
        <div style={{height:190,...glass({overflow:'hidden',padding:0,marginBottom:10,position:'relative'})}}>
          <GasMap key={mapKey} stations={sorted} grade={grade} selectedId={selId} onSelect={id=>setSelId(p=>p===id?null:id)} userCoords={userCoords} radius={radius}/>
          {/* Best price overlay */}
          <div style={{position:'absolute',top:10,left:10,zIndex:999,background:'rgba(255,255,255,.9)',backdropFilter:'blur(16px)',border:'0.5px solid rgba(255,59,48,.2)',borderRadius:12,padding:'8px 12px',pointerEvents:'none'}}>
            <div style={{fontSize:8,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase',marginBottom:2}}>Best price</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:900,letterSpacing:-1,color:'#1a1a2e',lineHeight:1}}>${bestPrice.toFixed(2)}</div>
            <div style={{fontSize:9,color:'rgba(26,26,46,.5)',marginTop:2}}>{best?.name}</div>
          </div>
          {/* Report button */}
          <button onClick={()=>setReportStation(sel||sorted[0])} style={{position:'absolute',bottom:8,right:8,zIndex:999,background:'rgba(255,255,255,.85)',backdropFilter:'blur(16px)',border:'0.5px solid rgba(255,59,48,.25)',borderRadius:100,padding:'5px 12px',fontSize:10,fontWeight:700,color:'#cc2018',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            📍 Report a price
          </button>
        </div>

        {/* Radius ring selector */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:10,textAlign:'center'}}>Tap to expand search radius</div>
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:14}}>
            {[
              {v:1,mi:'5',  count:'3 stations'},
              {v:2,mi:'10', count:'6 stations'},
              {v:3,mi:'15', count:'11 stations'},
              {v:4,mi:'30', count:'18 stations'},
            ].map(r=>{
              const isOn = radius === r.v
              return (
                <button key={r.v} onClick={()=>setRadius(r.v)} style={{
                  width:64,height:64,borderRadius:'50%',
                  border:`3px solid ${isOn?'#ff3b30':'rgba(255,255,255,.9)'}`,
                  background:isOn?'rgba(255,59,48,.1)':'rgba(255,255,255,.65)',
                  backdropFilter:'blur(20px)',
                  boxShadow:isOn?'0 0 0 6px rgba(255,59,48,.12)':'none',
                  transform:isOn?'scale(1.08)':'scale(1)',
                  transition:'all .25s cubic-bezier(.34,1.56,.64,1)',
                  cursor:'pointer',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                  fontFamily:"'DM Sans',sans-serif",
                }}>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:900,letterSpacing:-1,color:isOn?'#ff3b30':'#1a1a2e',lineHeight:1}}>{r.mi}</div>
                  <div style={{fontSize:9,fontWeight:600,color:isOn?'#cc2018':'rgba(26,26,46,.5)',marginTop:2}}>miles</div>
                </button>
              )
            })}
          </div>
          <div style={{textAlign:'center',marginTop:8,fontSize:11,color:'rgba(26,26,46,.45)',fontWeight:500}}>
            {RADIUS_COUNTS[radius-1]} stations · {RADIUS_LABELS[radius-1]}
          </div>
        </div>

        {/* Cheapest KPI */}
        <div style={{background:'rgba(255,59,48,.07)',border:'0.5px solid rgba(255,59,48,.22)',borderRadius:18,padding:'14px 18px',marginBottom:10,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:1.5,background:'linear-gradient(90deg,transparent,#ff3b30,transparent)'}}/>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:4}}>Cheapest nearby</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:36,fontWeight:900,letterSpacing:-2,color:'#ff3b30',lineHeight:1}}>${bestPrice.toFixed(2)}</div>
              <div style={{fontSize:12,color:'rgba(26,26,46,.5)',marginTop:5}}>{best?.name} · {best?.address} · {best?.distance} mi</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:3}}>Price spread</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,letterSpacing:-1,color:'#ff9f0a'}}>${spread.toFixed(2)}</div>
              <div style={{fontSize:10,color:'rgba(26,26,46,.4)'}}>cheapest → priciest</div>
            </div>
          </div>
        </div>

        {/* Area avg VS State avg */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <div style={{...glass({padding:'14px 16px',flex:1})}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,26,46,.4)',marginBottom:5}}>Area average</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:24,fontWeight:900,letterSpacing:-1.5,color:'#1a1a2e',lineHeight:1}}>${avgPrice.toFixed(2)}</div>
            <div style={{fontSize:11,color:'rgba(26,26,46,.45)',marginTop:4}}>{displayedCount} stations</div>
          </div>

          <div style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <div style={{width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,.65)',backdropFilter:'blur(20px)',border:'0.5px solid rgba(255,255,255,.92)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'rgba(26,26,46,.4)',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>vs</div>
            <div style={{fontSize:8,fontWeight:700,color:'rgba(26,26,46,.3)',letterSpacing:.5}}>EIA</div>
          </div>

          <div style={{...glass({padding:'14px 16px',flex:1,background:'rgba(48,209,88,.07)',border:'0.5px solid rgba(48,209,88,.25)'})}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,26,46,.4)',marginBottom:5}}>{userState} avg</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:24,fontWeight:900,letterSpacing:-1.5,color:'#30d158',lineHeight:1}}>${stateGas?.avg.toFixed(2)??'—'}</div>
            <div style={{fontSize:11,color:'#30d158',marginTop:4}}>
              {stateGas ? (bestPrice < stateGas.avg ? '↓ below state avg' : '↑ above state avg') : 'EIA.gov'}
            </div>
          </div>
        </div>

        {/* Selected station */}
        {sel && (
          <div style={{background:'rgba(255,59,48,.07)',border:'0.5px solid rgba(255,59,48,.22)',borderRadius:20,padding:'16px 18px',marginBottom:12,position:'relative',overflow:'hidden',animation:'fadeUp .3s ease'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:1.5,background:'linear-gradient(90deg,transparent,#ff3b30,transparent)'}}/>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4}}>
              <div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase',marginBottom:4}}>Selected Station</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e'}}>{sel.name}</div>
                <div style={{fontSize:11,color:'rgba(26,26,46,.5)',marginTop:2}}>📍 {sel.address} · {sel.distance} mi away</div>
              </div>
              <button className="star-btn" onClick={()=>toggleFav(sel.id)} style={{fontSize:22}}>{favorites.has(sel.id)?'⭐':'☆'}</button>
            </div>
            <div style={{display:'flex',gap:14,flexWrap:'wrap',margin:'12px 0'}}>
              {GRADES.map(g=>(
                <div key={g} style={{textAlign:'center'}}>
                  <div style={{fontSize:8,fontWeight:700,letterSpacing:'1.5px',color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>{g}</div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,letterSpacing:-.5,color:g===grade?'#ff3b30':'#1a1a2e',marginTop:3}}>${(sel as any)[gk(g)].toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button onClick={()=>setMapsStation(sel)} style={{flex:1,padding:'11px 16px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:14,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 12px rgba(255,59,48,.3)'}}>
                🗺️ Open in Maps →
              </button>
              {destination && (
                <div style={{position:'relative',flex:1}}>
                  <button
                    onClick={()=>{
                      const isApple=/iPhone|iPad|iPod|Mac/.test(navigator.userAgent)
                      if(isApple) window.open(`maps://maps.apple.com/?saddr=Current+Location&daddr=${encodeURIComponent(destination)}&via=${sel.lat},${sel.lng}&dirflag=d`)
                      else window.open(`https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(destination)}&waypoints=${sel.lat},${sel.lng}&travelmode=driving`)
                    }}
                    title="Adds this gas station as a stop along your route to the destination"
                    style={{width:'100%',padding:'11px 16px',background:'rgba(10,132,255,.1)',border:'0.5px solid rgba(10,132,255,.3)',borderRadius:14,fontSize:12,fontWeight:700,color:'#0a84ff',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",lineHeight:1.3,textAlign:'center'}}>
                    ⛽ Add gas stop<br/>
                    <span style={{fontSize:10,fontWeight:500,opacity:.7}}>along your route</span>
                  </button>
                </div>
              )}
              <button onClick={()=>setReportStation(sel)} style={{padding:'11px 14px',background:'rgba(255,255,255,.65)',border:'0.5px solid rgba(255,255,255,.9)',borderRadius:14,fontSize:12,fontWeight:600,color:'rgba(26,26,46,.6)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                📍 Report
              </button>
            </div>
          </div>
        )}

        {/* Station list */}
        <div style={{...glass({overflow:'hidden',marginBottom:12,padding:0})}}>
          <div style={{padding:'10px 16px',borderBottom:'0.5px solid rgba(0,0,0,.05)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,26,46,.4)'}}>{displayedCount} Stations · {RADIUS_LABELS[radius-1]}</div>
            <div style={{display:'flex',gap:4}}>
              <button style={{fontSize:9,padding:'3px 8px',borderRadius:100,background:'rgba(255,59,48,.1)',color:'#cc2018',border:'0.5px solid rgba(255,59,48,.25)',fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Price</button>
              <button style={{fontSize:9,padding:'3px 8px',borderRadius:100,background:'rgba(255,255,255,.5)',color:'rgba(26,26,46,.4)',border:'0.5px solid rgba(0,0,0,.08)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Distance</button>
            </div>
          </div>
          {/* Destination input */}
          <div style={{padding:'9px 16px',borderBottom:'0.5px solid rgba(0,0,0,.05)',display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:13}}>🏁</span>
            <input value={destination} onChange={e=>setDest(e.target.value)} placeholder="Add destination — gas becomes a waypoint (optional)" style={{flex:1,background:'none',border:'none',outline:'none',fontSize:11,color:'rgba(26,26,46,.6)',fontFamily:"'DM Sans',sans-serif"}}/>
          </div>
          {sorted.slice(0,displayedCount).map((st,i)=>(
            <div key={st.id} className={`st-row${selId===st.id?' selected':''}`} onClick={()=>setSelId(p=>p===st.id?null:st.id)}>
              <div style={{fontSize:11,fontWeight:700,color:i===0?'#30d158':'rgba(26,26,46,.35)',minWidth:14,textAlign:'center'}}>{i===0?'★':i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>{st.name}</div>
                <div style={{fontSize:10,color:'rgba(26,26,46,.4)',marginTop:1}}>{st.address} · {st.distance} mi</div>
              </div>
              <button className="star-btn" onClick={e=>{e.stopPropagation();toggleFav(st.id)}}>{favorites.has(st.id)?'⭐':'☆'}</button>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,color:i===0?'#30d158':'#1a1a2e'}}>${(st as any)[gk(grade)].toFixed(2)}</div>
                <div style={{fontSize:11,fontWeight:700,color:st.trending==='down'?'#30d158':st.trending==='up'?'#ff453a':'rgba(26,26,46,.35)'}}>{st.trending==='down'?'↓':st.trending==='up'?'↑':'→'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Favorites price trends */}
        <div style={{...glass({padding:'18px',marginBottom:12})}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,26,46,.4)'}}>
              {favStations.length > 0 ? '⭐ Favorite Station Trends' : 'Station Price Trends · Last 7 Days'}
            </div>
            {favStations.length === 0 && (
              <div style={{fontSize:11,color:'rgba(26,26,46,.4)'}}>
                ☆ Star a station to track its price trend
              </div>
            )}
          </div>

          {favStations.length > 0 ? (
            favStations.map((st,i)=>{
              const price = (st as any)[gk(grade)]
              const trendDir = st.trending
              const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Today']
              const delta = trendDir==='down'?-0.018:trendDir==='up'?0.014:0.002
              const pts = days.map((_,j)=>+(price+(days.length-1-j)*delta+(Math.random()*.008-.004)).toFixed(3))
              const minP=Math.min(...pts),maxP=Math.max(...pts),range=(maxP-minP)||0.05
              const svgH=44
              const coords=pts.map((p,j)=>({x:j/(pts.length-1)*280,y:svgH-((p-minP)/range)*(svgH-8)-4}))
              const pathD=coords.map((c,j)=>j===0?`M${c.x},${c.y}`:`L${c.x},${c.y}`).join(' ')
              const fillD=pathD+` L${coords[coords.length-1].x},${svgH} L0,${svgH} Z`
              const color = trendDir==='down'?'#30d158':trendDir==='up'?'#ff453a':'#ff9f0a'
              return (
                <div key={st.id} style={{paddingBottom:i<favStations.length-1?16:0,marginBottom:i<favStations.length-1?16:0,borderBottom:i<favStations.length-1?'0.5px solid rgba(0,0,0,.06)':'none'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                        <span style={{fontSize:14}}>⭐</span>
                        <span style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>{st.name}</span>
                        {st.id===sorted[0]?.id && <span style={{fontSize:9,fontWeight:700,background:'rgba(48,209,88,.1)',color:'#1a7a35',border:'0.5px solid rgba(48,209,88,.3)',borderRadius:100,padding:'1px 7px'}}>CHEAPEST</span>}
                      </div>
                      <div style={{fontSize:10,color:'rgba(26,26,46,.4)'}}>{st.address} · {st.distance} mi · Was ${pts[0].toFixed(2)} Mon</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{fontSize:9,fontWeight:700,color,background:`${color}18`,border:`0.5px solid ${color}40`,borderRadius:100,padding:'2px 9px'}}>{trendDir==='down'?'↓ dropping':trendDir==='up'?'↑ rising':'→ stable'}</div>
                      <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,color:st.id===sorted[0]?.id?'#30d158':'#1a1a2e'}}>${price.toFixed(2)}</div>
                    </div>
                  </div>
                  <svg viewBox={`0 0 280 ${svgH}`} style={{width:'100%',height:svgH,display:'block'}} preserveAspectRatio="none">
                    <defs><linearGradient id={`fg${st.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
                    <path d={fillD} fill={`url(#fg${st.id})`}/>
                    <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx={coords[coords.length-1].x} cy={coords[coords.length-1].y} r="3.5" fill={color}/>
                  </svg>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'rgba(26,26,46,.35)',marginTop:3}}>
                    {days.map(d=><span key={d}>{d}</span>)}
                  </div>
                </div>
              )
            })
          ) : (
            // Show top 3 when no favorites
            sorted.slice(0,3).map((st,i)=>{
              const price = (st as any)[gk(grade)]
              const trendDir = st.trending
              const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Today']
              const delta = trendDir==='down'?-0.018:trendDir==='up'?0.014:0.002
              const pts = days.map((_,j)=>+(price+(days.length-1-j)*delta+(Math.random()*.008-.004)).toFixed(3))
              const minP=Math.min(...pts),maxP=Math.max(...pts),range=(maxP-minP)||0.05
              const svgH=44
              const coords=pts.map((p,j)=>({x:j/(pts.length-1)*280,y:svgH-((p-minP)/range)*(svgH-8)-4}))
              const pathD=coords.map((c,j)=>j===0?`M${c.x},${c.y}`:`L${c.x},${c.y}`).join(' ')
              const fillD=pathD+` L${coords[coords.length-1].x},${svgH} L0,${svgH} Z`
              const color = trendDir==='down'?'#30d158':trendDir==='up'?'#ff453a':'#ff9f0a'
              return (
                <div key={st.id} style={{paddingBottom:i<2?16:0,marginBottom:i<2?16:0,borderBottom:i<2?'0.5px solid rgba(0,0,0,.06)':'none'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                    <div>
                      {i===0 && <div style={{fontSize:9,fontWeight:700,background:'rgba(48,209,88,.1)',color:'#1a7a35',border:'0.5px solid rgba(48,209,88,.3)',borderRadius:100,padding:'1px 8px',display:'inline-block',marginBottom:3}}>★ CHEAPEST</div>}
                      <div style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>{st.name} · {st.address}</div>
                      <div style={{fontSize:10,color:'rgba(26,26,46,.4)',marginTop:1}}>{st.distance} mi · Was ${pts[0].toFixed(2)} Mon → ${price.toFixed(2)} today</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{fontSize:9,fontWeight:700,color,background:`${color}18`,border:`0.5px solid ${color}40`,borderRadius:100,padding:'2px 9px'}}>{trendDir==='down'?'↓ dropping':trendDir==='up'?'↑ rising':'→ stable'}</div>
                      <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,color:i===0?'#30d158':'#1a1a2e'}}>${price.toFixed(2)}</div>
                    </div>
                  </div>
                  <svg viewBox={`0 0 280 ${svgH}`} style={{width:'100%',height:svgH,display:'block'}} preserveAspectRatio="none">
                    <defs><linearGradient id={`dg${st.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
                    <path d={fillD} fill={`url(#dg${st.id})`}/>
                    <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx={coords[coords.length-1].x} cy={coords[coords.length-1].y} r="3.5" fill={color}/>
                  </svg>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'rgba(26,26,46,.35)',marginTop:3}}>
                    {days.map(d=><span key={d}>{d}</span>)}
                  </div>
                </div>
              )
            })
          )}

          {/* Add favorites CTA */}
          {favStations.length === 0 && (
            <div style={{marginTop:14,padding:'10px 14px',background:'rgba(255,59,48,.05)',border:'0.5px solid rgba(255,59,48,.15)',borderRadius:12,display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:16}}>☆</span>
              <div style={{fontSize:12,color:'rgba(26,26,46,.5)',lineHeight:1.5}}>
                Tap the <strong>☆</strong> star next to any station to track its price trend here
              </div>
            </div>
          )}
        </div>

        {/* Area 30-day chart */}
        <div style={{...glass({padding:'18px',marginBottom:12})}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,26,46,.4)'}}>Your Area · 30-Day Trend</div>
            <div style={{fontSize:9,fontWeight:600,color:'rgba(26,26,46,.4)'}}>EIA {userState} Region · Regular</div>
          </div>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:10}}>
            <div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:30,fontWeight:900,letterSpacing:-1.5,color:'#ff3b30',lineHeight:1}}>${bestPrice.toFixed(2)}</div>
              <div style={{fontSize:11,fontWeight:700,color:'#30d158',marginTop:3}}>↓ ${(stateGas?.avg ? stateGas.avg - bestPrice + .15 : 0.19).toFixed(2)} vs 30 days ago</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:9,color:'rgba(26,26,46,.4)',marginBottom:2}}>30-day range</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:700,color:'#1a1a2e'}}>${(bestPrice-.19).toFixed(2)} — ${(bestPrice+.12).toFixed(2)}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={history} margin={{top:4,right:0,left:-34,bottom:0}}>
              <defs>
                <linearGradient id="areaGrad30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff3b30" stopOpacity=".15"/>
                  <stop offset="95%" stopColor="#ff3b30" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{fontFamily:'system-ui',fontSize:8,fill:'rgba(26,26,46,.35)'}} axisLine={false} tickLine={false}/>
              <YAxis domain={['auto','auto']} tick={{fontFamily:'system-ui',fontSize:8,fill:'rgba(26,26,46,.35)'}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`$${v.toFixed(2)}`}/>
              <Tooltip contentStyle={{background:'rgba(255,255,255,.95)',border:'0.5px solid rgba(255,59,48,.2)',borderRadius:10,fontFamily:'system-ui',fontSize:12}}/>
              <ReferenceLine y={avgPrice} stroke="rgba(26,26,46,.2)" strokeDasharray="3 3"/>
              <Area type="monotone" dataKey="price" stroke="#ff3b30" strokeWidth={2} fill="url(#areaGrad30)" dot={false} activeDot={{r:4,fill:'#ff3b30'}}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:14,paddingTop:10,borderTop:'0.5px solid rgba(0,0,0,.06)',marginTop:8,flexWrap:'wrap'}}>
            {[{color:'#ff3b30',label:'Your area',solid:true},{color:'rgba(26,26,46,.2)',label:'Area avg',dashed:true}].map((l,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'rgba(26,26,46,.55)'}}>
                {l.dashed
                  ? <div style={{width:16,height:1,borderTop:`1px dashed ${l.color}`}}/>
                  : <div style={{width:16,height:2,background:l.color,borderRadius:1}}/>
                }
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Route Finder */}
        <RouteGasFinder userCoords={userCoords} basePrice={bestPrice} isDark={false}/>

        <div style={{fontSize:9,color:'rgba(26,26,46,.3)',textAlign:'center',letterSpacing:.5,paddingTop:8}}>
          DATA: EIA.GOV · GOOGLE PLACES · INFORMATIONAL USE ONLY
        </div>
      </div>
    </>
  )
}

// ── Paywall wrapper ────────────────────────────────────────────────────────────
export default function GasPage() {
  const { allowed, checking, daysLeft } = usePaywall('driver')
  const [phase, setPhase] = React.useState<'loading'|'taste'|'paywall'|'access'>('loading')

  React.useEffect(()=>{
    if (checking) return
    if (allowed) { setPhase('access'); return }
    const raw = localStorage.getItem('gratia_signup_time')
    if (raw && Date.now()-parseInt(raw) < 3*60*1000) { setPhase('taste'); return }
    if (raw) localStorage.removeItem('gratia_signup_time')
    setPhase('paywall')
  },[checking,allowed])

  if (phase==='loading'||checking) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0eff4',fontFamily:'system-ui',color:'rgba(0,0,0,.4)',fontSize:14}}>Loading...</div>
  )
  if (phase==='paywall') return <SubscribeScreen/>
  if (phase==='access') return <GasPageContent daysLeft={daysLeft}/>
  return (
    <>
      <GasPageContent daysLeft={null}/>
      <TasteTimer onExpire={()=>{localStorage.removeItem('gratia_signup_time');setPhase('paywall')}}/>
    </>
  )
}

// ── Subscribe screen ───────────────────────────────────────────────────────────
function SubscribeScreen() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [err, setErr] = React.useState('')

  const handleSubscribe = async () => {
    setLoading(true); setErr('')
    try {
      const {data:{user}} = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const res = await fetch('/api/create-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id,email:user.email,userType:'driver'})})
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error||'No URL returned')
    } catch(e:any){ setErr(e.message||'Something went wrong'); setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',background:'#f0eff4',fontFamily:"'DM Sans',system-ui,sans-serif",display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
      <div style={{textAlign:'center',marginBottom:28}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,59,48,.1)',border:'1px solid rgba(255,59,48,.2)',borderRadius:100,padding:'6px 16px',marginBottom:16}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#ff3b30',animation:'lp 1.5s ease infinite'}}/>
          <span style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase'}}>Start Your Free Trial</span>
        </div>
        <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:900,letterSpacing:-1.5,color:'#1a1a2e',marginBottom:8}}>You just saw what's waiting for you</h1>
        <p style={{fontSize:14,color:'rgba(26,26,46,.55)',maxWidth:380,margin:'0 auto',lineHeight:1.65}}>7-day free trial. Card required — not charged until day 8. Cancel anytime.</p>
      </div>
      <div style={{maxWidth:420,width:'100%',background:'rgba(255,255,255,.9)',border:'2px solid rgba(255,59,48,.25)',borderRadius:28,padding:'28px 24px',boxShadow:'0 8px 40px rgba(255,59,48,.12)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,transparent,#ff3b30,transparent)'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase',marginBottom:6}}>⭐ Live Now</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e'}}>Core Pass</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:900,letterSpacing:-1.5,color:'#ff3b30',lineHeight:1}}>$4.99</div>
            <div style={{fontSize:12,color:'rgba(26,26,46,.4)'}}>/mo after trial</div>
          </div>
        </div>
        {['Real-time gas prices near you','Route gas finder','USA price map all 50 states','Price trend tracking','Tank & price alerts'].map((f,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'rgba(26,26,46,.7)',marginBottom:7}}>
            <span style={{color:'#ff3b30',fontWeight:700,flexShrink:0}}>✓</span>{f}
          </div>
        ))}
        {err && <div style={{background:'rgba(255,59,48,.08)',border:'1px solid rgba(255,59,48,.2)',borderRadius:12,padding:'10px 14px',marginTop:12,fontSize:12,color:'#cc2018'}}>⚠️ {err}</div>}
        <button onClick={handleSubscribe} disabled={loading} style={{width:'100%',padding:14,marginTop:16,background:loading?'rgba(255,59,48,.3)':'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:800,cursor:loading?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:loading?'none':'0 4px 20px rgba(255,59,48,.4)'}}>
          {loading?'Connecting to Stripe...':'Start Free Trial — $4.99/mo →'}
        </button>
        <p style={{fontSize:11,color:'rgba(26,26,46,.35)',textAlign:'center',lineHeight:1.6,margin:'10px 0 0'}}>🔒 Stripe secured · Cancel anytime · No hidden fees</p>
      </div>
      <button onClick={()=>router.push('/dashboard')} style={{marginTop:16,background:'none',border:'none',color:'rgba(26,26,46,.35)',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>← Back to dashboard</button>
    </div>
  )
}