import { RouteMapWaterMarkers } from './RouteMapWaterMarkers'
import { RouteMapCampMarkers } from './RouteMapCampMarkers'
import { RouteMapEndpointMarkers } from './RouteMapEndpointMarkers'
import { RouteMapWaypointMarkers } from './RouteMapWaypointMarkers'
import { DrawPreviewLayer } from './DrawPreviewLayer'
import type { MapData, DrawPhaseFlags } from './routeMapCard.types'
import type { DrawState } from './routeStage.types'
import type { UnitSystem } from '../../../../lib/units'

type RouteMapMarkersProps = {
  mapData: MapData
  drawState: DrawState
  flags: DrawPhaseFlags
  onMapClick: (lat: number, lng: number) => void
  onPan: (lat: number, lon: number) => void
  onPinDrag: (which: 'start' | 'end', lat: number, lng: number) => void
  onEndpointDrag: (segIdx: number, which: 'start' | 'end', lat: number, lng: number) => void
  onCampClick: (rowId: string) => void
  sys: UnitSystem
}

export function RouteMapMarkers({ mapData, drawState, flags, onMapClick, onPan, onPinDrag, onEndpointDrag, onCampClick, sys }: RouteMapMarkersProps) {
  const { segments, detectedWater, activeRowId, trip, startEnd, repositioning } = mapData
  const { isDrawing, isPlacingPin } = flags

  return (
    <>
      <RouteMapWaterMarkers
        detectedWater={detectedWater}
        activeRowId={activeRowId}
        sys={sys}
        isPlacingPin={isPlacingPin}
        onMarkerClick={onMapClick}
        onPan={onPan}
      />
      <RouteMapCampMarkers
        segments={segments}
        activeRowId={activeRowId}
        isDrawing={isDrawing}
        isPlacingPin={isPlacingPin}
        repositioning={repositioning}
        onMapClick={onMapClick}
        onEndpointDrag={onEndpointDrag}
        onCampClick={onCampClick}
      />
      <RouteMapEndpointMarkers
        segments={segments}
        startEnd={startEnd}
        isDrawing={isDrawing}
        isPlacingPin={isPlacingPin}
        repositioning={repositioning}
        onMapClick={onMapClick}
        onEndpointDrag={onEndpointDrag}
      />
      <DrawPreviewLayer drawState={drawState} onPinDrag={onPinDrag} />
      <RouteMapWaypointMarkers waypoints={trip?.waypoints ?? []} isPlacingPin={isPlacingPin} onMapClick={onMapClick} />
    </>
  )
}
