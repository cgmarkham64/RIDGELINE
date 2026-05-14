import { useState, useRef, useEffect } from 'react'
import { JumpChip } from '../JumpChip'
import { Pill } from '../Pill'
import { ProgressBar } from '../ProgressBar'
import { CheckItem } from '../CheckItem'
import { IconGear, IconCheck, IconPlus } from '../../icons'
import type { StageBodyProps, PlanGearCategoryEntry } from '../types'


interface GearItem {
  name: string
  weight: number  // oz
  checked: boolean
}

interface GearCategory {
  id: string
  label: string
  items: GearItem[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: GearCategory[] = [
  {
    id: 'shelter',
    label: 'Shelter',
    items: [
      { name: 'Tent · Zpacks Duplex',   weight: 21.0, checked: true  },
      { name: 'Sleeping bag · WM 20°',  weight: 28.0, checked: true  },
      { name: 'Pad · NeoAir XLite NXT', weight: 13.0, checked: true  },
      { name: 'Tent stakes ×8',         weight:  1.6, checked: false },
    ],
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    items: [
      { name: 'Stove · PocketRocket 2', weight: 2.6, checked: true  },
      { name: 'Pot · Toaks 750ml',      weight: 3.6, checked: true  },
      { name: 'Fuel · MSR 110g',        weight: 7.0, checked: false },
      { name: 'Spoon · titanium',       weight: 0.5, checked: true  },
    ],
  },
  {
    id: 'worn',
    label: 'Worn',
    items: [
      { name: 'Shoes · Lone Peak 8',   weight: 22.0, checked: true },
      { name: 'Sun hoody',             weight:  6.0, checked: true },
      { name: 'Shorts',                weight:  5.0, checked: true },
      { name: 'Sun hat',               weight:  2.0, checked: true },
    ],
  },
  {
    id: 'safety',
    label: 'Safety / Nav',
    items: [
      { name: 'Garmin inReach Mini',    weight: 3.6, checked: true  },
      { name: 'First aid kit',          weight: 4.5, checked: true  },
      { name: 'Emergency bivy',         weight: 2.8, checked: false },
      { name: 'Headlamp · Petzl Actik', weight: 2.6, checked: true  },
    ],
  },
]

const DEFAULT_UNLOCK_CHECKLIST = [
  { text: 'Confirm dates',           done: false },
  { text: 'Pre-fill loadout',        done: true  },
  { text: 'Borrow vs buy decisions', done: false },
  { text: 'Final pack weigh-in',     done: false },
  { text: 'Shakedown overnight',     done: false },
]

function fromPlanCategories(src: PlanGearCategoryEntry[]): GearCategory[] {
  return src.map(c => ({ id: c.id, label: c.label, items: c.items.map(i => ({ ...i })) }))
}

// ─── CategoryCard ─────────────────────────────────────────────────────────────

function CategoryCard({ category, onToggleItem }: {
  category: GearCategory
  onToggleItem: (itemIdx: number) => void
}) {
  const checkedOz = category.items.filter(i => i.checked).reduce((s, i) => s + i.weight, 0)
  const totalOz   = category.items.reduce((s, i) => s + i.weight, 0)

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-2 border-b border-border">
        <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">{category.label}</span>
        <span className="font-mono text-[9px] text-text-dim">{category.items.length} items</span>
        <span className="ml-auto font-mono text-[10px] text-amber">{checkedOz.toFixed(1)} / {totalOz.toFixed(1)} oz</span>
      </div>

      {category.items.map((item, i) => (
        <button
          key={item.name}
          type="button"
          onClick={() => onToggleItem(i)}
          className={`grid w-full text-left px-4 py-2 gap-3 items-center cursor-pointer transition-colors hover:bg-surface-2 ${
            i < category.items.length - 1 ? 'border-b border-border' : ''
          }`}
          style={{ gridTemplateColumns: '20px 1fr 60px' }}
        >
          <span className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${
            item.checked ? 'bg-pine border-pine-border text-bg' : 'border-border-mid bg-transparent text-transparent'
          }`}>
            <IconCheck size={9} strokeWidth={3} />
          </span>
          <span className={`text-[11.5px] leading-snug ${item.checked ? 'text-text' : 'text-text-mid'}`}>
            {item.name}
          </span>
          <span className="font-mono text-[10px] text-text-dim text-right">{item.weight} oz</span>
        </button>
      ))}

      <div className="px-4 py-2 border-t border-border">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase text-text-dim hover:text-text-mid transition-colors cursor-pointer"
        >
          <IconPlus /> Add item
        </button>
      </div>
    </div>
  )
}

// ─── GearStage ────────────────────────────────────────────────────────────────

export function GearStage({ onJump, plan, onChange }: StageBodyProps) {
  const [categories, setCategories] = useState<GearCategory[]>(() =>
    plan?.gear?.categories ? fromPlanCategories(plan.gear.categories)
      : plan !== undefined  ? []
      : DEFAULT_CATEGORIES
  )
  const [unlockChecklist, setUnlockChecklist] = useState<{ text: string; done: boolean }[]>(() =>
    plan?.gear?.unlockChecklist ?? DEFAULT_UNLOCK_CHECKLIST
  )

  const isMounted   = useRef(false)
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ gear: { categories, unlockChecklist } })
  }, [categories, unlockChecklist])

  function toggleItem(catIdx: number, itemIdx: number) {
    setCategories(prev => prev.map((c, ci) =>
      ci !== catIdx ? c : {
        ...c,
        items: c.items.map((it, ii) => ii !== itemIdx ? it : { ...it, checked: !it.checked }),
      }
    ))
  }

  function toggleUnlock(idx: number) {
    setUnlockChecklist(prev => prev.map((c, i) => i !== idx ? c : { ...c, done: !c.done }))
  }

  const allItems     = categories.flatMap(c => c.items)
  const checkedCount = allItems.filter(i => i.checked).length
  const totalCount   = allItems.length
  const baseOz       = allItems.filter(i => i.checked).reduce((s, i) => s + i.weight, 0)
  const baseLb       = (baseOz / 16).toFixed(1)

  // Stubs — future: pull from Food stage state
  const foodLb  = '16.4'
  const waterLb = '4.4'
  const totalLb = (baseOz / 16 + parseFloat(foodLb) + parseFloat(waterLb)).toFixed(1)

  const unlockDone     = unlockChecklist.filter(c => c.done).length
  const unlockProgress = Math.round((unlockDone / unlockChecklist.length) * 100)

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_320px]">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-[18px]">

          {/* Hold banner */}
          <div className="bg-surface border border-dashed border-border rounded-lg p-[18px]">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-amber-dim border border-amber-border text-amber shrink-0">
                <IconGear />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-heading text-[16px] font-extrabold text-text mb-1">
                  Gear opens Mar 24, when permits resolve.
                </div>
                <div className="text-[12px] text-text-mid leading-relaxed">
                  Pre-filled from your{' '}
                  <JumpChip to="days" onJump={onJump}>8-day plan</JumpChip>.
                  {' '}Tweak now — we'll re-balance weights once{' '}
                  <JumpChip to="permits" onJump={onJump}>Permits</JumpChip>{' '}confirms.
                </div>
              </div>
              <Pill tone="amber">Preview</Pill>
            </div>
          </div>

          {/* Category cards */}
          {categories.map((cat, ci) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onToggleItem={itemIdx => toggleItem(ci, itemIdx)}
            />
          ))}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onJump('permits')}
              className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer"
            >
              Check Permits
            </button>
            <button
              type="button"
              onClick={() => onJump('food')}
              className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
            >
              Confirm Food first
            </button>
            <button
              type="button"
              onClick={() => onJump('depart')}
              className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
            >
              Skip ahead anyway
            </button>
          </div>
        </div>

        {/* ── Right rail ── */}
        <aside className="flex flex-col gap-3.5">

          {/* Weight stats */}
          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">Loadout preview</div>
            <div>
              <div className="font-heading text-[18px] font-extrabold text-amber leading-none">{checkedCount} of {totalCount}</div>
              <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-text-dim mt-1">items packed</div>
            </div>
            <div className="h-px bg-border my-3" />
            <div className="flex flex-col gap-2.5">
              {[
                { value: `${baseLb} lb`,  label: 'base weight'   },
                { value: `${foodLb} lb`,  label: 'food (start)'  },
                { value: `${waterLb} lb`, label: 'water (start)' },
              ].map(s => (
                <div key={s.label}>
                  <div className="font-heading text-[16px] font-extrabold text-text leading-none">{s.value}</div>
                  <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-text-dim mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="h-px bg-border my-3" />
            <div>
              <div className="font-heading text-[20px] font-extrabold text-amber leading-none">{totalLb} lb</div>
              <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-text-dim mt-0.5">total D1 pack</div>
            </div>
          </div>

          {/* Unlock checklist */}
          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">Unlocks Mar 24</div>
            {unlockChecklist.map((item, i) => (
              <CheckItem
                key={item.text}
                text={item.text}
                done={item.done}
                onToggle={() => toggleUnlock(i)}
              />
            ))}
            <div className="h-px bg-border my-3" />
            <ProgressBar value={unlockProgress} tone="amber" />
            <div className="font-mono text-[9px] text-text-dim text-center mt-1.5">{unlockDone} of {unlockChecklist.length}</div>
          </div>

          {/* Why locked callout */}
          <div className="px-3 py-3 bg-sky-dim border border-sky-border rounded-lg text-[11px] text-text-mid leading-relaxed">
            <span className="font-semibold text-sky">Why locked?</span>{' '}
            Loadout depends on confirmed dates + conditions. Auto-recomputes when{' '}
            <JumpChip to="permits" onJump={onJump}>Permits</JumpChip> resolves.
          </div>
        </aside>
      </div>
    </div>
  )
}