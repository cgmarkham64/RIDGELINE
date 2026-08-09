import { IconChevronLeft, IconChevronRight } from '../icons'
import type { MonthGroup } from './daySelector.types'
import { CalendarDayCell } from './CalendarDayCell'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function DayCalendarGrid({ monthGroups, visibleMonthIdx, setVisibleMonthIdx, selectedDate, entryDates, onSelect }: {
  monthGroups: MonthGroup[]
  visibleMonthIdx: number
  setVisibleMonthIdx: (updater: (i: number) => number) => void
  selectedDate: string
  entryDates: Set<string>
  onSelect: (date: string) => void
}) {
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
        <span className="font-mono text-label tracking-[0.14em] uppercase text-text-mid">
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
          <div key={i} className="text-center py-1.5 font-mono text-label tracking-widest uppercase text-text-dim">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {currentMonth?.weeks.map((cells, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {cells.map((cell, ci) => (
            <CalendarDayCell key={ci} cell={cell} selectedDate={selectedDate} entryDates={entryDates} onSelect={onSelect} />
          ))}
        </div>
      ))}

      {/* Continues indicator */}
      {currentMonth?.nextLabel && (
        <button
          onClick={() => setVisibleMonthIdx((i) => i + 1)}
          className="w-full flex items-center justify-end gap-1.5 px-2.5 py-1.5 border-t border-border text-text-dim hover:text-text hover:bg-surface-3 transition-colors duration-120 cursor-pointer"
        >
          <span className="font-mono text-label tracking-widest uppercase">
            Continues in {currentMonth.nextLabel}
          </span>
          <IconChevronRight size={12} />
        </button>
      )}
    </div>
  )
}
