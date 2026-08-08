import { initials } from '../../../../lib/utils'
import { IconX } from '../../../icons'
import type { PartnerEntry } from './partnersCard.types'

interface PartnersListProps {
  partners: PartnerEntry[]
  ownerSub: string | undefined
  isOwner: boolean
  inviteOpen: boolean
  onRemove: (sub: string, isPending: boolean) => void
}

export function PartnersList({ partners, ownerSub, isOwner, inviteOpen, onRemove }: PartnersListProps) {
  if (partners.length === 0) {
    return inviteOpen ? null : <p className="font-mono text-label text-text-dim italic">No partners yet.</p>
  }

  return (
    <>
      {partners.map((p, i) => {
        const isThisOwner = p.sub === ownerSub
        const showDivider = i < partners.length - 1 || inviteOpen
        return (
          <div key={p.sub} className={`flex items-center gap-2.5 py-2 ${showDivider ? 'border-b border-border' : ''}`}>
            <span className="w-6.5 h-6.5 rounded-full bg-surface-2 border border-border-mid flex items-center justify-center font-heading text-caption font-extrabold text-amber shrink-0">
              {initials(p.name)}
            </span>
            <span className="text-fine font-semibold text-text truncate flex-1 min-w-0">{p.name}</span>
            {p.pending && (
              <span className="font-mono text-label tracking-[0.12em] text-amber shrink-0">PENDING</span>
            )}
            {isOwner && !isThisOwner && (
              <button
                onClick={() => onRemove(p.sub, p.pending)}
                title={p.pending ? 'Cancel invite' : 'Remove partner'}
                className="p-1 rounded text-text-dim hover:text-red hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none shrink-0"
              >
                <IconX size={10} />
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}
