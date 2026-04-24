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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px 5px 10px',
        background: isEditing ? `${WAYPOINT_COLOR[wp.type]}18` : 'var(--surface2)',
        border: `1px solid ${isEditing ? WAYPOINT_COLOR[wp.type] : `${WAYPOINT_COLOR[wp.type]}44`}`,
        borderRadius: 20,
        cursor: 'pointer',
        maxWidth: 240,
      }}
    >
      <WaypointIcon type={wp.type} size={17} />
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          color: 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {wp.label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: WAYPOINT_COLOR[wp.type],
          flexShrink: 0,
        }}
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
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-dim)',
          fontSize: 14,
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}