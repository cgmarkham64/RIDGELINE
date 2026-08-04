import { Fragment, useState, useRef, useId, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Pill } from '../../Pill'
import { ProgressBar } from '../../ProgressBar'
import { CheckItem } from '../../CheckItem'
import { JumpChip } from '../../JumpChip'
import { IconPlus, IconX, IconAlertTriangle } from '../../../icons'
import type { StageBodyProps, ResupplyStop, MealItem, MealSlot, PlanMealEntry } from '../../types'
import type { Waypoint } from '../../../../types'
import { useAuthStore } from '../../../../store/auth'
import { api } from '../../../../lib/api'
import { WaypointIcon } from '../../../map/WaypointIcon'
import { WAYPOINT_COLOR } from '../../../map/constants'
import { DayMealDialog } from './DayMealDialog'

// ─── Types ────────────────────────────────────────────────────────────────────

type MealRow = PlanMealEntry

type LegacyMealEntry = {
  n: number; breakfast: string; lunch: string; dinner: string; snacks: string
  kcal: number; weightOz?: number
}

type TargetField = 'calories' | 'protein' | 'fat' | 'carbs'

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks']

// Rough backpacking calorie-burn model: baseline appetite (the account's daily
// calorie macro target, or this default) + fixed trail effort from mileage/gain.
const BASE_KCAL_PER_DAY         = 2600
const KCAL_PER_MILE             = 100
const KCAL_PER_1000FT_GAIN      = 150
const FEET_PER_KILOFOOT         = 1000
const TOUGH_DAY_KCAL_MULTIPLIER = 1.15
const KCAL_ROUNDING             = 50
const MS_PER_DAY                = 86_400_000
const HIGH_KCAL_THRESHOLD       = 3800
const MODERATE_KCAL_THRESHOLD   = 3000
const PERCENT_MULTIPLIER        = 100
const OZ_PER_LB                 = 16
const COORD_DECIMAL_PLACES      = 4

const TARGET_FIELDS: Array<{ key: TargetField; label: string; placeholder: string }> = [
  { key: 'calories', label: 'Calories / day', placeholder: 'e.g. 3,800' },
  { key: 'protein',  label: 'Protein / day',  placeholder: 'e.g. 120 g'  },
  { key: 'fat',      label: 'Fat / day',      placeholder: 'e.g. 80 g'   },
  { key: 'carbs',    label: 'Carbs / day',    placeholder: 'e.g. 400 g'  },
]

const STOP_TEXT_FIELDS: Array<{
  key: 'shipBy' | 'daysInBox' | 'holdAddress'; label: string; placeholder: string
}> = [
  { key: 'shipBy',      label: 'Ship by',      placeholder: 'Aug 1, 2026'            },
  { key: 'daysInBox',   label: 'Days in box',  placeholder: '4'                       },
  { key: 'holdAddress', label: 'Hold address', placeholder: 'Bishop PO, 585 Main St'  },
]

function demoItem(id: string, name: string, kcal: number, oz: number): MealItem {
  return { id, name, kcal, proteinG: 0, fatG: 0, carbsG: 0, weightOz: oz }
}

function deepCopyItems(items: Record<MealSlot, MealItem[]>): Record<MealSlot, MealItem[]> {
  return Object.fromEntries(
    MEAL_SLOTS.map(s => [s, items[s].map(item => ({ ...item, id: crypto.randomUUID() }))])
  ) as Record<MealSlot, MealItem[]>
}

