import type { WaypointType } from '../types'

const OVERPASS_URL     = 'https://overpass-api.de/api/interpreter'
const MAX_SNAP_DIST_M  = 400
const MAX_VERT_DROP_M  = 40       // ~130 ft — sources below this are effectively off a cliff
const CLUSTER_MI       = 0.35     // within 0.35 miles, only the most reliable source shows
const EARTH_RADIUS_M   = 6_371_000
const METRES_PER_MILE  = 1_609.344
const CACHE_TTL_MS     = 30 * 60 * 1000  // 30 minutes
const RETRY_DELAY_MS   = 6_000            // wait 6 s before retrying a 429

export type OsmWaterClass = 'spring' | 'stream' | 'river' | 'lake' | 'drinking_water'

export interface DetectedWaterSource {
  id: string
  lat: number
  lon: number
  label: string
  osmClass: OsmWaterClass
  intermittent: boolean
  waypointType: WaypointType
  distFromStartMi: number
  snapDistM: number
  checkDate?: string  // OSM check_date or survey:date tag (YYYY-MM-DD)
}

// ─── Cache + fetch helpers ────────────────────────────────────────────────────

function readCache(key: string): DetectedWaterSource[] | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw) as { data: DetectedWaterSource[]; ts: number }
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(key); return null }
    return data
  } catch { return null }
}

function writeCache(key: string, data: DetectedWaterSource[]): void {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch { /* quota */ }
}

async function overpassFetch(query: string): Promise<Response> {
  const opts: RequestInit = {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }
  const res = await fetch(OVERPASS_URL, opts)
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
    return fetch(OVERPASS_URL, opts)
  }
  return res
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dφ = (lat2 - lat1) * Math.PI / 180
  const dλ = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dφ / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dλ / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.asin(Math.sqrt(a))
}

function haversineMi(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineM(lat1, lon1, lat2, lon2) / METRES_PER_MILE
}

// Projects point P onto segment AB; returns t ∈ [0,1] and nearest point.
function nearestOnSegment(
  pLat: number, pLon: number,
  aLat: number, aLon: number,
  bLat: number, bLon: number,
): { t: number; lat: number; lon: number } {
  const dLat = bLat - aLat
  const dLon = bLon - aLon
  const lenSq = dLat * dLat + dLon * dLon
  if (lenSq === 0) return { t: 0, lat: aLat, lon: aLon }
  const t = Math.max(0, Math.min(1, ((pLat - aLat) * dLat + (pLon - aLon) * dLon) / lenSq))
  return { t, lat: aLat + t * dLat, lon: aLon + t * dLon }
}

function buildCumulDistMi(coords: [number, number, number][]): number[] {
  const d = [0]
  for (let i = 1; i < coords.length; i++) {
    const [lon1, lat1] = coords[i - 1]
    const [lon2, lat2] = coords[i]
    d.push(d[i - 1] + haversineMi(lat1, lon1, lat2, lon2))
  }
  return d
}

// Returns snap metadata including interpolated route elevation at the snap point.
// coords are [lon, lat, ele] (GPX convention). Returns null if >MAX_SNAP_DIST_M off-trail.
function snapToRoute(
  lat: number,
  lon: number,
  coords: [number, number, number][],
  cumulDistMi: number[],
): { distFromStartMi: number; snapDistM: number; snapEleM: number } | null {
  let bestDist = Infinity
  let bestCumul = 0
  let bestEle = 0

  for (let i = 0; i < coords.length - 1; i++) {
    const [aLon, aLat, aEle] = coords[i]
    const [bLon, bLat, bEle] = coords[i + 1]
    const { t, lat: sLat, lon: sLon } = nearestOnSegment(lat, lon, aLat, aLon, bLat, bLon)
    const dist = haversineM(lat, lon, sLat, sLon)
    if (dist < bestDist) {
      bestDist = dist
      const segMi = haversineMi(aLat, aLon, bLat, bLon)
      bestCumul = cumulDistMi[i] + t * segMi
      bestEle   = aEle + t * (bEle - aEle)
    }
  }

  if (bestDist > MAX_SNAP_DIST_M) return null
  return { distFromStartMi: bestCumul, snapDistM: Math.round(bestDist), snapEleM: bestEle }
}

// ─── Elevation lookup ─────────────────────────────────────────────────────────

