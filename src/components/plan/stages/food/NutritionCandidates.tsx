import { IconX } from '../../../icons'
import { ozToDisplay } from './dayMealDialog.helpers'
import type { WeightUnit } from './dayMealDialog.helpers'
import type { MacroResult } from '../../../../lib/food'

type NutritionCandidatesProps = {
  candidates: MacroResult[]
  weightUnit: WeightUnit
  onSelect: (c: MacroResult) => void
  onDismiss: () => void
}

export function NutritionCandidates({ candidates, weightUnit, onSelect, onDismiss }: NutritionCandidatesProps) {
  if (candidates.length === 0) return null

  return (
    <div className="rounded border border-amber-border overflow-hidden">
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-amber-dim border-b border-amber-border">
        <span className="font-mono text-label tracking-[0.12em] uppercase text-amber">Select a result</span>
        <button type="button" onClick={onDismiss} className="text-amber hover:text-text transition-colors cursor-pointer">
          <IconX size={11} />
        </button>
      </div>
      {candidates.map((c, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(c)}
          className="w-full text-left px-2.5 py-2 border-t border-border first:border-0 hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <div className="font-mono text-fine text-text truncate">{c.note}</div>
          <div className="font-mono text-label text-text-dim mt-0.5">
            {c.kcal} kcal · {c.proteinG}P · {c.fatG}F · {c.carbsG}C · {ozToDisplay(c.weightOz, weightUnit) || '—'} {weightUnit}
          </div>
        </button>
      ))}
    </div>
  )
}