// Placeholder itinerary shown before the user enters their own meals — every
// kcal/oz figure below is seed data, not a business threshold, so naming each
// literal wouldn't add clarity.
/* eslint-disable @typescript-eslint/no-magic-numbers */
const DEMO_MEALS: MealRow[] = [
  { n: 1, items: { breakfast: [demoItem('d1b', 'Granola + powder',       700, 3.5)], lunch: [demoItem('d1l', 'Tuna wrap',            875, 5.5)], dinner: [demoItem('d1d', 'Mtn House Beef Stew',  1050, 6.6)], snacks: [demoItem('d1s', '2 bars · gummies',     875, 6.4)] } },
  { n: 2, items: { breakfast: [demoItem('d2b', 'Oats + nut butter',      750, 3.8)], lunch: [demoItem('d2l', 'Salami + cheese',       925, 6.0)], dinner: [demoItem('d2d', 'Pad thai (Backpack)',  1110, 6.8)], snacks: [demoItem('d2s', '2 bars · jerky',        915, 7.4)] } },
  { n: 3, items: { breakfast: [demoItem('d3b', 'Granola + powder',       700, 3.5)], lunch: [demoItem('d3l', 'Tortilla pizza',        975, 6.2)], dinner: [demoItem('d3d', 'Mtn House Lasagna',   1170, 7.0)], snacks: [demoItem('d3s', '3 bars · gummies',    1055, 8.3)] } },
  { n: 4, items: { breakfast: [demoItem('d4b', 'Pop-tarts ×2',           880, 4.2)], lunch: [demoItem('d4l', 'Tuna wrap',            1100, 6.8)], dinner: [demoItem('d4d', 'Beans & rice',        1320, 8.4)], snacks: [demoItem('d4s', '3 bars · chocolate',  1100, 8.6)] } },
  { n: 5, items: { breakfast: [demoItem('d5b', 'Oats + nut butter',      750, 3.8)], lunch: [demoItem('d5l', 'Salami + cheese',       925, 6.0)], dinner: [demoItem('d5d', 'Mtn House Chicken',   1110, 6.8)], snacks: [demoItem('d5s', '2 bars · gummies',     915, 7.4)] } },
  { n: 6, items: { breakfast: [demoItem('d6b', 'Granola + powder',       700, 3.5)], lunch: [demoItem('d6l', 'PB tortilla',           975, 6.2)], dinner: [demoItem('d6d', 'Backpack curry',      1170, 7.0)], snacks: [demoItem('d6s', '3 bars · jerky',      1055, 8.3)] } },
  { n: 7, items: { breakfast: [demoItem('d7b', 'Pop-tarts ×2',           760, 3.6)], lunch: [demoItem('d7l', 'Tuna wrap',             950, 6.0)], dinner: [demoItem('d7d', 'Mtn House Lasagna',   1140, 6.8)], snacks: [demoItem('d7s', '3 bars · gummies',     950, 7.6)] } },
  { n: 8, items: { breakfast: [demoItem('d8b', 'Bar + coffee',            300, 1.6)], lunch: [demoItem('d8l', 'Burger @ Portal',      900, 4.2)], dinner: [],                                                   snacks: []                                                     } },
]
/* eslint-enable @typescript-eslint/no-magic-numbers */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function kcalCls(kcal: number): string {
  if (kcal >= HIGH_KCAL_THRESHOLD) return 'text-pine'
  if (kcal >= MODERATE_KCAL_THRESHOLD) return 'text-text-mid'
  return 'text-amber'
}

function itemSummary(items: MealItem[]): string {
  if (items.length === 0) return ''
  const first = items[0].name.trim()
  if (items.length === 1) return first || '—'
  return first ? `${first} +${items.length - 1}` : `${items.length} items`
}

function isLegacy(m: unknown): m is LegacyMealEntry {
  return typeof (m as LegacyMealEntry)?.breakfast === 'string'
}

function migrateMealEntry(old: LegacyMealEntry): MealRow {
  const toItems = (name: string): MealItem[] => {
    if (!name || name === '—') return []
    return [{ id: crypto.randomUUID(), name, kcal: 0, proteinG: 0, fatG: 0, carbsG: 0, weightOz: 0 }]
  }
  return {
    n: old.n,
    items: {
      breakfast: toItems(old.breakfast),
      lunch:     toItems(old.lunch),
      dinner:    toItems(old.dinner),
      snacks:    toItems(old.snacks),
    },
  }
}

