import type { Trip } from '../../types'
import { useTrips } from '../../hooks/useTrips'

interface Props {
  selectedId: string | null
  onSelect: (trip: Trip) => void
  onNew: () => void
  onEdit: (trip: Trip) => void
  onDelete: (trip: Trip) => void
}

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function TripSidebar({ selectedId, onSelect, onNew, onEdit, onDelete }: Props) {
  const { data: trips, isLoading, isError } = useTrips()

  const sorted = trips
    ? [...trips].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    : []

  return (
    <aside
      style={{
        width: 258,
        flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 14px 12px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
          }}
        >
          Trips
        </span>

        <button onClick={onNew} className="btn btn-primary btn-block">
          + New trip
        </button>
      </div>

      {/* Trip list */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '8px 0 16px' }}>
        {isLoading && (
          <p
            style={{
              padding: '24px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-dim)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Loading…
          </p>
        )}

        {isError && (
          <p
            style={{
              padding: '24px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--red)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Could not load trips
          </p>
        )}

        {!isLoading && !isError && sorted.length === 0 && (
          <p
            style={{
              padding: '24px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-dim)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              lineHeight: 1.8,
            }}
          >
            No trips yet.
            <br />
            Create one above.
          </p>
        )}

        {sorted.map((trip) => {
          const isSelected = trip._id === selectedId
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: isSelected ? 'var(--amber)' : 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: 2,
                  }}
                >
                  {trip.title}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--text-dim)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {trip.location}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--text-dim)',
                    marginTop: 1,
                  }}
                >
                  {formatDateRange(trip.startDate, trip.endDate)}
                </div>
                {(trip.distanceMiles || trip.elevationGainFt) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                    {trip.distanceMiles && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 8,
                          color: 'var(--text-dim)',
                        }}
                      >
                        {trip.distanceMiles} mi
                      </span>
                    )}
                    {trip.elevationGainFt && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 8,
                          color: 'var(--text-dim)',
                        }}
                      >
                        +{trip.elevationGainFt.toLocaleString()} ft
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Edit / delete — shown on hover via CSS */}
              <TripActions
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
  onEdit,
  onDelete,
}: {
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <div className="trip-actions" style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
      <button onClick={onEdit} title="Edit" className="btn-icon-action edit">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button onClick={onDelete} title="Delete" className="btn-icon-action del">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  )
}
