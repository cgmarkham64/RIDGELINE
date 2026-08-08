import { useRef, useState } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import { shareTrip, type UserSearchResult } from '../../lib/users'
import { extractApiError, initials, toggleChipStyle } from '../../lib/utils'
import { useUserSearch } from './useUserSearch'
import type { Collaborator } from './shareDialog.types'

const MIN_QUERY_LENGTH = 2
type InviteRole = 'read' | 'edit'
type InviteFeedback = { kind: 'error' | 'success'; message: string }
const NO_USER_FOUND: InviteFeedback = { kind: 'error', message: 'No user found with that name or email' }

function InviteRoleToggle({ role, onChange }: { role: InviteRole; onChange: (r: InviteRole) => void }) {
  return (
    <div className="flex gap-1">
      {(['edit', 'read'] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className="px-2 py-[3px] font-mono text-label rounded-sm border transition-colors duration-100"
          style={toggleChipStyle(role === r)}
        >
          {r === 'edit' ? 'Can edit' : 'Can view'}
        </button>
      ))}
    </div>
  )
}

function InviteHeader({ role, onRoleChange }: { role: InviteRole; onRoleChange: (r: InviteRole) => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">
        Invite someone
      </div>
      <InviteRoleToggle role={role} onChange={onRoleChange} />
    </div>
  )
}

function InviteFeedbackMessage({ feedback }: { feedback: InviteFeedback | null }) {
  if (!feedback) return null
  return (
    <p
      className={`font-mono text-caption mt-2 ${feedback.kind === 'error' ? 'text-red' : ''}`}
      style={feedback.kind === 'success' ? { color: 'var(--pine)' } : undefined}
    >
      {feedback.kind === 'success' ? '✓ ' : ''}{feedback.message}
    </p>
  )
}

function UserResultRow({ user, onPick }: { user: UserSearchResult; onPick: (user: UserSearchResult) => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onPick(user) }}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 transition-colors duration-100"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-label font-bold"
        style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}
      >
        {initials(user.name)}
      </div>
      <span className="font-sans text-body-sm font-medium text-text truncate">{user.name}</span>
    </button>
  )
}

function SearchDropdown({ isSearching, results, onPick }: {
  isSearching: boolean
  results: UserSearchResult[]
  onPick: (user: UserSearchResult) => void
}) {
  if (isSearching) return <div className="px-3 py-2.5 font-mono text-caption text-text-dim">Searching…</div>
  if (results.length === 0) return <div className="px-3 py-2.5 font-mono text-caption text-text-dim">No users found</div>
  return (
    <>
      {results.map((user) => <UserResultRow key={user.sub} user={user} onPick={onPick} />)}
    </>
  )
}

function InviteSearchInput({ query, onQueryChange, onKeyDown, onFocus, showDropdown, isSearching, results, onPick }: {
  query: string
  onQueryChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus: () => void
  showDropdown: boolean
  isSearching: boolean
  results: UserSearchResult[]
  onPick: (user: UserSearchResult) => void
}) {
  return (
    <>
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder="Search by name or email…"
        className="w-full px-3 py-2 border border-border focus:border-border-mid rounded-sm text-body-sm bg-surface-2 text-text outline-none transition-[border-color] duration-[140ms] placeholder:text-text-dim"
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-mid rounded-md overflow-hidden z-10 shadow-lg">
          <SearchDropdown isSearching={isSearching} results={results} onPick={onPick} />
        </div>
      )}
    </>
  )
}

interface ShareInviteSectionProps {
  tripId: string
  onInvited: (collaborator: Collaborator) => void
}

export function ShareInviteSection({ tripId, onInvited }: ShareInviteSectionProps) {
  const [inviteRole, setInviteRole] = useState<InviteRole>('edit')
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState<InviteFeedback | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { showDropdown, isSearching, results, setDropdownOpen, resetSearch } = useUserSearch(query)
  useClickOutside(wrapRef, () => setDropdownOpen(false))

  async function handleInvite(user: UserSearchResult) {
    setDropdownOpen(false)
    setFeedback(null)
    try {
      await shareTrip(tripId, user.sub, inviteRole)
      onInvited({ sub: user.sub, name: user.name, role: inviteRole })
      setFeedback({ kind: 'success', message: `Invite sent to ${user.name}` })
      setQuery('')
      resetSearch()
    } catch (err: unknown) {
      setFeedback({ kind: 'error', message: extractApiError(err) ?? 'Failed to send invite' })
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (isSearching) return
      if (showDropdown && results.length > 0) handleInvite(results[0])
      else if (query.trim().length >= MIN_QUERY_LENGTH) setFeedback(NO_USER_FOUND)
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
      setQuery('')
    }
  }

  return (
    <div className="px-5 py-4 border-b border-border">
      <InviteHeader role={inviteRole} onRoleChange={setInviteRole} />
      <div ref={wrapRef} className="relative">
        <InviteSearchInput
          query={query}
          onQueryChange={(v) => { setQuery(v); setFeedback(null) }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setDropdownOpen(true) }}
          showDropdown={showDropdown}
          isSearching={isSearching}
          results={results}
          onPick={handleInvite}
        />
      </div>
      <InviteFeedbackMessage feedback={feedback} />
    </div>
  )
}
