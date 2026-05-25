import type { Trip, Waypoint } from '../../types'
import { GpxMapSection } from '../trip/GpxMapSection'
import { mono } from './constants'
import { WaypointChip } from './WaypointChip'

export function MapControlsBar({
  trip,
  onTripUpdated,
  waypoints,
  addMode,
  editingId,
  onAddModeStart,
  onCancelAdd,
  onChipSelect,
  onChipEdit,
  onChipDelete,
}: {
  trip: Trip
  onTripUpdated: (t: Trip) => void
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
    <div className="shrink-0 border-b border-border flex items-stretch">
      {/* Routes & Tracks */}
      <div className="w-[40%] shrink-0 border-r border-border bg-surface px-4.5 py-3.5 overflow-y-auto max-h-50">
        <div className="sec-label mb-3">Routes &amp; Tracks</div>
        <GpxMapSection trip={trip} onTripUpdated={onTripUpdated} showMap={false} />
      </div>

      {/* Waypoints */}
      <div className="flex-1 min-w-0 bg-surface overflow-y-auto max-h-50 px-4.5 pt-1.5 pb-3.5">
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: editingId || waypoints.length > 0 ? 12 : 0 }}
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
          <p style={mono} className="text-[9px] leading-[1.7]">
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
    </div>
  )
}