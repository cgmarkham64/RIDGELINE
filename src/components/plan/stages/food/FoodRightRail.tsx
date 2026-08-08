import { ProgressBar } from '../../ProgressBar'
import { CheckItem } from '../../CheckItem'

type FoodChecklist = {
  item1: boolean; item2: boolean; item3: boolean; item4: boolean; item5: boolean
  doneCount: number; totalCount: number; progress: number
}

type FoodRightRailProps = {
  checklist: FoodChecklist
  onToggleMealsLocked: () => void
  totals: { value: string; label: string }[]
  headsUp: string | null
}

export function FoodRightRail({ checklist, onToggleMealsLocked, totals, headsUp }: FoodRightRailProps) {
  return (
    <aside className="flex flex-col gap-3.5">
      <div className="bg-surface border border-border rounded-lg p-3.5">
        <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
        <CheckItem text="Daily calories set"  done={checklist.item1} />
        <CheckItem text="Protein target"      done={checklist.item2} />
        <CheckItem text="Resupply confirmed"  done={checklist.item3} />
        <CheckItem text="Bear-can need set"   done={checklist.item4} />
        <CheckItem text="Trail meals locked"  done={checklist.item5} onToggle={onToggleMealsLocked} />
        <div className="h-px bg-border my-3" />
        <ProgressBar value={checklist.progress} tone="amber" />
        <div className="font-mono text-label text-text-dim text-center mt-1.5">{checklist.doneCount} of {checklist.totalCount}</div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-3.5">
        <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Totals</div>
        <div className="grid grid-cols-2 gap-3">
          {totals.map(t => (
            <div key={t.label}>
              <div className="font-heading text-sub font-extrabold text-amber leading-none">{t.value}</div>
              <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mt-1">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {headsUp && (
        <div className="px-3 py-3 bg-amber-dim border border-amber-border rounded-lg text-fine text-text-mid leading-relaxed">
          <span className="font-semibold text-amber">Heads up.</span>{' '}
          {headsUp}
        </div>
      )}
    </aside>
  )
}
