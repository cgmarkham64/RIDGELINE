import type { Waypoint } from '../../types'
import { IconX } from '../icons'
import { WaypointForm } from './WaypointForm'
import { DEFAULT_FORM } from './constants'
import { Modal } from '../ui/Modal'

export function WaypointEditDialog({
  waypoint,
  form,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}: {
  waypoint: Waypoint
  form: typeof DEFAULT_FORM
  saving: boolean
  error: string | null
  onChange: (patch: Partial<typeof DEFAULT_FORM>) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  return (
    <Modal
      onClose={onClose}
      zIndexClassName="z-1002"
      backdropClassName="bg-[rgba(0,0,0,0.55)]"
      panelClassName="bg-surface border border-border rounded-lg w-full max-w-sm mx-4 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-heading text-sm font-extrabold text-text">Edit Waypoint</span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-sm bg-surface-2 border border-border text-text-dim hover:text-text transition-colors cursor-pointer"
        >
          <IconX size={14} />
        </button>
      </div>
      <form onSubmit={onSubmit} className="px-4 py-4">
        <WaypointForm
          coords={{ lat: waypoint.lat, lon: waypoint.lon }}
          form={form}
          saving={saving}
          submitLabel="Save changes"
          onChange={onChange}
        />
      </form>
      {error && <p className="px-4 pb-3 text-fine text-red">{error}</p>}
    </Modal>
  )
}