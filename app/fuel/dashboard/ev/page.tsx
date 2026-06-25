'use client'
// @ts-nocheck
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function GCIcon({ size = 28 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block',flexShrink:0}}>
      <rect width="512" height="512" rx="114" fill="#ff3b30"/>
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  )
}

const AUBURN_LAT = 32.6099
const AUBURN_LNG = -85.4808
const RADIUS_OPTIONS = [5, 10, 15, 25]

function availColor(available, ports) {
  if (!ports) return '#8e8e93'
  const pct = available / ports
  if (pct === 0) return '#ff453a'
  if (pct < 0.5) return '#ff9f0a'
  return '#30d158'
}

function levelLabel(level) {
  if (level === 'L1') return 'Level 1 · 120V'
  if (level === 'L2') return 'Level 2 · 240V'
  if (level === 'DC') return 'DC Fast Charge'
  return level
}

function EVMap({ stations, selectedId, onSelect, userCoords, radius }) {
  const mapDivRef = useRef(null)
  const mapRef    = useRef(null)
  const mksRef    = useRef({})
  const circleRef = useRef(null)
  const [exp, setExp] = useState(false)

  const center = userCoords ?? { lat: AUBURN_LAT, lng: AUBURN_LNG }

  const boot = (L) => {
    if (!mapDivRef.current || mapRef.current) return
    const map = L.map(mapDivRef.current, { center: [center.lat, center.lng], zoom: 12, zoomControl: false, attributionControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // User dot
    L.marker([center.lat, center.lng], { icon: L.divIcon({ className: '', iconSize: [20, 20], iconAnchor: [10, 10], html: '<div style="width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#ff3b30,#ff6b35);border:3px solid #fff;box-shadow:0 0 0 5px rgba(255,59,48,.18),0 4px 12px rgba(255,59,48,.4)"></div>' }) }).addTo(map)

    // Radius circle
    const circle = L.circle([center.lat, center.lng], { radius: radius * 1609.34, color: '#30d158', weight: 2, opacity: .5, dashArray: '8 6', fillColor: '#30d158', fillOpacity: .04, interactive: false }).addTo(map)
    circleRef.current = circle

    stations.forEach(st => {
      if (!st.lat || !st.lng) return
      const avail = availColor(st.available, st.ports)
      const makePin = (isSel) => `<div style="background:${isSel ? avail : 'rgba(255,255,255,.97)'};border:2px solid ${avail};border-radius:10px;padding:3px 8px;font-size:10px;font-weight:800;color:${isSel ? '#fff' : '#1a1a2e'};box-shadow:${isSel ? `0 4px 12px ${avail}60` : '0 2px 8px rgba(0,0,0,.15)'};white-space:nowrap;font-family:system-ui;transition:all .2s">⚡ ${st.available}/${st.ports}</div><div style="width:6px;height:6px;border-radius:50%;background:${avail};margin:2px auto 0"></div>`
      const m = L.marker([st.lat, st.lng], { icon: L.divIcon({ className: '', iconSize: [80, 42], iconAnchor: [40, 42], html: makePin(st.id === selectedId) }) }).addTo(map).on('click', () => onSelect(st.id))
      mksRef.current[st.id] = m
    })

    try {
      const initCircle = L.circle([center.lat, center.lng], { radius: radius * 1609.34, interactive: false, opacity: 0, fillOpacity: 0 }).addTo(map)
      map.fitBounds(initCircle.getBounds(), { padding: [30, 30] })
      initCircle.remove()
    } catch {}
    mapRef.current = map
  }

  useEffect(() => {
    if ((window).L) { boot((window).L); return }
    if (!document.querySelector('#lf-css')) { const l = document.createElement('link'); l.id = 'lf-css'; l.rel = 'stylesheet'; l.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(l) }
    if (!document.querySelector('#lf-js')) { const s = document.createElement('script'); s.id = 'lf-js'; s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; s.onload = () => boot((window).L); document.head.appendChild(s) }
    else { const w = setInterval(() => { if ((window).L) { clearInterval(w); boot((window).L) } }, 100) }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; mksRef.current = {} } }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !(window).L) return
    const L = (window).L
    Object.entries(mksRef.current).forEach(([id, m]) => {
      const st = stations.find(s => s.id === parseInt(id))
      if (!st) return
      const avail = availColor(st.available, st.ports)
      const isSel = st.id === selectedId
      const html = `<div style="background:${isSel ? avail : 'rgba(255,255,255,.97)'};border:2px solid ${avail};border-radius:10px;padding:3px 8px;font-size:10px;font-weight:800;color:${isSel ? '#fff' : '#1a1a2e'};box-shadow:${isSel ? `0 4px 12px ${avail}60` : '0 2px 8px rgba(0,0,0,.15)'};white-space:nowrap">⚡ ${st.available}/${st.ports}</div><div style="width:6px;height:6px;border-radius:50%;background:${avail};margin:2px auto 0"></div>`
      m.setIcon(L.divIcon({ className: '', iconSize: [80, 42], iconAnchor: [40, 42], html }))
    })
  }, [selectedId])

  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius * 1609.34)
    if (mapRef.current && circleRef.current) {
      try { mapRef.current.fitBounds(circleRef.current.getBounds(), { padding: [30, 30], animate: true }) } catch {}
    }
  }, [radius])

  useEffect(() => {
    if (!mapRef.current || !selectedId) return
    const st = stations.find(s => s.id === selectedId)
    if (st?.lat && st?.lng) mapRef.current.panTo([st.lat, st.lng], { animate: true, duration: .4 })
  }, [selectedId])

  useEffect(() => { setTimeout(() => mapRef.current?.invalidateSize(), 350) }, [exp])

  return (
    <div style={{ marginBottom: exp ? 0 : 12 }}>
      <div style={{ position: exp ? 'fixed' : 'relative', inset: exp ? '0' : undefined, zIndex: exp ? 9990 : undefined, height: exp ? '100vh' : 200, borderRadius: exp ? 0 : 18, overflow: 'hidden', border: exp ? 'none' : '0.5px solid rgba(255,255,255,.9)' }}>
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

        {!exp && <>
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(48,209,88,.2)', borderRadius: 12, padding: '6px 10px', pointerEvents: 'none', zIndex: 401 }}>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, color: '#30d158', textTransform: 'uppercase', marginBottom: 1 }}>Nearby</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 900, color: '#1a1a2e', lineHeight: 1 }}>{stations.filter(s => s.distance <= radius).length} chargers</div>
          </div>
          <button onClick={() => setExp(true)} style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 401, background: 'rgba(26,26,46,.72)', backdropFilter: 'blur(16px)', border: 'none', borderRadius: 100, padding: '6px 14px', fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>⤢ Explore full map</button>
          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 401 }}>
            {[{ color: '#30d158', label: 'Available' }, { color: '#ff9f0a', label: 'Limited' }, { color: '#ff453a', label: 'Full' }].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, border: '1px solid rgba(255,255,255,.7)', flexShrink: 0 }} />
                <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(26,26,46,.7)', background: 'rgba(255,255,255,.7)', padding: '1px 5px', borderRadius: 3 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </>}

        {exp && <>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 9991 }}>
            <button onClick={() => setExp(false)} style={{ background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(20px)', border: '0.5px solid rgba(255,255,255,.98)', borderRadius: 14, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#1a1a2e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}>← Close map</button>
            <div style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(48,209,88,.2)', borderRadius: 12, padding: '8px 14px', pointerEvents: 'none' }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: '#30d158', textTransform: 'uppercase' }}>EV Chargers</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 900, color: '#1a1a2e' }}>{stations.length} nearby</div>
            </div>
            <div style={{ width: 80 }} />
          </div>
          {/* Radius selector on expanded map */}
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9991, background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(24px)', border: '0.5px solid rgba(255,255,255,.98)', borderRadius: 20, padding: '10px 16px', boxShadow: '0 8px 32px rgba(0,0,0,.15)', textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'rgba(26,26,46,.4)', textTransform: 'uppercase', marginBottom: 8 }}>Search radius</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {RADIUS_OPTIONS.map(r => {
                const on = radius === r
                return <div key={r} style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${on ? '#30d158' : 'rgba(0,0,0,.12)'}`, background: on ? 'rgba(48,209,88,.1)' : 'rgba(255,255,255,.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 900, color: on ? '#30d158' : '#1a1a2e', lineHeight: 1 }}>{r}</div>
                  <div style={{ fontSize: 8, color: on ? '#1a7a35' : 'rgba(26,26,46,.5)', marginTop: 1 }}>mi</div>
                </div>
              })}
            </div>
          </div>
        </>}
      </div>
    </div>
  )
}

export default function EVPage() {
  const router = useRouter()
  const [user,        setUser]       = useState(null)
  const [profile,     setProfile]    = useState(null)
  const [loading,     setLoading]    = useState(true)
  const [stations,    setStations]   = useState([])
  const [fetching,    setFetching]   = useState(false)
  const [userCoords,  setCoords]     = useState(null)
  const [selectedId,  setSelectedId] = useState(null)
  const [radius,      setRadius]     = useState(10)
  const [mapsStation, setMapsStation] = useState(null)
  const [locationLabel, setLocationLabel] = useState('Locating...')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) setProfile(profile)
      setLoading(false)
    }
    init()
  }, [])

  const fetchEV = async (lat, lng, r = radius) => {
    setFetching(true)
    try {
      const res = await fetch(`/api/ev-stations?lat=${lat}&lng=${lng}&radius=${r}`)
      const data = await res.json()
      if (data.stations?.length) {
        setStations(data.stations)
        setSelectedId(data.stations[0].id)
      } else {
        setStations([])
      }
    } catch {
      setStations([])
    } finally {
      setFetching(false)
    }
  }

  const getLocation = () => {
    setLocationLabel('Locating...')
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => {
          const { latitude: lat, longitude: lng } = p.coords
          setCoords({ lat, lng })
          setLocationLabel('Your location')
          fetchEV(lat, lng)
        },
        () => {
          setCoords({ lat: AUBURN_LAT, lng: AUBURN_LNG })
          setLocationLabel('Auburn, AL (default)')
          fetchEV(AUBURN_LAT, AUBURN_LNG)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    } else {
      setCoords({ lat: AUBURN_LAT, lng: AUBURN_LNG })
      setLocationLabel('Auburn, AL (default)')
      fetchEV(AUBURN_LAT, AUBURN_LNG)
    }
  }

  useEffect(() => { if (!loading) getLocation() }, [loading])

  const handleRadiusChange = (r) => {
    setRadius(r)
    if (userCoords) fetchEV(userCoords.lat, userCoords.lng, r)
  }

  const openMaps = (st, app) => {
    const latLng = `${st.lat},${st.lng}`
    const name = encodeURIComponent(st.name)
    if (app === 'apple') window.open(`maps://maps.apple.com/?ll=${latLng}&q=${name}`)
    else window.open(`https://www.google.com/maps/search/?api=1&query=${latLng}`)
    setMapsStation(null)
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0eff4', fontFamily: 'system-ui', color: 'rgba(26,26,46,.4)', fontSize: 14 }}>Loading...</div>

  const sel = stations.find(s => s.id === selectedId)
  const initial = (profile?.first_name?.[0] || user?.email?.[0] || 'G').toUpperCase()

  const glass = (extra = {}) => ({ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,0.92)', borderRadius: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', ...extra })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;background:#f0eff4;background-image:radial-gradient(ellipse 70% 50% at 15% 5%,rgba(48,209,88,0.08) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.06) 0%,transparent 50%);min-height:100vh;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .station-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.1)!important}
        .leaflet-control-zoom{border:none!important}
        .leaflet-control-zoom a{background:rgba(255,255,255,.9)!important;border:1px solid rgba(0,0,0,.1)!important;margin-bottom:3px!important;border-radius:8px!important;display:block!important}
      `}</style>

      {/* Maps Modal */}
      {mapsStation && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(10px)', padding: '0 14px 24px' }} onClick={e => { if (e.target === e.currentTarget) setMapsStation(null) }}>
          <div style={{ background: 'rgba(255,255,255,.97)', borderRadius: '24px 24px 18px 18px', padding: 20, width: '100%', maxWidth: 440, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,.1)', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'rgba(26,26,46,.4)', textTransform: 'uppercase', marginBottom: 4 }}>Open in maps</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 900, color: '#1a1a2e', marginBottom: 16 }}>{mapsStation.name}</div>
            <button onClick={() => openMaps(mapsStation, 'apple')} style={{ width: '100%', padding: '13px 16px', background: 'rgba(0,0,0,.04)', border: '0.5px solid rgba(0,0,0,.08)', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, color: '#1a1a2e' }}>
              <span style={{ fontSize: 24 }}>🗺️</span><div><div>Apple Maps</div><div style={{ fontSize: 11, fontWeight: 400, color: 'rgba(26,26,46,.45)', marginTop: 1 }}>iPhone · iPad · Mac</div></div>
            </button>
            <button onClick={() => openMaps(mapsStation, 'google')} style={{ width: '100%', padding: '13px 16px', background: 'rgba(66,133,244,.07)', border: '0.5px solid rgba(66,133,244,.2)', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, color: '#1a1a2e' }}>
              <span style={{ fontSize: 24 }}>📍</span><div><div>Google Maps</div><div style={{ fontSize: 11, fontWeight: 400, color: 'rgba(26,26,46,.45)', marginTop: 1 }}>All devices · Android</div></div>
            </button>
            <button onClick={() => setMapsStation(null)} style={{ width: '100%', padding: 11, borderRadius: 100, border: '0.5px solid rgba(0,0,0,.08)', background: 'transparent', fontSize: 13, color: 'rgba(26,26,46,.4)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px 80px' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', marginBottom: 8 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(26,26,46,.5)', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>← Dashboard</button>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GCIcon size={26} />
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: -.5, color: '#1a1a2e' }}>Gratia Core</span>
          </Link>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#30d158,#34c759)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{initial}</div>
        </div>

        {/* Header card */}
        <div style={{ ...glass({ padding: '20px 24px', marginBottom: 12, border: '0.5px solid rgba(48,209,88,.25)' }), animation: 'fadeUp .5s ease both', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#30d158,transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg,#30d158,#34c759)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 4px 14px rgba(48,209,88,.3)' }}>⚡</div>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: -.5, color: '#1a1a2e', lineHeight: 1, marginBottom: 4 }}>EV Intelligence</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(48,209,88,.1)', border: '0.5px solid rgba(48,209,88,.3)', borderRadius: 100, padding: '2px 8px' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#30d158', animation: 'lp 1.4s ease infinite' }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#1a7a35' }}>LIVE · {fetching ? '...' : stations.length} chargers</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(26,26,46,.4)' }}>📍 {locationLabel}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={getLocation} style={{ padding: '8px 14px', background: 'rgba(255,59,48,.08)', border: '0.5px solid rgba(255,59,48,.2)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: '#cc2018', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>
                📍 Update location
              </button>
              <button onClick={() => { if (userCoords) fetchEV(userCoords.lat, userCoords.lng) }} style={{ padding: '8px 14px', background: 'rgba(48,209,88,.1)', border: '0.5px solid rgba(48,209,88,.3)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: '#1a7a35', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}>
                {fetching ? <div style={{ width: 10, height: 10, border: '2px solid rgba(48,209,88,.3)', borderTopColor: '#30d158', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /> : '↺'} Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Radius selector */}
        <div style={{ ...glass({ padding: '14px 20px', marginBottom: 12 }), animation: 'fadeUp .5s ease .04s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(26,26,46,.4)', textTransform: 'uppercase' }}>Search radius · {stations.length} stations</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {RADIUS_OPTIONS.map(r => {
                const on = radius === r
                return (
                  <button key={r} onClick={() => handleRadiusChange(r)} style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${on ? '#30d158' : 'rgba(0,0,0,.12)'}`, background: on ? 'rgba(48,209,88,.1)' : 'rgba(255,255,255,.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s', fontFamily: "'DM Sans',sans-serif" }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 900, color: on ? '#30d158' : '#1a1a2e', lineHeight: 1 }}>{r}</div>
                    <div style={{ fontSize: 8, color: on ? '#1a7a35' : 'rgba(26,26,46,.5)', marginTop: 1 }}>mi</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Map */}
        <div style={{ animation: 'fadeUp .5s ease .06s both' }}>
          {fetching && stations.length === 0 ? (
            <div style={{ ...glass({ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, marginBottom: 12 }) }}>
              <div style={{ width: 28, height: 28, border: '3px solid rgba(48,209,88,.2)', borderTopColor: '#30d158', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(26,26,46,.5)' }}>Finding EV chargers near you...</div>
            </div>
          ) : (
            <EVMap stations={stations} selectedId={selectedId} onSelect={setSelectedId} userCoords={userCoords} radius={radius} />
          )}
        </div>

        {/* Selected station */}
        {sel && (
          <div style={{ ...glass({ padding: '20px 24px', marginBottom: 12, border: `0.5px solid ${availColor(sel.available, sel.ports)}40` }), animation: 'fadeUp .5s ease .08s both', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${availColor(sel.available, sel.ports)},transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 900, letterSpacing: -.5, color: '#1a1a2e', marginBottom: 3 }}>{sel.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(26,26,46,.5)', marginBottom: 8 }}>📍 {sel.address}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: availColor(sel.available, sel.ports), background: `${availColor(sel.available, sel.ports)}15`, border: `0.5px solid ${availColor(sel.available, sel.ports)}40`, borderRadius: 100, padding: '3px 10px' }}>
                    {sel.available === 0 ? 'All Full' : sel.available === sel.ports ? 'All Available' : `${sel.available}/${sel.ports} open`}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', background: 'rgba(0,0,0,.04)', borderRadius: 100, padding: '3px 10px' }}>{sel.distance.toFixed(1)} mi</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', background: 'rgba(0,0,0,.04)', borderRadius: 100, padding: '3px 10px' }}>{sel.network}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 900, color: '#30d158', lineHeight: 1 }}>{sel.kw}<span style={{ fontSize: 12, fontWeight: 600 }}>kW</span></div>
                <div style={{ fontSize: 9, color: 'rgba(26,26,46,.4)', marginTop: 2 }}>{levelLabel(sel.level)}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Ports', val: `${sel.ports}` },
                { label: 'Available', val: `${sel.available}` },
                { label: 'Cost', val: sel.cost !== 'Free' ? `${sel.cost}${sel.costUnit}` : 'Free' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,.03)', borderRadius: 14, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'rgba(26,26,46,.4)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 900, color: '#1a1a2e' }}>{s.val}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setMapsStation(sel)} style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#30d158,#34c759)', color: '#fff', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 16px rgba(48,209,88,.35)' }}>
              ⚡ Navigate to Charger →
            </button>
          </div>
        )}

        {/* Station list */}
        {stations.length > 0 && (
          <div style={{ animation: 'fadeUp .5s ease .12s both' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(26,26,46,.35)', textTransform: 'uppercase', marginBottom: 10 }}>{stations.length} Chargers Found</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stations.map((st, i) => {
                const avail = availColor(st.available, st.ports)
                const isSel = st.id === selectedId
                return (
                  <div key={st.id} className="station-card" onClick={() => setSelectedId(st.id)}
                    style={{ ...glass({ padding: '14px 18px', border: isSel ? `0.5px solid ${avail}50` : '0.5px solid rgba(255,255,255,.92)', cursor: 'pointer', transition: 'all .2s cubic-bezier(.34,1.56,.64,1)', animation: `fadeUp .4s ease ${.14 + i * .03}s both` }) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${avail}15`, border: `0.5px solid ${avail}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚡</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 800, color: '#1a1a2e', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.name}</div>
                        <div style={{ fontSize: 10, color: 'rgba(26,26,46,.5)' }}>{st.network} · {st.distance.toFixed(1)} mi · {levelLabel(st.level)}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 900, color: avail, lineHeight: 1 }}>{st.available}/{st.ports}</div>
                        <div style={{ fontSize: 9, color: 'rgba(26,26,46,.4)', marginTop: 2 }}>{st.kw}kW</div>
                      </div>
                    </div>
                    {isSel && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid rgba(0,0,0,.06)', display: 'flex', gap: 8 }}>
                        <button onClick={e => { e.stopPropagation(); setMapsStation(st) }} style={{ flex: 1, padding: '8px', background: `${avail}12`, border: `0.5px solid ${avail}30`, borderRadius: 12, fontSize: 12, fontWeight: 700, color: avail, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Navigate →</button>
                        <div style={{ fontSize: 11, padding: '8px 12px', background: 'rgba(0,0,0,.04)', borderRadius: 12, color: 'rgba(26,26,46,.6)', fontWeight: 600 }}>{st.cost !== 'Free' ? `${st.cost}${st.costUnit}` : '⚡ Free'}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!fetching && stations.length === 0 && (
          <div style={{ ...glass({ padding: '32px 24px', textAlign: 'center' }), animation: 'fadeUp .5s ease both' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>No chargers found nearby</div>
            <div style={{ fontSize: 13, color: 'rgba(26,26,46,.5)', marginBottom: 16 }}>Try increasing the search radius or updating your location</div>
            <button onClick={() => handleRadiusChange(25)} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#30d158,#34c759)', color: '#fff', border: 'none', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Search 25 miles →</button>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '24px 0 0', fontSize: 11, color: 'rgba(26,26,46,.3)' }}>
          EV data · Open Charge Map · Real-time availability
        </div>
      </div>
    </>
  )
}