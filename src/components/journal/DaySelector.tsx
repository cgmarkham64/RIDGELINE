import { useMemo, useState } from 'react'
import type { JournalDay } from '../../types'
import type { DayMeta, Cell, MonthGroup } from './daySelector.types'
import { DayStrip } from './DayStrip'
import { DayCalendarGrid } from './DayCalendarGrid'

const MS_PER_DAY = 86_400_000
const DAYS_PER_WEEK = 7
const ISO_DATE_LENGTH = 10
const STRIP_VIEW_MAX_DAYS = 14

function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildDays(startDate: string, endDate: string): DayMeta[] {
  const days: DayMeta[] = []
  const start = new Date(startDate.slice(0, ISO_DATE_LENGTH) + 'T00:00:00')
  const end = new Date(endDate.slice(0, ISO_DATE_LENGTH) + 'T00:00:00')
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
    gridEnd.setDate(gridEnd.getDate() + (DAYS_PER_WEEK - 1 - gridEnd.getDay()))

    const weeks: Cell[][] = []
    let current = new Date(gridStart)

    while (current <= gridEnd) {
      const cells: Cell[] = []
      for (let i = 0; i < DAYS_PER_WEEK; i++) {
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

export function DaySelector({ startDate, endDate, selectedDate, entries, onSelect }: Props) {
  const days = useMemo(() => buildDays(startDate, endDate), [startDate, endDate])
  const entryDates = useMemo(() => new Set(entries.map((e) => e.date.slice(0, ISO_DATE_LENGTH))), [entries])
  const monthGroups = useMemo(() => buildMonthGroups(days), [days])
  const [visibleMonthIdx, setVisibleMonthIdx] = useState(0)
  const [prevStartDate, setPrevStartDate] = useState(startDate)
  if (prevStartDate !== startDate) {
    setPrevStartDate(startDate)
    setVisibleMonthIdx(0)
  }

  if (days.length <= STRIP_VIEW_MAX_DAYS) {
    return <DayStrip days={days} selectedDate={selectedDate} entryDates={entryDates} onSelect={onSelect} />
  }

  return (
    <DayCalendarGrid
      monthGroups={monthGroups}
      visibleMonthIdx={visibleMonthIdx}
      setVisibleMonthIdx={setVisibleMonthIdx}
      selectedDate={selectedDate}
      entryDates={entryDates}
      onSelect={onSelect}
    />
  )
}
