import { PartnersCard } from './PartnersCard'
import { CriticalDatesCard } from './CriticalDatesCard'
import { PermitsChecklistCard } from './PermitsChecklistCard'
import type { Trip } from '../../../../types'
import type { PlanCriticalDate } from '../../types'

type PermitsRightRailProps = {
  trip: Trip | undefined
  canEdit: boolean
  permitFree: boolean
  item1: boolean
  item2: boolean
  item3: boolean
  doneCount: number
  progress: number
  onUnmarkPermitFree: () => void
  onTogglePartyConfirmed: () => void
  onToggleBackupPlanned: () => void
  partyConfirmed: boolean
  onConfirmParty: () => void
  criticalDates: PlanCriticalDate[]
  scanDates: PlanCriticalDate[]
  onAddCriticalDate: (date: PlanCriticalDate) => void
  onRemoveCriticalDate: (id: string) => void
}

export function PermitsRightRail({
  trip, canEdit, permitFree, item1, item2, item3, doneCount, progress,
  onUnmarkPermitFree, onTogglePartyConfirmed, onToggleBackupPlanned,
  partyConfirmed, onConfirmParty, criticalDates, scanDates, onAddCriticalDate, onRemoveCriticalDate,
}: PermitsRightRailProps) {
  return (
    <aside className="flex flex-col gap-3.5">
      <PermitsChecklistCard
        permitFree={permitFree} item1={item1} item2={item2} item3={item3}
        doneCount={doneCount} progress={progress} canEdit={canEdit}
        onUnmarkPermitFree={onUnmarkPermitFree}
        onTogglePartyConfirmed={onTogglePartyConfirmed}
        onToggleBackupPlanned={onToggleBackupPlanned}
      />

      <PartnersCard
        trip={trip}
        canEdit={canEdit}
        onInviteSent={() => {}}
        onNoPartners={onConfirmParty}
        partyConfirmed={partyConfirmed}
        onConfirmParty={onConfirmParty}
      />

      <CriticalDatesCard
        manualDates={criticalDates}
        scanDates={scanDates}
        canEdit={canEdit}
        onAdd={onAddCriticalDate}
        onRemove={onRemoveCriticalDate}
      />
    </aside>
  )
}
