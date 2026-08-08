import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../../../../lib/api'
import { useAuthStore } from '../../../../store/auth'
import type { MacroTargets } from '../../../../types/auth'
import type { StageBodyProps, ResupplyStop, MealItem } from '../../types'
import type { MealRow, TargetField, BearCanNeed } from './foodStage.types'
import {
  MEAL_SLOTS, DEMO_MEALS, BASE_KCAL_PER_DAY, PERCENT_MULTIPLIER, OZ_PER_LB, KCAL_ROUNDING,
  isLegacy, migrateMealEntry, blankMeals, estimateDayKcalTarget, parseTarget, rowKcalAndOz,
} from './foodStage.helpers'

type LegacyFood = { resupplyFields?: Record<string, string>; resupplyStatus?: 'unconfirmed' | 'shipped' }

function migrateLegacyStops(legacy: LegacyFood | undefined): ResupplyStop[] {
  const fields = legacy?.resupplyFields ?? {}
  if (!fields.holdAddress && !fields.shipBy) return []
  return [{
    id: 'legacy', name: '', resupplyDay: '',
    shipBy:      fields.shipBy ?? '',
    daysInBox:   fields.daysInBox ?? '',
    holdAddress: fields.holdAddress ?? '',
    status:      legacy?.resupplyStatus ?? 'unconfirmed',
  }]
}

function initialMeals(plan: StageBodyProps['plan'], trip: StageBodyProps['trip']): MealRow[] {
  const f = plan?.food
  if (f?.meals !== undefined) {
    return (f.meals as unknown[]).map(m => isLegacy(m) ? migrateMealEntry(m) : m as MealRow)
  }
  if (plan !== undefined) return blankMeals(trip?.startDate, trip?.endDate)
  return DEMO_MEALS
}

function fillTargets(source: Partial<Record<TargetField, string>> | undefined): Record<TargetField, string> {
  return {
    calories: source?.calories ?? '',
    protein:  source?.protein  ?? '',
    fat:      source?.fat      ?? '',
    carbs:    source?.carbs    ?? '',
  }
}

function initialTargets(plan: StageBodyProps['plan'], macroDefaults: MacroTargets | undefined): Record<TargetField, string> {
  const t = plan?.food?.targets as Partial<Record<TargetField, string>> | undefined
  return fillTargets(t ?? macroDefaults)
}

export function useFoodState(plan: StageBodyProps['plan'], trip: StageBodyProps['trip']) {
  const macroDefaults = useAuthStore(s => s.user?.preferences?.macroTargets)
  const legacy = plan?.food as LegacyFood | undefined

  const [meals, setMeals] = useState<MealRow[]>(() => initialMeals(plan, trip))
  const [mealsLocked, setMealsLocked] = useState(() => plan?.food?.mealsLocked ?? false)
  const [resupplyStops, setResupplyStops] = useState<ResupplyStop[]>(() => plan?.food?.resupplyStops ?? migrateLegacyStops(legacy))
  const [bearCanNeed, setBearCanNeed] = useState<BearCanNeed>(() => plan?.food?.bearCanNeed ?? '')
  const [targets, setTargets] = useState<Record<TargetField, string>>(() => initialTargets(plan, macroDefaults))
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null)

  return {
    macroDefaults,
    meals, setMeals, mealsLocked, setMealsLocked, resupplyStops, setResupplyStops,
    bearCanNeed, setBearCanNeed, targets, setTargets, activeDayIdx, setActiveDayIdx,
  }
}

export function useFoodPersist(
  onChange: StageBodyProps['onChange'],
  data: { meals: MealRow[]; mealsLocked: boolean; resupplyStops: ResupplyStop[]; bearCanNeed: BearCanNeed; targets: Record<TargetField, string> },
) {
  const isMounted = useRef(false)
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ food: { ...data, bearCanNeed: data.bearCanNeed || undefined } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.meals, data.mealsLocked, data.resupplyStops, data.bearCanNeed, data.targets])
}

