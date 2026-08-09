import { useState } from 'react'
import { useUpdatePlan } from '../../hooks/usePlans'
import { Modal } from '../ui/Modal'
import { TripSetupFields } from './TripSetupFields'

interface Props {
  tripId: string
  onClose: () => void
  onCancel?: () => void
  // Pre-populate when editing an existing trip
  initialTitle?: string
  initialLocation?: string
  initialStartDate?: string
  initialEndDate?: string
}

const ISO_DATE_LENGTH = 10

function todayIso() {
  return new Date().toISOString().slice(0, ISO_DATE_LENGTH)
}

export function TripSetupDialog({
  tripId,
  onClose,
  initialTitle = '',
  initialLocation = '',
  initialStartDate,
  initialEndDate,
  onCancel,
}: Props) {
  const { mutateAsync: updatePlan, isPending } = useUpdatePlan()

  const today = todayIso()
  const [title,     setTitle]     = useState(initialTitle)
  const [location,  setLocation]  = useState(initialLocation)
  const [startDate, setStartDate] = useState(initialStartDate ?? today)
  const [endDate,   setEndDate]   = useState(initialEndDate   ?? today)
  const [error,     setError]     = useState<string | null>(null)

  const isEditing = !!initialTitle

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Trip name is required'); return }
    if (endDate < startDate) { setError('End date must be on or after start date'); return }
    setError(null)
    try {
      await updatePlan({ id: tripId, body: { title: title.trim(), location: location.trim(), startDate, endDate } })
      onClose()
    } catch {
      setError('Failed to save — please try again')
    }
  }

  return (
    <Modal
      zIndexClassName="z-[1200]"
      backdropClassName="bg-[rgba(0,0,0,0.72)]"
      panelClassName="bg-surface border border-border-mid rounded-lg w-full max-w-[400px] mx-4 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="font-heading text-sm font-extrabold text-text">
          {isEditing ? 'Edit trip details' : 'Name your trip'}
        </div>
        {!isEditing && (
          <div className="font-mono text-label tracking-widest uppercase text-text-dim mt-[3px]">
            You can edit these later
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
        <TripSetupFields
          title={title} setTitle={setTitle}
          location={location} setLocation={setLocation}
          startDate={startDate} setStartDate={setStartDate}
          endDate={endDate} setEndDate={setEndDate}
        />

        {error && <p className="font-mono text-caption text-red -mt-1">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel ?? onClose} className="btn btn-ghost btn-sm">
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="btn btn-primary btn-sm">
            {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Save & start planning'}
          </button>
        </div>
      </form>
    </Modal>
  )
}