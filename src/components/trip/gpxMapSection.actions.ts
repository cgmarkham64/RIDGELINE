import type { Trip, GpxTrackEntry } from '../../types'
import { api } from '../../lib/api'
import { parseGpx } from '../../lib/gpx'
import type { ParsedGpx } from '../../lib/gpx'
import type { ImportTarget } from './gpxMapSection.helpers'

interface ImportDeps {
  trip: Trip
  gpxTracks: GpxTrackEntry[]
  onTripUpdated: (trip: Trip) => void
  setImporting: (v: string | null) => void
  setError: (v: string | null) => void
}

function busyKeyFor(target: ImportTarget): string {
  return target.type === 'planned' ? 'planned' : target.type === 'track-new' ? 'new-track' : target.id
}

async function applyGpxImport(
  target: ImportTarget,
  track: ParsedGpx['track'],
  firstTimestamp: string | undefined,
  deps: ImportDeps
) {
  const { trip, gpxTracks, onTripUpdated } = deps
  if (target.type === 'planned') {
    const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { gpxPlanned: track })
    onTripUpdated(data)
  } else if (target.type === 'track-new') {
    const newEntry: GpxTrackEntry = { id: Date.now().toString(), label: `Day ${gpxTracks.length + 1}`, track, firstTimestamp }
    const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { gpxTracks: [...gpxTracks, newEntry] })
    onTripUpdated(data)
  } else {
    const updated = gpxTracks.map((entry) => entry.id === target.id ? { ...entry, track, firstTimestamp } : entry)
    const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { gpxTracks: updated })
    onTripUpdated(data)
  }
}

export async function importGpxFile(file: File, target: ImportTarget, deps: ImportDeps) {
  const { setImporting, setError } = deps
  setImporting(busyKeyFor(target))
  setError(null)
  try {
    const text = await file.text()
    const { track, firstTimestamp }: ParsedGpx = parseGpx(text)
    await applyGpxImport(target, track, firstTimestamp, deps)
  } catch (err) {
    console.error('GPX import error:', err)
    setError(err instanceof Error ? err.message : 'Failed to import GPX')
  } finally {
    setImporting(null)
  }
}

interface RemoveDeps {
  trip: Trip
  gpxTracks: GpxTrackEntry[]
  onTripUpdated: (trip: Trip) => void
  setRemoving: (v: string | null) => void
  setError: (v: string | null) => void
}

export async function removePlannedGpx(deps: RemoveDeps) {
  const { trip, onTripUpdated, setRemoving, setError } = deps
  setRemoving('planned')
  setError(null)
  try {
    const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { gpxPlanned: null })
    onTripUpdated(data)
  } catch (err) {
    console.error('GPX remove error:', err)
    setError('Failed to remove track')
  } finally {
    setRemoving(null)
  }
}

export async function removeGpxTrack(id: string, deps: RemoveDeps) {
  const { trip, gpxTracks, onTripUpdated, setRemoving, setError } = deps
  setRemoving(id)
  setError(null)
  try {
    const updated = gpxTracks.filter((entry) => entry.id !== id)
    const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { gpxTracks: updated })
    onTripUpdated(data)
  } catch (err) {
    console.error('GPX remove error:', err)
    setError('Failed to remove track')
  } finally {
    setRemoving(null)
  }
}
