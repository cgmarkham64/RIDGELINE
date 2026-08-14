import { G_PER_OZ } from './dayMealDialog.helpers'
import type { WeightUnit } from './dayMealDialog.helpers'

type DayTotalsBarProps = {
  dayKcal: number
  dayProtein: number
  dayFat: number
  dayCarbs: number
  dayWeightOz: number
  weightUnit: WeightUnit
  totalDays: number
  showCopyPicker: boolean
  onToggleCopyPicker: () => void
  onClose: () => void
}

function weightDisplay(dayWeightOz: number, weightUnit: WeightUnit): string | null {
  if (dayWeightOz <= 0) return null
  return weightUnit === 'g' ? `${Math.round(dayWeightOz * G_PER_OZ)} g` : `${dayWeightOz.toFixed(1)} oz`
}

export function DayTotalsBar({
  dayKcal, dayProtein, dayFat, dayCarbs, dayWeightOz, weightUnit, totalDays, showCopyPicker, onToggleCopyPicker, onClose,
}: DayTotalsBarProps) {
  const hasMacros = dayProtein > 0 || dayFat > 0 || dayCarbs > 0
  const dayWeightDisplay = weightDisplay(dayWeightOz, weightUnit)

  return (
    <div className="px-5 py-3 flex items-center gap-4 shrink-0 flex-wrap">
      <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Day totals</span>
      <span className="font-heading text-body-sm font-extrabold text-amber">
        {dayKcal > 0 ? dayKcal.toLocaleString() : '—'} kcal
      </span>
      {hasMacros && (
        <span className="font-mono text-fine text-text-mid">
          {dayProtein}P · {dayFat}F · {dayCarbs}C
        </span>
      )}
      {dayWeightDisplay && <span className="font-mono text-fine text-text-mid">{dayWeightDisplay}</span>}
      {totalDays > 1 && (
        <button
          type="button"
          onClick={onToggleCopyPicker}
          className={`font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border transition-colors cursor-pointer ${
            showCopyPicker
              ? 'border-pine-border bg-pine-dim text-pine'
              : 'border-border text-text-dim hover:border-border-mid hover:text-text-mid'
          }`}
        >
          Copy to days…
        </button>
      )}
      <button type="button" onClick={onClose} className="ml-auto btn btn-ghost">
        Done
      </button>
    </div>
  )
}
