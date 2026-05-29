import { useState } from 'react'
import type { Stage, PlanData } from './types'
import { stageState, STAGES, STAGE_DESCRIPTIONS } from './constants'
import { Ring } from './Ring'
import { Pill } from './Pill'
import { IconArrowLeft, IconArrowRight, IconChevronRight } from '../icons'

const CRITICAL_PATH = [
  { d: 'Feb 1',  label: 'Whitney lottery opens',           stageId: 'permits', cls: 'text-amber border-amber-border bg-amber-dim' },
  { d: 'Mar 15', label: 'Whitney lottery closes',          stageId: 'permits', cls: 'text-amber border-amber-border bg-amber-dim' },
  { d: 'Mar 24', label: 'Lottery results — unblocks Gear', stageId: 'gear',    cls: 'text-sky border-sky-border bg-sky-dim'       },
  { d: 'Jul 1',  label: 'Resupply box ships to Bishop',    stageId: 'food',    cls: 'text-pine border-pine-border bg-pine-dim'    },
  { d: 'Aug 11', label: 'Fly out — pre-flight checklist',  stageId: 'depart',  cls: 'text-sky border-sky-border bg-sky-dim'       },
]

const FORWARD: Partial<Record<string, { label: string; next: string }>> = {
  planning:   { label: 'Mark ready',  next: 'ready' },
  ready:      { label: 'Start trip',  next: 'on-trail' },
  'on-trail': { label: 'Finish trip', next: 'wrap-up' },
  'wrap-up':  { label: 'Complete',    next: 'complete' },
}

interface PlanOverviewProps {
  stages: Stage[]
  totalDone: number
  totalAll: number
  onJump: (id: string) => void
  plan?: PlanData
  tripStatus?: string
  isOwner?: boolean
  onStatusChange?: (newStatus: string) => void
}

export function PlanOverview({ stages, totalDone, totalAll, onJump, plan, tripStatus, isOwner, onStatusChange }: PlanOverviewProps) {
  const [confirmBack, setConfirmBack] = useState(false)
  const forward = tripStatus ? FORWARD[tripStatus] : undefined
  const canGoBack = isOwner && !!tripStatus && tripStatus !== 'planning'

  return (
    <>
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Plan overview</span>
            <span className="w-1 h-1 rounded-full bg-text-dim" />
            <span className="font-mono text-label text-text-dim">auto-saved</span>
          </div>
          <div className="flex justify-between items-end gap-6">
            <div>
              <h1 className="font-heading text-h1 font-extrabold tracking-[-0.005em] text-text mb-1">
                The whole plan, at a glance.
              </h1>
              <p className="text-body text-text-mid max-w-[620px]">
                Every stage and where it stands. Jump straight into whichever one needs you — order doesn't matter.
              </p>
            </div>
            <div className="flex items-end gap-3 shrink-0">
              {isOwner && (forward || canGoBack) && (
                <div className="flex items-center gap-2">
                  {canGoBack && (
                    <button
                      onClick={() => setConfirmBack(true)}
                      className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-widest uppercase px-3 py-1.5 rounded border border-border bg-transparent text-text-dim cursor-pointer hover:border-border-mid hover:text-text transition-colors"
                    >
                      <IconArrowLeft size={10} />
                      Planning
                    </button>
                  )}
                  {forward && onStatusChange && (
                    <button
                      onClick={() => onStatusChange(forward.next)}
                      className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-widest uppercase px-3 py-1.5 rounded border cursor-pointer transition-colors"
                      style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
                    >
                      {forward.label}
                      <IconArrowRight size={10} />
                    </button>
                  )}
                </div>
              )}
              <div className="text-right">
                <div className="font-mono text-h2 font-bold text-amber leading-none">
                  {totalDone}<span className="text-text-dim text-body-lg">/{totalAll}</span>
                </div>
                <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mt-0.5">items locked</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 pb-20">
          {/* Stage cards grid */}
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

          {/* Critical path */}
          <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-3">Critical path</div>
          {plan !== undefined ? (
            <div className="bg-surface border border-border rounded-lg px-4 py-6 text-center">
              <p className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1.5">No critical dates yet</p>
              <p className="text-body-sm text-text-mid">
                Permit deadlines from Stage 3 · Permits and reminders from Stage 6 · Depart will appear here.
              </p>
            </div>
          ) : (
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
                  <span className={`font-mono text-caption font-semibold text-center px-1.5 py-1 rounded border ${row.cls}`}>
                    {row.d}
                  </span>
                  <span className="text-body-sm text-text">{row.label}</span>
                  <span className="font-mono text-label text-text-dim text-right">
                    {STAGES.find(s => s.id === row.stageId)?.label}
                  </span>
                  <IconChevronRight size={11} />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {confirmBack && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-surface border border-border-mid rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-heading text-sub font-extrabold text-text mb-2">Back to planning?</h2>
            <p className="text-body text-text-mid leading-relaxed mb-5">
              This resets the trip status to{' '}
              <span className="text-amber font-semibold">Planning</span>. You can re-advance it any time.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmBack(false)}
                className="px-3 py-1.5 font-heading text-caption font-bold tracking-widest uppercase rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
              >
                Cancel
              </button>
              <button
                onClick={() => { onStatusChange?.('planning'); setConfirmBack(false) }}
                className="px-3 py-1.5 font-heading text-caption font-bold tracking-widest uppercase rounded border cursor-pointer transition-colors"
                style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
              >
                Back to planning
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}