import type { Stage } from './types'
import { stageState, STAGES, STAGE_DESCRIPTIONS } from './constants'
import { Ring } from './Ring'
import { Pill } from './Pill'

const CRITICAL_PATH = [
  { d: 'Feb 1',  label: 'Whitney lottery opens',           stageId: 'permits', cls: 'text-amber border-amber-border bg-amber-dim' },
  { d: 'Mar 15', label: 'Whitney lottery closes',          stageId: 'permits', cls: 'text-amber border-amber-border bg-amber-dim' },
  { d: 'Mar 24', label: 'Lottery results — unblocks Gear', stageId: 'gear',    cls: 'text-sky border-sky-border bg-sky-dim'       },
  { d: 'Jul 1',  label: 'Resupply box ships to Bishop',    stageId: 'food',    cls: 'text-pine border-pine-border bg-pine-dim'    },
  { d: 'Aug 11', label: 'Fly out — pre-flight checklist',  stageId: 'depart',  cls: 'text-sky border-sky-border bg-sky-dim'       },
]

interface PlanOverviewProps {
  stages: Stage[]
  totalDone: number
  totalAll: number
  onJump: (id: string) => void
}

export function PlanOverview({ stages, totalDone, totalAll, onJump }: PlanOverviewProps) {
  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Plan overview</span>
          <span className="w-1 h-1 rounded-full bg-text-dim" />
          <span className="font-mono text-[9px] text-text-dim">auto-saved</span>
        </div>
        <div className="flex justify-between items-end gap-6">
          <div>
            <h1 className="font-heading text-[26px] font-extrabold tracking-[-0.005em] text-text mb-1">
              The whole plan, at a glance.
            </h1>
            <p className="text-[13px] text-text-mid max-w-[620px]">
              Every stage and where it stands. Jump straight into whichever one needs you — order doesn't matter.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-[22px] font-bold text-amber leading-none">
              {totalDone}<span className="text-text-dim text-[16px]">/{totalAll}</span>
            </div>
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mt-0.5">items locked</div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 pb-20">
        {/* Stage cards grid */}
        <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Stages</div>
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
                      <span className="font-mono text-[9px] text-text-dim">{s.n}</span>
                      <span className="font-heading text-[16px] font-extrabold text-text">{s.label}</span>
                    </div>
                    <div className="font-mono text-[9px] text-text-dim mt-0.5">{s.sub}</div>
                  </div>
                  {state === 'done'     && <Pill tone="pine">Locked</Pill>}
                  {state === 'blocked'  && <Pill tone="amber">Waiting</Pill>}
                  {state === 'progress' && <Pill tone="amber">In progress</Pill>}
                  {state === 'idle'     && <Pill>Not started</Pill>}
                </div>
                <p className="text-[12px] text-text-mid leading-snug">
                  {STAGE_DESCRIPTIONS[s.id]}
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-border">
                  <span className="font-mono text-[9px] text-text-dim">
                    {s.blocked ? (s.blockedReason ?? 'waiting on upstream stage') : `${s.done} of ${s.total} items`}
                  </span>
                  <span className="text-[11px] text-amber font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Open
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Critical path */}
        <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Critical path</div>
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {CRITICAL_PATH.map((row, i) => (
            <button
              key={row.label}
              onClick={() => onJump(row.stageId)}
              className={[
                'w-full grid items-center px-4 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-surface-2 transition-colors',
                i < CRITICAL_PATH.length - 1 ? 'border-b border-border' : '',
              ].join(' ')}
              style={{ gridTemplateColumns: '70px 1fr 110px 18px', gap: 14 }}
            >
              <span className={`font-mono text-[10px] font-semibold text-center px-1.5 py-1 rounded border ${row.cls}`}>
                {row.d}
              </span>
              <span className="text-[12px] text-text">{row.label}</span>
              <span className="font-mono text-[9px] text-text-dim text-right">
                {STAGES.find(s => s.id === row.stageId)?.label}
              </span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}