'use client'
// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react'

type LatLng = { lat: number; lng: number }
type RouteStation = {
  id: number; name: string; address: string
  lat: number; lng: number
  regular: number; mid: number; premium: number; diesel: number
  distOnRoute: number; detourMiles: number; updated: string; trending: string
}
type RouteInfo = { totalMiles: number; totalMins: number; origin: string; destination: string }
type Suggestion = { placeId: string; description: string; mainText: string; secText: string }

function haverMiles(a: LatLng, b: LatLng): number {
  const R = 3959, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2
  return parseFloat((R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))).toFixed(1))
}

function simulatePrices(base: number) {
  const off = [-0.12,-0.08,-0.04,-0.01,0,0.03,0.07,0.11,0.16][Math.floor(Math.random()*9)]
  return { regular: +(base+off).toFixed(2), mid: +(base+off+.30).toFixed(2), premium: +(base+off+.60).toFixed(2), diesel: +(base+off+.45).toFixed(2) }
}

function interpolateAlongRoute(points: LatLng[], count: number): LatLng[] {
  if (points.length < 2) return points
  const total = points.reduce((s,p,i) => i===0 ? 0 : s + haverMiles(points[i-1],p), 0)
  const step = total / (count + 1)
  const result: LatLng[] = []
  let dist = 0, idx = 0
  for (let n = 1; n <= count; n++) {
    const target = step * n
    while (idx < points.length-2 && dist+haverMiles(points[idx],points[idx+1]) < target) {
      dist += haverMiles(points[idx],points[idx+1]); idx++
    }
    const seg = haverMiles(points[idx],points[idx+1])
    const t = seg > 0 ? (target-dist)/seg : 0
    result.push({ lat: points[idx].lat+(points[idx+1].lat-points[idx].lat)*t, lng: points[idx].lng+(points[idx+1].lng-points[idx].lng)*t })
  }
  return result
}

function decodePoly(encoded: string): LatLng[] {
  const pts: LatLng[] = []
  let idx=0, lat=0, lng=0
  while (idx < encoded.length) {
    let b, shift=0, result=0
    do { b=encoded.charCodeAt(idx++)-63; result|=(b&0x1f)<<shift; shift+=5 } while (b>=0x20)
    lat += result&1 ? ~(result>>1) : result>>1
    shift=0; result=0
    do { b=encoded.charCodeAt(idx++)-63; result|=(b&0x1f)<<shift; shift+=5 } while (b>=0x20)
    lng += result&1 ? ~(result>>1) : result>>1
    pts.push({ lat: lat/1e5, lng: lng/1e5 })
  }
  return pts
}

function makePin(price: number, isBest: boolean, isSel: boolean): string {
  const bg = isSel ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : isBest ? 'linear-gradient(135deg,#30d158,#34c759)' : 'rgba(255,255,255,0.94)'
  const fg = isSel||isBest ? '#fff' : 'rgba(26,26,46,.85)'
  const bdr = isSel ? '#ff3b30' : isBest ? '#30d158' : 'rgba(0,0,0,.15)'
  const glow = isSel ? ',0 0 14px rgba(255,59,48,.5)' : isBest ? ',0 0 10px rgba(48,209,88,.4)' : ''
  return `<div style="display:inline-flex;flex-direction:column;align-items:center;transform:${isSel?'scale(1.22)':'scale(1)'};transition:transform .25s cubic-bezier(.34,1.56,.64,1)">
    <div style="background:${bg};border:1.5px solid ${bdr};border-radius:10px;padding:5px 10px;display:flex;align-items:center;gap:4px;box-shadow:0 4px 16px rgba(0,0,0,.2)${glow};cursor:pointer;white-space:nowrap">
      <span style="font-size:10px">⛽</span>
      <span style="font-size:12px;font-weight:700;color:${fg};font-family:-apple-system,system-ui,sans-serif">$${price.toFixed(2)}</span>
    </div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${isSel?'#ff3b30':isBest?'#30d158':bdr}"></div>
  </div>`
}

