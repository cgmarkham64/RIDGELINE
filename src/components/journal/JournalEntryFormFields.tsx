import type { UseFormRegister, FieldError } from 'react-hook-form'
import { JournalEntryHeader } from './JournalEntryHeader'
import { ConditionsGrid } from './ConditionsGrid'
import { PlannedTimesGrid } from './PlannedTimesGrid'
import { FieldNotesSection } from './FieldNotesSection'
import { WildlifeSection } from './WildlifeSection'
import { CompanionsSection } from './CompanionsSection'
import { JournalFormFooter } from './JournalFormFooter'
import type { FormValues, PlannedTimeRow } from './journalEntryForm.types'

type JournalEntryFormFieldsProps = {
  register: UseFormRegister<FormValues>
  dayNumber: number
  scanning: boolean
  scanError: string | null
  onScanFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  sys: 'imperial' | 'metric'
  plannedTimeRows: PlannedTimeRow[]
  bodyError: FieldError | undefined
  wildlife: string[]
  onWildlifeChange: (tags: string[]) => void
  companions: string[]
  onCompanionsChange: (tags: string[]) => void
  onMentionAdded: (sub: string) => void
  pendingInviteCount: number
  isError: boolean
  savedFeedback: boolean
  isNewEntry: boolean
  isPending: boolean
}

export function JournalEntryFormFields({
  register, dayNumber, scanning, scanError, onScanFile,
  sys, plannedTimeRows, bodyError,
  wildlife, onWildlifeChange, companions, onCompanionsChange, onMentionAdded, pendingInviteCount,
  isError, savedFeedback, isNewEntry, isPending,
}: JournalEntryFormFieldsProps) {
  return (
    <>
      <JournalEntryHeader
        register={register} dayNumber={dayNumber}
        scanning={scanning} scanError={scanError} onScanFile={onScanFile}
      />

      <ConditionsGrid register={register} sys={sys} />

      <PlannedTimesGrid rows={plannedTimeRows} register={register} />

      <FieldNotesSection register={register} error={bodyError} />

      <WildlifeSection wildlife={wildlife} onChange={onWildlifeChange} />

      <CompanionsSection
        companions={companions} onChange={onCompanionsChange}
        onMentionAdded={onMentionAdded} pendingInviteCount={pendingInviteCount}
      />

      <JournalFormFooter isError={isError} savedFeedback={savedFeedback} isNewEntry={isNewEntry} isPending={isPending} />
    </>
  )
}
