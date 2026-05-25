import { useState, useRef, useId, useEffect } from 'react'
import { JumpChip } from '../JumpChip'
import { Pill } from '../Pill'
import { ProgressBar } from '../ProgressBar'
import { CheckItem } from '../CheckItem'
import { IconCheck, IconPlus, IconPackage, IconDroplets, IconPencil, IconLock } from '../../icons'
import type { StageBodyProps } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealRow {
  n: number
  breakfast: string
  lunch: string
  dinner: string
  snacks: string
  kcal: number
}

interface BearCanOption {
  id: string
  name: string
  capacity: string
  weight: string
  type: 'hard' | 'soft'
  note?: string
  recommended?: boolean
}

type MealCol = 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'kcal'
type TargetField = 'calories' | 'protein' | 'water' | 'packOut'
type ResupplyField = 'shipBy' | 'daysInBox' | 'holdAddress'

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_PLAN: MealRow[] = [
  { n: 1, breakfast: 'Granola + powder',  lunch: 'Tuna wrap',       dinner: 'Mtn House Beef Stew',  snacks: '2 bars · gummies',   kcal: 3500 },
  { n: 2, breakfast: 'Oats + nut butter', lunch: 'Salami + cheese', dinner: 'Pad thai (Backpack)',  snacks: '2 bars · jerky',     kcal: 3700 },
  { n: 3, breakfast: 'Granola + powder',  lunch: 'Tortilla pizza',  dinner: 'Mtn House Lasagna',   snacks: '3 bars · gummies',   kcal: 3900 },
  { n: 4, breakfast: 'Pop-tarts ×2',      lunch: 'Tuna wrap',       dinner: 'Beans & rice',        snacks: '3 bars · chocolate', kcal: 4400 },
  { n: 5, breakfast: 'Oats + nut butter', lunch: 'Salami + cheese', dinner: 'Mtn House Chicken',   snacks: '2 bars · gummies',   kcal: 3700 },
  { n: 6, breakfast: 'Granola + powder',  lunch: 'PB tortilla',     dinner: 'Backpack curry',      snacks: '3 bars · jerky',     kcal: 3900 },
  { n: 7, breakfast: 'Pop-tarts ×2',      lunch: 'Tuna wrap',       dinner: 'Mtn House Lasagna',   snacks: '3 bars · gummies',   kcal: 3800 },
  { n: 8, breakfast: 'Bar + coffee',      lunch: 'Burger @ Portal', dinner: '—',                   snacks: '—',                  kcal: 1800 },
]

const BEAR_CANS: BearCanOption[] = [
  { id: 'bv450',      name: 'Bear Vault BV450',          capacity: '450 cu in', weight: '2.3 lb', type: 'hard' },
  { id: 'bv475',      name: 'Bear Vault BV475',          capacity: '475 cu in', weight: '2.6 lb', type: 'hard' },
  { id: 'bv500',      name: 'Bear Vault BV500',          capacity: '700 cu in', weight: '2.8 lb', type: 'hard', recommended: true },
  { id: 'ursack_maj', name: 'Ursack Major',              capacity: '10.7 L',   weight: '8.0 oz', type: 'soft', note: 'USDA approved · not SEKI' },
  { id: 'ursack_alm', name: 'Ursack AllMitey',           capacity: '10.7 L',   weight: '8.4 oz', type: 'soft', note: 'Yosemite approved · not SEKI' },
  { id: 'ca_keg',     name: 'Counter Assault Bear Keg',  capacity: '615 cu in', weight: '3.1 lb', type: 'hard' },
]

const TARGET_FIELDS: Array<{ key: TargetField; label: string; placeholder: string }> = [
  { key: 'calories', label: 'Calories / day', placeholder: 'e.g. 3,800' },
  { key: 'protein',  label: 'Protein / day',  placeholder: 'e.g. 120 g' },
  { key: 'water',    label: 'Water / day',    placeholder: 'e.g. 4 L' },
  { key: 'packOut',  label: 'Pack out',       placeholder: 'e.g. 1.6 lb/day' },
]

const RESUPPLY_FIELDS: Array<{ key: ResupplyField; label: string; placeholder: string }> = [
  { key: 'shipBy',      label: 'Ship by',      placeholder: 'Aug 1, 2026' },
  { key: 'daysInBox',   label: 'Days in box',  placeholder: '4' },
  { key: 'holdAddress', label: 'Hold address', placeholder: 'Bishop PO, 585 Main St' },
]

const CAN_TYPE_CLS: Record<'hard' | 'soft', string> = {
  hard: 'bg-sky-dim border-sky-border text-sky',
  soft: 'bg-amber-dim border-amber-border text-amber',
}

