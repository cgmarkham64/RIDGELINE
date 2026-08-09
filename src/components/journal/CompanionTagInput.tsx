import type { KeyboardEvent } from 'react'
import { useCompanionSearch } from './useCompanionSearch'
import { CompanionTagList } from './CompanionTagList'
import { CompanionSearchDropdown } from './CompanionSearchDropdown'

const BLUR_CLOSE_DELAY_MS = 150

export function CompanionTagInput({
  tags,
  onChange,
  onMentionAdded,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  onMentionAdded: (sub: string) => void
}) {
  const { input, setInput, setOpen, showDropdown, searching, results, addTag } =
    useCompanionSearch(tags, onChange, onMentionAdded)

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
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
        <CompanionTagList tags={tags} onChange={onChange} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setTimeout(() => setOpen(false), BLUR_CLOSE_DELAY_MS)
            if (input.trim() && !showDropdown) addTag(input)
          }}
          placeholder={tags.length === 0 ? 'Add names…' : ''}
          className="flex-1 min-w-24 bg-transparent border-0 outline-none font-mono text-fine text-text placeholder:text-text-dim"
        />
      </div>

      {showDropdown && (
        <CompanionSearchDropdown searching={searching} results={results} onSelect={addTag} />
      )}
    </div>
  )
}
