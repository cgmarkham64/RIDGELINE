type CopyToDaysPickerProps = {
  totalDays: number
  dayIndex: number
  copyTargets: Set<number>
  setCopyTargets: (targets: Set<number>) => void
  onToggleTarget: (i: number) => void
  onApply: () => void
  onCancel: () => void
}

function DayChips({ otherDays, copyTargets, onToggleTarget }: { otherDays: number[]; copyTargets: Set<number>; onToggleTarget: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {otherDays.map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onToggleTarget(i)}
          className={`font-mono text-label px-2 py-0.5 rounded border transition-colors cursor-pointer ${
            copyTargets.has(i)
              ? 'border-pine-border bg-pine-dim text-pine'
              : 'border-border text-text-dim hover:border-border-mid hover:text-text-mid'
          }`}
        >
          D{i + 1}
        </button>
      ))}
    </div>
  )
}

function PickerActions({ copyTargets, onApply, onCancel }: { copyTargets: Set<number>; onApply: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onApply}
        disabled={copyTargets.size === 0}
        className="inline-flex items-center font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Copy to {copyTargets.size > 0 ? `${copyTargets.size} day${copyTargets.size > 1 ? 's' : ''}` : 'days'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-dim hover:border-border-mid hover:text-text-mid transition-colors cursor-pointer"
      >
        Cancel
      </button>
    </div>
  )
}

export function CopyToDaysPicker({ totalDays, dayIndex, copyTargets, setCopyTargets, onToggleTarget, onApply, onCancel }: CopyToDaysPickerProps) {
  const otherDays = Array.from({ length: totalDays }, (_, i) => i).filter(i => i !== dayIndex)

  return (
    <div className="border-t border-border px-5 py-3 bg-surface-2 shrink-0">
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Copy to days</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setCopyTargets(new Set(otherDays))} className="font-mono text-label text-text-dim hover:text-text transition-colors cursor-pointer">
            all
          </button>
          <span className="font-mono text-label text-text-dim">·</span>
          <button type="button" onClick={() => setCopyTargets(new Set())} className="font-mono text-label text-text-dim hover:text-text transition-colors cursor-pointer">
            none
          </button>
        </div>
      </div>
      <DayChips otherDays={otherDays} copyTargets={copyTargets} onToggleTarget={onToggleTarget} />
      <PickerActions copyTargets={copyTargets} onApply={onApply} onCancel={onCancel} />
    </div>
  )
}