export function useRemoveResupplyWaypoint(trip: StageBodyProps['trip']) {
  const qc = useQueryClient()
  return async function handleRemoveWaypoint(waypointId: string) {
    if (!trip?._id) return
    const updated = (trip.waypoints ?? []).filter(w => w.id !== waypointId)
    try {
      await api.put(`/api/trips/${trip._id}`, { waypoints: updated })
      qc.invalidateQueries({ queryKey: ['plan', trip._id] })
    } catch { /* waypoint will reappear on next load */ }
  }
}

export function useFoodChecklist(
  targets: Record<TargetField, string>, resupplyWaypoints: { id: string }[], resupplyStops: ResupplyStop[],
  bearCanNeed: string, mealsLocked: boolean, onProgress: StageBodyProps['onProgress'],
) {
  const item1 = targets.calories.trim() !== ''
  const item2 = targets.protein.trim() !== ''
  const item3 = resupplyWaypoints.length === 0
    || resupplyWaypoints.every(wp => resupplyStops.find(s => s.id === wp.id)?.status === 'shipped')
  const item4 = bearCanNeed !== ''
  const item5 = mealsLocked
  const checklistItems = [item1, item2, item3, item4, item5]
  const doneCount = checklistItems.filter(Boolean).length
  const progress = Math.round((doneCount / checklistItems.length) * PERCENT_MULTIPLIER)

  const onProgressRef = useRef(onProgress)
  useEffect(() => { onProgressRef.current = onProgress })
  useEffect(() => { onProgressRef.current?.(doneCount, checklistItems.length) }, [doneCount, checklistItems.length])

  return { item1, item2, item3, item4, item5, doneCount, totalCount: checklistItems.length, progress }
}

export function useFoodSuggestions(plan: StageBodyProps['plan'], macroDefaults: MacroTargets | undefined) {
  const routeSegments = plan?.route?.segments ?? []
  const toughDays = routeSegments.filter(s => s.hard).map(s => s.n)
  const toughDayNumbers = new Set(toughDays)

  const accountBaseKcal = parseTarget(macroDefaults?.calories ?? '')
  const baseKcalPerDay = accountBaseKcal > 0 ? accountBaseKcal : BASE_KCAL_PER_DAY

  const suggestedKcalByDay = new Map(
    routeSegments.map(s => [s.n, estimateDayKcalTarget(s.mi, s.gain, s.hard, baseKcalPerDay)])
  )
  const suggestedAvgKcal = suggestedKcalByDay.size > 0
    ? Math.round(
        Array.from(suggestedKcalByDay.values()).reduce((sum, v) => sum + v, 0)
        / suggestedKcalByDay.size / KCAL_ROUNDING
      ) * KCAL_ROUNDING
    : undefined

  return { toughDays, toughDayNumbers, suggestedKcalByDay, suggestedAvgKcal }
}

function itemsBySlot(meals: MealRow[]): MealItem[] {
  return meals.flatMap(m => MEAL_SLOTS.flatMap(s => m.items[s]))
}

export function useFoodTotals(meals: MealRow[]) {
  const { kcal: kcalTotal, oz: totalWeightOz } = rowKcalAndOz(itemsBySlot(meals))
  const foodWeightStr = totalWeightOz > 0 ? `${(totalWeightOz / OZ_PER_LB).toFixed(1)} lb` : '—'
  const totals = [
    { value: kcalTotal > 0 ? kcalTotal.toLocaleString() : '—', label: 'kcal total' },
    { value: foodWeightStr, label: 'food weight' },
  ]
  return { kcalTotal, totalWeightOz, foodWeightStr, totals }
}

export function computeHeadsUp(plan: StageBodyProps['plan'], toughDays: number[]): string | null {
  if (plan === undefined) {
    return 'Big-day calories (D4, D8) should clear 4,200. D8 is light because you exit to Whitney Portal — burger after.'
  }
  if (toughDays.length === 0) return null
  return `D${toughDays.join(', D')} ${toughDays.length === 1 ? 'is' : 'are'} flagged as tough — plan for 4,000+ kcal ${toughDays.length === 1 ? 'that day' : 'those days'}.`
}
