import { useState, useRef, useEffect } from 'react'
import { IconX, IconPlus, IconSearch } from '../../../icons'
import { lookupMacros } from '../../../../lib/food'
import type { MacroResult } from '../../../../lib/food'
import type { MealItem, MealSlot, PlanMealEntry } from '../../types'
import { Modal } from '../../../ui/Modal'

type MealRow = PlanMealEntry
type WeightUnit = 'oz' | 'g'

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks']
const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
}

const G_PER_OZ = 28.3495

function blankItem(): MealItem {
  return { id: crypto.randomUUID(), name: '', kcal: 0, proteinG: 0, fatG: 0, carbsG: 0, weightOz: 0 }
}

function ozToDisplay(oz: number, unit: WeightUnit): string {
  if (oz === 0) return ''
  return unit === 'g' ? String(Math.round(oz * G_PER_OZ)) : String(oz)
}

function displayToOz(value: string, unit: WeightUnit): number {
  const n = Number(value) || 0
  return unit === 'g' ? Number((n / G_PER_OZ).toFixed(2)) : n
}

const INPUT_CLS = 'bg-surface border border-border rounded-sm px-1.5 py-1 font-mono text-fine text-text outline-none focus:border-border-mid transition-colors w-full'

function ItemRow({ item, isLoading, weightUnit, candidates, onUpdate, onRemove, onLookup, onSelectCandidate, onDismissCandidates }: {
  item: MealItem
  isLoading: boolean
  weightUnit: WeightUnit
  candidates: MacroResult[]
  onUpdate: (patch: Partial<MealItem>) => void
  onRemove: () => void
  onLookup: (name: string) => void
  onSelectCandidate: (c: MacroResult) => void
  onDismissCandidates: () => void
}) {
  return (
    <div className="bg-surface-2 border border-border rounded-lg p-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <input
          className={`flex-1 ${INPUT_CLS} text-body-sm`}
          placeholder="Item name…"
          value={item.name}
          onChange={e => onUpdate({ name: e.target.value })}
        />
        <button
          type="button"
          onClick={() => item.name.trim() && onLookup(item.name.trim())}
          disabled={isLoading || !item.name.trim()}
          title="Search for nutrition info"
          className="shrink-0 inline-flex items-center gap-1 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2 py-1 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading
            ? <span className="w-3 h-3 rounded-full border-2 border-amber border-t-transparent animate-spin inline-block" />
            : <IconSearch />
          }
          {!isLoading && 'Lookup'}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-text-dim hover:text-text transition-colors cursor-pointer"
          aria-label="Remove item"
        >
          <IconX size={13} />
        </button>
      </div>

      {candidates.length > 0 && (
        <div className="rounded border border-amber-border overflow-hidden">
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-amber-dim border-b border-amber-border">
            <span className="font-mono text-label tracking-[0.12em] uppercase text-amber">Select a result</span>
            <button
              type="button"
              onClick={onDismissCandidates}
              className="text-amber hover:text-text transition-colors cursor-pointer"
            >
              <IconX size={11} />
            </button>
          </div>
          {candidates.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectCandidate(c)}
              className="w-full text-left px-2.5 py-2 border-t border-border first:border-0 hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <div className="font-mono text-fine text-text truncate">{c.note}</div>
              <div className="font-mono text-label text-text-dim mt-0.5">
                {c.kcal} kcal · {c.proteinG}P · {c.fatG}F · {c.carbsG}C · {ozToDisplay(c.weightOz, weightUnit) || '—'} {weightUnit}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-6 gap-1.5">
        <div>
          <label className="font-mono text-label text-text-dim block mb-0.5">qty</label>
          <input
            type="number"
            min={1}
            step={1}
            className={`${INPUT_CLS} text-center`}
            value={item.qty ?? 1}
            onChange={e => onUpdate({ qty: Math.max(1, parseInt(e.target.value) || 1) })}
          />
        </div>
        <div>
          <label className="font-mono text-label text-text-dim block mb-0.5">kcal</label>
          <input type="number" min={0} className={INPUT_CLS} placeholder="0" value={item.kcal || ''} onChange={e => onUpdate({ kcal: Number(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="font-mono text-label text-text-dim block mb-0.5">P (g)</label>
          <input type="number" min={0} className={INPUT_CLS} placeholder="0" value={item.proteinG || ''} onChange={e => onUpdate({ proteinG: Number(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="font-mono text-label text-text-dim block mb-0.5">F (g)</label>
          <input type="number" min={0} className={INPUT_CLS} placeholder="0" value={item.fatG || ''} onChange={e => onUpdate({ fatG: Number(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="font-mono text-label text-text-dim block mb-0.5">C (g)</label>
          <input type="number" min={0} className={INPUT_CLS} placeholder="0" value={item.carbsG || ''} onChange={e => onUpdate({ carbsG: Number(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="font-mono text-label text-text-dim block mb-0.5">weight ({weightUnit})</label>
          <input
            type="number"
            min={0}
            className={INPUT_CLS}
            placeholder="0"
            value={ozToDisplay(item.weightOz, weightUnit)}
            onChange={e => onUpdate({ weightOz: displayToOz(e.target.value, weightUnit) })}
          />
        </div>
      </div>
      {item.lookupNote && (
        <p className="font-mono text-label text-text-dim truncate" title={item.lookupNote}>
          ↳ {item.lookupNote}
        </p>
      )}
    </div>
  )
}

function SlotSection({ slot, items, loading, weightUnit, pendingCandidates, onAdd, onUpdate, onRemove, onLookup, onSelectCandidate, onDismissCandidates }: {
  slot: MealSlot
  items: MealItem[]
  loading: Set<string>
  weightUnit: WeightUnit
  pendingCandidates: Record<string, MacroResult[]>
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<MealItem>) => void
  onRemove: (id: string) => void
  onLookup: (id: string, name: string) => void
  onSelectCandidate: (id: string, c: MacroResult) => void
  onDismissCandidates: (id: string) => void
}) {
  return (
    <div>
      <div className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-2">
        {SLOT_LABELS[slot]}
      </div>
      <div className="flex flex-col gap-2">
        {items.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            isLoading={loading.has(item.id)}
            weightUnit={weightUnit}
            candidates={pendingCandidates[item.id] ?? []}
            onUpdate={patch => onUpdate(item.id, patch)}
            onRemove={() => onRemove(item.id)}
            onLookup={name => onLookup(item.id, name)}
            onSelectCandidate={c => onSelectCandidate(item.id, c)}
            onDismissCandidates={() => onDismissCandidates(item.id)}
          />
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="self-start inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-dashed border-border text-text-dim hover:border-border-mid hover:text-text-mid transition-colors cursor-pointer"
        >
          <IconPlus size={10} /> Add item
        </button>
      </div>
    </div>
  )
}

export function DayMealDialog({ day, dayIndex, totalDays, onSave, onCopyTo, onClose }: {
  day: MealRow
  dayIndex: number
  totalDays: number
  onSave: (updated: MealRow) => void
  onCopyTo: (targetIndices: number[]) => void
  onClose: () => void
}) {
  const [slots, setSlots] = useState<Record<MealSlot, MealItem[]>>(() => ({
    breakfast: [...day.items.breakfast],
    lunch:     [...day.items.lunch],
    dinner:    [...day.items.dinner],
    snacks:    [...day.items.snacks],
  }))
  const [loading, setLoading]                   = useState<Set<string>>(new Set())
  const [pendingCandidates, setPendingCandidates] = useState<Record<string, MacroResult[]>>({})
  const [weightUnit, setWeightUnit]               = useState<WeightUnit>('oz')
  const [showCopyPicker, setShowCopyPicker]       = useState(false)
  const [copyTargets, setCopyTargets]             = useState<Set<number>>(new Set())
  const onSaveRef = useRef(onSave)
  useEffect(() => { onSaveRef.current = onSave })

  function toggleCopyTarget(i: number) {
    setCopyTargets(prev => {
      const next = new Set(prev)
      if (next.has(i)) { next.delete(i) } else { next.add(i) }
      return next
    })
  }

  function applyCopy() {
    onCopyTo([...copyTargets])
    setShowCopyPicker(false)
    setCopyTargets(new Set())
  }

  function applyUpdate(updated: Record<MealSlot, MealItem[]>) {
    setSlots(updated)
    onSaveRef.current({ ...day, items: updated })
  }

  function addItem(slot: MealSlot) {
    applyUpdate({ ...slots, [slot]: [...slots[slot], blankItem()] })
  }

  function updateItem(slot: MealSlot, id: string, patch: Partial<MealItem>) {
    applyUpdate({ ...slots, [slot]: slots[slot].map(i => i.id === id ? { ...i, ...patch } : i) })
  }

  function removeItem(slot: MealSlot, id: string) {
    applyUpdate({ ...slots, [slot]: slots[slot].filter(i => i.id !== id) })
  }

  function selectCandidate(slot: MealSlot, id: string, c: MacroResult) {
    setPendingCandidates(prev => { const next = { ...prev }; delete next[id]; return next })
    updateItem(slot, id, {
      kcal:       c.kcal,
      proteinG:   c.proteinG,
      fatG:       c.fatG,
      carbsG:     c.carbsG,
      weightOz:   c.weightOz,
      lookupNote: c.note,
    })
  }

  function dismissCandidates(id: string) {
    setPendingCandidates(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  async function lookupItem(id: string, name: string) {
    setLoading(prev => new Set(prev).add(id))
    try {
      const candidates = await lookupMacros(name)
      setPendingCandidates(prev => ({ ...prev, [id]: candidates }))
    } catch {
      // leave unchanged on error
    } finally {
      setLoading(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const allItems    = SLOTS.flatMap(s => slots[s])
  const dayKcal     = allItems.reduce((sum, i) => sum + i.kcal     * (i.qty ?? 1), 0)
  const dayWeightOz = allItems.reduce((sum, i) => sum + i.weightOz * (i.qty ?? 1), 0)
  const dayProtein  = allItems.reduce((sum, i) => sum + i.proteinG * (i.qty ?? 1), 0)
  const dayFat      = allItems.reduce((sum, i) => sum + i.fatG     * (i.qty ?? 1), 0)
  const dayCarbs    = allItems.reduce((sum, i) => sum + i.carbsG   * (i.qty ?? 1), 0)
  const hasMacros   = dayProtein > 0 || dayFat > 0 || dayCarbs > 0

  const dayWeightDisplay = dayWeightOz > 0
    ? weightUnit === 'g'
      ? `${Math.round(dayWeightOz * G_PER_OZ)} g`
      : `${dayWeightOz.toFixed(1)} oz`
    : null

  return (
    <Modal
      onClose={onClose}
      panelClassName="bg-surface border border-border rounded-lg w-full max-w-[680px] mx-4 flex flex-col max-h-[82vh]"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
        <span className="font-mono text-label font-bold text-amber bg-amber-dim border border-amber-border px-2 py-0.5 rounded">
          D{day.n}
        </span>
        <span className="font-heading text-body-sm font-extrabold text-text">Meal plan</span>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex rounded border border-border overflow-hidden">
            {(['oz', 'g'] as const).map(u => (
              <button
                key={u}
                type="button"
                onClick={() => setWeightUnit(u)}
                className={`font-mono text-label px-2.5 py-1 transition-colors cursor-pointer ${
                  weightUnit === u ? 'bg-amber-dim text-amber' : 'text-text-dim hover:text-text-mid'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-dim hover:text-text transition-colors cursor-pointer"
          >
            <IconX size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto p-5 flex flex-col gap-5">
        {SLOTS.map(slot => (
          <SlotSection
            key={slot}
            slot={slot}
            items={slots[slot]}
            loading={loading}
            weightUnit={weightUnit}
            pendingCandidates={pendingCandidates}
            onAdd={() => addItem(slot)}
            onUpdate={(id, patch) => updateItem(slot, id, patch)}
            onRemove={id => removeItem(slot, id)}
            onLookup={lookupItem}
            onSelectCandidate={(id, c) => selectCandidate(slot, id, c)}
            onDismissCandidates={id => dismissCandidates(id)}
          />
        ))}
      </div>

      <div className="border-t border-border px-5 pt-2 pb-1 shrink-0">
        <p className="font-mono text-label text-text-dim">Lookup results are AI-assisted estimates · verify against product label</p>
      </div>

      {showCopyPicker && (
        <div className="border-t border-border px-5 py-3 bg-surface-2 shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Copy to days</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCopyTargets(new Set(Array.from({ length: totalDays }, (_, i) => i).filter(i => i !== dayIndex)))}
                className="font-mono text-label text-text-dim hover:text-text transition-colors cursor-pointer"
              >
                all
              </button>
              <span className="font-mono text-label text-text-dim">·</span>
              <button
                type="button"
                onClick={() => setCopyTargets(new Set())}
                className="font-mono text-label text-text-dim hover:text-text transition-colors cursor-pointer"
              >
                none
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from({ length: totalDays }, (_, i) => i).filter(i => i !== dayIndex).map(i => (
              <button
                key={i}
                type="button"
                onClick={() => toggleCopyTarget(i)}
                className={`font-mono text-label px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  copyTargets.has(i)
                    ? 'border-amber-border bg-amber-dim text-amber'
                    : 'border-border text-text-dim hover:border-border-mid hover:text-text-mid'
                }`}
              >
                D{i + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyCopy}
              disabled={copyTargets.size === 0}
              className="inline-flex items-center font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Copy to {copyTargets.size > 0 ? `${copyTargets.size} day${copyTargets.size > 1 ? 's' : ''}` : 'days'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCopyPicker(false); setCopyTargets(new Set()) }}
              className="font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-dim hover:border-border-mid hover:text-text-mid transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="px-5 py-3 flex items-center gap-4 shrink-0 flex-wrap">
        <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Day totals</span>
        <span className="font-heading text-body-sm font-extrabold text-amber">
          {dayKcal > 0 ? dayKcal.toLocaleString() : '—'} kcal
        </span>
        {hasMacros && (
          <span className="font-mono text-fine text-text-mid">
            {dayProtein}P · {dayFat}F · {dayCarbs}C
          </span>
        )}
        {dayWeightDisplay && (
          <span className="font-mono text-fine text-text-mid">{dayWeightDisplay}</span>
        )}
        {totalDays > 1 && (
          <button
            type="button"
            onClick={() => setShowCopyPicker(v => !v)}
            className={`font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border transition-colors cursor-pointer ${
              showCopyPicker
                ? 'border-amber-border bg-amber-dim text-amber'
                : 'border-border text-text-dim hover:border-border-mid hover:text-text-mid'
            }`}
          >
            Copy to days…
          </button>
        )}
        <button type="button" onClick={onClose} className="ml-auto btn btn-ghost">
          Done
        </button>
      </div>
    </Modal>
  )
}
