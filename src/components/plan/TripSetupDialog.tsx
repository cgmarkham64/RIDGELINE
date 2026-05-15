import { useState } from 'react'
import { useUpdatePlan } from '../../hooks/usePlans'

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

function todayIso() {
  return new Date().toISOString().slice(0, 10)
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

  const inputCls = 'w-full px-3 py-2 border border-border focus:border-border-mid rounded-sm text-[12px] bg-surface-2 text-text outline-none transition-[border-color] duration-[140ms] placeholder:text-text-dim'
  const labelCls = 'font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1.5 block'

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)' }}
    >
      <div className="bg-surface border border-border-mid rounded-lg w-full max-w-[400px] mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="font-heading text-sm font-extrabold text-text">
            {isEditing ? 'Edit trip details' : 'Name your trip'}
          </div>
          {!isEditing && (
            <div className="font-mono text-[9px] tracking-widest uppercase text-text-dim mt-[3px]">
              You can edit these later
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Trip name *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sierra High Route"
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <label className={labelCls}>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. John Muir Wilderness, CA"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value) }}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>End date *</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {error && <p className="font-mono text-[10px] text-red -mt-1">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCancel ?? onClose} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn btn-primary btn-sm">
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Save & start planning'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}