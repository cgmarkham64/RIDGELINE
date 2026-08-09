import type { Trip, Waypoint } from '../../types'
import { api } from '../../lib/api'
import { DEFAULT_FORM } from './constants'

type WaypointFormState = typeof DEFAULT_FORM

interface AddDeps {
  trip: Trip
  waypoints: Waypoint[]
  onTripUpdated: (trip: Trip) => void
  pendingLatLon: { lat: number; lon: number }
  addForm: WaypointFormState
  setSaving: (v: boolean) => void
  setError: (v: string | null) => void
  setPendingLatLon: (v: { lat: number; lon: number } | null) => void
  setAddForm: (v: WaypointFormState) => void
  setFocusId: (v: string | null) => void
}

export async function submitAddWaypoint(deps: AddDeps) {
  const { trip, waypoints, onTripUpdated, pendingLatLon, addForm, setSaving, setError, setPendingLatLon, setAddForm, setFocusId } = deps
  setSaving(true); setError(null)
  try {
    const newWp: Waypoint = {
      id: Date.now().toString(),
      type: addForm.type,
      label: addForm.label.trim(),
      lat: pendingLatLon.lat,
      lon: pendingLatLon.lon,
      notes: addForm.notes.trim() || undefined,
    }
    const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { waypoints: [...waypoints, newWp] })
    onTripUpdated(data)
    setPendingLatLon(null); setAddForm(DEFAULT_FORM); setFocusId(newWp.id)
  } catch {
    setError('Failed to save waypoint')
  } finally {
    setSaving(false)
  }
}

interface EditDeps {
  trip: Trip
  waypoints: Waypoint[]
  onTripUpdated: (trip: Trip) => void
  editingId: string
  editForm: WaypointFormState
  setSaving: (v: boolean) => void
  setError: (v: string | null) => void
  setEditingId: (v: string | null) => void
}

export async function submitEditWaypoint(deps: EditDeps) {
  const { trip, waypoints, onTripUpdated, editingId, editForm, setSaving, setError, setEditingId } = deps
  setSaving(true); setError(null)
  try {
    const updated = waypoints.map((w) =>
      w.id === editingId
        ? { ...w, type: editForm.type, label: editForm.label.trim(), notes: editForm.notes.trim() || undefined }
        : w
    )
    const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { waypoints: updated })
    onTripUpdated(data); setEditingId(null)
  } catch {
    setError('Failed to update waypoint')
  } finally {
    setSaving(false)
  }
}

interface DeleteDeps {
  trip: Trip
  waypoints: Waypoint[]
  onTripUpdated: (trip: Trip) => void
  id: string
  setError: (v: string | null) => void
}

export async function submitDeleteWaypoint(deps: DeleteDeps) {
  const { trip, waypoints, onTripUpdated, id, setError } = deps
  setError(null)
  try {
    const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { waypoints: waypoints.filter((w) => w.id !== id) })
    onTripUpdated(data)
  } catch {
    setError('Failed to delete waypoint')
  }
}
