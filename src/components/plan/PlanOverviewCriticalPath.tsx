import type { PlanData } from './types'
import { STAGES } from './constants'
import { IconChevronRight } from '../icons'

const CRITICAL_PATH = [
  { d: 'Feb 1',  label: 'Whitney lottery opens',           stageId: 'permits', cls: 'text-amber border-amber-border bg-amber-dim' },
  { d: 'Mar 15', label: 'Whitney lottery closes',          stageId: 'permits', cls: 'text-amber border-amber-border bg-amber-dim' },
  { d: 'Mar 24', label: 'Lottery results — unblocks Gear', stageId: 'gear',    cls: 'text-sky border-sky-border bg-sky-dim'       },
  { d: 'Jul 1',  label: 'Resupply box ships to Bishop',    stageId: 'food',    cls: 'text-pine border-pine-border bg-pine-dim'    },
  { d: 'Aug 11', label: 'Fly out — pre-flight checklist',  stageId: 'depart',  cls: 'text-sky border-sky-border bg-sky-dim'       },
]

export function PlanOverviewCriticalPath({ plan, onJump }: { plan?: PlanData; onJump: (id: string) => void }) {
  return (
    <>
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
    </>
  )
}