function estimateDayKcalTarget(
  mi: number,
  gainFt: number,
  hard?: boolean,
  baseKcalPerDay = BASE_KCAL_PER_DAY
): number {
  const trailEffort = mi * KCAL_PER_MILE + (gainFt / FEET_PER_KILOFOOT) * KCAL_PER_1000FT_GAIN
  const base   = baseKcalPerDay + trailEffort
  const scaled = hard ? base * TOUGH_DAY_KCAL_MULTIPLIER : base
  return Math.round(scaled / KCAL_ROUNDING) * KCAL_ROUNDING
}

function blankMeals(startDate?: string, endDate?: string): MealRow[] {
  if (!startDate || !endDate) return []
  const days = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / MS_PER_DAY) + 1
  if (days <= 0) return []
  return Array.from({ length: days }, (_, i) => ({
    n: i + 1,
    items: { breakfast: [], lunch: [], dinner: [], snacks: [] },
  }))
}

// ─── Warning helpers ──────────────────────────────────────────────────────────

const TARGET_THRESHOLD = 0.10

interface RowWarning { field: string; pct: number; actual: number; target: number }

type RowTargets = { calories: string; protein: string; fat: string; carbs: string }

function parseTarget(str: string): number {
  return parseFloat(str.replace(/,/g, '')) || 0
}

function computeRowWarnings(row: MealRow, targets: RowTargets): RowWarning[] {
  const allItems = MEAL_SLOTS.flatMap(s => row.items[s])
  if (allItems.length === 0) return []
  const rowKcal    = allItems.reduce((sum, i) => sum + i.kcal     * (i.qty ?? 1), 0)
  const rowProtein = allItems.reduce((sum, i) => sum + i.proteinG * (i.qty ?? 1), 0)
  const rowFat     = allItems.reduce((sum, i) => sum + i.fatG     * (i.qty ?? 1), 0)
  const rowCarbs   = allItems.reduce((sum, i) => sum + i.carbsG   * (i.qty ?? 1), 0)
  const checks = [
    { field: 'kcal',    actual: rowKcal,    target: parseTarget(targets.calories) },
    { field: 'protein', actual: rowProtein, target: parseTarget(targets.protein)  },
    { field: 'fat',     actual: rowFat,     target: parseTarget(targets.fat)      },
    { field: 'carbs',   actual: rowCarbs,   target: parseTarget(targets.carbs)    },
  ]
  return checks.flatMap(({ field, actual, target }) => {
    if (!target || actual === 0) return []
    const pct = (actual - target) / target
    return Math.abs(pct) > TARGET_THRESHOLD
      ? [{ field, pct, actual: Math.round(actual), target: Math.round(target) }]
      : []
  })
}

function warningTooltip(warnings: RowWarning[]): string {
  return warnings.map(({ field, pct, actual, target }) => {
    const unit = field === 'kcal' ? '' : 'g'
    return `${field} ${pct > 0 ? 'over' : 'under'} ${Math.abs(Math.round(pct * PERCENT_MULTIPLIER))}% (${actual}${unit} vs ${target}${unit} target)`
  }).join(' · ')
}

// ─── TargetsCard ──────────────────────────────────────────────────────────────

