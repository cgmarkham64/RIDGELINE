import ipwZonesRaw from '../../../../data/ipw_zones.json'
import enchantmentsZonesRaw from '../../../../data/enchantments_zones.json'
import { derivePermitNeeds, type CampNight, type PermitNeed, type ZoneCollection, type ZoneProps } from '../../../../lib/zoneGeometry'
import { toDateMs } from './criticalDates.helpers'
import type { PlanRouteData, PlanPermitEntry, PlanCriticalDate } from '../../types'
import type { ZoneProductResult } from '../../../../lib/permits'

export const IPW_ZONES           = ipwZonesRaw as unknown as ZoneCollection
export const ENCHANTMENTS_ZONES  = enchantmentsZonesRaw as unknown as ZoneCollection

function addDaysIso(startDate: string, days: number): string {
  const d = new Date(`${startDate.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
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

/** Cheap bounding-box check so the zone overlay/detection only engages for routes
 *  actually near Indian Peaks, rather than showing irrelevant zones on every trip. */
export function nearIpw(lat: number, lon: number): boolean {
  return nearBBox(lat, lon, IPW_BBOX)
}

/** Same idea as nearIpw, scoped to the Enchantments permit area. */
export function nearEnchantments(lat: number, lon: number): boolean {
  return nearBBox(lat, lon, ENCHANTMENTS_BBOX)
}

const ALL_ZONES: ZoneCollection = {
  type: 'FeatureCollection',
  features: [...IPW_ZONES.features, ...ENCHANTMENTS_ZONES.features],
}

export function detectZoneStays(
  segments: PlanRouteData['segments'],
  startDate: string,
): { needs: PermitNeed[]; unresolved: CampNight[] } {
  const camps = deriveCampNights(segments, startDate)
  if (camps.length === 0) return { needs: [], unresolved: [] }
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

/** Changes whenever the route's camp count, positions, or dates change — lets the
 *  auto-detection effect re-run when the route is edited instead of only once ever. */
export function routeSignature(segments: PlanRouteData['segments'], startDate: string): string {
  return deriveCampNights(segments, startDate)
    .map(c => `${c.date}:${c.point.lat.toFixed(5)},${c.point.lon.toFixed(5)}`)
    .join('|')
}

/** Stable id for a zone-stay — shared by buildZonePermit and the reconciliation
 *  pass so "is this need already represented?" checks stay in sync with permit ids. */
export function zoneNeedId(need: PermitNeed): string {
  return `zone_${need.zone.properties.id}_${need.nights[0].date}`
}

/** Builds a zonenights Permit from a geometry-derived zone-stay plus the
 *  AI-picked recreation.gov product — geometry decides zones/nights/warnings,
 *  the AI call decides which of the zone's 3 recgov products fits and writes the copy. */
export function buildZonePermit(need: PermitNeed, party: number, product: ZoneProductResult): PlanPermitEntry {
  const p    = need.zone.properties
  const year = need.nights[0].date.slice(0, 4)
  const id   = zoneNeedId(need)

  const criticalDates: PlanCriticalDate[] = [
    {
      id: `pcd_${id}_start`, dateMs: toDateMs(`${year}-${p.overnight_permit.season_start}`),
      hasTime: false, label: 'Permit season opens', tone: 'sky', source: 'permit',
    },
    {
      id: `pcd_${id}_end`, dateMs: toDateMs(`${year}-${p.overnight_permit.season_end}`),
      hasTime: false, label: 'Permit season closes', tone: 'amber', source: 'permit',
    },
  ]

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