import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Trip } from '../../types'
import type { PlanData, PlanView, Stage } from './types'
import { computeStages, planFrom } from './planWizard.helpers'
import type { useUpdatePlan } from '../../hooks/usePlans'

const AUTOSAVE_DEBOUNCE_MS = 800

export type SaveState = 'saved' | 'saving' | 'unsaved'
type DoUpdate = ReturnType<typeof useUpdatePlan>['mutateAsync']

// Owns the debounced-save pipeline: patches accumulate on a ref (read only
// inside the timer callback, never during render) and flush together after
// AUTOSAVE_DEBOUNCE_MS of inactivity.
export function useAutosave(planId: string, savedPlan: Trip | undefined, doUpdate: DoUpdate) {
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const stagesRef   = useRef<PlanData>({})
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const initialized = useRef(false)

  useEffect(() => {
    if (savedPlan && !initialized.current) {
      initialized.current = true
      stagesRef.current = planFrom(savedPlan)
    }
  }, [savedPlan])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const handleChange = useCallback((patch: Partial<PlanData>) => {
    stagesRef.current = { ...stagesRef.current, ...patch }
    setSaveState('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaveState('saving')
      doUpdate({ id: planId, body: { planStages: stagesRef.current } })
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('unsaved'))
    }, AUTOSAVE_DEBOUNCE_MS)
  }, [planId, doUpdate])

  return { saveState, handleChange }
}

// Owns which stage/view is showing, the derived done/total per stage (seeded
// from saved plan data + live checkbox overrides), and stage navigation.
export function useStageProgress(baseStages: Stage[], plan: PlanData, initialStage: number | undefined) {
  const validStage = initialStage !== undefined && initialStage >= 1 && initialStage <= baseStages.length
  const [view, setView]         = useState<PlanView>(validStage ? 'stage' : 'overview')
  const [stageIdx, setStageIdx] = useState(validStage ? initialStage - 1 : 0)
  const [progressOverrides, setProgressOverrides] = useState<Record<number, { done: number; total: number }>>({})

  const stages = useMemo(
    () => computeStages(baseStages, plan, progressOverrides),
    [baseStages, plan, progressOverrides]
  )
  const totalDone = stages.reduce((a, s) => a + s.done, 0)
  const totalAll  = stages.reduce((a, s) => a + s.total, 0)

  const handleProgress = useCallback((done: number, total: number) => {
    setProgressOverrides(prev => ({ ...prev, [stageIdx]: { done, total } }))
  }, [stageIdx])

  function jumpTo(id: string) {
    if (id === '__overview__') { setView('overview'); return }
    const i = stages.findIndex(s => s.id === id)
    if (i >= 0) { setView('stage'); setStageIdx(i) }
  }

  return { view, setView, stageIdx, setStageIdx, stages, totalDone, totalAll, handleProgress, jumpTo }
}

// Gates "mark complete" behind a confirmation when there's no journal entry yet.
export function useCompletionGate(planId: string, doUpdate: DoUpdate, journalEntryCount: number) {
  const [confirmComplete, setConfirmComplete] = useState(false)

  const handleStatusChange = useCallback((newStatus: string) => {
    if (newStatus === 'complete' && journalEntryCount === 0) {
      setConfirmComplete(true)
      return
    }
    doUpdate({ id: planId, body: { status: newStatus } })
  }, [planId, doUpdate, journalEntryCount])

  return { confirmComplete, setConfirmComplete, handleStatusChange }
}
