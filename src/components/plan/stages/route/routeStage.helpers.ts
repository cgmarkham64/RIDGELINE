import type { CheckRow, RoutePreview, SegRow, WaterEntry, MergedRow } from './routeStage.types'
import type { DetectedWaterSource } from '../../../../lib/waterSources'
import type { Waypoint } from '../../../../types'
import { haversineMiles, haversinePathMiles } from '../../../../lib/geo'

export const DEFAULT_CHECKLIST: CheckRow[] = [
  { text: 'Route picked',                  done: false },
  { text: 'Entry trailhead set',           done: false },
  { text: 'Exit trailhead set',            done: false },
  { text: 'Distance confirmed',            done: false },
  { text: 'Elevation gain confirmed',      done: false },
  { text: 'Segments reviewed',             done: false },
  { text: 'Exposure & water annotated',    done: false, readonly: true },
]

const AMBER = '#f0a030'

export const SEG_COLORS = [AMBER, '#4ade80', '#a78bfa', '#f472b6', '#60a5fa', '#34d399', '#fb923c', '#f87171']

export const EXP_LABEL: Record<string, string> = {
  low:     'Low Exposure',
  med:     'Moderate Exposure',
  high:    'High Exposure',
  extreme: 'Extreme Exposure',
}

export const GRID      = '20px 1fr 60px 72px 72px 40px'
export const DRAG_GRID = '14px 20px 1fr 60px 72px 72px 40px'
export const ACTIVE_BG = 'var(--color-amber-dim)'

export function toLatLngs(coords: [number, number, number][] | undefined): [number, number][] {
  return coords?.map(([lon, lat]) => [lat, lon]) ?? []
}

export function gpxCoordsToMiles(coords: [number, number, number][]): number {
  return haversinePathMiles(coords.map(([lon, lat]) => [lat, lon]))
}

