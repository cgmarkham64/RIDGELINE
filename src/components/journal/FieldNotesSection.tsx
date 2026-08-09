import type { UseFormRegister, FieldError } from 'react-hook-form'
import type { FormValues } from './journalEntryForm.types'

type FieldNotesSectionProps = {
  register: UseFormRegister<FormValues>
  error: FieldError | undefined
}

export function FieldNotesSection({ register, error }: FieldNotesSectionProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim shrink-0">Field Notes</span>
        <hr className="flex-1 border-0 border-t border-border" />
      </div>
      <div className="border-l-2 border-amber-border pl-4 mb-5">
        <textarea
          {...register('body')}
          rows={12}
          placeholder="Write about your day — the terrain, how you felt, what you saw…"
          className="w-full bg-transparent border-0 outline-none resize-none font-sans italic text-sm leading-[1.82] text-text-mid p-0"
        />
      </div>

      {error && <p className="text-fine text-red mb-3">{error.message}</p>}
    </>
  )
}