function TargetsCard({ targets, suggestedAvgKcal, onTargetChange }: {
  targets: Record<TargetField, string>
  suggestedAvgKcal?: number
  onTargetChange: (field: TargetField, value: string) => void
}) {
  const uid = useId()
  const showSuggestion = suggestedAvgKcal !== undefined && targets.calories.trim() === ''
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
            {f.key === 'calories' && showSuggestion && (
              <button
                type="button"
                onClick={() => onTargetChange('calories', String(suggestedAvgKcal))}
                className="font-mono text-label text-amber hover:underline cursor-pointer mt-1 text-left"
              >
                Suggested {suggestedAvgKcal.toLocaleString()} (from route) · use
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MealGrid ─────────────────────────────────────────────────────────────────

function MealGrid({ meals, targets, suggestedKcalByDay, toughDayNumbers, onDayClick }: {
  meals: MealRow[]
  targets: RowTargets
  suggestedKcalByDay: Map<number, number>
  toughDayNumbers: Set<number>
  onDayClick: (idx: number) => void
}) {
  const manualKcalSet  = parseTarget(targets.calories) > 0
  // Days without a manual calorie target fall back to the route-derived suggestion for that day.
  const effectiveTargets: RowTargets[] = meals.map(m => {
    if (manualKcalSet) return targets
    const suggested = suggestedKcalByDay.get(m.n)
    return suggested ? { ...targets, calories: String(suggested) } : targets
  })
  const allRowWarnings = meals.map((m, i) => computeRowWarnings(m, effectiveTargets[i]))
  const offTargetDays  = allRowWarnings.reduce<number[]>((acc, w, i) => w.length > 0 ? [...acc, i] : acc, [])

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Meal plan</span>
        <span className="font-mono text-label text-text-dim">
          {meals.length} {meals.length === 1 ? 'day' : 'days'} · click any row to edit
        </span>
      </div>

      {offTargetDays.length > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-dim border-b border-amber-border">
          <IconAlertTriangle size={16} />
          <p className="font-mono text-label text-amber">
            {offTargetDays.map(i => `D${meals[i].n}`).join(' · ')}{' '}
            {offTargetDays.length === 1 ? 'is' : 'are'} more than {TARGET_THRESHOLD * PERCENT_MULTIPLIER}% off target
          </p>
        </div>
      )}

      <div className="grid px-4 py-2 bg-surface-2 border-b border-border font-mono text-label tracking-[0.12em] uppercase text-text-dim grid-cols-[60px_1fr_1fr_1fr_1fr_56px_64px]">
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
      ) : meals.map((m, rowIdx) => {
        const allItems   = MEAL_SLOTS.flatMap(s => m.items[s])
        const rowKcal    = allItems.reduce((sum, i) => sum + i.kcal     * (i.qty ?? 1), 0)
        const rowOz      = allItems.reduce((sum, i) => sum + i.weightOz * (i.qty ?? 1), 0)
        const rowWarnings = allRowWarnings[rowIdx]
        const hasWarning  = rowWarnings.length > 0
        const rowTargetKcal   = parseTarget(effectiveTargets[rowIdx].calories)
        const isTough         = toughDayNumbers.has(m.n)
        const isSuggestedKcal = !manualKcalSet && suggestedKcalByDay.has(m.n)

        const kcalColor = rowKcal === 0
          ? 'text-text-dim'
          : rowTargetKcal > 0
            ? Math.abs((rowKcal - rowTargetKcal) / rowTargetKcal) <= TARGET_THRESHOLD ? 'text-pine' : 'text-amber'
            : kcalCls(rowKcal)

        const tooltip = [
          hasWarning ? warningTooltip(rowWarnings) : null,
          isTough ? 'Tough day' : null,
          isSuggestedKcal ? `target auto-suggested from route (${rowTargetKcal.toLocaleString()} kcal)` : null,
        ].filter(Boolean).join(' · ') || undefined

        return (
          <button
            key={m.n}
            type="button"
            onClick={() => onDayClick(rowIdx)}
            title={tooltip}
            className={`grid items-center px-4 gap-2 grid-cols-[60px_1fr_1fr_1fr_1fr_56px_64px] w-full text-left hover:bg-surface-2 transition-colors cursor-pointer ${rowIdx < meals.length - 1 ? 'border-b border-border' : ''}`}
          >
            <div className="flex items-center gap-1.5 py-2.5">
              <IconAlertTriangle size={16} className={hasWarning ? 'text-amber' : 'invisible'} />
              <span
                className={`font-mono text-label font-bold text-amber text-center flex-1 py-0.5 bg-amber-dim rounded border ${isTough ? 'border-amber' : 'border-amber-border'}`}
              >
                D{m.n}
              </span>
            </div>
            {MEAL_SLOTS.map(slot => {
              const summary = itemSummary(m.items[slot])
              return (
                <span
                  key={slot}
                  className={`text-fine truncate leading-snug py-2.5 ${summary ? 'text-text' : 'text-text-dim'}`}
                >
                  {summary || '—'}
                </span>
              )
            })}
            <span className={`font-mono text-fine text-right py-2.5 ${rowOz ? 'text-text-mid' : 'text-text-dim'}`}>
              {rowOz ? rowOz.toFixed(1) : '—'}
            </span>
            <span className={`font-mono text-fine text-right py-2.5 ${kcalColor}`}>
              {rowKcal ? rowKcal.toLocaleString() : '—'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── ResupplySection ──────────────────────────────────────────────────────────

const RESUPPLY_COLOR = WAYPOINT_COLOR['resupply']

function SegmentStrip({ label, fromDay, toDay, meals }: {
  label: string; fromDay: number; toDay: number; meals: MealRow[]
}) {
  if (toDay < fromDay) return null
  const segMeals = meals.filter(m => m.n >= fromDay && m.n <= toDay)
  const allItems  = segMeals.flatMap(m => MEAL_SLOTS.flatMap(s => m.items[s]))
  const kcal = allItems.reduce((s, i) => s + i.kcal     * (i.qty ?? 1), 0)
  const oz   = allItems.reduce((s, i) => s + i.weightOz * (i.qty ?? 1), 0)
  const days = toDay - fromDay + 1
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded bg-surface-2 border border-border">
      <span className="font-mono text-label tracking-[0.1em] uppercase font-bold text-amber shrink-0">{label}</span>
      <span className="font-mono text-label text-text-dim shrink-0">D{fromDay}–D{toDay}</span>
      <span className="font-mono text-label text-text-dim shrink-0">· {days} {days === 1 ? 'day' : 'days'}</span>
      <span className="flex-1" />
      {kcal > 0
        ? <span className="font-mono text-label text-text-mid shrink-0">{kcal.toLocaleString()} kcal · {(oz / OZ_PER_LB).toFixed(1)} lb</span>
        : <span className="font-mono text-label text-text-dim italic shrink-0">no meals planned</span>
      }
    </div>
  )
}

function ResupplySection({
  waypoints,
  stops,
  meals,
  onStopsChange,
  onRemoveWaypoint,
  onAddStop,
}: {
  waypoints: Waypoint[]
  stops: ResupplyStop[]
  meals: MealRow[]
  onStopsChange: (stops: ResupplyStop[]) => void
  onRemoveWaypoint: (waypointId: string) => void
  onAddStop: () => void
}) {
  const uid = useId()

  function getStopData(waypointId: string): ResupplyStop {
    return stops.find(s => s.id === waypointId) ?? {
      id: waypointId, name: '', resupplyDay: '', shipBy: '', daysInBox: '', holdAddress: '', status: 'unconfirmed',
    }
  }

  function updateStop(waypointId: string, patch: Partial<ResupplyStop>) {
    const existing = stops.find(s => s.id === waypointId)
    if (existing) {
      onStopsChange(stops.map(s => s.id === waypointId ? { ...s, ...patch } : s))
    } else {
      onStopsChange([...stops, { ...getStopData(waypointId), ...patch }])
    }
  }

  function removeStop(waypointId: string) {
    onStopsChange(stops.filter(s => s.id !== waypointId))
    onRemoveWaypoint(waypointId)
  }

  // Sort stops by resupplyDay — valid day numbers first, unsorted ones at the end
  const stopsOrdered = waypoints
    .map(wp => ({ wp, stop: getStopData(wp.id), day: parseInt(getStopData(wp.id).resupplyDay) || 0 }))
    .sort((a, b) => {
      if (a.day > 0 && b.day > 0) return a.day - b.day
      if (a.day > 0) return -1
      if (b.day > 0) return 1
      return 0
    })

  const totalDays       = meals.length
  const firstValidDay   = stopsOrdered.find(s => s.day > 0)?.day ?? 0
  const showTimeline    = firstValidDay > 0 && totalDays > 0

  return (
    <div className="flex flex-col gap-3">
      {waypoints.length === 0 && (
        <div className="bg-surface border border-dashed border-border rounded-lg px-4 py-6 text-center">
          <p className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1.5">No resupply stops</p>
          <p className="text-body-sm text-text-mid">Add a resupply waypoint to the route map — it will appear here for planning.</p>
        </div>
      )}

      {/* "Carry in" — days before the first stop */}
      {showTimeline && (
        <SegmentStrip label="Carry in" fromDay={1} toDay={firstValidDay} meals={meals} />
      )}

      {stopsOrdered.map((item, i) => {
        const nextItem    = stopsOrdered[i + 1]
        const boxFromDay  = item.day > 0 ? item.day + 1 : null
        const boxToDay    = nextItem ? (nextItem.day > 0 ? nextItem.day : null)
                                     : (totalDays > 0 ? totalDays : null)
        const showBox     = showTimeline && boxFromDay !== null && boxToDay !== null && boxFromDay <= boxToDay

        return (
          <Fragment key={item.wp.id}>
            <div className="bg-surface border border-border rounded-lg p-[18px]">
              <div className="flex items-start gap-3 mb-4">
                <span
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${RESUPPLY_COLOR}18`, border: `1px solid ${RESUPPLY_COLOR}44` }}
                >
                  <WaypointIcon type="resupply" size={16} />
                </span>
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="font-heading text-body-sm font-extrabold text-text">{item.wp.label}</span>
                  <span className="font-mono text-label text-text-dim">{item.wp.lat.toFixed(COORD_DECIMAL_PLACES)}, {item.wp.lon.toFixed(COORD_DECIMAL_PLACES)}</span>
                  <div className="flex items-center gap-1.5 ml-auto shrink-0">
                    <span className="font-mono text-label text-text-dim">Day</span>
                    <input
                      className="w-10 bg-surface-2 border border-border rounded-sm px-1.5 py-1 font-mono text-label text-text outline-none focus:border-border-mid transition-colors text-center"
                      placeholder="—"
                      value={item.stop.resupplyDay}
                      onChange={e => updateStop(item.wp.id, { resupplyDay: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Pill tone={item.stop.status === 'shipped' ? 'pine' : 'amber'}>
                    {item.stop.status === 'shipped' ? 'Shipped' : 'Unconfirmed'}
                  </Pill>
                  <button
                    type="button"
                    onClick={() => removeStop(item.wp.id)}
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
                      htmlFor={`${uid}-${item.wp.id}-${f.key}`}
                      className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1 block"
                    >
                      {f.label}
                    </label>
                    <input
                      id={`${uid}-${item.wp.id}-${f.key}`}
                      className="w-full px-2.5 py-1.5 border border-border rounded-sm text-body-sm bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors placeholder:text-text-dim"
                      placeholder={f.placeholder}
                      value={item.stop[f.key]}
                      onChange={e => updateStop(item.wp.id, { [f.key]: e.target.value })}
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
                  onClick={() => updateStop(item.wp.id, { status: item.stop.status === 'shipped' ? 'unconfirmed' : 'shipped' })}
                  className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
                >
                  {item.stop.status === 'shipped' ? 'Mark unshipped' : 'Mark shipped'}
                </button>
              </div>
            </div>

            {/* Segment strip for the days covered by the box picked up at this stop */}
            {showBox && (
              <SegmentStrip
                label={`Box ${i + 1}`}
                fromDay={boxFromDay!}
                toDay={boxToDay!}
                meals={meals}
              />
            )}
          </Fragment>
        )
      })}

      <button
        type="button"
        onClick={onAddStop}
        className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer self-start"
      >
        <IconPlus size={10} /> Add resupply stop
      </button>
    </div>
  )
}

// ─── BearCanNeedCard ──────────────────────────────────────────────────────────
// Flags whether this trip needs a bear canister at all; the specific model is
// chosen in the Gear stage, where it counts toward the loadout weight.

const BEAR_CAN_NEED_OPTIONS: Array<{ id: 'not_needed' | 'recommended' | 'required'; label: string }> = [
  { id: 'not_needed',  label: 'Not needed'  },
  { id: 'recommended', label: 'Recommended' },
  { id: 'required',    label: 'Required'    },
]

function BearCanNeedCard({ need, onChange, onJump }: {
  need: string
  onChange: (v: 'not_needed' | 'recommended' | 'required') => void
  onJump: (id: string) => void
}) {
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
              need === opt.id ? 'bg-amber-dim text-amber' : 'text-text-dim hover:text-text-mid'
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

// ─── FoodStage ────────────────────────────────────────────────────────────────

export function FoodStage({ plan, onChange, onProgress, trip, onJump }: StageBodyProps) {
  const macroDefaults = useAuthStore(s => s.user?.preferences?.macroTargets)
  const qc = useQueryClient()
  const f = plan?.food

  const legacy = f as { resupplyFields?: Record<string, string>; resupplyStatus?: 'unconfirmed' | 'shipped' } | undefined
  const migratedStops: ResupplyStop[] =
    legacy?.resupplyFields?.holdAddress || legacy?.resupplyFields?.shipBy
      ? [{
          id: 'legacy', name: '', resupplyDay: '',
          shipBy:      legacy.resupplyFields!.shipBy      ?? '',
          daysInBox:   legacy.resupplyFields!.daysInBox   ?? '',
          holdAddress: legacy.resupplyFields!.holdAddress ?? '',
          status:      legacy.resupplyStatus              ?? 'unconfirmed',
        }]
      : []

  const [meals, setMeals] = useState<MealRow[]>(() => {
    if (f?.meals !== undefined) {
      return (f.meals as unknown[]).map(m => isLegacy(m) ? migrateMealEntry(m) : m as MealRow)
    }
    if (plan !== undefined) return blankMeals(trip?.startDate, trip?.endDate)
    return DEMO_MEALS
  })
  const [mealsLocked, setMealsLocked]     = useState(() => f?.mealsLocked  ?? false)
  const [resupplyStops, setResupplyStops] = useState<ResupplyStop[]>(() => f?.resupplyStops ?? migratedStops)
  const [bearCanNeed, setBearCanNeed]     = useState<'' | 'required' | 'recommended' | 'not_needed'>(() => f?.bearCanNeed ?? '')
  const [targets, setTargets]             = useState<Record<TargetField, string>>(() => {
    const t = f?.targets as Record<string, string> | undefined
    if (t) return { calories: t.calories ?? '', protein: t.protein ?? '', fat: t.fat ?? '', carbs: t.carbs ?? '' }
    return {
      calories: macroDefaults?.calories ?? '',
      protein:  macroDefaults?.protein  ?? '',
      fat:      macroDefaults?.fat      ?? '',
      carbs:    macroDefaults?.carbs    ?? '',
    }
  })
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null)

  const routeSegments    = plan?.route?.segments ?? []
  const toughDays        = routeSegments.filter(s => s.hard).map(s => s.n)
  const toughDayNumbers  = new Set(toughDays)

  const accountBaseKcal = parseTarget(macroDefaults?.calories ?? '')
  const baseKcalPerDay  = accountBaseKcal > 0 ? accountBaseKcal : BASE_KCAL_PER_DAY

  const suggestedKcalByDay = new Map(
    routeSegments.map(s => [s.n, estimateDayKcalTarget(s.mi, s.gain, s.hard, baseKcalPerDay)])
  )
  const suggestedAvgKcal = suggestedKcalByDay.size > 0
    ? Math.round(
        Array.from(suggestedKcalByDay.values()).reduce((sum, v) => sum + v, 0)
        / suggestedKcalByDay.size / KCAL_ROUNDING
      ) * KCAL_ROUNDING
    : undefined

  const isMounted   = useRef(false)
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ food: { meals, mealsLocked, resupplyStops, bearCanNeed: bearCanNeed || undefined, targets } })
  }, [meals, mealsLocked, resupplyStops, bearCanNeed, targets])

  const resupplyWaypoints = (trip?.waypoints ?? []).filter(w => w.type === 'resupply')

  async function handleRemoveWaypoint(waypointId: string) {
    if (!trip?._id) return
    const updated = (trip.waypoints ?? []).filter(w => w.id !== waypointId)
    try {
      await api.put(`/api/trips/${trip._id}`, { waypoints: updated })
      qc.invalidateQueries({ queryKey: ['plan', trip._id] })
    } catch { /* waypoint will reappear on next load */ }
  }

  const item1 = targets.calories.trim() !== ''
  const item2 = targets.protein.trim()  !== ''
  const item3 = resupplyWaypoints.length === 0
    || resupplyWaypoints.every(wp => resupplyStops.find(s => s.id === wp.id)?.status === 'shipped')
  const item4 = bearCanNeed !== ''
  const item5 = mealsLocked
  const checklistItems = [item1, item2, item3, item4, item5]
  const doneCount = checklistItems.filter(Boolean).length
  const progress  = Math.round((doneCount / checklistItems.length) * PERCENT_MULTIPLIER)

  const onProgressRef = useRef(onProgress)
  useEffect(() => { onProgressRef.current = onProgress })
  useEffect(() => { onProgressRef.current?.(doneCount, checklistItems.length) }, [doneCount, checklistItems.length])

  const allItems      = meals.flatMap(m => MEAL_SLOTS.flatMap(s => m.items[s]))
  const kcalTotal     = allItems.reduce((sum, i) => sum + i.kcal     * (i.qty ?? 1), 0)
  const totalWeightOz = allItems.reduce((sum, i) => sum + i.weightOz * (i.qty ?? 1), 0)
  const foodWeightStr = totalWeightOz > 0 ? `${(totalWeightOz / OZ_PER_LB).toFixed(1)} lb` : '—'

  const totals = [
    { value: kcalTotal > 0 ? kcalTotal.toLocaleString() : '—', label: 'kcal total'  },
    { value: foodWeightStr,                                      label: 'food weight' },
  ]

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
            suggestedAvgKcal={suggestedAvgKcal}
            onTargetChange={(field, value) => setTargets(prev => ({ ...prev, [field]: value }))}
          />
          <MealGrid
            meals={meals}
            targets={targets}
            suggestedKcalByDay={suggestedKcalByDay}
            toughDayNumbers={toughDayNumbers}
            onDayClick={setActiveDayIdx}
          />
          <ResupplySection
            waypoints={resupplyWaypoints}
            stops={resupplyStops}
            meals={meals}
            onStopsChange={setResupplyStops}
            onRemoveWaypoint={handleRemoveWaypoint}
            onAddStop={() => onJump('route')}
          />
          <BearCanNeedCard
            need={bearCanNeed}
            onChange={setBearCanNeed}
            onJump={onJump}
          />
        </div>

        {/* ── Right rail ── */}
        <aside className="flex flex-col gap-3.5">

          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
            <CheckItem text="Daily calories set"  done={item1} />
            <CheckItem text="Protein target"      done={item2} />
            <CheckItem text="Resupply confirmed"  done={item3} />
            <CheckItem text="Bear-can need set"   done={item4} />
            <CheckItem text="Trail meals locked"  done={item5} onToggle={() => setMealsLocked(v => !v)} />
            <div className="h-px bg-border my-3" />
            <ProgressBar value={progress} tone="amber" />
            <div className="font-mono text-label text-text-dim text-center mt-1.5">{doneCount} of {checklistItems.length}</div>
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

      {activeDayIdx !== null && (
        <DayMealDialog
          day={meals[activeDayIdx]}
          dayIndex={activeDayIdx}
          totalDays={meals.length}
          onSave={updated => setMeals(prev => prev.map((m, i) => i === activeDayIdx ? updated : m))}
          onCopyTo={indices => {
            const source = meals[activeDayIdx]
            setMeals(prev => prev.map((m, i) => indices.includes(i) ? { ...m, items: deepCopyItems(source.items) } : m))
          }}
          onClose={() => setActiveDayIdx(null)}
        />
      )}
    </div>
  )
}
