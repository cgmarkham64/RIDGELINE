import type { Stage } from './types'
import { stageState, STAGE_TITLES, STAGE_SUBS, STAGES } from './constants'
import { Pill } from './Pill'

interface StageHeaderProps {
  stage: Stage
  stageIdx: number
  onJump: (id: string) => void
  onPrev: () => void
  onNext: () => void
}

export function StageHeader({ stage, stageIdx, onJump, onPrev, onNext }: StageHeaderProps) {
  const state = stageState(stage)

  return (
    <div className="px-8 pt-5 pb-3.5 border-b border-border bg-surface shrink-0">
      {/* Breadcrumb + meta row */}
      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
        <button
          onClick={() => onJump('__overview__')}
          className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim bg-transparent border-none cursor-pointer p-0 hover:text-text-mid transition-colors"
        >
          Plan
        </button>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-amber">
          Stage {stage.n} · {stage.label}
        </span>
        <span className="w-1 h-1 rounded-full bg-text-dim" />
        <span className="font-mono text-[9px] text-text-dim">auto-saved</span>

        <span className="ml-auto">
          {state === 'done'     && <Pill tone="pine">Locked</Pill>}
          {state === 'blocked'  && <Pill tone="amber">Waiting on permit</Pill>}
          {state === 'progress' && <Pill tone="amber">{stage.done}/{stage.total} done</Pill>}
          {state === 'idle'     && <Pill>Not started</Pill>}
        </span>
      </div>

      {/* Title + prev/next row */}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-heading text-[26px] font-extrabold tracking-[-0.005em] text-text">
            {STAGE_TITLES[stage.id]}
          </h1>
          <p className="text-[13px] text-text-mid mt-0.5">{STAGE_SUBS[stage.id]}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onPrev}
            disabled={stageIdx === 0}
            className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1.5 rounded border border-border text-text cursor-pointer bg-transparent hover:border-border-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <span className="font-mono text-[9px] text-text-dim px-1.5">{stageIdx + 1} / {STAGES.length}</span>
          <button
            onClick={onNext}
            disabled={stageIdx === STAGES.length - 1}
            className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1.5 rounded border border-border text-text cursor-pointer bg-transparent hover:border-border-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}