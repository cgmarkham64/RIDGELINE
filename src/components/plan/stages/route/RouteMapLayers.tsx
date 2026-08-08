import type { RefObject } from 'react'
import type L from 'leaflet'
import { TileLayer } from 'react-leaflet'
import { TILE_LAYERS, type TileLayerKey } from '../../../map/constants'
import type { ContextMenuPayload } from './routeMapCard.helpers'
import { RouteMapZoneOverlays } from './RouteMapZoneOverlays'
import { RouteMapTrackLayers } from './RouteMapTrackLayers'
import { RouteMapMarkers } from './RouteMapMarkers'
import { RouteMapInteractionLayers } from './RouteMapInteractionLayers'
import type { MapData, DrawPhaseFlags, ZoneOverlayFlags } from './routeMapCard.types'
import type { DrawState } from './routeStage.types'
import type { UnitSystem } from '../../../../lib/units'

type RouteMapLayersProps = {
  mapData: MapData
  drawState: DrawState
  flags: DrawPhaseFlags
  overlays: ZoneOverlayFlags
  tileLayer: TileLayerKey
  waypointMode: boolean
  canEdit: boolean
  mapRef: RefObject<L.Map | null>
  fitKey: string
  onMapClick: (lat: number, lng: number) => void
  onPinDrag: (which: 'start' | 'end', lat: number, lng: number) => void
  onEndpointDrag: (segIdx: number, which: 'start' | 'end', lat: number, lng: number) => void
  onCampClick: (rowId: string) => void
  onPlaceWaypoint: (lat: number, lon: number) => void
  onContextMenuChange: (payload: ContextMenuPayload | null) => void
  sys: UnitSystem
}

export function RouteMapLayers({
  mapData, drawState, flags, overlays, tileLayer, waypointMode, canEdit, mapRef, fitKey,
  onMapClick, onPinDrag, onEndpointDrag, onCampClick, onPlaceWaypoint, onContextMenuChange, sys,
}: RouteMapLayersProps) {
  const { segments, plannedLatLngs, tracksWithLatLngs, allPoints, bounds } = mapData

  return (
    <>
      <TileLayer {...TILE_LAYERS[tileLayer]} />
      <RouteMapZoneOverlays {...overlays} />
      <RouteMapTrackLayers plannedLatLngs={plannedLatLngs} tracksWithLatLngs={tracksWithLatLngs} segments={segments} />
      <RouteMapMarkers
        mapData={mapData}
        drawState={drawState}
        flags={flags}
        onMapClick={onMapClick}
        onPan={(lat, lon) => mapRef.current?.panTo([lat, lon])}
        onPinDrag={onPinDrag}
        onEndpointDrag={onEndpointDrag}
        onCampClick={onCampClick}
        sys={sys}
      />
      <RouteMapInteractionLayers
        segments={segments}
        drawState={drawState}
        waypointMode={waypointMode}
        isDrawing={flags.isDrawing}
        canEdit={canEdit}
        mapRef={mapRef}
        bounds={bounds}
        allPoints={allPoints}
        fitKey={fitKey}
        onMapClick={onMapClick}
        onPlaceWaypoint={onPlaceWaypoint}
        onContextMenuChange={onContextMenuChange}
      />
    </>
  )
}
