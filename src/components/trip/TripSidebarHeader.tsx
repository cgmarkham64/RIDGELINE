import { useRef, useState } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import { TripFilterPanel } from './TripFilterPanel'
import type { TripFiltersState } from './useTripFilters'

function SearchIcon() {
  return (
    <svg
      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
      width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  )
}

function TripSearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1">
      <SearchIcon />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search trips…"
        className="w-full pl-7 pr-6 py-[5px] bg-surface-2 border border-border rounded-sm font-mono text-fine text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color] duration-[140ms]"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text leading-none"
        >
          ×
        </button>
      )}
    </div>
  )
}

interface TripSidebarHeaderProps {
  onNew: () => void
  filters: TripFiltersState
}

export function TripSidebarHeader({ onNew, filters }: TripSidebarHeaderProps) {
  const { values, active, patch, patchDistElev, toggleStatus, clear } = filters
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterWrapRef = useRef<HTMLDivElement>(null)
  useClickOutside(filterWrapRef, () => setFiltersOpen(false))

  return (
    <div className="px-3.5 pt-4 pb-3 border-b border-border shrink-0 flex flex-col gap-2.5">
      <span className="font-heading text-label font-extrabold tracking-[0.22em] uppercase text-text-dim">
        Trips
      </span>

      <button onClick={onNew} className="btn btn-primary btn-block">
        + New trip
      </button>

      <div className="flex items-center gap-1.5">
        <TripSearchInput value={values.search} onChange={(v) => patch({ search: v })} />
        <div ref={filterWrapRef} className="relative shrink-0">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            title="Filters"
            className="relative w-7 h-7 flex items-center justify-center rounded-sm border border-border bg-surface-2 text-text-dim hover:text-text hover:border-border-mid transition-colors duration-100"
            style={filtersOpen || active ? { color: 'var(--amber)', borderColor: 'var(--amber-border)' } : undefined}
          >
            <FilterIcon />
            {active && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber" />}
          </button>

          {filtersOpen && (
            <TripFilterPanel
              ownership={values.ownership}
              distElev={values.distElev}
              dateFrom={values.dateFrom}
              dateTo={values.dateTo}
              statusFilter={values.statusFilter}
              sys={values.sys}
              hasActiveFilters={active}
              onPatch={patch}
              onPatchDistElev={patchDistElev}
              onToggleStatus={toggleStatus}
              onClear={clear}
            />
          )}
        </div>
      </div>
    </div>
  )
}
