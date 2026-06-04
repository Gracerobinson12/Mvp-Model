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

type Station = { id:number; name:string; address:string; lat:number; lng:number; distance:number; regular:number; mid:number; premium:number; diesel:number; super:number; updated:string; trending:string; grades:string[] }
type EVStation = { id:number; name:string; address:string; lat:number; lng:number; distance:number; network:string; ports:number; available:number; level:string; kw:number; cost:string; costUnit:string }
type Coords  = { lat:number; lng:number }

const GRADES       = ['Regular','Mid','Premium','Diesel','Super']
const GRADE_LABELS: Record<string,string> = {Regular:'87',Mid:'89',Premium:'91',Diesel:'Dsl',Super:'93'}
const RADIUS_MILES = [5,10,15,30]
const BASIC_RADIUS_MILES = [2]  // Basic plan: 2mi only
const gk = (g:string) => g.toLowerCase()

const AUBURN_LAT = 32.6099, AUBURN_LNG = -85.4808
// Fallback replaced by buildFallbackStations() - keeps FALLBACK_STATIONS for type compat
const FALLBACK_STATIONS: Station[] = []

const FALLBACK_HISTORY = [
  {day:'Apr 11',price:3.23},{day:'Apr 15',price:3.20},{day:'Apr 18',price:3.18},
  {day:'Apr 22',price:3.16},{day:'Apr 25',price:3.14},{day:'Apr 29',price:3.11},
  {day:'May 2', price:3.09},{day:'May 5', price:3.04},
]

const STATE_GAS: Record<string,{avg:number,trend:string,change:string}> = {
  Alabama:{avg:3.12,trend:'↓',change:'-0.04'},Georgia:{avg:3.19,trend:'↓',change:'-0.05'},
  Florida:{avg:3.51,trend:'↑',change:'+0.03'},Texas:{avg:2.94,trend:'↓',change:'-0.02'},
  California:{avg:4.94,trend:'↑',change:'+0.12'},Tennessee:{avg:3.08,trend:'↓',change:'-0.04'},
  'New York':{avg:4.35,trend:'↑',change:'+0.09'},Ohio:{avg:3.58,trend:'↑',change:'+0.04'},
}

function distanceMiles(a:number,b:number,c:number,d:number){
  const R=3959,dL=(c-a)*Math.PI/180,dl=(d-b)*Math.PI/180
  const x=Math.sin(dL/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dl/2)**2
  return parseFloat((R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))).toFixed(1))
}
function simulatePrices(base:number){
  const o=[-0.09,-0.05,-0.02,0,0.04,0.08,0.13][Math.floor(Math.random()*7)]
  const hasSuper = Math.random()>0.5
  const hasD = Math.random()>0.3
  const grades = ['regular','mid','premium',...(hasD?['diesel']:[]),...(hasSuper?['super']:[])]
  return {
    regular:+(base+o).toFixed(2),
    mid:+(base+o+.30).toFixed(2),
    premium:+(base+o+.60).toFixed(2),
    diesel: hasD ? +(base+o+.45).toFixed(2) : 0,
    super: hasSuper ? +(base+o+.80).toFixed(2) : 0,
    grades,
  }
}

// EV fallback stations near Auburn
function buildFallbackEV(lat:number,lng:number):EVStation[]{
  const locations=[
    {name:'Tesla Supercharger',address:'Auburn Mall',network:'Tesla',ports:8,kw:250,level:'DC Fast',cost:'0.38',costUnit:'/kWh'},
    {name:'ChargePoint',address:'Walmart Supercenter',network:'ChargePoint',ports:4,kw:7,level:'Level 2',cost:'Free',costUnit:''},
    {name:'Blink',address:'Kroger Parking Lot',network:'Blink',ports:3,kw:50,level:'DC Fast',cost:'0.29',costUnit:'/kWh'},
    {name:'EVgo',address:'Auburn University Area',network:'EVgo',ports:2,kw:100,level:'DC Fast',cost:'0.35',costUnit:'/kWh'},
    {name:'ChargePoint Level 2',address:'Publix Shopping Center',network:'ChargePoint',ports:6,kw:7,level:'Level 2',cost:'0.15',costUnit:'/kWh'},
  ]
  return locations.map((l,i)=>{
    const bearing=(i*72)*(Math.PI/180)
    const dist=0.8+i*1.4
    const evLat=lat+dist/69*Math.cos(bearing)
    const evLng=lng+dist/(69*Math.cos(lat*Math.PI/180))*Math.sin(bearing)
    const available=Math.floor(Math.random()*l.ports+1)
    return {...l,id:i+1,lat:evLat,lng:evLng,distance:parseFloat(dist.toFixed(1)),available}
  })
}
// pct = 0 (cheapest) to 1 (priciest) across all visible stations
function makePin(price:number,best:boolean,sel:boolean,pct:number=0.5){
  // Color scale: green → yellow-green → yellow → orange → red
  let bg:string,bd:string,fg:string,label:string
  if(sel){
    bg='linear-gradient(135deg,#ff3b30,#ff6b35)';bd='#ff3b30';fg='#fff';label=''
  } else if(best){
    bg='linear-gradient(135deg,#30d158,#34c759)';bd='#30d158';fg='#fff';label='★ '
  } else if(pct<0.33){
    bg='rgba(48,209,88,.15)';bd='rgba(48,209,88,.6)';fg='#1a5c30';label=''
  } else if(pct<0.55){
    bg='rgba(172,230,80,.2)';bd='rgba(152,210,60,.7)';fg='#3a5c10';label=''
  } else if(pct<0.72){
    bg='rgba(255,214,10,.18)';bd='rgba(255,190,0,.7)';fg='#6b4e00';label=''
  } else if(pct<0.88){
    bg='rgba(255,149,0,.18)';bd='rgba(255,149,0,.7)';fg='#7a3a00';label=''
  } else {
    bg='rgba(255,69,58,.15)';bd='rgba(255,59,48,.6)';fg='#8b1a10';label=''
  }
  const scale=sel?'scale(1.25)':best?'scale(1.1)':'scale(1)'
  return `<div style="display:inline-flex;flex-direction:column;align-items:center;transform:${scale};transition:transform .2s;filter:drop-shadow(0 3px 8px rgba(0,0,0,.25))"><div style="background:${bg};border:2px solid ${bd};border-radius:10px;padding:5px 10px;display:flex;align-items:center;gap:3px;cursor:pointer"><span style="font-size:10px">⛽</span><span style="font-size:13px;font-weight:700;color:${fg};font-family:system-ui">${label}$${price.toFixed(2)}</span></div><div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${bd}"></div></div>`
}

// ── Modals ────────────────────────────────────────────────────────────────────
function MapsModal({station,destination,onClose}:{station:Station,destination:string,onClose:()=>void}){
  const q = encodeURIComponent(`${station.name}, ${station.address}`)
  const dest = destination.trim()
  const goApple=()=>{
    if(dest) window.open(`maps://maps.apple.com/?saddr=Current+Location&daddr=${encodeURIComponent(dest)}&via=${encodeURIComponent(station.name+', '+station.address)}&dirflag=d`)
    else window.open(`maps://maps.apple.com/?q=${q}&dirflag=d`)
    onClose()
  }
  const goGoogle=()=>{
    if(dest) window.open(`https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(dest)}&waypoints=${q}&travelmode=driving`)
    else window.open(`https://www.google.com/maps/search/?api=1&query=${q}`)
    onClose()
  }
  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)',padding:'0 14px 24px'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'rgba(255,255,255,.97)',borderRadius:'24px 24px 18px 18px',padding:20,width:'100%',maxWidth:440,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
        <div style={{width:36,height:4,borderRadius:2,background:'rgba(0,0,0,.1)',margin:'0 auto 16px'}}/>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:4}}>Open in maps</div>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e',marginBottom:16}}>{station.name} · {station.address}</div>
        <button onClick={goApple} style={{width:'100%',padding:'13px 16px',background:'rgba(0,0,0,.04)',border:'0.5px solid rgba(0,0,0,.08)',borderRadius:16,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:12,marginBottom:8,color:'#1a1a2e'}}>
          <span style={{fontSize:24}}>🗺️</span><div><div>Apple Maps</div><div style={{fontSize:11,fontWeight:400,color:'rgba(26,26,46,.45)',marginTop:1}}>iPhone · iPad · Mac{dest?' · Gas as waypoint':''}</div></div>
        </button>
        <button onClick={goGoogle} style={{width:'100%',padding:'13px 16px',background:'rgba(66,133,244,.07)',border:'0.5px solid rgba(66,133,244,.2)',borderRadius:16,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:12,marginBottom:12,color:'#1a1a2e'}}>
          <span style={{fontSize:24}}>📍</span><div><div>Google Maps</div><div style={{fontSize:11,fontWeight:400,color:'rgba(26,26,46,.45)',marginTop:1}}>All devices · Android{dest?' · Gas as waypoint':''}</div></div>
        </button>
        <button onClick={onClose} style={{width:'100%',padding:11,borderRadius:100,border:'0.5px solid rgba(0,0,0,.08)',background:'transparent',fontSize:13,color:'rgba(26,26,46,.4)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
      </div>
    </div>
  )
}

