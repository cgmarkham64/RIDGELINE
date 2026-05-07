import type { Trip } from '../../types'
import { useTrips } from '../../hooks/useTrips'
import { useAuthStore } from '../../store/auth'

interface Props {
  selectedId: string | null
  onSelect: (trip: Trip) => void
  onNew: () => void
  onEdit: (trip: Trip) => void
  onDelete: (trip: Trip) => void
}

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function TripSidebar({ selectedId, onSelect, onNew, onEdit, onDelete }: Props) {
  const { data: trips, isLoading, isError } = useTrips()
  const userId = useAuthStore((s) => s.user?.id)

  const sorted = trips
    ? [...trips].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    : []

  return (
    <aside className="w-64.5 shrink-0 bg-surface border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-3.5 pt-4 pb-3 border-b border-border shrink-0 flex flex-col gap-2.5">
        <span className="font-heading text-[9px] font-extrabold tracking-[0.22em] uppercase text-text-dim">
          Trips
        </span>

        <button onClick={onNew} className="btn btn-primary btn-block">
          + New trip
        </button>
      </div>

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2 pb-4">
        {isLoading && (
          <p className="px-3.5 pt-6 pb-6 font-mono text-[9px] text-text-dim tracking-widest uppercase">
            Loading…
          </p>
        )}

        {isError && (
          <p className="px-3.5 pt-6 pb-6 font-mono text-[9px] text-red tracking-widest uppercase">
            Could not load trips
          </p>
        )}

        {!isLoading && !isError && sorted.length === 0 && (
          <p className="px-3.5 pt-6 pb-6 font-mono text-[9px] text-text-dim tracking-widest uppercase leading-[1.8]">
            No trips yet.
            <br />
            Create one above.
          </p>
        )}

        {sorted.map((trip) => {
          const isSelected = trip._id === selectedId
          const isOwner = !!userId && trip.ownerSub === userId
          return (
            <div
              key={trip._id}
              onClick={() => onSelect(trip)}
              className={`trip-item${isSelected ? ' active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 14px',
                cursor: 'pointer',
                borderLeft: `2px solid ${isSelected ? 'var(--amber)' : 'transparent'}`,
                background: isSelected ? 'var(--amber-glow)' : 'transparent',
                position: 'relative',
                transition: 'background 0.12s, border-color 0.12s',
              }}
            >
              <div className="flex-1 min-w-0">
                <div
                  className="font-heading text-[12px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis mb-0.5"
                  style={{ color: isSelected ? 'var(--amber)' : 'var(--text)' }}
                >
                  {trip.title}
                </div>
                <div className="font-mono text-[9px] text-text-dim whitespace-nowrap overflow-hidden text-ellipsis">
                  {trip.location}
                </div>
                <div className="font-mono text-[9px] text-text-dim mt-px">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </div>
                {(trip.distanceMiles || trip.elevationGainFt) && (
                  <div className="flex gap-2 mt-0.75">
                    {trip.distanceMiles && (
                      <span className="font-mono text-[9px] text-text-dim">
                        {trip.distanceMiles} mi
                      </span>
                    )}
                    {trip.elevationGainFt && (
                      <span className="font-mono text-[9px] text-text-dim">
                        +{trip.elevationGainFt.toLocaleString()} ft
                      </span>
                    )}
                  </div>
                )}
                {!isOwner && (
                  <div className="font-mono text-[9px] mt-0.75" style={{ color: 'var(--amber)', opacity: 0.7 }}>
                    Shared by {trip.ownerName ?? '…'}
                  </div>
                )}
              </div>

              {/* Edit / delete — shown on hover via CSS */}
              <TripActions
                isOwner={isOwner}
                onEdit={(e) => {
                  e.stopPropagation()
                  onEdit(trip)
                }}
                onDelete={(e) => {
                  e.stopPropagation()
                  onDelete(trip)
                }}
              />
            </div>
          )
        })}
      </div>
    </aside>
  )
}

function TripActions({
  isOwner,
  onEdit,
  onDelete,
}: {
  isOwner: boolean
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <div className="trip-actions flex gap-0.75 shrink-0">
      <button onClick={onEdit} title="Edit" className="btn-icon-action edit">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      {isOwner && (
        <button onClick={onDelete} title="Delete" className="btn-icon-action del">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      )}
    </div>
  )
}