import { ProgressBar } from '../../ProgressBar'
import { CheckItem } from '../../CheckItem'
import type { CheckRow } from './routeStage.types'

const PERCENT_MULTIPLIER = 100

type RouteChecklistPanelProps = {
  checklist: CheckRow[]
  doneCount: number
  canEdit: boolean
  onToggleCheck: (i: number) => void
}

export function RouteChecklistPanel({ checklist, doneCount, canEdit, onToggleCheck }: RouteChecklistPanelProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
      {checklist.map((c, i) => (
        <CheckItem key={c.text} text={c.text} done={c.done} onToggle={canEdit && !c.readonly ? () => onToggleCheck(i) : undefined} />
      ))}
      <div className="h-px bg-border my-3" />
      <ProgressBar
        value={checklist.length > 0 ? (doneCount / checklist.length) * PERCENT_MULTIPLIER : 0}
        tone={doneCount === checklist.length && checklist.length > 0 ? 'pine' : 'amber'}
      />
      <div className="font-mono text-label text-text-dim text-center mt-1.5">{doneCount} of {checklist.length}</div>
    </div>
  )
}
