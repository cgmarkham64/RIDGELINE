import { ProgressBar } from '../../ProgressBar'
import { CheckItem } from '../../CheckItem'

const CHECKLIST_TOTAL = 3
const PERCENT_MULTIPLIER = 100

type PermitsChecklistCardProps = {
  permitFree: boolean
  item1: boolean
  item2: boolean
  item3: boolean
  doneCount: number
  progress: number
  canEdit: boolean
  onUnmarkPermitFree: () => void
  onTogglePartyConfirmed: () => void
  onToggleBackupPlanned: () => void
}

export function PermitsChecklistCard({
  permitFree, item1, item2, item3, doneCount, progress, canEdit,
  onUnmarkPermitFree, onTogglePartyConfirmed, onToggleBackupPlanned,
}: PermitsChecklistCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
      {permitFree ? (
        <>
          <CheckItem text="Route reviewed for permits" done />
          <CheckItem text="Confirmed — no permits required" done onToggle={canEdit ? onUnmarkPermitFree : undefined} />
        </>
      ) : (
        <>
          <CheckItem text="At least one permit added"  done={item1} />
          <CheckItem text="Party size confirmed"       done={item2} onToggle={canEdit ? onTogglePartyConfirmed : undefined} />
          <CheckItem text="Walk-up backup planned"     done={item3} onToggle={canEdit ? onToggleBackupPlanned : undefined} />
        </>
      )}
      <div className="h-px bg-border my-3" />
      <ProgressBar value={permitFree ? PERCENT_MULTIPLIER : progress} tone={permitFree ? 'pine' : 'amber'} />
      <div className="font-mono text-label text-text-dim text-center mt-1.5">
        {permitFree ? '2 of 2 · permit-free' : `${doneCount} of ${CHECKLIST_TOTAL}`}
      </div>
    </div>
  )
}
