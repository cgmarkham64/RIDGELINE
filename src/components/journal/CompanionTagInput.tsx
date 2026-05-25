import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { searchUsers, type UserSearchResult } from '../../lib/users'
import { initials } from '../../lib/utils'

export function CompanionTagInput({
  tags,
  onChange,
  onMentionAdded,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  onMentionAdded: (sub: string) => void
}) {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const searchIdRef = useRef(0)

  const debouncedInput = useDebounce(input, 300)
  const showDropdown = open && debouncedInput.trim().length >= 2

  const runSearch = useCallback(async (query: string) => {
    const id = ++searchIdRef.current
    setSearching(true)
    try {
      const users = await searchUsers(query)
      if (id !== searchIdRef.current) return
      setResults(users)
      setOpen(true)
    } catch {
      if (id !== searchIdRef.current) return
      setResults([])
    } finally {
      if (id === searchIdRef.current) setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedInput.trim().length >= 2) runSearch(debouncedInput.trim())
    else { setResults([]); setOpen(false) }
  }, [debouncedInput, runSearch])

  function addTag(label: string, sub?: string) {
    const trimmed = label.trim()
    // @ prefix discriminates Ridgeline users from free-text names
    const stored = sub ? `@${trimmed}` : trimmed
    if (!stored || tags.includes(stored)) return
    onChange([...tags, stored])
    if (sub) onMentionAdded(sub)
    setInput('')
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showDropdown && results.length > 0) {
        addTag(results[0].name, results[0].sub)
      } else if (input.trim()) {
        addTag(input)
      }
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 items-center min-h-[32px]">
        {tags.map((tag) => {
          const isRidgeline = tag.startsWith('@')
          const display = isRidgeline ? tag.slice(1) : tag
          return (
            <span
              key={tag}
              className={`flex items-center gap-1 border rounded-sm px-2 py-0.5 font-mono text-[10px] ${
                isRidgeline
                  ? 'bg-amber-dim border-amber-border text-amber'
                  : 'bg-surface-2 border-border text-text-mid'
              }`}
            >
              {display}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="text-text-dim hover:text-amber leading-none"
              >
                ×
              </button>
            </span>
          )
        })}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150)
            if (input.trim() && !showDropdown) addTag(input)
          }}
          placeholder={tags.length === 0 ? 'Add names…' : ''}
          className="flex-1 min-w-24 bg-transparent border-0 outline-none font-mono text-[11px] text-text placeholder:text-text-dim"
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-mid rounded-md overflow-hidden z-10 shadow-lg">
          {searching ? (
            <div className="px-3 py-2.5 font-mono text-[10px] text-text-dim">Searching…</div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <button
                key={user.sub}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(user.name, user.sub) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-2 transition-colors duration-100"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-mono text-[9px] font-bold"
                  style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}
                >
                  {initials(user.name)}
                </div>
                <div className="min-w-0">
                  <div className="font-sans text-[12px] font-medium text-text truncate">{user.name}</div>
                  <div className="font-mono text-[9px] text-text-dim">Ridgeline user — will be invited</div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2.5 font-mono text-[10px] text-text-dim">No Ridgeline users found — will be saved as a name only</div>
          )}
        </div>
      )}
    </div>
  )
}