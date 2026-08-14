import { isOwnedBy } from '../../lib/utils'
import type { Trip } from '../../types'
import type { PlanData, PlanMeta, Stage } from './types'
import { isGearReviewNeeded } from './stages/weather/weatherStage.helpers'

export const ISO_DATE_LENGTH = 10
const DAY_MS = 86_400_000
const PERMITS_CHECKLIST_TOTAL = 3
const WEATHER_CHECKLIST_BASE_TOTAL = 3
const HTTP_FORBIDDEN = 403

export function isForbiddenError(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === HTTP_FORBIDDEN
}

export interface AccessInfo {
  isOwner: boolean
  canEdit: boolean
}

export function deriveAccess(savedPlan: Pick<Trip, 'ownerSub' | 'sharedWith'>, userId: string | undefined): AccessInfo {
  const isOwner = isOwnedBy(savedPlan.ownerSub, userId)
  const collaborator = !isOwner && userId
    ? savedPlan.sharedWith?.find((c) => c.sub === userId)
    : undefined
  const canEdit = isOwner || collaborator?.role === 'edit'
  return { isOwner, canEdit }
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d.slice(0, ISO_DATE_LENGTH) + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  return `${fmt(start)} – ${fmt(end)}`
}

function tripDays(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / DAY_MS) + 1
}

export interface PlanMetaSource {
  title?: string
  location?: string
  startDate?: string
  endDate?: string
  distanceMiles?: number
  elevationGainFt?: number
}

export function buildMeta(trip: PlanMetaSource): PlanMeta {
  const hasDate = !!(trip.startDate && trip.endDate)
  return {
    title:      trip.title    ?? 'Untitled Trip',
    location:   trip.location ?? '—',
    dateRange:  hasDate ? formatDateRange(trip.startDate!, trip.endDate!) : '—',
    miles:      trip.distanceMiles   ?? null,
    elevGainFt: trip.elevationGainFt ?? null,
    days:       hasDate ? tripDays(trip.startDate!, trip.endDate!) : 0,
    weight:     '—',
  }
}

// planStages is stored as Mixed on the backend, so this is a genuine system-
// boundary cast rather than something a type guard can narrow further here.
export function planFrom(savedPlan: Pick<Trip, 'planStages'> | undefined): PlanData {
  return savedPlan ? (savedPlan.planStages as PlanData) ?? {} : {}
}

function routeStageDone(plan: PlanData): number {
  const cl   = plan.route?.checklist ?? []
  const segs = plan.route?.segments  ?? []
  const exposureWaterDone = segs.length > 0 && segs.every(seg => !!seg.exposure && !!seg.water)
  return cl.filter(c =>
    c.text === 'Exposure & water annotated' ? exposureWaterDone : c.done
  ).length
}

function weatherStageProgress(plan: PlanData): { done: number; total: number } {
  const w = plan.weather
  const checks = w ? [w.historicalReviewed, w.forecastChecked, w.departureRisk !== null] : []
  const gearNeeded = isGearReviewNeeded(w?.departureRisk)
  if (gearNeeded) checks.push(w?.gearAdjusted ?? false)
  return { done: checks.filter(Boolean).length, total: gearNeeded ? WEATHER_CHECKLIST_BASE_TOTAL + 1 : WEATHER_CHECKLIST_BASE_TOTAL }
}

function permitsStageProgress(plan: PlanData): { done: number; total: number } | undefined {
  const p = plan.permits
  if (!p) return undefined
  const permitFree = p.permitFree ?? false
  const done  = permitFree ? 2 : [(p.permits?.length ?? 0) > 0, p.partyConfirmed ?? false, p.backupPlanned ?? false].filter(Boolean).length
  const total = permitFree ? 2 : PERMITS_CHECKLIST_TOTAL
  return { done, total }
}

function seedStage(s: Stage, plan: PlanData): Stage {
  if (s.id === 'route')   return { ...s, done: routeStageDone(plan) }
  if (s.id === 'weather') return { ...s, ...weatherStageProgress(plan) }
  if (s.id === 'permits') {
    const progress = permitsStageProgress(plan)
    return progress ? { ...s, ...progress } : s
  }
  return s
}

// Derives each stage's done/total from saved plan data, then overlays any live
// checkbox overrides so Overview/StageRail stay in sync without requiring the
// stage itself to have mounted yet.
export function computeStages(
  baseStages: Stage[],
  plan: PlanData,
  progressOverrides: Record<number, { done: number; total: number }>,
): Stage[] {
  return baseStages.map((s, i) => {
    const seeded = seedStage(s, plan)
    const override = progressOverrides[i]
    return override ? { ...seeded, ...override } : seeded
  })
}
