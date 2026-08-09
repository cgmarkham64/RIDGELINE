import type { Reminder } from './departStage.constants'
import { REMINDER_DATE_CLS } from './departStage.constants'

export function RemindersCard({ reminders, onToggle }: { reminders: Reminder[]; onToggle: (i: number) => void }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-3">Reminders</div>
      {reminders.map((r, i) => (
        <div
          key={r.date + r.description}
          className={`grid items-center gap-3 py-2.5 ${i < reminders.length - 1 ? 'border-b border-border' : ''}`}
          style={{ gridTemplateColumns: '56px 1fr 56px' }}
        >
          <span className={`font-mono text-fine font-bold ${REMINDER_DATE_CLS[r.tone]}`}>
            {r.date}
          </span>
          <span className="text-body-sm text-text">{r.description}</span>
          {r.set ? (
            <span className="font-mono text-label tracking-[0.12em] uppercase text-pine text-right">SET</span>
          ) : (
            <button
              type="button"
              onClick={() => onToggle(i)}
              className="font-heading text-label font-bold tracking-[0.08em] uppercase px-2 py-1 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer text-right"
            >
              Set
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
