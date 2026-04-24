import type { JournalDay } from '../../types'

interface DayMeta {
  dayNumber: number
  date: string
  shortLabel: string
}

function buildDays(startDate: string, endDate: string): DayMeta[] {
  const days: DayMeta[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  let current = new Date(start)
  let dayNum = 1

  while (current <= end) {
    days.push({
      dayNumber: dayNum,
      date: current.toISOString().slice(0, 10),
      shortLabel: current
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        .toUpperCase(),
    })
    current = new Date(current.getTime() + 86_400_000)
    dayNum++
  }
  return days
}

interface Props {
  startDate: string
  endDate: string
  selectedDate: string
  entries: JournalDay[]
  onSelect: (date: string) => void
}

export function DaySelector({ startDate, endDate, selectedDate, entries, onSelect }: Props) {
  const days = buildDays(startDate, endDate)
  const entryDates = new Set(entries.map((e) => e.date.slice(0, 10)))

  return (
    <div className="day-selector">
      {days.map(({ dayNumber, date, shortLabel }) => {
        const isSelected = date === selectedDate
        const hasEntry = entryDates.has(date)

        return (
          <button
            key={date}
            onClick={() => onSelect(date)}
            className={`day-btn${isSelected ? ' active' : ''}`}
          >
            <div className="day-btn-num">{dayNumber}</div>
            <div className="day-btn-date">{shortLabel}</div>
            {hasEntry && <div className="day-btn-dot" />}
          </button>
        )
      })}
    </div>
  )
}
