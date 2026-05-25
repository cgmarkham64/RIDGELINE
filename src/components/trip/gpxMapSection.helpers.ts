import type { GpxTrack } from '../../types'

export type ImportTarget =
  | { type: 'planned' }
  | { type: 'track-new' }
  | { type: 'track-replace'; id: string }

export const PLANNED_COLOR = '#00d4ff'

const TRACK_COLORS = [
  '#4ade80', // green
  '#fb923c', // orange
  '#a78bfa', // violet
  '#f472b6', // pink
  '#34d399', // emerald
  '#facc15', // yellow
  '#60a5fa', // blue
  '#f87171', // red
]

export function trackColor(index: number): string {
  return TRACK_COLORS[index % TRACK_COLORS.length]
}

export function toLatLngs(track: GpxTrack | undefined | null): [number, number][] {
  return track?.coordinates.map(([lon, lat]) => [lat, lon]) ?? []
}