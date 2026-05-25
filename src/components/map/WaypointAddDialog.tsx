import { IconX } from '../icons'
import { WaypointForm } from './WaypointForm'
import { DEFAULT_FORM } from './constants'

export function WaypointAddDialog({
  coords,
  form,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}: {
  coords: { lat: number; lon: number }
  form: typeof DEFAULT_FORM
  saving: boolean
  error: string | null
  onChange: (patch: Partial<typeof DEFAULT_FORM>) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-1002 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-heading text-sm font-extrabold text-text">New Waypoint</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-sm bg-surface-2 border border-border text-text-dim hover:text-text transition-colors cursor-pointer"
          >
            <IconX size={14} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-4 py-4">
          <WaypointForm
            coords={coords}
            form={form}
            saving={saving}
            submitLabel="Add waypoint"
            onChange={onChange}
          />
        </form>
        {error && <p className="px-4 pb-3 text-[11px] text-red">{error}</p>}
      </div>
    </div>
  )
}