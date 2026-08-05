import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { PlanView, StageId, PlanData, PlanMeta } from './types'
import { createStages } from './constants'
import { StageRail } from './StageRail'
import { StageHeader } from './StageHeader'
import { PlanOverview } from './PlanOverview'
import { RouteStage } from './stages/route/RouteStage'
import { WeatherStage } from './stages/weather/WeatherStage'
import { PermitsStage } from './stages/permits/PermitsStage'
import { FoodStage } from './stages/food/FoodStage'
import { GearStage } from './stages/gear/GearStage'
import { DepartStage } from './stages/depart/DepartStage'
import { JournalStage } from './stages/journal/JournalStage'
import { MoonLoader } from '../ui/MoonLoader'
import { TripSetupDialog } from './TripSetupDialog'
import { usePlan, useUpdatePlan } from '../../hooks/usePlans'
import { useJournalDays } from '../../hooks/useJournalDays'
import { useAuthStore } from '../../store/auth'
import { isOwnedBy } from '../../lib/utils'
import { Modal } from '../ui/Modal'
import { PlanAccessError } from './PlanAccessError'
import type { StageBodyProps } from './types'

export type SaveState = 'saved' | 'saving' | 'unsaved'

const BASE_STAGES = createStages()

const ISO_DATE_LENGTH = 10
const DAY_MS = 86_400_000
const AUTOSAVE_DEBOUNCE_MS = 800
const PERMITS_CHECKLIST_TOTAL = 3
const HTTP_FORBIDDEN = 403

const STAGE_COMPONENTS: Record<StageId, React.ComponentType<StageBodyProps>> = {
  route:   RouteStage,
  weather: WeatherStage,
  permits: PermitsStage,
  food:    FoodStage,
  gear:    GearStage,
  depart:  DepartStage,
  journal: JournalStage,
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

function buildMeta(trip: { title?: string; location?: string; startDate?: string; endDate?: string; distanceMiles?: number; elevationGainFt?: number }): PlanMeta {
  const hasDate = !!(trip.startDate && trip.endDate)
  return {
    title:     trip.title    ?? 'Untitled Trip',
    location:  trip.location ?? '—',
    dateRange: hasDate ? formatDateRange(trip.startDate!, trip.endDate!) : '—',
    miles:     trip.distanceMiles  ?? null,
    elevGainFt: trip.elevationGainFt ?? null,
    days:      hasDate ? tripDays(trip.startDate!, trip.endDate!) : 0,
    weight:    '—',
  }
}

export function PlanWizard({ planId, initialStage }: { planId: string; initialStage?: number }) {
  const { data: savedPlan, isLoading, isError, error } = usePlan(planId)
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
    }, AUTOSAVE_DEBOUNCE_MS)
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
        const cl   = plan.route?.checklist ?? []
        const segs = plan.route?.segments  ?? []
        const exposureWaterDone = segs.length > 0 && segs.every((seg: { exposure?: string; water?: string }) => !!seg.exposure && !!seg.water)
        const done = cl.filter((c: { text: string; done: boolean }) =>
          c.text === 'Exposure & water annotated' ? exposureWaterDone : c.done
        ).length
        seeded = { ...s, done }
      }
      if (s.id === 'weather') {
        const w = plan.weather
        const checks = w ? [w.historicalReviewed, w.forecastChecked, w.gearAdjusted, w.departureRisk !== null] : []
        seeded = { ...s, done: checks.filter(Boolean).length }
      }
      if (s.id === 'permits') {
        const p = plan.permits
        if (p) {
          const permitFree = p.permitFree ?? false
          const done  = permitFree ? 2 : [(p.permits?.length ?? 0) > 0, p.partyConfirmed ?? false, p.backupPlanned ?? false].filter(Boolean).length
          const total = permitFree ? 2 : PERMITS_CHECKLIST_TOTAL
          seeded = { ...s, done, total }
        }
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

  if (isError) {
    const is403 = (error as { response?: { status?: number } })?.response?.status === HTTP_FORBIDDEN
    return <PlanAccessError is403={is403} />
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
  const isOwner = isOwnedBy(savedPlan.ownerSub, userId)
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
            initialStartDate={savedPlan.startDate?.slice(0, ISO_DATE_LENGTH)}
            initialEndDate={savedPlan.endDate?.slice(0, ISO_DATE_LENGTH)}
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
                onEditTrip={() => setShowEditDetails(true)}
              />
            </div>
          </main>
        )}
      </div>

      {confirmComplete && (
        <Modal
          backdropClassName="bg-black/60"
          panelClassName="bg-surface border border-border-mid rounded-xl p-6 w-full max-w-sm shadow-2xl"
        >
          <h2 className="font-heading text-sub font-extrabold text-text mb-2">No journal entries yet.</h2>
          <p className="text-body text-text-mid leading-relaxed mb-5">
            Consider adding a trip report before marking this complete — it only takes a few minutes.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setConfirmComplete(false); jumpTo('journal') }}
              className="px-3 py-1.5 font-heading text-caption font-bold tracking-widest uppercase rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
            >
              Add entries
            </button>
            <button
              onClick={() => { doUpdate({ id: planId, body: { status: 'complete' } }); setConfirmComplete(false) }}
              className="px-3 py-1.5 font-heading text-caption font-bold tracking-widest uppercase rounded border cursor-pointer transition-colors"
              style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
            >
              Complete anyway
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}