import { useState } from 'react'

export function TagInput({
  tags,
  placeholder,
  onChange,
}: {
  tags: string[]
  placeholder: string
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  function addTag(value: string) {
    const trimmed = value.trim()
    if (!trimmed || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[32px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-surface-2 border border-border rounded-sm px-2 py-0.5 font-mono text-caption text-text-mid"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-text-dim hover:text-amber leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-24 bg-transparent border-0 outline-none font-mono text-fine text-text placeholder:text-text-dim"
      />
    </div>
  )
}