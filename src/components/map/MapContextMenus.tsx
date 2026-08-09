import type { Waypoint } from '../../types'

function ContextMenu({ x, y, children }: { x: number; y: number; onDismiss: () => void; children: React.ReactNode }) {
  return (
    <div
      className="absolute z-1001 bg-surface border border-border rounded-md overflow-hidden py-0.5"
      style={{ left: x + 4, top: y + 4, minWidth: 172 }}
    >
      {children}
    </div>
  )
}

function ContextMenuItem({
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
      className={`w-full flex items-center gap-2 px-3 py-1.75 font-mono text-caption tracking-[0.08em] uppercase transition-colors duration-80 cursor-pointer ${danger ? 'text-text-dim hover:text-red hover:bg-red-dim' : 'text-text-mid hover:text-amber hover:bg-surface-2'}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5 shrink-0" style={{ strokeWidth: 2 }}>
        {icon}
      </svg>
      {label}
    </button>
  )
}

export function MapContextMenus({
  contextMenu,
  waypointContextMenu,
  onMapClick,
  onMarkerClick,
  onDeleteWaypoint,
  onDismissContextMenu,
  onDismissWaypointContextMenu,
}: {
  contextMenu: { lat: number; lon: number; x: number; y: number } | null
  waypointContextMenu: { wp: Waypoint; x: number; y: number } | null
  onMapClick: (lat: number, lon: number) => void
  onMarkerClick: (wp: Waypoint) => void
  onDeleteWaypoint: (id: string) => void
  onDismissContextMenu: () => void
  onDismissWaypointContextMenu: () => void
}) {
  return (
    <>
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onDismiss={onDismissContextMenu}>
          <ContextMenuItem
            icon={<path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6z" />}
            label="Add waypoint here"
            onClick={() => onMapClick(contextMenu.lat, contextMenu.lon)}
          />
        </ContextMenu>
      )}

      {waypointContextMenu && (
        <ContextMenu x={waypointContextMenu.x} y={waypointContextMenu.y} onDismiss={onDismissWaypointContextMenu}>
          <ContextMenuItem
            icon={<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />}
            label="Edit waypoint"
            onClick={() => { onMarkerClick(waypointContextMenu.wp); onDismissWaypointContextMenu() }}
          />
          <ContextMenuItem
            icon={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>}
            label="Remove waypoint"
            danger
            onClick={() => { onDeleteWaypoint(waypointContextMenu.wp.id); onDismissWaypointContextMenu() }}
          />
        </ContextMenu>
      )}
    </>
  )
}
