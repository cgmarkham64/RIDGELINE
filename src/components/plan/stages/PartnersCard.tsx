import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '../../../hooks/useDebounce'
import { searchUsers, shareTrip, type UserSearchResult } from '../../../lib/users'
import { unshareTrip } from '../../../lib/trips'
import { initials } from '../../../lib/utils'
import { useAuthStore } from '../../../store/auth'
import { IconPlus, IconMinus, IconX, IconMoreVertical } from '../../icons'
import type { StageBodyProps } from '../types'

type PartnersCardProps = {
  trip: StageBodyProps['trip']
  canEdit: boolean
  onInviteSent: () => void
  onNoPartners: () => void
}

export function PartnersCard({ trip, canEdit, onInviteSent, onNoPartners }: PartnersCardProps) {
  const qc = useQueryClient()
  const currentUserSub = useAuthStore(s => s.user?.id)
  const isOwner = !!currentUserSub && currentUserSub === trip?.ownerSub

  const partners: { name: string; sub: string }[] = [
    ...(trip?.ownerSub ? [{ sub: trip.ownerSub, name: trip.ownerName ?? 'Owner' }] : []),
    ...(trip?.sharedWith?.map(c => ({ sub: c.sub, name: c.name })) ?? []),
  ]

  const [partnersMenuOpen, setPartnersMenuOpen] = useState(false)
  const partnersMenuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!partnersMenuOpen) return
    function handleOutside(e: MouseEvent) {
      if (!partnersMenuRef.current?.contains(e.target as Node)) setPartnersMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [partnersMenuOpen])

  const [inviteOpen,     setInviteOpen]     = useState(false)
  const [inviteQuery,    setInviteQuery]    = useState('')
  const [inviteMsg,      setInviteMsg]      = useState<{ text: string; tone: 'pine' | 'red' } | null>(null)
  const [pendingInvites, setPendingInvites] = useState<{ sub: string; name: string }[]>([])

  // Single state object so the effect never calls setState synchronously
  const [searchResult, setSearchResult] = useState<{ query: string; results: UserSearchResult[] } | null>(null)

  const debouncedInviteQuery = useDebounce(inviteQuery, 300)
  const trimmedQuery = debouncedInviteQuery.trim()

  const soloTrip = partners.length <= 1 && pendingInvites.length === 0
  const visibleResults = trimmedQuery.length >= 2 && searchResult?.query === trimmedQuery ? searchResult.results : []
  const isSearching = trimmedQuery.length >= 2 && searchResult?.query !== trimmedQuery

  useEffect(() => {
    if (trimmedQuery.length < 2) return
    const q = trimmedQuery
    let cancelled = false
    const existingSubs = new Set([
      ...(trip?.sharedWith?.map(c => c.sub) ?? []),
      ...(trip?.ownerSub ? [trip.ownerSub] : []),
      ...pendingInvites.map(p => p.sub),
    ])
    searchUsers(q)
      .then(users => {
        if (cancelled) return
        setSearchResult({ query: q, results: users.filter(u => !existingSubs.has(u.sub)) })
      })
      .catch(() => { /* silently ignore */ })
    return () => { cancelled = true }
  }, [trimmedQuery, trip?.sharedWith, trip?.ownerSub, pendingInvites])

  async function handleInvite(user: UserSearchResult) {
    if (!trip?._id) return
    setInviteMsg(null)
    try {
      await shareTrip(trip._id, user.sub, 'edit')
      setPendingInvites(prev => [...prev, { sub: user.sub, name: user.name }])
      onInviteSent()
      setInviteQuery('')
      setSearchResult(null)
      setInviteMsg({ text: `Invite sent to ${user.name}`, tone: 'pine' })
      setTimeout(() => setInviteMsg(null), 3000)
    } catch {
      setInviteMsg({ text: 'Failed to send invite', tone: 'red' })
    }
  }

  function closeInvitePanel() {
    setInviteOpen(false)
    setInviteQuery('')
    setSearchResult(null)
    setInviteMsg(null)
  }

  async function handleRemovePartner(sub: string, isPending: boolean) {
    if (!trip?._id) return
    try {
      await unshareTrip(trip._id, sub)
      if (isPending) setPendingInvites(prev => prev.filter(p => p.sub !== sub))
      qc.invalidateQueries({ queryKey: ['plan', trip._id] })
    } catch { /* silently ignore */ }
  }

  const allPartners = [
    ...partners.map(p => ({ ...p, pending: false })),
    ...pendingInvites.map(p => ({ ...p, pending: true })),
  ]

  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">
          Partners ({partners.length + pendingInvites.length})
        </span>
        {canEdit && !inviteOpen && (
          <div ref={partnersMenuRef} className="relative">
            <button
              onClick={() => setPartnersMenuOpen(v => !v)}
              className="p-1 rounded text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none"
            >
              <IconMoreVertical size={14} />
            </button>
            {partnersMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-surface border border-border-mid rounded shadow-xl z-20 overflow-hidden min-w-40">
                <button
                  onMouseDown={() => { setPartnersMenuOpen(false); setInviteOpen(true) }}
                  className="w-full flex items-center gap-2 px-3 py-2 font-heading text-[10px] font-bold tracking-[0.08em] uppercase text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none text-left"
                >
                  <IconPlus size={10} />
                  Add partner
                </button>
                {isOwner && soloTrip && (
                  <button
                    onMouseDown={() => { setPartnersMenuOpen(false); onNoPartners() }}
                    className="w-full flex items-center gap-2 px-3 py-2 font-heading text-[10px] font-bold tracking-[0.08em] uppercase text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none text-left border-t border-border"
                  >
                    <IconMinus size={10} />
                    No partners
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {allPartners.length === 0 && !inviteOpen && (
        <p className="font-mono text-[9px] text-text-dim italic">No partners yet.</p>
      )}

      {allPartners.map((p, i) => {
        const isThisOwner = p.sub === trip?.ownerSub
        return (
          <div key={p.sub} className={`flex items-center gap-2.5 py-2 ${i < allPartners.length - 1 || inviteOpen ? 'border-b border-border' : ''}`}>
            <span className="w-6.5 h-6.5 rounded-full bg-surface-2 border border-border-mid flex items-center justify-center font-heading text-[10px] font-extrabold text-amber shrink-0">
              {initials(p.name)}
            </span>
            <span className="text-[11px] font-semibold text-text truncate flex-1 min-w-0">{p.name}</span>
            {p.pending && (
              <span className="font-mono text-[9px] tracking-[0.12em] text-amber shrink-0">PENDING</span>
            )}
            {isOwner && !isThisOwner && (
              <button
                onClick={() => handleRemovePartner(p.sub, p.pending)}
                title={p.pending ? 'Cancel invite' : 'Remove partner'}
                className="p-1 rounded text-text-dim hover:text-red hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none shrink-0"
              >
                <IconX size={10} />
              </button>
            )}
          </div>
        )
      })}

      {inviteOpen && (
        <div className="pt-2.5">
          <div className="relative">
            <input
              type="text"
              value={inviteQuery}
              onChange={e => setInviteQuery(e.target.value)}
              placeholder="Search by name or email…"
              autoFocus
              className="w-full px-2.5 py-1.5 bg-surface-2 border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]"
            />
            {isSearching && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[9px] text-text-dim">…</span>
            )}
            {visibleResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-mid rounded shadow-xl z-10 overflow-hidden">
                {visibleResults.map(u => (
                  <button
                    key={u.sub}
                    onMouseDown={e => { e.preventDefault(); handleInvite(u) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left bg-transparent border-none cursor-pointer hover:bg-surface-2 transition-colors"
                  >
                    <span className="w-5.5 h-5.5 rounded-full bg-surface-2 border border-border flex items-center justify-center font-heading text-[9px] font-extrabold text-amber shrink-0">
                      {initials(u.name)}
                    </span>
                    <span className="text-[11px] text-text truncate">{u.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {inviteMsg && (
            <p className="font-mono text-[9px] mt-1.5" style={{ color: inviteMsg.tone === 'pine' ? 'var(--pine)' : 'var(--red)' }}>
              {inviteMsg.text}
            </p>
          )}
          <button
            onClick={closeInvitePanel}
            className="font-mono text-[9px] text-text-dim hover:text-text transition-colors cursor-pointer bg-transparent border-none p-0 mt-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}