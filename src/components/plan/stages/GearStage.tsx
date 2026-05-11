import type { StageBodyProps } from '../types'

export function GearStage({ onJump }: StageBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl space-y-4">
        {/* Hold banner — visible even in stub */}
        <div className="bg-amber-dim border border-amber-border rounded-lg px-5 py-4 flex items-start gap-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-amber shrink-0 mt-0.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <div className="font-heading text-[13px] font-bold text-amber mb-1">Gear is locked</div>
            <p className="text-[12px] text-text-mid leading-relaxed">
              Bear-can size and resupply weight depend on confirmed permits. Gear unlocks when Permits
              resolves (est. Mar 24). You can pre-fill items now — the loadout becomes source of truth after unlock.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => onJump('permits')} className="font-heading text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1.5 rounded border border-amber-border text-amber bg-transparent hover:bg-amber-glow transition-colors cursor-pointer">
                Check Permits
              </button>
              <button onClick={() => onJump('food')} className="font-heading text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer">
                Confirm Food first
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Coming next</div>
          <h2 className="font-heading text-[18px] font-bold text-text mb-2">Gear Stage</h2>
          <p className="text-[13px] text-text-mid leading-relaxed">
            Loadout preview: category cards (Shelter / Kitchen / Worn) with checked/unchecked items
            and per-category weight totals. Right rail: items owned count, base/food/water/total pack
            weights for Day 1, unlock checklist. Stage is interactive even while locked.
          </p>
        </div>
      </div>
    </div>
  )
}
