import { Marker, Tooltip } from 'react-leaflet'
import { makeWaypointIcon } from '../../../map/leafletIcons'
import type { Waypoint } from '../../../../types'

const WAYPOINT_ICON_SIZE = 24
const TOOLTIP_OFFSET_Y = -10
const TOOLTIP_OPACITY = 0.95

type RouteMapWaypointMarkersProps = {
  waypoints: Waypoint[]
  isPlacingPin: boolean
  onMapClick: (lat: number, lng: number) => void
}

export function RouteMapWaypointMarkers({ waypoints, isPlacingPin, onMapClick }: RouteMapWaypointMarkersProps) {
  return (
    <>
      {waypoints.map(wp => (
        <Marker
          key={wp.id}
          position={[wp.lat, wp.lon]}
          icon={makeWaypointIcon(wp.type, false, WAYPOINT_ICON_SIZE)}
          eventHandlers={{ click: () => isPlacingPin ? onMapClick(wp.lat, wp.lon) : undefined }}
        >
          <Tooltip direction="top" offset={[0, TOOLTIP_OFFSET_Y]} opacity={TOOLTIP_OPACITY}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{wp.label}</span>
          </Tooltip>
        </Marker>
      ))}
    </>
  )
}
