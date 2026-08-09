export function DayStrip({ days, selectedDate, entryDates, onSelect }: {
  days: { dayNumber: number; date: string }[]
  selectedDate: string
  entryDates: Set<string>
  onSelect: (date: string) => void
}) {
  return (
    <div className="day-selector">
      {days.map(({ dayNumber, date }) => {
        const isSelected = date === selectedDate
        const hasEntry = entryDates.has(date)
        const shortLabel = new Date(date + 'T00:00:00')
          .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          .toUpperCase()
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
