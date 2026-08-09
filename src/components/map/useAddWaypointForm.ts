import { useCallback, useState, type FormEvent } from 'react'
import type { Trip, Waypoint } from '../../types'
import { DEFAULT_FORM } from './constants'
import { submitAddWaypoint } from './mapTab.actions'

export function useAddWaypointForm(trip: Trip, waypoints: Waypoint[], onTripUpdated: (trip: Trip) => void) {
  const [addMode, setAddMode] = useState(false)
  const [pendingLatLon, setPendingLatLon] = useState<{ lat: number; lon: number } | null>(null)
  const [addForm, setAddForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)

  const cancelAdd = useCallback(() => {
    setPendingLatLon(null)
    setAddForm(DEFAULT_FORM)
    setAddMode(false)
  }, [])
  function beginAddAt(lat: number, lon: number) {
    setAddMode(false)
    setPendingLatLon({ lat, lon })
    setAddForm(DEFAULT_FORM)
  }
  function handleAddWaypoint(e: FormEvent) {
    e.preventDefault()
    if (!pendingLatLon || !addForm.label.trim()) return
    void submitAddWaypoint({ trip, waypoints, onTripUpdated, pendingLatLon, addForm, setSaving, setError, setPendingLatLon, setAddForm, setFocusId })
  }

  return {
    addMode, setAddMode, pendingLatLon, addForm, setAddForm, saving, error, focusId, setFocusId,
    cancelAdd, beginAddAt, handleAddWaypoint,
  }
}
