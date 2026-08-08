import type { CSSProperties } from 'react'
import type { Trip } from '../../types'
import { kmToMiles, mToFt } from '../../lib/units'
import { isOwnedBy } from '../../lib/utils'
import type {
  DistElevFilters,
  DistElevRange,
  Ownership,
  SimpleFilters,
  TripFilterValues,
  TripStatus,
} from './tripSidebar.types'
import type { UnitSystem } from '../../lib/units'

export const ISO_DATE_LENGTH = 10

export const STATUS_TONE: Record<TripStatus, 'amber' | 'sky' | 'pine' | ''> = {
  planning:   'amber',
  ready:      'sky',
  'on-trail': 'pine',
  'wrap-up':  'amber',
  complete:   '',
}

export const STATUS_LABEL: Record<TripStatus, string> = {
  planning:   'Planning',
  ready:      'Ready',
  'on-trail': 'On Trail',
  'wrap-up':  'Wrap Up',
  complete:   'Complete',
}

export const ALL_STATUSES: TripStatus[] = ['planning', 'ready', 'on-trail', 'wrap-up', 'complete']

export const OWNERSHIP_OPTIONS: { value: Ownership; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'shared', label: 'Shared' },
]

const EMPTY_RANGE: DistElevRange = { minMiles: '', maxMiles: '', minElev: '', maxElev: '' }

export const INITIAL_SIMPLE_FILTERS: SimpleFilters = {
  search: '',
  ownership: 'all',
  dateFrom: '',
  dateTo: '',
  statusFilter: [],
}

export function initialDistElevFilters(sys: UnitSystem): DistElevFilters {
  return { sys, ...EMPTY_RANGE }
}

export function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d.slice(0, ISO_DATE_LENGTH) + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  return `${fmt(start)} – ${fmt(end)}`
}

const STATUS_URGENCY: Record<string, number> = {
  'on-trail': 0,
  'wrap-up':  0,
  ready:      1,
  planning:   1,
  complete:   2,
}

export function sortTrips(trips: Trip[] | undefined): Trip[] {
  if (!trips) return []
  return [...trips].sort((a, b) => {
    const aUrgency = STATUS_URGENCY[a.status ?? 'complete'] ?? 2
    const bUrgency = STATUS_URGENCY[b.status ?? 'complete'] ?? 2
    if (aUrgency !== bUrgency) return aUrgency - bUrgency
    if (aUrgency === 2) {
      return new Date(b.endDate ?? b.startDate).getTime() - new Date(a.endDate ?? a.startDate).getTime()
    }
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })
}

export function resolveDistElevFilters(stored: DistElevFilters, sys: UnitSystem): DistElevRange {
  if (stored.sys !== sys) return EMPTY_RANGE
  const { minMiles, maxMiles, minElev, maxElev } = stored
  return { minMiles, maxMiles, minElev, maxElev }
}

export function buildFilterValues(
  simple: SimpleFilters,
  distElevFilters: DistElevFilters,
  sys: UnitSystem,
): TripFilterValues {
  return { ...simple, distElev: resolveDistElevFilters(distElevFilters, sys), sys }
}

export function toggleStatusValue(list: TripStatus[], status: TripStatus): TripStatus[] {
  return list.includes(status) ? list.filter((s) => s !== status) : [...list, status]
}

function matchesSearch(trip: Trip, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return trip.title.toLowerCase().includes(q) || trip.location.toLowerCase().includes(q)
}

function matchesOwnership(trip: Trip, ownership: Ownership, userId: string | undefined): boolean {
  if (ownership === 'all') return true
  const isOwner = isOwnedBy(trip.ownerSub, userId)
  return ownership === 'mine' ? isOwner : !isOwner
}

function matchesDistance(trip: Trip, values: TripFilterValues): boolean {
  if (trip.distanceMiles == null) return true
  const { minMiles, maxMiles } = values.distElev
  const toMiles = (v: string) => (values.sys === 'metric' ? kmToMiles(parseFloat(v)) : parseFloat(v))
  if (minMiles && trip.distanceMiles < toMiles(minMiles)) return false
  if (maxMiles && trip.distanceMiles > toMiles(maxMiles)) return false
  return true
}

function matchesElevation(trip: Trip, values: TripFilterValues): boolean {
  if (trip.elevationGainFt == null) return true
  const { minElev, maxElev } = values.distElev
  const toFeet = (v: string) => (values.sys === 'metric' ? mToFt(parseFloat(v)) : parseFloat(v))
  if (minElev && trip.elevationGainFt < toFeet(minElev)) return false
  if (maxElev && trip.elevationGainFt > toFeet(maxElev)) return false
  return true
}

function matchesDateRange(trip: Trip, dateFrom: string, dateTo: string): boolean {
  if (dateFrom && trip.endDate.slice(0, ISO_DATE_LENGTH) < dateFrom) return false
  if (dateTo && trip.startDate.slice(0, ISO_DATE_LENGTH) > dateTo) return false
  return true
}

function matchesStatus(trip: Trip, statusFilter: TripStatus[]): boolean {
  if (statusFilter.length === 0) return true
  return statusFilter.includes((trip.status ?? 'complete') as TripStatus)
}

export function matchesFilters(trip: Trip, values: TripFilterValues, userId: string | undefined): boolean {
  return (
    matchesSearch(trip, values.search) &&
    matchesOwnership(trip, values.ownership, userId) &&
    matchesDistance(trip, values) &&
    matchesElevation(trip, values) &&
    matchesDateRange(trip, values.dateFrom, values.dateTo) &&
    matchesStatus(trip, values.statusFilter)
  )
}

export function hasActiveFilters(values: TripFilterValues): boolean {
  const { ownership, distElev, dateFrom, dateTo, statusFilter } = values
  return (
    ownership !== 'all' ||
    distElev.minMiles !== '' ||
    distElev.maxMiles !== '' ||
    distElev.minElev !== '' ||
    distElev.maxElev !== '' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    statusFilter.length > 0
  )
}

export function shouldShowResultCount(
  search: string,
  filtersActive: boolean,
  isLoading: boolean,
  isError: boolean,
): boolean {
  return (search.trim() !== '' || filtersActive) && !isLoading && !isError
}

export function tripItemContainerStyle(isSelected: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '7px 14px',
    cursor: 'pointer',
    borderLeft: `2px solid ${isSelected ? 'var(--amber)' : 'transparent'}`,
    background: isSelected ? 'var(--amber-glow)' : 'transparent',
    position: 'relative',
    transition: 'background 0.12s, border-color 0.12s',
  }
}
