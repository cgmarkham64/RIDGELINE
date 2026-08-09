import { useState } from 'react'
import type { Stage, PlanData } from './types'
import { BackToPlanningDialog } from './BackToPlanningDialog'
import { PlanOverviewHeader } from './PlanOverviewHeader'
import { PlanOverviewStageGrid } from './PlanOverviewStageGrid'
import { PlanOverviewCriticalPath } from './PlanOverviewCriticalPath'

interface PlanOverviewProps {
  stages: Stage[]
  totalDone: number
  totalAll: number
  onJump: (id: string) => void
  plan?: PlanData
  tripStatus?: string
  isOwner?: boolean
  onStatusChange?: (newStatus: string) => void
}

export function PlanOverview({ stages, totalDone, totalAll, onJump, plan, tripStatus, isOwner, onStatusChange }: PlanOverviewProps) {
  const [confirmBack, setConfirmBack] = useState(false)

  return (
    <>
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <PlanOverviewHeader
          totalDone={totalDone}
          totalAll={totalAll}
          tripStatus={tripStatus}
          isOwner={isOwner}
          onStatusChange={onStatusChange}
          onBackClick={() => setConfirmBack(true)}
        />

        <div className="px-8 py-6 pb-20">
          <PlanOverviewStageGrid stages={stages} onJump={onJump} />
          <PlanOverviewCriticalPath plan={plan} onJump={onJump} />
        </div>
      </main>

      {confirmBack && (
        <BackToPlanningDialog
          onCancel={() => setConfirmBack(false)}
          onConfirm={() => { onStatusChange?.('planning'); setConfirmBack(false) }}
        />
      )}
    </>
  )
}
