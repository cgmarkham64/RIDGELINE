import type { JournalDay } from '../../types'

interface DayMeta {
  dayNumber: number
  date: string       // YYYY-MM-DD
  shortLabel: string // "AUG 12"
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
      shortLabel: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase(),
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
    <div style={{
      display: 'flex',
      gap: 0,
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      marginBottom: 22,
      overflowX: 'auto',
    }}>
      {days.map(({ dayNumber, date, shortLabel }, i) => {
        const isSelected = date === selectedDate
        const hasEntry = entryDates.has(date)

        return (
          <button
            key={date}
            onClick={() => onSelect(date)}
            style={{
              flex: 1,
              minWidth: 52,
              padding: '9px 4px',
              textAlign: 'center',
              cursor: 'pointer',
              borderRight: i < days.length - 1 ? '1px solid var(--border)' : 'none',
              background: isSelected ? 'var(--amber-glow)' : 'transparent',
              boxShadow: isSelected ? 'inset 0 0 0 1px var(--amber-border)' : 'none',
              transition: 'background 0.12s',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!isSelected) e.currentTarget.style.background = 'var(--surface3)'
            }}
            onMouseLeave={e => {
              if (!isSelected) e.currentTarget.style.background = 'transparent'
            }}
          >
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 17,
              fontWeight: 800,
              lineHeight: 1,
              color: isSelected ? 'var(--amber)' : 'var(--text-mid)',
              marginBottom: 2,
            }}>
              {dayNumber}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 7,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isSelected ? 'rgba(240,160,48,0.55)' : 'var(--text-dim)',
            }}>
              {shortLabel}
            </div>
            {hasEntry && (
              <div style={{
                position: 'absolute',
                bottom: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: isSelected ? 'var(--amber)' : 'var(--text-dim)',
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}