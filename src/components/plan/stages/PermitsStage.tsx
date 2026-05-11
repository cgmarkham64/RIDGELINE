import type { StageBodyProps } from '../types'

export function PermitsStage({ onJump }: StageBodyProps) {
  void onJump
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl">
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Coming next</div>
          <h2 className="font-heading text-[18px] font-bold text-text mb-2">Permits Stage</h2>
          <p className="text-[13px] text-text-mid leading-relaxed">
            Section header with List ⇄ Map toggle (sticky per session). List view (default): trip
            profile chip, auto-suggested permits with Add / View on map / Dismiss actions, added permit
            cards with status (pending / lottery / confirmed). Map view: full-pane permit zone overlays.
            Per-row "View on map" opens a focused modal — does not toggle the whole pane.
          </p>
        </div>
      </div>
    </div>
  )
}