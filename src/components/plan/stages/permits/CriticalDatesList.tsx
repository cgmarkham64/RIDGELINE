import { IconX } from '../../../icons'
import { formatDateOnly } from './criticalDates.helpers'
import type { PermitTone } from './permitsStage.types'
import type { PlanCriticalDate } from '../../types'

const TONE_DATE_CLS: Record<PermitTone, string> = {
  amber: 'bg-amber-dim border-amber-border text-amber',
  sky:   'bg-sky-dim border-sky-border text-sky',
  pine:  'bg-pine-dim border-pine-border text-pine',
}

type CriticalDatesListProps = {
  dates: PlanCriticalDate[]
  formOpen: boolean
  canEdit: boolean
  onRemove: (id: string) => void
}

export function CriticalDatesList({ dates, formOpen, canEdit, onRemove }: CriticalDatesListProps) {
  if (dates.length === 0 && !formOpen) {
    return (
      <p className="font-mono text-label text-text-dim leading-relaxed mt-1.5">
        No dates yet — permit deadlines will appear here.
      </p>
    )
  }

  return (
    <>
      {dates.map((d, i) => (
        <div
          key={d.id}
          className={`flex items-start gap-2.5 py-2 ${i < dates.length - 1 || formOpen ? 'border-b border-border' : ''}`}
        >
          <span className={`font-mono text-caption font-bold px-1.5 py-0.5 rounded border shrink-0 mt-px ${TONE_DATE_CLS[d.tone]}`}>
            {formatDateOnly(d.dateMs)}
          </span>
          <span className="text-fine text-text-mid flex-1 min-w-0 break-words">{d.label}</span>
          {canEdit && (
            <button
              onClick={() => onRemove(d.id)}
              className="p-0.5 rounded text-text-dim hover:text-red transition-colors cursor-pointer bg-transparent border-none shrink-0 mt-px"
              title="Remove"
            >
              <IconX size={10} />
            </button>
          )}
        </div>
      ))}
    </>
  )
}
