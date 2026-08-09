import type { PlanGearCategoryEntry } from '../../types'
import type { BearCanOption, GearCategory, UnlockChecklistItem } from './gearStage.types'

export const WEATHER_RISK_STYLE = {
  moderate: { border: 'border-amber-border', bg: 'bg-amber-dim', text: 'text-amber', label: 'Caution' },
  high:     { border: 'border-red-border',   bg: 'bg-red-dim',   text: 'text-red',   label: 'Delay'   },
} as const

export const BEAR_CANS: BearCanOption[] = [
  { id: 'bv450',      name: 'Bear Vault BV450',         capacity: '450 cu in', weight: '2.3 lb', type: 'hard' },
  { id: 'bv475',      name: 'Bear Vault BV475',         capacity: '475 cu in', weight: '2.6 lb', type: 'hard' },
  { id: 'bv500',      name: 'Bear Vault BV500',         capacity: '700 cu in', weight: '2.8 lb', type: 'hard', recommended: true },
  { id: 'ursack_maj', name: 'Ursack Major',             capacity: '10.7 L',   weight: '8.0 oz', type: 'soft', note: 'USDA approved · not SEKI' },
  { id: 'ursack_alm', name: 'Ursack AllMitey',          capacity: '10.7 L',   weight: '8.4 oz', type: 'soft', note: 'Yosemite approved · not SEKI' },
  { id: 'ca_keg',     name: 'Counter Assault Bear Keg', capacity: '615 cu in', weight: '3.1 lb', type: 'hard' },
]

export const CAN_TYPE_CLS: Record<'hard' | 'soft', string> = {
  hard: 'bg-sky-dim border-sky-border text-sky',
  soft: 'bg-amber-dim border-amber-border text-amber',
}

export const OZ_PER_LB = 16
export const PERCENT_MULTIPLIER = 100

export const DEFAULT_CATEGORIES: GearCategory[] = [
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

export const DEFAULT_UNLOCK_CHECKLIST: UnlockChecklistItem[] = [
  { text: 'Confirm dates',           done: false },
  { text: 'Pre-fill loadout',        done: true  },
  { text: 'Borrow vs buy decisions', done: false },
  { text: 'Final pack weigh-in',     done: false },
  { text: 'Shakedown overnight',     done: false },
]

export function fmtShortDate(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function canWeightOz(weight: string): number {
  const match = weight.match(/^([\d.]+)\s*(lb|oz)$/)
  if (!match) return 0
  const value = parseFloat(match[1])
  return match[2] === 'lb' ? value * OZ_PER_LB : value
}

export function fromPlanCategories(src: PlanGearCategoryEntry[]): GearCategory[] {
  return src.map(c => ({ id: c.id, label: c.label, items: c.items.map(i => ({ ...i })) }))
}