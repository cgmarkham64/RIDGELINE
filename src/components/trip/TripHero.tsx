import type { Trip } from '../../types'

interface Props {
  trip: Trip
  days: number
  onEdit: () => void
  onDelete: () => void
  onShare: () => void
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
  const full: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', full)}`
  }
  return `${s.toLocaleDateString('en-US', full)} – ${e.toLocaleDateString('en-US', full)}`
}

export function TripHero({ trip, days, onEdit, onDelete, onShare }: Props) {
  return (
    <div style={{ height: 240, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      {/* Gradient background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, #1c1308 0%, #2e2618 22%, #3c3c2c 48%, #5a6858 72%, #8a9a88 100%)',
      }} />

      {/* Mountain silhouette */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
        <svg viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice"
          style={{ display: 'block', width: '100%', height: 200 }}>
          <polygon
            points="0,200 130,200 230,68 340,140 470,28 590,108 710,44 840,125 970,62 1100,138 1200,90 1200,200"
            fill="#0f0d0b" opacity="0.97"
          />
          <polygon
            points="0,200 80,200 170,105 280,160 400,55 510,122 630,50 760,130 890,68 1020,148 1130,88 1200,120 1200,200"
            fill="#13100a" opacity="0.52"
          />
        </svg>
      </div>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(15,13,11,1) 0%, rgba(15,13,11,0.55) 32%, rgba(15,13,11,0.1) 65%, transparent 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '20px 26px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14,
      }}>
        {/* Left: location, title, dates */}
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{ display: 'inline-block', width: 12, height: 1, background: 'var(--amber)', opacity: 0.5 }} />
            {trip.location}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 800,
            color: 'var(--text)', lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: 5,
          }}>
            {trip.title}
          </h1>
          <div style={{ fontSize: 13, fontWeight: 300, fontStyle: 'italic', color: 'var(--text-mid)' }}>
            {formatDateRange(trip.startDate, trip.endDate)} &nbsp;·&nbsp; {days} {days === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Right: action buttons + stat strip */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onShare} className="btn btn-pine btn-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                style={{ width: 13, height: 13, strokeWidth: 2, flexShrink: 0 }}>
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <button onClick={onEdit} className="btn btn-sky btn-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                style={{ width: 13, height: 13, strokeWidth: 2, flexShrink: 0 }}>
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Trip
            </button>
            <button onClick={onDelete} className="btn btn-danger btn-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                style={{ width: 13, height: 13, strokeWidth: 2, flexShrink: 0 }}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
              </svg>
              Delete
            </button>
          </div>

          {/* Stat pill strip */}
          <div style={{ display: 'flex', gap: 1, borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <StatBlock value={String(days)} label={days === 1 ? 'day' : 'days'} />
            {trip.distanceMiles != null && (
              <StatBlock value={String(trip.distanceMiles)} label="miles" />
            )}
            {trip.elevationGainFt != null && (
              <StatBlock value={`+${trip.elevationGainFt.toLocaleString()}`} label="elev. gain" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div style={{
      background: 'rgba(15,13,11,0.82)', border: '1px solid var(--border)',
      padding: '9px 14px', textAlign: 'center',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    }}>
      <div style={{
        fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 800,
        color: 'var(--amber)', lineHeight: 1, marginBottom: 3,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 7,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)',
      }}>
        {label}
      </div>
    </div>
  )
}