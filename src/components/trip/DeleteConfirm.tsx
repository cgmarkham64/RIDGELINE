import type { Trip } from '../../types'
import { useDeleteTrip } from '../../hooks/useTrips'

interface Props {
  trip: Trip
  onClose: () => void
  onDeleted: () => void
}

export function DeleteConfirm({ trip, onClose, onDeleted }: Props) {
  const { mutateAsync, isPending } = useDeleteTrip()

  async function handleDelete() {
    await mutateAsync(trip._id)
    onDeleted()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div className="bg-surface border border-border rounded-lg w-full max-w-[360px] mx-4 p-6">
        <h2 className="font-heading text-[16px] font-bold text-text mb-2">
          Delete trip?
        </h2>
        <p className="text-[13px] text-text-mid mb-[6px]">
          <span className="text-text">{trip.title}</span> will be permanently deleted.
        </p>
        <p className="text-[12px] text-text-dim mb-6">
          This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} disabled={isPending} className="btn btn-ghost">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={isPending} className="btn btn-danger">
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}