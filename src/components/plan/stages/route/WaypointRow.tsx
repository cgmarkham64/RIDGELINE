import { WaypointIcon } from '../../../map/WaypointIcon'
import { WAYPOINT_COLOR } from '../../../map/constants'
import { ACTIVE_BG, fmtMi } from './routeStage.helpers'
import { useUnitSystem } from '../../../../hooks/useUnitSystem'
import type { MergedRow } from './routeStage.types'

type WaypointRowProps = {
  row: Extract<MergedRow, { kind: 'waypoint' }>
  isDraggable: boolean
  isLast: boolean
  isActive: boolean
  gridTemplate: string
  segColor: string
  onFlyTo: (lat: number | null, lon: number | null, rowId: string) => void
  rowRef: (el: HTMLDivElement | null) => void
}

export function WaypointRow({ row, isDraggable, isLast, isActive, gridTemplate, segColor, onFlyTo, rowRef }: WaypointRowProps) {
  const sys = useUnitSystem()
  const border = isLast ? '' : 'border-b border-border'

  return (
    <div
      ref={rowRef}
      className={`grid items-center px-4 py-2.5 gap-3 ${border} cursor-pointer transition-colors`}
      style={{ gridTemplateColumns: gridTemplate, borderLeft: `3px solid ${segColor}`, background: isActive ? ACTIVE_BG : undefined }}
      onClick={() => onFlyTo(row.wp.lat, row.wp.lon, row.wp.id)}
    >
      {isDraggable && <span />}
      <span style={{ color: WAYPOINT_COLOR[row.wp.type] }}>
        <WaypointIcon type={row.wp.type} size={15} />
      </span>
      <span className="text-body-sm font-semibold text-text truncate">{row.wp.label}</span>
      <span className="font-mono text-caption text-text">{fmtMi(row.distFromStartMi, sys)}</span>
      <span className="font-mono text-caption text-text-dim">—</span>
      <span className="font-mono text-caption text-text-dim">—</span>
      <span />
    </div>
  )
}
