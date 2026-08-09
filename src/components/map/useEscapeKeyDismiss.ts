import { useEffect } from 'react'
import type { useAddWaypointForm } from './useAddWaypointForm'
import type { useEditWaypointForm } from './useEditWaypointForm'
import type { useMapInteraction } from './useMapInteraction'

export function useEscapeKeyDismiss(
  addForm: ReturnType<typeof useAddWaypointForm>,
  editForm: ReturnType<typeof useEditWaypointForm>,
  interaction: ReturnType<typeof useMapInteraction>
) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        addForm.cancelAdd(); editForm.cancelEdit()
        interaction.dismissMenus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // cancelAdd/cancelEdit/dismissMenus are useCallback-stabilized in their
    // owning hooks; only they (not the whole hook-return objects) need to
    // be watched here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addForm.cancelAdd, editForm.cancelEdit, interaction.dismissMenus])
}
