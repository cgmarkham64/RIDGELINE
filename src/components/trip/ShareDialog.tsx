import { useState } from 'react'
import type { Trip } from '../../types'
import { Modal } from '../ui/Modal'
import { ShareCollaboratorList } from './ShareCollaboratorList'
import { ShareInviteSection } from './ShareInviteSection'
import { ShareUtilities } from './ShareUtilities'
import type { Collaborator } from './shareDialog.types'

interface Props {
  trip: Trip
  onClose: () => void
}

function isCollaborator(c: unknown): c is Collaborator {
  return typeof c === 'object' && c !== null
}

export function ShareDialog({ trip, onClose }: Props) {
  const [collaborators, setCollaborators] = useState((trip.sharedWith ?? []).filter(isCollaborator))

  function handleInvited(collaborator: Collaborator) {
    setCollaborators((prev) => (prev.some((c) => c.sub === collaborator.sub) ? prev : [...prev, collaborator]))
  }

  function handleRemove(sub: string) {
    setCollaborators((prev) => prev.filter((c) => c.sub !== sub))
  }

  return (
    <Modal
      onClose={onClose}
      backdropClassName="bg-black/70 backdrop-blur-sm"
      panelClassName="bg-surface border border-border-mid rounded-lg w-full max-w-[400px] mx-4 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <div className="font-heading text-sm font-extrabold text-text">Share trip</div>
          <div className="font-mono text-label tracking-widest uppercase text-text-dim mt-[3px]">
            {trip.title}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-sm flex items-center justify-center bg-surface-2 border border-border cursor-pointer text-text-dim hover:text-text transition-colors duration-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5" style={{ strokeWidth: 2 }}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ShareCollaboratorList tripId={trip._id} collaborators={collaborators} onRemove={handleRemove} />
      <ShareInviteSection tripId={trip._id} onInvited={handleInvited} />
      <ShareUtilities />
    </Modal>
  )
}
