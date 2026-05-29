import { IconCheck } from '../icons'

export function CheckItem({ text, done = false, na = false, onToggle }: {
  text: string
  done?: boolean
  na?: boolean
  onToggle?: () => void
}) {
  const indicator = (
    <span className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
      na   ? 'border-border opacity-35' :
      done ? 'bg-pine-dim border-pine-border text-pine' :
             'border-border text-text-dim'
    }`}>
      {done && !na && <IconCheck size={9} strokeWidth={2.8} />}
      {na && <span className="font-mono text-label leading-none text-text-dim">—</span>}
    </span>
  )
  const label = (
    <span className={`text-body-sm ${na ? 'line-through opacity-35 text-text-dim' : done ? 'text-text' : 'text-text-dim'}`}>
      {text}
    </span>
  )

  if (onToggle && !na) {
    return (
      <button type="button" onClick={onToggle} className="flex items-center gap-2.5 py-1.5 w-full text-left bg-transparent border-none cursor-pointer">
        {indicator}
        {label}
      </button>
    )
  }
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {indicator}
      {label}
    </div>
  )
}