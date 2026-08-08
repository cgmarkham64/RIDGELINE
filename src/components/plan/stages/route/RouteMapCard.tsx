import { useState, forwardRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TileLayerKey } from '../../../map/constants'
import { useUnitSystem } from '../../../../hooks/useUnitSystem'
import { computeDrawPhaseFlags } from './routeStage.helpers'
import { useGpxImport, useWaypointPlacement, useZoneOverlays, useMapCardImperativeHandle } from './routeMapCard.hooks'
import type { ContextMenuPayload } from './routeMapCard.helpers'
import { RouteMapCardBody } from './RouteMapCardBody'
import type { RouteMapCardHandle, RouteMapCardProps } from './routeMapCard.types'

export type { RouteMapCardHandle } from './routeMapCard.types'

export const RouteMapCard = forwardRef<RouteMapCardHandle, RouteMapCardProps>(
  function RouteMapCard({ mapData, drawProps, uploadProps, onCampClick, onSplitSegment }, ref) {
    const { segments, allPoints, trip } = mapData
    const { drawState, setDrawState, onCancelDraw, onConfirmSegment, onMapClick, onPinDrag, onEndpointDrag, onResetStartPin } = drawProps
    const { canEdit } = uploadProps

    const sys = useUnitSystem()
    const qc = useQueryClient()
    const [tileLayer, setTileLayer] = useState<TileLayerKey>('topo')
    const [contextMenu, setContextMenu] = useState<ContextMenuPayload | null>(null)
    const { mapRef, containerRef } = useMapCardImperativeHandle(ref)

    const gpx = useGpxImport(trip, qc, canEdit)
    const wp = useWaypointPlacement(trip, qc)
    const overlays = useZoneOverlays(segments, allPoints, trip)
    const flags = computeDrawPhaseFlags(drawState)

    return (
      <div
        ref={containerRef}
        className={`bg-surface border rounded-lg p-4.5 transition-colors ${gpx.isDragging || flags.isDrawing ? 'border-amber-border' : 'border-border'}`}
        {...gpx.dragHandlers}
      >
        <RouteMapCardBody
          gpx={gpx}
          wp={wp}
          overlays={overlays}
          flags={flags}
          mapData={mapData}
          drawState={drawState}
          setDrawState={setDrawState}
          sys={sys}
          canEdit={canEdit}
          tileLayer={tileLayer}
          onToggleTileLayer={() => setTileLayer(k => k === 'topo' ? 'dark' : 'topo')}
          contextMenu={contextMenu}
          onContextMenuChange={setContextMenu}
          mapRef={mapRef}
          onCancelDraw={onCancelDraw}
          onConfirmSegment={onConfirmSegment}
          onMapClick={onMapClick}
          onPinDrag={onPinDrag}
          onEndpointDrag={onEndpointDrag}
          onResetStartPin={onResetStartPin}
          onCampClick={onCampClick}
          onSplitSegment={onSplitSegment}
        />

        <input ref={gpx.fileInputRef} type="file" accept=".gpx" className="hidden" onChange={gpx.handleGpxUpload} />
      </div>
    )
  }
)
