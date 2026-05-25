import { useMemo, useState } from 'react'
import type { JournalDay } from '../../types'
import { IconChevronLeft, IconChevronRight } from '../icons'

interface DayMeta {
  dayNumber: number
  date: string // YYYY-MM-DD, local time
}

type Cell = DayMeta | null
interface MonthGroup {
  label: string
  weeks: Cell[][]
  nextLabel: string | null // trip continues into this month name
}

function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildDays(startDate: string, endDate: string): DayMeta[] {
  const days: DayMeta[] = []
  const start = new Date(startDate.slice(0, 10) + 'T00:00:00')
  const end = new Date(endDate.slice(0, 10) + 'T00:00:00')
  let current = new Date(start)
  let dayNum = 1
  while (current <= end) {
    days.push({ dayNumber: dayNum, date: localDateStr(current) })
    current = new Date(current.getTime() + MS_PER_DAY)
    dayNum++
  }
  return days
}

function buildMonthGroups(days: DayMeta[]): MonthGroup[] {
  const dayMap = new Map(days.map((d) => [d.date, d]))

  const monthKeys: string[] = []
  for (const d of days) {
    const dt = new Date(d.date + 'T00:00:00')
    const key = `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2, '0')}`
    if (monthKeys[monthKeys.length - 1] !== key) monthKeys.push(key)
  }

  const groups: MonthGroup[] = []

  for (let mi = 0; mi < monthKeys.length; mi++) {
    const [year, month] = monthKeys[mi].split('-').map(Number)

    const label = new Date(year, month, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })

    const inMonth = days.filter((d) => {
      const dt = new Date(d.date + 'T00:00:00')
      return dt.getFullYear() === year && dt.getMonth() === month
    })
    if (inMonth.length === 0) continue

    const firstDt = new Date(inMonth[0].date + 'T00:00:00')
    const lastDt = new Date(inMonth[inMonth.length - 1].date + 'T00:00:00')

    const gridStart = new Date(firstDt)
    gridStart.setDate(gridStart.getDate() - gridStart.getDay())
    const gridEnd = new Date(lastDt)
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()))

    const weeks: Cell[][] = []
    let current = new Date(gridStart)

    while (current <= gridEnd) {
      const cells: Cell[] = []
      for (let i = 0; i < 7; i++) {
        const dateStr = localDateStr(current)
        const dt = new Date(dateStr + 'T00:00:00')
        if (dt.getFullYear() === year && dt.getMonth() === month) {
          cells.push(dayMap.get(dateStr) ?? null)
        } else {
          cells.push(null)
        }
        current = new Date(current.getTime() + MS_PER_DAY)
      }
      weeks.push(cells)
    }

    const nextLabel = mi < monthKeys.length - 1
      ? (() => {
          const [ny, nm] = monthKeys[mi + 1].split('-').map(Number)
          return new Date(ny, nm, 1).toLocaleDateString('en-US', { month: 'long' })
        })()
      : null

    groups.push({ label, weeks, nextLabel })
  }

  return groups
}

interface Props {
  startDate: string
  endDate: string
  selectedDate: string
  entries: JournalDay[]
  onSelect: (date: string) => void
}