// pine = meets/exceeds daily target; mid = below target; amber = well below minimum
function kcalCls(kcal: number): string {
  if (kcal >= 3800) return 'text-pine'
  if (kcal >= 3000) return 'text-text-mid'
  return 'text-amber'
}

// ─── TargetsCard ──────────────────────────────────────────────────────────────

function TargetsCard({ targets, onTargetChange, days, onJump }: {
  targets: Record<TargetField, string>
  onTargetChange: (field: TargetField, value: string) => void
  days: number
  onJump: (id: string) => void
}) {
  const uid = useId()
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Daily targets</div>
      <div className="grid grid-cols-4 gap-2.5">
        {TARGET_FIELDS.map(f => (
          <div key={f.key}>
            <label
              htmlFor={`${uid}-${f.key}`}
              className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1 block"
            >
              {f.label}
            </label>
            <input
              id={`${uid}-${f.key}`}
              className="w-full px-2.5 py-1.5 border border-border rounded-sm text-[12px] bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors placeholder:text-text-dim"
              placeholder={f.placeholder}
              value={targets[f.key]}
              onChange={e => onTargetChange(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="font-mono text-[9px] text-text-mid mt-2.5">
        Pulled from{' '}
        <JumpChip to="days" onJump={onJump}>{days} days</JumpChip>
        {' · '}adjusted for tough days (D4, D8)
      </div>
    </div>
  )
}

// ─── MealGrid ─────────────────────────────────────────────────────────────────

function MealGrid({ meals, onMealsChange, mealsLocked, onToggleLock }: {
  meals: MealRow[]
  onMealsChange: (meals: MealRow[]) => void
  mealsLocked: boolean
  onToggleLock: () => void
}) {
  const [editing, setEditing] = useState<{ row: number; col: MealCol } | null>(null)
  const [editValue, setEditValue] = useState('')
  // Refs keep editing state and value current for onBlur closures.
  // editingRef is cleared eagerly in commitEdit to prevent double-fire when
  // blur and click overlap (blur fires first, then startEdit from the click).
  const editingRef  = useRef<{ row: number; col: MealCol } | null>(null)
  const editValueRef = useRef('')

  function startEdit(row: number, col: MealCol) {
    if (mealsLocked) return
    const val = col === 'kcal' ? String(meals[row].kcal) : meals[row][col]
    editingRef.current  = { row, col }
    editValueRef.current = val
    setEditing({ row, col })
    setEditValue(val)
  }

  function commitEdit() {
    if (!editingRef.current) return  // already committed or cancelled
    const { row, col } = editingRef.current
    editingRef.current = null  // clear eagerly — any double-fire returns above
    const val = editValueRef.current
    const updated = meals.map((m, i) => {
      if (i !== row) return m
      if (col === 'kcal') {
        const parsed = parseInt(val.replace(/,/g, ''), 10)
        return { ...m, kcal: isNaN(parsed) ? m.kcal : parsed }
      }
      return { ...m, [col]: val }
    })
    onMealsChange(updated)
    setEditing(null)
  }

  function cancelEdit() {
    editingRef.current = null
    setEditing(null)
  }

  function handleChange(v: string) {
    editValueRef.current = v
    setEditValue(v)
  }

  const textCols = ['breakfast', 'lunch', 'dinner', 'snacks'] as const

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Meal plan</span>
        <span className="font-mono text-[9px] text-text-dim">
          {meals.length} days · {mealsLocked ? 'locked' : 'click any cell to edit'}
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={onToggleLock}
            className={`inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border transition-colors cursor-pointer ${
              mealsLocked
                ? 'border-pine-border bg-pine-dim text-pine'
                : 'border-border text-text-mid bg-transparent hover:border-border-mid'
            }`}
          >
            <IconLock /> {mealsLocked ? 'Locked' : 'Lock meals'}
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer">
            <IconPencil /> Bulk edit
          </button>
        </div>
      </div>

      <div className="grid px-4 py-2 bg-surface-2 border-b border-border font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim grid-cols-[44px_1fr_1fr_1fr_1fr_64px]">
        <span>Day</span>
        <span>Breakfast</span>
        <span>Lunch</span>
        <span>Dinner</span>
        <span>Snacks</span>
        <span className="text-right">kcal</span>
      </div>

      {meals.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-2">No meals planned yet</p>
          <p className="text-[12px] text-text-mid">Fill in Stage 2 · Days first — one meal row per trip day.</p>
        </div>
      ) : meals.map((m, rowIdx) => (
        <div
          key={m.n}
          className={`grid items-center px-4 gap-2 grid-cols-[44px_1fr_1fr_1fr_1fr_64px] ${rowIdx < meals.length - 1 ? 'border-b border-border' : ''}`}
        >
          <span className="font-mono text-[9px] font-bold text-amber text-center py-1 my-2.5 bg-amber-dim border border-amber-border rounded">
            D{m.n}
          </span>

          {textCols.map(col => {
            const isEditing = editing?.row === rowIdx && editing.col === col
            return (
              <div key={col} className="py-2.5">
                {isEditing ? (
                  <input
                    className="w-full bg-surface-2 border border-amber-border rounded px-1.5 py-0.5 text-[11px] text-text outline-none"
                    autoFocus
                    value={editValue}
                    onChange={e => handleChange(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                  />
                ) : (
                  <span
                    onClick={() => startEdit(rowIdx, col)}
                    className={`text-[11px] block leading-snug ${m[col] === '—' ? 'text-text-dim' : 'text-text'} ${!mealsLocked ? 'cursor-text hover:text-amber transition-colors' : ''}`}
                  >
                    {m[col]}
                  </span>
                )}
              </div>
            )
          })}

          <div className="py-2.5 text-right">
            {editing?.row === rowIdx && editing.col === 'kcal' ? (
              <input
                className="w-full bg-surface-2 border border-amber-border rounded px-1.5 py-0.5 text-[11px] text-right font-mono outline-none"
                autoFocus
                value={editValue}
                onChange={e => handleChange(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
              />
            ) : (
              <span
                onClick={() => startEdit(rowIdx, 'kcal')}
                className={`font-mono text-[11px] ${kcalCls(m.kcal)} ${!mealsLocked ? 'cursor-text' : ''}`}
              >
                {m.kcal.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ResupplyCard ─────────────────────────────────────────────────────────────

function ResupplyCard({ status, onToggleShipped, fields, onFieldChange }: {
  status: 'unconfirmed' | 'shipped'
  onToggleShipped: () => void
  fields: Record<ResupplyField, string>
  onFieldChange: (field: ResupplyField, value: string) => void
}) {
  const uid = useId()
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 rounded-md flex items-center justify-center bg-amber-dim border border-amber-border text-amber shrink-0">
          <IconPackage />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-heading text-[14px] font-extrabold text-text">Resupply · Kearsarge Pass (Day 5)</div>
          <div className="font-mono text-[9px] text-text-dim mt-0.5">Bishop Post Office · 4-day box · ship by Aug 1</div>
        </div>
        <Pill tone={status === 'shipped' ? 'pine' : 'amber'}>
          {status === 'shipped' ? 'Shipped' : 'Unconfirmed'}
        </Pill>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {RESUPPLY_FIELDS.map(f => (
          <div key={f.key}>
            <label
              htmlFor={`${uid}-${f.key}`}
              className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1 block"
            >
              {f.label}
            </label>
            <input
              id={`${uid}-${f.key}`}
              className="w-full px-2.5 py-1.5 border border-border rounded-sm text-[12px] bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors placeholder:text-text-dim"
              placeholder={f.placeholder}
              value={fields[f.key]}
              onChange={e => onFieldChange(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button type="button" className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer">
          <IconPlus size={10} /> Generate label
        </button>
        <button
          type="button"
          onClick={onToggleShipped}
          className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
        >
          {status === 'shipped' ? 'Mark unshipped' : 'Mark shipped'}
        </button>
        <button type="button" className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer">
          Swap location
        </button>
      </div>
    </div>
  )
}

// ─── WaterPlanCard ────────────────────────────────────────────────────────────

function WaterPlanCard({ checks, onToggle }: {
  checks: { sources: boolean; cache: boolean; filter: boolean }
  onToggle: (key: 'sources' | 'cache' | 'filter') => void
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-sky shrink-0"><IconDroplets /></span>
        <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Water plan</div>
      </div>
      <p className="text-[11px] text-text-mid mb-3 leading-relaxed">
        No cache plan for the dry stretch on D6 (Forester → Tyndall).
      </p>
      <CheckItem text="Sources scouted (D1–D5, D7–D8)" done={checks.sources} onToggle={() => onToggle('sources')} />
      <CheckItem text="Cache plan D6"                   done={checks.cache}   onToggle={() => onToggle('cache')} />
      <CheckItem text="Filter + backup"                 done={checks.filter}  onToggle={() => onToggle('filter')} />
      <button type="button" className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 mt-3 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer">
        <IconPlus size={10} /> Add cache
      </button>
    </div>
  )
}

// ─── BearCanCard ──────────────────────────────────────────────────────────────

function BearCanCard({ selectedId, onSelect, customName, onCustomName }: {
  selectedId: string
  onSelect: (id: string) => void
  customName: string
  onCustomName: (v: string) => void
}) {
  // prevName stores the committed name before re-entering edit mode so Escape can restore it.
  const [prevName, setPrevName] = useState('')
  // Ref keeps the latest typed value current for onBlur — the prop closure can be one render
  // stale when blur fires synchronously after onChange before React flushes the parent update.
  const customNameRef = useRef(customName)

  // Entering mode is derived from props — no local state that can desync.
  // selectedId === 'custom' && customName === '' → input visible (entering)
  // selectedId === 'custom' && customName !== '' → committed name shown as button
  const enteringCustom = selectedId === 'custom' && customName === ''

  function handleCommittedNameClick() {
    setPrevName(customName)
    customNameRef.current = ''
    onCustomName('')  // clear to show input (re-enter edit mode)
    onSelect('custom')
  }

  function handleCustomBlur() {
    if (!customNameRef.current.trim()) onSelect('')  // abandon if nothing typed
    setPrevName('')
  }

  function handleCustomKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (prevName) {
        customNameRef.current = prevName
        onCustomName(prevName)  // restore previous committed name
      } else {
        customNameRef.current = ''
        onSelect('')  // deselect entirely if no previous name
        onCustomName('')
      }
      setPrevName('')
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">Bear canister</div>
      <p className="text-[11px] text-text-mid mb-3 leading-relaxed">
        Capacity depends on resupply. Hard-sided required at SEKI.
      </p>
      <div className="flex flex-col gap-1.5">
        {BEAR_CANS.map(can => {
          const isSelected = selectedId === can.id
          return (
            <button
              key={can.id}
              type="button"
              onClick={() => { onSelect(can.id); setPrevName('') }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded border text-left transition-colors cursor-pointer w-full ${
                isSelected ? 'bg-amber-glow border-amber-border' : 'bg-transparent border-border hover:border-border-mid'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-mono text-[10px] font-bold ${isSelected ? 'text-amber' : 'text-text-mid'}`}>
                    {can.name}
                  </span>
                  {can.recommended && (
                    <span className="font-mono text-[9px] tracking-widest uppercase text-pine bg-pine-dim border border-pine-border px-1.5 py-0.5 rounded">
                      recommended
                    </span>
                  )}
                </div>
                <div className="font-mono text-[9px] text-text-dim mt-0.5">
                  {can.capacity} · {can.weight}
                  {can.note && <span className="text-amber"> · {can.note}</span>}
                </div>
              </div>
              <span className={`font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded border shrink-0 ${CAN_TYPE_CLS[can.type]}`}>
                {can.type}
              </span>
              {isSelected && <span className="text-amber shrink-0"><IconCheck size={12} /></span>}
            </button>
          )
        })}

        {/* Custom entry — input when entering, button when committed */}
        {enteringCustom ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded border border-amber-border bg-amber-glow">
            <input
              className="flex-1 bg-transparent border-none text-[12px] text-text outline-none placeholder:text-text-dim font-mono"
              placeholder="Container name or model…"
              autoFocus
              value={customName}
              onChange={e => { customNameRef.current = e.target.value; onCustomName(e.target.value) }}
              onBlur={handleCustomBlur}
              onKeyDown={handleCustomKeyDown}
            />
            {customName && <span className="text-amber shrink-0"><IconCheck size={12} /></span>}
          </div>
        ) : (
          <button
            type="button"
            onClick={selectedId === 'custom' ? handleCommittedNameClick : () => onSelect('custom')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded border text-left transition-colors cursor-pointer w-full ${
              selectedId === 'custom' ? 'bg-amber-glow border-amber-border' : 'bg-transparent border-border hover:border-border-mid'
            }`}
          >
            <span className={`font-mono text-[10px] ${selectedId === 'custom' ? 'text-amber font-bold' : 'text-text-dim'}`}>
              {selectedId === 'custom' && customName ? customName : 'Custom / other…'}
            </span>
            {selectedId !== 'custom' && <span className="ml-auto text-text-dim"><IconPlus size={10} /></span>}
            {selectedId === 'custom' && <span className="ml-auto text-amber"><IconCheck size={12} /></span>}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── FoodStage ────────────────────────────────────────────────────────────────

export function FoodStage({ onJump, plan, onChange }: StageBodyProps) {
  const f = plan?.food
  const [meals, setMeals]             = useState<MealRow[]>(() => f?.meals ?? (plan !== undefined ? [] : MEAL_PLAN))
  const [mealsLocked, setMealsLocked] = useState(() => f?.mealsLocked ?? false)
  const [resupplyStatus, setResupply] = useState<'unconfirmed' | 'shipped'>(() => f?.resupplyStatus ?? 'unconfirmed')
  const [waterChecks, setWaterChecks] = useState(() => f?.waterChecks ?? { sources: true, cache: false, filter: false })
  const [selectedCanId, setSelectedCan] = useState(() => f?.selectedCanId ?? '')
  const [customCanName, setCustomCan]   = useState(() => f?.customCanName ?? '')
  const [targets, setTargets] = useState<Record<TargetField, string>>(() => f?.targets ?? {
    calories: '', protein: '', water: '', packOut: '',
  })
  const [resupplyFields, setResupplyFields] = useState<Record<ResupplyField, string>>(() => f?.resupplyFields ?? {
    shipBy: '', daysInBox: '', holdAddress: '',
  })

  const isMounted   = useRef(false)
  // Cleanup resets isMounted so StrictMode's remount starts with false,
  // preventing a spurious onChange + save on the second mount in dev.
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ food: { meals, mealsLocked, resupplyStatus, waterChecks, selectedCanId, customCanName, targets, resupplyFields } })
  }, [meals, mealsLocked, resupplyStatus, waterChecks, selectedCanId, customCanName, targets, resupplyFields])

  function toggleWater(key: 'sources' | 'cache' | 'filter') {
    setWaterChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const kcalTotal = meals.reduce((sum, m) => sum + m.kcal, 0)

  const item1 = targets.calories.trim() !== ''
  const item2 = targets.protein.trim() !== ''
  const item3 = resupplyStatus === 'shipped'
  const item4 = waterChecks.cache
  const item5 = selectedCanId !== '' && (selectedCanId !== 'custom' || customCanName.trim() !== '')
  const item6 = mealsLocked
  const doneCount = [item1, item2, item3, item4, item5, item6].filter(Boolean).length
  const progress  = Math.round((doneCount / 6) * 100)

  // stubs — future: derive food weight from loadout, protein from meal DB, water from targets × days
  const totals = [
    { value: kcalTotal.toLocaleString(), label: 'kcal total' },
    { value: '14.2 lb', label: 'food weight' },
    { value: '864 g',   label: 'protein' },
    { value: '32 L',    label: 'water' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_320px]">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-[18px]">
          <TargetsCard
            targets={targets}
            onTargetChange={(field, value) => setTargets(prev => ({ ...prev, [field]: value }))}
            days={MEAL_PLAN.length}
            onJump={onJump}
          />
          <MealGrid
            meals={meals}
            onMealsChange={setMeals}
            mealsLocked={mealsLocked}
            onToggleLock={() => setMealsLocked(v => !v)}
          />
          <ResupplyCard
            status={resupplyStatus}
            onToggleShipped={() => setResupply(s => s === 'shipped' ? 'unconfirmed' : 'shipped')}
            fields={resupplyFields}
            onFieldChange={(field, value) => setResupplyFields(prev => ({ ...prev, [field]: value }))}
          />
          <div className="grid grid-cols-2 gap-3.5 items-start">
            <WaterPlanCard checks={waterChecks} onToggle={toggleWater} />
            <BearCanCard
              selectedId={selectedCanId}
              onSelect={setSelectedCan}
              customName={customCanName}
              onCustomName={setCustomCan}
            />
          </div>
        </div>

        {/* ── Right rail ── */}
        <aside className="flex flex-col gap-3.5">

          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
            <CheckItem text="Daily calories set"  done={item1} />
            <CheckItem text="Protein target"      done={item2} />
            <CheckItem text="Resupply confirmed"  done={item3} />
            <CheckItem text="Water cache (D6)"    done={item4} />
            <CheckItem text="Bear-can sized"      done={item5} />
            <CheckItem text="Trail meals locked"  done={item6} />
            <div className="h-px bg-border my-3" />
            <ProgressBar value={progress} tone="amber" />
            <div className="font-mono text-[9px] text-text-dim text-center mt-1.5">{doneCount} of 6</div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">Totals</div>
            <div className="grid grid-cols-2 gap-3">
              {totals.map(s => (
                <div key={s.label}>
                  <div className="font-heading text-[18px] font-extrabold text-amber leading-none">{s.value}</div>
                  <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-3 py-3 bg-amber-dim border border-amber-border rounded-lg text-[11px] text-text-mid leading-relaxed">
            <span className="font-semibold text-amber">Heads up.</span>{' '}
            Big-day calories (D4, D8) should clear 4,200. D8 is light because you exit to Whitney Portal — burger after.
          </div>
        </aside>
      </div>
    </div>
  )
}