// Batch-queries Open-Meteo for ground elevation at each point.
// Returns 0 for any point if the request fails (caller skips vert filter on 0).
async function fetchElevations(points: { lat: number; lon: number }[]): Promise<number[]> {
  if (points.length === 0) return []
  const lats = points.map(p => p.lat).join(',')
  const lons = points.map(p => p.lon).join(',')
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`
    )
    if (!res.ok) return points.map(() => 0)
    const data: { elevation: (number | null)[] } = await res.json()
    return data.elevation.map(e => e ?? 0)
  } catch {
    return points.map(() => 0)
  }
}

// ─── Clustering ───────────────────────────────────────────────────────────────

// Within CLUSTER_MI along the route, keep only the most reliable source.
// A source that has no competitors within that window is always kept.
// no-water sources are exempt — they're hazard warnings, not water.
function deduplicateWaterSources(sources: DetectedWaterSource[]): DetectedWaterSource[] {
  const rank = (t: WaypointType): number =>
    t === 'lots-of-water' ? 2 : t === 'some-water' ? 1 : 0

  return sources.filter(src => {
    if (src.waypointType === 'no-water') return true
    return !sources.some(other => {
      if (other.id === src.id) return false
      if (Math.abs(other.distFromStartMi - src.distFromStartMi) > CLUSTER_MI) return false
      const ro = rank(other.waypointType), rs = rank(src.waypointType)
      if (ro !== rs) return ro > rs
      // Equal rank: prefer closer to trail, then stable id tiebreak
      return other.snapDistM < src.snapDistM ||
        (other.snapDistM === src.snapDistM && other.id < src.id)
    })
  })
}

// ─── Classification ───────────────────────────────────────────────────────────

function classifyType(tags: Record<string, string>, osmClass: OsmWaterClass): WaypointType {
  if (tags.access === 'no' || tags['disused:natural'] === 'spring') return 'no-water'
  if (tags.intermittent === 'yes' || tags.seasonal === 'yes') return 'some-water'
  if (osmClass === 'drinking_water') return 'lots-of-water'
  return 'lots-of-water'
}

function osmLabel(tags: Record<string, string>, osmClass: OsmWaterClass): string {
  if (tags.name) return tags.name
  const defaults: Record<OsmWaterClass, string> = {
    spring: 'Spring',
    stream: 'Stream',
    river: 'River',
    lake: 'Lake',
    drinking_water: 'Drinking Water',
  }
  return defaults[osmClass]
}

// ─── Public API ───────────────────────────────────────────────────────────────

// routeCoords: [lon, lat, ele] (GPX convention)
export async function fetchDetectedWaterSources(
  routeCoords: [number, number, number][],
): Promise<DetectedWaterSource[]> {
  if (routeCoords.length < 2) return []

  const lats = routeCoords.map(c => c[1])
  const lons = routeCoords.map(c => c[0])
  const PAD = 0.01
  const south = Math.min(...lats) - PAD
  const west  = Math.min(...lons) - PAD
  const north = Math.max(...lats) + PAD
  const east  = Math.max(...lons) + PAD
  const bbox  = `${south},${west},${north},${east}`

  const query = `[out:json][timeout:25];
(
  node["natural"="spring"](${bbox});
  node["amenity"="drinking_water"](${bbox});
  way["waterway"="stream"](${bbox});
  way["waterway"="river"](${bbox});
);
out center;`

  const cacheKey = `ridgeline-water-${bbox}`
  const cached = readCache(cacheKey)
  if (cached) return cached

  const resp = await overpassFetch(query)
  if (!resp.ok) throw new Error(`Overpass API returned ${resp.status}`)

  const data = await resp.json() as {
    elements: Array<{
      type: 'node' | 'way'
      id: number
      lat?: number
      lon?: number
      center?: { lat: number; lon: number }
      tags?: Record<string, string>
    }>
  }

  // Check whether the GPX has real elevation data (non-zero on at least one point).
  const routeHasElevation = routeCoords.some(c => c[2] !== 0)

  const cumulDistMi = buildCumulDistMi(routeCoords)
  const seen = new Set<string>()

  type Candidate = DetectedWaterSource & { snapEleM: number }
  const candidates: Candidate[] = []

  for (const el of data.elements) {
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (lat == null || lon == null) continue

    const tags = el.tags ?? {}
    let osmClass: OsmWaterClass
    if      (tags.natural === 'spring')         osmClass = 'spring'
    else if (tags.amenity === 'drinking_water')  osmClass = 'drinking_water'
    else if (tags.waterway === 'stream')         osmClass = 'stream'
    else if (tags.waterway === 'river')          osmClass = 'river'
    else continue

    const key = `${el.type}-${el.id}`
    if (seen.has(key)) continue
    seen.add(key)

    const snap = snapToRoute(lat, lon, routeCoords, cumulDistMi)
    if (!snap) continue

    candidates.push({
      id: `osm-${key}`,
      lat,
      lon,
      label: osmLabel(tags, osmClass),
      osmClass,
      intermittent: tags.intermittent === 'yes' || tags.seasonal === 'yes',
      waypointType: classifyType(tags, osmClass),
      distFromStartMi: snap.distFromStartMi,
      snapDistM: snap.snapDistM,
      snapEleM: snap.snapEleM,
      checkDate: tags['check_date'] ?? tags['survey:date'],
    })
  }

  // Apply vertical drop filter when the GPX has elevation data.
  let results: DetectedWaterSource[]
  if (routeHasElevation && candidates.length > 0) {
    const sourceElevations = await fetchElevations(candidates.map(c => ({ lat: c.lat, lon: c.lon })))
    results = candidates.filter((c, i) => {
      const srcEle = sourceElevations[i]
      // srcEle === 0 means lookup failed — skip the vert filter for that source.
      if (srcEle === 0) return true
      return c.snapEleM - srcEle <= MAX_VERT_DROP_M
    })
  } else {
    results = candidates
  }

  results.sort((a, b) => a.distFromStartMi - b.distFromStartMi)
  const final = deduplicateWaterSources(results)
  writeCache(cacheKey, final)
  return final
}