const MS_PER_DAY = 86_400_000
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function DaySelector({ startDate, endDate, selectedDate, entries, onSelect }: Props) {
  const days = useMemo(() => buildDays(startDate, endDate), [startDate, endDate])
  const entryDates = useMemo(() => new Set(entries.map((e) => e.date.slice(0, 10))), [entries])
  const monthGroups = useMemo(() => buildMonthGroups(days), [days])
  const [visibleMonthIdx, setVisibleMonthIdx] = useState(0)
  const [prevStartDate, setPrevStartDate] = useState(startDate)
  if (prevStartDate !== startDate) {
    setPrevStartDate(startDate)
    setVisibleMonthIdx(0)
  }

  // ── Strip view (≤ 14 days) ───────────────────────────────────────────────
  if (days.length <= 14) {
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

  // ── Calendar grid with month pagination ──────────────────────────────────
  const clampedIdx = Math.min(visibleMonthIdx, monthGroups.length - 1)
  const currentMonth = monthGroups[clampedIdx]
  const canPrev = clampedIdx > 0
  const canNext = clampedIdx < monthGroups.length - 1

  return (
    <div className="mb-5.5 w-1/2 mx-auto bg-surface-2 border border-border rounded-md overflow-hidden">
      {/* Month nav header */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-border">
        {monthGroups.length > 1 ? (
          <button
            onClick={() => setVisibleMonthIdx((i) => Math.max(0, i - 1))}
            disabled={!canPrev}
            className="w-6 h-6 flex items-center justify-center rounded-sm text-text-dim hover:text-text hover:bg-surface-3 disabled:opacity-30 disabled:cursor-default transition-colors duration-120 cursor-pointer"
          >
            <IconChevronLeft size={14} />
          </button>
        ) : <div className="w-6" />}
        <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-mid">
          {currentMonth?.label}
        </span>
        {monthGroups.length > 1 ? (
          <button
            onClick={() => setVisibleMonthIdx((i) => Math.min(monthGroups.length - 1, i + 1))}
            disabled={!canNext}
            className="w-6 h-6 flex items-center justify-center rounded-sm text-text-dim hover:text-text hover:bg-surface-3 disabled:opacity-30 disabled:cursor-default transition-colors duration-120 cursor-pointer"
          >
            <IconChevronRight size={14} />
          </button>
        ) : <div className="w-6" />}
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-border">
        {DOW.map((d, i) => (
          <div key={i} className="text-center py-1.5 font-mono text-[9px] tracking-widest uppercase text-text-dim">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {currentMonth?.weeks.map((cells, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {cells.map((cell, ci) => {
            if (!cell) {
              return <div key={ci} className="py-2.25 border-r border-b border-border last:border-r-0" />
            }
            const isSelected = cell.date === selectedDate
            const hasEntry = entryDates.has(cell.date)
            const calDate = new Date(cell.date + 'T00:00:00')
              .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              .toUpperCase()

            return (
              <button
                key={ci}
                onClick={() => onSelect(cell.date)}
                className={[
                  'relative flex flex-col items-center justify-center py-2.25 gap-0.5 border-r border-b border-border last:border-r-0 transition-colors duration-120 cursor-pointer bg-transparent',
                  isSelected
                    ? 'bg-amber-glow shadow-[inset_0_0_0_1px_var(--color-amber-border)]'
                    : 'hover:bg-surface-3',
                ].join(' ')}
              >
                <span className={[
                  'font-heading text-[12px] font-extrabold leading-none',
                  isSelected ? 'text-amber' : 'text-text-mid',
                ].join(' ')}>
                  {cell.dayNumber}
                </span>
                <span className={[
                  'font-mono text-[9px] tracking-[0.06em] uppercase leading-none',
                  isSelected ? 'text-amber/55' : 'text-text-dim',
                ].join(' ')}>
                  {calDate}
                </span>
                {hasEntry && (
                  <div className={[
                    'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                    isSelected ? 'bg-amber' : 'bg-text-dim',
                  ].join(' ')} />
                )}
              </button>
            )
          })}
        </div>
      ))}

      {/* Continues indicator */}
      {currentMonth?.nextLabel && (
        <button
          onClick={() => setVisibleMonthIdx((i) => i + 1)}
          className="w-full flex items-center justify-end gap-1.5 px-2.5 py-1.5 border-t border-border text-text-dim hover:text-text hover:bg-surface-3 transition-colors duration-120 cursor-pointer"
        >
          <span className="font-mono text-[9px] tracking-widest uppercase">
            Continues in {currentMonth.nextLabel}
          </span>
          <IconChevronRight size={12} />
        </button>
      )}
    </div>
  )
}
