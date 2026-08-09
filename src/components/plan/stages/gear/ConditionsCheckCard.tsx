import { IconCheck } from '../../../icons'
import type { PlanData, PlanWeatherData } from '../../types'

export function ConditionsCheckCard({ weather, onChange, canEdit }: {
  weather: PlanWeatherData
  onChange: ((patch: Partial<PlanData>) => void) | undefined
  canEdit: boolean
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2">Conditions check</div>
      <p className="text-fine text-text-mid leading-relaxed mb-2.5">
        Once your loadout is adjusted for the flagged conditions, mark it done.
      </p>
      {canEdit && (
        <button
          type="button"
          onClick={() => onChange?.({ weather: { ...weather, gearAdjusted: !weather.gearAdjusted } })}
          className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 font-mono text-label rounded border cursor-pointer transition-colors ${
            weather.gearAdjusted
              ? 'bg-pine-dim border-pine-border text-pine'
              : 'bg-surface-2 border-border text-text-dim hover:border-border-mid'
          }`}
        >
          {weather.gearAdjusted && <IconCheck size={9} />}
          {weather.gearAdjusted ? 'Loadout adjusted ✓' : 'Mark loadout adjusted'}
        </button>
      )}
    </div>
  )
}
