/**
 * zoneGeometry.ts — permit-zone spatial analysis for RIDGELINE.
 * Dependency-free (no turf). Works with the zone GeoJSON in src/data/.
 *
 * Coordinate conventions:
 *  - GeoJSON geometry: [lon, lat]  (matches server gpxCoords [lon, lat, ele])
 *  - Leaflet paths / SegRow.path:  [lat, lng]
 * Helpers below take explicit { lat, lon } to avoid mixups.
 */

export interface ZoneProps {
  id: string
  name: string
  wilderness: string
  agency: string
  acres: number
  campfires_allowed: boolean
  camping_allowed: boolean
  camping_closure: string | null            // "05-01/11-30" for Four Lakes
  designated_sites_only: boolean
  bear_canister_required: boolean
  dogs_allowed?: boolean
  group_size_max?: number
  /** True when a master/core permit for this wilderness area also covers camping
   *  in this zone (e.g. Enchantments Core permit) — absent for areas without one. */
  core_permit_valid_here?: boolean
  /** False for "partial coverage" collections' boundary feature (e.g. MBSW wilderness) —
   *  camping there needs only trailhead self-registration, not a bookable permit.
   *  Absent/true everywhere else. */
  permit_required?: boolean
  /** True on a partial-coverage collection's boundary feature — camping inside it but
   *  outside every real zone needs only trailhead self-registration. */
  self_register_required?: boolean
  overnight_permit: {
    required: boolean
    season_start?: string
    season_end?: string
    /** MM-DD/MM-DD window when a per-person nightly fee applies (MBSW: fee year-round
     *  permit, fee only part of the year) — absent when the fee (if any) applies whenever
     *  the permit is required. */
    fee_window?: string
    /** How overnight permits are allocated. Defaults to quota (IPW-style purchase)
     *  when absent — lottery (Enchantments) and advance-reservation (MBSW) areas set this. */
    allocation?: 'quota' | 'lottery' | 'advance-reservation'
  }
  // Permit systems differ per area (IPW: quota-purchase product ids; Enchantments:
  // lottery ids) — keyed loosely rather than a fixed shape so both fit.
  recgov: Record<string, string>
  accuracy_note: string
  /** Free-text campfire restriction, e.g. elevation-based bans — shown in place of the
   *  generic "campfires prohibited" warning when present. */
  campfire_note?: string
}

export interface ZoneFeature {
  type: 'Feature'
  properties: ZoneProps
  geometry: { type: 'Polygon'; coordinates: number[][][] }
}

export interface ZoneCollection {
  type: 'FeatureCollection'
  features: ZoneFeature[]
}

export interface LatLon { lat: number; lon: number }

// ─── Core geometry ────────────────────────────────────────────────────────────

/** Ray-casting point-in-polygon (handles holes). Coordinates are [lon, lat]. */
function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function pointInPolygon(p: LatLon, poly: number[][][]): boolean {
  if (!pointInRing(p.lon, p.lat, poly[0])) return false
  for (let h = 1; h < poly.length; h++) {
    if (pointInRing(p.lon, p.lat, poly[h])) return false
  }
  return true
}

const METERS_PER_DEGREE_LAT = 111_320
const DEGREES_PER_HALF_CIRCLE = 180
const DEG_TO_RAD = Math.PI / DEGREES_PER_HALF_CIRCLE

/** Approx. distance in meters from a point to a polygon's exterior ring. */
function distToRingMeters(p: LatLon, ring: number[][]): number {
  const mLat = METERS_PER_DEGREE_LAT
  const mLon = METERS_PER_DEGREE_LAT * Math.cos(p.lat * DEG_TO_RAD)
  let best = Infinity
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const ax = (ring[j][0] - p.lon) * mLon, ay = (ring[j][1] - p.lat) * mLat
    const bx = (ring[i][0] - p.lon) * mLon, by = (ring[i][1] - p.lat) * mLat
    const dx = bx - ax, dy = by - ay
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)))
    const ex = ax + t * dx, ey = ay + t * dy
    best = Math.min(best, Math.hypot(ex, ey))
  }
  return best
}

// ─── Zone lookup ──────────────────────────────────────────────────────────────

export interface ZoneHit {
  zone: ZoneFeature | null
  /** true when the point is outside every zone but within `toleranceM` of one —
   *  digitized boundaries carry ~15–40 m uncertainty, so treat as "verify". */
  nearBoundary: boolean
  distanceM: number
}

/** Find the zone containing a point, with a near-boundary fallback. */
export function zoneAt(p: LatLon, zones: ZoneCollection, toleranceM = 60): ZoneHit {
  for (const f of zones.features) {
    if (pointInPolygon(p, f.geometry.coordinates)) {
      const d = distToRingMeters(p, f.geometry.coordinates[0])
      return { zone: f, nearBoundary: d < toleranceM, distanceM: 0 }
    }
  }
  let best: { f: ZoneFeature; d: number } | null = null
  for (const f of zones.features) {
    const d = distToRingMeters(p, f.geometry.coordinates[0])
    if (!best || d < best.d) best = { f, d }
  }
  if (best && best.d < toleranceM) {
    return { zone: best.f, nearBoundary: true, distanceM: best.d }
  }
  return { zone: null, nearBoundary: false, distanceM: best?.d ?? Infinity }
}

