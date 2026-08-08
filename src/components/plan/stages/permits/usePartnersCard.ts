import { useState } from 'react'
import { isOwnedBy } from '../../../../lib/utils'
import type { UserSearchResult } from '../../../../lib/users'
import { usePartnerSearch } from './usePartnerSearch'
import { usePartnerInvite } from './usePartnerInvite'
import { combinePartners, confirmedPartners } from './partnersCard.helpers'
import type { PartnersCardTrip } from './partnersCard.types'

export function usePartnersCard(trip: PartnersCardTrip, currentUserSub: string | undefined, onInviteSent: () => void) {
  const isOwner = isOwnedBy(trip?.ownerSub, currentUserSub)
  const partners = confirmedPartners(trip)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteQuery, setInviteQuery] = useState('')
  const invite = usePartnerInvite(trip?._id, onInviteSent)
  const { isSearching, results: visibleResults, resetSearch } = usePartnerSearch(inviteQuery, trip, invite.pendingInvites)

  async function handleInvite(user: UserSearchResult) {
    const sent = await invite.sendInvite(user)
    if (sent) { setInviteQuery(''); resetSearch() }
  }

  function closeInvitePanel() {
    setInviteOpen(false)
    setInviteQuery('')
    resetSearch()
    invite.clearMessage()
  }

  return {
    isOwner,
    allPartners: combinePartners(partners, invite.pendingInvites),
    soloTrip: partners.length <= 1 && invite.pendingInvites.length === 0,
    inviteOpen, setInviteOpen, inviteQuery, setInviteQuery,
    isSearching, visibleResults, handleInvite, closeInvitePanel,
    message: invite.message, removePartner: invite.removePartner,
  }
}
