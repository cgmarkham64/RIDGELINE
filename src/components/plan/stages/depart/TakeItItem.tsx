import { IconCheck, IconCircle } from '../../../icons'
import type { ChecklistItem } from './departStage.constants'

export function TakeItItem({ item, onToggle }: { item: ChecklistItem; onToggle: () => void }) {
  const indicator = item.done ? (
    <span className="w-3.5 h-3.5 rounded-full bg-pine-dim border border-pine-border text-pine flex items-center justify-center shrink-0">
      <IconCheck size={8} />
    </span>
  ) : item.pending ? (
    <span className="w-3.5 h-3.5 rounded-full bg-amber-dim border border-amber-border text-transparent flex items-center justify-center shrink-0">
      <IconCircle size={6} />
    </span>
  ) : (
    <span className="w-3.5 h-3.5 rounded-full border border-border flex items-center justify-center shrink-0 text-transparent">
      <IconCircle size={6} />
    </span>
  )

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2.5 py-1.5 w-full text-left cursor-pointer"
    >
      {indicator}
      <span className={`text-body-sm ${item.done ? 'text-text' : 'text-text-dim'}`}>{item.text}</span>
    </button>
  )
}
