import { useTrips } from '../../hooks/useTrips'
import { useAuthStore } from '../../store/auth'
import { useUnitSystem } from '../../hooks/useUnitSystem'
import { isOwnedBy } from '../../lib/utils'
import { TripSidebarHeader } from './TripSidebarHeader'
import { TripListStatus } from './TripListStatus'
import { TripListItem } from './TripListItem'
import { useTripFilters } from './useTripFilters'
import { matchesFilters, shouldShowResultCount, sortTrips } from './tripSidebar.helpers'
import type { TripSidebarProps } from './tripSidebar.types'

export function TripSidebar({ selectedId, onSelect, onNew, onEdit, onDelete }: TripSidebarProps) {
  const { data: trips, isLoading, isError } = useTrips()
  const userId = useAuthStore((s) => s.user?.id)
  const sys = useUnitSystem()
  const filters = useTripFilters(sys)

  const sorted = sortTrips(trips)
  const filtered = sorted.filter((trip) => matchesFilters(trip, filters.values, userId))
  const showResultCount = shouldShowResultCount(filters.values.search, filters.active, isLoading, isError)

  return (
    <aside className="w-64.5 shrink-0 bg-surface border-r border-border flex flex-col h-full">
      <TripSidebarHeader onNew={onNew} filters={filters} />

      <div className="flex-1 overflow-y-auto min-h-0 py-2 pb-4">
        <TripListStatus
          isLoading={isLoading}
          isError={isError}
          sortedCount={sorted.length}
          filteredCount={filtered.length}
          showResultCount={showResultCount}
        />

        {filtered.map((trip) => (
          <TripListItem
            key={trip._id}
            trip={trip}
            isSelected={trip._id === selectedId}
            isOwner={isOwnedBy(trip.ownerSub, userId)}
            sys={sys}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </aside>
  )
}
