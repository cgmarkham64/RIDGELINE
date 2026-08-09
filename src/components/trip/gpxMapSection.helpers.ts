import L from 'leaflet'
import type { GpxTrack, Trip } from '../../types'
import { resolveStartEnd } from '../map/constants'

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

export function computeGpxGeometry(trip: Trip) {
  const gpxTracks = trip.gpxTracks ?? []
  const plannedLatLngs = toLatLngs(trip.gpxPlanned)
  const tracksWithLatLngs = gpxTracks.map((entry, i) => ({
    entry,
    color: trackColor(i),
    positions: toLatLngs(entry.track),
  }))
  const allPoints = [...plannedLatLngs, ...tracksWithLatLngs.flatMap((t) => t.positions)]
  const startEnd = resolveStartEnd(plannedLatLngs, tracksWithLatLngs)
  const bounds = allPoints.length > 1 ? L.latLngBounds(allPoints) : null
  const hasAny = allPoints.length > 1
  return { gpxTracks, plannedLatLngs, tracksWithLatLngs, allPoints, startEnd, bounds, hasAny }
}