import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { PlanView, StageId, PlanData, PlanMeta } from './types'
import { createStages } from './constants'
import { StageRail } from './StageRail'
import { StageHeader } from './StageHeader'
import { PlanOverview } from './PlanOverview'
import { RouteStage } from './stages/RouteStage'
import { DaysStage } from './stages/DaysStage'
import { PermitsStage } from './stages/PermitsStage'
import { FoodStage } from './stages/FoodStage'
import { GearStage } from './stages/GearStage'
import { DepartStage } from './stages/DepartStage'
import { JournalStage } from './stages/JournalStage'
import { MoonLoader } from '../ui/MoonLoader'
import { TripSetupDialog } from './TripSetupDialog'
import { usePlan, useUpdatePlan } from '../../hooks/usePlans'
import { useJournalDays } from '../../hooks/useJournalDays'
import { useAuthStore } from '../../store/auth'
import type { StageBodyProps } from './types'

export type SaveState = 'saved' | 'saving' | 'unsaved'

const BASE_STAGES = createStages()

const STAGE_COMPONENTS: Record<StageId, React.ComponentType<StageBodyProps>> = {
  route:   RouteStage,
  days:    DaysStage,
  permits: PermitsStage,
  food:    FoodStage,
  gear:    GearStage,
  depart:  DepartStage,
  journal: JournalStage,
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  return `${fmt(start)} – ${fmt(end)}`
}

function tripDays(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1
}

function buildMeta(trip: { title?: string; location?: string; startDate?: string; endDate?: string; distanceMiles?: number; elevationGainFt?: number }): PlanMeta {
  const hasDate = !!(trip.startDate && trip.endDate)
  return {
    title:     trip.title    ?? 'Untitled Trip',
    location:  trip.location ?? '—',
    dateRange: hasDate ? formatDateRange(trip.startDate!, trip.endDate!) : '—',
    miles:     trip.distanceMiles  ?? null,
    elev:      trip.elevationGainFt ? `+${trip.elevationGainFt.toLocaleString()} ft` : '—',
    days:      hasDate ? tripDays(trip.startDate!, trip.endDate!) : 0,
    weight:    '—',
  }
}

