import type { Stage } from './types'
import { stageState, STAGE_DESCRIPTIONS } from './constants'
import { Ring } from './Ring'
import { Pill } from './Pill'
import { IconArrowRight } from '../icons'

export function PlanOverviewStageGrid({ stages, onJump }: { stages: Stage[]; onJump: (id: string) => void }) {
  return (
    <>
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-3">Stages</div>
      <div className="grid grid-cols-2 gap-3.5 mb-7">
        {stages.map((s) => {
          const state = stageState(s)
          return (
            <button
              key={s.id}
              onClick={() => onJump(s.id)}
              className="bg-surface border border-border rounded-lg p-4 text-left cursor-pointer flex flex-col gap-3 hover:border-amber-border transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Ring done={s.done} total={s.total} blocked={s.blocked} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-label text-text-dim">{s.n}</span>
                    <span className="font-heading text-body-lg font-extrabold text-text">{s.label}</span>
                  </div>
                  <div className="font-mono text-label text-text-dim mt-0.5">{s.sub}</div>
                </div>
                {state === 'done'     && <Pill tone="pine">Locked</Pill>}
                {state === 'blocked'  && <Pill tone="amber">Waiting</Pill>}
                {state === 'progress' && <Pill tone="amber">In progress</Pill>}
                {state === 'idle'     && <Pill>Not started</Pill>}
              </div>
              <p className="text-body-sm text-text-mid leading-snug">
                {STAGE_DESCRIPTIONS[s.id]}
              </p>
              <div className="flex justify-between items-center pt-2.5 border-t border-border">
                <span className="font-mono text-label text-text-dim">
                  {s.blocked ? (s.blockedReason ?? 'waiting on upstream stage') : `${s.done} of ${s.total} items`}
                </span>
                <span className="text-fine text-amber font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open
                  <IconArrowRight size={10} />
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}
