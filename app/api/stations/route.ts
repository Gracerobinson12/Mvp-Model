import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=gas_station&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
    )

    if (!res.ok) throw new Error('Places fetch failed')

    const data = await res.json()

    const stations = data.results?.slice(0, 6).map((place: any, i: number) => ({
      id:       i + 1,
      name:     place.name,
      address:  place.vicinity,
      lat:      place.geometry.location.lat,
      lng:      place.geometry.location.lng,
      placeId:  place.place_id,
      updated:  `${Math.floor(Math.random() * 15) + 1}m ago`,
      trending: ['down', 'stable', 'up'][Math.floor(Math.random() * 3)],
    }))

    return NextResponse.json({ stations })

  } catch (err) {
    return NextResponse.json({ stations: [], error: 'Places API unavailable' })
  }
}