export function PlanWizard({ planId, initialStage }: { planId: string; initialStage?: number }) {
  const { data: savedPlan, isLoading } = usePlan(planId)
  const { mutateAsync: doUpdate } = useUpdatePlan()
  const { data: journalEntries = [] } = useJournalDays(planId)
  const userId = useAuthStore((s) => s.user?.id)

  // Base stages never change — progress is overlaid separately.
  const [progressOverrides, setProgressOverrides] = useState<Record<number, { done: number; total: number }>>({})

  const validStage = initialStage !== undefined && initialStage >= 1 && initialStage <= BASE_STAGES.length
  const [view, setView]             = useState<PlanView>(validStage ? 'stage' : 'overview')
  const [stageIdx, setStageIdx]     = useState(validStage ? initialStage - 1 : 0)
  const [showEditDetails, setShowEditDetails]   = useState(false)
  const [confirmComplete, setConfirmComplete]   = useState(false)
  const [saveState, setSaveState]   = useState<SaveState>('saved')

  // Accumulates all stage patches for debounced saves.
  // Initialized from savedPlan once it arrives; only accessed inside the
  // handleChange callback (an event handler), never read during render.
  const stagesRef   = useRef<PlanData>({})
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const initialized = useRef(false)

  useEffect(() => {
    if (savedPlan && !initialized.current) {
      initialized.current = true
      stagesRef.current = (savedPlan.planStages as PlanData) ?? {}
    }
  }, [savedPlan])

  // Clear the debounce timer on unmount so a pending save can't call
  // setSaveState on an unmounted component or fire a stale network request.
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
    }, 800)
  }, [planId, doUpdate])

  const handleProgress = useCallback((done: number, total: number) => {
    setProgressOverrides(prev => ({ ...prev, [stageIdx]: { done, total } }))
  }, [stageIdx])

  const handleStatusChange = useCallback((newStatus: string) => {
    if (newStatus === 'complete' && journalEntries.length === 0) {
      setConfirmComplete(true)
      return
    }
    doUpdate({ id: planId, body: { status: newStatus } })
  }, [planId, doUpdate, journalEntries.length])

  // Derive stage done/total from saved plan data + live checkbox overrides.
  // Runs during render so Overview and StageRail are always in sync without
  // requiring each stage to mount first.
  const stages = useMemo(() => {
    const plan = savedPlan ? ((savedPlan.planStages as PlanData) ?? {}) : {}
    return BASE_STAGES.map((s, i) => {
      let seeded = s
      if (s.id === 'route') {
        const cl = plan.route?.checklist ?? []
        seeded = { ...s, done: cl.filter(c => c.done).length }
      }
      const override = progressOverrides[i]
      return override ? { ...seeded, ...override } : seeded
    })
  }, [savedPlan, progressOverrides])

  const totalDone = stages.reduce((a, s) => a + s.done, 0)
  const totalAll  = stages.reduce((a, s) => a + s.total, 0)

  function jumpTo(id: string) {
    if (id === '__overview__') { setView('overview'); return }
    const i = stages.findIndex(s => s.id === id)
    if (i >= 0) { setView('stage'); setStageIdx(i) }
  }

  if (isLoading || !savedPlan) {
    return (
      <div className="flex h-full items-center justify-center w-full">
        <MoonLoader />
      </div>
    )
  }

  // Read planStages directly from savedPlan for the initial seed passed to each
  // stage's useState initializer. After that, stage state is self-contained.
  const plan = (savedPlan.planStages as PlanData) ?? {}
  const meta = buildMeta(savedPlan)
  const isOwner = !!userId && savedPlan.ownerSub === userId
  const collaborator = !isOwner && userId
    ? savedPlan.sharedWith?.find((c) => c.sub === userId)
    : undefined
  const canEdit = isOwner || collaborator?.role === 'edit'

  const activeStage = stages[stageIdx]
  if (!activeStage) return null
  const StageBody = STAGE_COMPONENTS[activeStage.id]

  return (
    <>
      <div className="flex h-full overflow-hidden w-full">
        <StageRail
          stages={stages}
          trip={meta}
          activeStageIdx={stageIdx}
          view={view}
          totalDone={totalDone}
          totalAll={totalAll}
          onSelectStage={(i) => { setView('stage'); setStageIdx(i) }}
          onSelectOverview={() => setView('overview')}
          onEditDetails={() => setShowEditDetails(true)}
        />
        {showEditDetails && (
          <TripSetupDialog
            tripId={planId}
            onClose={() => setShowEditDetails(false)}
            initialTitle={savedPlan.title}
            initialLocation={savedPlan.location}
            initialStartDate={savedPlan.startDate?.slice(0, 10)}
            initialEndDate={savedPlan.endDate?.slice(0, 10)}
          />
        )}

        {view === 'overview' ? (
          <PlanOverview
            stages={stages}
            totalDone={totalDone}
            totalAll={totalAll}
            onJump={jumpTo}
            plan={plan}
            tripStatus={savedPlan.status}
            isOwner={isOwner}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <StageHeader
              stage={activeStage}
              stageIdx={stageIdx}
              saveState={saveState}
              onJump={jumpTo}
              onPrev={() => setStageIdx(i => Math.max(0, i - 1))}
              onNext={() => setStageIdx(i => Math.min(stages.length - 1, i + 1))}
              tripStatus={savedPlan.status}
              isOwner={isOwner}
              onStatusChange={handleStatusChange}
            />
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <StageBody
                onJump={jumpTo}
                plan={plan}
                onChange={handleChange}
                onProgress={handleProgress}
                tripStatus={savedPlan.status}
                trip={savedPlan}
                canEdit={canEdit}
              />
            </div>
          </main>
        )}
      </div>

      {confirmComplete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-surface border border-border-mid rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-heading text-[18px] font-extrabold text-text mb-2">No journal entries yet.</h2>
            <p className="text-[13px] text-text-mid leading-relaxed mb-5">
              Consider adding a trip report before marking this complete — it only takes a few minutes.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setConfirmComplete(false); jumpTo('journal') }}
                className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
              >
                Add entries
              </button>
              <button
                onClick={() => { doUpdate({ id: planId, body: { status: 'complete' } }); setConfirmComplete(false) }}
                className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase rounded border cursor-pointer transition-colors"
                style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
              >
                Complete anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}