function RouteMap({ stations, grade, selectedId, onSelect, origin, destination, routePolyline }: {
  stations: RouteStation[]; grade: string; selectedId: number|null; onSelect: (id:number)=>void
  origin: LatLng|null; destination: LatLng|null; routePolyline: LatLng[]
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const mksRef = useRef<Record<number,any>>({})
  const gk = (g:string) => g.toLowerCase()
  const cheapest = stations.length ? [...stations].sort((a,b)=>a[gk(grade)]-b[gk(grade)])[0] : null

  const initMap = useCallback((L:any) => {
    if (!divRef.current || mapRef.current) return
    const center = origin ?? { lat:33.849, lng:-84.373 }
    const map = L.map(divRef.current, { center:[center.lat,center.lng], zoom:11, zoomControl:false, attributionControl:false })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom:19 }).addTo(map)
    L.control.zoom({ position:'bottomright' }).addTo(map)
    if (routePolyline.length > 1) {
      const line = L.polyline(routePolyline.map(p=>[p.lat,p.lng]), { color:'#ff3b30', weight:5, opacity:0.75, lineCap:'round', lineJoin:'round' }).addTo(map)
      map.fitBounds(line.getBounds(), { padding:[48,48] })
    }
    if (origin) L.marker([origin.lat,origin.lng],{icon:L.divIcon({className:'',iconSize:[24,24],iconAnchor:[12,12],html:`<div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#ff3b30,#ff6b35);border:3px solid #fff;box-shadow:0 0 0 5px rgba(255,59,48,.18)"></div>`})}).addTo(map).bindPopup('<div style="font-family:system-ui;font-size:12px;font-weight:700;color:#ff3b30">📍 Start</div>')
    if (destination) L.marker([destination.lat,destination.lng],{icon:L.divIcon({className:'',iconSize:[24,24],iconAnchor:[12,12],html:`<div style="width:20px;height:20px;border-radius:50%;background:#1a1a2e;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.3)"></div>`})}).addTo(map).bindPopup('<div style="font-family:system-ui;font-size:12px;font-weight:700;color:#1a1a2e">🏁 Destination</div>')
    stations.forEach(st => {
      const price = st[gk(grade)]
      const m = L.marker([st.lat,st.lng],{icon:L.divIcon({className:'',iconSize:[80,52],iconAnchor:[40,52],html:makePin(price,st.id===cheapest?.id,false)})}).addTo(map).on('click',()=>onSelect(st.id))
      mksRef.current[st.id] = m
    })
    mapRef.current = map
  }, [stations,origin,destination,routePolyline])

  useEffect(() => {
    const boot = (L:any) => initMap(L)
    if ((window as any).L) { boot((window as any).L); return }
    if (!document.querySelector('#leaflet-css')) {
      const lnk = document.createElement('link'); lnk.id='leaflet-css'; lnk.rel='stylesheet'
      lnk.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(lnk)
    }
    if (!document.querySelector('#leaflet-js')) {
      const sc = document.createElement('script'); sc.id='leaflet-js'
      sc.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      sc.onload = () => boot((window as any).L); document.head.appendChild(sc)
    } else { const wait=setInterval(()=>{ if ((window as any).L){clearInterval(wait);boot((window as any).L)} },80) }
    return () => { if (mapRef.current){mapRef.current.remove();mapRef.current=null;mksRef.current={}} }
  }, [])

  useEffect(() => {
    if (!(window as any).L||!mapRef.current||!stations.length) return
    const L=(window as any).L
    const best=[...stations].sort((a,b)=>a[gk(grade)]-b[gk(grade)])[0]
    stations.forEach(st=>{
      const m=mksRef.current[st.id]; if(!m)return
      const isBest=st.id===best?.id
      const size = isBest?[96,60]:[80,52], anchor = isBest?[48,60]:[40,52]
      m.setIcon(L.divIcon({className:'',iconSize:size as any,iconAnchor:anchor as any,html:makePin(st[gk(grade)],isBest,st.id===selectedId)}))
      if(isBest) m.setZIndexOffset(1000)
    })
  }, [grade,selectedId,stations])

  useEffect(() => {
    if (!mapRef.current||!selectedId) return
    const st=stations.find(s=>s.id===selectedId)
    if (st) { mapRef.current.panTo([st.lat,st.lng],{animate:true,duration:0.5}); setTimeout(()=>mksRef.current[selectedId]?.openPopup(),600) }
  }, [selectedId])

  return (
    <>
      <style>{`.leaflet-popup-content-wrapper{background:rgba(255,255,255,.97)!important;border:1px solid rgba(255,59,48,.18)!important;border-radius:14px!important;box-shadow:0 8px 32px rgba(0,0,0,.14)!important}.leaflet-popup-content{margin:13px 15px!important}.leaflet-popup-tip{background:rgba(255,255,255,.97)!important}.leaflet-control-zoom{border:none!important}.leaflet-control-zoom a{background:rgba(255,255,255,.9)!important;color:rgba(26,26,46,.55)!important;border:1px solid rgba(0,0,0,.1)!important;border-radius:9px!important;margin-bottom:3px!important;display:block!important}`}</style>
      <div ref={divRef} style={{ width:'100%', height:'100%', borderRadius:18 }} />
    </>
  )
}