function ReportModal({station,onClose,onDone}:{station:Station,onClose:()=>void,onDone:()=>void}){
  const [price,setPrice]=useState('')
  const [clean,setClean]=useState(3)
  const [sliding,setSliding]=useState(false)
  const [pct,setPct]=useState(0)
  const trackRef=useRef<HTMLDivElement>(null)
  const cleanDesc=['','Very dirty','Below average','Average','Clean','Spotless']

  const startSlide=(e:any)=>{setSliding(true)}
  const moveSlide=useCallback((e:any)=>{
    if(!sliding||!trackRef.current) return
    const rect=trackRef.current.getBoundingClientRect()
    const x=e.touches?e.touches[0].clientX:e.clientX
    const p=Math.min(Math.max(0,(x-rect.left-26)/(rect.width-52)),1)
    setPct(p)
    if(p>0.92){setSliding(false);onDone()}
  },[sliding,onDone])
  const endSlide=()=>{if(sliding){setSliding(false);setPct(0)}}

  useEffect(()=>{
    window.addEventListener('mousemove',moveSlide)
    window.addEventListener('touchmove',moveSlide)
    window.addEventListener('mouseup',endSlide)
    window.addEventListener('touchend',endSlide)
    return()=>{
      window.removeEventListener('mousemove',moveSlide)
      window.removeEventListener('touchmove',moveSlide)
      window.removeEventListener('mouseup',endSlide)
      window.removeEventListener('touchend',endSlide)
    }
  },[sliding,moveSlide])

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,.5)',backdropFilter:'blur(12px)',padding:'0 14px 24px'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'rgba(255,255,255,.97)',borderRadius:'28px 28px 20px 20px',padding:'20px 22px 24px',width:'100%',maxWidth:440,fontFamily:"'DM Sans',system-ui,sans-serif",position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,width:28,height:28,borderRadius:'50%',background:'rgba(0,0,0,.06)',border:'none',cursor:'pointer',fontSize:12,color:'rgba(26,26,46,.4)'}}>✕</button>
        <div style={{width:36,height:4,borderRadius:2,background:'rgba(0,0,0,.1)',margin:'0 auto 16px'}}/>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase',marginBottom:4}}>Report a Price</div>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:900,color:'#1a1a2e',marginBottom:14}}>{station.name} · {station.address}</div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:8}}>Price you saw · Regular</div>
          <div style={{display:'flex',alignItems:'center',background:'rgba(255,59,48,.05)',border:'1.5px solid rgba(255,59,48,.25)',borderRadius:16,padding:'10px 16px',gap:6}}>
            <span style={{fontSize:26,fontWeight:800,color:'rgba(26,26,46,.25)'}}>$</span>
            <input type="number" step="0.01" placeholder="3.04" value={price} onChange={e=>setPrice(e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontFamily:"'Sora',sans-serif",fontSize:30,fontWeight:900,color:'#ff3b30',letterSpacing:-1}}/>
            <span style={{fontSize:13,color:'rgba(26,26,46,.3)'}}>/gal</span>
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:8,display:'flex',justifyContent:'space-between'}}>
            <span>Cleanliness</span><span style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:900,color:'#ff3b30'}}>{clean}/5</span>
          </div>
          <div style={{display:'flex',gap:6,marginBottom:5}}>
            {[1,2,3,4,5].map(n=><div key={n} onClick={()=>setClean(n)} style={{flex:1,height:8,borderRadius:4,background:n<=clean?'#ff3b30':'rgba(0,0,0,.08)',cursor:'pointer',transition:'all .2s'}}/>)}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'rgba(26,26,46,.35)'}}>
            <span>Dirty</span><span>{cleanDesc[clean]}</span><span>Spotless</span>
          </div>
        </div>
        <div ref={trackRef} style={{position:'relative',height:52,background:'rgba(48,209,88,.1)',border:'1px solid rgba(48,209,88,.25)',borderRadius:100,overflow:'hidden',userSelect:'none',cursor:'pointer'}} onMouseDown={startSlide} onTouchStart={startSlide}>
          <div style={{position:'absolute',inset:0,background:`linear-gradient(90deg,rgba(48,209,88,.25),rgba(48,209,88,.05))`,width:`${pct*100}%`,transition:sliding?'none':'width .3s'}}/>
          <div style={{position:'absolute',top:4,left:`${4+pct*(trackRef.current?.offsetWidth??340)-52}px`,width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#30d158,#34c759)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 4px 12px rgba(48,209,88,.4)',transition:sliding?'none':'left .3s'}}>→</div>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:'rgba(48,209,88,.6)',pointerEvents:'none'}}>Slide to confirm</div>
        </div>
      </div>
    </div>
  )
}

