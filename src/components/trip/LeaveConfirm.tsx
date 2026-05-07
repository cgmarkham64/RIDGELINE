import type { Trip } from '../../types'
import { useLeaveTrip } from '../../hooks/useTrips'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  trip: Trip
  onClose: () => void
  onLeft: () => void
}

export function LeaveConfirm({ trip, onClose, onLeft }: Props) {
  const { mutateAsync, isPending } = useLeaveTrip()

  async function handleConfirm() {
    await mutateAsync(trip._id)
    onLeft()
  }

  return (
    <ConfirmDialog
      title="Leave trip?"
      body={
        <>
          <p className="text-[13px] text-text-mid mb-[6px]">
            You'll lose access to <span className="text-text">{trip.title}</span>.
          </p>
          <p className="text-[12px] text-text-dim">
            The trip won't be deleted. The owner can invite you again if needed.
          </p>
        </>
      }
      confirmLabel="Leave trip"
      pendingLabel="Leaving…"
      isPending={isPending}
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  )
}