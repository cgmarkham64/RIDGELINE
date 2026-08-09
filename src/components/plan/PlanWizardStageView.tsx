import { StageHeader } from './StageHeader'
import type { SaveState } from './planWizard.hooks'
import type { PlanData, Stage, StageBodyProps } from './types'
import type { Trip } from '../../types'

export function PlanWizardStageView({
  activeStage, stageIdx, stagesLength, saveState, jumpTo, setStageIdx,
  tripStatus, isOwner, onStatusChange, StageBody, plan, onChange, onProgress, trip, canEdit, onEditTrip,
}: {
  activeStage: Stage
  stageIdx: number
  stagesLength: number
  saveState: SaveState
  jumpTo: (id: string) => void
  setStageIdx: (updater: (i: number) => number) => void
  tripStatus?: string
  isOwner: boolean
  onStatusChange: (newStatus: string) => void
  StageBody: React.ComponentType<StageBodyProps>
  plan: PlanData
  onChange: (patch: Partial<PlanData>) => void
  onProgress: (done: number, total: number) => void
  trip: Trip
  canEdit: boolean
  onEditTrip: () => void
}) {
  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <StageHeader
        stage={activeStage}
        stageIdx={stageIdx}
        saveState={saveState}
        onJump={jumpTo}
        onPrev={() => setStageIdx(i => Math.max(0, i - 1))}
        onNext={() => setStageIdx(i => Math.min(stagesLength - 1, i + 1))}
        tripStatus={tripStatus}
        isOwner={isOwner}
        onStatusChange={onStatusChange}
      />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <StageBody
          onJump={jumpTo}
          plan={plan}
          onChange={onChange}
          onProgress={onProgress}
          tripStatus={tripStatus}
          trip={trip}
          canEdit={canEdit}
          onEditTrip={onEditTrip}
        />
      </div>
    </main>
  )
}
