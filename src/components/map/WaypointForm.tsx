import type { WaypointType } from '../../types'
import { WAYPOINT_COLOR, WAYPOINT_LABEL, WAYPOINT_TYPES, inputStyle } from './constants'
import { WaypointIcon } from './WaypointIcon'

export interface WaypointFormState {
  label: string
  type: WaypointType
  notes: string
}

function TypePills({
  value,
  onChange,
}: {
  value: WaypointType
  onChange: (t: WaypointType) => void
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {WAYPOINT_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className="inline-flex items-center gap-1.25 px-2 py-0.75 rounded-sm font-mono text-[9px] tracking-[0.08em] uppercase cursor-pointer"
          style={{
            border: `1px solid ${value === t ? WAYPOINT_COLOR[t] : 'var(--border)'}`,
            background: value === t ? `${WAYPOINT_COLOR[t]}22` : 'transparent',
            color: value === t ? WAYPOINT_COLOR[t] : 'var(--text-dim)',
          }}
        >
          <WaypointIcon type={t} size={11} />
          {WAYPOINT_LABEL[t]}
        </button>
      ))}
    </div>
  )
}

export function WaypointForm({
  coords,
  form,
  saving,
  submitLabel,
  onChange,
}: {
  coords?: { lat: number; lon: number }
  form: WaypointFormState
  saving: boolean
  submitLabel: string
  onChange: (patch: Partial<WaypointFormState>) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      {coords && (
        <span className="font-mono text-[8px] tracking-widest uppercase text-amber shrink-0">
          {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
        </span>
      )}
      <TypePills value={form.type} onChange={(t) => onChange({ type: t })} />
      <input
        style={inputStyle}
        placeholder="Name this waypoint…"
        value={form.label}
        onChange={(e) => onChange({ label: e.target.value })}
        autoFocus
        required
      />
      <input
        style={inputStyle}
        placeholder="Notes (optional)"
        value={form.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
      />
      <button
        type="submit"
        disabled={saving || !form.label.trim()}
        className="btn btn-primary btn-sm shrink-0"
      >
        {saving ? 'Saving…' : submitLabel}
      </button>
    </div>
  )
}