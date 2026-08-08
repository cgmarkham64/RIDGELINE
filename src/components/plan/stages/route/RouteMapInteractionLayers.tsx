import type { RefObject } from 'react'
import type L from 'leaflet'
import { MapRefCapture } from '../../../map/MapHelpers'
import { FitBounds, InvalidateSize, DrawInteractionLayer, WaypointPlaceLayer, ContextMenuLayer, type ContextMenuPayload } from './routeMapCard.helpers'
import type { SegRow, DrawState } from './routeStage.types'

type RouteMapInteractionLayersProps = {
  segments: SegRow[]
  drawState: DrawState
  waypointMode: boolean
  isDrawing: boolean
  canEdit: boolean
  mapRef: RefObject<L.Map | null>
  bounds: L.LatLngBounds | null
  allPoints: [number, number][]
  fitKey: string
  onMapClick: (lat: number, lng: number) => void
  onPlaceWaypoint: (lat: number, lon: number) => void
  onContextMenuChange: (payload: ContextMenuPayload | null) => void
}

export function RouteMapInteractionLayers({
  segments, drawState, waypointMode, isDrawing, canEdit, mapRef, bounds, allPoints, fitKey,
  onMapClick, onPlaceWaypoint, onContextMenuChange,
}: RouteMapInteractionLayersProps) {
  return (
    <>
      <WaypointPlaceLayer active={waypointMode && !isDrawing} onPlace={onPlaceWaypoint} />
      <DrawInteractionLayer drawState={drawState} onMapClick={onMapClick} />
      <ContextMenuLayer
        segments={segments}
        isDrawing={isDrawing}
        canEdit={canEdit}
        onContextMenu={onContextMenuChange}
        onDismiss={() => onContextMenuChange(null)}
      />
      <MapRefCapture mapRef={mapRef} />
      {bounds && <FitBounds positions={allPoints} fitKey={fitKey} />}
      <InvalidateSize />
    </>
  )
}
