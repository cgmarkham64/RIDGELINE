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
    <div className="h-[240px] relative overflow-hidden shrink-0">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, #1c1308 0%, #2e2618 22%, #3c3c2c 48%, #5a6858 72%, #8a9a88 100%)' }}
      />

      {/* Mountain silhouette */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1200 200"
          preserveAspectRatio="xMidYMax slice"
          style={{ display: 'block', width: '100%', height: 200 }}
        >
          <polygon
            points="0,200 130,200 230,68 340,140 470,28 590,108 710,44 840,125 970,62 1100,138 1200,90 1200,200"
            fill="#0f0d0b"
            opacity="0.97"
          />
          <polygon
            points="0,200 80,200 170,105 280,160 400,55 510,122 630,50 760,130 890,68 1020,148 1130,88 1200,120 1200,200"
            fill="#13100a"
            opacity="0.52"
          />
        </svg>
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(15,13,11,1) 0%, rgba(15,13,11,0.55) 32%, rgba(15,13,11,0.1) 65%, transparent 100%)' }}
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-[26px] py-5 flex items-end justify-between gap-[14px]">
        {/* Left: location, title, dates */}
        <div>
          <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-amber mb-[6px] flex items-center gap-[7px]">
            <span
              className="inline-block w-3 h-px bg-amber opacity-50"
            />
            {trip.location}
          </div>
          <h1 className="font-heading text-[34px] font-extrabold text-text leading-[1.05] tracking-[-0.01em] mb-[5px]">
            {trip.title}
          </h1>
          <div className="text-[13px] font-light italic text-text-mid">
            {formatDateRange(trip.startDate, trip.endDate)} &nbsp;·&nbsp; {days}{' '}
            {days === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Right: action buttons + stat strip */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex gap-[6px]">
            <button onClick={onShare} className="btn btn-pine btn-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-[13px] h-[13px] shrink-0"
                style={{ strokeWidth: 2 }}
              >
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <button onClick={onEdit} className="btn btn-sky btn-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-[13px] h-[13px] shrink-0"
                style={{ strokeWidth: 2 }}
              >
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Trip
            </button>
            <button onClick={onDelete} className="btn btn-danger btn-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-[13px] h-[13px] shrink-0"
                style={{ strokeWidth: 2 }}
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
              </svg>
              Delete
            </button>
          </div>

          {/* Stat pill strip */}
          <div className="flex gap-[1px] rounded-md overflow-hidden">
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
    <div
      className="border border-border px-[14px] py-[9px] text-center"
      style={{ background: 'rgba(15,13,11,0.82)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      <div className="font-heading text-[17px] font-extrabold text-amber leading-none mb-[3px]">
        {value}
      </div>
      <div className="font-mono text-[7px] tracking-[0.1em] uppercase text-text-dim">
        {label}
      </div>
    </div>
  )
}