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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        width: '100%',
        maxWidth: 360,
        margin: '0 16px',
        padding: 24,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: 8,
        }}>
          Delete trip?
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 6 }}>
          <span style={{ color: 'var(--text)' }}>{trip.title}</span> will be permanently deleted.
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 24 }}>
          This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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