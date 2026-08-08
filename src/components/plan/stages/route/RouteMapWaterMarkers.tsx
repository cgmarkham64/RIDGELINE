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

export function RouteMapWaterMarkers({ detectedWater, activeRowId, sys, isPlacingPin, onMarkerClick, onPan }: RouteMapWaterMarkersProps) {
  return (
    <>
      {detectedWater.map(src => (
        <Marker
          key={src.id}
          position={[src.lat, src.lon]}
          icon={activeRowId === src.id
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
