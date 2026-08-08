import { useAuthStore } from '../../../../store/auth'
import type { StageBodyProps } from '../../types'
import { PartnersMenu } from './PartnersMenu'
import { PartnersList } from './PartnersList'
import { ConfirmPartyRow } from './ConfirmPartyRow'
import { PartnerInvitePanel } from './PartnerInvitePanel'
import { usePartnersCard } from './usePartnersCard'

type PartnersCardProps = {
  trip: StageBodyProps['trip']
  canEdit: boolean
  onInviteSent: () => void
  onNoPartners: () => void
  partyConfirmed?: boolean
  onConfirmParty?: () => void
}

export function PartnersCard({ trip, canEdit, onInviteSent, onNoPartners, partyConfirmed = false, onConfirmParty }: PartnersCardProps) {
  const currentUserSub = useAuthStore((s) => s.user?.id)
  const card = usePartnersCard(trip, currentUserSub, onInviteSent)

  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">
          Partners ({card.allPartners.length})
        </span>
        <PartnersMenu
          show={canEdit && !card.inviteOpen}
          isOwner={card.isOwner}
          soloTrip={card.soloTrip}
          onAddPartner={() => card.setInviteOpen(true)}
          onNoPartners={onNoPartners}
        />
      </div>

      <PartnersList
        partners={card.allPartners}
        ownerSub={trip?.ownerSub}
        isOwner={card.isOwner}
        inviteOpen={card.inviteOpen}
        onRemove={card.removePartner}
      />

      {canEdit && onConfirmParty && !card.inviteOpen && (
        <ConfirmPartyRow partyConfirmed={partyConfirmed} onConfirmParty={onConfirmParty} />
      )}

      {card.inviteOpen && (
        <PartnerInvitePanel
          query={card.inviteQuery}
          onQueryChange={card.setInviteQuery}
          isSearching={card.isSearching}
          results={card.visibleResults}
          onPick={card.handleInvite}
          message={card.message}
          onCancel={card.closeInvitePanel}
        />
      )}
    </div>
  )
}
