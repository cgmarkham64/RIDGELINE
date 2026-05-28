import { useEffect, useRef, useState } from 'react'
import type { Trip } from '../../types'
import { useTrips } from '../../hooks/useTrips'
import { useAuthStore } from '../../store/auth'
import { MoonLoader } from '../ui/MoonLoader'
import { Pill } from '../plan/Pill'
import { kmToMiles, mToFt, fmtDist, fmtElevGain, distUnit, elevUnit } from '../../lib/units'
import { useUnitSystem } from '../../hooks/useUnitSystem'

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

type Ownership = 'all' | 'mine' | 'shared'
type TripStatus = 'planning' | 'ready' | 'on-trail' | 'wrap-up' | 'complete'

const STATUS_TONE: Record<TripStatus, 'amber' | 'sky' | 'pine' | ''> = {
  planning:   'amber',
  ready:      'sky',
  'on-trail': 'pine',
  'wrap-up':  'amber',
  complete:   '',
}
const STATUS_LABEL: Record<TripStatus, string> = {
  planning:   'Planning',
  ready:      'Ready',
  'on-trail': 'On Trail',
  'wrap-up':  'Wrap Up',
  complete:   'Complete',
}
const ALL_STATUSES: TripStatus[] = ['planning', 'ready', 'on-trail', 'wrap-up', 'complete']

const filterInputCls ='w-full px-2 py-[4px] bg-surface-2 border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color] duration-[140ms]'
const filterDateInputCls = 'w-full px-2 py-[4px] bg-surface-2 border border-border rounded-sm font-mono text-[10px] text-text outline-none focus:border-border-mid transition-[border-color] duration-[140ms]'

