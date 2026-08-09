import { ProgressBar } from '../../ProgressBar'
import type { ChecklistItem } from './departStage.constants'
import { TakeItItem } from './TakeItItem'

export function TakeItWithYouCard({ checklist, onToggle, doneCount, progress }: {
  checklist: ChecklistItem[]
  onToggle: (i: number) => void
  doneCount: number
  progress: number
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Take it with you</div>
      {checklist.map((item, i) => (
        <TakeItItem key={item.text} item={item} onToggle={() => onToggle(i)} />
      ))}
      <div className="h-px bg-border my-3" />
      <ProgressBar value={progress} tone="pine" />
      <div className="font-mono text-label text-text-dim text-center mt-1.5">{doneCount} of {checklist.length}</div>
    </div>
  )
}
