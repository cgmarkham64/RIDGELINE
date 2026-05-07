import type { Trip } from '../../types'
import { useLeaveTrip } from '../../hooks/useTrips'

interface Props {
  trip: Trip
  onClose: () => void
  onLeft: () => void
}

export function LeaveConfirm({ trip, onClose, onLeft }: Props) {
  const { mutateAsync, isPending } = useLeaveTrip()

  async function handleLeave() {
    await mutateAsync(trip._id)
    onLeft()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg w-full max-w-[360px] mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-heading text-base font-bold text-text mb-2">
          Leave trip?
        </h2>
        <p className="text-[13px] text-text-mid mb-[6px]">
          You'll lose access to <span className="text-text">{trip.title}</span>.
        </p>
        <p className="text-[12px] text-text-dim mb-6">
          The trip won't be deleted. The owner can invite you again if needed.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} disabled={isPending} className="btn btn-ghost">
            Cancel
          </button>
          <button onClick={handleLeave} disabled={isPending} className="btn btn-danger">
            {isPending ? 'Leaving…' : 'Leave trip'}
          </button>
        </div>
      </div>
    </div>
  )
}