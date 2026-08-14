import { JumpChip } from '../../JumpChip'
import { BEAR_CAN_NEED_OPTIONS } from './foodStage.helpers'

type BearCanNeedCardProps = {
  need: string
  onChange: (v: 'not_needed' | 'recommended' | 'required') => void
  onJump: (id: string) => void
}

export function BearCanNeedCard({ need, onChange, onJump }: BearCanNeedCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Bear canister</div>
      <p className="text-fine text-text-mid mb-3 leading-relaxed">
        Check land manager rules for where you'll camp — requirements vary (hard-sided required at SEKI, Ursack accepted at some but not others).
      </p>
      <div className="flex rounded border border-border overflow-hidden">
        {BEAR_CAN_NEED_OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex-1 font-mono text-caption px-2.5 py-2 transition-colors cursor-pointer ${
              need === opt.id ? 'bg-pine-dim text-pine' : 'text-text-dim hover:text-text-mid'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {(need === 'required' || need === 'recommended') && (
        <div className="mt-3">
          <JumpChip to="gear" onJump={onJump}>Pick your canister in Gear</JumpChip>
        </div>
      )}
    </div>
  )
}
