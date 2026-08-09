import type { UseFormRegister } from 'react-hook-form'
import { condInputCls } from './journalEntryForm.helpers'
import type { FormValues, PlannedTimeRow } from './journalEntryForm.types'

type PlannedTimesGridProps = {
  rows: PlannedTimeRow[]
  register: UseFormRegister<FormValues>
}

export function PlannedTimesGrid({ rows, register }: PlannedTimesGridProps) {
  if (rows.length === 0) return null

  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim shrink-0">Times</span>
        <hr className="flex-1 border-0 border-t border-border" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {rows.map(({ label, planned, field }) => (
          <div key={field} className="bg-surface-2 border border-border rounded-md px-2.75 py-2.25">
            <div className="font-mono text-label tracking-[0.12em] uppercase text-text-mid mb-1.25">{label}</div>
            <div className="font-mono text-label text-text-dim mb-1">Plan: {planned}</div>
            <input {...register(field)} placeholder="HH:MM" className={condInputCls} />
          </div>
        ))}
      </div>
    </>
  )
}
