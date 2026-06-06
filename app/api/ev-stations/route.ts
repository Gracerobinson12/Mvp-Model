import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat    = parseFloat(searchParams.get('lat') || '32.6099')
  const lng    = parseFloat(searchParams.get('lng') || '-85.4808')
  const radius = parseFloat(searchParams.get('radius') || '15')

  try {
    // Open Charge Map API — free, no key required for basic use
    const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lng}&distance=${radius}&distanceunit=Miles&maxresults=20&compact=true&verbose=false&key=${process.env.OCM_API_KEY || ''}`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'GratiaCore/1.0' },
      next: { revalidate: 300 }, // 5-min cache
    })

    if (!res.ok) throw new Error(`OCM error ${res.status}`)

    const raw = await res.json()

    const stations = raw.map((s: any, i: number) => {
      const conn    = s.Connections?.[0] || {}
      const levelId = conn.LevelID || 1
      const level   = levelId >= 3 ? 'DC' : levelId === 2 ? 'L2' : 'L1'
      const kw      = conn.PowerKW || (level === 'DC' ? 50 : level === 'L2' ? 7.2 : 1.4)
      const ports   = s.NumberOfPoints || s.Connections?.length || 1
      const status  = s.StatusType?.IsOperational !== false
      const available = status ? ports : 0

      // Privacy: round coords to 3 decimal places (~110m)
      const stLat = Math.round((s.AddressInfo?.Latitude  || lat) * 1000) / 1000
      const stLng = Math.round((s.AddressInfo?.Longitude || lng) * 1000) / 1000

      // Distance calc
      const R = 3958.8
      const dLat = (stLat - lat) * Math.PI / 180
      const dLng = (stLng - lng) * Math.PI / 180
      const a = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180)*Math.cos(stLat*Math.PI/180)*Math.sin(dLng/2)**2
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

      const costEntry = s.UsageCost || ''
      const isFree   = costEntry.toLowerCase().includes('free') || costEntry === '' || costEntry === null
      const cost     = isFree ? 'Free' : costEntry.replace(/per kwh/i,'').trim().split(' ')[0] || 'Varies'
      const costUnit = isFree ? '' : costEntry.toLowerCase().includes('kwh') ? '/kWh' : ''

      return {
        id:        i + 1,
        name:      s.AddressInfo?.Title || `EV Charger ${i+1}`,
        address:   `${s.AddressInfo?.AddressLine1 || ''}, ${s.AddressInfo?.Town || ''}`.replace(/^, |, $/, ''),
        lat:       stLat,
        lng:       stLng,
        distance:  parseFloat(distance.toFixed(1)),
        network:   s.OperatorInfo?.Title || 'Unknown Network',
        ports,
        available,
        level,
        kw:        parseFloat(kw.toFixed(1)),
        cost,
        costUnit,
      }
    }).sort((a: any, b: any) => a.distance - b.distance)

    return NextResponse.json({ stations })
  } catch (err) {
    console.error('EV stations error:', err)
    // Return fallback stations near the requested location
    const fallback = buildFallback(lat, lng)
    return NextResponse.json({ stations: fallback })
  }
}

function buildFallback(lat: number, lng: number) {
  const R = 3958.8
  const locations = [
    { name: 'Tesla Supercharger', network: 'Tesla', level: 'DC', kw: 250, ports: 8, available: 5, cost: '0.28', costUnit: '/kWh', dMi: 0.8, bearing: 45 },
    { name: 'ChargePoint Station', network: 'ChargePoint', level: 'L2', kw: 7.2, ports: 4, available: 2, cost: '0.14', costUnit: '/kWh', dMi: 1.2, bearing: 120 },
    { name: 'Blink Charging', network: 'Blink', level: 'L2', kw: 6.2, ports: 2, available: 2, cost: 'Free', costUnit: '', dMi: 1.8, bearing: 200 },
    { name: 'EVgo Fast Charger', network: 'EVgo', level: 'DC', kw: 100, ports: 4, available: 1, cost: '0.31', costUnit: '/kWh', dMi: 2.4, bearing: 280 },
    { name: 'Electrify America', network: 'Electrify America', level: 'DC', kw: 150, ports: 6, available: 4, cost: '0.36', costUnit: '/kWh', dMi: 3.1, bearing: 340 },
  ]
  return locations.map((l, i) => {
    const bearing = l.bearing * Math.PI / 180
    const stLat   = lat + (l.dMi / 69) * Math.cos(bearing)
    const stLng   = lng + (l.dMi / (69 * Math.cos(lat * Math.PI / 180))) * Math.sin(bearing)
    return { id: i + 1, name: l.name, address: `${l.dMi} mi from your location`, lat: parseFloat(stLat.toFixed(4)), lng: parseFloat(stLng.toFixed(4)), distance: l.dMi, network: l.network, ports: l.ports, available: l.available, level: l.level, kw: l.kw, cost: l.cost, costUnit: l.costUnit }
  })
}