import type { Stage } from './types'
import type { SaveState } from './PlanWizard'
import { stageState, STAGE_TITLES, STAGE_SUBS, STAGES } from './constants'
import { Pill } from './Pill'
import { IconChevronRight, IconArrowLeft, IconArrowRight } from '../icons'

interface StageHeaderProps {
  stage: Stage
  stageIdx: number
  saveState: SaveState
  onJump: (id: string) => void
  onPrev: () => void
  onNext: () => void
}

export function StageHeader({ stage, stageIdx, saveState, onJump, onPrev, onNext }: StageHeaderProps) {
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
        <IconChevronRight size={9} />
        <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-amber">
          Stage {stage.n} · {stage.label}
        </span>
        <span className="w-1 h-1 rounded-full bg-text-dim" />
        <span className={`font-mono text-[9px] ${saveState === 'unsaved' ? 'text-amber' : 'text-text-dim'}`}>
          {saveState === 'saving' ? 'saving…' : saveState === 'unsaved' ? 'unsaved' : 'saved'}
        </span>

        <span className="ml-auto">
          {state === 'done'     && <Pill tone="pine">Locked</Pill>}
          {state === 'blocked'  && <Pill tone="amber">{stage.blockedReason ?? 'Waiting on upstream stage'}</Pill>}
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
            <IconArrowLeft size={10} />
          </button>
          <span className="font-mono text-[9px] text-text-dim px-1.5">{stageIdx + 1} / {STAGES.length}</span>
          <button
            onClick={onNext}
            disabled={stageIdx === STAGES.length - 1}
            className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1.5 rounded border border-border text-text cursor-pointer bg-transparent hover:border-border-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  )
}