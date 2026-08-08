import { IconAlertTriangle } from '../../../icons'
import { parseTarget, computeRowWarnings, PERCENT_MULTIPLIER, TARGET_THRESHOLD } from './foodStage.helpers'
import { MealGridRow } from './MealGridRow'
import type { MealRow, RowTargets } from './foodStage.types'

type MealGridProps = {
  meals: MealRow[]
  targets: RowTargets
  suggestedKcalByDay: Map<number, number>
  toughDayNumbers: Set<number>
  onDayClick: (idx: number) => void
}

function computeEffectiveTargets(meals: MealRow[], targets: RowTargets, suggestedKcalByDay: Map<number, number>) {
  const manualKcalSet = parseTarget(targets.calories) > 0
  // Days without a manual calorie target fall back to the route-derived suggestion for that day.
  const effectiveTargets: RowTargets[] = meals.map(m => {
    if (manualKcalSet) return targets
    const suggested = suggestedKcalByDay.get(m.n)
    return suggested ? { ...targets, calories: String(suggested) } : targets
  })
  return { manualKcalSet, effectiveTargets }
}

function EmptyState() {
  return (
    <div className="px-4 py-10 text-center">
      <p className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-2">No meals planned yet</p>
      <p className="text-body-sm text-text-mid">Set trip dates in the header — one row per day will be created automatically.</p>
    </div>
  )
}

function OffTargetBanner({ offTargetDays, meals }: { offTargetDays: number[]; meals: MealRow[] }) {
  if (offTargetDays.length === 0) return null
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-dim border-b border-amber-border">
      <IconAlertTriangle size={16} />
      <p className="font-mono text-label text-amber">
        {offTargetDays.map(i => `D${meals[i].n}`).join(' · ')}{' '}
        {offTargetDays.length === 1 ? 'is' : 'are'} more than {TARGET_THRESHOLD * PERCENT_MULTIPLIER}% off target
      </p>
    </div>
  )
}

export function MealGrid({ meals, targets, suggestedKcalByDay, toughDayNumbers, onDayClick }: MealGridProps) {
  const { manualKcalSet, effectiveTargets } = computeEffectiveTargets(meals, targets, suggestedKcalByDay)
  const allRowWarnings = meals.map((m, i) => computeRowWarnings(m, effectiveTargets[i]))
  const offTargetDays  = allRowWarnings.reduce<number[]>((acc, w, i) => w.length > 0 ? [...acc, i] : acc, [])

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Meal plan</span>
        <span className="font-mono text-label text-text-dim">
          {meals.length} {meals.length === 1 ? 'day' : 'days'} · click any row to edit
        </span>
      </div>

      <OffTargetBanner offTargetDays={offTargetDays} meals={meals} />

      <div className="grid px-4 py-2 bg-surface-2 border-b border-border font-mono text-label tracking-[0.12em] uppercase text-text-dim grid-cols-[60px_1fr_1fr_1fr_1fr_56px_64px]">
        <span>Day</span>
        <span>Breakfast</span>
        <span>Lunch</span>
        <span>Dinner</span>
        <span>Snacks</span>
        <span className="text-right">oz</span>
        <span className="text-right">kcal</span>
      </div>

      {meals.length === 0 ? <EmptyState /> : meals.map((m, rowIdx) => (
        <MealGridRow
          key={m.n}
          row={m}
          isLast={rowIdx === meals.length - 1}
          effectiveTargets={effectiveTargets[rowIdx]}
          rowWarnings={allRowWarnings[rowIdx]}
          isTough={toughDayNumbers.has(m.n)}
          isSuggestedKcal={!manualKcalSet && suggestedKcalByDay.has(m.n)}
          onClick={() => onDayClick(rowIdx)}
        />
      ))}
    </div>
  )
}
