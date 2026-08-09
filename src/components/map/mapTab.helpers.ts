import L from 'leaflet'
import type { GpxTrack, GpxTrackEntry, Trip } from '../../types'
import { trackColor } from './constants'

export function toLatLngs(track: GpxTrack | undefined): [number, number][] {
  return track?.coordinates.map(([lon, lat]) => [lat, lon]) ?? []
}

export function computeMapGeometry(trip: Trip) {
  const waypoints = trip.waypoints ?? []
  const gpxTracks: GpxTrackEntry[] = trip.gpxTracks ?? []
  const plannedLatLngs = toLatLngs(trip.gpxPlanned)
  const tracksWithLatLngs = gpxTracks.map((entry, i) => ({
    entry,
    color: trackColor(i),
    positions: toLatLngs(entry.track),
  }))
  const allPoints: [number, number][] = [
    ...plannedLatLngs,
    ...tracksWithLatLngs.flatMap((t) => t.positions),
    ...waypoints.map((w): [number, number] => [w.lat, w.lon]),
  ]
  const bounds = allPoints.length > 0 ? L.latLngBounds(allPoints) : null
  return { waypoints, gpxTracks, plannedLatLngs, tracksWithLatLngs, allPoints, bounds }
}
