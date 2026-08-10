import type { StageBodyProps } from '../../types'
import { TargetsCard } from './TargetsCard'
import { MealGrid } from './MealGrid'
import { ResupplySection } from './ResupplySection'
import { BearCanNeedCard } from './BearCanNeedCard'
import { FoodRightRail } from './FoodRightRail'
import { FoodDayDialog } from './FoodDayDialog'
import {
  useFoodState, useFoodPersist, useRemoveResupplyWaypoint, useFoodChecklist,
  useFoodSuggestions, useFoodTotals, computeHeadsUp,
} from './foodStage.hooks'

export function FoodStage({ plan, onChange, onProgress, trip, onJump }: StageBodyProps) {
  const s = useFoodState(plan, trip)
  useFoodPersist(onChange, {
    meals: s.meals, mealsLocked: s.mealsLocked, resupplyStops: s.resupplyStops, bearCanNeed: s.bearCanNeed, targets: s.targets,
  })
  const handleRemoveWaypoint = useRemoveResupplyWaypoint(trip)

  const resupplyWaypoints = (trip?.waypoints ?? []).filter(w => w.type === 'resupply')
  const checklist = useFoodChecklist(s.targets, resupplyWaypoints, s.resupplyStops, s.bearCanNeed, s.mealsLocked, onProgress)
  const { toughDays, toughDayNumbers, suggestedKcalByDay, suggestedAvgKcal } = useFoodSuggestions(plan, s.macroDefaults)
  const { totals } = useFoodTotals(s.meals)
  const headsUp = computeHeadsUp(plan, toughDays)

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-[18px]">
          <TargetsCard
            targets={s.targets}
            suggestedAvgKcal={suggestedAvgKcal}
            onTargetChange={(field, value) => s.setTargets(prev => ({ ...prev, [field]: value }))}
          />
          <MealGrid
            meals={s.meals}
            targets={s.targets}
            suggestedKcalByDay={suggestedKcalByDay}
            toughDayNumbers={toughDayNumbers}
            onDayClick={s.setActiveDayIdx}
          />
          <ResupplySection
            waypoints={resupplyWaypoints}
            stops={s.resupplyStops}
            meals={s.meals}
            tripTitle={trip?.title ?? 'Untitled Trip'}
            onStopsChange={s.setResupplyStops}
            onRemoveWaypoint={handleRemoveWaypoint}
            onAddStop={() => onJump('route')}
          />
          <BearCanNeedCard need={s.bearCanNeed} onChange={s.setBearCanNeed} onJump={onJump} />
        </div>

        <FoodRightRail
          checklist={checklist}
          onToggleMealsLocked={() => s.setMealsLocked(v => !v)}
          totals={totals}
          headsUp={headsUp}
        />
      </div>

      <FoodDayDialog meals={s.meals} setMeals={s.setMeals} activeDayIdx={s.activeDayIdx} setActiveDayIdx={s.setActiveDayIdx} />
    </div>
  )
}
