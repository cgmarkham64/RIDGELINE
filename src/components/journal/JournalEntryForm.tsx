import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Trip, JournalDay } from '../../types'
import { useUnitSystem } from '../../hooks/useUnitSystem'
import { HikerOverlay } from '../ui/HikerOverlay'
import { JournalEntryFormFields } from './JournalEntryFormFields'
import { journalEntrySchema, type FormValues } from './journalEntryForm.types'
import { entryToDefaults, computeDayNumber, buildPlannedTimeRows } from './journalEntryForm.helpers'
import { useJournalEntrySave, useJournalScan, useFormAutoSave } from './journalEntryForm.hooks'

interface Props {
  trip: Trip
  currentEntry: JournalDay | undefined
  selectedDate: string
  readOnly?: boolean
}

// Keyed by day (currentEntry?._id ?? selectedDate) in the parent so switching days
// remounts this component — form defaults, wildlife, and companions all initialize
// fresh from props instead of needing effects to reset them.
export function JournalEntryForm({ trip, currentEntry, selectedDate, readOnly }: Props) {
  const sys = useUnitSystem()
  const [wildlife, setWildlife] = useState<string[]>(currentEntry?.wildlife ?? [])
  const [companions, setCompanions] = useState<string[]>(currentEntry?.companions ?? [])
  const panelsDirtyRef = useRef(false)

  const dayNumber = computeDayNumber(trip.startDate, selectedDate)
  const plannedTimeRows = buildPlannedTimeRows(trip, dayNumber)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: entryToDefaults(currentEntry, sys),
  })

  const { save, saving, savedFeedback, pendingInviteCount, addPendingShare, submit } =
    useJournalEntrySave(trip, selectedDate, dayNumber, currentEntry)
  const { scanning, scanError, handleScanFile } = useJournalScan(sys, setValue)

  const overlayVisible = !readOnly && (scanning || saving)

  async function onSubmit(data: FormValues) {
    if (readOnly) return
    await submit(data, sys, wildlife, companions)
  }

  const handleFormBlur = useFormAutoSave(handleSubmit, onSubmit, isDirty, panelsDirtyRef, getValues, readOnly)

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} onBlur={handleFormBlur}>
        <fieldset disabled={!!readOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
          <JournalEntryFormFields
            register={register} dayNumber={dayNumber}
            scanning={scanning} scanError={scanError} onScanFile={handleScanFile}
            sys={sys} plannedTimeRows={plannedTimeRows} bodyError={errors.body}
            wildlife={wildlife}
            onWildlifeChange={(tags) => { setWildlife(tags); panelsDirtyRef.current = true }}
            companions={companions}
            onCompanionsChange={(tags) => { setCompanions(tags); panelsDirtyRef.current = true }}
            onMentionAdded={addPendingShare} pendingInviteCount={pendingInviteCount}
            isError={save.isError} savedFeedback={savedFeedback}
            isNewEntry={!currentEntry} isPending={save.isPending}
          />
        </fieldset>
      </form>

      {overlayVisible && (
        <HikerOverlay label={scanning ? 'Scanning journal page…' : 'Saving entry…'} />
      )}
    </>
  )
}
