import type { Trip } from '../../types'
import { useAuthStore } from '../../store/auth'
import { milesToKm, ftToM, distUnit, elevUnit } from '../../lib/units'
import { useUnitSystem } from '../../hooks/useUnitSystem'
import { isOwnedBy } from '../../lib/utils'
import { TripHeroBackground } from './TripHeroBackground'
import { TripHeroActions } from './TripHeroActions'

interface Props {
  trip: Trip
  days: number
  onEdit: () => void
  onDelete: () => void
  onShare: () => void
  onLeave: () => void
}

const ISO_DATE_LENGTH = 10

function formatDateRange(start: string, end: string) {
  const s = new Date(start.slice(0, ISO_DATE_LENGTH) + 'T00:00:00')
  const e = new Date(end.slice(0, ISO_DATE_LENGTH) + 'T00:00:00')
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
  const full: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', full)}`
  }
  return `${s.toLocaleDateString('en-US', full)} – ${e.toLocaleDateString('en-US', full)}`
}

export function TripHero({ trip, days, onEdit, onDelete, onShare, onLeave }: Props) {
  const userId = useAuthStore((s) => s.user?.id)
  const isOwner = isOwnedBy(trip.ownerSub, userId)
  const sys = useUnitSystem()

  return (
    <div className="h-[240px] relative overflow-hidden shrink-0">
      <TripHeroBackground />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-[26px] py-5 flex items-end justify-between gap-3.5">
        {/* Left: location, title, dates */}
        <div>
          <div className="font-mono text-label tracking-[0.14em] uppercase text-amber mb-1.5 flex items-center gap-1.75">
            <span
              className="inline-block w-3 h-px bg-amber opacity-50"
            />
            {trip.location}
          </div>
          <h1 className="font-heading text-hero font-extrabold text-text leading-[1.05] tracking-[-0.01em] mb-1.25">
            {trip.title}
          </h1>
          <div className="text-body font-light italic text-text-mid">
            {formatDateRange(trip.startDate, trip.endDate)} &nbsp;·&nbsp; {days}{' '}
            {days === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Right: action buttons + stat strip */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <TripHeroActions isOwner={isOwner} onEdit={onEdit} onDelete={onDelete} onShare={onShare} onLeave={onLeave} />

          {/* Stat pill strip */}
          <div className="flex gap-px rounded-md overflow-hidden">
            <StatBlock value={String(days)} label={days === 1 ? 'day' : 'days'} />
            {trip.distanceMiles != null && (
              <StatBlock
                value={sys === 'metric' ? milesToKm(trip.distanceMiles).toFixed(1) : String(trip.distanceMiles)}
                label={distUnit(sys)}
              />
            )}
            {trip.elevationGainFt != null && (
              <StatBlock
                value={`+${(sys === 'metric' ? ftToM(trip.elevationGainFt) : trip.elevationGainFt).toLocaleString()}`}
                label={`elev. gain (${elevUnit(sys)})`}
              />
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
      className="border border-border px-3.5 py-[9px] text-center"
      style={{ background: 'rgba(15,13,11,0.82)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      <div className="font-heading text-[17px] font-extrabold text-amber leading-none mb-[3px]">
        {value}
      </div>
      <div className="font-mono text-label tracking-widest uppercase text-text-dim">
        {label}
      </div>
    </div>
  )
}
