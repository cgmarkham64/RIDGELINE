import { useState } from 'react'
import { IconPlus } from '../../../icons'
import { mergeCriticalDates } from './criticalDatesCard.helpers'
import { CriticalDatesList } from './CriticalDatesList'
import { CriticalDatesForm } from './CriticalDatesForm'
import type { PlanCriticalDate } from '../../types'

type Props = {
  manualDates: PlanCriticalDate[]
  scanDates:   PlanCriticalDate[]
  canEdit:     boolean
  onAdd:       (date: PlanCriticalDate) => void
  onRemove:    (id: string) => void
}

export function CriticalDatesCard({ manualDates, scanDates, canEdit, onAdd, onRemove }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const allDates = mergeCriticalDates(scanDates, manualDates)

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

      <CriticalDatesList dates={allDates} formOpen={formOpen} canEdit={canEdit} onRemove={onRemove} />

      {formOpen && <CriticalDatesForm onAdd={onAdd} onClose={() => setFormOpen(false)} />}
    </div>
  )
}
