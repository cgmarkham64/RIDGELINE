import { initials } from '../../../../lib/utils'
import type { UserSearchResult } from '../../../../lib/users'
import type { InviteMessage } from './partnersCard.types'

function InviteResultRow({ user, onPick }: { user: UserSearchResult; onPick: (user: UserSearchResult) => void }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onPick(user) }}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left bg-transparent border-none cursor-pointer hover:bg-surface-2 transition-colors"
    >
      <span className="w-5.5 h-5.5 rounded-full bg-surface-2 border border-border flex items-center justify-center font-heading text-label font-extrabold text-amber shrink-0">
        {initials(user.name)}
      </span>
      <span className="text-fine text-text truncate">{user.name}</span>
    </button>
  )
}

interface PartnerInvitePanelProps {
  query: string
  onQueryChange: (v: string) => void
  isSearching: boolean
  results: UserSearchResult[]
  onPick: (user: UserSearchResult) => void
  message: InviteMessage | null
  onCancel: () => void
}

export function PartnerInvitePanel({ query, onQueryChange, isSearching, results, onPick, message, onCancel }: PartnerInvitePanelProps) {
  return (
    <div className="pt-2.5">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by name or email…"
          autoFocus
          className="w-full px-2.5 py-1.5 bg-surface-2 border border-border rounded-sm font-mono text-fine text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]"
        />
        {isSearching && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-label text-text-dim">…</span>
        )}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-mid rounded shadow-xl z-10 overflow-hidden">
            {results.map((u) => <InviteResultRow key={u.sub} user={u} onPick={onPick} />)}
          </div>
        )}
      </div>
      {message && (
        <p className="font-mono text-label mt-1.5" style={{ color: message.tone === 'pine' ? 'var(--pine)' : 'var(--red)' }}>
          {message.text}
        </p>
      )}
      <button
        onClick={onCancel}
        className="font-mono text-label text-text-dim hover:text-text transition-colors cursor-pointer bg-transparent border-none p-0 mt-2"
      >
        Cancel
      </button>
    </div>
  )
}
