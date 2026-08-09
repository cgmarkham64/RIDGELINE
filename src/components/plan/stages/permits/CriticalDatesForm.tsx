import { useState } from 'react'
import { toDateMs } from './criticalDates.helpers'
import { CriticalDateFields } from './CriticalDateFields'
import { CriticalDateToneRow } from './CriticalDateToneRow'
import { CriticalDateFormActions } from './CriticalDateFormActions'
import type { PermitTone } from './permitsStage.types'
import type { PlanCriticalDate } from '../../types'

type CriticalDatesFormProps = {
  onAdd: (date: PlanCriticalDate) => void
  onClose: () => void
}

export function CriticalDatesForm({ onAdd, onClose }: CriticalDatesFormProps) {
  const [draftDate,  setDraftDate]  = useState('')
  const [draftTime,  setDraftTime]  = useState('')
  const [draftLabel, setDraftLabel] = useState('')
  const [draftTone,  setDraftTone]  = useState<PermitTone>('amber')

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
    onClose()
  }

  return (
    <div className="pt-2.5 flex flex-col gap-2">
      <CriticalDateFields
        label={draftLabel} date={draftDate} time={draftTime}
        onLabelChange={setDraftLabel} onDateChange={setDraftDate} onTimeChange={setDraftTime}
      />
      <CriticalDateToneRow tone={draftTone} onChange={setDraftTone} />
      <CriticalDateFormActions onAdd={handleAdd} onClose={onClose} disabled={!draftDate || !draftLabel.trim()} />
    </div>
  )
}
