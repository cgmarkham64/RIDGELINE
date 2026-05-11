import type { Stage, PlanView } from './types'
import { stageState } from './constants'
import { Ring } from './Ring'

interface StageRailProps {
  stages: Stage[]
  trip: { title: string; location: string; dateRange: string; miles: number; elev: string; days: number; weight: string }
  activeStageIdx: number
  view: PlanView
  totalDone: number
  totalAll: number
  onSelectStage: (i: number) => void
  onSelectOverview: () => void
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
          <span className="font-mono text-[9px] text-text-dim tracking-[0.08em]">{stage.n}</span>
          <span className={`font-heading text-[12px] font-bold ${isActive ? 'text-amber' : state === 'done' ? 'text-text-mid' : 'text-text'}`}>
            {stage.label}
          </span>
        </div>
        <div className="font-mono text-[8px] text-text-dim mt-0.5">
          {state === 'blocked' ? 'waiting on permit' :
           state === 'done'    ? 'complete' :
           state === 'idle'    ? 'not started' :
           `${stage.done} of ${stage.total} items`}
        </div>
      </div>
      {isActive && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber shrink-0">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  )
}

export function StageRail({ stages, trip, activeStageIdx, view, totalDone, totalAll, onSelectStage, onSelectOverview }: StageRailProps) {
  const isOverview = view === 'overview'

  return (
    <aside className="w-[280px] shrink-0 bg-surface border-r border-border flex flex-col h-full overflow-hidden">
      {/* Trip identity */}
      <div className="px-[18px] py-3.5 border-b border-border shrink-0">
        <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-amber mb-1.5">{trip.location}</div>
        <div className="font-heading text-[16px] font-extrabold text-text">{trip.title}</div>
        <div className="font-mono text-[9px] text-text-dim mt-1 italic">{trip.dateRange}</div>
      </div>

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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <div className={`font-heading text-[12px] font-bold ${isOverview ? 'text-amber' : 'text-text'}`}>Plan overview</div>
            <div className="font-mono text-[8px] text-text-dim mt-0.5">{totalDone}/{totalAll} items · all stages</div>
          </div>
          {isOverview && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>
      </div>

      {/* Stages label */}
      <div className="px-[18px] pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Stages</span>
          <span className="font-mono text-[9px] text-text-dim">jump anywhere</span>
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

      {/* Snapshot stats */}
      <div className="px-[18px] py-3 border-t border-border shrink-0">
        <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2">Snapshot</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { value: trip.miles,  label: 'miles' },
            { value: trip.elev,   label: 'gain' },
            { value: trip.days,   label: 'days' },
            { value: trip.weight, label: 'base' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-surface border border-border rounded p-2.5 text-center">
              <div className="font-heading text-[17px] font-extrabold text-amber leading-none mb-1">{value}</div>
              <div className="font-mono text-[8px] tracking-[0.14em] uppercase text-text-dim">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}