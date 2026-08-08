import type { RefObject } from 'react'
import type L from 'leaflet'
import type { Dispatch, SetStateAction } from 'react'
import { RouteMapHeader } from './RouteMapHeader'
import { RouteMapCanvas } from './RouteMapCanvas'
import { RouteMapCardOverlays } from './RouteMapCardOverlays'
import type { useGpxImport, useWaypointPlacement } from './routeMapCard.hooks'
import type { ContextMenuPayload } from './routeMapCard.helpers'
import type { MapData, DrawPhaseFlags, ZoneOverlayFlags } from './routeMapCard.types'
import type { DrawState } from './routeStage.types'
import type { TileLayerKey } from '../../../map/constants'
import type { UnitSystem } from '../../../../lib/units'

type RouteMapCardBodyProps = {
  gpx: ReturnType<typeof useGpxImport>
  wp: ReturnType<typeof useWaypointPlacement>
  overlays: ZoneOverlayFlags
  flags: DrawPhaseFlags
  mapData: MapData
  drawState: DrawState
  setDrawState: Dispatch<SetStateAction<DrawState>>
  sys: UnitSystem
  canEdit: boolean
  tileLayer: TileLayerKey
  onToggleTileLayer: () => void
  contextMenu: ContextMenuPayload | null
  onContextMenuChange: (payload: ContextMenuPayload | null) => void
  mapRef: RefObject<L.Map | null>
  onCancelDraw: () => void
  onConfirmSegment: () => void
  onMapClick: (lat: number, lng: number) => void
  onPinDrag: (which: 'start' | 'end', lat: number, lng: number) => void
  onEndpointDrag: (segIdx: number, which: 'start' | 'end', lat: number, lng: number) => void
  onResetStartPin: () => void
  onCampClick: (rowId: string) => void
  onSplitSegment: (segN: number, edgeIdx: number, splitPoint: [number, number]) => void
}

export function RouteMapCardBody({
  gpx, wp, overlays, flags, mapData, drawState, setDrawState, sys, canEdit, tileLayer, onToggleTileLayer,
  contextMenu, onContextMenuChange, mapRef, onCancelDraw, onConfirmSegment, onMapClick, onPinDrag,
  onEndpointDrag, onResetStartPin, onCampClick, onSplitSegment,
}: RouteMapCardBodyProps) {
  const { segments, trip } = mapData

  return (
    <>
      <RouteMapHeader
        trip={trip}
        segmentCount={segments.length}
        totalMiles={mapData.totalMiles}
        totalGain={mapData.totalGain}
        sys={sys}
        canEdit={canEdit}
        isDrawing={flags.isDrawing}
        hasGpx={!!trip?.gpxPlanned}
        gpx={gpx}
        wp={wp}
      />

      {gpx.uploadError && <p className="font-mono text-label text-red mb-2">{gpx.uploadError}</p>}

      <RouteMapCanvas
        mapData={mapData} drawState={drawState} flags={flags} overlays={overlays} sys={sys}
        tileLayer={tileLayer} onToggleTileLayer={onToggleTileLayer}
        gpx={gpx} wp={wp} canEdit={canEdit} mapRef={mapRef}
        contextMenu={contextMenu} onContextMenuChange={onContextMenuChange}
        onMapClick={onMapClick} onPinDrag={onPinDrag} onEndpointDrag={onEndpointDrag}
        onCampClick={onCampClick} onSplitSegment={onSplitSegment}
      />

      <RouteMapCardOverlays
        wp={wp}
        drawState={drawState}
        setDrawState={setDrawState}
        flags={flags}
        onCancelDraw={onCancelDraw}
        onConfirmSegment={onConfirmSegment}
        onResetStartPin={onResetStartPin}
      />
    </>
  )
}