/** All zones a route passes through, in traversal order (dedup consecutive).
 *  `route` is [lat, lng][] (SegRow.path convention). Sampled every point. */
export function zonesAlongRoute(
  route: [number, number][],
  zones: ZoneCollection
): ZoneFeature[] {
  const out: ZoneFeature[] = []
  let lastId: string | null = null
  for (const [lat, lng] of route) {
    const hit = zoneAt({ lat, lon: lng }, zones, 0)
    const id = hit.zone?.properties.id ?? null
    if (id && id !== lastId) {
      out.push(hit.zone!)
      lastId = id
    } else if (!id) {
      lastId = null
    }
  }
  const seen = new Set<string>()
  return out.filter(f => !seen.has(f.properties.id) && seen.add(f.properties.id))
}

// ─── Permit derivation ────────────────────────────────────────────────────────

export interface CampNight {
  date: string          // ISO yyyy-mm-dd — the night's date
  point: LatLon
  label?: string        // e.g. segment/camp name
}

export interface PermitNeed {
  zone: ZoneFeature
  nights: CampNight[]   // consecutive nights grouped per zone stay
  inSeason: boolean     // any night inside the zone's permit season, when it has one
  warnings: string[]
}

const ISO_YEAR_PREFIX_LENGTH = 5 // length of "YYYY-"

function inWindow(date: string, start: string | undefined, end: string | undefined): boolean {
  if (!start || !end) return false
  const mmdd = date.slice(ISO_YEAR_PREFIX_LENGTH)
  return mmdd >= start && mmdd <= end
}

/**
 * Derive overnight permit needs from planned camps.
 * Permits attach to WHERE YOU CAMP each night, not the zones you hike
 * through — one need per zone-stay (consecutive nights in one zone).
 * Zones with `permit_required: false` (e.g. a partial-coverage collection's
 * self-register wilderness boundary) come back as `selfRegister`, not `needs` —
 * camping there requires only trailhead self-registration, not a bookable permit.
 */
// Fallback shown when distanceM is 0 (point resolved inside the zone, not measured
// against the boundary) — matches zoneAt's default toleranceM-adjacent estimate.
const NEAR_BOUNDARY_FALLBACK_M = 40

export function derivePermitNeeds(
  camps: CampNight[],
  zones: ZoneCollection
): { needs: PermitNeed[]; selfRegister: PermitNeed[]; unresolved: CampNight[] } {
  const needs: PermitNeed[] = []
  const selfRegister: PermitNeed[] = []
  const unresolved: CampNight[] = []
  let current: PermitNeed | null = null

  for (const camp of [...camps].sort((a, b) => a.date.localeCompare(b.date))) {
    const hit = zoneAt(camp.point, zones)
    if (!hit.zone) {
      unresolved.push(camp)
      current = null
      continue
    }
    const p = hit.zone.properties
    if (current && current.zone.properties.id === p.id) {
      current.nights.push(camp)
    } else {
      current = { zone: hit.zone, nights: [camp], inSeason: false, warnings: [] }
      ;(p.permit_required === false ? selfRegister : needs).push(current)
    }
    if (inWindow(camp.date, p.overnight_permit.season_start, p.overnight_permit.season_end)) {
      current.inSeason = true
    }
    if (hit.nearBoundary) {
      current.warnings.push(
        `${camp.date}: camp is within ~${Math.round(hit.distanceM) || NEAR_BOUNDARY_FALLBACK_M} m of a zone boundary — verify zone before booking`
      )
    }
  }

  for (const n of [...needs, ...selfRegister]) {
    const p = n.zone.properties
    if (!p.camping_allowed) {
      n.warnings.unshift(`${p.name} is CLOSED to camping (${p.camping_closure}) — move this camp`)
    }
    if (p.designated_sites_only) {
      n.warnings.push(`${p.name}: camping only at designated sites`)
    }
    if (p.bear_canister_required) {
      n.warnings.push(`${p.name}: bear canister required`)
    }
    if (!p.campfires_allowed) {
      n.warnings.push(p.campfire_note ?? `${p.name}: campfires prohibited`)
    }
    if (p.dogs_allowed === false) {
      n.warnings.push(`${p.name}: no dogs`)
    }
    if (p.group_size_max != null) {
      n.warnings.push(`${p.name}: max group size ${p.group_size_max}`)
    }
  }

  const zonesInStay = new Map(needs.map(n => [n.zone.properties.id, n.zone.properties]))
  const corePermitZones = [...zonesInStay.values()].filter(p => p.core_permit_valid_here)
  if (corePermitZones.length > 1) {
    const note = `A single core permit covers camping in any of: ${corePermitZones.map(p => p.name).join(', ')} — ` +
      `you may only need one permit for this trip instead of one per zone.`
    needs.forEach(n => {
      if (n.zone.properties.core_permit_valid_here) n.warnings.push(note)
    })
  }

  return { needs, selfRegister, unresolved }
}