export function buildGpx(coords: [number, number, number][], name: string): string {
  const trkpts = coords.map(([lon, lat, ele]) =>
    `    <trkpt lat="${lat}" lon="${lon}">${ele ? `<ele>${ele}</ele>` : ''}</trkpt>`
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Ridgeline" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`
}

export function downloadGpx(coords: [number, number, number][], name: string) {
  const blob = new Blob([buildGpx(coords, name)], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.toLowerCase().replace(/\s+/g, '-')}.gpx`
  a.click()
  URL.revokeObjectURL(url)
}

export function closestGpxIdx(coords: [number, number, number][], pin: [number, number]): number {
  let best = 0, bestDist = Infinity
  for (let i = 0; i < coords.length; i++) {
    const dlat = coords[i][1] - pin[0]
    const dlon = coords[i][0] - pin[1]
    const d = dlat * dlat + dlon * dlon
    if (d < bestDist) { bestDist = d; best = i }
  }
  return best
}

export async function fetchRoutePreview(
  start: [number, number],
  end: [number, number],
  gpxCoords?: [number, number, number][],
): Promise<RoutePreview> {
  if (gpxCoords && gpxCoords.length > 1) {
    let si = closestGpxIdx(gpxCoords, start)
    let ei = closestGpxIdx(gpxCoords, end)
    if (si !== ei) {
      if (si > ei) [si, ei] = [ei, si]
      const slice = gpxCoords.slice(si, ei + 1)
      const path: [number, number][] = slice.map(([lon, lat]) => [lat, lon])
      const rawElevs = slice.map(([,, ele]) => ele)
      const mi = haversinePathMiles(path)
      let gain = 0
      for (let i = 1; i < rawElevs.length; i++) {
        const delta = rawElevs[i] - rawElevs[i - 1]
        if (delta > 0) gain += delta * 3.28084
      }
      gain = Math.round(gain / 10) * 10
      const SAMPLES = 60
      const step = Math.max(1, Math.floor(rawElevs.length / SAMPLES))
      const sparkElevs = rawElevs.filter((_, i) => i % step === 0 || i === rawElevs.length - 1)
      return { path, mi, gain, sparkElevs }
    }
  }

  const STEPS = 20
  const path: [number, number][] = Array.from({ length: STEPS + 1 }, (_, i) => [
    start[0] + (end[0] - start[0]) * (i / STEPS),
    start[1] + (end[1] - start[1]) * (i / STEPS),
  ] as [number, number])
  const mi = haversinePathMiles(path)
  const sampled = path.filter((_, i) => i % 2 === 0 || i === path.length - 1)
  let sparkElevs: number[] = []
  let gain = 0
  try {
    const locations = sampled.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))
    const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations }),
    })
    const data = await res.json()
    sparkElevs = (data.results as { elevation: number }[]).map(r => r.elevation)
    for (let i = 1; i < sparkElevs.length; i++) {
      const delta = sparkElevs[i] - sparkElevs[i - 1]
      if (delta > 0) gain += delta * 3.28084
    }
    gain = Math.round(gain / 10) * 10
  } catch { /* no elevation data */ }
  return { path, mi, gain, sparkElevs }
}

export function formatCoord([lat, lng]: [number, number]): string {
  return `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`
}

export function snapToRouteMi(lat: number, lon: number, coords: [number, number, number][]): number {
  let best = 0, bestSq = Infinity
  for (let i = 0; i < coords.length; i++) {
    const dlat = coords[i][1] - lat, dlon = coords[i][0] - lon
    const sq = dlat * dlat + dlon * dlon
    if (sq < bestSq) { bestSq = sq; best = i }
  }
  let d = 0
  for (let i = 1; i <= best; i++) {
    const [lon1, lat1] = coords[i - 1]
    const [lon2, lat2] = coords[i]
    d += haversineMiles(lat1, lon1, lat2, lon2)
  }
  return d
}

export function splitSegmentAt(
  seg: SegRow,
  edgeIdx: number,
  splitPoint: [number, number],
): { segA: Omit<SegRow, 'n'>; segB: Omit<SegRow, 'n'> } | null {
  if (!seg.path || edgeIdx < 0 || edgeIdx >= seg.path.length - 1) return null
  const pathA = [...seg.path.slice(0, edgeIdx + 1), splitPoint]
  const pathB = [splitPoint, ...seg.path.slice(edgeIdx + 1)]
  if (pathA.length < 2 || pathB.length < 2) return null
  const miA    = haversinePathMiles(pathA)
  const miB    = haversinePathMiles(pathB)
  const ratio  = (miA + miB) > 0 ? miA / (miA + miB) : 0.5
  return {
    segA: {
      name: seg.name, mi: parseFloat(miA.toFixed(1)),
      gain: Math.round(seg.gain * ratio), notes: seg.notes,
      path: pathA, water: seg.water, exposure: seg.exposure, hard: seg.hard,
      wakeTime: seg.wakeTime, onTrailTime: seg.onTrailTime, campByTime: seg.campByTime,
    },
    segB: {
      name: seg.name + ' (cont.)', mi: parseFloat(miB.toFixed(1)),
      gain: Math.round(seg.gain * (1 - ratio)), notes: '',
      path: pathB, water: seg.water, exposure: seg.exposure, hard: undefined,
      wakeTime: undefined, onTrailTime: undefined, campByTime: undefined,
    },
  }
}

export function resolveTimePreference(
  pref: { mode: string; anchor?: string; offsetMinutes?: number; staticTime?: string },
  sunriseHHMM: string,
  sunsetHHMM: string,
): string {
  if (pref.mode === 'static') return pref.staticTime ?? sunriseHHMM
  const anchor = pref.anchor === 'sunset' ? sunsetHHMM : sunriseHHMM
  return addMinutesToTime(anchor, pref.offsetMinutes ?? 0)
}

export function addMinutesToTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = ((h * 60 + m + minutes) % 1440 + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export async function fetchSunTimes(
  lat: number,
  lng: number,
  date: string,
): Promise<{ sunrise: string; sunset: string } | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&daily=sunrise,sunset&timezone=auto&start_date=${date}&end_date=${date}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const sunrise = (data.daily?.sunrise?.[0] as string | undefined)
    const sunset  = (data.daily?.sunset?.[0]  as string | undefined)
    if (!sunrise || !sunset) return null
    // Returned as "2024-07-15T05:23" — extract HH:MM
    return { sunrise: sunrise.slice(11, 16), sunset: sunset.slice(11, 16) }
  } catch {
    return null
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    )
    const data = await res.json()
    return data.name || data.display_name?.split(',')[0] || ''
  } catch {
    return ''
  }
}

// ─── Merged route + water rows ────────────────────────────────────────────────

const WATER_TYPES = new Set(['lots-of-water', 'some-water', 'no-water'])

export function buildMergedRows(
  segments: SegRow[],
  detectedWater: DetectedWaterSource[],
  waypoints: Waypoint[] | undefined,
  routeCoords: [number, number, number][] | undefined,
): MergedRow[] {
  const waterEntries: WaterEntry[] = detectedWater.map(d => ({
    id: d.id, label: d.label, waypointType: d.waypointType,
    distFromStartMi: d.distFromStartMi, snapDistM: d.snapDistM,
    isDetected: true, lat: d.lat, lon: d.lon,
  }))

  if (routeCoords && routeCoords.length >= 2) {
    for (const wp of (waypoints ?? [])) {
      if (!WATER_TYPES.has(wp.type)) continue
      waterEntries.push({
        id: wp.id, label: wp.label || wp.type,
        waypointType: wp.type as WaterEntry['waypointType'],
        distFromStartMi: snapToRouteMi(wp.lat, wp.lon, routeCoords),
        isDetected: false, lat: wp.lat, lon: wp.lon,
      })
    }
  }
  waterEntries.sort((a, b) => a.distFromStartMi - b.distFromStartMi)

  if (segments.length === 0 && waterEntries.length === 0) return []

  let cumul = 0
  const campDists: number[] = []
  for (const seg of segments) { cumul += seg.mi; campDists.push(cumul) }

  const rows: MergedRow[] = []

  if (segments.length > 0) {
    const firstWater = waterEntries.find(w => w.waypointType !== 'no-water')
    const thPos = segments[0]?.path?.[0] ?? null
    rows.push({
      kind: 'start',
      toNextCampMi: campDists[0] ?? null,
      toNextWaterMi: firstWater?.distFromStartMi ?? null,
      lat: thPos ? thPos[0] : null,
      lon: thPos ? thPos[1] : null,
    })
  }

  for (let i = 0; i < segments.length; i++) {
    const dist     = campDists[i]
    const isFinish = i === segments.length - 1
    const nextDist = campDists[i + 1] ?? null
    const nextWater = waterEntries.find(w => w.distFromStartMi > dist && w.waypointType !== 'no-water')
    const dryLeg   = !isFinish && !waterEntries.some(
      w => w.distFromStartMi > dist && nextDist !== null && w.distFromStartMi < nextDist && w.waypointType !== 'no-water'
    )
    rows.push({
      kind: 'camp', seg: segments[i], segIdx: i,
      distFromStartMi: dist, isFinish,
      toNextCampMi: nextDist !== null ? nextDist - dist : null,
      toNextWaterMi: nextWater ? nextWater.distFromStartMi - dist : null,
      dryLeg,
    })
  }

  for (let i = 0; i < waterEntries.length; i++) {
    const next = waterEntries[i + 1]
    rows.push({
      kind: 'water', entry: waterEntries[i],
      toNextWaterMi: next ? next.distFromStartMi - waterEntries[i].distFromStartMi : null,
    })
  }

  if (routeCoords && routeCoords.length >= 2) {
    for (const wp of (waypoints ?? [])) {
      if (WATER_TYPES.has(wp.type)) continue
      rows.push({ kind: 'waypoint', wp, distFromStartMi: snapToRouteMi(wp.lat, wp.lon, routeCoords) })
    }
  }

  const rowDist = (r: MergedRow): number =>
    r.kind === 'start' ? -Infinity
    : r.kind === 'camp' ? r.distFromStartMi
    : r.kind === 'waypoint' ? r.distFromStartMi
    : r.entry.distFromStartMi
  const rowRank = (r: MergedRow): number =>
    r.kind === 'camp' ? 0 : r.kind === 'waypoint' ? 1 : r.kind === 'water' ? 2 : -1

  rows.sort((a, b) => {
    const d = rowDist(a) - rowDist(b)
    return d !== 0 ? d : rowRank(a) - rowRank(b)
  })

  return rows
}