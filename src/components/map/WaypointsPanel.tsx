import type { Waypoint } from '../../types'
import { mono } from './constants'
import { WaypointChip } from './WaypointChip'

const SECTION_MARGIN_PX = 12

export function WaypointsPanel({
  waypoints,
  addMode,
  editingId,
  onAddModeStart,
  onCancelAdd,
  onChipSelect,
  onChipEdit,
  onChipDelete,
}: {
  waypoints: Waypoint[]
  addMode: boolean
  editingId: string | null
  onAddModeStart: () => void
  onCancelAdd: () => void
  onChipSelect: (wp: Waypoint) => void
  onChipEdit: (wp: Waypoint) => void
  onChipDelete: (id: string) => void
}) {
  const sortedWaypoints = waypoints.slice().sort((a, b) => b.lon - a.lon || b.lat - a.lat)

  return (
    <div className="flex-1 min-w-0 bg-surface overflow-y-auto max-h-50 px-4.5 pt-1.5 pb-3.5">
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: editingId || waypoints.length > 0 ? SECTION_MARGIN_PX : 0 }}
      >
        <div className="sec-label m-0 flex-1">Waypoints</div>
        {!addMode && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onAddModeStart}>
            + Add Waypoint
          </button>
        )}
        {addMode && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelAdd}>
            Cancel
          </button>
        )}
      </div>

      {waypoints.length === 0 && !addMode && !editingId ? (
        <p style={mono} className="text-label leading-[1.7]">
          No waypoints yet — mark campsites, wildlife sightings, viewpoints, and more.
        </p>
      ) : waypoints.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {sortedWaypoints.map((wp) => (
            <WaypointChip
              key={wp.id}
              wp={wp}
              isEditing={editingId === wp.id}
              onSelect={() => onChipSelect(wp)}
              onEdit={() => onChipEdit(wp)}
              onDelete={() => onChipDelete(wp.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
