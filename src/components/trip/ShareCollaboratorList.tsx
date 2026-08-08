import { useUnshareTrip } from '../../hooks/useTrips'
import { initials } from '../../lib/utils'
import type { Collaborator } from './shareDialog.types'

interface ShareCollaboratorListProps {
  tripId: string
  collaborators: Collaborator[]
  onRemove: (sub: string) => void
}

export function ShareCollaboratorList({ tripId, collaborators, onRemove }: ShareCollaboratorListProps) {
  const unshare = useUnshareTrip()

  function handleRemove(sub: string) {
    unshare.mutate({ tripId, collaboratorSub: sub })
    onRemove(sub)
  }

  return (
    <div className="px-5 pt-4 pb-3 border-b border-border">
      <div className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-3">
        People with access
      </div>
      {collaborators.length === 0 ? (
        <p className="font-mono text-caption text-text-dim italic">No collaborators yet</p>
      ) : (
        <div className="flex flex-col gap-1">
          {collaborators.map((c) => (
            <div key={c.sub} className="flex items-center gap-2.5 py-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-label font-bold"
                style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}
              >
                {initials(c.name)}
              </div>
              <span className="flex-1 font-sans text-body text-text">{c.name}</span>
              <span className="font-mono text-label text-text-dim mr-1">
                {c.role === 'read' ? 'Viewer' : 'Editor'}
              </span>
              <button
                onClick={() => handleRemove(c.sub)}
                className="font-mono text-label text-text-dim hover:text-red transition-colors duration-100"
                title="Remove access"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
