import type L from 'leaflet'
import { Marker, Tooltip } from 'react-leaflet'
import { makeWaypointIcon } from '../../../map/leafletIcons'
import type { SegRow } from './routeStage.types'

const CAMP_ICON_SIZE = 28
const TOOLTIP_OFFSET_Y = -12
const TOOLTIP_OPACITY = 0.95

type RouteMapCampMarkersProps = {
  segments: SegRow[]
  activeRowId: string | null
  isDrawing: boolean
  isPlacingPin: boolean
  repositioning: Set<number>
  onMapClick: (lat: number, lng: number) => void
  onEndpointDrag: (segIdx: number, which: 'start' | 'end', lat: number, lng: number) => void
  onCampClick: (rowId: string) => void
}

export function RouteMapCampMarkers({
  segments, activeRowId, isDrawing, isPlacingPin, repositioning, onMapClick, onEndpointDrag, onCampClick,
}: RouteMapCampMarkersProps) {
  return (
    <>
      {segments.map((s, i) =>
        i < segments.length - 1 && s.path?.length ? (
          <Marker
            key={`camp-${s.n}`}
            position={s.path[s.path.length - 1]}
            icon={makeWaypointIcon('campsite', activeRowId === `camp-${s.n}`, CAMP_ICON_SIZE)}
            draggable={!isDrawing && repositioning.size === 0}
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = (e.target as L.Marker).getLatLng()
                onEndpointDrag(i, 'end', lat, lng)
              },
              click: () => isPlacingPin
                ? onMapClick(s.path![s.path!.length - 1][0], s.path![s.path!.length - 1][1])
                : onCampClick(`camp-${s.n}`),
            }}
          >
            <Tooltip direction="top" offset={[0, TOOLTIP_OFFSET_Y]} opacity={TOOLTIP_OPACITY}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{s.name}</span>
            </Tooltip>
          </Marker>
        ) : null
      )}
    </>
  )
}
