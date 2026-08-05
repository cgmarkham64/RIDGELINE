const EARTH_RADIUS_M = 6_371_000
const METERS_PER_MILE = 1_609.344
const DEGREES_PER_HALF_CIRCLE = 180
export const DEG_TO_RAD = Math.PI / DEGREES_PER_HALF_CIRCLE

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD
  const dLon = (lon2 - lon1) * DEG_TO_RAD
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.asin(Math.sqrt(a))
}

export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineMeters(lat1, lon1, lat2, lon2) / METERS_PER_MILE
}

export function haversinePathMiles(path: [number, number][]): number {
  let d = 0
  for (let i = 1; i < path.length; i++) {
    d += haversineMiles(path[i - 1][0], path[i - 1][1], path[i][0], path[i][1])
  }
  return d
}
