import { JumpChip } from '../../JumpChip'
import { Pill } from '../../Pill'
import { IconGear } from '../../../icons'
import type { PlanWeatherData } from '../../types'
import { BearCanCard } from './BearCanCard'
import { CategoryCard } from './CategoryCard'
import { WeatherRiskBanner } from './WeatherRiskBanner'
import type { GearCategory } from './gearStage.types'

const ACTION_BASE_CLS = 'inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border cursor-pointer transition-colors'
const ACTION_TONE_CLS = {
  amber:   'border-amber-border bg-amber-dim text-amber hover:bg-amber',
  neutral: 'border-border text-text-mid bg-transparent hover:border-border-mid',
} as const

const ACTIONS = [
  { label: 'Check Permits',       to: 'permits', tone: 'amber'   },
  { label: 'Confirm Food first',  to: 'food',    tone: 'neutral' },
  { label: 'Skip ahead anyway',   to: 'depart',  tone: 'neutral' },
] as const

function HoldBanner({ onJump }: { onJump: (id: string) => void }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-lg p-[18px]">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-amber-dim border border-amber-border text-amber shrink-0">
          <IconGear />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-heading text-body-lg font-extrabold text-text mb-1">
            Gear opens Mar 24, when permits resolve.
          </div>
          <div className="text-body-sm text-text-mid leading-relaxed">
            Pre-filled from your{' '}
            <JumpChip to="weather" onJump={onJump}>8-day plan</JumpChip>.
            {' '}Tweak now — we'll re-balance weights once{' '}
            <JumpChip to="permits" onJump={onJump}>Permits</JumpChip>{' '}confirms.
          </div>
        </div>
        <Pill tone="amber">Preview</Pill>
      </div>
    </div>
  )
}

export function GearMainPanel({
  onJump, weather, isWeatherRisk, categories, onToggleItem,
  selectedCanId, onSelectCan, customCanName, onCustomCanName,
}: {
  onJump: (id: string) => void
  weather: PlanWeatherData | undefined
  isWeatherRisk: boolean
  categories: GearCategory[]
  onToggleItem: (catIdx: number, itemIdx: number) => void
  selectedCanId: string
  onSelectCan: (id: string) => void
  customCanName: string
  onCustomCanName: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-[18px]">

      {isWeatherRisk && (
        <WeatherRiskBanner
          risk={weather!.departureRisk as 'moderate' | 'high'}
          factors={weather!.departureFactors}
          onJump={onJump}
        />
      )}

      <HoldBanner onJump={onJump} />

      {/* Category cards */}
      {categories.length === 0 ? (
        <div className="px-4 py-8 text-center border border-dashed border-border rounded-lg">
          <p className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-2">No categories yet</p>
          <p className="text-body-sm text-text-mid">Add your first gear category to start building your kit.</p>
        </div>
      ) : categories.map((cat, ci) => (
        <CategoryCard
          key={cat.id}
          category={cat}
          onToggleItem={itemIdx => onToggleItem(ci, itemIdx)}
        />
      ))}

      <BearCanCard
        selectedId={selectedCanId}
        onSelect={onSelectCan}
        customName={customCanName}
        onCustomName={onCustomCanName}
      />

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        {ACTIONS.map(a => (
          <button
            key={a.to}
            type="button"
            onClick={() => onJump(a.to)}
            className={`${ACTION_BASE_CLS} ${ACTION_TONE_CLS[a.tone]}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
