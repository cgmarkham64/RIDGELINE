import { IconMap } from '../../../icons'
import type { UnitSystem } from '../../../../lib/units'
import type { StageBodyProps } from '../../types'
import { RouteMapHeaderActions } from './RouteMapHeaderActions'
import { formatRouteStats } from './routeStage.helpers'
import type { useGpxImport, useWaypointPlacement } from './routeMapCard.hooks'

type RouteMapHeaderProps = {
  trip: StageBodyProps['trip']
  segmentCount: number
  totalMiles: number
  totalGain: number
  sys: UnitSystem
  canEdit: boolean
  isDrawing: boolean
  hasGpx: boolean
  gpx: Pick<ReturnType<typeof useGpxImport>, 'uploadLabel' | 'triggerFileDialog' | 'handleGpxRemove'>
  wp: Pick<ReturnType<typeof useWaypointPlacement>, 'waypointMode' | 'setWaypointMode' | 'cancelWaypointMode'>
}

const MAP_ICON_SIZE = 16

export function RouteMapHeader({ trip, segmentCount, totalMiles, totalGain, sys, canEdit, isDrawing, hasGpx, gpx, wp }: RouteMapHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-3.5">
      <span className="w-8 h-8 rounded-md flex items-center justify-center bg-pine-dim border border-pine-border text-pine shrink-0 mt-0.5">
        <IconMap size={MAP_ICON_SIZE} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-heading text-body-sm font-extrabold text-text">
          {trip?.title ?? 'Untitled Trip'}
        </div>
        <div className="font-mono text-label text-text-dim mt-0.5">
          {formatRouteStats(segmentCount, totalMiles, totalGain, sys)}
        </div>
      </div>
      {canEdit && !isDrawing && (
        <RouteMapHeaderActions
          hasGpx={hasGpx}
          uploadLabel={gpx.uploadLabel}
          waypointMode={wp.waypointMode}
          onImportClick={gpx.triggerFileDialog}
          onRemoveGpx={gpx.handleGpxRemove}
          onToggleWaypointMode={() => wp.waypointMode ? wp.cancelWaypointMode() : wp.setWaypointMode(true)}
        />
      )}
    </div>
  )
}
