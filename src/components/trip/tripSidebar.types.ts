import type { Trip } from '../../types'
import type { UnitSystem } from '../../lib/units'

export interface TripSidebarProps {
  selectedId: string | null
  onSelect: (trip: Trip) => void
  onNew: () => void
  onEdit: (trip: Trip) => void
  onDelete: (trip: Trip) => void
}

export type Ownership = 'all' | 'mine' | 'shared'
export type TripStatus = 'planning' | 'ready' | 'on-trail' | 'wrap-up' | 'complete'

export interface DistElevRange {
  minMiles: string
  maxMiles: string
  minElev: string
  maxElev: string
}

// Tagged with the unit system it was entered under — when sys changes, the
// stored range is stale and resolveDistElevFilters() blanks it out so filters
// don't silently reinterpret old values under new units.
export interface DistElevFilters extends DistElevRange {
  sys: UnitSystem
}

export interface SimpleFilters {
  search: string
  ownership: Ownership
  dateFrom: string
  dateTo: string
  statusFilter: TripStatus[]
}

export interface TripFilterValues {
  search: string
  ownership: Ownership
  distElev: DistElevRange
  sys: UnitSystem
  dateFrom: string
  dateTo: string
  statusFilter: TripStatus[]
}
