import type L from 'leaflet'
import { Marker } from 'react-leaflet'
import { makeStartIcon, makeEndIcon } from '../../../map/leafletIcons'
import type { SegRow } from './routeStage.types'

const FIXED_ICON_SIZE = 16
const DRAGGABLE_ICON_SIZE = 18

type RouteMapEndpointMarkersProps = {
  segments: SegRow[]
  startEnd: { start: [number, number]; end: [number, number] } | null
  isDrawing: boolean
  isPlacingPin: boolean
  repositioning: Set<number>
  onMapClick: (lat: number, lng: number) => void
  onEndpointDrag: (segIdx: number, which: 'start' | 'end', lat: number, lng: number) => void
}

function FixedEndpoints({ startEnd }: { startEnd: { start: [number, number]; end: [number, number] } }) {
  return (<>
    <Marker position={startEnd.start} icon={makeStartIcon(FIXED_ICON_SIZE)} interactive={false} />
    <Marker position={startEnd.end} icon={makeEndIcon(FIXED_ICON_SIZE)} interactive={false} />
  </>)
}

function DraggableEndpoints({ segments, isDrawing, isPlacingPin, repositioning, onMapClick, onEndpointDrag }: Omit<RouteMapEndpointMarkersProps, 'startEnd'>) {
  const firstSeg = segments[0]
  const lastSeg = segments[segments.length - 1]
  const firstPos = firstSeg?.path?.length ? firstSeg.path[0] : null
  const lastPos = lastSeg?.path?.length ? lastSeg.path[lastSeg.path.length - 1] : null
  const draggable = !isDrawing && repositioning.size === 0

  return (<>
    {firstPos && (
      <Marker
        position={firstPos}
        icon={makeStartIcon(DRAGGABLE_ICON_SIZE)}
        draggable={draggable}
        eventHandlers={{
          dragend(e) {
            const { lat, lng } = (e.target as L.Marker).getLatLng()
            onEndpointDrag(0, 'start', lat, lng)
          },
          click: () => isPlacingPin ? onMapClick(firstPos[0], firstPos[1]) : undefined,
        }}
      />
    )}
    {lastPos && (
      <Marker
        position={lastPos}
        icon={makeEndIcon(DRAGGABLE_ICON_SIZE)}
        draggable={draggable}
        eventHandlers={{
          dragend(e) {
            const { lat, lng } = (e.target as L.Marker).getLatLng()
            onEndpointDrag(segments.length - 1, 'end', lat, lng)
          },
          click: () => isPlacingPin ? onMapClick(lastPos[0], lastPos[1]) : undefined,
        }}
      />
    )}
  </>)
}

export function RouteMapEndpointMarkers({ segments, startEnd, isDrawing, isPlacingPin, repositioning, onMapClick, onEndpointDrag }: RouteMapEndpointMarkersProps) {
  return startEnd
    ? <FixedEndpoints startEnd={startEnd} />
    : <DraggableEndpoints segments={segments} isDrawing={isDrawing} isPlacingPin={isPlacingPin} repositioning={repositioning} onMapClick={onMapClick} onEndpointDrag={onEndpointDrag} />
}
