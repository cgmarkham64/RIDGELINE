import { JumpChip } from '../../JumpChip'
import { ProgressBar } from '../../ProgressBar'
import { CheckItem } from '../../CheckItem'
import type { PlanData, PlanWeatherData } from '../../types'
import { ConditionsCheckCard } from './ConditionsCheckCard'
import type { UnlockChecklistItem } from './gearStage.types'

function LoadoutPreviewCard({ checkedCount, totalCount, baseLb, foodLb, totalLb }: {
  checkedCount: number
  totalCount: number
  baseLb: string
  foodLb: string
  totalLb: string
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Loadout preview</div>
      <div>
        <div className="font-heading text-sub font-extrabold text-amber leading-none">{checkedCount} of {totalCount}</div>
        <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mt-1">items packed</div>
      </div>
      <div className="h-px bg-border my-3" />
      <div className="flex flex-col gap-2.5">
        {[
          { value: `${baseLb} lb`, label: 'base weight'  },
          { value: `${foodLb} lb`, label: 'food (start)' },
        ].map(stat => (
          <div key={stat.label}>
            <div className="font-heading text-body-lg font-extrabold text-text leading-none">{stat.value}</div>
            <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="h-px bg-border my-3" />
      <div>
        <div className="font-heading text-h3 font-extrabold text-amber leading-none">{totalLb} lb</div>
        <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mt-0.5">total D1 pack</div>
      </div>
    </div>
  )
}

function UnlockChecklistCard({ unlockChecklist, onToggleUnlock, unlockDone, unlockProgress }: {
  unlockChecklist: UnlockChecklistItem[]
  onToggleUnlock: (idx: number) => void
  unlockDone: number
  unlockProgress: number
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Unlocks Mar 24</div>
      {unlockChecklist.map((item, i) => (
        <CheckItem
          key={item.text}
          text={item.text}
          done={item.done}
          onToggle={() => onToggleUnlock(i)}
        />
      ))}
      <div className="h-px bg-border my-3" />
      <ProgressBar value={unlockProgress} tone="amber" />
      <div className="font-mono text-label text-text-dim text-center mt-1.5">{unlockDone} of {unlockChecklist.length}</div>
    </div>
  )
}

export function GearRightRail({
  onJump, checkedCount, totalCount, baseLb, foodLb, totalLb,
  unlockChecklist, onToggleUnlock, unlockDone, unlockProgress,
  weather, isWeatherRisk, onChange, canEdit,
}: {
  onJump: (id: string) => void
  checkedCount: number
  totalCount: number
  baseLb: string
  foodLb: string
  totalLb: string
  unlockChecklist: UnlockChecklistItem[]
  onToggleUnlock: (idx: number) => void
  unlockDone: number
  unlockProgress: number
  weather: PlanWeatherData | undefined
  isWeatherRisk: boolean
  onChange: ((patch: Partial<PlanData>) => void) | undefined
  canEdit: boolean
}) {
  return (
    <aside className="flex flex-col gap-3.5">
      <LoadoutPreviewCard checkedCount={checkedCount} totalCount={totalCount} baseLb={baseLb} foodLb={foodLb} totalLb={totalLb} />
      <UnlockChecklistCard
        unlockChecklist={unlockChecklist}
        onToggleUnlock={onToggleUnlock}
        unlockDone={unlockDone}
        unlockProgress={unlockProgress}
      />

      {/* Why locked callout */}
      <div className="px-3 py-3 bg-sky-dim border border-sky-border rounded-lg text-fine text-text-mid leading-relaxed">
        <span className="font-semibold text-sky">Why locked?</span>{' '}
        Loadout depends on confirmed dates + conditions. Auto-recomputes when{' '}
        <JumpChip to="permits" onJump={onJump}>Permits</JumpChip> resolves.
      </div>

      {isWeatherRisk && (
        <ConditionsCheckCard weather={weather!} onChange={onChange} canEdit={canEdit} />
      )}
    </aside>
  )
}
