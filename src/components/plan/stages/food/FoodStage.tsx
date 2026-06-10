import { useState, useRef, useId, useEffect } from 'react'
import { JumpChip } from '../../JumpChip'
import { Pill } from '../../Pill'
import { ProgressBar } from '../../ProgressBar'
import { CheckItem } from '../../CheckItem'
import { IconCheck, IconPlus, IconX, IconPackage, IconDroplets, IconPencil, IconLock } from '../../../icons'
import type { StageBodyProps, ResupplyStop } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealRow {
  n: number
  breakfast: string
  lunch: string
  dinner: string
  snacks: string
  kcal: number
  weightOz: number
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

type MealCol = 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'kcal' | 'weightOz'
type TargetField = 'calories' | 'protein' | 'fat' | 'carbs'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEMO_MEALS: MealRow[] = [
  { n: 1, breakfast: 'Granola + powder',  lunch: 'Tuna wrap',       dinner: 'Mtn House Beef Stew', snacks: '2 bars · gummies',   kcal: 3500, weightOz: 22 },
  { n: 2, breakfast: 'Oats + nut butter', lunch: 'Salami + cheese', dinner: 'Pad thai (Backpack)', snacks: '2 bars · jerky',     kcal: 3700, weightOz: 24 },
  { n: 3, breakfast: 'Granola + powder',  lunch: 'Tortilla pizza',  dinner: 'Mtn House Lasagna',   snacks: '3 bars · gummies',   kcal: 3900, weightOz: 25 },
  { n: 4, breakfast: 'Pop-tarts ×2',      lunch: 'Tuna wrap',       dinner: 'Beans & rice',        snacks: '3 bars · chocolate', kcal: 4400, weightOz: 28 },
  { n: 5, breakfast: 'Oats + nut butter', lunch: 'Salami + cheese', dinner: 'Mtn House Chicken',   snacks: '2 bars · gummies',   kcal: 3700, weightOz: 24 },
  { n: 6, breakfast: 'Granola + powder',  lunch: 'PB tortilla',     dinner: 'Backpack curry',      snacks: '3 bars · jerky',     kcal: 3900, weightOz: 25 },
  { n: 7, breakfast: 'Pop-tarts ×2',      lunch: 'Tuna wrap',       dinner: 'Mtn House Lasagna',   snacks: '3 bars · gummies',   kcal: 3800, weightOz: 24 },
  { n: 8, breakfast: 'Bar + coffee',      lunch: 'Burger @ Portal', dinner: '—',                   snacks: '—',                  kcal: 1800, weightOz: 8  },
]

const BEAR_CANS: BearCanOption[] = [
  { id: 'bv450',      name: 'Bear Vault BV450',         capacity: '450 cu in', weight: '2.3 lb', type: 'hard' },
  { id: 'bv475',      name: 'Bear Vault BV475',         capacity: '475 cu in', weight: '2.6 lb', type: 'hard' },
  { id: 'bv500',      name: 'Bear Vault BV500',         capacity: '700 cu in', weight: '2.8 lb', type: 'hard', recommended: true },
  { id: 'ursack_maj', name: 'Ursack Major',             capacity: '10.7 L',   weight: '8.0 oz', type: 'soft', note: 'USDA approved · not SEKI' },
  { id: 'ursack_alm', name: 'Ursack AllMitey',          capacity: '10.7 L',   weight: '8.4 oz', type: 'soft', note: 'Yosemite approved · not SEKI' },
  { id: 'ca_keg',     name: 'Counter Assault Bear Keg', capacity: '615 cu in', weight: '3.1 lb', type: 'hard' },
]

const TARGET_FIELDS: Array<{ key: TargetField; label: string; placeholder: string }> = [
  { key: 'calories', label: 'Calories / day', placeholder: 'e.g. 3,800' },
  { key: 'protein',  label: 'Protein / day',  placeholder: 'e.g. 120 g'  },
  { key: 'fat',      label: 'Fat / day',      placeholder: 'e.g. 80 g'   },
  { key: 'carbs',    label: 'Carbs / day',    placeholder: 'e.g. 400 g'  },
]

const STOP_TEXT_FIELDS: Array<{
  key: 'shipBy' | 'daysInBox' | 'holdAddress'
  label: string
  placeholder: string
}> = [
  { key: 'shipBy',      label: 'Ship by',      placeholder: 'Aug 1, 2026'       },
  { key: 'daysInBox',   label: 'Days in box',  placeholder: '4'                  },
  { key: 'holdAddress', label: 'Hold address', placeholder: 'Bishop PO, 585 Main St' },
]

const CAN_TYPE_CLS: Record<'hard' | 'soft', string> = {
  hard: 'bg-sky-dim border-sky-border text-sky',
  soft: 'bg-amber-dim border-amber-border text-amber',
}

function kcalCls(kcal: number): string {
  if (kcal >= 3800) return 'text-pine'
  if (kcal >= 3000) return 'text-text-mid'
  return 'text-amber'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function blankMeals(startDate?: string, endDate?: string): MealRow[] {
  if (!startDate || !endDate) return []
  const days = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000) + 1
  if (days <= 0) return []
  return Array.from({ length: days }, (_, i) => ({
    n: i + 1, breakfast: '', lunch: '', dinner: '', snacks: '', kcal: 0, weightOz: 0,
  }))
}

// ─── TargetsCard ──────────────────────────────────────────────────────────────

function TargetsCard({ targets, onTargetChange, days, toughDays, onJump }: {
  targets: Record<TargetField, string>
  onTargetChange: (field: TargetField, value: string) => void
  days: number
  toughDays: number[]
  onJump: (id: string) => void
}) {
  const uid = useId()
  const toughNote = toughDays.length > 0
    ? `D${toughDays.join(', D')} flagged tough — aim for 4,000+ kcal`
    : null

  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-3">Daily targets</div>
      <div className="grid grid-cols-4 gap-2.5">
        {TARGET_FIELDS.map(f => (
          <div key={f.key}>
            <label
              htmlFor={`${uid}-${f.key}`}
              className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1 block"
            >
              {f.label}
            </label>
            <input
              id={`${uid}-${f.key}`}
              className="w-full px-2.5 py-1.5 border border-border rounded-sm text-body-sm bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors placeholder:text-text-dim"
              placeholder={f.placeholder}
              value={targets[f.key]}
              onChange={e => onTargetChange(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="font-mono text-label text-text-mid mt-2.5">
        Pulled from{' '}
        <JumpChip to="weather" onJump={onJump}>{days > 0 ? `${days} days` : '— days'}</JumpChip>
        {toughNote && <>{' · '}{toughNote}</>}
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
  const editingRef   = useRef<{ row: number; col: MealCol } | null>(null)
  const editValueRef = useRef('')

  function startEdit(row: number, col: MealCol) {
    if (mealsLocked) return
    const m = meals[row]
    const val = col === 'kcal' ? String(m.kcal || '') : col === 'weightOz' ? String(m.weightOz || '') : m[col]
    editingRef.current   = { row, col }
    editValueRef.current = val
    setEditing({ row, col })
    setEditValue(val)
  }

  function commitEdit() {
    if (!editingRef.current) return
    const { row, col } = editingRef.current
    editingRef.current = null
    const val = editValueRef.current
    const updated = meals.map((m, i) => {
      if (i !== row) return m
      if (col === 'kcal') {
        const parsed = parseInt(val.replace(/,/g, ''), 10)
        return { ...m, kcal: isNaN(parsed) ? m.kcal : parsed }
      }
      if (col === 'weightOz') {
        const parsed = parseFloat(val)
        return { ...m, weightOz: isNaN(parsed) ? m.weightOz : parsed }
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
        <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Meal plan</span>
        <span className="font-mono text-label text-text-dim">
          {meals.length} days · {mealsLocked ? 'locked' : 'click any cell to edit'}
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={onToggleLock}
            className={`inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border transition-colors cursor-pointer ${
              mealsLocked
                ? 'border-pine-border bg-pine-dim text-pine'
                : 'border-border text-text-mid bg-transparent hover:border-border-mid'
            }`}
          >
            <IconLock /> {mealsLocked ? 'Locked' : 'Lock meals'}
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer">
            <IconPencil /> Bulk edit
          </button>
        </div>
      </div>

      <div className="grid px-4 py-2 bg-surface-2 border-b border-border font-mono text-label tracking-[0.12em] uppercase text-text-dim grid-cols-[44px_1fr_1fr_1fr_1fr_56px_64px]">
        <span>Day</span>
        <span>Breakfast</span>
        <span>Lunch</span>
        <span>Dinner</span>
        <span>Snacks</span>
        <span className="text-right">oz</span>
        <span className="text-right">kcal</span>
      </div>

      {meals.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-2">No meals planned yet</p>
          <p className="text-body-sm text-text-mid">Set trip dates in the header — one row per day will be created automatically.</p>
        </div>
      ) : meals.map((m, rowIdx) => (
        <div
          key={m.n}
          className={`grid items-center px-4 gap-2 grid-cols-[44px_1fr_1fr_1fr_1fr_56px_64px] ${rowIdx < meals.length - 1 ? 'border-b border-border' : ''}`}
        >
          <span className="font-mono text-label font-bold text-amber text-center py-1 my-2.5 bg-amber-dim border border-amber-border rounded">
            D{m.n}
          </span>

          {textCols.map(col => {
            const isEditing = editing?.row === rowIdx && editing.col === col
            return (
              <div key={col} className="py-2.5">
                {isEditing ? (
                  <input
                    className="w-full bg-surface-2 border border-amber-border rounded px-1.5 py-0.5 text-fine text-text outline-none"
                    autoFocus
                    value={editValue}
                    onChange={e => handleChange(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                  />
                ) : (
                  <span
                    onClick={() => startEdit(rowIdx, col)}
                    className={`text-fine block leading-snug ${!m[col] || m[col] === '—' ? 'text-text-dim' : 'text-text'} ${!mealsLocked ? 'cursor-text hover:text-amber transition-colors' : ''}`}
                  >
                    {m[col] || '—'}
                  </span>
                )}
              </div>
            )
          })}

          {/* oz column */}
          <div className="py-2.5 text-right">
            {editing?.row === rowIdx && editing.col === 'weightOz' ? (
              <input
                className="w-full bg-surface-2 border border-amber-border rounded px-1.5 py-0.5 text-fine font-mono text-right outline-none"
                autoFocus
                value={editValue}
                onChange={e => handleChange(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
              />
            ) : (
              <span
                onClick={() => startEdit(rowIdx, 'weightOz')}
                className={`font-mono text-fine ${m.weightOz ? 'text-text-mid' : 'text-text-dim'} ${!mealsLocked ? 'cursor-text' : ''}`}
              >
                {m.weightOz || '—'}
              </span>
            )}
          </div>

          {/* kcal column */}
          <div className="py-2.5 text-right">
            {editing?.row === rowIdx && editing.col === 'kcal' ? (
              <input
                className="w-full bg-surface-2 border border-amber-border rounded px-1.5 py-0.5 text-fine text-right font-mono outline-none"
                autoFocus
                value={editValue}
                onChange={e => handleChange(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
              />
            ) : (
              <span
                onClick={() => startEdit(rowIdx, 'kcal')}
                className={`font-mono text-fine ${m.kcal ? kcalCls(m.kcal) : 'text-text-dim'} ${!mealsLocked ? 'cursor-text' : ''}`}
              >
                {m.kcal ? m.kcal.toLocaleString() : '—'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ResupplySection ──────────────────────────────────────────────────────────

function ResupplySection({ stops, onStopsChange }: {
  stops: ResupplyStop[]
  onStopsChange: (stops: ResupplyStop[]) => void
}) {
  const uid = useId()

  function addStop() {
    onStopsChange([...stops, {
      id: crypto.randomUUID(),
      name: '',
      resupplyDay: '',
      shipBy: '',
      daysInBox: '',
      holdAddress: '',
      status: 'unconfirmed',
    }])
  }

  function removeStop(id: string) {
    onStopsChange(stops.filter(s => s.id !== id))
  }

  function updateStop(id: string, patch: Partial<ResupplyStop>) {
    onStopsChange(stops.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  return (
    <div className="flex flex-col gap-3">
      {stops.length === 0 && (
        <div className="bg-surface border border-dashed border-border rounded-lg px-4 py-6 text-center">
          <p className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1">No resupply stops</p>
          <p className="text-body-sm text-text-mid">Add a stop for mail drops or cache pickups along the route.</p>
        </div>
      )}

      {stops.map(stop => (
        <div key={stop.id} className="bg-surface border border-border rounded-lg p-[18px]">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-8 h-8 rounded-md flex items-center justify-center bg-amber-dim border border-amber-border text-amber shrink-0 mt-0.5">
              <IconPackage />
            </span>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <input
                className="flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-border-mid font-heading text-body-sm font-extrabold text-text outline-none placeholder:text-text-dim pb-0.5 transition-colors"
                placeholder="Stop name (e.g. Kearsarge Pass)…"
                value={stop.name}
                onChange={e => updateStop(stop.id, { name: e.target.value })}
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-label text-text-dim">Day</span>
                <input
                  className="w-10 bg-surface-2 border border-border rounded-sm px-1.5 py-1 font-mono text-label text-text outline-none focus:border-border-mid transition-colors text-center"
                  placeholder="—"
                  value={stop.resupplyDay}
                  onChange={e => updateStop(stop.id, { resupplyDay: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Pill tone={stop.status === 'shipped' ? 'pine' : 'amber'}>
                {stop.status === 'shipped' ? 'Shipped' : 'Unconfirmed'}
              </Pill>
              <button
                type="button"
                onClick={() => removeStop(stop.id)}
                className="text-text-dim hover:text-text transition-colors cursor-pointer"
                aria-label="Remove stop"
              >
                <IconX size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {STOP_TEXT_FIELDS.map(f => (
              <div key={f.key}>
                <label
                  htmlFor={`${uid}-${stop.id}-${f.key}`}
                  className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1 block"
                >
                  {f.label}
                </label>
                <input
                  id={`${uid}-${stop.id}-${f.key}`}
                  className="w-full px-2.5 py-1.5 border border-border rounded-sm text-body-sm bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors placeholder:text-text-dim"
                  placeholder={f.placeholder}
                  value={stop[f.key]}
                  onChange={e => updateStop(stop.id, { [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button type="button" className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer">
              <IconPlus size={10} /> Generate label
            </button>
            <button
              type="button"
              onClick={() => updateStop(stop.id, { status: stop.status === 'shipped' ? 'unconfirmed' : 'shipped' })}
              className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
            >
              {stop.status === 'shipped' ? 'Mark unshipped' : 'Mark shipped'}
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addStop}
        className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer self-start"
      >
        <IconPlus size={10} /> Add resupply stop
      </button>
    </div>
  )
}

// ─── WaterPlanCard ────────────────────────────────────────────────────────────

function WaterPlanCard({ filterPacked, onToggle }: {
  filterPacked: boolean
  onToggle: () => void
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-sky shrink-0"><IconDroplets /></span>
        <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Water</div>
      </div>
      <CheckItem text="Filter + backup packed" done={filterPacked} onToggle={onToggle} />
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
    onCustomName('')
    onSelect('custom')
  }

  function handleCustomBlur() {
    if (!customNameRef.current.trim()) onSelect('')
    setPrevName('')
  }

  function handleCustomKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (prevName) {
        customNameRef.current = prevName
        onCustomName(prevName)
      } else {
        customNameRef.current = ''
        onSelect('')
        onCustomName('')
      }
      setPrevName('')
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Bear canister</div>
      <p className="text-fine text-text-mid mb-3 leading-relaxed">
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
                  <span className={`font-mono text-caption font-bold ${isSelected ? 'text-amber' : 'text-text-mid'}`}>
                    {can.name}
                  </span>
                  {can.recommended && (
                    <span className="font-mono text-label tracking-widest uppercase text-pine bg-pine-dim border border-pine-border px-1.5 py-0.5 rounded">
                      recommended
                    </span>
                  )}
                </div>
                <div className="font-mono text-label text-text-dim mt-0.5">
                  {can.capacity} · {can.weight}
                  {can.note && <span className="text-amber"> · {can.note}</span>}
                </div>
              </div>
              <span className={`font-mono text-label tracking-widest uppercase px-1.5 py-0.5 rounded border shrink-0 ${CAN_TYPE_CLS[can.type]}`}>
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
              className="flex-1 bg-transparent border-none text-body-sm text-text outline-none placeholder:text-text-dim font-mono"
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
            <span className={`font-mono text-caption ${selectedId === 'custom' ? 'text-amber font-bold' : 'text-text-dim'}`}>
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

export function FoodStage({ onJump, plan, onChange, onProgress, trip }: StageBodyProps) {
  const f = plan?.food

  // Backward compat: migrate old single-stop resupply data saved before this field existed.
  const legacy = f as { resupplyFields?: Record<string, string>; resupplyStatus?: 'unconfirmed' | 'shipped' } | undefined
  const migratedStops: ResupplyStop[] =
    legacy?.resupplyFields?.holdAddress || legacy?.resupplyFields?.shipBy
      ? [{
          id: 'legacy',
          name: '',
          resupplyDay: '',
          shipBy:       legacy.resupplyFields!.shipBy       ?? '',
          daysInBox:    legacy.resupplyFields!.daysInBox    ?? '',
          holdAddress:  legacy.resupplyFields!.holdAddress  ?? '',
          status:       legacy.resupplyStatus               ?? 'unconfirmed',
        }]
      : []

  const [meals, setMeals] = useState<MealRow[]>(() => {
    if (f?.meals !== undefined) return f.meals.map(m => ({ ...m, weightOz: m.weightOz ?? 0 }))
    if (plan !== undefined) return blankMeals(trip?.startDate, trip?.endDate)
    return DEMO_MEALS
  })
  const [mealsLocked, setMealsLocked]     = useState(() => f?.mealsLocked  ?? false)
  const [resupplyStops, setResupplyStops] = useState<ResupplyStop[]>(() => f?.resupplyStops ?? migratedStops)
  const [waterChecks, setWaterChecks]     = useState(() => ({ filter: f?.waterChecks?.filter ?? false }))
  const [selectedCanId, setSelectedCan]   = useState(() => f?.selectedCanId ?? '')
  const [customCanName, setCustomCan]     = useState(() => f?.customCanName ?? '')
  const [targets, setTargets]             = useState<Record<TargetField, string>>(() => {
    const t = f?.targets as Record<string, string> | undefined
    return { calories: t?.calories ?? '', protein: t?.protein ?? '', fat: t?.fat ?? '', carbs: t?.carbs ?? '' }
  })

  // Derive tough days from route annotations for the calorie advisory
  const toughDays = (plan?.route?.segments ?? []).filter(s => s.hard).map(s => s.n)

  const isMounted   = useRef(false)
  // Cleanup resets isMounted so StrictMode's remount starts with false,
  // preventing a spurious onChange + save on the second mount in dev.
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ food: { meals, mealsLocked, resupplyStops, waterChecks, selectedCanId, customCanName, targets } })
  }, [meals, mealsLocked, resupplyStops, waterChecks, selectedCanId, customCanName, targets])

  // Checklist items
  const item1 = targets.calories.trim() !== ''
  const item2 = targets.protein.trim()  !== ''
  const item3 = resupplyStops.length > 0 && resupplyStops.every(s => s.status === 'shipped')
  const item4 = waterChecks.filter
  const item5 = selectedCanId !== '' && (selectedCanId !== 'custom' || customCanName.trim() !== '')
  const item6 = mealsLocked
  const doneCount = [item1, item2, item3, item4, item5, item6].filter(Boolean).length
  const progress  = Math.round((doneCount / 6) * 100)

  // Report progress to PlanWizard whenever it changes
  const onProgressRef = useRef(onProgress)
  useEffect(() => { onProgressRef.current = onProgress })
  useEffect(() => { onProgressRef.current?.(doneCount, 6) }, [doneCount])

  function toggleFilter() {
    setWaterChecks(prev => ({ filter: !prev.filter }))
  }

  // Derived totals
  const kcalTotal     = meals.reduce((sum, m) => sum + m.kcal, 0)
  const totalWeightOz = meals.reduce((sum, m) => sum + (m.weightOz || 0), 0)
  const foodWeightStr = totalWeightOz > 0 ? `${(totalWeightOz / 16).toFixed(1)} lb` : '—'

  const totals = [
    { value: kcalTotal > 0 ? kcalTotal.toLocaleString() : '—', label: 'kcal total'  },
    { value: foodWeightStr,                                      label: 'food weight' },
  ]

  // "Heads up" advisory — SHR copy in demo mode, dynamic from route in real plans
  const headsUp = plan === undefined
    ? 'Big-day calories (D4, D8) should clear 4,200. D8 is light because you exit to Whitney Portal — burger after.'
    : toughDays.length > 0
      ? `D${toughDays.join(', D')} ${toughDays.length === 1 ? 'is' : 'are'} flagged as tough — plan for 4,000+ kcal ${toughDays.length === 1 ? 'that day' : 'those days'}.`
      : null

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 grid-cols-[1fr_360px]">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-[18px]">
          <TargetsCard
            targets={targets}
            onTargetChange={(field, value) => setTargets(prev => ({ ...prev, [field]: value }))}
            days={meals.length}
            toughDays={toughDays}
            onJump={onJump}
          />
          <MealGrid
            meals={meals}
            onMealsChange={setMeals}
            mealsLocked={mealsLocked}
            onToggleLock={() => setMealsLocked(v => !v)}
          />
          <ResupplySection stops={resupplyStops} onStopsChange={setResupplyStops} />
          <div className="grid grid-cols-2 gap-3.5 items-start">
            <WaterPlanCard filterPacked={waterChecks.filter} onToggle={toggleFilter} />
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
            <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
            <CheckItem text="Daily calories set"  done={item1} />
            <CheckItem text="Protein target"      done={item2} />
            <CheckItem text="Resupply confirmed"  done={item3} />
            <CheckItem text="Water cache ready"   done={item4} />
            <CheckItem text="Bear-can sized"      done={item5} />
            <CheckItem text="Trail meals locked"  done={item6} />
            <div className="h-px bg-border my-3" />
            <ProgressBar value={progress} tone="amber" />
            <div className="font-mono text-label text-text-dim text-center mt-1.5">{doneCount} of 6</div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Totals</div>
            <div className="grid grid-cols-2 gap-3">
              {totals.map(s => (
                <div key={s.label}>
                  <div className="font-heading text-sub font-extrabold text-amber leading-none">{s.value}</div>
                  <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mt-1">{s.label}</div>
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
      </div>
    </div>
  )
}
