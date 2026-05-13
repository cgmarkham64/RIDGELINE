export type StageId = 'route' | 'days' | 'permits' | 'food' | 'gear' | 'depart'

export interface Stage {
  id: StageId
  n: string
  label: string
  sub: string
  done: number
  total: number
  blocked?: boolean
  blockedReason?: string
}

export type StageState = 'done' | 'progress' | 'idle' | 'blocked'

export type PlanView = 'overview' | 'stage'

// ─── Permit types (shared between PermitsStage and PlanData) ──────────────────

export type PermitTypeName =
  | 'lottery' | 'reservation' | 'walkup' | 'selfissue'
  | 'zonenights' | 'hut' | 'parking' | 'fishing' | 'vehicle'

export type ZoneStatus = 'available' | 'limited' | 'sold_out'

// ─── Per-stage plan data — used to seed state from an existing plan ───────────

export interface PlanRouteData {
  segments: { n: number; name: string; mi: number; gain: number; cls: string; notes: string }[]
  sourceFiles: { name: string; meta: string }[]
}

export interface PlanDayEntry {
  n: number
  from: string
  to: string
  mi: number
  gain: number
  water: string
  exp: 'low' | 'med' | 'high' | 'extreme'
  hard?: boolean
  pass?: string
}

export interface PlanPermitEntry {
  id: string
  type: PermitTypeName
  name: string
  agency: string
  why: string
  fields: Record<string, string>
  party: number
  zones?: { night: number; zone: string; status: ZoneStatus }[]
}

export interface PlanMealEntry {
  n: number
  breakfast: string
  lunch: string
  dinner: string
  snacks: string
  kcal: number
}

export interface PlanGearItemEntry {
  name: string
  weight: number
  checked: boolean
}

export interface PlanGearCategoryEntry {
  id: string
  label: string
  items: PlanGearItemEntry[]
}

// ─── PlanData — top-level shape passed from PlanWizard to each stage ──────────

export interface PlanData {
  route?: PlanRouteData
  days?: { days: PlanDayEntry[] }
  permits?: { permits: PlanPermitEntry[]; permitFree: boolean }
  food?: {
    meals: PlanMealEntry[]
    mealsLocked: boolean
    resupplyStatus: 'unconfirmed' | 'shipped'
    waterChecks: { sources: boolean; cache: boolean; filter: boolean }
    selectedCanId: string
    customCanName: string
    targets: { calories: string; protein: string; water: string; packOut: string }
    resupplyFields: { shipBy: string; daysInBox: string; holdAddress: string }
  }
  gear?: {
    categories: PlanGearCategoryEntry[]
    unlockChecklist: { text: string; done: boolean }[]
  }
}

// ─── StageBodyProps ───────────────────────────────────────────────────────────

export interface StageBodyProps {
  onJump: (id: string) => void
  plan?: PlanData
}