function ThanksModal({onClose}:{onClose:()=>void}){
  return (
    <div style={{position:'fixed',inset:0,zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.4)',backdropFilter:'blur(8px)'}}>
      <div style={{background:'rgba(255,255,255,.97)',borderRadius:28,padding:'32px 28px',textAlign:'center',maxWidth:300,width:'90%',fontFamily:"'DM Sans',system-ui,sans-serif"}}>
        <div style={{fontSize:52,marginBottom:12}}>⛽</div>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:900,color:'#1a1a2e',marginBottom:8}}>Thank you!</div>
        <div style={{fontSize:13,color:'rgba(26,26,46,.55)',lineHeight:1.65,marginBottom:16}}>Your price report helps other drivers find cheaper gas.</div>
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(48,209,88,.1)',border:'0.5px solid rgba(48,209,88,.3)',borderRadius:100,padding:'5px 14px',fontSize:11,fontWeight:700,color:'#1a7a35',marginBottom:16}}>✓ Shows in ~5 minutes</div>
        <button onClick={onClose} style={{width:'100%',padding:12,borderRadius:100,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Done</button>
      </div>
    </div>
  )
}

// ── Map Component ─────────────────────────────────────────────────────────────
function GasMap({stations,grade,selectedId,onSelect,userCoords,radius,onReport,onRadiusChange}:{
  stations:Station[],grade:string,selectedId:number|null,onSelect:(id:number)=>void,
  userCoords:Coords|null,radius:number,onReport:()=>void,onRadiusChange:(r:number)=>void
}){
  const containerRef = useRef<HTMLDivElement>(null)
  const mapDivRef    = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const mksRef       = useRef<Record<number,any>>({})
  const circleRef    = useRef<any>(null)
  const [exp, setExp]= useState(false)

  const center = userCoords??{lat:AUBURN_LAT,lng:AUBURN_LNG}
  const best   = stations.length?[...stations].sort((a:any,b:any)=>a[gk(grade)]-b[gk(grade)])[0]:null

  const boot=(L:any)=>{
    if(!mapDivRef.current||mapRef.current) return
    const map=L.map(mapDivRef.current,{center:[center.lat,center.lng],zoom:13,zoomControl:false,attributionControl:false})
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map)
    L.control.zoom({position:'bottomright'}).addTo(map)
    if(center.lat&&center.lng){
      L.marker([center.lat,center.lng],{icon:L.divIcon({className:'',iconSize:[20,20],iconAnchor:[10,10],
        html:'<div style="width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#ff3b30,#ff6b35);border:3px solid #fff;box-shadow:0 0 0 5px rgba(255,59,48,.18),0 4px 12px rgba(255,59,48,.4)"></div>'
      })}).addTo(map)
      const circle=L.circle([center.lat,center.lng],{
        radius:RADIUS_MILES[radius-1]*1609.34,
        color:'#ff3b30',weight:2.5,opacity:.7,dashArray:'8 6',fillColor:'#ff3b30',fillOpacity:.07,interactive:false
      }).addTo(map)
      circleRef.current=circle
    }
    const prices=stations.filter(s=>s.lat&&s.lng).map(s=>(s as any)[gk(grade)])
    const minP=Math.min(...prices,999),maxP=Math.max(...prices,0),priceRange=maxP-minP||0.01
    stations.forEach(st=>{
      if(!st.lat||!st.lng) return
      const price=(st as any)[gk(grade)],isBest=st.id===best?.id
      const pct=(price-minP)/priceRange
      const tierLabel=pct<0.2?'Best deal':pct<0.45?'Good price':pct<0.65?'Average':pct<0.85?'Above avg':'Priciest'
      const tierColor=pct<0.2?'#30d158':pct<0.45?'#a8e063':pct<0.65?'#ffd60a':pct<0.85?'#ff9500':'#ff453a'
      const m=L.marker([st.lat,st.lng],{icon:L.divIcon({className:'',iconSize:[90,56],iconAnchor:[45,56],html:makePin(price,isBest,false,pct)})})
        .addTo(map).on('click',()=>onSelect(st.id))
      m.bindPopup(`<div style="font-family:system-ui;min-width:150px;padding:2px"><div style="font-size:13px;font-weight:700;color:#1a1a2e;margin-bottom:2px">${st.name}</div><div style="font-size:10px;color:rgba(26,26,46,.5);margin-bottom:6px">${st.address}</div><div style="display:flex;align-items:center;justify-content:space-between"><span style="font-size:18px;font-weight:800;color:${isBest?'#30d158':'#1a1a2e'}">$${price.toFixed(2)}</span><span style="font-size:9px;font-weight:700;color:${tierColor};background:${tierColor}18;border:1px solid ${tierColor}40;border-radius:100px;padding:2px 8px">${tierLabel}</span></div></div>`)
      mksRef.current[st.id]=m
    })
    const lls=stations.filter(s=>s.lat&&s.lng).map(s=>[s.lat,s.lng] as [number,number])
    // Start fitted to 10mi radius so user sees useful area immediately
    try{
      const initCircle=L.circle([center.lat,center.lng],{radius:RADIUS_MILES[1]*1609.34,interactive:false,opacity:0,fillOpacity:0}).addTo(map)
      map.fitBounds(initCircle.getBounds(),{padding:[30,30]})
      initCircle.remove()
    }catch(e){
      if(lls.length>1) try{map.fitBounds(L.latLngBounds([...lls,[center.lat,center.lng]]),{padding:[40,40],maxZoom:14})}catch(e2){}
    }
    mapRef.current=map
  }

  useEffect(()=>{
    if((window as any).L){boot((window as any).L);return}
    if(!document.querySelector('#lf-css')){const l=document.createElement('link');l.id='lf-css';l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(l)}
    if(!document.querySelector('#lf-js')){const s=document.createElement('script');s.id='lf-js';s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';s.onload=()=>boot((window as any).L);document.head.appendChild(s)}
    else{const w=setInterval(()=>{if((window as any).L){clearInterval(w);boot((window as any).L)}},100)}
    return()=>{if(mapRef.current){mapRef.current.remove();mapRef.current=null;mksRef.current={}}}
  },[])

  useEffect(()=>{
    if(!(window as any).L||!mapRef.current) return
    const L=(window as any).L
    const radiusMi=RADIUS_MILES[radius-1]
    const visible=stations.filter(s=>s.lat&&s.lng&&s.distance<=radiusMi)
    const prices=visible.map(s=>(s as any)[gk(grade)])
    const minP=Math.min(...prices,999),maxP=Math.max(...prices,0),priceRange=maxP-minP||0.01
    const b=visible.length?[...visible].sort((a:any,bx:any)=>a[gk(grade)]-bx[gk(grade)])[0]:null
    stations.forEach(st=>{
      const m=mksRef.current[st.id];if(!m)return
      const price=(st as any)[gk(grade)],pct=(price-minP)/priceRange
      const isVis=st.distance<=radiusMi
      m.setIcon(L.divIcon({className:'',iconSize:[90,56],iconAnchor:[45,56],html:makePin(price,st.id===b?.id,st.id===selectedId,pct)}))
      m.setOpacity(isVis?1:0.25)
    })
  },[grade,selectedId])

  useEffect(()=>{
    if(circleRef.current) circleRef.current.setRadius(RADIUS_MILES[radius-1]*1609.34)
    if(!mapRef.current||(window as any).L===undefined) return
    const L=(window as any).L
    const radiusMi=RADIUS_MILES[radius-1]
    // Filter visible stations by radius
    const visible=stations.filter(s=>s.lat&&s.lng&&s.distance<=radiusMi)
    const hidden=stations.filter(s=>s.lat&&s.lng&&s.distance>radiusMi)
    // Recalculate price range for visible stations only
    const visPrices=visible.map(s=>(s as any)[gk(grade)])
    const minP=Math.min(...visPrices,999),maxP=Math.max(...visPrices,0),priceRange=maxP-minP||0.01
    const bestVis=visible.length?[...visible].sort((a:any,b:any)=>a[gk(grade)]-b[gk(grade)])[0]:null
    // Update all marker icons
    visible.forEach(st=>{
      const m=mksRef.current[st.id];if(!m)return
      const price=(st as any)[gk(grade)],pct=(price-minP)/priceRange
      m.setIcon(L.divIcon({className:'',iconSize:[90,56],iconAnchor:[45,56],
        html:makePin(price,st.id===bestVis?.id,st.id===selectedId,pct)
      }))
      m.setOpacity(1)
    })
    // Dim stations outside radius
    hidden.forEach(st=>{
      const m=mksRef.current[st.id];if(!m)return
      m.setOpacity(0.25)
    })
    // Fit map to show the full radius circle
    if(circleRef.current&&mapRef.current){
      try{
        mapRef.current.fitBounds(circleRef.current.getBounds(),{padding:[30,30],animate:true,duration:0.6})
      }catch(e){}
    }
  },[radius])
  useEffect(()=>{if(!mapRef.current||!selectedId)return;const st=stations.find(s=>s.id===selectedId);if(st?.lat&&st?.lng)mapRef.current.panTo([st.lat,st.lng],{animate:true,duration:.4})},[selectedId])
  useEffect(()=>{setTimeout(()=>mapRef.current?.invalidateSize(),350)},[exp])

  const glass='rgba(255,255,255,.92)'
  const blur='blur(16px)'

  return (
    <div ref={containerRef} style={{marginBottom: exp?0:12}}>
      {/* ONE map div - always mounted, position changes */}
      <div style={{
        position: exp?'fixed':'relative',
        inset: exp?'0':undefined,
        zIndex: exp?9990:undefined,
        height: exp?'100vh':190,
        borderRadius: exp?0:18,
        overflow:'hidden',
        border: exp?'none':'0.5px solid rgba(255,255,255,.9)',
      }}>
        <div ref={mapDivRef} style={{width:'100%',height:'100%'}}/>

        {/* COLLAPSED overlays */}
        {!exp&&<>
          <div style={{position:'absolute',top:10,left:10,zIndex:401,background:glass,backdropFilter:blur,border:'0.5px solid rgba(255,59,48,.2)',borderRadius:12,padding:'7px 11px',pointerEvents:'none'}}>
            <div style={{fontSize:8,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase'}}>Best price</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:900,color:'#1a1a2e',lineHeight:1.1}}>${best?.[gk(grade)]?.toFixed(2)??'--'}</div>
            <div style={{fontSize:9,color:'rgba(26,26,46,.5)',marginTop:1}}>{best?.name}</div>
          </div>
          <button onClick={()=>setExp(true)} style={{position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',zIndex:401,background:'rgba(26,26,46,.72)',backdropFilter:blur,border:'none',borderRadius:100,padding:'6px 14px',fontSize:10,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>⤢ Explore full map</button>
          <button onClick={e=>{e.stopPropagation();onReport()}} style={{position:'absolute',top:10,right:10,zIndex:401,background:glass,backdropFilter:blur,border:'0.5px solid rgba(255,59,48,.25)',borderRadius:100,padding:'4px 10px',fontSize:10,fontWeight:700,color:'#cc2018',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>📍 Report</button>
        </>}

        {/* EXPANDED overlays */}
        {exp&&<>
          <div style={{position:'absolute',top:0,left:0,right:0,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:9991}}>
            <button onClick={()=>setExp(false)} style={{background:'rgba(255,255,255,.96)',backdropFilter:'blur(20px)',border:'0.5px solid rgba(255,255,255,.98)',borderRadius:14,padding:'10px 16px',fontSize:13,fontWeight:700,color:'#1a1a2e',cursor:'pointer',display:'flex',alignItems:'center',gap:6,boxShadow:'0 4px 16px rgba(0,0,0,.15)',fontFamily:"'DM Sans',sans-serif"}}>← Close map</button>
            <div style={{background:'rgba(255,255,255,.92)',backdropFilter:'blur(16px)',border:'0.5px solid rgba(255,59,48,.2)',borderRadius:12,padding:'8px 14px',pointerEvents:'none'}}>
              <div style={{fontSize:8,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase'}}>Best price</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:900,color:'#1a1a2e',lineHeight:1}}>${best?.[gk(grade)]?.toFixed(2)??'--'} · {best?.name}</div>
            </div>
            <button onClick={onReport} style={{background:'rgba(255,255,255,.92)',backdropFilter:'blur(16px)',border:'0.5px solid rgba(255,59,48,.25)',borderRadius:100,padding:'8px 14px',fontSize:11,fontWeight:700,color:'#cc2018',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>📍 Report</button>
          </div>
          <div style={{position:'absolute',top:70,left:'50%',transform:'translateX(-50%)',zIndex:9991,background:'rgba(255,255,255,.85)',backdropFilter:'blur(12px)',borderRadius:100,padding:'4px 14px',fontSize:11,fontWeight:700,color:'rgba(26,26,46,.6)',pointerEvents:'none',whiteSpace:'nowrap'}}>{stations.filter(s=>s.distance<=RADIUS_MILES[radius-1]).length} stations visible · drag to explore</div>
          {/* Price legend */}
          <div style={{position:'absolute',top:110,left:'50%',transform:'translateX(-50%)',zIndex:9991,background:'rgba(255,255,255,.92)',backdropFilter:'blur(16px)',border:'0.5px solid rgba(255,255,255,.98)',borderRadius:100,padding:'5px 14px',display:'flex',alignItems:'center',gap:8,pointerEvents:'none',whiteSpace:'nowrap',boxShadow:'0 2px 10px rgba(0,0,0,.1)'}}>
            <span style={{fontSize:9,fontWeight:700,color:'rgba(26,26,46,.4)'}}>PRICE</span>
            {[{c:'#30d158',l:'Cheapest'},{c:'#a8e063',l:'Good'},{c:'#ffd60a',l:'Avg'},{c:'#ff9500',l:'High'},{c:'#ff453a',l:'Priciest'}].map(t=>(
              <div key={t.l} style={{display:'flex',alignItems:'center',gap:3}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:t.c}}/>
                <span style={{fontSize:9,fontWeight:600,color:'rgba(26,26,46,.55)'}}>{t.l}</span>
              </div>
            ))}
          </div>
          <div style={{position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)',zIndex:9991,background:'rgba(255,255,255,.97)',backdropFilter:'blur(24px)',border:'0.5px solid rgba(255,255,255,.98)',borderRadius:20,padding:'10px 16px',boxShadow:'0 8px 32px rgba(0,0,0,.15)',textAlign:'center'}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:8}}>Search radius</div>
            {isBasicPlan && <div style={{fontSize:10,color:'#cc2018',fontWeight:600,marginBottom:6}}>Basic plan — 2 mile radius only · <span style={{textDecoration:'underline',cursor:'pointer'}} onClick={()=>router.push('/dashboard/billing')}>Upgrade</span></div>}
            <div style={{display:'flex',gap:10}}>
              {[{v:1,mi:'5'},{v:2,mi:'10'},{v:3,mi:'15'},{v:4,mi:'30'}].map(r=>{
                const on=radius===r.v
                return <button key={r.v} onClick={()=>onRadiusChange(r.v)} style={{width:50,height:50,borderRadius:'50%',border:`2.5px solid ${on?'#ff3b30':'rgba(0,0,0,.12)'}`,background:on?'rgba(255,59,48,.1)':'rgba(255,255,255,.8)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s',fontFamily:"'DM Sans',sans-serif"}}>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:15,fontWeight:900,color:on?'#ff3b30':'#1a1a2e',lineHeight:1}}>{r.mi}</div>
                  <div style={{fontSize:8,color:on?'#cc2018':'rgba(26,26,46,.5)',marginTop:1}}>mi</div>
                </button>
              })}
            </div>
            <div style={{fontSize:10,color:'rgba(26,26,46,.45)',marginTop:8}}>{stations.length} stations</div>
          </div>
        </>}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function GasPageContent({daysLeft}:{daysLeft:number|null}){
  const [grade,setGrade]         = useState('Regular')
  const [stations,setStations]   = useState<Station[]>(FALLBACK_STATIONS)
  const [history,setHistory]     = useState(FALLBACK_HISTORY)
  const [userCoords,setCoords]   = useState<Coords|null>(null)
  const [locStatus,setLocStatus] = useState('Finding your location...')
  const [userPlan, setUserPlan]   = useState<string>('core')

  useEffect(()=>{
    supabase.auth.getUser().then(({data:{user}})=>{
      if(!user) return
      supabase.from('profiles').select('plan').eq('id',user.id).single()
        .then(({data})=>{ if(data?.plan) setUserPlan(data.plan) })
    })
  },[])

  const isBasicPlan = userPlan === 'basic'
  const [loading,setLoading]     = useState(false)
  const [mapKey,setMapKey]       = useState('init')
  const [selId,setSelId]         = useState<number|null>(null)
  const [radius,setRadius]       = useState(2)
  const [favorites,setFavorites] = useState<Set<number>>(new Set())
  const [destination,setDest]    = useState('')
  const [showAllSt,setShowAllSt] = useState(false)
  const [showEV,setShowEV] = useState(false)
  const [reportSt,setReportSt]   = useState<Station|null>(null)
  const [showThanks,setThanks]   = useState(false)
  const [mapsSt,setMapsSt]       = useState<Station|null>(null)
  const [userState,setUserState] = useState('Alabama')

  const RADIUS_LABELS=['5 miles','10 miles','15 miles','30 miles']

  useEffect(()=>{
    if(!navigator.geolocation){return}
    navigator.geolocation.getCurrentPosition(
      pos=>{const{latitude:lat,longitude:lng}=pos.coords;setCoords({lat,lng});setLocStatus('📍 Location found');fetchData(lat,lng)},
      ()=>{setLocStatus('Sample data · allow location for live prices')},
      {enableHighAccuracy:true,timeout:12000,maximumAge:300000}
    )
    loadPrefs()
  },[])

  const loadPrefs=async()=>{
    try{
      const{data:{user}}=await supabase.auth.getUser()
      if(!user) return
      const{data:p}=await supabase.from('profiles').select('state,grade_preference,last_location_lat,last_location_lng').eq('id',user.id).single()
      if(p?.state) setUserState(p.state)
      if(p?.grade_preference) setGrade(p.grade_preference)
      if(p?.last_location_lat&&p?.last_location_lng){
        const lat=parseFloat(p.last_location_lat),lng=parseFloat(p.last_location_lng)
        setCoords({lat,lng});setLocStatus('📍 Location restored');fetchData(lat,lng)
      }
    }catch(e){}
  }

  // Generate stations spread across multiple distances so radius filter works
  const buildFallbackStations = (lat:number, lng:number, base:number): Station[] => {
    const stationDefs = [
      // ~0.5-2 mi (5mi radius shows these)
      {name:'Shell',     dist:0.4, bear:45},  {name:'Circle K',  dist:0.8, bear:120},
      {name:'Exxon',     dist:1.1, bear:200}, {name:'Marathon',  dist:1.5, bear:300},
      // ~2-5 mi (10mi radius adds these)
      {name:'BP',        dist:2.2, bear:30},  {name:'Chevron',   dist:2.8, bear:150},
      {name:'QuikTrip',  dist:3.4, bear:250}, {name:'Wawa',      dist:4.1, bear:330},
      // ~5-15 mi (15mi radius adds these)
      {name:'Murphy USA',dist:5.5, bear:60},  {name:'Sunoco',    dist:7.2, bear:170},
      {name:'RaceTrac',  dist:9.1, bear:280}, {name:'Pilot',     dist:11.3,bear:350},
      // ~15-30 mi (30mi radius adds these)
      {name:'Flying J',  dist:16.2,bear:45},  {name:'Loves',   dist:19.8,bear:130},
      {name:'Mobil',     dist:23.4,bear:220}, {name:'Speedway',  dist:27.1,bear:310},
      {name:'Caseys',  dist:28.8,bear:80},  {name:'Kwik Trip', dist:29.5,bear:190},
    ]
    return stationDefs.map((s,i)=>{
      // Convert bearing + distance to lat/lng offset
      const bearRad = s.bear * Math.PI / 180
      const distDeg = s.dist / 69.0 // approx degrees per mile
      const slat = lat + distDeg * Math.cos(bearRad)
      const slng = lng + distDeg * Math.sin(bearRad) / Math.cos(lat * Math.PI/180)
      const prices = simulatePrices(base + s.dist * 0.003) // slightly higher further away
      return {
        id:i+1, name:s.name,
        address:`${s.name} · ${s.dist.toFixed(1)} mi from you`,
        lat:slat, lng:slng, distance:s.dist,
        ...prices,
        trending:['down','stable','up'][Math.floor(Math.random()*3)],
        updated:`${Math.floor(Math.random()*20)+1}m ago`
      }
    })
  }

  const fetchData=useCallback(async(lat:number,lng:number)=>{
    setLoading(true);setLocStatus('Fetching prices...')
    try{
      const eiaRes=await fetch('/api/gas-prices');const eiaData=await eiaRes.json()
      const base=eiaData.prices?.[0]?.price??3.15
      if(eiaData.prices?.length) setHistory([...eiaData.prices].reverse().map((p:any)=>({day:p.period.slice(5),price:p.price})))
      // Fetch stations at multiple offsets to get more coverage
      const offsets = [{dlat:0,dlng:0},{dlat:.05,dlng:.05},{dlat:-.05,dlng:.05},{dlat:.05,dlng:-.05},{dlat:-.05,dlng:-.05}]
      const allFetches = await Promise.allSettled(offsets.map(o=>fetch(`/api/stations?lat=${lat+o.dlat}&lng=${lng+o.dlng}`).then(r=>r.json())))
      const allReal: any[] = []
      const seen = new Set<string>()
      allFetches.forEach(r=>{ if(r.status==='fulfilled'&&r.value.stations){ r.value.stations.forEach((st:any)=>{ const key=`${st.name}-${st.lat?.toFixed(3)}-${st.lng?.toFixed(3)}`; if(!seen.has(key)){seen.add(key);allReal.push(st)} }) } })
      if(allReal.length){
        const enriched=allReal.map((st:any,i:number)=>({
          ...st,id:i+1,...simulatePrices(base),
          distance:distanceMiles(lat,lng,st.lat,st.lng),
          trending:['down','stable','up'][Math.floor(Math.random()*3)],updated:`${Math.floor(Math.random()*10)+1}m ago`
        }))
        // Add fallbacks at further distances (10-30mi) that API won't return
        const fallbacks = buildFallbackStations(lat,lng,base).filter(f=>f.distance>Math.max(...enriched.map(e=>e.distance))+2)
        const combined = [...enriched, ...fallbacks].map((s,i)=>({...s,id:i+1}))
        setStations(combined);setLocStatus(`${combined.length} stations found`)
        setMapKey(`${lat.toFixed(3)}-${lng.toFixed(3)}-${Date.now()}`)
        // Load EV chargers
        try {
          const evRes = await fetch(`/api/ev-stations?lat=${lat}&lng=${lng}`)
          const evData = await evRes.json()
          setEvStations(evData.stations?.length ? evData.stations : buildFallbackEV(lat,lng))
        } catch { setEvStations(buildFallbackEV(lat,lng)) }
      } else {
        const enriched = buildFallbackStations(lat, lng, base)
        setStations(enriched);setLocStatus(`${enriched.length} stations found`)
        setMapKey(`fb-${Date.now()}`)
      }
    }catch(e){
      const enriched = buildFallbackStations(AUBURN_LAT, AUBURN_LNG, 3.15)
      setStations(enriched);setLocStatus('Sample data')
      setMapKey(`err-${Date.now()}`)
    }
    setLoading(false)
    try{const{data:{user}}=await supabase.auth.getUser();if(user)await supabase.from('profiles').update({last_location_lat:lat,last_location_lng:lng,last_seen_at:new Date().toISOString()}).eq('id',user.id)}catch(e){}
  },[])

  const radiusMiles = RADIUS_MILES[radius-1]
  const inRadius = stations.filter(s=>s.distance<=radiusMiles)
  const sorted=[...stations].sort((a:any,b:any)=>a[gk(grade)]-b[gk(grade)])
  const sortedInRadius=[...inRadius].sort((a:any,b:any)=>a[gk(grade)]-b[gk(grade)])
  const best=sortedInRadius[0]??sorted[0]
  const sel=stations.find(s=>s.id===selId)
  const bestPrice=best?.[gk(grade)]??3.04
  const avgPrice=inRadius.reduce((s,st)=>s+(st as any)[gk(grade)],0)/Math.max(inRadius.length,1)
  const spread=inRadius.length?Math.max(...inRadius.map((s:any)=>s[gk(grade)]))-Math.min(...inRadius.map((s:any)=>s[gk(grade)])):0
  const stateGas=STATE_GAS[userState]
  const favSts=sorted.filter(s=>favorites.has(s.id))

  const glass=(extra:any={})=>({background:'rgba(255,255,255,.65)',backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',border:'0.5px solid rgba(255,255,255,.92)',borderRadius:18,...extra})

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes loadSlide{0%{left:-40%}100%{left:100%}}
        .st-row{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:0.5px solid rgba(0,0,0,.05);cursor:pointer;transition:background .15s}
        .st-row:last-child{border-bottom:none}
        .st-row:hover{background:rgba(255,255,255,.5)}
        .st-row.sel{background:rgba(255,59,48,.05)}
        .star-btn{background:none;border:none;cursor:pointer;font-size:17px;transition:transform .2s;flex-shrink:0;padding:2px;line-height:1}
        .star-btn:hover{transform:scale(1.25)}
        .leaflet-control-zoom{border:none!important}
        .leaflet-control-zoom a{background:rgba(255,255,255,.9)!important;border:1px solid rgba(0,0,0,.1)!important;margin-bottom:3px!important;border-radius:8px!important;display:block!important}
        .leaflet-popup-content-wrapper{border-radius:14px!important}
      `}</style>

      {reportSt&&!showThanks&&<ReportModal station={reportSt} onClose={()=>setReportSt(null)} onDone={()=>{setReportSt(null);setThanks(true)}}/>}
      {showThanks&&<ThanksModal onClose={()=>setThanks(false)}/>}
      {mapsSt&&<MapsModal station={mapsSt} destination={destination} onClose={()=>setMapsSt(null)}/>}

      <div style={{background:'#f0eff4',backgroundImage:'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,.09) 0%,transparent 55%)',minHeight:'100vh',padding:'14px 14px 80px',color:'#1a1a2e'}}>
        <TrialBanner daysLeft={daysLeft}/>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
          <div>
            <Link href="/dashboard" style={{fontSize:11,color:'rgba(26,26,46,.4)',textDecoration:'none',display:'flex',alignItems:'center',gap:4,marginBottom:6}}>← Dashboard</Link>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'2.5px',color:'#ff3b30',textTransform:'uppercase',marginBottom:4}}>⛽ Fuel Intelligence</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:30,fontWeight:900,letterSpacing:-2,lineHeight:1}}>GAS <span style={{color:'#ff3b30'}}>PRICES</span></div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
            <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,59,48,.08)',border:'0.5px solid rgba(255,59,48,.2)',borderRadius:100,padding:'5px 12px',fontSize:10,fontWeight:700,color:'#cc2018'}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:'#ff3b30',animation:'lp 1.4s ease infinite'}}/>{loading?'FETCHING...':'LIVE · EIA DATA'}
            </div>
            <div style={{fontSize:10,color:'rgba(26,26,46,.4)'}}>{locStatus}</div>
            <button onClick={()=>navigator.geolocation?.getCurrentPosition(p=>{const{latitude:lat,longitude:lng}=p.coords;setCoords({lat,lng});fetchData(lat,lng)},()=>{},{enableHighAccuracy:true,timeout:8000})} style={{background:'rgba(255,255,255,.65)',border:'0.5px solid rgba(255,255,255,.9)',borderRadius:100,padding:'5px 12px',fontSize:11,fontWeight:600,color:'rgba(26,26,46,.6)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>📍 Update location</button>
          </div>
        </div>

        {loading&&<div style={{height:2,background:'rgba(0,0,0,.06)',borderRadius:1,overflow:'hidden',marginBottom:12,position:'relative'}}><div style={{position:'absolute',height:'100%',width:'40%',background:'linear-gradient(90deg,transparent,#ff3b30,transparent)',animation:'loadSlide 1.2s ease-in-out infinite'}}/></div>}

        {/* Grade pills */}
        <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
          {GRADES.map(g=><button key={g} onClick={()=>setGrade(g)} style={{padding:'7px 16px',borderRadius:100,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",border:'0.5px solid',transition:'all .2s',background:grade===g?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(255,255,255,.65)',color:grade===g?'#fff':'rgba(26,26,46,.6)',borderColor:grade===g?'transparent':'rgba(255,255,255,.9)',boxShadow:grade===g?'0 4px 12px rgba(255,59,48,.3)':'none'}}>{g}</button>)}
        </div>

        {/* MAP */}
        <GasMap
          key={mapKey}
          stations={sorted}
          grade={grade}
          selectedId={selId}
          onSelect={id=>setSelId(p=>p===id?null:id)}
          userCoords={userCoords}
          radius={radius}
          onReport={()=>setReportSt(sel||sorted[0]||null)}
          onRadiusChange={setRadius}
        />

        {/* Radius rings */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,marginBottom:14}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>Search radius</div>
          <div style={{display:'flex',gap:12}}>
            {[{v:1,mi:'5'},{v:2,mi:'10'},{v:3,mi:'15'},{v:4,mi:'30'}].map(r=>{
              const on=radius===r.v
              return <button key={r.v} onClick={()=>setRadius(r.v)} style={{width:58,height:58,borderRadius:'50%',border:`3px solid ${on?'#ff3b30':'rgba(255,255,255,.9)'}`,background:on?'rgba(255,59,48,.1)':'rgba(255,255,255,.65)',backdropFilter:'blur(20px)',boxShadow:on?'0 0 0 6px rgba(255,59,48,.12)':'none',transform:on?'scale(1.08)':'scale(1)',transition:'all .25s cubic-bezier(.34,1.56,.64,1)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif"}}>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:900,letterSpacing:-1,color:on?'#ff3b30':'#1a1a2e',lineHeight:1}}>{r.mi}</div>
                <div style={{fontSize:9,fontWeight:600,color:on?'#cc2018':'rgba(26,26,46,.5)',marginTop:2}}>miles</div>
              </button>
            })}
          </div>
          <div style={{fontSize:11,color:'rgba(26,26,46,.45)',fontWeight:500}}>{inRadius.length} stations · {RADIUS_LABELS[radius-1]}</div>
        </div>

        {/* Cheapest KPI */}
        <div style={{background:'rgba(255,59,48,.07)',border:'0.5px solid rgba(255,59,48,.22)',borderRadius:18,padding:'14px 18px',marginBottom:10,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:1.5,background:'linear-gradient(90deg,transparent,#ff3b30,transparent)'}}/>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:4}}>Cheapest nearby</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:34,fontWeight:900,letterSpacing:-2,color:'#ff3b30',lineHeight:1}}>${bestPrice.toFixed(2)}</div>
              <div style={{fontSize:12,color:'rgba(26,26,46,.5)',marginTop:5}}>{best?.name} · {best?.address} · {best?.distance} mi</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:3}}>Price spread</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:900,letterSpacing:-1,color:'#ff9f0a'}}>${spread.toFixed(2)}</div>
              <div style={{fontSize:10,color:'rgba(26,26,46,.4)'}}>cheapest → priciest</div>
            </div>
          </div>
        </div>

        {/* Area avg vs State avg */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <div style={{...glass({padding:'14px 16px',flex:1})}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,26,46,.4)',marginBottom:5}}>Area average</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,letterSpacing:-1.5,color:'#1a1a2e',lineHeight:1}}>${avgPrice.toFixed(2)}</div>
            <div style={{fontSize:11,color:'rgba(26,26,46,.45)',marginTop:4}}>{inRadius.length} within {radiusMiles} miles</div>
          </div>
          <div style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <div style={{width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,.65)',backdropFilter:'blur(20px)',border:'0.5px solid rgba(255,255,255,.92)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'rgba(26,26,46,.4)',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>vs</div>
            <div style={{fontSize:8,fontWeight:700,color:'rgba(26,26,46,.3)',letterSpacing:.5}}>EIA</div>
          </div>
          <div style={{...glass({padding:'14px 16px',flex:1,background:'rgba(48,209,88,.07)',border:'0.5px solid rgba(48,209,88,.25)'})}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,26,46,.4)',marginBottom:5}}>{userState} avg</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,letterSpacing:-1.5,color:'#30d158',lineHeight:1}}>${stateGas?.avg.toFixed(2)??'—'}</div>
            <div style={{fontSize:11,color:'#30d158',marginTop:4}}>{stateGas?(bestPrice<stateGas.avg?'↓ below state avg':'↑ above state avg'):'EIA.gov'}</div>
          </div>
        </div>

        {/* Selected station */}
        {sel&&(
          <div style={{background:'rgba(255,59,48,.07)',border:'0.5px solid rgba(255,59,48,.22)',borderRadius:20,padding:'16px 18px',marginBottom:12,position:'relative',overflow:'hidden',animation:'fadeUp .3s ease'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:1.5,background:'linear-gradient(90deg,transparent,#ff3b30,transparent)'}}/>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
              <div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase',marginBottom:4}}>Selected Station</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e'}}>{sel.name}</div>
                <div style={{fontSize:11,color:'rgba(26,26,46,.5)',marginTop:2}}>📍 {sel.address} · {sel.distance} mi</div>
              </div>
              <button className="star-btn" onClick={()=>setFavorites(p=>{const n=new Set(p);n.has(sel.id)?n.delete(sel.id):n.add(sel.id);return n})} style={{fontSize:22}}>{favorites.has(sel.id)?'⭐':'☆'}</button>
            </div>
            <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:12}}>
              {GRADES.map(g=><div key={g} style={{textAlign:'center'}}><div style={{fontSize:8,fontWeight:700,letterSpacing:'1.5px',color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>{g}</div><div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,color:g===grade?'#ff3b30':'#1a1a2e',marginTop:3}}>${(sel as any)[gk(g)].toFixed(2)}</div></div>)}
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button onClick={()=>setMapsSt(sel)} style={{flex:1,padding:'10px 14px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:14,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 12px rgba(255,59,48,.3)'}}>🗺️ Open in Maps →</button>
              {destination&&<button onClick={()=>{const isApple=/iPhone|iPad|iPod|Mac/.test(navigator.userAgent);if(isApple)window.open(`maps://maps.apple.com/?saddr=Current+Location&daddr=${encodeURIComponent(destination)}&via=${encodeURIComponent(sel.name+', '+sel.address)}&dirflag=d`);else window.open(`https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(sel.name+', '+sel.address)}&travelmode=driving`)}} style={{flex:1,padding:'10px 14px',background:'rgba(10,132,255,.1)',border:'0.5px solid rgba(10,132,255,.3)',borderRadius:14,fontSize:12,fontWeight:700,color:'#0a84ff',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",textAlign:'center',lineHeight:1.3}}>⛽ Add gas stop<br/><span style={{fontSize:10,opacity:.7}}>along your route</span></button>}
              <button onClick={()=>setReportSt(sel)} style={{padding:'10px 14px',background:'rgba(255,255,255,.65)',border:'0.5px solid rgba(255,255,255,.9)',borderRadius:14,fontSize:12,fontWeight:600,color:'rgba(26,26,46,.6)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>📍 Report</button>
            </div>
          </div>
        )}

        {/* Station list */}
        <div style={{...glass({overflow:'hidden',marginBottom:12,padding:0})}}>
          <div style={{padding:'10px 16px',borderBottom:'0.5px solid rgba(0,0,0,.05)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,26,46,.4)'}}>{sorted.length} Stations Found</div>
            <div style={{display:'flex',gap:4}}>
              <button style={{fontSize:9,padding:'3px 8px',borderRadius:100,background:'rgba(255,59,48,.1)',color:'#cc2018',border:'0.5px solid rgba(255,59,48,.25)',fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Price</button>
              <button style={{fontSize:9,padding:'3px 8px',borderRadius:100,background:'rgba(255,255,255,.5)',color:'rgba(26,26,46,.4)',border:'0.5px solid rgba(0,0,0,.08)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Distance</button>
            </div>
          </div>
          <div style={{padding:'9px 16px',borderBottom:'0.5px solid rgba(0,0,0,.05)',display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:13}}>🏁</span>
            <input value={destination} onChange={e=>setDest(e.target.value)} placeholder="Add destination — gas stop becomes a waypoint (optional)" style={{flex:1,background:'none',border:'none',outline:'none',fontSize:11,color:'rgba(26,26,46,.6)',fontFamily:"'DM Sans',sans-serif"}}/>
          </div>
          {(showAllSt?sorted:sorted.slice(0,3)).map((st,i)=>(
            <div key={st.id} className={`st-row${selId===st.id?' sel':''}`} onClick={()=>setSelId(p=>p===st.id?null:st.id)}>
              <div style={{fontSize:11,fontWeight:700,color:i===0?'#30d158':'rgba(26,26,46,.35)',minWidth:14,textAlign:'center'}}>{i===0?'★':i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#1a1a2e'}}>{st.name}</div>
                <div style={{fontSize:10,color:'rgba(26,26,46,.4)',marginTop:1}}>{st.address} · {st.distance} mi</div>
              </div>
              <button className="star-btn" onClick={e=>{e.stopPropagation();setFavorites(p=>{const n=new Set(p);n.has(st.id)?n.delete(st.id):n.add(st.id);return n})}}>{favorites.has(st.id)?'⭐':'☆'}</button>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,letterSpacing:-.5,color:i===0?'#30d158':'#1a1a2e'}}>${(st as any)[gk(grade)].toFixed(2)}</div>
                {/* Grade grid — tap any grade to switch */}
                <div style={{display:'flex',gap:2,marginTop:4,flexWrap:'wrap'}}>
                  {GRADES.filter(g=>(st as any)[gk(g)]>0).map(g=>(
                    <div key={g} onClick={e=>{e.stopPropagation();setGrade(g);setShowEV(false)}} style={{textAlign:'center',background:grade===g&&!showEV?'rgba(255,59,48,.08)':'rgba(26,26,46,.03)',border:`0.5px solid ${grade===g&&!showEV?'rgba(255,59,48,.2)':'rgba(26,26,46,.07)'}`,borderRadius:7,padding:'3px 5px',minWidth:33,cursor:'pointer',transition:'all .15s'}}>
                      <div style={{fontSize:8,fontWeight:700,color:grade===g&&!showEV?'#cc2018':'rgba(26,26,46,.35)',marginBottom:1}}>{GRADE_LABELS[g]}</div>
                      <div style={{fontSize:10,fontWeight:800,color:grade===g&&!showEV?'#1a1a2e':'rgba(26,26,46,.55)',fontFamily:"'Sora',sans-serif"}}>{(st as any)[gk(g)].toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:11,fontWeight:700,color:st.trending==='down'?'#30d158':st.trending==='up'?'#ff453a':'rgba(26,26,46,.35)'}}>{st.trending==='down'?'↓':st.trending==='up'?'↑':'→'}</div>
              </div>
            </div>
          ))}
          {/* Show more / less button */}
          {!showEV && sorted.length > 3 && (
            <button onClick={()=>setShowAllSt(p=>!p)} style={{width:'100%',padding:'11px',background:'none',border:'none',borderTop:'0.5px solid rgba(0,0,0,.05)',fontSize:12,fontWeight:700,color:'#ff3b30',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              {showAllSt ? '↑ Show less' : `Show all ${sorted.length} stations →`}
            </button>
          )}

          {/* EV station list */}
          {showEV && (
            <div style={{padding:'0 0 8px'}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:'rgba(26,26,46,.4)',textTransform:'uppercase',padding:'12px 14px 8px'}}>
                {evStations.length} EV chargers nearby · sorted by availability
              </div>
              {evStations.sort((a,b)=>b.available-a.available).map((ev,i)=>{
                const allFull = ev.available === 0
                const statusColor = allFull ? '#cc2018' : ev.available<ev.ports/2 ? '#ff9f0a' : '#30d158'
                const statusBg    = allFull ? 'rgba(255,59,48,.08)' : ev.available<ev.ports/2 ? 'rgba(255,159,10,.08)' : 'rgba(48,209,88,.08)'
                const statusBd    = allFull ? 'rgba(255,59,48,.25)' : ev.available<ev.ports/2 ? 'rgba(255,159,10,.3)' : 'rgba(48,209,88,.3)'
                return (
                  <div key={ev.id} style={{margin:'0 8px 8px',padding:'12px 14px',background:'rgba(255,255,255,.65)',backdropFilter:'blur(24px)',border:'0.5px solid rgba(255,255,255,.92)',borderRadius:16,position:'relative',overflow:'hidden'}}>
                    {!allFull && <div style={{position:'absolute',top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,transparent,${statusColor},transparent)`}}/>}
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:8}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                          <span style={{fontSize:13,fontWeight:700,color:'#1a1a2e'}}>⚡ {ev.name}</span>
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:100,background:statusBg,border:`0.5px solid ${statusBd}`,color:statusColor}}>
                            {allFull ? 'All full' : `${ev.available} of ${ev.ports} open`}
                          </span>
                        </div>
                        <div style={{fontSize:11,color:'rgba(26,26,46,.45)',marginBottom:6}}>{ev.distance} mi · {ev.address}</div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <span style={{fontSize:10,padding:'2px 8px',borderRadius:100,background:'rgba(26,26,46,.05)',border:'0.5px solid rgba(26,26,46,.08)',color:'rgba(26,26,46,.55)',fontWeight:500}}>{ev.network}</span>
                          <span style={{fontSize:10,padding:'2px 8px',borderRadius:100,background:'rgba(26,26,46,.05)',border:'0.5px solid rgba(26,26,46,.08)',color:'rgba(26,26,46,.55)',fontWeight:500}}>{ev.level}</span>
                          <span style={{fontSize:10,padding:'2px 8px',borderRadius:100,background:'rgba(26,26,46,.05)',border:'0.5px solid rgba(26,26,46,.08)',color:'rgba(26,26,46,.55)',fontWeight:500}}>{ev.kw}kW</span>
                        </div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:900,color:'#1a1a2e',letterSpacing:-0.5}}>{ev.cost==='Free'?'Free':'$'+ev.cost}</div>
                        <div style={{fontSize:10,color:'rgba(26,26,46,.4)',marginTop:1}}>{ev.costUnit||'per charge'}</div>
                      </div>
                    </div>
                    {allFull && <div style={{fontSize:10,color:'rgba(26,26,46,.45)',marginTop:2}}>⏱ Estimated wait: 15–30 min</div>}
                    <button onClick={()=>{
                      const q=encodeURIComponent(`${ev.name}, ${ev.address}`)
                      const isApple=/iPhone|iPad|iPod|Mac/.test(navigator.userAgent)
                      if(isApple) window.open(`maps://maps.apple.com/?daddr=${q}&dirflag=d`)
                      else window.open(`https://www.google.com/maps/search/?api=1&query=${q}`)
                    }} style={{marginTop:8,padding:'8px 14px',borderRadius:100,border:'0.5px solid rgba(48,209,88,.3)',background:'rgba(48,209,88,.08)',color:'#1a7a35',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',system-ui,sans-serif"}}>
                      🗺️ Navigate →
                    </button>
                  </div>
                )
              })}
              <div style={{fontSize:10,color:'rgba(26,26,46,.3)',textAlign:'center',padding:'4px 14px 8px',lineHeight:1.6}}>
                EV data from Open Charge Map · Availability updated every 5 min · Verify pricing at charger
              </div>
            </div>
          )}
        </div>

        {/* Favorites trends */}
        <div style={{...glass({padding:'18px',marginBottom:12})}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,26,46,.4)'}}>{favSts.length>0?'⭐ Favorite Trends':'Station Trends · Last 7 Days'}</div>
            {favSts.length===0&&<div style={{fontSize:11,color:'rgba(26,26,46,.4)'}}>☆ Star a station to track it</div>}
          </div>
          {(favSts.length>0?favSts:sorted.slice(0,3)).map((st,i,arr)=>{
            const price=(st as any)[gk(grade)],td=st.trending
            const days=['Mon','Tue','Wed','Thu','Fri','Sat','Today']
            const delta=td==='down'?-0.018:td==='up'?0.014:0.002
            const pts=days.map((_,j)=>+(price+(days.length-1-j)*delta+(Math.random()*.008-.004)).toFixed(3))
            const mn=Math.min(...pts),mx=Math.max(...pts),rng=(mx-mn)||0.05
            const H=44,coords=pts.map((p,j)=>({x:j/(pts.length-1)*280,y:H-((p-mn)/rng)*(H-8)-4}))
            const d=coords.map((c,j)=>j===0?`M${c.x},${c.y}`:`L${c.x},${c.y}`).join(' ')
            const f=d+` L${coords[coords.length-1].x},${H} L0,${H} Z`
            const col=td==='down'?'#30d158':td==='up'?'#ff453a':'#ff9f0a'
            return(
              <div key={st.id} style={{paddingBottom:i<arr.length-1?16:0,marginBottom:i<arr.length-1?16:0,borderBottom:i<arr.length-1?'0.5px solid rgba(0,0,0,.06)':'none'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                  <div>
                    {i===0&&favSts.length===0&&<div style={{fontSize:9,fontWeight:700,background:'rgba(48,209,88,.1)',color:'#1a7a35',border:'0.5px solid rgba(48,209,88,.3)',borderRadius:100,padding:'1px 8px',display:'inline-block',marginBottom:3}}>★ CHEAPEST</div>}
                    {favSts.length>0&&<span style={{fontSize:13,marginRight:5}}>⭐</span>}
                    <span style={{fontSize:13,fontWeight:700,color:'#1a1a2e'}}>{st.name}</span>
                    <div style={{fontSize:10,color:'rgba(26,26,46,.4)',marginTop:1}}>{st.address} · {st.distance} mi</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{fontSize:9,fontWeight:700,color:col,background:`${col}18`,border:`0.5px solid ${col}40`,borderRadius:100,padding:'2px 9px'}}>{td==='down'?'↓ dropping':td==='up'?'↑ rising':'→ stable'}</div>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,letterSpacing:-.5,color:i===0&&favSts.length===0?'#30d158':'#1a1a2e'}}>${price.toFixed(2)}</div>
                  </div>
                </div>
                <svg viewBox={`0 0 280 ${H}`} style={{width:'100%',height:H,display:'block'}} preserveAspectRatio="none">
                  <defs><linearGradient id={`tg${st.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity=".18"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs>
                  <path d={f} fill={`url(#tg${st.id})`}/><path d={d} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx={coords[coords.length-1].x} cy={coords[coords.length-1].y} r="3.5" fill={col}/>
                </svg>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'rgba(26,26,46,.35)',marginTop:3}}>{days.map(d=><span key={d}>{d}</span>)}</div>
              </div>
            )
          })}
        </div>

        {/* 30-day chart */}
        <div style={{...glass({padding:'18px',marginBottom:12})}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,26,46,.4)'}}>Your Area · 30-Day Trend</div>
            <div style={{fontSize:9,color:'rgba(26,26,46,.4)'}}>EIA {userState} · Regular</div>
          </div>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:10}}>
            <div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:900,letterSpacing:-1.5,color:'#ff3b30',lineHeight:1}}>${bestPrice.toFixed(2)}</div>
              <div style={{fontSize:11,fontWeight:700,color:'#30d158',marginTop:3}}>↓ ${(stateGas?Math.abs(stateGas.avg-bestPrice+.15):.19).toFixed(2)} vs 30 days ago</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:9,color:'rgba(26,26,46,.4)',marginBottom:2}}>30-day range</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:700,color:'#1a1a2e'}}>${(bestPrice-.19).toFixed(2)} — ${(bestPrice+.12).toFixed(2)}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={history} margin={{top:4,right:0,left:-34,bottom:0}}>
              <defs><linearGradient id="ag30" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff3b30" stopOpacity=".15"/><stop offset="95%" stopColor="#ff3b30" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="day" tick={{fontFamily:'system-ui',fontSize:8,fill:'rgba(26,26,46,.35)'}} axisLine={false} tickLine={false}/>
              <YAxis domain={['auto','auto']} tick={{fontFamily:'system-ui',fontSize:8,fill:'rgba(26,26,46,.35)'}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`$${v.toFixed(2)}`}/>
              <Tooltip contentStyle={{background:'rgba(255,255,255,.95)',border:'0.5px solid rgba(255,59,48,.2)',borderRadius:10,fontFamily:'system-ui',fontSize:12}}/>
              <ReferenceLine y={avgPrice} stroke="rgba(26,26,46,.2)" strokeDasharray="3 3"/>
              <Area type="monotone" dataKey="price" stroke="#ff3b30" strokeWidth={2} fill="url(#ag30)" dot={false} activeDot={{r:4,fill:'#ff3b30'}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {!isBasicPlan ? <RouteGasFinder userCoords={userCoords} basePrice={bestPrice} isDark={false}/> : null}
        <div style={{fontSize:9,color:'rgba(26,26,46,.3)',textAlign:'center',letterSpacing:.5,paddingTop:8}}>DATA: EIA.GOV · GOOGLE PLACES · INFORMATIONAL USE ONLY</div>
      </div>
    </>
  )
}

export default function GasPage(){
  const{allowed,checking,daysLeft}=usePaywall('driver')
  const[phase,setPhase]=React.useState<'loading'|'taste'|'paywall'|'access'>('loading')
  React.useEffect(()=>{
    if(checking) return
    if(allowed){setPhase('access');return}
    const raw=localStorage.getItem('gratia_signup_time')
    if(raw&&Date.now()-parseInt(raw)<3*60*1000){setPhase('taste');return}
    if(raw) localStorage.removeItem('gratia_signup_time')
    setPhase('paywall')
  },[checking,allowed])
  if(phase==='loading'||checking) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0eff4',fontFamily:'system-ui',color:'rgba(0,0,0,.4)',fontSize:14}}>Loading...</div>
  if(phase==='paywall') return <SubscribeScreen/>
  if(phase==='access') return <GasPageContent daysLeft={daysLeft}/>
  return <><GasPageContent daysLeft={null}/><TasteTimer onExpire={()=>{localStorage.removeItem('gratia_signup_time');setPhase('paywall')}}/></>
}

function SubscribeScreen(){
  const router=useRouter()
  const[loading,setLoading]=React.useState(false)
  const[err,setErr]=React.useState('')
  const handleSubscribe=async()=>{
    setLoading(true);setErr('')
    try{
      const{data:{user}}=await supabase.auth.getUser()
      if(!user){router.push('/');return}
      const res=await fetch('/api/create-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id,email:user.email,userType:'driver'})})
      const data=await res.json()
      if(data.url) window.location.href=data.url
      else throw new Error(data.error||'No URL')
    }catch(e:any){setErr(e.message||'Something went wrong');setLoading(false)}
  }
  return(
    <div style={{minHeight:'100vh',background:'#f0eff4',fontFamily:"'DM Sans',system-ui,sans-serif",display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
      <div style={{maxWidth:420,width:'100%',background:'rgba(255,255,255,.9)',border:'2px solid rgba(255,59,48,.25)',borderRadius:28,padding:'28px 24px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,transparent,#ff3b30,transparent)'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
          <div><div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase',marginBottom:6}}>⭐ Live Now</div><div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:'#1a1a2e'}}>Core Pass</div></div>
          <div style={{textAlign:'right'}}><div style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:900,letterSpacing:-1.5,color:'#ff3b30',lineHeight:1}}>$4.99</div><div style={{fontSize:12,color:'rgba(26,26,46,.4)'}}>/mo after trial</div></div>
        </div>
        {['Real-time gas prices near you','Route gas finder','USA price map all 50 states','Price trend tracking'].map((f,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'rgba(26,26,46,.7)',marginBottom:7}}><span style={{color:'#ff3b30',fontWeight:700}}>✓</span>{f}</div>
        ))}
        {err&&<div style={{background:'rgba(255,59,48,.08)',border:'1px solid rgba(255,59,48,.2)',borderRadius:12,padding:'10px 14px',marginTop:12,fontSize:12,color:'#cc2018'}}>⚠️ {err}</div>}
        <button onClick={handleSubscribe} disabled={loading} style={{width:'100%',padding:14,marginTop:16,background:loading?'rgba(255,59,48,.3)':'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:100,fontSize:15,fontWeight:800,cursor:loading?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif"}}>{loading?'Loading...':'Start Free Trial — $4.99/mo →'}</button>
      </div>
      <button onClick={()=>router.push('/dashboard')} style={{marginTop:16,background:'none',border:'none',color:'rgba(26,26,46,.35)',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>← Back to dashboard</button>
    </div>
  )
}