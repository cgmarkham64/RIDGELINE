import { useState } from 'react'
import type { StageId } from './types'
import { createStages } from './constants'
import { PlanWizardShell } from './PlanWizardShell'
import { RouteStage } from './stages/route/RouteStage'
import { WeatherStage } from './stages/weather/WeatherStage'
import { PermitsStage } from './stages/permits/PermitsStage'
import { FoodStage } from './stages/food/FoodStage'
import { GearStage } from './stages/gear/GearStage'
import { DepartStage } from './stages/depart/DepartStage'
import { JournalStage } from './stages/journal/JournalStage'
import { MoonLoader } from '../ui/MoonLoader'
import { ConfirmCompleteModal } from './ConfirmCompleteModal'
import { usePlan, useUpdatePlan } from '../../hooks/usePlans'
import { useJournalDays } from '../../hooks/useJournalDays'
import { useAuthStore } from '../../store/auth'
import { PlanAccessError } from './PlanAccessError'
import { buildMeta, planFrom, deriveAccess, isForbiddenError } from './planWizard.helpers'
import { useAutosave, useStageProgress, useCompletionGate } from './planWizard.hooks'
import type { StageBodyProps } from './types'

export type { SaveState } from './planWizard.hooks'

const BASE_STAGES = createStages()

const STAGE_COMPONENTS: Record<StageId, React.ComponentType<StageBodyProps>> = {
  route:   RouteStage,
  weather: WeatherStage,
  permits: PermitsStage,
  food:    FoodStage,
  gear:    GearStage,
  depart:  DepartStage,
  journal: JournalStage,
}

export function PlanWizard({ planId, initialStage }: { planId: string; initialStage?: number }) {
  const { data: savedPlan, isLoading, isError, error } = usePlan(planId)
  const { mutateAsync: doUpdate } = useUpdatePlan()
  const { data: journalEntries = [] } = useJournalDays(planId)
  const userId = useAuthStore((s) => s.user?.id)

  const [showEditDetails, setShowEditDetails] = useState(false)

  const plan = planFrom(savedPlan)
  const { saveState, handleChange } = useAutosave(planId, savedPlan, doUpdate)
  const { view, setView, stageIdx, setStageIdx, stages, totalDone, totalAll, handleProgress, jumpTo } =
    useStageProgress(BASE_STAGES, plan, initialStage)
  const { confirmComplete, setConfirmComplete, handleStatusChange } =
    useCompletionGate(planId, doUpdate, journalEntries.length)

  if (isError) {
    return <PlanAccessError is403={isForbiddenError(error)} />
  }

  if (isLoading || !savedPlan) {
    return (
      <div className="flex h-full items-center justify-center w-full">
        <MoonLoader />
      </div>
    )
  }

  const meta = buildMeta(savedPlan)
  const { isOwner, canEdit } = deriveAccess(savedPlan, userId)

  const activeStage = stages[stageIdx]
  if (!activeStage) return null
  const StageBody = STAGE_COMPONENTS[activeStage.id]

  return (
    <>
      <PlanWizardShell
        stages={stages}
        meta={meta}
        stageIdx={stageIdx}
        view={view}
        totalDone={totalDone}
        totalAll={totalAll}
        setView={setView}
        setStageIdx={setStageIdx}
        showEditDetails={showEditDetails}
        setShowEditDetails={setShowEditDetails}
        planId={planId}
        savedPlan={savedPlan}
        jumpTo={jumpTo}
        plan={plan}
        isOwner={isOwner}
        canEdit={canEdit}
        onStatusChange={handleStatusChange}
        activeStage={activeStage}
        StageBody={StageBody}
        saveState={saveState}
        onChange={handleChange}
        onProgress={handleProgress}
      />

      {confirmComplete && (
        <ConfirmCompleteModal
          onAddEntries={() => { setConfirmComplete(false); jumpTo('journal') }}
          onCompleteAnyway={() => { doUpdate({ id: planId, body: { status: 'complete' } }); setConfirmComplete(false) }}
        />
      )}
    </>
  )
}
