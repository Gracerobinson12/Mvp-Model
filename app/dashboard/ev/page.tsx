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

type EVStation = {
  id: number
  name: string
  address: string
  lat: number
  lng: number
  distance: number
  network: string
  ports: number
  available: number
  level: string
  kw: number
  cost: string
  costUnit: string
}

type Coords = { lat: number; lng: number }

const AUBURN_LAT = 32.6099
const AUBURN_LNG = -85.4808

function availColor(available: number, ports: number) {
  if (ports === 0) return '#8e8e93'
  const pct = available / ports
  if (pct === 0) return '#ff453a'
  if (pct < 0.5) return '#ff9f0a'
  return '#30d158'
}

function levelLabel(level: string) {
  if (level === 'L1') return 'Level 1 · 120V'
  if (level === 'L2') return 'Level 2 · 240V'
  if (level === 'DC') return 'DC Fast Charge'
  return level
}

function EVMap({ stations, selectedId, onSelect, userCoords }: {
  stations: EVStation[], selectedId: number | null, onSelect: (id: number) => void, userCoords: Coords | null
}) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef    = useRef<any>(null)
  const mksRef    = useRef<Record<number, any>>({})
  const [exp, setExp] = useState(false)

  const center = userCoords ?? { lat: AUBURN_LAT, lng: AUBURN_LNG }

  const boot = (L: any) => {
    if (!mapDivRef.current || mapRef.current) return
    const map = L.map(mapDivRef.current, { center: [center.lat, center.lng], zoom: 13, zoomControl: false, attributionControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // User dot
    if (center.lat && center.lng) {
      L.marker([center.lat, center.lng], { icon: L.divIcon({ className: '', iconSize: [20, 20], iconAnchor: [10, 10], html: '<div style="width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#ff3b30,#ff6b35);border:3px solid #fff;box-shadow:0 0 0 5px rgba(255,59,48,.18),0 4px 12px rgba(255,59,48,.4)"></div>' }) }).addTo(map)
    }

    stations.forEach(st => {
      if (!st.lat || !st.lng) return
      const avail = availColor(st.available, st.ports)
      const isSel = st.id === selectedId
      const html = `<div style="background:${isSel ? avail : 'rgba(255,255,255,.97)'};border:2px solid ${avail};border-radius:10px;padding:4px 8px;font-size:10px;font-weight:800;color:${isSel ? '#fff' : '#1a1a2e'};box-shadow:${isSel ? `0 4px 14px ${avail}60` : '0 2px 8px rgba(0,0,0,.15)'};white-space:nowrap;font-family:system-ui">⚡ ${st.available}/${st.ports}</div><div style="width:6px;height:6px;border-radius:50%;background:${avail};margin:2px auto 0"></div>`
      const m = L.marker([st.lat, st.lng], { icon: L.divIcon({ className: '', iconSize: [80, 42], iconAnchor: [40, 42], html }) }).addTo(map).on('click', () => onSelect(st.id))
      mksRef.current[st.id] = m
    })

    if (stations.length > 1) {
      const lls = stations.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng] as [number, number])
      try { map.fitBounds(L.latLngBounds([...lls, [center.lat, center.lng]]), { padding: [40, 40], maxZoom: 14 }) } catch {}
    }
    mapRef.current = map
  }

  useEffect(() => {
    if ((window as any).L) { boot((window as any).L); return }
    const loadScript = (src: string, id: string) => new Promise<void>(resolve => {
      if (document.getElementById(id)) { resolve(); return }
      const s = document.createElement('script'); s.id = id; s.src = src; s.onload = () => resolve(); document.head.appendChild(s)
    })
    if (!document.querySelector('#lf-css')) { const l = document.createElement('link'); l.id = 'lf-css'; l.rel = 'stylesheet'; l.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(l) }
    Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', 'lf-js'),
    ]).then(() => boot((window as any).L))
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; mksRef.current = {} } }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !selectedId) return
    const st = stations.find(s => s.id === selectedId)
    if (st?.lat && st?.lng) mapRef.current.panTo([st.lat, st.lng], { animate: true, duration: .4 })
  }, [selectedId])

  useEffect(() => { setTimeout(() => mapRef.current?.invalidateSize(), 350) }, [exp])

  const glass = 'rgba(255,255,255,.92)'

  return (
    <div style={{ marginBottom: exp ? 0 : 12 }}>
      <div style={{ position: exp ? 'fixed' : 'relative', inset: exp ? '0' : undefined, zIndex: exp ? 9990 : undefined, height: exp ? '100vh' : 200, borderRadius: exp ? 0 : 18, overflow: 'hidden', border: exp ? 'none' : '0.5px solid rgba(255,255,255,.9)' }}>
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
        {!exp && (
          <button onClick={() => setExp(true)} style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 401, background: 'rgba(26,26,46,.72)', backdropFilter: 'blur(16px)', border: 'none', borderRadius: 100, padding: '6px 14px', fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>⤢ Explore full map</button>
        )}
        {exp && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 9991 }}>
            <button onClick={() => setExp(false)} style={{ background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(20px)', border: '0.5px solid rgba(255,255,255,.98)', borderRadius: 14, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#1a1a2e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}>← Close map</button>
            <div style={{ background: glass, backdropFilter: 'blur(16px)', border: '0.5px solid rgba(48,209,88,.2)', borderRadius: 12, padding: '8px 14px', pointerEvents: 'none' }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: '#30d158', textTransform: 'uppercase' }}>EV Chargers</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 900, color: '#1a1a2e', lineHeight: 1 }}>{stations.length} stations nearby</div>
            </div>
            <div style={{ width: 80 }} />
          </div>
        )}
        {/* Legend */}
        {!exp && (
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 3, zIndex: 401 }}>
            {[{ color: '#30d158', label: 'Available' }, { color: '#ff9f0a', label: 'Limited' }, { color: '#ff453a', label: 'Full' }].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, border: '1px solid rgba(255,255,255,.7)' }} />
                <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(26,26,46,.7)', background: 'rgba(255,255,255,.7)', padding: '1px 5px', borderRadius: 3 }}>{l.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EVPage() {
  const router  = useRouter()
  const [user,        setUser]       = useState(null)
  const [profile,     setProfile]    = useState(null)
  const [loading,     setLoading]    = useState(true)
  const [stations,    setStations]   = useState<EVStation[]>([])
  const [fetching,    setFetching]   = useState(false)
  const [userCoords,  setCoords]     = useState<Coords | null>(null)
  const [selectedId,  setSelectedId] = useState<number | null>(null)
  const [error,       setError]      = useState('')
  const [mapsStation, setMapsStation] = useState<EVStation | null>(null)

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

  const fetchEV = async (lat: number, lng: number) => {
    setFetching(true); setError('')
    try {
      const res = await fetch(`/api/ev-stations?lat=${lat}&lng=${lng}&radius=10`)
      const data = await res.json()
      if (data.stations?.length) {
        setStations(data.stations)
        setSelectedId(data.stations[0].id)
      } else {
        setError('No EV chargers found in your area. Try a larger radius.')
        setStations([])
      }
    } catch {
      setError('Could not load EV chargers. Please try again.')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (loading) return
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => { const { latitude: lat, longitude: lng } = p.coords; setCoords({ lat, lng }); fetchEV(lat, lng) },
        () => fetchEV(AUBURN_LAT, AUBURN_LNG),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    } else { fetchEV(AUBURN_LAT, AUBURN_LNG) }
  }, [loading])

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  const openMaps = (st: EVStation, app: 'apple' | 'google') => {
    const latLng = `${st.lat},${st.lng}`
    const name = encodeURIComponent(st.name)
    if (app === 'apple') window.open(`maps://maps.apple.com/?ll=${latLng}&q=${name}`)
    else window.open(`https://www.google.com/maps/search/?api=1&query=${latLng}`)
    setMapsStation(null)
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0eff4', fontFamily: 'system-ui', color: 'rgba(26,26,46,.4)', fontSize: 14 }}>Loading...</div>

  const sel = stations.find(s => s.id === selectedId)
  const initial = (profile?.first_name?.[0] || user?.email?.[0] || 'G').toUpperCase()
  const isActive = profile?.plan_status === 'active' || profile?.plan_status === 'trialing' || !!profile?.stripe_customer_id

  const glass = (extra = {}) => ({
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: '0.5px solid rgba(255,255,255,0.92)',
    borderRadius: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    ...extra,
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;background:#f0eff4;background-image:radial-gradient(ellipse 70% 50% at 15% 5%,rgba(48,209,88,0.08) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.06) 0%,transparent 50%);min-height:100vh;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .station-card{transition:all .2s cubic-bezier(.34,1.56,.64,1)}
        .station-card:hover{transform:translateY(-2px)}
        .leaflet-control-zoom{border:none!important}
        .leaflet-control-zoom a{background:rgba(255,255,255,.9)!important;border:1px solid rgba(0,0,0,.1)!important;margin-bottom:3px!important;border-radius:8px!important;display:block!important}
      `}</style>

      {/* Maps Modal */}
      {mapsStation && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(10px)', padding: '0 14px 24px' }} onClick={e => { if (e.target === e.currentTarget) setMapsStation(null) }}>
          <div style={{ background: 'rgba(255,255,255,.97)', borderRadius: '24px 24px 18px 18px', padding: 20, width: '100%', maxWidth: 440, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,.1)', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'rgba(26,26,46,.4)', textTransform: 'uppercase', marginBottom: 4 }}>Open in maps</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 900, letterSpacing: -.5, color: '#1a1a2e', marginBottom: 16 }}>{mapsStation.name}</div>
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

        {/* Header */}
        <div style={{ ...glass({ padding: '20px 24px', marginBottom: 14, border: '0.5px solid rgba(48,209,88,.25)' }), animation: 'fadeUp .5s ease both', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#30d158,transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#30d158,#34c759)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: -.5, color: '#1a1a2e', lineHeight: 1 }}>EV Intelligence</div>
                  <div style={{ fontSize: 11, color: 'rgba(26,26,46,.45)', marginTop: 3 }}>EV chargers near you · Open Charge Map</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(48,209,88,.1)', border: '0.5px solid rgba(48,209,88,.3)', borderRadius: 100, padding: '4px 12px', display: 'inline-flex' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#30d158', animation: 'lp 1.4s ease infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1a7a35' }}>LIVE · {stations.length} chargers found</span>
              </div>
            </div>
            <button onClick={() => { if (userCoords) fetchEV(userCoords.lat, userCoords.lng) }} style={{ padding: '8px 16px', background: 'rgba(48,209,88,.1)', border: '0.5px solid rgba(48,209,88,.3)', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#1a7a35', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              {fetching ? <div style={{ width: 12, height: 12, border: '2px solid rgba(48,209,88,.3)', borderTopColor: '#30d158', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /> : '↺'} Refresh
            </button>
          </div>
        </div>

        {/* Map */}
        {stations.length > 0 && (
          <div style={{ animation: 'fadeUp .5s ease .05s both' }}>
            <EVMap stations={stations} selectedId={selectedId} onSelect={setSelectedId} userCoords={userCoords} />
          </div>
        )}

        {/* Loading */}
        {fetching && stations.length === 0 && (
          <div style={{ ...glass({ padding: '40px 24px', marginBottom: 14, textAlign: 'center' }), animation: 'fadeUp .5s ease both' }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(48,209,88,.2)', borderTopColor: '#30d158', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(26,26,46,.6)' }}>Finding EV chargers near you...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(255,59,48,.06)', border: '0.5px solid rgba(255,59,48,.2)', borderRadius: 18, padding: '16px 20px', marginBottom: 14, fontSize: 13, color: '#cc2018' }}>{error}</div>
        )}

        {/* Selected station detail */}
        {sel && (
          <div style={{ ...glass({ padding: '20px 24px', marginBottom: 14, border: `0.5px solid ${availColor(sel.available, sel.ports)}40` }), animation: 'fadeUp .5s ease .08s both', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${availColor(sel.available, sel.ports)},transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: -.5, color: '#1a1a2e', marginBottom: 4 }}>{sel.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(26,26,46,.5)', marginBottom: 8 }}>📍 {sel.address}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: availColor(sel.available, sel.ports), background: `${availColor(sel.available, sel.ports)}15`, border: `0.5px solid ${availColor(sel.available, sel.ports)}40`, borderRadius: 100, padding: '3px 10px' }}>
                    {sel.available === 0 ? 'All Full' : sel.available === sel.ports ? 'All Available' : `${sel.available} of ${sel.ports} open`}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', background: 'rgba(0,0,0,.04)', borderRadius: 100, padding: '3px 10px' }}>{sel.distance.toFixed(1)} mi</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', background: 'rgba(0,0,0,.04)', borderRadius: 100, padding: '3px 10px' }}>{sel.network}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 900, color: '#30d158', lineHeight: 1 }}>{sel.kw}<span style={{ fontSize: 14, fontWeight: 600 }}>kW</span></div>
                <div style={{ fontSize: 10, color: 'rgba(26,26,46,.4)', marginTop: 2 }}>{levelLabel(sel.level)}</div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Ports', val: `${sel.ports}` },
                { label: 'Available', val: `${sel.available}` },
                { label: 'Cost', val: sel.cost !== 'Free' ? `${sel.cost}${sel.costUnit}` : 'Free' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,.03)', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'rgba(26,26,46,.4)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: '#1a1a2e' }}>{s.val}</div>
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
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(26,26,46,.35)', textTransform: 'uppercase', marginBottom: 10 }}>{stations.length} Chargers Nearby</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stations.map((st, i) => {
                const avail = availColor(st.available, st.ports)
                const isSel = st.id === selectedId
                return (
                  <div key={st.id} className="station-card" onClick={() => setSelectedId(st.id)}
                    style={{ ...glass({ padding: '16px 18px', border: isSel ? `0.5px solid ${avail}50` : '0.5px solid rgba(255,255,255,.92)', cursor: 'pointer', animation: `fadeUp .5s ease ${.14 + i * .04}s both` }) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: `${avail}15`, border: `0.5px solid ${avail}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>⚡</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1a1a2e', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(26,26,46,.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.network} · {st.distance.toFixed(1)} mi · {levelLabel(st.level)}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 900, color: avail, lineHeight: 1 }}>{st.available}/{st.ports}</div>
                        <div style={{ fontSize: 9, color: 'rgba(26,26,46,.4)', marginTop: 2 }}>{st.kw}kW</div>
                      </div>
                    </div>
                    {isSel && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid rgba(0,0,0,.06)', display: 'flex', gap: 8 }}>
                        <button onClick={e => { e.stopPropagation(); setMapsStation(st) }} style={{ flex: 1, padding: '8px', background: `${avail}12`, border: `0.5px solid ${avail}30`, borderRadius: 12, fontSize: 12, fontWeight: 700, color: avail, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Navigate →</button>
                        <div style={{ fontSize: 11, padding: '8px 12px', background: 'rgba(0,0,0,.04)', borderRadius: 12, color: 'rgba(26,26,46,.6)', fontWeight: 600 }}>{st.cost !== 'Free' ? `${st.cost}${st.costUnit}` : 'Free'}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '24px 0 0', fontSize: 11, color: 'rgba(26,26,46,.3)' }}>
          EV data · Open Charge Map · Availability updated in real time
        </div>
      </div>
    </>
  )
}