export function TripSidebar({ selectedId, onSelect, onNew, onEdit, onDelete }: Props) {
  const { data: trips, isLoading, isError } = useTrips()
  const userId = useAuthStore((s) => s.user?.id)
  const sys = useUnitSystem()

  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [ownership, setOwnership] = useState<Ownership>('all')
  const [minMiles, setMinMiles] = useState('')
  const [maxMiles, setMaxMiles] = useState('')
  const [minElev, setMinElev] = useState('')
  const [maxElev, setMaxElev] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<TripStatus[]>([])

  const hasActiveFilters = ownership !== 'all' || minMiles !== '' || maxMiles !== '' || minElev !== '' || maxElev !== '' || dateFrom !== '' || dateTo !== '' || statusFilter.length > 0

  function clearFilters() {
    setOwnership('all')
    setMinMiles('')
    setMaxMiles('')
    setMinElev('')
    setMaxElev('')
    setDateFrom('')
    setDateTo('')
    setStatusFilter([])
  }

  function toggleStatus(s: TripStatus) {
    setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  const filterWrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (filterWrapRef.current && !filterWrapRef.current.contains(e.target as Node)) {
        setFiltersOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const STATUS_URGENCY: Record<string, number> = {
    'on-trail': 0,
    'wrap-up':  0,
    'ready':    1,
    'planning': 1,
    'complete': 2,
  }

  const sorted = trips
    ? [...trips].sort((a, b) => {
        const aU = STATUS_URGENCY[a.status ?? 'complete'] ?? 2
        const bU = STATUS_URGENCY[b.status ?? 'complete'] ?? 2
        if (aU !== bU) return aU - bU
        if (aU === 2) {
          return new Date(b.endDate ?? b.startDate).getTime() - new Date(a.endDate ?? a.startDate).getTime()
        }
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      })
    : []

  const filtered = sorted.filter((trip) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (!trip.title.toLowerCase().includes(q) && !trip.location.toLowerCase().includes(q)) return false
    }
    const isOwner = !!userId && trip.ownerSub === userId
    if (ownership === 'mine' && !isOwner) return false
    if (ownership === 'shared' && isOwner) return false
    if (minMiles && trip.distanceMiles != null && trip.distanceMiles < (sys === 'metric' ? kmToMiles(parseFloat(minMiles)) : parseFloat(minMiles))) return false
    if (maxMiles && trip.distanceMiles != null && trip.distanceMiles > (sys === 'metric' ? kmToMiles(parseFloat(maxMiles)) : parseFloat(maxMiles))) return false
    if (minElev && trip.elevationGainFt != null && trip.elevationGainFt < (sys === 'metric' ? mToFt(parseFloat(minElev)) : parseFloat(minElev))) return false
    if (maxElev && trip.elevationGainFt != null && trip.elevationGainFt > (sys === 'metric' ? mToFt(parseFloat(maxElev)) : parseFloat(maxElev))) return false
    if (dateFrom && trip.endDate.slice(0, 10) < dateFrom) return false
    if (dateTo && trip.startDate.slice(0, 10) > dateTo) return false
    if (statusFilter.length > 0 && !statusFilter.includes((trip.status ?? 'complete') as TripStatus)) return false
    return true
  })

  const showResultCount = (search.trim() || hasActiveFilters) && !isLoading && !isError

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

        {/* Search + filter toggle */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
              width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trips…"
              className="w-full pl-7 pr-6 py-[5px] bg-surface-2 border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color] duration-[140ms]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text leading-none"
              >
                ×
              </button>
            )}
          </div>
          <div ref={filterWrapRef} className="relative shrink-0">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              title="Filters"
              className="relative w-7 h-7 flex items-center justify-center rounded-sm border border-border bg-surface-2 text-text-dim hover:text-text hover:border-border-mid transition-colors duration-100"
              style={filtersOpen || hasActiveFilters ? { color: 'var(--amber)', borderColor: 'var(--amber-border)' } : undefined}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber" />
              )}
            </button>

            {filtersOpen && (
              <div className="absolute left-[calc(100%+8px)] top-0 w-56 bg-surface border border-border-mid rounded-lg shadow-xl z-50 p-3.5 flex flex-col gap-3">
                <div className="font-heading text-[11px] font-extrabold text-text">Filters</div>

                {/* Ownership */}
                <div>
                  <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1.5">Show</div>
                  <div className="flex gap-1">
                    {(['all', 'mine', 'shared'] as Ownership[]).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setOwnership(opt)}
                        className="flex-1 py-[4px] font-mono text-[9px] rounded-sm border transition-colors duration-100"
                        style={{
                          background: ownership === opt ? 'var(--amber-dim)' : 'var(--surface-2)',
                          borderColor: ownership === opt ? 'var(--amber-border)' : 'var(--border)',
                          color: ownership === opt ? 'var(--amber)' : 'var(--text-dim)',
                        }}
                      >
                        {opt === 'all' ? 'All' : opt === 'mine' ? 'Mine' : 'Shared'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance */}
                <div>
                  <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1">Dist ({distUnit(sys)})</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input type="number" min="0" value={minMiles} onChange={(e) => setMinMiles(e.target.value)} placeholder="Min" className={filterInputCls} />
                    <input type="number" min="0" value={maxMiles} onChange={(e) => setMaxMiles(e.target.value)} placeholder="Max" className={filterInputCls} />
                  </div>
                </div>

                {/* Elevation */}
                <div>
                  <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1">Elev gain ({elevUnit(sys)})</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input type="number" min="0" value={minElev} onChange={(e) => setMinElev(e.target.value)} placeholder="Min" className={filterInputCls} />
                    <input type="number" min="0" value={maxElev} onChange={(e) => setMaxElev(e.target.value)} placeholder="Max" className={filterInputCls} />
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1">Date range</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={filterDateInputCls} />
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={filterDateInputCls} />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="font-mono text-[9px] text-text-dim">From</span>
                    <span className="font-mono text-[9px] text-text-dim">To</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1.5">Status</div>
                  <div className="flex flex-wrap gap-1">
                    {ALL_STATUSES.map((s) => {
                      const active = statusFilter.includes(s)
                      return (
                        <button
                          key={s}
                          onClick={() => toggleStatus(s)}
                          className="py-[3px] px-2 font-mono text-[9px] rounded-sm border transition-colors duration-100"
                          style={{
                            background: active ? 'var(--amber-dim)' : 'var(--surface-2)',
                            borderColor: active ? 'var(--amber-border)' : 'var(--border)',
                            color: active ? 'var(--amber)' : 'var(--text-dim)',
                          }}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button onClick={clearFilters} className="self-end font-mono text-[9px] text-text-dim hover:text-amber transition-colors duration-100">
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2 pb-4">
        {isLoading && <MoonLoader />}

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

        {showResultCount && (
          <p className="px-3.5 pt-1.5 pb-1 font-mono text-[9px] tracking-widest uppercase text-text-dim">
            {filtered.length} of {sorted.length} trip{sorted.length !== 1 ? 's' : ''}
          </p>
        )}

        {!isLoading && !isError && sorted.length > 0 && filtered.length === 0 && (
          <p className="px-3.5 pt-4 font-mono text-[9px] text-text-dim tracking-widest uppercase">
            No trips match
          </p>
        )}

        {filtered.map((trip) => {
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
                <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                  <span
                    className="font-heading text-[12px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0"
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
                <div className="font-mono text-[9px] text-text-dim whitespace-nowrap overflow-hidden text-ellipsis">
                  {trip.location}
                </div>
                <div className="font-mono text-[9px] text-text-dim mt-px">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </div>
                {(trip.distanceMiles || trip.elevationGainFt) && (
                  <div className="flex gap-2 mt-0.75">
                    {trip.distanceMiles != null && (
                      <span className="font-mono text-[9px] text-text-dim">{fmtDist(trip.distanceMiles, sys)}</span>
                    )}
                    {trip.elevationGainFt != null && (
                      <span className="font-mono text-[9px] text-text-dim">{fmtElevGain(trip.elevationGainFt, sys)}</span>
                    )}
                  </div>
                )}
                {!isOwner && (
                  <div className="font-mono text-[9px] mt-0.75" style={{ color: 'var(--amber)', opacity: 0.7 }}>
                    Shared by {trip.ownerName ?? '…'}
                  </div>
                )}
              </div>

              <TripActions
                isOwner={isOwner}
                onEdit={(e) => { e.stopPropagation(); onEdit(trip) }}
                onDelete={(e) => { e.stopPropagation(); onDelete(trip) }}
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