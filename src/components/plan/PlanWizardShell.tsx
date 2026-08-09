import { StageRail } from './StageRail'
import { TripSetupDialog } from './TripSetupDialog'
import { PlanOverview } from './PlanOverview'
import { PlanWizardStageView } from './PlanWizardStageView'
import type { SaveState } from './planWizard.hooks'
import { ISO_DATE_LENGTH } from './planWizard.helpers'
import type { PlanData, PlanMeta, PlanView, Stage, StageBodyProps } from './types'
import type { Trip } from '../../types'

function PlanWizardContent({
  view, stages, totalDone, totalAll, jumpTo, plan, savedPlan, isOwner, onStatusChange,
  activeStage, stageIdx, saveState, setStageIdx, StageBody, canEdit, onChange, onProgress, onEditTrip,
}: {
  view: PlanView
  stages: Stage[]
  totalDone: number
  totalAll: number
  jumpTo: (id: string) => void
  plan: PlanData
  savedPlan: Trip
  isOwner: boolean
  onStatusChange: (newStatus: string) => void
  activeStage: Stage
  stageIdx: number
  saveState: SaveState
  setStageIdx: (updater: (i: number) => number) => void
  StageBody: React.ComponentType<StageBodyProps>
  canEdit: boolean
  onChange: (patch: Partial<PlanData>) => void
  onProgress: (done: number, total: number) => void
  onEditTrip: () => void
}) {
  if (view === 'overview') {
    return (
      <PlanOverview
        stages={stages}
        totalDone={totalDone}
        totalAll={totalAll}
        onJump={jumpTo}
        plan={plan}
        tripStatus={savedPlan.status}
        isOwner={isOwner}
        onStatusChange={onStatusChange}
      />
    )
  }
  return (
    <PlanWizardStageView
      activeStage={activeStage}
      stageIdx={stageIdx}
      stagesLength={stages.length}
      saveState={saveState}
      jumpTo={jumpTo}
      setStageIdx={setStageIdx}
      tripStatus={savedPlan.status}
      isOwner={isOwner}
      onStatusChange={onStatusChange}
      StageBody={StageBody}
      plan={plan}
      onChange={onChange}
      onProgress={onProgress}
      trip={savedPlan}
      canEdit={canEdit}
      onEditTrip={onEditTrip}
    />
  )
}

interface PlanWizardShellProps {
  stages: Stage[]
  meta: PlanMeta
  stageIdx: number
  view: PlanView
  totalDone: number
  totalAll: number
  setView: (v: PlanView) => void
  setStageIdx: (updater: (i: number) => number) => void
  showEditDetails: boolean
  setShowEditDetails: (v: boolean) => void
  planId: string
  savedPlan: Trip
  jumpTo: (id: string) => void
  plan: PlanData
  isOwner: boolean
  canEdit: boolean
  onStatusChange: (newStatus: string) => void
  activeStage: Stage
  StageBody: React.ComponentType<StageBodyProps>
  saveState: SaveState
  onChange: (patch: Partial<PlanData>) => void
  onProgress: (done: number, total: number) => void
}

export function PlanWizardShell({
  stages, meta, stageIdx, view, totalDone, totalAll,
  setView, setStageIdx, showEditDetails, setShowEditDetails,
  planId, savedPlan, jumpTo, plan, isOwner, canEdit, onStatusChange,
  activeStage, StageBody, saveState, onChange, onProgress,
}: PlanWizardShellProps) {
  return (
    <div className="flex h-full overflow-hidden w-full">
      <StageRail
        stages={stages}
        trip={meta}
        activeStageIdx={stageIdx}
        view={view}
        totalDone={totalDone}
        totalAll={totalAll}
        onSelectStage={(i) => { setView('stage'); setStageIdx(() => i) }}
        onSelectOverview={() => setView('overview')}
        onEditDetails={() => setShowEditDetails(true)}
      />
      {showEditDetails && (
        <TripSetupDialog
          tripId={planId}
          onClose={() => setShowEditDetails(false)}
          initialTitle={savedPlan.title}
          initialLocation={savedPlan.location}
          initialStartDate={savedPlan.startDate?.slice(0, ISO_DATE_LENGTH)}
          initialEndDate={savedPlan.endDate?.slice(0, ISO_DATE_LENGTH)}
        />
      )}

      <PlanWizardContent
        view={view}
        stages={stages}
        totalDone={totalDone}
        totalAll={totalAll}
        jumpTo={jumpTo}
        plan={plan}
        savedPlan={savedPlan}
        isOwner={isOwner}
        onStatusChange={onStatusChange}
        activeStage={activeStage}
        stageIdx={stageIdx}
        saveState={saveState}
        setStageIdx={setStageIdx}
        StageBody={StageBody}
        canEdit={canEdit}
        onChange={onChange}
        onProgress={onProgress}
        onEditTrip={() => setShowEditDetails(true)}
      />
    </div>
  )
}
