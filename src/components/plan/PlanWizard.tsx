import { useState, useRef, useCallback, useEffect } from 'react'
import type { PlanView, StageId, PlanData, PlanMeta } from './types'
import { createStages } from './constants'
import { StageRail } from './StageRail'
import { StageHeader } from './StageHeader'
import { PlanOverview } from './PlanOverview'
import { RouteStage } from './stages/RouteStage'
import { DaysStage } from './stages/DaysStage'
import { PermitsStage } from './stages/PermitsStage'
import { FoodStage } from './stages/FoodStage'
import { GearStage } from './stages/GearStage'
import { DepartStage } from './stages/DepartStage'
import { MoonLoader } from '../ui/MoonLoader'
import { usePlan, useUpdatePlan } from '../../hooks/usePlans'
import type { StageBodyProps } from './types'

const EMPTY_META: PlanMeta = {
  title: 'New Plan',
  location: '—',
  dateRange: '—',
  miles: null,
  elev: '—',
  days: 0,
  weight: '—',
}

export type SaveState = 'saved' | 'saving' | 'unsaved'

const STAGE_COMPONENTS: Record<StageId, React.ComponentType<StageBodyProps>> = {
  route:   RouteStage,
  days:    DaysStage,
  permits: PermitsStage,
  food:    FoodStage,
  gear:    GearStage,
  depart:  DepartStage,
}

export function PlanWizard({ planId }: { planId: string }) {
  const { data: savedPlan, isLoading } = usePlan(planId)
  const { mutateAsync: doUpdate } = useUpdatePlan()

  const [view, setView]           = useState<PlanView>('overview')
  const [stageIdx, setStageIdx]   = useState(0)
  const [stages]                  = useState(createStages)
  const [saveState, setSaveState] = useState<SaveState>('saved')

  // Accumulates all stage patches for debounced saves.
  // Initialized from savedPlan once it arrives; only accessed inside the
  // handleChange callback (an event handler), never read during render.
  const stagesRef   = useRef<PlanData>({})
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const initialized = useRef(false)

  useEffect(() => {
    if (savedPlan && !initialized.current) {
      initialized.current = true
      stagesRef.current = (savedPlan.stages as PlanData) ?? {}
    }
  }, [savedPlan])

  const handleChange = useCallback((patch: Partial<PlanData>) => {
    stagesRef.current = { ...stagesRef.current, ...patch }
    setSaveState('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaveState('saving')
      doUpdate({ id: planId, body: { stages: stagesRef.current } })
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('unsaved'))
    }, 800)
  }, [planId, doUpdate])

  const totalDone = stages.reduce((a, s) => a + s.done, 0)
  const totalAll  = stages.reduce((a, s) => a + s.total, 0)

  function jumpTo(id: string) {
    if (id === '__overview__') { setView('overview'); return }
    const i = stages.findIndex(s => s.id === id)
    if (i >= 0) { setView('stage'); setStageIdx(i) }
  }

  if (isLoading || !savedPlan) {
    return (
      <div className="flex h-full items-center justify-center w-full">
        <MoonLoader />
      </div>
    )
  }

  // Read stages directly from savedPlan for the initial seed passed to each
  // stage's useState initializer. After that, stage state is self-contained.
  const plan = (savedPlan.stages as PlanData) ?? {}
  const meta = savedPlan.meta ?? EMPTY_META

  const activeStage = stages[stageIdx]
  if (!activeStage) return null
  const StageBody = STAGE_COMPONENTS[activeStage.id]

  return (
    <div className="flex h-full overflow-hidden w-full">
      <StageRail
        stages={stages}
        trip={meta}
        activeStageIdx={stageIdx}
        view={view}
        totalDone={totalDone}
        totalAll={totalAll}
        onSelectStage={(i) => { setView('stage'); setStageIdx(i) }}
        onSelectOverview={() => setView('overview')}
      />

      {view === 'overview' ? (
        <PlanOverview
          stages={stages}
          totalDone={totalDone}
          totalAll={totalAll}
          onJump={jumpTo}
          plan={plan}
        />
      ) : (
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <StageHeader
            stage={activeStage}
            stageIdx={stageIdx}
            saveState={saveState}
            onJump={jumpTo}
            onPrev={() => setStageIdx(i => Math.max(0, i - 1))}
            onNext={() => setStageIdx(i => Math.min(stages.length - 1, i + 1))}
          />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <StageBody onJump={jumpTo} plan={plan} onChange={handleChange} />
          </div>
        </main>
      )}
    </div>
  )
}