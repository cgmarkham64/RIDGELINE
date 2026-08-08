import { useState } from 'react'
import type { UnitSystem } from '../../lib/units'
import {
  buildFilterValues,
  hasActiveFilters,
  initialDistElevFilters,
  INITIAL_SIMPLE_FILTERS,
  toggleStatusValue,
} from './tripSidebar.helpers'
import type { DistElevFilters, DistElevRange, SimpleFilters, TripStatus } from './tripSidebar.types'

export function useTripFilters(sys: UnitSystem) {
  const [simple, setSimple] = useState<SimpleFilters>(INITIAL_SIMPLE_FILTERS)
  const [distElevFilters, setDistElevFilters] = useState<DistElevFilters>(initialDistElevFilters(sys))

  const values = buildFilterValues(simple, distElevFilters, sys)

  function patch(fields: Partial<SimpleFilters>) {
    setSimple((s) => ({ ...s, ...fields }))
  }

  function toggleStatus(status: TripStatus) {
    setSimple((s) => ({ ...s, statusFilter: toggleStatusValue(s.statusFilter, status) }))
  }

  function patchDistElev(fields: Partial<DistElevRange>) {
    setDistElevFilters((f) => ({ ...f, sys, ...fields }))
  }

  function clear() {
    setSimple(INITIAL_SIMPLE_FILTERS)
    setDistElevFilters(initialDistElevFilters(sys))
  }

  return { values, active: hasActiveFilters(values), patch, toggleStatus, patchDistElev, clear }
}

export type TripFiltersState = ReturnType<typeof useTripFilters>
