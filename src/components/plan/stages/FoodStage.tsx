import type { StageBodyProps } from '../types'

export function FoodStage({ onJump }: StageBodyProps) {
  void onJump
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl">
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Coming next</div>
          <h2 className="font-heading text-[18px] font-bold text-text mb-2">Food Stage</h2>
          <p className="text-[13px] text-text-mid leading-relaxed">
            Daily targets card (kcal/day, protein, water, pack-out) with JumpChip to Days.
            Meal plan grid: rows × Breakfast / Lunch / Dinner / Snacks / kcal — kcal column color-coded
            (pine ≥ target, amber below). Resupply card with pickup details. Water plan and bear
            canister cards side by side (3-option picker with recommended state).
          </p>
        </div>
      </div>
    </div>
  )
}