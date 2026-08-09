import type { Waypoint } from '../../types'
import type { useAddWaypointForm } from './useAddWaypointForm'
import type { useEditWaypointForm } from './useEditWaypointForm'
import type { useMapInteraction } from './useMapInteraction'

export function useMapClickHandlers(
  addForm: ReturnType<typeof useAddWaypointForm>,
  editForm: ReturnType<typeof useEditWaypointForm>,
  interaction: ReturnType<typeof useMapInteraction>
) {
  function handleMapClick(lat: number, lon: number) {
    interaction.dismissMenus()
    editForm.cancelEdit()
    addForm.beginAddAt(lat, lon)
  }
  function handleContextMenu(lat: number, lon: number, x: number, y: number) {
    addForm.cancelAdd()
    editForm.cancelEdit()
    interaction.openContextMenu(lat, lon, x, y)
  }
  function handleMarkerContextMenu(wp: Waypoint, x: number, y: number) {
    addForm.cancelAdd()
    interaction.openWaypointContextMenu(wp, x, y)
  }
  function handleMarkerClick(wp: Waypoint) {
    interaction.dismissMenus()
    if (editForm.editingId === wp.id) editForm.cancelEdit()
    else { addForm.cancelAdd(); editForm.startEdit(wp) }
  }

  return { handleMapClick, handleContextMenu, handleMarkerContextMenu, handleMarkerClick }
}
