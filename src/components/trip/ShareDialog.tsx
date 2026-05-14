import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import type { Trip } from '../../types'
import { searchUsers, shareTrip, type UserSearchResult } from '../../lib/users'
import { useUnshareTrip } from '../../hooks/useTrips'
import { initials, extractApiError } from '../../lib/utils'

interface Props {
  trip: Trip
  onClose: () => void
}

export function ShareDialog({ trip, onClose }: Props) {
  const [collaborators, setCollaborators] = useState(
    (trip.sharedWith ?? []).filter((c): c is { sub: string; name: string; role?: 'read' | 'edit' } => typeof c === 'object' && c !== null)
  )
  const [inviteRole, setInviteRole] = useState<'read' | 'edit'>('edit')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchIdRef = useRef(0)
  const unshare = useUnshareTrip()

  const debouncedQuery = useDebounce(query, 300)
  const showDropdown = dropdownOpen && debouncedQuery.trim().length >= 2

  const runSearch = useCallback(async (q: string) => {
    const id = ++searchIdRef.current
    setIsSearching(true)
    try {
      const users = await searchUsers(q)
      if (id !== searchIdRef.current) return
      setResults(users)
      setDropdownOpen(true)
    } catch {
      if (id !== searchIdRef.current) return
      setResults([])
    } finally {
      if (id === searchIdRef.current) setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) runSearch(debouncedQuery.trim())
    else { setResults([]); setDropdownOpen(false) }
  }, [debouncedQuery, runSearch])

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        dropdownRef.current?.contains(e.target as Node) === false &&
        inputRef.current?.contains(e.target as Node) === false
      ) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  async function handleInvite(user: UserSearchResult) {
    setDropdownOpen(false)
    setInviteError(null)
    setInviteSuccess(null)
    try {
      await shareTrip(trip._id, user.sub, inviteRole)
      setCollaborators((prev) => {
        if (prev.some((c) => c.sub === user.sub)) return prev
        return [...prev, { sub: user.sub, name: user.name, role: inviteRole }]
      })
      setInviteSuccess(`Invite sent to ${user.name}`)
      setQuery('')
      setResults([])
    } catch (err: unknown) {
      const msg = extractApiError(err)
      setInviteError(msg ?? 'Failed to send invite')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (isSearching) return
      if (showDropdown && results.length > 0) handleInvite(results[0])
      else if (query.trim().length >= 2) setInviteError('No user found with that name or email')
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
      setQuery('')
    }
  }

  function handleRemove(sub: string) {
    unshare.mutate({ tripId: trip._id, collaboratorSub: sub })
    setCollaborators((prev) => prev.filter((c) => c.sub !== sub))
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-mid rounded-lg w-full max-w-[400px] mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="font-heading text-sm font-extrabold text-text">Share trip</div>
            <div className="font-mono text-[9px] tracking-widest uppercase text-text-dim mt-[3px]">
              {trip.title}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-sm flex items-center justify-center bg-surface-2 border border-border cursor-pointer text-text-dim hover:text-text transition-colors duration-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[14px] h-[14px]" style={{ strokeWidth: 2 }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* People with access */}
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-3">
            People with access
          </div>
          {collaborators.length === 0 ? (
            <p className="font-mono text-[10px] text-text-dim italic">No collaborators yet</p>
          ) : (
            <div className="flex flex-col gap-1">
              {collaborators.map((c) => (
                <div key={c.sub} className="flex items-center gap-2.5 py-1">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[9px] font-bold"
                    style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}
                  >
                    {initials(c.name)}
                  </div>
                  <span className="flex-1 font-sans text-[13px] text-text">{c.name}</span>
                  <span className="font-mono text-[9px] text-text-dim mr-1">
                    {c.role === 'read' ? 'Viewer' : 'Editor'}
                  </span>
                  <button
                    onClick={() => handleRemove(c.sub)}
                    className="font-mono text-[9px] text-text-dim hover:text-red transition-colors duration-100"
                    title="Remove access"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">
              Invite someone
            </div>
            <div className="flex gap-1">
              {(['edit', 'read'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setInviteRole(r)}
                  className="px-2 py-[3px] font-mono text-[9px] rounded-sm border transition-colors duration-100"
                  style={{
                    background:   inviteRole === r ? 'var(--amber-dim)'    : 'var(--surface-2)',
                    borderColor:  inviteRole === r ? 'var(--amber-border)' : 'var(--border)',
                    color:        inviteRole === r ? 'var(--amber)'        : 'var(--text-dim)',
                  }}
                >
                  {r === 'edit' ? 'Can edit' : 'Can view'}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setInviteError(null) }}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (results.length > 0) setDropdownOpen(true) }}
              placeholder="Search by name or email…"
              className="w-full px-3 py-2 border border-border focus:border-border-mid rounded-sm text-[12px] bg-surface-2 text-text outline-none transition-[border-color] duration-[140ms] placeholder:text-text-dim"
              autoComplete="off"
            />
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-mid rounded-md overflow-hidden z-10 shadow-lg"
              >
                {isSearching ? (
                  <div className="px-3 py-2.5 font-mono text-[10px] text-text-dim">Searching…</div>
                ) : results.length > 0 ? (
                  results.map((user) => (
                    <button
                      key={user.sub}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleInvite(user) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 transition-colors duration-100"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[9px] font-bold"
                        style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}
                      >
                        {initials(user.name)}
                      </div>
                      <span className="font-sans text-[12px] font-medium text-text truncate">{user.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2.5 font-mono text-[10px] text-text-dim">No users found</div>
                )}
              </div>
            )}
          </div>
          {inviteError && <p className="font-mono text-[10px] text-red mt-2">{inviteError}</p>}
          {inviteSuccess && <p className="font-mono text-[10px] mt-2" style={{ color: 'var(--pine)' }}>✓ {inviteSuccess}</p>}
        </div>

        {/* Utilities */}
        <div className="px-5 py-3 flex flex-col gap-0.5">
          <div className="flex items-center justify-between py-1.5">
            <div>
              <div className="font-sans text-[12px] font-medium text-text">Copy link</div>
              <div className="font-mono text-[9px] text-text-dim">Share a direct link to this trip</div>
            </div>
            <button onClick={copyLink} className={`btn btn-sm shrink-0 ${copied ? 'btn-ghost' : 'btn-sky'}`}>
              {copied ? (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3 h-3 text-pine" style={{ strokeWidth: 2.5 }}><path d="M20 6L9 17l-5-5" /></svg><span className="text-pine">Copied</span></>
              ) : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3 h-3" style={{ strokeWidth: 2 }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>Copy</>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between py-1.5 opacity-50">
            <div>
              <div className="font-sans text-[12px] font-medium text-text">Export as PDF</div>
              <div className="font-mono text-[9px] text-text-dim">Styled trip report with journal, map &amp; stats</div>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-text-dim border border-border rounded-[3px] px-[7px] py-[3px] shrink-0">
              Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
