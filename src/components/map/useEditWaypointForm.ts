import { useCallback, useState, type FormEvent } from 'react'
import type { Trip, Waypoint } from '../../types'
import { DEFAULT_FORM } from './constants'
import { submitEditWaypoint, submitDeleteWaypoint } from './mapTab.actions'

export function useEditWaypointForm(trip: Trip, waypoints: Waypoint[], onTripUpdated: (trip: Trip) => void) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancelEdit = useCallback(() => setEditingId(null), [])
  function startEdit(wp: Waypoint) {
    setEditingId(wp.id)
    setEditForm({ label: wp.label, type: wp.type, notes: wp.notes ?? '' })
  }
  function handleSaveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingId || !editForm.label.trim()) return
    void submitEditWaypoint({ trip, waypoints, onTripUpdated, editingId, editForm, setSaving, setError, setEditingId })
  }
  function handleDeleteWaypoint(id: string) {
    if (editingId === id) cancelEdit()
    void submitDeleteWaypoint({ trip, waypoints, onTripUpdated, id, setError })
  }

  return { editingId, editForm, setEditForm, saving, error, cancelEdit, startEdit, handleSaveEdit, handleDeleteWaypoint }
}
