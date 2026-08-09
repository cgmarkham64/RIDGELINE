import type { Stage, PlanView } from './types'
import { stageState } from './constants'
import { Ring } from './Ring'
import { IconChevronRight, IconMap } from '../icons'
import { StageRailHeader } from './StageRailHeader'
import { StageRailSnapshot } from './StageRailSnapshot'

interface StageRailProps {
  stages: Stage[]
  trip: { title: string; location: string; dateRange: string; miles: number | null; elevGainFt: number | null; days: number; weight: string }
  activeStageIdx: number
  view: PlanView
  totalDone: number
  totalAll: number
  onSelectStage: (i: number) => void
  onSelectOverview: () => void
  onEditDetails?: () => void
}

function StageRailItem({
  stage, isActive, onClick,
}: { stage: Stage; isActive: boolean; onClick: () => void }) {
  const state = stageState(stage)
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-2.5 py-2.5 rounded border-l-2 text-left transition-colors mb-0.5',
        isActive ? 'bg-amber-glow border-l-amber' : 'border-l-transparent hover:bg-surface-2',
      ].join(' ')}
    >
      <Ring done={stage.done} total={stage.total} blocked={stage.blocked} highlight={isActive} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-label text-text-dim tracking-[0.08em]">{stage.n}</span>
          <span className={`font-heading text-body-sm font-bold ${isActive ? 'text-amber' : state === 'done' ? 'text-text-mid' : 'text-text'}`}>
            {stage.label}
          </span>
        </div>
        <div className="font-mono text-label text-text-dim mt-0.5">
          {state === 'blocked' ? (stage.blockedReason ?? 'waiting on upstream stage') :
           state === 'done'    ? 'complete' :
           state === 'idle'    ? 'not started' :
           `${stage.done} of ${stage.total} items`}
        </div>
      </div>
      {isActive && <IconChevronRight size={11} />}
    </button>
  )
}

export function StageRail({ stages, trip, activeStageIdx, view, totalDone, totalAll, onSelectStage, onSelectOverview, onEditDetails }: StageRailProps) {
  const isOverview = view === 'overview'

  return (
    <aside className="w-[280px] shrink-0 bg-surface border-r border-border flex flex-col h-full overflow-hidden">
      <StageRailHeader trip={trip} onEditDetails={onEditDetails} />

      {/* Plan overview entry */}
      <div className="px-2 pt-2 shrink-0">
        <button
          onClick={onSelectOverview}
          className={[
            'w-full flex items-center gap-3 px-4 py-3 rounded border text-left transition-colors',
            isOverview
              ? 'bg-amber-glow border-amber-border'
              : 'bg-surface-2 border-border hover:border-border-mid',
          ].join(' ')}
        >
          <span className={[
            'w-7 h-7 rounded-md flex items-center justify-center border shrink-0',
            isOverview ? 'bg-amber-dim border-amber-border text-amber' : 'bg-bg border-border text-text-mid',
          ].join(' ')}>
            <IconMap size={14} />
          </span>
          <div className="flex-1 min-w-0">
            <div className={`font-heading text-body-sm font-bold ${isOverview ? 'text-amber' : 'text-text'}`}>Plan overview</div>
            <div className="font-mono text-label text-text-dim mt-0.5">{totalDone}/{totalAll} items · all stages</div>
          </div>
          {isOverview && <IconChevronRight size={11} />}
        </button>
      </div>

      {/* Stages label */}
      <div className="px-[18px] pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Stages</span>
          <span className="font-mono text-label text-text-dim">jump anywhere</span>
        </div>
      </div>

      {/* Stage list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {stages.map((s, i) => (
          <StageRailItem
            key={s.id}
            stage={s}
            isActive={view === 'stage' && i === activeStageIdx}
            onClick={() => onSelectStage(i)}
          />
        ))}
      </div>

      <StageRailSnapshot trip={trip} />
    </aside>
  )
}