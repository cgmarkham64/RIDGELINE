import { useState } from 'react'
import type { PlanView, StageId, PlanData } from './types'
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
import type { StageBodyProps } from './types'

// Mock trip — replace with real data when backend is wired
const MOCK_TRIP = {
  title: 'Sierra High Route',
  location: 'Inyo NF, CA',
  dateRange: 'Aug 12 – Aug 19, 2026',
  miles: 78,
  elev: '+18,400',
  days: 8,
  weight: '34 lb',
}

const STAGE_COMPONENTS: Record<StageId, React.ComponentType<StageBodyProps>> = {
  route:   RouteStage,
  days:    DaysStage,
  permits: PermitsStage,
  food:    FoodStage,
  gear:    GearStage,
  depart:  DepartStage,
}

export function PlanWizard({ plan }: { plan?: PlanData }) {
  const [view, setView] = useState<PlanView>('overview')
  const [stageIdx, setStageIdx] = useState(0)

  const [stages] = useState(createStages)
  const totalDone = stages.reduce((a, s) => a + s.done, 0)
  const totalAll = stages.reduce((a, s) => a + s.total, 0)

  function jumpTo(id: string) {
    if (id === '__overview__') { setView('overview'); return }
    const i = stages.findIndex(s => s.id === id)
    if (i >= 0) { setView('stage'); setStageIdx(i) }
  }

  const activeStage = stages[stageIdx]
  if (!activeStage) return null
  const StageBody = STAGE_COMPONENTS[activeStage.id]

  return (
    <div className="flex h-full overflow-hidden w-full">
      <StageRail
        stages={stages}
        trip={MOCK_TRIP}
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
            onJump={jumpTo}
            onPrev={() => setStageIdx(i => Math.max(0, i - 1))}
            onNext={() => setStageIdx(i => Math.min(stages.length - 1, i + 1))}
          />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <StageBody onJump={jumpTo} plan={plan} />
          </div>
        </main>
      )}
    </div>
  )
}