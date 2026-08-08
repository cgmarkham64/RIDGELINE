import type { ReactNode } from 'react'
import { distUnit, elevUnit } from '../../lib/units'
import type { UnitSystem } from '../../lib/units'
import { toggleChipStyle } from '../../lib/utils'
import { ALL_STATUSES, OWNERSHIP_OPTIONS, STATUS_LABEL } from './tripSidebar.helpers'
import type { DistElevRange, Ownership, SimpleFilters, TripStatus } from './tripSidebar.types'

const inputCls = 'w-full px-2 py-[4px] bg-surface-2 border border-border rounded-sm font-mono text-fine text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color] duration-[140ms]'
const dateInputCls = 'w-full px-2 py-[4px] bg-surface-2 border border-border rounded-sm font-mono text-caption text-text outline-none focus:border-border-mid transition-[border-color] duration-[140ms]'

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function RangeFilterField({ label, minValue, maxValue, onMinChange, onMaxChange }: {
  label: string
  minValue: string
  maxValue: string
  onMinChange: (v: string) => void
  onMaxChange: (v: string) => void
}) {
  return (
    <FilterField label={label}>
      <div className="grid grid-cols-2 gap-1.5">
        <input type="number" min="0" value={minValue} onChange={(e) => onMinChange(e.target.value)} placeholder="Min" className={inputCls} />
        <input type="number" min="0" value={maxValue} onChange={(e) => onMaxChange(e.target.value)} placeholder="Max" className={inputCls} />
      </div>
    </FilterField>
  )
}

function ChipToggleGroup<T extends string>({ options, isActive, onToggle, equalWidth }: {
  options: { value: T; label: string }[]
  isActive: (value: T) => boolean
  onToggle: (value: T) => void
  equalWidth?: boolean
}) {
  return (
    <div className={equalWidth ? 'flex gap-1' : 'flex flex-wrap gap-1'}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onToggle(opt.value)}
          className={`py-[4px] px-2 font-mono text-label rounded-sm border transition-colors duration-100${equalWidth ? ' flex-1' : ''}`}
          style={toggleChipStyle(isActive(opt.value))}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

interface TripFilterPanelProps {
  ownership: Ownership
  distElev: DistElevRange
  dateFrom: string
  dateTo: string
  statusFilter: TripStatus[]
  sys: UnitSystem
  hasActiveFilters: boolean
  onPatch: (fields: Partial<SimpleFilters>) => void
  onPatchDistElev: (fields: Partial<DistElevRange>) => void
  onToggleStatus: (status: TripStatus) => void
  onClear: () => void
}

export function TripFilterPanel({
  ownership, distElev, dateFrom, dateTo, statusFilter, sys, hasActiveFilters,
  onPatch, onPatchDistElev, onToggleStatus, onClear,
}: TripFilterPanelProps) {
  const statusOptions = ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))

  return (
    <div className="absolute left-[calc(100%+8px)] top-0 w-56 bg-surface border border-border-mid rounded-lg shadow-xl z-50 p-3.5 flex flex-col gap-3">
      <div className="font-heading text-fine font-extrabold text-text">Filters</div>

      <FilterField label="Show">
        <ChipToggleGroup equalWidth options={OWNERSHIP_OPTIONS} isActive={(v) => v === ownership} onToggle={(v) => onPatch({ ownership: v })} />
      </FilterField>

      <RangeFilterField
        label={`Dist (${distUnit(sys)})`}
        minValue={distElev.minMiles}
        maxValue={distElev.maxMiles}
        onMinChange={(v) => onPatchDistElev({ minMiles: v })}
        onMaxChange={(v) => onPatchDistElev({ maxMiles: v })}
      />

      <RangeFilterField
        label={`Elev gain (${elevUnit(sys)})`}
        minValue={distElev.minElev}
        maxValue={distElev.maxElev}
        onMinChange={(v) => onPatchDistElev({ minElev: v })}
        onMaxChange={(v) => onPatchDistElev({ maxElev: v })}
      />

      <FilterField label="Date range">
        <div className="grid grid-cols-2 gap-1.5">
          <input type="date" value={dateFrom} onChange={(e) => onPatch({ dateFrom: e.target.value })} className={dateInputCls} />
          <input type="date" value={dateTo} onChange={(e) => onPatch({ dateTo: e.target.value })} className={dateInputCls} />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="font-mono text-label text-text-dim">From</span>
          <span className="font-mono text-label text-text-dim">To</span>
        </div>
      </FilterField>

      <FilterField label="Status">
        <ChipToggleGroup options={statusOptions} isActive={(v) => statusFilter.includes(v)} onToggle={onToggleStatus} />
      </FilterField>

      {hasActiveFilters && (
        <button onClick={onClear} className="self-end font-mono text-label text-text-dim hover:text-amber transition-colors duration-100">
          Clear filters
        </button>
      )}
    </div>
  )
}
