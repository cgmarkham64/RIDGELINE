import type { Cell } from './daySelector.types'

export function CalendarDayCell({ cell, selectedDate, entryDates, onSelect }: {
  cell: Cell
  selectedDate: string
  entryDates: Set<string>
  onSelect: (date: string) => void
}) {
  if (!cell) {
    return <div className="py-2.25 border-r border-b border-border last:border-r-0" />
  }
  const isSelected = cell.date === selectedDate
  const hasEntry = entryDates.has(cell.date)
  const calDate = new Date(cell.date + 'T00:00:00')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase()

  return (
    <button
      onClick={() => onSelect(cell.date)}
      className={[
        'relative flex flex-col items-center justify-center py-2.25 gap-0.5 border-r border-b border-border last:border-r-0 transition-colors duration-120 cursor-pointer bg-transparent',
        isSelected
          ? 'bg-pine-glow shadow-[inset_0_0_0_1px_var(--color-pine-border)]'
          : 'hover:bg-surface-3',
      ].join(' ')}
    >
      <span className={[
        'font-heading text-body-sm font-extrabold leading-none',
        isSelected ? 'text-pine' : 'text-text-mid',
      ].join(' ')}>
        {cell.dayNumber}
      </span>
      <span className={[
        'font-mono text-label tracking-[0.06em] uppercase leading-none',
        isSelected ? 'text-pine/55' : 'text-text-dim',
      ].join(' ')}>
        {calDate}
      </span>
      {hasEntry && (
        <div className={[
          'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
          isSelected ? 'bg-pine' : 'bg-text-dim',
        ].join(' ')} />
      )}
    </button>
  )
}
