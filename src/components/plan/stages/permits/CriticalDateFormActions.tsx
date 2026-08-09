import { IconCheck } from '../../../icons'

type CriticalDateFormActionsProps = {
  onAdd: () => void
  onClose: () => void
  disabled: boolean
}

export function CriticalDateFormActions({ onAdd, onClose, disabled }: CriticalDateFormActionsProps) {
  return (
    <div className="flex items-center gap-2.5 pt-0.5">
      <button
        onClick={onAdd}
        disabled={disabled}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-pine-border text-pine bg-pine-dim font-heading text-caption font-bold tracking-[0.08em] uppercase disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:brightness-95 transition-all"
      >
        <IconCheck size={9} /> Add
      </button>
      <button
        onClick={onClose}
        className="font-mono text-label text-text-dim hover:text-text transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        Cancel
      </button>
    </div>
  )
}
