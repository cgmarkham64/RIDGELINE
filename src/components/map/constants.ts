import type { CSSProperties } from 'react'
import type { GpxTrackEntry, WaypointType } from '../../types'

// ─── Tile layer ───────────────────────────────────────────────────────────────

export const CARTO_DARK_TILE = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  subdomains: 'abcd',
  maxZoom: 19,
  detectRetina: true,
} as const

// ─── Start / end point resolution ────────────────────────────────────────────

/** Returns the overall [lat, lon] start and end of the trip's tracks.
 *  GPS tracks (sorted chronologically) take priority over the planned route. */
export function resolveStartEnd(
  plannedLatLngs: [number, number][],
  tracksWithLatLngs: { positions: [number, number][]; entry: GpxTrackEntry }[]
): { start: [number, number]; end: [number, number] } | null {
  const valid = tracksWithLatLngs.filter((t) => t.positions.length > 1)
  if (valid.length > 0) {
    const sorted = valid.slice().sort((a, b) => {
      const ta = a.entry.firstTimestamp
      const tb = b.entry.firstTimestamp
      if (!ta && !tb) return 0
      if (!ta) return 1
      if (!tb) return -1
      return ta.localeCompare(tb)
    })
    const last = sorted[sorted.length - 1]
    return {
      start: sorted[0].positions[0],
      end: last.positions[last.positions.length - 1],
    }
  }
  if (plannedLatLngs.length > 1) {
    return {
      start: plannedLatLngs[0],
      end: plannedLatLngs[plannedLatLngs.length - 1],
    }
  }
  return null
}

export const PLANNED_COLOR = '#38bdf8'

export const TRACK_COLORS = [
  '#4ade80',
  '#fb923c',
  '#a78bfa',
  '#f472b6',
  '#34d399',
  '#facc15',
  '#60a5fa',
  '#f87171',
]

export const trackColor = (i: number) => TRACK_COLORS[i % TRACK_COLORS.length]

export const WAYPOINT_COLOR: Record<WaypointType, string> = {
  campsite: '#f0a030',
  wildlife: '#448860',
  viewpoint: '#5ab4dc',
  'no-water': '#dc2626',
  'some-water': '#d97706',
  'lots-of-water': '#0ea5e9',
  other: '#685646',
}

export const WAYPOINT_LABEL: Record<WaypointType, string> = {
  campsite: 'Campsite',
  wildlife: 'Wildlife',
  viewpoint: 'Viewpoint',
  'no-water': 'No Water',
  'some-water': 'Some Water',
  'lots-of-water': 'Lots of Water',
  other: 'Other',
}

export const WAYPOINT_TYPES: WaypointType[] = [
  'campsite',
  'wildlife',
  'viewpoint',
  'no-water',
  'some-water',
  'lots-of-water',
  'other',
]

export const DEFAULT_FORM = { label: '', type: 'campsite' as WaypointType, notes: '' }

export const mono: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
}

export const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 120,
  padding: '5px 9px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  fontSize: 12,
  background: 'var(--surface2)',
  color: 'var(--text)',
  outline: 'none',
}