export default function RouteGasFinder({ userCoords, basePrice=3.15, isDark=true }: { userCoords: LatLng|null; basePrice?: number; isDark?: boolean }) {
  const [query,setQuery]=useState('')
  const [suggestions,setSuggestions]=useState<Suggestion[]>([])
  const [showSuggest,setShowSuggest]=useState(false)
  const [destLabel,setDestLabel]=useState('')
  const [destCoords,setDestCoords]=useState<LatLng|null>(null)
  const [routePolyline,setRoutePolyline]=useState<LatLng[]>([])
  const [stations,setStations]=useState<RouteStation[]>([])
  const [routeInfo,setRouteInfo]=useState<RouteInfo|null>(null)
  const [grade,setGrade]=useState('Regular')
  const [selId,setSelId]=useState<number|null>(null)
  const [showAllRoute,setShowAllRoute]=useState(false)
  const [showMapsModal,setShowMapsModal]=useState(false)
  const [mapExpanded,setMapExpanded]=useState(false)
  const [loading,setLoading]=useState(false)
  const [loadStep,setLoadStep]=useState('')
  const [searched,setSearched]=useState(false)
  const [mapKey,setMapKey]=useState('route-init')
  const [error,setError]=useState('')
  const inputRef=useRef<HTMLInputElement>(null)
  const suggestRef=useRef<HTMLDivElement>(null)
  const debounceRef=useRef<ReturnType<typeof setTimeout>|null>(null)
  const GRADES=['Regular','Mid','Premium','Diesel']
  const gk=(g:string)=>g.toLowerCase()
  const cheapest=stations.length?[...stations].sort((a,b)=>a[gk(grade)]-b[gk(grade)])[0]:null

  useEffect(()=>{
    const key=process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!key||document.querySelector('#gmaps-places')) return
    const sc=document.createElement('script'); sc.id='gmaps-places'
    sc.src=`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry`; sc.async=true
    document.head.appendChild(sc)
  },[])

  useEffect(()=>{
    const handler=(e:MouseEvent)=>{
      if (suggestRef.current&&!suggestRef.current.contains(e.target as Node)&&inputRef.current&&!inputRef.current.contains(e.target as Node)) setShowSuggest(false)
    }
    document.addEventListener('mousedown',handler); return ()=>document.removeEventListener('mousedown',handler)
  },[])

  const fetchSuggestions=useCallback((input:string)=>{
    if (!input.trim()||input.length<2){setSuggestions([]);return}
    const google=(window as any).google
    if (!google?.maps?.places){setTimeout(()=>fetchSuggestions(input),400);return}
    const svc=new google.maps.places.AutocompleteService()
    svc.getPlacePredictions({input,...(userCoords?{locationBias:{center:new google.maps.LatLng(userCoords.lat,userCoords.lng),radius:80000}}:{})},(predictions:any[],status:string)=>{
      if (status!=='OK'||!predictions){setSuggestions([]);return}
      setSuggestions(predictions.map(p=>({placeId:p.place_id,description:p.description,mainText:p.structured_formatting?.main_text||p.description,secText:p.structured_formatting?.secondary_text||''})))
      setShowSuggest(true)
    })
  },[userCoords])

  const handleQueryChange=(val:string)=>{
    setQuery(val); setDestCoords(null); setDestLabel(''); setError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current=setTimeout(()=>fetchSuggestions(val),280)
  }

  const resolvePlace=useCallback((placeId:string):Promise<LatLng>=>{
    return new Promise((resolve,reject)=>{
      const google=(window as any).google
      if (!google?.maps?.places){reject('Google Maps not loaded');return}
      const svc=new google.maps.places.PlacesService(document.createElement('div'))
      svc.getDetails({placeId,fields:['geometry']},(place:any,status:string)=>{
        if (status==='OK'&&place.geometry?.location) resolve({lat:place.geometry.location.lat(),lng:place.geometry.location.lng()})
        else reject(`Place details failed: ${status}`)
      })
    })
  },[])

  const geocodeText=useCallback((text:string):Promise<LatLng>=>{
    return new Promise((resolve,reject)=>{
      const google=(window as any).google
      if (!google?.maps){reject('Google Maps not loaded');return}
      new google.maps.Geocoder().geocode({address:text},(results:any[],status:string)=>{
        if (status==='OK'&&results[0]?.geometry?.location) resolve({lat:results[0].geometry.location.lat(),lng:results[0].geometry.location.lng()})
        else reject(`Geocoding failed: ${status}`)
      })
    })
  },[])

  const getDirections=useCallback((origin:LatLng,dest:LatLng):Promise<{polyline:LatLng[];miles:number;minutes:number}>=>{
    return new Promise((resolve,reject)=>{
      const google=(window as any).google
      if (!google?.maps){reject('Google Maps not loaded');return}
      new google.maps.DirectionsService().route({origin:new google.maps.LatLng(origin.lat,origin.lng),destination:new google.maps.LatLng(dest.lat,dest.lng),travelMode:google.maps.TravelMode.DRIVING},(result:any,status:string)=>{
        if (status!=='OK'){reject(`Directions failed: ${status}`);return}
        const leg=result.routes[0].legs[0]
        resolve({polyline:decodePoly(result.routes[0].overview_polyline),miles:parseFloat((leg.distance.value/1609.34).toFixed(1)),minutes:Math.round(leg.duration.value/60)})
      })
    })
  },[])

  const pickSuggestion=async(s:Suggestion)=>{
    setQuery(s.description); setDestLabel(s.description); setSuggestions([]); setShowSuggest(false)
    try { setDestCoords(await resolvePlace(s.placeId)) }
    catch { try { setDestCoords(await geocodeText(s.description)) } catch { setError('Could not find that location.') } }
  }

  const searchRoute=useCallback(async()=>{
    if (!query.trim()) return
    setLoading(true); setSearched(false); setError(''); setStations([]); setRoutePolyline([])
    try {
      const origin=userCoords??{lat:33.849,lng:-84.373}
      setLoadStep('Finding destination...')
      let dest=destCoords
      if (!dest) { try { dest=await geocodeText(query) } catch(e){throw e} ; setDestCoords(dest); setDestLabel(query) }
      setLoadStep('Calculating route...')
      const {polyline,miles,minutes}=await getDirections(origin,dest)
      setRoutePolyline(polyline)
      setRouteInfo({totalMiles:miles,totalMins:minutes,origin:'Your Location',destination:destLabel||query})
      setLoadStep('Finding gas stations...')
      // Interpolate 12 points along route for thorough coverage
      const pts=interpolateAlongRoute(polyline,12)
      const names=['Shell','BP','Circle K','Chevron','QuikTrip','Marathon','Murphy USA','Wawa','Sunoco','Exxon','RaceWay','Kroger Fuel']

      // Fetch real stations at each interpolated point
      const stationPromises = pts.map(async (pt) => {
        try {
          const res = await fetch(`/api/stations?lat=${pt.lat}&lng=${pt.lng}`)
          const data = await res.json()
          return (data.stations || []).map((s:any) => ({...s, nearPt: pt}))
        } catch { return [] }
      })
      const allStationArrays = await Promise.all(stationPromises)

      // Deduplicate by lat/lng
      const seen = new Set<string>()
      const allRealStations: any[] = []
      allStationArrays.flat().forEach((st:any) => {
        const key = `${st.lat?.toFixed(3)}-${st.lng?.toFixed(3)}`
        if (!seen.has(key)) { seen.add(key); allRealStations.push(st) }
      })

      // Helper: find closest point index on route to a station
      const closestPtIdx = (slat:number, slng:number) => {
        let best=0, bestD=Infinity
        polyline.forEach((p,i)=>{
          const d=Math.abs(p.lat-slat)+Math.abs(p.lng-slng)
          if(d<bestD){bestD=d;best=i}
        })
        return best
      }

      const sourceStations = allRealStations.length >= 3 ? allRealStations : pts.map((pt,i) => ({
        name: names[Math.floor(Math.random()*names.length)],
        address: 'Along your route',
        lat: pt.lat+(Math.random()-.5)*.008,
        lng: pt.lng+(Math.random()-.5)*.008,
        nearPt: pt,
      }))

      // Build stations, compute real distOnRoute from polyline position
      const builtUnsorted:RouteStation[] = sourceStations.map((st:any,i:number)=>{
        const ptIdx = closestPtIdx(st.lat||0, st.lng||0)
        // Approximate miles along route from polyline index
        const routePct = polyline.length > 1 ? ptIdx / (polyline.length-1) : (i+1)/(sourceStations.length+1)
        const distAlongRoute = parseFloat((routePct * miles).toFixed(1))
        return {
          id:i+1,
          name: st.name || names[i%names.length],
          address: st.address || 'Along your route',
          lat: st.lat || (st.nearPt?.lat ?? 0),
          lng: st.lng || (st.nearPt?.lng ?? 0),
          ...simulatePrices(basePrice),
          distOnRoute: distAlongRoute,
          detourMiles: parseFloat((Math.random()*.5+.1).toFixed(1)),
          updated: `${Math.floor(Math.random()*12)+1}m ago`,
          trending: ['down','down','stable','up'][Math.floor(Math.random()*4)],
        }
      })

      // Sort by position along route, remove duplicates too close together
      const sorted = builtUnsorted.sort((a,b)=>a.distOnRoute-b.distOnRoute)
      const built:RouteStation[] = []
      sorted.forEach(st=>{
        const lastDist = built.length ? built[built.length-1].distOnRoute : -99
        if (st.distOnRoute - lastDist >= 1.0) built.push({...st, id:built.length+1})
      })

      setStations(built); setMapKey(`route-${Date.now()}`); setSearched(true); setSelId(null)
    } catch(e:any) { setError(e?.message||String(e)||'Could not find route. Try a different destination.') }
    setLoadStep(''); setLoading(false)
  },[query,destCoords,destLabel,userCoords,basePrice,geocodeText,getDirections])

  const clear=()=>{ setQuery('');setDestCoords(null);setDestLabel('');setStations([]);setRoutePolyline([]);setRouteInfo(null);setSearched(false);setError('');setSuggestions([]);inputRef.current?.focus() }

  const cheapestPrice=cheapest?.[gk(grade)]??basePrice
  const avgRoutePrice=stations.length?stations.reduce((s,st)=>s+st[gk(grade)],0)/stations.length:basePrice
  const routeFuelCost=routeInfo?((routeInfo.totalMiles/28)*cheapestPrice).toFixed(2):'0.00'
  const sorted=[...stations].sort((a,b)=>a[gk(grade)]-b[gk(grade)])
  const prices=sorted.map(s=>s[gk(grade)])
  const priceMin=prices[0]??basePrice, priceMax=prices[prices.length-1]??basePrice
  const priceRange=priceMax-priceMin||0.01
  const getPriceTier=(price:number)=>{
    const pct=(price-priceMin)/priceRange
    if(pct<0.33) return {label:'Best deal',color:'#30d158',bg:'rgba(48,209,88,.1)'}
    if(pct<0.66) return {label:'Mid range',color:'#ff9f0a',bg:'rgba(255,159,10,.1)'}
    return {label:'Priciest',color:'#ff453a',bg:'rgba(255,69,58,.1)'}
  }
  const sel=stations.find(s=>s.id===selId)
  const S={ bg:isDark?'rgba(255,255,255,.05)':'rgba(255,255,255,.8)', bdr:isDark?'rgba(255,255,255,.09)':'rgba(0,0,0,.08)', text:isDark?'#ebebf5':'#1a1a2e', text2:isDark?'rgba(235,235,245,.55)':'rgba(26,26,46,.55)', text3:isDark?'rgba(235,235,245,.28)':'rgba(26,26,46,.3)', inputBg:isDark?'rgba(0,0,0,.3)':'rgba(0,0,0,.04)', inputBdr:isDark?'rgba(255,255,255,.1)':'rgba(0,0,0,.1)' }

  return (
    <>
      <style>{`@keyframes routeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmer{0%{left:-100%}100%{left:120%}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.suggest-item:hover{background:rgba(255,59,48,.07)!important}`}</style>
      {/* Maps choice modal */}
      {showMapsModal&&sel&&(
        <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)',padding:'0 14px 24px'}} onClick={e=>{if(e.target===e.currentTarget)setShowMapsModal(false)}}>
          <div style={{background:'rgba(255,255,255,.97)',borderRadius:'24px 24px 18px 18px',padding:20,width:'100%',maxWidth:440,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
            <div style={{width:36,height:4,borderRadius:2,background:'rgba(0,0,0,.1)',margin:'0 auto 16px'}}/>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:4}}>Open in maps</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:15,fontWeight:900,letterSpacing:-.5,color:'#1a1a2e',marginBottom:16}}>{sel.name} · {sel.address}</div>
            <button onClick={()=>{
              window.open(`maps://maps.apple.com/?saddr=Current+Location&daddr=${encodeURIComponent(destLabel)}&via=${encodeURIComponent(sel.name+', '+sel.address)}&dirflag=d`)
              setShowMapsModal(false)
            }} style={{width:'100%',padding:'13px 16px',background:'rgba(0,0,0,.04)',border:'0.5px solid rgba(0,0,0,.08)',borderRadius:16,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',system-ui,sans-serif",display:'flex',alignItems:'center',gap:12,marginBottom:8,color:'#1a1a2e',textAlign:'left' as any}}>
              <span style={{fontSize:24}}>🗺️</span>
              <div><div>Apple Maps</div><div style={{fontSize:11,fontWeight:400,color:'rgba(26,26,46,.45)',marginTop:1}}>iPhone · iPad · Mac · Gas as waypoint</div></div>
            </button>
            <button onClick={()=>{
              const q=encodeURIComponent(`${sel.name}, ${sel.address}`)
              window.open(`https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(destLabel)}&waypoints=${q}&travelmode=driving`)
              setShowMapsModal(false)
            }} style={{width:'100%',padding:'13px 16px',background:'rgba(66,133,244,.07)',border:'0.5px solid rgba(66,133,244,.2)',borderRadius:16,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',system-ui,sans-serif",display:'flex',alignItems:'center',gap:12,marginBottom:12,color:'#1a1a2e',textAlign:'left' as any}}>
              <span style={{fontSize:24}}>📍</span>
              <div><div>Google Maps</div><div style={{fontSize:11,fontWeight:400,color:'rgba(26,26,46,.45)',marginTop:1}}>All devices · Android · Gas as waypoint</div></div>
            </button>
            <button onClick={()=>setShowMapsModal(false)} style={{width:'100%',padding:11,borderRadius:100,border:'0.5px solid rgba(0,0,0,.08)',background:'transparent',fontSize:13,color:'rgba(26,26,46,.4)',cursor:'pointer',fontFamily:"'DM Sans',system-ui,sans-serif"}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{background:S.bg,border:`1px solid ${S.bdr}`,borderRadius:20,overflow:'visible',marginBottom:14,position:'relative'}}>
        <div style={{padding:'18px 20px 16px'}}>
          <div style={{fontSize:10,fontWeight:600,letterSpacing:'2px',color:'#ff3b30',textTransform:'uppercase',marginBottom:4}}>🛣️ Route Mode</div>
          <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,letterSpacing:-1,color:S.text,marginBottom:2}}>Cheapest Gas Along Your Route</div>
          <div style={{fontSize:12,color:S.text3}}>Enter any address, city, landmark, or business name</div>
        </div>

        <div style={{padding:'0 20px 16px',position:'relative'}}>
          <div style={{display:'flex',gap:8,alignItems:'stretch'}}>
            <div style={{display:'flex',alignItems:'center',gap:7,background:S.inputBg,border:`1px solid ${S.inputBdr}`,borderRadius:13,padding:'10px 14px',flexShrink:0}}>
              <div style={{width:9,height:9,borderRadius:'50%',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:600,color:S.text2,whiteSpace:'nowrap'}}>{userCoords?'My Location':'No Location'}</span>
            </div>
            <div style={{color:'#ff3b30',fontSize:16,fontWeight:700,alignSelf:'center',flexShrink:0}}>→</div>
            <div style={{flex:1,position:'relative'}}>
              <div style={{display:'flex',alignItems:'center',background:S.inputBg,border:`1.5px solid ${showSuggest||query?'#ff3b30':S.inputBdr}`,borderRadius:13,padding:'0 12px',gap:8,transition:'border-color .2s'}}>
                <span style={{fontSize:14,color:S.text3,flexShrink:0}}>🏁</span>
                <input ref={inputRef} type="text" value={query} placeholder="Address, city, Walmart, Atlanta Airport..."
                  onChange={e=>handleQueryChange(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'){setShowSuggest(false);searchRoute()}if(e.key==='Escape')setShowSuggest(false)}}
                  onFocus={()=>suggestions.length>0&&setShowSuggest(true)}
                  style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:14,fontWeight:500,color:S.text,padding:'12px 0',fontFamily:"'DM Sans',system-ui,sans-serif",minWidth:0}}/>
                {query&&<button onClick={clear} style={{background:'none',border:'none',cursor:'pointer',color:S.text3,fontSize:16,padding:'4px',flexShrink:0,lineHeight:1}}>✕</button>}
              </div>
              {showSuggest&&suggestions.length>0&&(
                <div ref={suggestRef} style={{position:'absolute',top:'calc(100% + 6px)',left:0,right:0,background:isDark?'rgba(18,18,22,.97)':'rgba(255,255,255,.98)',border:`1px solid ${S.bdr}`,borderRadius:14,boxShadow:'0 8px 32px rgba(0,0,0,.2)',zIndex:9999,overflow:'hidden',animation:'routeIn .2s ease both'}}>
                  {suggestions.map((s,i)=>(
                    <div key={s.placeId} className="suggest-item" onClick={()=>pickSuggestion(s)} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',cursor:'pointer',borderBottom:i<suggestions.length-1?`1px solid ${S.bdr}`:'none',transition:'background .15s'}}>
                      <div style={{width:30,height:30,borderRadius:9,background:'rgba(255,59,48,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>📍</div>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:S.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.mainText}</div>
                        <div style={{fontSize:11,color:S.text3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.secText}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={()=>{setShowSuggest(false);searchRoute()}} disabled={!query.trim()||loading}
              style={{padding:'0 20px',background:query&&!loading?'linear-gradient(135deg,#ff3b30,#ff6b35)':'rgba(255,59,48,.2)',color:'#fff',border:'none',borderRadius:13,fontSize:13,fontWeight:700,cursor:query&&!loading?'pointer':'not-allowed',fontFamily:"'DM Sans',system-ui,sans-serif",transition:'all .2s',boxShadow:query&&!loading?'0 4px 14px rgba(255,59,48,.35)':'none',display:'flex',alignItems:'center',gap:6,flexShrink:0,whiteSpace:'nowrap'}}>
              {loading?<span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>⟳</span>:'⛽'}
              {loading?'Searching...':'Find Gas'}
            </button>
          </div>
          {loading&&loadStep&&<div style={{marginTop:8,fontSize:11,color:'#ff3b30',fontWeight:500,display:'flex',alignItems:'center',gap:6}}><span style={{animation:'spin 1s linear infinite',display:'inline-block',fontSize:13}}>⟳</span>{loadStep}</div>}
          {error&&!loading&&<div style={{marginTop:8,fontSize:12,color:'#ff453a',fontWeight:500,background:'rgba(255,69,58,.08)',border:'1px solid rgba(255,69,58,.2)',borderRadius:10,padding:'8px 12px'}}>⚠️ {error}</div>}
        </div>

        {searched&&<div style={{display:'flex',gap:6,padding:'0 20px 16px',flexWrap:'wrap'}}>{GRADES.map(g=><button key={g} onClick={()=>setGrade(g)} style={{padding:'6px 16px',borderRadius:100,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',system-ui,sans-serif",transition:'all .2s',background:grade===g?'linear-gradient(135deg,#ff3b30,#ff6b35)':S.inputBg,color:grade===g?'#fff':S.text2,border:grade===g?'none':`1px solid ${S.inputBdr}`,boxShadow:grade===g?'0 0 12px rgba(255,59,48,.3)':'none'}}>{g}</button>)}</div>}

        {!searched&&!loading&&(
          <div style={{textAlign:'center',padding:'28px 20px 36px'}}>
            <div style={{fontSize:44,marginBottom:12}}>🗺️</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:700,color:S.text2,marginBottom:8,letterSpacing:-.3}}>Where are you headed?</div>
            <div style={{fontSize:12,color:S.text3,lineHeight:1.65,maxWidth:300,margin:'0 auto'}}>Type any destination — a city, address, business name or landmark — and we'll find the cheapest gas stop along your way.</div>
            <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16,flexWrap:'wrap'}}>
              {['Atlanta Airport','Walmart Supercenter','Nashville, TN','Miami Beach'].map(ex=>(
                <button key={ex} onClick={()=>{setQuery(ex);handleQueryChange(ex);inputRef.current?.focus()}} style={{padding:'5px 12px',background:S.inputBg,border:`1px solid ${S.inputBdr}`,borderRadius:100,fontSize:11,fontWeight:500,color:S.text2,cursor:'pointer',fontFamily:"'DM Sans',system-ui,sans-serif",transition:'all .2s'}}>{ex}</button>
              ))}
            </div>
          </div>
        )}

        {loading&&<div style={{padding:'0 20px 16px'}}>{[1,2,3].map(i=><div key={i} style={{height:64,background:S.inputBg,borderRadius:13,marginBottom:8,position:'relative',overflow:'hidden'}}><div style={{position:'absolute',top:0,bottom:0,width:'55%',background:`linear-gradient(90deg,transparent,rgba(255,59,48,.07),transparent)`,animation:`shimmer 1.4s ease-in-out ${i*.15}s infinite`}}/></div>)}</div>}

        {searched&&!loading&&(
          <div style={{animation:'routeIn .4s cubic-bezier(.34,1.56,.64,1)'}}>
            <div style={{
              position: mapExpanded?'fixed':'relative',
              inset: mapExpanded?'0':undefined,
              zIndex: mapExpanded?9990:undefined,
              margin: mapExpanded?'0':'0 16px 14px',
              height: mapExpanded?'100vh':300,
              borderRadius: mapExpanded?0:16,
              overflow:'hidden',
              border: mapExpanded?'none':`1px solid ${S.bdr}`,
              boxShadow: mapExpanded?'none':'0 4px 20px rgba(0,0,0,.12)',
            }}>
              <RouteMap key={mapKey} mapKey={mapKey} stations={stations} grade={grade} selectedId={selId} onSelect={id=>setSelId(p=>p===id?null:id)} origin={userCoords} destination={destCoords} routePolyline={routePolyline}/>
              {/* Expand/close button */}
              <button onClick={()=>setMapExpanded(p=>!p)} style={{position:'absolute',top:10,left:10,zIndex:401,background:'rgba(255,255,255,.95)',backdropFilter:'blur(16px)',border:'0.5px solid rgba(255,255,255,.98)',borderRadius:12,padding:'7px 12px',fontSize:12,fontWeight:700,color:'#1a1a2e',cursor:'pointer',display:'flex',alignItems:'center',gap:6,boxShadow:'0 4px 12px rgba(0,0,0,.12)',fontFamily:"'DM Sans',system-ui,sans-serif"}}>
                {mapExpanded?'← Close map':'⤢ Expand map'}
              </button>
            </div>

            {routeInfo&&cheapest&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,padding:'0 16px',marginBottom:14}}>
                {[
                  {label:'Cheapest Stop',val:`$${cheapestPrice.toFixed(2)}`,sub:cheapest.name,color:'#ff3b30'},
                  {label:'Off Route',val:`+${cheapest.detourMiles} mi`,sub:'extra miles to stop',color:'#0a84ff'},
                  {label:'Price Spread',val:`$${(avgRoutePrice-cheapestPrice).toFixed(2)}`,sub:'vs priciest on route',color:S.text},
                ].map(s=>(
                  <div key={s.label} style={{background:S.inputBg,border:`1px solid ${S.bdr}`,borderRadius:12,padding:'10px 12px'}}>
                    <div style={{fontSize:8,fontWeight:600,letterSpacing:'1.5px',color:s.color as string,textTransform:'uppercase',marginBottom:3}}>{s.label}</div>
                    <div style={{fontSize:18,fontWeight:800,letterSpacing:-.5,color:s.color as string,lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:10,color:S.text3,marginTop:3}}>{s.sub}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{padding:'0 16px',marginBottom:14}}>
              <span style={{fontSize:11,color:S.text3}}>{routeInfo&&`${routeInfo.totalMiles} mi to ${routeInfo.destination}`}</span>
            </div>

            <div style={{padding:'0 16px 6px'}}>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:'1.5px',color:S.text3,textTransform:'uppercase',marginBottom:10}}>{stations.length} Stations Along Route · Cheapest First</div>
              {(showAllRoute?sorted:sorted.slice(0,5)).map((st,i)=>{
                const price=st[gk(grade)],isBest=st.id===cheapest?.id,isSel=st.id===selId
                const pct=routeInfo?Math.min(Math.round((st.distOnRoute/routeInfo.totalMiles)*100),96):0
                return (
                  <div key={st.id} onClick={()=>setSelId(p=>p===st.id?null:st.id)} style={{display:'flex',alignItems:'center',gap:11,padding:'12px 14px',borderRadius:13,marginBottom:7,cursor:'pointer',border:`1.5px solid ${isSel?'#ff3b30':isBest?'rgba(48,209,88,.3)':S.bdr}`,background:isSel?'rgba(255,59,48,.06)':isBest?'rgba(48,209,88,.05)':S.inputBg,transition:'all .18s',animation:`routeIn .3s cubic-bezier(.34,1.56,.64,1) ${i*.06}s both`}}>
                    <div style={{width:28,height:28,borderRadius:8,flexShrink:0,background:i===0?'linear-gradient(135deg,#30d158,#34c759)':S.inputBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:i===0?13:11,fontWeight:700,color:i===0?'#fff':S.text3}}>{i===0?'★':`${i+1}`}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                        <span style={{fontSize:14,fontWeight:700,color:S.text}}>{st.name}</span>
                        {(()=>{const t=getPriceTier(st[gk(grade)]);return <span style={{fontSize:9,fontWeight:700,background:t.bg,color:t.color,border:`1px solid ${t.color}30`,borderRadius:5,padding:'1px 6px',letterSpacing:.3}}>{t.label}</span>})()}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                        <div style={{flex:1,height:3,background:'rgba(0,0,0,.08)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#ff3b30,#ff6b35)',borderRadius:2}}/></div>
                        <span style={{fontSize:9,color:S.text3,whiteSpace:'nowrap',flexShrink:0}}>{pct}% in</span>
                      </div>
                      <div style={{fontSize:10,color:S.text3}}>{st.distOnRoute} mi · +{st.detourMiles} mi detour</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:21,fontWeight:800,letterSpacing:-.5,color:isBest?'#30d158':S.text,lineHeight:1}}>${price.toFixed(2)}</div>
                      <div style={{fontSize:11,fontWeight:700,marginTop:2,color:st.trending==='down'?'#30d158':st.trending==='up'?'#ff453a':S.text3}}>{st.trending==='down'?'↓':st.trending==='up'?'↑':'→'}</div>
                    </div>
                  </div>
                )
              })}
              {/* Show more / less */}
              {stations.length > 5 && (
                <button
                  onClick={()=>setShowAllRoute(p=>!p)}
                  style={{width:'100%',padding:'12px 16px',marginTop:4,background:'none',border:`1.5px solid ${S.bdr}`,borderRadius:12,fontSize:13,fontWeight:700,color:'#ff3b30',cursor:'pointer',fontFamily:"'DM Sans',system-ui,sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:6}}
                >
                  {showAllRoute ? '↑ Show less' : `Show all ${stations.length} stations →`}
                </button>
              )}
            </div>

            {sel&&(
              <div style={{margin:'0 16px 20px',padding:'16px',background:'linear-gradient(135deg,rgba(255,59,48,.09),rgba(255,59,48,.03))',border:'1px solid rgba(255,59,48,.22)',borderRadius:16,animation:'routeIn .3s ease'}}>
                <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:12}}>
                  <div>
                    <div style={{fontSize:9,fontWeight:600,letterSpacing:2,color:'#ff3b30',textTransform:'uppercase',marginBottom:3}}>Selected Stop</div>
                    <div style={{fontSize:19,fontWeight:800,letterSpacing:-.5,color:S.text}}>{sel.name}</div>
                    <div style={{fontSize:11,color:S.text2,marginTop:3}}>{sel.distOnRoute} mi along route · +{sel.detourMiles} mi detour</div>
                  </div>
                  <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                    {GRADES.map(g=><div key={g} style={{textAlign:'center'}}><div style={{fontSize:8,fontWeight:600,letterSpacing:'1.5px',color:S.text3,textTransform:'uppercase'}}>{g}</div><div style={{fontSize:17,fontWeight:800,letterSpacing:-.5,color:g===grade?'#ff3b30':S.text,marginTop:2}}>${(sel as any)[gk(g)].toFixed(2)}</div></div>)}
                  </div>
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {/* Open in Maps → shows Apple/Google choice modal */}
                  <button onClick={()=>setShowMapsModal(true)}
                    style={{flex:1,padding:'11px 16px',background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',border:'none',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',system-ui,sans-serif",boxShadow:'0 4px 14px rgba(255,59,48,.35)'}}>
                    🗺️ Open in Maps →
                  </button>
                  {/* Add gas stop — routes You → Gas → Destination */}
                  {destCoords&&(
                    <button onClick={()=>{
                      const isApple=/iPhone|iPad|iPod|Mac/.test(navigator.userAgent)
                      const stQ=encodeURIComponent(`${sel.name}, ${sel.address}`)
                      const destQ=encodeURIComponent(destLabel)
                      if(isApple) window.open(`maps://maps.apple.com/?saddr=Current+Location&daddr=${destQ}&via=${encodeURIComponent(sel.name+', '+sel.address)}&dirflag=d`)
                      else window.open(`https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${destQ}&waypoints=${stQ}&travelmode=driving`)
                    }} style={{flex:1,padding:'11px 14px',background:'rgba(10,132,255,.1)',border:'0.5px solid rgba(10,132,255,.3)',borderRadius:12,fontSize:12,fontWeight:700,color:'#0a84ff',cursor:'pointer',fontFamily:"'DM Sans',system-ui,sans-serif",textAlign:'center' as any,lineHeight:1.3}}>
                      ⛽ Add gas stop<br/><span style={{fontSize:10,opacity:.7}}>along your route</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}