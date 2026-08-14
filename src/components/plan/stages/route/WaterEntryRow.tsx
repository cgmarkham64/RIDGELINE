import { WaypointIcon } from '../../../map/WaypointIcon'
import { WAYPOINT_COLOR } from '../../../map/constants'
import { IconSparkle, IconArrowLeft } from '../../../icons'
import { ACTIVE_BG, fmtMi } from './routeStage.helpers'
import { useUnitSystem } from '../../../../hooks/useUnitSystem'
import type { MergedRow } from './routeStage.types'

type WaterEntryRowProps = {
  row: Extract<MergedRow, { kind: 'water' }>
  isDraggable: boolean
  isLast: boolean
  isActive: boolean
  gridTemplate: string
  segColor: string
  onFlyTo: (lat: number | null, lon: number | null, rowId: string) => void
  rowRef: (el: HTMLDivElement | null) => void
}

export function WaterEntryRow({ row, isDraggable, isLast, isActive, gridTemplate, segColor, onFlyTo, rowRef }: WaterEntryRowProps) {
  const sys = useUnitSystem()
  const border = isLast ? '' : 'border-b border-border'

  return (
    <div
      ref={rowRef}
      className={`grid items-center px-4 py-2.5 gap-3 ${border} cursor-pointer transition-colors`}
      style={{ gridTemplateColumns: gridTemplate, borderLeft: `3px solid ${segColor}`, background: isActive ? ACTIVE_BG : undefined }}
      onClick={() => onFlyTo(row.entry.lat, row.entry.lon, row.entry.id)}
    >
      {isDraggable && <span />}
      <span style={{ color: WAYPOINT_COLOR[row.entry.waypointType] }}>
        <WaypointIcon type={row.entry.waypointType} size={15} />
      </span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-body-sm font-semibold text-text truncate">{row.entry.label}</span>
        {row.entry.isDetected && (
          <span className="shrink-0 inline-flex items-center gap-0.5 font-mono text-label tracking-[0.06em] uppercase px-1 py-0.5 rounded-sm border border-dashed border-border text-text-dim/60">
            <IconSparkle />auto
          </span>
        )}
        {row.entry.passCount > 1 && (
          <span
            className="shrink-0 inline-flex items-center gap-0.5 font-mono text-label tracking-[0.06em] uppercase px-1 py-0.5 rounded-sm border border-dashed border-border text-text-dim/60"
            title="The route passes this point more than once — e.g. out on the way in, again on the way back"
          >
            <IconArrowLeft size={8} />pass {row.entry.passIndex}/{row.entry.passCount}
          </span>
        )}
      </div>
      <span className="font-mono text-caption text-text">{fmtMi(row.entry.distFromStartMi, sys)}</span>
      <span className="font-mono text-caption text-text-dim">—</span>
      {row.toNextWaterMi !== null
        ? <span className="font-mono text-caption text-text-mid">{fmtMi(row.toNextWaterMi, sys)}</span>
        : <span className="font-mono text-caption text-text-dim">—</span>
      }
      <span />
    </div>
  )
}
