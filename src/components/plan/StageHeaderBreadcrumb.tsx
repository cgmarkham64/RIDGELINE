import type { Stage } from './types'
import type { SaveState } from './PlanWizard'
import { stageState } from './constants'
import { Pill } from './Pill'
import { IconChevronRight } from '../icons'

export function StageHeaderBreadcrumb({ stage, saveState, onJump }: {
  stage: Stage
  saveState: SaveState
  onJump: (id: string) => void
}) {
  const state = stageState(stage)

  return (
    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
      <button
        onClick={() => onJump('__overview__')}
        className="font-mono text-label tracking-[0.14em] uppercase text-text-dim bg-transparent border-none cursor-pointer p-0 hover:text-text-mid transition-colors"
      >
        Plan
      </button>
      <IconChevronRight size={9} />
      <span className="font-mono text-label tracking-[0.16em] uppercase text-amber">
        Stage {stage.n} · {stage.label}
      </span>
      <span className="w-1 h-1 rounded-full bg-text-dim" />
      <span className={`font-mono text-label ${saveState === 'unsaved' ? 'text-amber' : 'text-text-dim'}`}>
        {saveState === 'saving' ? 'saving…' : saveState === 'unsaved' ? 'unsaved' : 'saved'}
      </span>

      <span className="ml-auto flex items-center gap-2.5">
        {state === 'done'     && <Pill tone="pine">Locked</Pill>}
        {state === 'blocked'  && <Pill tone="amber">{stage.blockedReason ?? 'Waiting on upstream stage'}</Pill>}
        {state === 'progress' && <Pill tone="amber">{stage.done}/{stage.total} done</Pill>}
        {state === 'idle'     && <Pill>Not started</Pill>}
      </span>
    </div>
  )
}
