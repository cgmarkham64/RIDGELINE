import type { WaypointType } from '../../types'
import { WAYPOINT_COLOR, WAYPOINT_LABEL, WAYPOINT_TYPES, inputStyle, mono } from './constants'
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
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {WAYPOINT_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            border: `1px solid ${value === t ? WAYPOINT_COLOR[t] : 'var(--border)'}`,
            borderRadius: 'var(--r-sm)',
            background: value === t ? `${WAYPOINT_COLOR[t]}22` : 'transparent',
            color: value === t ? WAYPOINT_COLOR[t] : 'var(--text-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
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
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {coords && (
        <span style={{ ...mono, fontSize: 8, color: 'var(--amber)', flexShrink: 0 }}>
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
        className="btn btn-primary btn-sm"
        style={{ flexShrink: 0 }}
      >
        {saving ? 'Saving…' : submitLabel}
      </button>
    </div>
  )
}