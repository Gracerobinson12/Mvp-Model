// app/api/stations/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radiusMiles = parseFloat(searchParams.get('radius') || '30')

  if (!lat || !lng) {
    return NextResponse.json({ stations: [] })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!apiKey) {
    return NextResponse.json({ stations: [] })
  }

  // Convert miles to meters, cap at 50km (Google Places max)
  const radiusMeters = Math.min(radiusMiles * 1609.34, 50000)

  try {
    // Fetch up to 60 stations by making 3 paginated requests
    const allStations: any[] = []
    let pageToken: string | null = null

    for (let page = 0; page < 3; page++) {
      const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
      url.searchParams.set('location', `${lat},${lng}`)
      url.searchParams.set('radius', String(radiusMeters))
      url.searchParams.set('type', 'gas_station')
      url.searchParams.set('key', apiKey)
      if (pageToken) url.searchParams.set('pagetoken', pageToken)

      const res = await fetch(url.toString())
      const data = await res.json()

      if (data.results) {
        allStations.push(...data.results)
      }

      pageToken = data.next_page_token || null
      if (!pageToken) break

      // Google requires a short delay before using next_page_token
      await new Promise(r => setTimeout(r, 200))
    }

    const stations = allStations.map((place: any) => ({
      name:    place.name,
      address: place.vicinity || place.formatted_address || '',
      lat:     place.geometry?.location?.lat,
      lng:     place.geometry?.location?.lng,
      placeId: place.place_id,
      rating:  place.rating,
      open:    place.opening_hours?.open_now,
    }))

    return NextResponse.json({ stations })
  } catch (e) {
    console.error('Stations API error:', e)
    return NextResponse.json({ stations: [] })
  }
}