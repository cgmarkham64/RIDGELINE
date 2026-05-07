import { useEffect, useRef, useState } from 'react'
import type { Trip } from '../../types'
import { searchUsers, shareTrip, type UserSearchResult } from '../../lib/users'

interface Props {
  trip: Trip
  onClose: () => void
}

export function ShareDialog({ trip, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareSuccess, setShareSuccess] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // Debounced search
  useEffect(() => {
    setShareError(null)
    if (query.trim().length < 2) {
      setResults([])
      setDropdownOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const users = await searchUsers(query.trim())
        setResults(users)
        setDropdownOpen(true)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  async function handleSelect(user: UserSearchResult) {
    setDropdownOpen(false)
    setShareError(null)
    setShareSuccess(null)
    try {
      await shareTrip(trip._id, user.sub)
      setShareSuccess(`Shared with ${user.name}`)
      setQuery('')
      setResults([])
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setShareError(msg ?? 'Failed to share trip')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (isSearching) return
      if (results.length > 0) {
        handleSelect(results[0])
      } else if (query.trim().length >= 2) {
        setShareError('No user found with that name or email')
        setDropdownOpen(false)
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
      setQuery('')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-mid rounded-lg w-full max-w-[420px] mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="font-heading text-sm font-extrabold text-text">Share trip</div>
            <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-text-dim mt-[3px]">
              {trip.title}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-sm flex items-center justify-center bg-surface-2 border border-border cursor-pointer text-text-dim"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[14px] h-[14px]" style={{ strokeWidth: 2 }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="px-5 py-4 flex flex-col gap-2.5">
          {/* Copy link */}
          <div
            className="rounded-md px-4 py-3.5 transition-all duration-200"
            style={{
              border: `1px solid ${copied ? 'var(--pine-border)' : 'var(--border)'}`,
              background: copied ? 'var(--pine-dim)' : 'var(--surface2)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-heading text-[12px] font-bold text-text mb-[3px]">Copy link</div>
                <div className="font-mono text-[9px] tracking-[0.08em] text-text-dim">Share a direct link to this trip</div>
              </div>
              <button onClick={copyLink} className={`btn btn-sm shrink-0 ${copied ? 'btn-ghost' : 'btn-sky'}`}>
                {copied ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3 h-3 text-pine" style={{ strokeWidth: 2.5 }}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="text-pine">Copied</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3 h-3" style={{ strokeWidth: 2 }}>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Invite a user */}
          <div className="border border-border rounded-md px-4 py-3.5 bg-surface-2">
            <div className="font-heading text-[12px] font-bold text-text mb-[3px]">Invite to collaborate</div>
            <div className="font-mono text-[9px] tracking-[0.08em] text-text-dim mb-3">
              Find a Ridgeline user by name or email
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (results.length > 0) setDropdownOpen(true) }}
                placeholder="Search by name or email…"
                className="w-full px-3 py-2 border border-border focus:border-border-mid rounded-sm text-[12px] bg-surface text-text outline-none transition-[border-color] duration-[140ms] placeholder:text-text-dim"
                autoComplete="off"
              />

              {/* Dropdown */}
              {dropdownOpen && (
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
                        onMouseDown={(e) => { e.preventDefault(); handleSelect(user) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 transition-colors duration-100"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[9px] font-bold"
                          style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}
                        >
                          {initials(user.name)}
                        </div>
                        <div className="font-sans text-[12px] font-medium text-text truncate">{user.name}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2.5 font-mono text-[10px] text-text-dim">No users found</div>
                  )}
                </div>
              )}
            </div>

            {shareError && (
              <p className="font-mono text-[10px] text-red mt-2">{shareError}</p>
            )}
            {shareSuccess && (
              <p className="font-mono text-[10px] mt-2" style={{ color: 'var(--pine)' }}>
                ✓ {shareSuccess}
              </p>
            )}
          </div>

          {/* Export PDF */}
          <div className="border border-border rounded-md px-4 py-3.5 bg-surface-2 opacity-60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-heading text-[12px] font-bold text-text mb-[3px]">Export as PDF</div>
                <div className="font-mono text-[9px] tracking-[0.08em] text-text-dim">
                  Styled trip report with journal, map &amp; stats
                </div>
              </div>
              <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-text-dim border border-border rounded-[3px] px-[7px] py-[3px] shrink-0">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}