import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { GpxTrack, GpxTrackEntry, Trip, Waypoint, WaypointType } from '../../types'
import { api } from '../../lib/api'
import { DEFAULT_FORM, resolveStartEnd, trackColor } from './constants'
import { AttributionStrip } from './MapHelpers'
import { MapControlsBar } from './MapControlsBar'
import { MapArea } from './MapArea'
import { WaypointAddDialog } from './WaypointAddDialog'
import { WaypointEditDialog } from './WaypointEditDialog'

function toLatLngs(track: GpxTrack | undefined): [number, number][] {
  return track?.coordinates.map(([lon, lat]) => [lat, lon]) ?? []
}

interface Props {
  trip: Trip
  onTripUpdated: (trip: Trip) => void
}

export function MapTab({ trip, onTripUpdated }: Props) {
  const [addMode, setAddMode] = useState(false)
  const [pendingLatLon, setPendingLatLon] = useState<{ lat: number; lon: number } | null>(null)
  const [addForm, setAddForm] = useState(DEFAULT_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ lat: number; lon: number; x: number; y: number } | null>(null)
  const [waypointContextMenu, setWaypointContextMenu] = useState<{ wp: Waypoint; x: number; y: number } | null>(null)
  const [tileLayer, setTileLayer] = useState<'topo' | 'dark'>('topo')
  const mapRef = useRef<L.Map | null>(null)

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

  function startEdit(wp: Waypoint) {
    setEditingId(wp.id)
    setEditForm({ label: wp.label, type: wp.type, notes: wp.notes ?? '' })
    cancelAdd()
  }

  function cancelEdit() { setEditingId(null) }

  function cancelAdd() {
    setPendingLatLon(null)
    setAddForm(DEFAULT_FORM)
    setAddMode(false)
  }

  function handleMapClick(lat: number, lon: number) {
    setAddMode(false)
    setPendingLatLon({ lat, lon })
    setAddForm(DEFAULT_FORM)
    setContextMenu(null)
    setWaypointContextMenu(null)
    cancelEdit()
  }

  function handleContextMenu(lat: number, lon: number, x: number, y: number) {
    cancelAdd()
    cancelEdit()
    setWaypointContextMenu(null)
    setContextMenu({ lat, lon, x, y })
  }

  function handleMarkerContextMenu(wp: Waypoint, x: number, y: number) {
    cancelAdd()
    setContextMenu(null)
    setWaypointContextMenu({ wp, x, y })
  }

  function handleMarkerClick(wp: Waypoint) {
    setContextMenu(null)
    setWaypointContextMenu(null)
    if (editingId === wp.id) cancelEdit()
    else { cancelAdd(); startEdit(wp) }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        cancelAdd(); cancelEdit()
        setContextMenu(null); setWaypointContextMenu(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function handleAddWaypoint(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingLatLon || !addForm.label.trim()) return
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

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !editForm.label.trim()) return
    setSaving(true); setError(null)
    try {
      const updated = waypoints.map((w) =>
        w.id === editingId
          ? { ...w, type: editForm.type as WaypointType, label: editForm.label.trim(), notes: editForm.notes.trim() || undefined }
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

  async function handleDeleteWaypoint(id: string) {
    setError(null)
    if (editingId === id) cancelEdit()
    try {
      const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { waypoints: waypoints.filter((w) => w.id !== id) })
      onTripUpdated(data)
    } catch {
      setError('Failed to delete waypoint')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <MapControlsBar
        trip={trip}
        onTripUpdated={onTripUpdated}
        waypoints={waypoints}
        addMode={addMode}
        editingId={editingId}
        onAddModeStart={() => setAddMode(true)}
        onCancelAdd={cancelAdd}
        onChipSelect={(wp) => setFocusId(wp.id)}
        onChipEdit={(wp) => startEdit(wp)}
        onChipDelete={handleDeleteWaypoint}
      />

      <MapArea
        bounds={bounds}
        allPoints={allPoints}
        plannedLatLngs={plannedLatLngs}
        tracksWithLatLngs={tracksWithLatLngs}
        waypoints={waypoints}
        editingId={editingId}
        addMode={addMode}
        pendingLatLon={pendingLatLon}
        addFormType={addForm.type}
        focusId={focusId}
        mapRef={mapRef}
        startEnd={resolveStartEnd(plannedLatLngs, tracksWithLatLngs)}
        contextMenu={contextMenu}
        waypointContextMenu={waypointContextMenu}
        tileLayer={tileLayer}
        onTileToggle={() => setTileLayer(k => k === 'topo' ? 'dark' : 'topo')}
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
        onMarkerContextMenu={handleMarkerContextMenu}
        onDeleteWaypoint={handleDeleteWaypoint}
        onFocusDone={() => setFocusId(null)}
        onContextMenu={handleContextMenu}
        onDismissContextMenu={() => setContextMenu(null)}
        onDismissWaypointContextMenu={() => setWaypointContextMenu(null)}
      />

      {pendingLatLon && (
        <WaypointAddDialog
          coords={pendingLatLon}
          form={addForm}
          saving={saving}
          error={error}
          onChange={(patch) => setAddForm((f) => ({ ...f, ...patch }))}
          onSubmit={handleAddWaypoint}
          onClose={cancelAdd}
        />
      )}

      {editingId && (
        <WaypointEditDialog
          waypoint={waypoints.find((w) => w.id === editingId)!}
          form={editForm}
          saving={saving}
          error={error}
          onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
          onSubmit={handleSaveEdit}
          onClose={cancelEdit}
        />
      )}

      <AttributionStrip tileLayer={tileLayer} />
    </div>
  )
}