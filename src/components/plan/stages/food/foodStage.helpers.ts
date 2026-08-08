import type { MealItem, MealSlot } from '../../types'
import type { MealRow, LegacyMealEntry, RowTargets, RowWarning, TargetField } from './foodStage.types'

// ─── Constants ────────────────────────────────────────────────────────────────

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks']

// Rough backpacking calorie-burn model: baseline appetite (the account's daily
// calorie macro target, or this default) + fixed trail effort from mileage/gain.
export const BASE_KCAL_PER_DAY         = 2600
export const KCAL_PER_MILE             = 100
export const KCAL_PER_1000FT_GAIN      = 150
export const FEET_PER_KILOFOOT         = 1000
export const TOUGH_DAY_KCAL_MULTIPLIER = 1.15
export const KCAL_ROUNDING             = 50
export const MS_PER_DAY                = 86_400_000
export const HIGH_KCAL_THRESHOLD       = 3800
export const MODERATE_KCAL_THRESHOLD   = 3000
export const PERCENT_MULTIPLIER        = 100
export const OZ_PER_LB                 = 16
export const COORD_DECIMAL_PLACES      = 4
export const TARGET_THRESHOLD          = 0.10

export const TARGET_FIELDS: Array<{ key: TargetField; label: string; placeholder: string }> = [
  { key: 'calories', label: 'Calories / day', placeholder: 'e.g. 3,800' },
  { key: 'protein',  label: 'Protein / day',  placeholder: 'e.g. 120 g'  },
  { key: 'fat',      label: 'Fat / day',      placeholder: 'e.g. 80 g'   },
  { key: 'carbs',    label: 'Carbs / day',    placeholder: 'e.g. 400 g'  },
]

export const STOP_TEXT_FIELDS: Array<{
  key: 'shipBy' | 'daysInBox' | 'holdAddress'; label: string; placeholder: string
}> = [
  { key: 'shipBy',      label: 'Ship by',      placeholder: 'Aug 1, 2026'            },
  { key: 'daysInBox',   label: 'Days in box',  placeholder: '4'                       },
  { key: 'holdAddress', label: 'Hold address', placeholder: 'Bishop PO, 585 Main St'  },
]

export const BEAR_CAN_NEED_OPTIONS: Array<{ id: 'not_needed' | 'recommended' | 'required'; label: string }> = [
  { id: 'not_needed',  label: 'Not needed'  },
  { id: 'recommended', label: 'Recommended' },
  { id: 'required',    label: 'Required'    },
]

function demoItem(id: string, name: string, kcal: number, oz: number): MealItem {
  return { id, name, kcal, proteinG: 0, fatG: 0, carbsG: 0, weightOz: oz }
}

// Placeholder itinerary shown before the user enters their own meals — every
// kcal/oz figure below is seed data, not a business threshold, so naming each
// literal wouldn't add clarity.
/* eslint-disable @typescript-eslint/no-magic-numbers */
export const DEMO_MEALS: MealRow[] = [
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

export function kcalCls(kcal: number): string {
  if (kcal >= HIGH_KCAL_THRESHOLD) return 'text-pine'
  if (kcal >= MODERATE_KCAL_THRESHOLD) return 'text-text-mid'
  return 'text-amber'
}

export function itemSummary(items: MealItem[]): string {
  if (items.length === 0) return ''
  const first = items[0].name.trim()
  if (items.length === 1) return first || '—'
  return first ? `${first} +${items.length - 1}` : `${items.length} items`
}

export function isLegacy(m: unknown): m is LegacyMealEntry {
  return typeof (m as LegacyMealEntry)?.breakfast === 'string'
}

export function migrateMealEntry(old: LegacyMealEntry): MealRow {
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

export function estimateDayKcalTarget(
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

export function blankMeals(startDate?: string, endDate?: string): MealRow[] {
  if (!startDate || !endDate) return []
  const days = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / MS_PER_DAY) + 1
  if (days <= 0) return []
  return Array.from({ length: days }, (_, i) => ({
    n: i + 1,
    items: { breakfast: [], lunch: [], dinner: [], snacks: [] },
  }))
}

export function deepCopyItems(items: Record<MealSlot, MealItem[]>): Record<MealSlot, MealItem[]> {
  return Object.fromEntries(
    MEAL_SLOTS.map(s => [s, items[s].map(item => ({ ...item, id: crypto.randomUUID() }))])
  ) as Record<MealSlot, MealItem[]>
}

// ─── Warning helpers ──────────────────────────────────────────────────────────

export function parseTarget(str: string): number {
  return parseFloat(str.replace(/,/g, '')) || 0
}

function sumField(items: MealItem[], field: 'kcal' | 'proteinG' | 'fatG' | 'carbsG' | 'weightOz'): number {
  return items.reduce((sum, i) => sum + i[field] * (i.qty ?? 1), 0)
}

export function computeRowWarnings(row: MealRow, targets: RowTargets): RowWarning[] {
  const allItems = MEAL_SLOTS.flatMap(s => row.items[s])
  if (allItems.length === 0) return []
  const checks = [
    { field: 'kcal',    actual: sumField(allItems, 'kcal'),     target: parseTarget(targets.calories) },
    { field: 'protein', actual: sumField(allItems, 'proteinG'), target: parseTarget(targets.protein)  },
    { field: 'fat',     actual: sumField(allItems, 'fatG'),     target: parseTarget(targets.fat)      },
    { field: 'carbs',   actual: sumField(allItems, 'carbsG'),   target: parseTarget(targets.carbs)    },
  ]
  return checks.flatMap(({ field, actual, target }) => {
    if (!target || actual === 0) return []
    const pct = (actual - target) / target
    return Math.abs(pct) > TARGET_THRESHOLD
      ? [{ field, pct, actual: Math.round(actual), target: Math.round(target) }]
      : []
  })
}

export function warningTooltip(warnings: RowWarning[]): string {
  return warnings.map(({ field, pct, actual, target }) => {
    const unit = field === 'kcal' ? '' : 'g'
    return `${field} ${pct > 0 ? 'over' : 'under'} ${Math.abs(Math.round(pct * PERCENT_MULTIPLIER))}% (${actual}${unit} vs ${target}${unit} target)`
  }).join(' · ')
}

export function rowKcalAndOz(items: MealItem[]): { kcal: number; oz: number } {
  return { kcal: sumField(items, 'kcal'), oz: sumField(items, 'weightOz') }
}
