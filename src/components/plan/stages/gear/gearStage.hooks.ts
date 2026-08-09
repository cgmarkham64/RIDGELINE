import { useEffect, useRef, useState } from 'react'
import type { PlanData } from '../../types'
import { BEAR_CANS, DEFAULT_CATEGORIES, DEFAULT_UNLOCK_CHECKLIST, OZ_PER_LB, PERCENT_MULTIPLIER, canWeightOz, fromPlanCategories } from './gearStage.constants'
import type { GearCategory, UnlockChecklistItem } from './gearStage.types'

// Stub — future: pull from Food stage state
const STUB_FOOD_LB = '16.4'

function initialCategories(plan: PlanData | undefined): GearCategory[] {
  if (plan?.gear?.categories) return fromPlanCategories(plan.gear.categories)
  return plan !== undefined ? [] : DEFAULT_CATEGORIES
}

function initialUnlockChecklist(plan: PlanData | undefined): UnlockChecklistItem[] {
  return plan?.gear?.unlockChecklist ?? (plan !== undefined ? [] : DEFAULT_UNLOCK_CHECKLIST)
}

function withToggledItem(categories: GearCategory[], catIdx: number, itemIdx: number): GearCategory[] {
  return categories.map((c, ci) =>
    ci !== catIdx ? c : {
      ...c,
      items: c.items.map((it, ii) => ii !== itemIdx ? it : { ...it, checked: !it.checked }),
    }
  )
}

function withToggledUnlock(list: UnlockChecklistItem[], idx: number): UnlockChecklistItem[] {
  return list.map((c, i) => i !== idx ? c : { ...c, done: !c.done })
}

// Skips the autosave call on first mount (initial state === saved state) and
// always reads the latest onChange without re-subscribing the effect on every render.
function useGearAutosave(
  onChange: ((patch: Partial<PlanData>) => void) | undefined,
  categories: GearCategory[],
  unlockChecklist: UnlockChecklistItem[],
  selectedCanId: string,
  customCanName: string,
) {
  const isMounted = useRef(false)
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ gear: { categories, unlockChecklist, selectedCanId, customCanName } })
  }, [categories, unlockChecklist, selectedCanId, customCanName])
}

function computeGearStats(categories: GearCategory[], unlockChecklist: UnlockChecklistItem[], selectedCanId: string) {
  const allItems     = categories.flatMap(c => c.items)
  const checkedCount = allItems.filter(i => i.checked).length
  const totalCount   = allItems.length
  const selectedCan  = BEAR_CANS.find(c => c.id === selectedCanId)
  const canOz        = selectedCan ? canWeightOz(selectedCan.weight) : 0
  const baseOz       = allItems.filter(i => i.checked).reduce((s, i) => s + i.weight, 0) + canOz
  const baseLb       = (baseOz / OZ_PER_LB).toFixed(1)

  const foodLb  = STUB_FOOD_LB
  const totalLb = (baseOz / OZ_PER_LB + parseFloat(foodLb)).toFixed(1)

  const unlockDone     = unlockChecklist.filter(c => c.done).length
  const unlockProgress = Math.round((unlockDone / unlockChecklist.length) * PERCENT_MULTIPLIER)

  return { checkedCount, totalCount, baseLb, foodLb, totalLb, unlockDone, unlockProgress }
}

export function useGearStageState(plan: PlanData | undefined, onChange: ((patch: Partial<PlanData>) => void) | undefined) {
  const [categories, setCategories] = useState<GearCategory[]>(() => initialCategories(plan))
  const [unlockChecklist, setUnlockChecklist] = useState<UnlockChecklistItem[]>(() => initialUnlockChecklist(plan))

  // Bear canister used to be picked in the Food stage — fall back to that legacy
  // location so trips started before the move don't lose the selection.
  const legacyFood = plan?.food as { selectedCanId?: string; customCanName?: string } | undefined
  const [selectedCanId, setSelectedCanId] = useState(() => plan?.gear?.selectedCanId ?? legacyFood?.selectedCanId ?? '')
  const [customCanName, setCustomCanName] = useState(() => plan?.gear?.customCanName ?? legacyFood?.customCanName ?? '')

  useGearAutosave(onChange, categories, unlockChecklist, selectedCanId, customCanName)

  const toggleItem   = (catIdx: number, itemIdx: number) => setCategories(prev => withToggledItem(prev, catIdx, itemIdx))
  const toggleUnlock = (idx: number) => setUnlockChecklist(prev => withToggledUnlock(prev, idx))

  const stats = computeGearStats(categories, unlockChecklist, selectedCanId)

  const departureRisk = plan?.weather?.departureRisk
  const isWeatherRisk = departureRisk === 'moderate' || departureRisk === 'high'

  return {
    categories, unlockChecklist, selectedCanId, customCanName,
    setSelectedCanId, setCustomCanName,
    toggleItem, toggleUnlock,
    ...stats,
    isWeatherRisk,
  }
}
