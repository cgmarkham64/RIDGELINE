import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { PlanView, StageId, PlanData, PlanMeta } from './types'
import { createStages } from './constants'
import { StageRail } from './StageRail'
import { StageHeader } from './StageHeader'
import { PlanOverview } from './PlanOverview'
import { RouteStage } from './stages/RouteStage'
import { WeatherStage } from './stages/WeatherStage'
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
  weather: WeatherStage,
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
      if (s.id === 'weather') {
        const w = plan.weather
        const checks = w ? [w.historicalReviewed, w.sunriseReviewed, w.forecastChecked, w.gearAdjusted, w.departureRisk !== null] : []
        seeded = { ...s, done: checks.filter(Boolean).length }
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
    const is403 = (error as { response?: { status?: number } })?.response?.status === 403
    return (
      <div className="flex h-full items-center justify-center w-full">
        <div className="text-center max-w-xs px-6">

          {/* Bear peeking over a food bag */}
          <svg viewBox="0 0 200 200" width="180" height="180" className="mx-auto mb-5" aria-hidden="true">

            {/* ── Food bag (hero) ── */}
            {/* Bag body */}
            <rect x="22" y="108" width="156" height="88" rx="14" fill="#f0a030"/>
            {/* Bag shading */}
            <rect x="22" y="108" width="156" height="88" rx="14" fill="url(#bagShade)"/>
            {/* Gathered neck / cinch */}
            <rect x="54" y="96" width="92" height="22" rx="9" fill="#c47820"/>
            {/* Drawstring loop */}
            <path d="M84 96 Q100 82 116 96" stroke="#a36010" strokeWidth="4" fill="none" strokeLinecap="round"/>
            {/* Cord toggle */}
            <rect x="94" y="78" width="12" height="8" rx="3" fill="#7a4810"/>
            {/* Bag label area */}
            <rect x="60" y="126" width="80" height="46" rx="8" fill="#e09020" opacity="0.5"/>

            {/* ── Bear head peeking over the top ── */}
            {/* Ear backs (behind head) */}
            <circle cx="67"  cy="86" r="16" fill="#7a4820"/>
            <circle cx="133" cy="86" r="16" fill="#7a4820"/>
            {/* Head */}
            <circle cx="100" cy="98" r="44" fill="#9a5e2e"/>
            {/* Ear fronts */}
            <circle cx="67"  cy="86" r="10" fill="#b97840"/>
            <circle cx="133" cy="86" r="10" fill="#b97840"/>
            {/* Snout */}
            <ellipse cx="100" cy="113" rx="17" ry="12" fill="#b97840"/>
            {/* Nose */}
            <ellipse cx="100" cy="106" rx="6.5" ry="4.5" fill="#2a1008"/>
            {/* Caught expression: wide eyes, one brow up one furrowed */}
            <circle cx="85"  cy="92" r="6.5" fill="#2a1008"/>
            <circle cx="115" cy="92" r="6.5" fill="#2a1008"/>
            <circle cx="83"  cy="90" r="2.5" fill="white" opacity="0.9"/>
            <circle cx="113" cy="90" r="2.5" fill="white" opacity="0.9"/>
            {/* Left brow — raised high (surprised) */}
            <path d="M78 82 Q85 77 92 81" stroke="#2a1008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            {/* Right brow — furrowed inward (guilty) */}
            <path d="M108 79 Q115 82 122 79" stroke="#2a1008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            {/* Mouth — small flat "uh oh" line */}
            <path d="M93 120 Q100 118 107 120" stroke="#2a1008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            {/* Paws gripping bag rim */}
            <ellipse cx="46"  cy="110" rx="18" ry="11" fill="#9a5e2e"/>
            <ellipse cx="154" cy="110" rx="18" ry="11" fill="#9a5e2e"/>
            {/* Paw toe lines */}
            <line x1="36" y1="106" x2="34" y2="114" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="46" y1="104" x2="46" y2="113" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="56" y1="106" x2="58" y2="114" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="144" y1="106" x2="142" y2="114" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="154" y1="104" x2="154" y2="113" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="164" y1="106" x2="166" y2="114" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>

            {/* ── Jail bars (foreground — drawn last so they sit in front) ── */}
            {/* Horizontal crossbars */}
            <rect x="0" y="0"   width="200" height="11" fill="#1a1410"/>
            <rect x="0" y="189" width="200" height="11" fill="#1a1410"/>
            <rect x="0" y="94"  width="200" height="9"  fill="#1a1410"/>
            {/* Vertical bars — 6 bars with ~23px gaps */}
            {([14, 47, 80, 114, 147, 180] as number[]).map(x => (
              <g key={x}>
                <rect x={x}   y="0" width="10" height="200" rx="3" fill="#1a1410"/>
                <rect x={x+1} y="0" width="3"  height="200" rx="2" fill="#2e2620" opacity="0.7"/>
              </g>
            ))}

            <defs>
              <linearGradient id="bagShade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="white" stopOpacity="0.12"/>
                <stop offset="100%" stopColor="black" stopOpacity="0.18"/>
              </linearGradient>
            </defs>
          </svg>

          <div className="font-heading text-[17px] font-extrabold text-text mb-2">
            {is403 ? 'Looks like you got uninvited' : 'Something scared us off the trail'}
          </div>
          <p className="text-[13px] text-text-mid leading-relaxed">
            {is403
              ? "You no longer have access to this trip. If you think this is a mistake, contact the trip owner — they'll know what to do."
              : "We hit an unexpected snag loading this trip. Try refreshing the page to get back on track."}
          </p>
        </div>
      </div>
    )
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
                onEditTrip={() => setShowEditDetails(true)}
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
                className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-widest uppercase rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
              >
                Add entries
              </button>
              <button
                onClick={() => { doUpdate({ id: planId, body: { status: 'complete' } }); setConfirmComplete(false) }}
                className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-widest uppercase rounded border cursor-pointer transition-colors"
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