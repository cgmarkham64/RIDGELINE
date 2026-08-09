import ipwZonesRaw from '../../../../data/ipw_zones.json'
import enchantmentsZonesRaw from '../../../../data/enchantments_zones.json'
import mbswZonesRaw from '../../../../data/mbsw_zones.json'
import { derivePermitNeeds, type CampNight, type PermitNeed, type ZoneCollection, type ZoneProps } from '../../../../lib/zoneGeometry'
import { toDateMs } from './criticalDates.helpers'
import type { PlanRouteData, PlanPermitEntry, PlanCriticalDate } from '../../types'
import type { ZoneProductResult } from '../../../../lib/permits'

export const IPW_ZONES           = ipwZonesRaw as unknown as ZoneCollection
export const ENCHANTMENTS_ZONES  = enchantmentsZonesRaw as unknown as ZoneCollection
export const MBSW_ZONES          = mbswZonesRaw as unknown as ZoneCollection

const ISO_DATE_LENGTH = 10
const ISO_YEAR_LENGTH = 4
const ROUTE_SIGNATURE_COORD_DECIMALS = 5

function addDaysIso(startDate: string, days: number): string {
  const d = new Date(`${startDate.slice(0, ISO_DATE_LENGTH)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, ISO_DATE_LENGTH)
}

/** Camp coordinates come from each segment's last path point — mirrors the camp
 *  markers RouteMapCard already renders (routeStage segments except the final one). */
export function deriveCampNights(segments: PlanRouteData['segments'], startDate: string): CampNight[] {
  const camps: CampNight[] = []
  for (let i = 0; i < segments.length - 1; i++) {
    const path = segments[i].path
    if (!path || path.length === 0) continue
    const [lat, lon] = path[path.length - 1]
    camps.push({ date: addDaysIso(startDate, i), point: { lat, lon }, label: segments[i].name })
  }
  return camps
}

function computeBBox(zones: ZoneCollection) {
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity
  for (const f of zones.features) {
    for (const ring of f.geometry.coordinates) {
      for (const [lon, lat] of ring) {
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
        if (lon < minLon) minLon = lon
        if (lon > maxLon) maxLon = lon
      }
    }
  }
  return { minLat, maxLat, minLon, maxLon }
}

const BBOX_BUFFER_DEG = 0.05

function nearBBox(lat: number, lon: number, bbox: ReturnType<typeof computeBBox>): boolean {
  return lat >= bbox.minLat - BBOX_BUFFER_DEG && lat <= bbox.maxLat + BBOX_BUFFER_DEG &&
         lon >= bbox.minLon - BBOX_BUFFER_DEG && lon <= bbox.maxLon + BBOX_BUFFER_DEG
}

const IPW_BBOX = computeBBox(IPW_ZONES)
const ENCHANTMENTS_BBOX = computeBBox(ENCHANTMENTS_ZONES)
const MBSW_BBOX = computeBBox(MBSW_ZONES)

/** Cheap bounding-box check so the zone overlay/detection only engages for routes
 *  actually near Indian Peaks, rather than showing irrelevant zones on every trip. */
export function nearIpw(lat: number, lon: number): boolean {
  return nearBBox(lat, lon, IPW_BBOX)
}

/** Same idea as nearIpw, scoped to the Enchantments permit area. */
export function nearEnchantments(lat: number, lon: number): boolean {
  return nearBBox(lat, lon, ENCHANTMENTS_BBOX)
}

/** Same idea as nearIpw, scoped to the Maroon Bells-Snowmass permit area. */
export function nearMbsw(lat: number, lon: number): boolean {
  return nearBBox(lat, lon, MBSW_BBOX)
}

const ALL_ZONES: ZoneCollection = {
  type: 'FeatureCollection',
  features: [...IPW_ZONES.features, ...ENCHANTMENTS_ZONES.features, ...MBSW_ZONES.features],
}

export function detectZoneStays(
  segments: PlanRouteData['segments'],
  startDate: string,
): { needs: PermitNeed[]; selfRegister: PermitNeed[]; unresolved: CampNight[] } {
  const camps = deriveCampNights(segments, startDate)
  if (camps.length === 0) return { needs: [], selfRegister: [], unresolved: [] }
  return derivePermitNeeds(camps, ALL_ZONES)
}

/** Lottery zones (e.g. Enchantments) have no per-trip product to pick via AI judgment —
 *  the two recreation.gov entry points (advanced/daily lottery) are already fixed facts,
 *  so this builds the permit's copy directly instead of calling pickZoneProduct. */
export function buildLotteryProduct(p: ZoneProps): ZoneProductResult {
  const advanced = p.recgov.advanced_lottery
  const daily    = p.recgov.daily_lottery
  return {
    productId:    advanced ?? daily ?? Object.values(p.recgov)[0] ?? '',
    productLabel: 'Enchantments lottery',
    why: [
      advanced ? `Apply to the advanced lottery (recreation.gov) Feb 15–Mar 1.` : null,
      daily ? `A daily walk-up lottery is also available closer to your trip.` : null,
    ].filter(Boolean).join(' ') || 'Overnight permits here are lottery-allocated — apply via recreation.gov.',
    confidence: 'high',
  }
}

/** Advance-reservation zones (e.g. MBSW) have a single recreation.gov product covering
 *  every zone year-round — no product judgment call to make, so this builds the permit's
 *  copy directly instead of calling pickZoneProduct (which is IPW's multi-product flow). */
export function buildAdvanceReservationProduct(p: ZoneProps): ZoneProductResult {
  return {
    productId:    p.recgov.overnight ?? Object.values(p.recgov)[0] ?? '',
    productLabel: 'Advance overnight permit',
    why: [
      `Reserve on recreation.gov before your trip — required year-round in ${p.name}.`,
      p.overnight_permit.fee_window ? `A per-person nightly fee applies ${p.overnight_permit.fee_window}.` : null,
    ].filter(Boolean).join(' '),
    confidence: 'high',
  }
}

/** Quota zones (IPW) always carry a season window in practice — pickZoneProduct's AI
 *  call needs it as a plain string. Throws if a zone is missing one instead of silently
 *  sending "undefined" to the prompt; callers already treat a thrown need as a per-permit
 *  failure to surface, not a crash. */
export function requireSeasonBound(value: string | undefined, zoneName: string): string {
  if (!value) throw new Error(`${zoneName}: missing permit season date`)
  return value
}

/** Builds a self-issue permit for a zone-stay where `permit_required` is false
 *  (a partial-coverage collection's self-register boundary, e.g. MBSW wilderness) —
 *  no booking, no AI product pick, just a trailhead-registration reminder. */
export function buildSelfRegisterPermit(need: PermitNeed): PlanPermitEntry {
  const p = need.zone.properties
  return {
    id:           zoneNeedId(need),
    type:         'selfissue',
    name:         'Trailhead self-registration',
    agency:       p.agency,
    why:          'No booking required — self-issue permit at the trailhead.',
    fields:       {},
    party:        1,
    confidence:   'high',
    autoDetected: true,
    zoneWarnings: need.warnings,
  }
}

/** Changes whenever the route's camp count, positions, or dates change — lets the
 *  auto-detection effect re-run when the route is edited instead of only once ever. */
export function routeSignature(segments: PlanRouteData['segments'], startDate: string): string {
  return deriveCampNights(segments, startDate)
    .map(c => `${c.date}:${c.point.lat.toFixed(ROUTE_SIGNATURE_COORD_DECIMALS)},${c.point.lon.toFixed(ROUTE_SIGNATURE_COORD_DECIMALS)}`)
    .join('|')
}

/** Stable id for a zone-stay — shared by buildZonePermit and the reconciliation
 *  pass so "is this need already represented?" checks stay in sync with permit ids. */
export function zoneNeedId(need: PermitNeed): string {
  return `zone_${need.zone.properties.id}_${need.nights[0].date}`
}

function buildZonePermitCriticalDates(id: string, year: string, p: ZoneProps): PlanCriticalDate[] {
  return [
    {
      id: `pcd_${id}_start`, dateMs: toDateMs(`${year}-${p.overnight_permit.season_start}`),
      hasTime: false, label: 'Permit season opens', tone: 'sky', source: 'permit',
    },
    {
      id: `pcd_${id}_end`, dateMs: toDateMs(`${year}-${p.overnight_permit.season_end}`),
      hasTime: false, label: 'Permit season closes', tone: 'amber', source: 'permit',
    },
  ]
}

/** Builds a zonenights Permit from a geometry-derived zone-stay plus the
 *  AI-picked recreation.gov product — geometry decides zones/nights/warnings,
 *  the AI call decides which of the zone's 3 recgov products fits and writes the copy. */
export function buildZonePermit(need: PermitNeed, party: number, product: ZoneProductResult): PlanPermitEntry {
  const p    = need.zone.properties
  const year = need.nights[0].date.slice(0, ISO_YEAR_LENGTH)
  const id   = zoneNeedId(need)
  const criticalDates = buildZonePermitCriticalDates(id, year, p)

  return {
    id,
    type:         'zonenights',
    name:         `${p.name} overnight permit`,
    agency:       p.agency,
    why:          product.why,
    fields:       {},
    party,
    zones:        need.nights.map((_, i) => ({ night: i + 1, zone: p.name, status: 'available' })),
    url:          `https://www.recreation.gov/permits/${product.productId}`,
    zoneId:       p.id,
    confidence:   product.confidence,
    criticalDates,
    autoDetected: true,
    zoneWarnings: need.warnings,
  }
}