import type { Waypoint } from '../../types'
import { WaypointAddDialog } from './WaypointAddDialog'
import { WaypointEditDialog } from './WaypointEditDialog'
import type { useAddWaypointForm } from './useAddWaypointForm'
import type { useEditWaypointForm } from './useEditWaypointForm'

export function WaypointDialogs({ waypoints, addForm, editForm }: {
  waypoints: Waypoint[]
  addForm: ReturnType<typeof useAddWaypointForm>
  editForm: ReturnType<typeof useEditWaypointForm>
}) {
  return (
    <>
      {addForm.pendingLatLon && (
        <WaypointAddDialog
          coords={addForm.pendingLatLon}
          form={addForm.addForm}
          saving={addForm.saving}
          error={addForm.error}
          onChange={(patch) => addForm.setAddForm((f) => ({ ...f, ...patch }))}
          onSubmit={addForm.handleAddWaypoint}
          onClose={addForm.cancelAdd}
        />
      )}
      {editForm.editingId && (
        <WaypointEditDialog
          waypoint={waypoints.find((w) => w.id === editForm.editingId)!}
          form={editForm.editForm}
          saving={editForm.saving}
          error={editForm.error}
          onChange={(patch) => editForm.setEditForm((f) => ({ ...f, ...patch }))}
          onSubmit={editForm.handleSaveEdit}
          onClose={editForm.cancelEdit}
        />
      )}
    </>
  )
}
