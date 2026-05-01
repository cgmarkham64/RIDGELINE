import type { Waypoint } from '../../types'
import { WAYPOINT_COLOR, WAYPOINT_LABEL } from './constants'
import { WaypointIcon } from './WaypointIcon'

export function WaypointChip({
  wp,
  isEditing,
  onSelect,
  onDelete,
}: {
  wp: Waypoint
  isEditing: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      onClick={onSelect}
      title={isEditing ? undefined : wp.notes ?? 'Click to edit'}
      className="inline-flex items-center gap-[6px] px-[10px] py-[5px] pr-2 rounded-[20px] cursor-pointer max-w-[240px]"
      style={{
        background: isEditing ? `${WAYPOINT_COLOR[wp.type]}18` : 'var(--surface2)',
        border: `1px solid ${isEditing ? WAYPOINT_COLOR[wp.type] : `${WAYPOINT_COLOR[wp.type]}44`}`,
      }}
    >
      <WaypointIcon type={wp.type} size={17} />
      <span className="font-sans text-[12px] text-text overflow-hidden text-ellipsis whitespace-nowrap">
        {wp.label}
      </span>
      <span
        className="font-mono text-[8px] tracking-[0.08em] uppercase shrink-0"
        style={{ color: WAYPOINT_COLOR[wp.type] }}
      >
        {WAYPOINT_LABEL[wp.type]}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        title="Remove"
        className="bg-transparent border-0 cursor-pointer text-text-dim text-[14px] leading-none p-0 shrink-0"
      >
        ×
      </button>
    </div>
  )
}