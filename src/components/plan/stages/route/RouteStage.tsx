import { useState, useRef } from 'react'
import type { SegRow } from './routeStage.types'
import { RouteMapCard, type RouteMapCardHandle } from './RouteMapCard'
import { RouteTable, type RouteTableHandle } from './RouteTable'
import { RouteRightRail } from './RouteRightRail'
import type { StageBodyProps } from '../../types'
import {
  useRouteChecklist, useRoutePersist, useDetectedWater, useRouteMapData,
  useSegmentReconnect, useSegmentListActions, useDrawMode, useRouteCrossLinks,
} from './routeStage.hooks'

export function RouteStage({ onJump, plan, onChange, onProgress, trip, canEdit }: StageBodyProps) {
  const [segments, setSegments] = useState<SegRow[]>(plan?.route?.segments ?? [])
  const [repositioning, setRepositioning] = useState(new Set<number>())

  const mapCardRef = useRef<RouteMapCardHandle>(null)
  const tableRef = useRef<RouteTableHandle>(null)

  const { effectiveChecklist, toggleCheck, doneCount, checklist } = useRouteChecklist(plan, segments, onProgress)
  useRoutePersist(onChange, segments, checklist)

  const { visibleWater, displayLoading, displayError } = useDetectedWater(trip)
  const { mergedRows, totalMiles, totalGain, plannedLatLngs, tracksWithLatLngs, allPoints, bounds, startEnd, sourceFiles } =
    useRouteMapData(trip, segments, visibleWater)

  const reconnect = useSegmentReconnect(trip?.gpxPlanned?.coordinates, setSegments, setRepositioning)
  const { deleteSegment, splitSegment, reorderSegments } = useSegmentListActions(setSegments)
  const draw = useDrawMode(trip, segments, setSegments, reconnect, () => mapCardRef.current?.scrollToTop())
  const { activeRowId, flyToRow, handleCampClick } = useRouteCrossLinks(mapCardRef, tableRef)

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4.5">
          <RouteMapCard
            ref={mapCardRef}
            mapData={{
              segments, detectedWater: visibleWater, activeRowId, trip,
              plannedLatLngs, tracksWithLatLngs, allPoints, bounds, startEnd,
              totalMiles, totalGain, repositioning,
            }}
            drawProps={{
              drawState: draw.drawState, setDrawState: draw.setDrawState, onCancelDraw: draw.cancelDraw,
              onConfirmSegment: draw.handleConfirmSegment, onMapClick: draw.handleMapClick,
              onPinDrag: draw.handlePinDrag, onEndpointDrag: draw.handleEndpointDrag, onResetStartPin: draw.resetStartPin,
            }}
            uploadProps={{ canEdit: canEdit ?? false }}
            onCampClick={handleCampClick}
            onSplitSegment={splitSegment}
          />

          <RouteTable
            ref={tableRef} mergedRows={mergedRows} activeRowId={activeRowId} segments={segments}
            repositioning={repositioning} waterLoading={displayLoading} waterError={displayError}
            canEdit={canEdit ?? false} isDrawing={draw.drawState.phase !== 'idle'} onJump={onJump}
            onFlyTo={flyToRow} onEnterDraw={draw.enterDraw} onDeleteSegment={deleteSegment} onReorderSegments={reorderSegments}
          />
        </div>

        <RouteRightRail
          trip={trip} canEdit={canEdit ?? false} checklist={effectiveChecklist}
          doneCount={doneCount} onToggleCheck={toggleCheck} sourceFiles={sourceFiles}
        />
      </div>
    </div>
  )
}
