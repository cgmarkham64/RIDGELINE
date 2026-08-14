import { Marker, Tooltip } from 'react-leaflet'
import { makeWaypointIcon, makeDetectedWaterIcon } from '../../../map/leafletIcons'
import { milesToKm } from '../../../../lib/units'
import type { UnitSystem } from '../../../../lib/units'
import type { DetectedWaterSource } from '../../../../lib/waterSources'

const ACTIVE_ICON_SIZE = 28
const DEFAULT_ICON_SIZE = 24
const TOOLTIP_OFFSET_Y = -10
const TOOLTIP_OPACITY = 0.95

type RouteMapWaterMarkersProps = {
  detectedWater: DetectedWaterSource[]
  activeRowId: string | null
  sys: UnitSystem
  isPlacingPin: boolean
  onMarkerClick: (lat: number, lon: number) => void
  onPan: (lat: number, lon: number) => void
}

type LocationMarker = DetectedWaterSource & { matchIds: string[] }

// A source the route passes more than once (out-and-back leg, lollipop stick) shares one
// lat/lon across all its passes — the map only needs one pin per physical location. Keep
// every pass's id on that pin (matchIds) so selecting either pass's table row still
// highlights the shared marker; the table itself (keyed by full id) lists every pass.
function dedupeByLocation(sources: DetectedWaterSource[]): LocationMarker[] {
  const byLoc = new Map<string, LocationMarker>()
  for (const src of sources) {
    const key = `${src.lat},${src.lon}`
    const existing = byLoc.get(key)
    if (existing) existing.matchIds.push(src.id)
    else byLoc.set(key, { ...src, matchIds: [src.id] })
  }
  return [...byLoc.values()]
}

export function RouteMapWaterMarkers({ detectedWater, activeRowId, sys, isPlacingPin, onMarkerClick, onPan }: RouteMapWaterMarkersProps) {
  return (
    <>
      {dedupeByLocation(detectedWater).map(src => (
        <Marker
          key={src.id}
          position={[src.lat, src.lon]}
          icon={activeRowId !== null && src.matchIds.includes(activeRowId)
            ? makeWaypointIcon(src.waypointType, true, ACTIVE_ICON_SIZE)
            : makeDetectedWaterIcon(src.waypointType, DEFAULT_ICON_SIZE)}
          eventHandlers={{ click: () => isPlacingPin ? onMarkerClick(src.lat, src.lon) : onPan(src.lat, src.lon) }}
        >
          <Tooltip direction="top" offset={[0, TOOLTIP_OFFSET_Y]} opacity={TOOLTIP_OPACITY}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              {src.label} · {sys === 'metric' ? milesToKm(src.distFromStartMi).toFixed(1) + ' km' : src.distFromStartMi.toFixed(1) + ' mi'} from TH
              {src.checkDate && (
                <span style={{ display: 'block', opacity: 0.6, fontSize: 9 }}>
                  OSM updated {src.checkDate}
                </span>
              )}
            </span>
          </Tooltip>
        </Marker>
      ))}
    </>
  )
}
