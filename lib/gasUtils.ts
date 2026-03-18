export function distanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1))
}

export function simulatePrices(baseRegular: number) {
  const offsets = [-0.08, -0.05, -0.02, 0, 0.04, 0.09, 0.13]
  const offset = offsets[Math.floor(Math.random() * offsets.length)]
  return {
    regular: parseFloat((baseRegular + offset).toFixed(2)),
    mid:     parseFloat((baseRegular + offset + 0.30).toFixed(2)),
    premium: parseFloat((baseRegular + offset + 0.60).toFixed(2)),
    diesel:  parseFloat((baseRegular + offset + 0.45).toFixed(2)),
  }
}

export const IRS_RATE_2025 = 0.70

export function calcMonthlyDeduction(milesPerWeek: number): number {
  return parseFloat((milesPerWeek * 4.33 * IRS_RATE_2025).toFixed(2))
}

export function calcMonthlyFuelCost(
  milesPerWeek: number,
  pricePerGallon: number,
  mpg = 28
): number {
  return parseFloat(((milesPerWeek / mpg) * pricePerGallon * 4.33).toFixed(2))
}