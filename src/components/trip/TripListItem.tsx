import type { Trip } from '../../types'
import { Pill } from '../plan/Pill'
import { fmtDist, fmtElevGain } from '../../lib/units'
import type { UnitSystem } from '../../lib/units'
import { STATUS_TONE, STATUS_LABEL, formatDateRange, tripItemContainerStyle } from './tripSidebar.helpers'
import type { TripStatus } from './tripSidebar.types'

interface TripItemMetaProps {
  trip: Trip
  isOwner: boolean
  sys: UnitSystem
}

function TripItemMeta({ trip, isOwner, sys }: TripItemMetaProps) {
  return (
    <>
      {(trip.distanceMiles || trip.elevationGainFt) && (
        <div className="flex gap-2 mt-0.75">
          {trip.distanceMiles != null && (
            <span className="font-mono text-label text-text-dim">{fmtDist(trip.distanceMiles, sys)}</span>
          )}
          {trip.elevationGainFt != null && (
            <span className="font-mono text-label text-text-dim">{fmtElevGain(trip.elevationGainFt, sys)}</span>
          )}
        </div>
      )}
      {!isOwner && (
        <div className="font-mono text-label mt-0.75" style={{ color: 'var(--amber)', opacity: 0.7 }}>
          Shared by {trip.ownerName ?? '…'}
        </div>
      )}
    </>
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

interface TripListItemProps {
  trip: Trip
  isSelected: boolean
  isOwner: boolean
  sys: UnitSystem
  onSelect: (trip: Trip) => void
  onEdit: (trip: Trip) => void
  onDelete: (trip: Trip) => void
}

export function TripListItem({ trip, isSelected, isOwner, sys, onSelect, onEdit, onDelete }: TripListItemProps) {
  return (
    <div
      onClick={() => onSelect(trip)}
      className={`trip-item${isSelected ? ' active' : ''}`}
      style={tripItemContainerStyle(isSelected)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
          <span
            className="font-heading text-body-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0"
            style={{ color: isSelected ? 'var(--amber)' : 'var(--text)' }}
          >
            {trip.title}
          </span>
          {trip.status && (
            <Pill tone={STATUS_TONE[trip.status as TripStatus]}>
              {STATUS_LABEL[trip.status as TripStatus]}
            </Pill>
          )}
        </div>
        <div className="font-mono text-label text-text-dim whitespace-nowrap overflow-hidden text-ellipsis">
          {trip.location}
        </div>
        <div className="font-mono text-label text-text-dim mt-px">
          {formatDateRange(trip.startDate, trip.endDate)}
        </div>
        <TripItemMeta trip={trip} isOwner={isOwner} sys={sys} />
      </div>

      <TripActions
        isOwner={isOwner}
        onEdit={(e) => { e.stopPropagation(); onEdit(trip) }}
        onDelete={(e) => { e.stopPropagation(); onDelete(trip) }}
      />
    </div>
  )
}
