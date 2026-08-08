import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { shareTrip, type UserSearchResult } from '../../../../lib/users'
import { unshareTrip } from '../../../../lib/trips'
import type { InviteMessage } from './partnersCard.types'

const INVITE_MESSAGE_TIMEOUT_MS = 3000

export function usePartnerInvite(tripId: string | undefined, onInviteSent: () => void) {
  const qc = useQueryClient()
  const [message, setMessage] = useState<InviteMessage | null>(null)
  const [pendingInvites, setPendingInvites] = useState<{ sub: string; name: string }[]>([])

  async function sendInvite(user: UserSearchResult): Promise<boolean> {
    if (!tripId) return false
    setMessage(null)
    try {
      await shareTrip(tripId, user.sub, 'edit')
      setPendingInvites((prev) => [...prev, { sub: user.sub, name: user.name }])
      onInviteSent()
      setMessage({ text: `Invite sent to ${user.name}`, tone: 'pine' })
      setTimeout(() => setMessage(null), INVITE_MESSAGE_TIMEOUT_MS)
      return true
    } catch {
      setMessage({ text: 'Failed to send invite', tone: 'red' })
      return false
    }
  }

  async function removePartner(sub: string, isPending: boolean) {
    if (!tripId) return
    try {
      await unshareTrip(tripId, sub)
      if (isPending) setPendingInvites((prev) => prev.filter((p) => p.sub !== sub))
      qc.invalidateQueries({ queryKey: ['plan', tripId] })
    } catch { /* silently ignore */ }
  }

  return { message, clearMessage: () => setMessage(null), pendingInvites, sendInvite, removePartner }
}
