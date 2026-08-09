import type { Trip, Waypoint } from '../../types'
import { GpxMapSection } from '../trip/GpxMapSection'
import { WaypointsPanel } from './WaypointsPanel'

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
  return (
    <div className="shrink-0 border-b border-border flex items-stretch">
      {/* Routes & Tracks */}
      <div className="w-[40%] shrink-0 border-r border-border bg-surface px-4.5 py-3.5 overflow-y-auto max-h-50">
        <div className="sec-label mb-3">Routes &amp; Tracks</div>
        <GpxMapSection trip={trip} onTripUpdated={onTripUpdated} showMap={false} />
      </div>

      {/* Waypoints */}
      <WaypointsPanel
        waypoints={waypoints}
        addMode={addMode}
        editingId={editingId}
        onAddModeStart={onAddModeStart}
        onCancelAdd={onCancelAdd}
        onChipSelect={onChipSelect}
        onChipEdit={onChipEdit}
        onChipDelete={onChipDelete}
      />
    </div>
  )
}
