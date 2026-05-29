import type { Trip } from '../../types'
import { useDeleteTrip } from '../../hooks/useTrips'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  trip: Trip
  onClose: () => void
  onDeleted: () => void
}

export function DeleteConfirm({ trip, onClose, onDeleted }: Props) {
  const { mutateAsync, isPending } = useDeleteTrip()

  async function handleConfirm() {
    await mutateAsync(trip._id)
    onDeleted()
  }

  return (
    <ConfirmDialog
      title="Delete trip?"
      body={
        <>
          <p className="text-body text-text-mid mb-[6px]">
            <span className="text-text">{trip.title}</span> will be permanently deleted.
          </p>
          <p className="text-body-sm text-text-dim">This action cannot be undone.</p>
        </>
      }
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      isPending={isPending}
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  )
}