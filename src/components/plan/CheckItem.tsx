import { IconCheck } from '../icons'

export function CheckItem({ text, done = false, onToggle }: {
  text: string
  done?: boolean
  onToggle?: () => void
}) {
  const indicator = (
    <span className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${done ? 'bg-pine-dim border-pine-border text-pine' : 'border-border text-text-dim'}`}>
      {done && <IconCheck size={9} strokeWidth={2.8} />}
    </span>
  )
  const label = <span className={`text-[12px] ${done ? 'text-text' : 'text-text-dim'}`}>{text}</span>

  if (onToggle) {
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