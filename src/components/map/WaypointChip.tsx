import { useState } from 'react'
import type { Waypoint } from '../../types'
import { WAYPOINT_COLOR, WAYPOINT_LABEL } from './constants'
import { WaypointIcon } from './WaypointIcon'

export function WaypointChip({
  wp,
  isEditing,
  onSelect,
  onEdit,
  onDelete,
}: {
  wp: Waypoint
  isEditing: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  return (
    <>
      <div
        onClick={onSelect}
        onContextMenu={(e) => {
          e.preventDefault()
          setMenu({ x: e.clientX, y: e.clientY })
        }}
        title={wp.notes ?? undefined}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.25 pr-2 rounded-full cursor-pointer max-w-[240px]"
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
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title="Remove"
          className="bg-transparent border-0 cursor-pointer text-text-dim text-sm leading-none p-0 shrink-0"
        >
          ×
        </button>
      </div>

      {menu && (
        <>
          <div
            className="fixed inset-0 z-[2000]"
            onClick={() => setMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setMenu(null) }}
          />
          <div
            className="fixed z-[2001] bg-surface border border-border rounded-md overflow-hidden py-0.5"
            style={{ left: menu.x + 4, top: menu.y + 4, minWidth: 172 }}
          >
            <ChipMenuItem
              icon={<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />}
              label="Edit waypoint"
              onClick={() => { onEdit(); setMenu(null) }}
            />
            <ChipMenuItem
              icon={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>}
              label="Remove waypoint"
              danger
              onClick={() => { onDelete(); setMenu(null) }}
            />
          </div>
        </>
      )}
    </>
  )
}

function ChipMenuItem({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.75 font-mono text-[10px] tracking-[0.08em] uppercase transition-colors duration-80 cursor-pointer ${danger ? 'text-text-dim hover:text-red hover:bg-red-dim' : 'text-text-mid hover:text-amber hover:bg-surface-2'}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5 shrink-0" style={{ strokeWidth: 2 }}>
        {icon}
      </svg>
      {label}
    </button>
  )
}