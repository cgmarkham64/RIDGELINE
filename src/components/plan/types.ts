import type { Trip } from '../../types'

export type StageId = 'route' | 'weather' | 'permits' | 'food' | 'gear' | 'depart' | 'journal'

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

export type SourceTier = 'official' | 'partner' | 'community'

export interface PermitSource {
  url:   string
  title: string
  tier?: SourceTier
}

// ─── Per-stage plan data — used to seed state from an existing plan ───────────

export interface PlanRouteData {
  segments: {
    n: number; name: string; mi: number; gain: number; notes: string; path?: [number, number][]
    water?: 'reliable' | 'caches' | 'dry'
    exposure?: 'low' | 'med' | 'high' | 'extreme'
    hard?: boolean
    wakeTime?: string
    onTrailTime?: string
    campByTime?: string
  }[]
  sourceFiles: { name: string; meta: string }[]
  checklist: { text: string; done: boolean }[]
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
  url?: string
  zoneId?: string
  confidence?: 'high' | 'medium' | 'low'
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

// ─── Plan metadata — shown in StageRail / StageHeader ────────────────────────

export interface PlanMeta {
  title: string
  location: string
  dateRange: string
  miles: number | null
  elevGainFt: number | null
  days: number
  weight: string
}

export type ReminderTone = 'amber' | 'sky' | 'pine'
export type ContactTone  = 'amber' | 'sky' | 'pine' | 'red'

export interface PlanDepartData {
  reminders: { date: string; description: string; tone: ReminderTone; set: boolean }[]
  contacts:  { name: string; role: string; phone: string; tone: ContactTone }[]
  mapLayers: { name: string; size: string; ok: boolean }[]
  checklist: { text: string; done: boolean; pending?: boolean }[]
}

// ─── Weather stage persistence types ─────────────────────────────────────────

export interface WeatherForecastDay {
  date: string
  highF: number
  lowF: number
  precipPct: number
  conditionCode: number
  conditionLabel: string
  windMph: number
  windDir: string
}

export interface PlanWeatherData {
  historicalReviewed: boolean
  forecastChecked: boolean
  sunriseReviewed?: boolean
  gearAdjusted: boolean
  departureRisk: 'low' | 'moderate' | 'high' | null
  departureFactors?: Array<{ date: string; label: string; severity: 'moderate' | 'high' }>
  notes: string
  cachedCoords?:   { lat: number; lng: number; fetchedAt: string; forLocation: string }
  cachedClimate?:  { avgHighF: number; avgLowF: number; precipPct: number; snowLikely: boolean; fetchedAt: string; forLocation: string }
  cachedForecast?: { days: WeatherForecastDay[]; fetchedAt: string; forLocation: string }
}

// ─── PlanData — top-level shape passed from PlanWizard to each stage ──────────

export interface PlanCriticalDate {
  id:     string
  date:   string
  label:  string
  tone:   'amber' | 'sky' | 'pine'
  source: 'manual' | 'scan'
}

export interface PlanData {
  route?: PlanRouteData
  weather?: PlanWeatherData
  permits?: {
    permits:        PlanPermitEntry[]
    permitFree:     boolean
    suggestions?:   PlanPermitEntry[]
    lastScanned?:   string
    sources?:       PermitSource[]
    criticalDates?: PlanCriticalDate[]
  }
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
  depart?: PlanDepartData
}

// ─── StageBodyProps ───────────────────────────────────────────────────────────

export interface StageBodyProps {
  onJump: (id: string) => void
  plan?: PlanData
  onChange?: (patch: Partial<PlanData>) => void
  onProgress?: (done: number, total: number) => void
  tripStatus?: string
  trip?: Trip
  canEdit?: boolean
  onEditTrip?: () => void
}