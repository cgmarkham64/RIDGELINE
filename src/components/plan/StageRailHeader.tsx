import { IconPencil } from '../icons'

export function StageRailHeader({
  trip,
  onEditDetails,
}: {
  trip: { title: string; location: string; dateRange: string }
  onEditDetails?: () => void
}) {
  return (
    <div className="px-[18px] py-3.5 border-b border-border shrink-0">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="font-mono text-label tracking-[0.16em] uppercase text-amber mb-1.5">{trip.location}</div>
          <div className="font-heading text-body-lg font-extrabold text-text leading-tight">{trip.title}</div>
          <div className="font-mono text-label text-text-dim mt-1 italic">{trip.dateRange}</div>
        </div>
        {onEditDetails && (
          <button
            onClick={onEditDetails}
            title="Edit trip details"
            className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded text-text-dim hover:text-amber hover:bg-surface-2 transition-colors duration-100"
          >
            <IconPencil />
          </button>
        )}
      </div>
    </div>
  )
}
