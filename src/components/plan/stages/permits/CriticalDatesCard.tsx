import { useState } from 'react'
import { IconPlus, IconX, IconCheck } from '../../../icons'
import { formatCriticalDate, toDateMs } from './criticalDates.helpers'
import type { PermitTone } from './permitsStage.types'
import type { PlanCriticalDate } from '../../types'

const TONE_OPTS: { value: PermitTone; label: string; activeCls: string }[] = [
  { value: 'amber', label: 'Deadline', activeCls: 'bg-amber-dim border-amber-border text-amber' },
  { value: 'sky',   label: 'Booking',  activeCls: 'bg-sky-dim border-sky-border text-sky'       },
  { value: 'pine',  label: 'Info',     activeCls: 'bg-pine-dim border-pine-border text-pine'     },
]

const TONE_DATE_CLS: Record<PermitTone, string> = {
  amber: 'bg-amber-dim border-amber-border text-amber',
  sky:   'bg-sky-dim border-sky-border text-sky',
  pine:  'bg-pine-dim border-pine-border text-pine',
}

const INPUT_CLS = 'px-2.5 py-1.5 bg-surface-2 border border-border rounded font-mono text-fine text-text outline-none focus:border-border-mid transition-[border-color]'

type Props = {
  manualDates: PlanCriticalDate[]
  scanDates:   PlanCriticalDate[]
  canEdit:     boolean
  onAdd:       (date: PlanCriticalDate) => void
  onRemove:    (id: string) => void
}

export function CriticalDatesCard({ manualDates, scanDates, canEdit, onAdd, onRemove }: Props) {
  const [formOpen,   setFormOpen]   = useState(false)
  const [draftDate,  setDraftDate]  = useState('')
  const [draftTime,  setDraftTime]  = useState('')
  const [draftLabel, setDraftLabel] = useState('')
  const [draftTone,  setDraftTone]  = useState<PermitTone>('amber')

  const allDates = [...scanDates, ...manualDates].sort((a, b) => a.dateMs - b.dateMs)

  function handleAdd() {
    if (!draftDate || !draftLabel.trim()) return
    onAdd({
      id:      `manual__${Date.now()}`,
      dateMs:  toDateMs(draftDate, draftTime || undefined),
      hasTime: !!draftTime,
      label:   draftLabel.trim(),
      tone:    draftTone,
      source:  'manual',
    })
    setDraftDate('')
    setDraftTime('')
    setDraftLabel('')
    setDraftTone('amber')
    setFormOpen(false)
  }

  function handleCancel() {
    setFormOpen(false)
    setDraftDate('')
    setDraftTime('')
    setDraftLabel('')
    setDraftTone('amber')
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="flex items-center justify-between mb-1">
        <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Critical dates</div>
        {canEdit && !formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="p-1 rounded text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none"
            title="Add date"
          >
            <IconPlus size={11} />
          </button>
        )}
      </div>

      {allDates.length === 0 && !formOpen && (
        <p className="font-mono text-label text-text-dim leading-relaxed mt-1.5">
          No dates yet — permit deadlines will appear here.
        </p>
      )}

      {allDates.map((d, i) => (
        <div
          key={d.id}
          className={`flex items-center gap-2.5 py-2 ${i < allDates.length - 1 || formOpen ? 'border-b border-border' : ''}`}
        >
          <span className={`font-mono text-caption font-bold px-1.5 py-0.5 rounded border shrink-0 ${TONE_DATE_CLS[d.tone]}`}>
            {formatCriticalDate(d)}
          </span>
          <span className="text-fine text-text-mid flex-1 min-w-0 truncate">{d.label}</span>
          {d.source === 'manual' && canEdit && (
            <button
              onClick={() => onRemove(d.id)}
              className="p-0.5 rounded text-text-dim hover:text-red transition-colors cursor-pointer bg-transparent border-none shrink-0"
              title="Remove"
            >
              <IconX size={10} />
            </button>
          )}
        </div>
      ))}

      {formOpen && (
        <div className="pt-2.5 flex flex-col gap-2">
          <input
            type="text"
            value={draftLabel}
            onChange={e => setDraftLabel(e.target.value)}
            placeholder="Description"
            autoFocus
            className={`w-full ${INPUT_CLS}`}
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={draftDate}
              onChange={e => setDraftDate(e.target.value)}
              className={`flex-1 ${INPUT_CLS}`}
            />
            <input
              type="time"
              value={draftTime}
              onChange={e => setDraftTime(e.target.value)}
              className={`w-28 shrink-0 ${INPUT_CLS}`}
            />
          </div>
          <div className="flex gap-1.5">
            {TONE_OPTS.map(t => (
              <button
                key={t.value}
                onClick={() => setDraftTone(t.value)}
                className={`flex-1 px-2 py-1 rounded border font-mono text-label font-bold tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                  draftTone === t.value ? t.activeCls : 'bg-transparent border-border text-text-dim hover:border-border-mid'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5 pt-0.5">
            <button
              onClick={handleAdd}
              disabled={!draftDate || !draftLabel.trim()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-pine-border text-pine bg-pine-dim font-heading text-caption font-bold tracking-[0.08em] uppercase disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:brightness-95 transition-all"
            >
              <IconCheck size={9} /> Add
            </button>
            <button
              onClick={handleCancel}
              className="font-mono text-label text-text-dim hover:text-text transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
