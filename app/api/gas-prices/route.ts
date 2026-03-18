import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${process.env.EIA_API_KEY}&frequency=weekly&data[0]=value&facets[series][]=EMM_EPMRR_PTE_NUS_DPG&sort[0][column]=period&sort[0][direction]=desc&length=8`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) throw new Error('EIA fetch failed')

    const data = await res.json()
    const prices = data.response?.data?.map((item: any) => ({
      period: item.period,
      price:  parseFloat(item.value)
    })) || []

    return NextResponse.json({ prices })

  } catch (err) {
    // Fallback mock data so UI never breaks during dev
    return NextResponse.json({
      prices: [
        { period: '2025-02-24', price: 3.28 },
        { period: '2025-03-03', price: 3.09 },
      ],
      fallback: true
    })
  }
}