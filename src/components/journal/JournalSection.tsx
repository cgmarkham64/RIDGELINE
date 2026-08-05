import { useState } from 'react'
import type { Trip } from '../../types'
import { useJournalDays } from '../../hooks/useJournalDays'
import { MoonLoader } from '../ui/MoonLoader'
import { DaySelector } from './DaySelector'
import { JournalEntryForm } from './JournalEntryForm'

const ISO_DATE_LENGTH = 10

interface Props {
  trip: Trip
  readOnly?: boolean
}

export function JournalSection({ trip, readOnly }: Props) {
  // Adjusting state when a prop changes, done during render rather than in an
  // effect — see https://react.dev/learn/you-might-not-need-an-effect
  const [priorTripId, setPriorTripId] = useState(trip._id)
  const [selectedDate, setSelectedDate] = useState(trip.startDate.slice(0, ISO_DATE_LENGTH))
  if (trip._id !== priorTripId) {
    setPriorTripId(trip._id)
    setSelectedDate(trip.startDate.slice(0, ISO_DATE_LENGTH))
  }

  const { data: entries = [], isLoading } = useJournalDays(trip._id)
  const currentEntry = entries.find((e) => e.date.slice(0, ISO_DATE_LENGTH) === selectedDate)

  return (
    <section>
      <div className="sec-label">Journal</div>

      <DaySelector
        startDate={trip.startDate}
        endDate={trip.endDate}
        selectedDate={selectedDate}
        entries={entries}
        onSelect={(date) => setSelectedDate(date)}
      />

      {readOnly && (
        <div className="mb-4 px-3 py-2 rounded border border-border bg-surface-2 font-mono text-label tracking-[0.12em] uppercase text-text-dim">
          View only — you have view access to this trip
        </div>
      )}

      {isLoading ? (
        <MoonLoader />
      ) : (
        <JournalEntryForm
          key={currentEntry?._id ?? selectedDate}
          trip={trip}
          currentEntry={currentEntry}
          selectedDate={selectedDate}
          readOnly={readOnly}
        />
      )}
    </section>
  )
}
