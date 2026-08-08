import { IconAlertTriangle } from '../../../icons'
import { MEAL_SLOTS, itemSummary, warningTooltip, kcalCls, parseTarget, rowKcalAndOz, TARGET_THRESHOLD } from './foodStage.helpers'
import type { MealRow, RowTargets, RowWarning } from './foodStage.types'

type MealGridRowProps = {
  row: MealRow
  isLast: boolean
  effectiveTargets: RowTargets
  rowWarnings: RowWarning[]
  isTough: boolean
  isSuggestedKcal: boolean
  onClick: () => void
}

function kcalColorFor(rowKcal: number, rowTargetKcal: number): string {
  if (rowKcal === 0) return 'text-text-dim'
  if (rowTargetKcal <= 0) return kcalCls(rowKcal)
  return Math.abs((rowKcal - rowTargetKcal) / rowTargetKcal) <= TARGET_THRESHOLD ? 'text-pine' : 'text-amber'
}

function buildTooltip(hasWarning: boolean, rowWarnings: RowWarning[], isTough: boolean, isSuggestedKcal: boolean, rowTargetKcal: number): string | undefined {
  return [
    hasWarning ? warningTooltip(rowWarnings) : null,
    isTough ? 'Tough day' : null,
    isSuggestedKcal ? `target auto-suggested from route (${rowTargetKcal.toLocaleString()} kcal)` : null,
  ].filter(Boolean).join(' · ') || undefined
}

export function MealGridRow({ row, isLast, effectiveTargets, rowWarnings, isTough, isSuggestedKcal, onClick }: MealGridRowProps) {
  const { kcal: rowKcal, oz: rowOz } = rowKcalAndOz(MEAL_SLOTS.flatMap(s => row.items[s]))
  const hasWarning = rowWarnings.length > 0
  const rowTargetKcal = parseTarget(effectiveTargets.calories)
  const kcalColor = kcalColorFor(rowKcal, rowTargetKcal)
  const tooltip = buildTooltip(hasWarning, rowWarnings, isTough, isSuggestedKcal, rowTargetKcal)

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={`grid items-center px-4 gap-2 grid-cols-[60px_1fr_1fr_1fr_1fr_56px_64px] w-full text-left hover:bg-surface-2 transition-colors cursor-pointer ${isLast ? '' : 'border-b border-border'}`}
    >
      <div className="flex items-center gap-1.5 py-2.5">
        <IconAlertTriangle size={16} className={hasWarning ? 'text-amber' : 'invisible'} />
        <span className={`font-mono text-label font-bold text-amber text-center flex-1 py-0.5 bg-amber-dim rounded border ${isTough ? 'border-amber' : 'border-amber-border'}`}>
          D{row.n}
        </span>
      </div>
      {MEAL_SLOTS.map(slot => {
        const summary = itemSummary(row.items[slot])
        return (
          <span key={slot} className={`text-fine truncate leading-snug py-2.5 ${summary ? 'text-text' : 'text-text-dim'}`}>
            {summary || '—'}
          </span>
        )
      })}
      <span className={`font-mono text-fine text-right py-2.5 ${rowOz ? 'text-text-mid' : 'text-text-dim'}`}>
        {rowOz ? rowOz.toFixed(1) : '—'}
      </span>
      <span className={`font-mono text-fine text-right py-2.5 ${kcalColor}`}>
        {rowKcal ? rowKcal.toLocaleString() : '—'}
      </span>
    </button>
  )
}
