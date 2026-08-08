import { OZ_PER_LB, MEAL_SLOTS, rowKcalAndOz } from './foodStage.helpers'
import type { MealRow } from './foodStage.types'

type SegmentStripProps = {
  label: string
  fromDay: number
  toDay: number
  meals: MealRow[]
}

export function SegmentStrip({ label, fromDay, toDay, meals }: SegmentStripProps) {
  if (toDay < fromDay) return null
  const segMeals = meals.filter(m => m.n >= fromDay && m.n <= toDay)
  const { kcal, oz } = rowKcalAndOz(segMeals.flatMap(m => MEAL_SLOTS.flatMap(s => m.items[s])))
  const days = toDay - fromDay + 1
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded bg-surface-2 border border-border">
      <span className="font-mono text-label tracking-[0.1em] uppercase font-bold text-amber shrink-0">{label}</span>
      <span className="font-mono text-label text-text-dim shrink-0">D{fromDay}–D{toDay}</span>
      <span className="font-mono text-label text-text-dim shrink-0">· {days} {days === 1 ? 'day' : 'days'}</span>
      <span className="flex-1" />
      {kcal > 0
        ? <span className="font-mono text-label text-text-mid shrink-0">{kcal.toLocaleString()} kcal · {(oz / OZ_PER_LB).toFixed(1)} lb</span>
        : <span className="font-mono text-label text-text-dim italic shrink-0">no meals planned</span>
      }
    </div>
  )
}
