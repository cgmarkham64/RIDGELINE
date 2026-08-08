import type { RefObject } from 'react'
import { MapContainer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type L from 'leaflet'
import { AttributionStrip, ZoomControls } from '../../../map/MapHelpers'
import { MapTileToggle } from '../../../map/MapTileToggle'
import { IconDownload } from '../../../icons'
import type { TileLayerKey } from '../../../map/constants'
import type { ContextMenuPayload } from './routeMapCard.helpers'
import { computeMapViewport, computeShowMap } from './routeStage.helpers'
import { RouteMapLayers } from './RouteMapLayers'
import { RouteMapEmptyState } from './RouteMapEmptyState'
import { RouteMapContextMenu } from './RouteMapContextMenu'
import type { MapData, DrawPhaseFlags, ZoneOverlayFlags } from './routeMapCard.types'
import type { DrawState } from './routeStage.types'
import type { useGpxImport, useWaypointPlacement } from './routeMapCard.hooks'
import type { UnitSystem } from '../../../../lib/units'

const MAP_HEIGHT = '44vh'
const DROP_ICON_SIZE = 22
const DROP_OVERLAY_BG = 'rgba(15,13,11,0.75)'

function GpxDropOverlay({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-none" style={{ background: DROP_OVERLAY_BG, borderRadius: 'inherit' }}>
      <IconDownload size={DROP_ICON_SIZE} />
      <p className="font-mono text-caption tracking-[0.12em] uppercase text-amber">Drop .gpx to import</p>
    </div>
  )
}

type RouteMapCanvasProps = {
  mapData: MapData
  drawState: DrawState
  flags: DrawPhaseFlags
  overlays: ZoneOverlayFlags
  tileLayer: TileLayerKey
  onToggleTileLayer: () => void
  gpx: Pick<ReturnType<typeof useGpxImport>, 'isDragging' | 'triggerFileDialog'>
  wp: Pick<ReturnType<typeof useWaypointPlacement>, 'waypointMode' | 'startPlacingAt'>
  canEdit: boolean
  mapRef: RefObject<L.Map | null>
  contextMenu: ContextMenuPayload | null
  onContextMenuChange: (payload: ContextMenuPayload | null) => void
  onMapClick: (lat: number, lng: number) => void
  onPinDrag: (which: 'start' | 'end', lat: number, lng: number) => void
  onEndpointDrag: (segIdx: number, which: 'start' | 'end', lat: number, lng: number) => void
  onCampClick: (rowId: string) => void
  onSplitSegment: (segN: number, edgeIdx: number, splitPoint: [number, number]) => void
  sys: UnitSystem
}

export function RouteMapCanvas({
  mapData, drawState, flags, overlays, tileLayer, onToggleTileLayer, gpx, wp, canEdit,
  mapRef, contextMenu, onContextMenuChange, onMapClick, onPinDrag, onEndpointDrag, onCampClick, onSplitSegment, sys,
}: RouteMapCanvasProps) {
  const { segments, allPoints, bounds, plannedLatLngs, tracksWithLatLngs } = mapData
  const { isDragging, triggerFileDialog } = gpx
  const { waypointMode, startPlacingAt } = wp
  const showMap = computeShowMap(bounds, flags.isDrawing, segments)
  const mapViewport = computeMapViewport(bounds)
  const fitKey = `${segments.length}-${plannedLatLngs.length > 0 ? 1 : 0}-${tracksWithLatLngs.length}`

  return (
    <>
      <div className="relative rounded overflow-hidden border border-border" style={{ height: MAP_HEIGHT }}>
        <MapTileToggle current={tileLayer} onToggle={onToggleTileLayer} />
        <GpxDropOverlay show={isDragging && canEdit} />

        {showMap ? (
          <MapContainer key="route-map" {...mapViewport} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} zoomControl={false} attributionControl={false}>
            <RouteMapLayers
              mapData={mapData}
              drawState={drawState}
              flags={flags}
              overlays={overlays}
              tileLayer={tileLayer}
              waypointMode={waypointMode}
              canEdit={canEdit}
              mapRef={mapRef}
              fitKey={fitKey}
              onMapClick={onMapClick}
              onPinDrag={onPinDrag}
              onEndpointDrag={onEndpointDrag}
              onCampClick={onCampClick}
              onPlaceWaypoint={startPlacingAt}
              onContextMenuChange={onContextMenuChange}
              sys={sys}
            />
          </MapContainer>
        ) : (
          <RouteMapEmptyState canEdit={canEdit} onImportClick={triggerFileDialog} />
        )}

        <ZoomControls mapRef={mapRef} allPoints={allPoints} />
        <RouteMapContextMenu menu={contextMenu} onSplit={onSplitSegment} onDismiss={() => onContextMenuChange(null)} />
      </div>
      <AttributionStrip tileLayer={tileLayer} />
    </>
  )
}
