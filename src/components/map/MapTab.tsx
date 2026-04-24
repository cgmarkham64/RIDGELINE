import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L, { type LatLngBoundsExpression } from 'leaflet'
import type { GpxTrack, GpxTrackEntry, Trip, Waypoint, WaypointType } from '../../types'
import { api } from '../../lib/api'
import { GpxMapSection } from '../trip/GpxMapSection'
import { DEFAULT_FORM, PLANNED_COLOR, mono, trackColor } from './constants'
import { makeWaypointIcon, makePendingIcon } from './WaypointIcon'
import { FitBounds, MapClickHandler, MapFocuser, MapRefCapture } from './MapHelpers'
import { WaypointForm } from './WaypointForm'
import { WaypointChip } from './WaypointChip'
import { MapEmptyState } from './MapEmptyState'

// Converts GeoJSON [lon, lat] coordinates to Leaflet [lat, lon] pairs
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

  const isAdding = addMode || !!pendingLatLon

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function startEdit(wp: Waypoint) {
    setEditingId(wp.id)
    setEditForm({ label: wp.label, type: wp.type, notes: wp.notes ?? '' })
    cancelAdd()
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function cancelAdd() {
    setPendingLatLon(null)
    setAddForm(DEFAULT_FORM)
    setAddMode(false)
  }

  function handleMapClick(lat: number, lon: number) {
    setAddMode(false)
    setPendingLatLon({ lat, lon })
    setAddForm(DEFAULT_FORM)
    cancelEdit()
  }

  function handleMarkerClick(wp: Waypoint) {
    if (editingId === wp.id) {
      cancelEdit()
    } else {
      cancelAdd()
      startEdit(wp)
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        cancelAdd()
        cancelEdit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function handleAddWaypoint(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingLatLon || !addForm.label.trim()) return
    setSaving(true)
    setError(null)
    try {
      const newWp: Waypoint = {
        id: Date.now().toString(),
        type: addForm.type,
        label: addForm.label.trim(),
        lat: pendingLatLon.lat,
        lon: pendingLatLon.lon,
        notes: addForm.notes.trim() || undefined,
      }
      const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, {
        waypoints: [...waypoints, newWp],
      })
      onTripUpdated(data)
      setPendingLatLon(null)
      setAddForm(DEFAULT_FORM)
      setFocusId(newWp.id)
    } catch {
      setError('Failed to save waypoint')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !editForm.label.trim()) return
    setSaving(true)
    setError(null)
    try {
      const updated = waypoints.map((w) =>
        w.id === editingId
          ? { ...w, type: editForm.type as WaypointType, label: editForm.label.trim(), notes: editForm.notes.trim() || undefined }
          : w
      )
      const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { waypoints: updated })
      onTripUpdated(data)
      setEditingId(null)
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
      const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, {
        waypoints: waypoints.filter((w) => w.id !== id),
      })
      onTripUpdated(data)
    } catch {
      setError('Failed to delete waypoint')
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ControlsBar
        trip={trip}
        onTripUpdated={onTripUpdated}
        waypoints={waypoints}
        isAdding={isAdding}
        addMode={addMode}
        pendingLatLon={pendingLatLon}
        addForm={addForm}
        editingId={editingId}
        editForm={editForm}
        saving={saving}
        error={error}
        onAddModeStart={() => setAddMode(true)}
        onCancelAll={() => { cancelAdd(); cancelEdit() }}
        onAddFormChange={(patch) => setAddForm((f) => ({ ...f, ...patch }))}
        onAddSubmit={handleAddWaypoint}
        onEditFormChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
        onEditSubmit={handleSaveEdit}
        onChipSelect={(wp) => { if (editingId === wp.id) { cancelEdit() } else { startEdit(wp); setFocusId(wp.id) } }}
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
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
        onFocusDone={() => setFocusId(null)}
      />

      <AttributionStrip />
    </div>
  )
}

// ─── Controls bar ─────────────────────────────────────────────────────────────

function ControlsBar({
  trip,
  onTripUpdated,
  waypoints,
  isAdding,
  addMode,
  pendingLatLon,
  addForm,
  editingId,
  editForm,
  saving,
  error,
  onAddModeStart,
  onCancelAll,
  onAddFormChange,
  onAddSubmit,
  onEditFormChange,
  onEditSubmit,
  onChipSelect,
  onChipDelete,
}: {
  trip: Trip
  onTripUpdated: (t: Trip) => void
  waypoints: Waypoint[]
  isAdding: boolean
  addMode: boolean
  pendingLatLon: { lat: number; lon: number } | null
  addForm: typeof DEFAULT_FORM
  editingId: string | null
  editForm: typeof DEFAULT_FORM
  saving: boolean
  error: string | null
  onAddModeStart: () => void
  onCancelAll: () => void
  onAddFormChange: (patch: Partial<typeof DEFAULT_FORM>) => void
  onAddSubmit: (e: React.FormEvent) => void
  onEditFormChange: (patch: Partial<typeof DEFAULT_FORM>) => void
  onEditSubmit: (e: React.FormEvent) => void
  onChipSelect: (wp: Waypoint) => void
  onChipDelete: (id: string) => void
}) {
  const sortedWaypoints = waypoints.slice().sort((a, b) => b.lon - a.lon || b.lat - a.lat)

  return (
    <div
      style={{
        flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {/* Routes & Tracks */}
      <div
        style={{
          width: '40%',
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          background: 'var(--surface)',
          padding: '14px 18px',
          overflowY: 'auto',
          maxHeight: 200,
        }}
      >
        <div className="sec-label" style={{ marginBottom: 12 }}>
          Routes &amp; Tracks
        </div>
        <GpxMapSection trip={trip} onTripUpdated={onTripUpdated} showMap={false} />
      </div>

      {/* Waypoints */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: 'var(--surface)',
          overflowY: 'auto',
          maxHeight: 200,
          padding: '6px 18px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isAdding || editingId || waypoints.length > 0 ? 12 : 0,
          }}
        >
          <div className="sec-label" style={{ margin: 0, flex: 1 }}>
            Waypoints
          </div>
          {!isAdding && !editingId && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onAddModeStart}>
              + Add Waypoint
            </button>
          )}
          {(isAdding || editingId) && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelAll}>
              Cancel
            </button>
          )}
        </div>

        {addMode && !pendingLatLon && (
          <p style={{ ...mono, color: 'var(--amber)', lineHeight: 1.7 }}>
            Click anywhere on the map below to place a waypoint
          </p>
        )}

        {pendingLatLon && (
          <form onSubmit={onAddSubmit} style={{ marginBottom: waypoints.length > 0 ? 12 : 0 }}>
            <WaypointForm
              coords={pendingLatLon}
              form={addForm}
              saving={saving}
              submitLabel="Add"
              onChange={onAddFormChange}
            />
          </form>
        )}

        {editingId && (
          <form onSubmit={onEditSubmit} style={{ marginBottom: waypoints.length > 0 ? 12 : 0 }}>
            <WaypointForm
              form={editForm}
              saving={saving}
              submitLabel="Save"
              onChange={onEditFormChange}
            />
          </form>
        )}

        {error && <p style={{ fontSize: 11, color: 'var(--red)', marginBottom: 8 }}>{error}</p>}

        {waypoints.length === 0 && !isAdding && !editingId ? (
          <p style={{ ...mono, fontSize: 9, lineHeight: 1.7 }}>
            No waypoints yet — mark campsites, wildlife sightings, viewpoints, and more.
          </p>
        ) : waypoints.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {sortedWaypoints.map((wp) => (
              <WaypointChip
                key={wp.id}
                wp={wp}
                isEditing={editingId === wp.id}
                onSelect={() => onChipSelect(wp)}
                onDelete={() => onChipDelete(wp.id)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ─── Map area ─────────────────────────────────────────────────────────────────

function MapArea({
  bounds,
  allPoints,
  plannedLatLngs,
  tracksWithLatLngs,
  waypoints,
  editingId,
  addMode,
  pendingLatLon,
  addFormType,
  focusId,
  mapRef,
  onMapClick,
  onMarkerClick,
  onFocusDone,
}: {
  bounds: L.LatLngBounds | null
  allPoints: [number, number][]
  plannedLatLngs: [number, number][]
  tracksWithLatLngs: { entry: GpxTrackEntry; color: string; positions: [number, number][] }[]
  waypoints: Waypoint[]
  editingId: string | null
  addMode: boolean
  pendingLatLon: { lat: number; lon: number } | null
  addFormType: WaypointType
  focusId: string | null
  mapRef: React.RefObject<L.Map | null>
  onMapClick: (lat: number, lon: number) => void
  onMarkerClick: (wp: Waypoint) => void
  onFocusDone: () => void
}) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        position: 'relative',
        cursor: addMode ? 'crosshair' : 'default',
        background: 'var(--bg)',
      }}
    >
      {bounds ? (
        <MapContainer
          bounds={bounds as LatLngBoundsExpression}
          boundsOptions={{ padding: [32, 32] }}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
            detectRetina
          />
          {plannedLatLngs.length > 1 && (
            <Polyline positions={plannedLatLngs} color={PLANNED_COLOR} weight={4} opacity={0.9} dashArray="10 6" />
          )}
          {tracksWithLatLngs.map(
            ({ entry, color, positions }) =>
              positions.length > 1 && (
                <Polyline key={entry.id} positions={positions} color={color} weight={3} opacity={0.9} />
              )
          )}
          {waypoints.map((wp) => (
            <Marker
              key={wp.id}
              position={[wp.lat, wp.lon]}
              icon={makeWaypointIcon(wp.type, editingId === wp.id)}
              eventHandlers={{ click: () => onMarkerClick(wp) }}
            />
          ))}
          {pendingLatLon && (
            <Marker
              position={[pendingLatLon.lat, pendingLatLon.lon]}
              icon={makePendingIcon(addFormType)}
              interactive={false}
            />
          )}
          <MapClickHandler active={addMode} onMapClick={onMapClick} />
          {allPoints.length > 1 && <FitBounds positions={allPoints} />}
          <MapRefCapture mapRef={mapRef} />
          <MapFocuser waypoints={waypoints} focusId={focusId} onDone={onFocusDone} />
        </MapContainer>
      ) : (
        <MapEmptyState />
      )}

      <ZoomControls mapRef={mapRef} allPoints={allPoints} />
      {addMode && <AddModeHint />}
      <TrackLegend plannedLatLngs={plannedLatLngs} tracksWithLatLngs={tracksWithLatLngs} />
    </div>
  )
}

// ─── Map overlays ─────────────────────────────────────────────────────────────

function ZoomControls({
  mapRef,
  allPoints,
}: {
  mapRef: React.RefObject<L.Map | null>
  allPoints: [number, number][]
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        overflow: 'hidden',
      }}
    >
      {(['in', 'out', 'fit'] as const).map((action, i) => (
        <button
          key={action}
          type="button"
          title={action === 'in' ? 'Zoom in' : action === 'out' ? 'Zoom out' : 'Zoom to fit'}
          disabled={action === 'fit' && allPoints.length < 2}
          onClick={() => {
            if (action === 'in') mapRef.current?.zoomIn()
            else if (action === 'out') mapRef.current?.zoomOut()
            else if (allPoints.length > 1)
              mapRef.current?.fitBounds(allPoints as LatLngBoundsExpression, { padding: [32, 32], animate: true })
          }}
          style={{
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15,13,11,0.82)',
            border: 'none',
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            color: 'var(--text-dim)',
            cursor: action === 'fit' && allPoints.length < 2 ? 'default' : 'pointer',
            opacity: action === 'fit' && allPoints.length < 2 ? 0.4 : 1,
          }}
        >
          {action === 'in' && (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
          )}
          {action === 'out' && (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
          )}
          {action === 'fit' && (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4" />
            </svg>
          )}
        </button>
      ))}
    </div>
  )
}

function AddModeHint() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(15,13,11,0.85)',
        border: '1px solid var(--amber-border)',
        borderRadius: 'var(--r-sm)',
        padding: '6px 14px',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--amber)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      Click to place waypoint · Esc to cancel
    </div>
  )
}

function TrackLegend({
  plannedLatLngs,
  tracksWithLatLngs,
}: {
  plannedLatLngs: [number, number][]
  tracksWithLatLngs: { entry: GpxTrackEntry; color: string; positions: [number, number][] }[]
}) {
  const visibleTracks = tracksWithLatLngs.filter((t) => t.positions.length > 1)
  if (plannedLatLngs.length <= 1 && visibleTracks.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        zIndex: 1000,
        background: 'rgba(15,13,11,0.82)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}
    >
      {plannedLatLngs.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="20" height="6">
            <line x1="0" y1="3" x2="20" y2="3" stroke={PLANNED_COLOR} strokeWidth="2.5" strokeDasharray="5 3" />
          </svg>
          <span style={mono}>Planned Route</span>
        </div>
      )}
      {visibleTracks.map(({ entry, color }) => (
        <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="20" height="6">
            <line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="2.5" />
          </svg>
          <span style={mono}>{entry.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Attribution strip ────────────────────────────────────────────────────────

function AttributionStrip() {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '5px 14px',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        fontFamily: 'var(--font-mono)',
        fontSize: 8,
        letterSpacing: '0.06em',
        color: 'var(--text-dim)',
      }}
    >
      Map data &copy;{' '}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        style={{ color: 'var(--text-dim)', textDecoration: 'underline', textUnderlineOffset: 2 }}
      >
        OpenStreetMap
      </a>{' '}
      contributors, tiles by{' '}
      <a
        href="https://carto.com/attributions"
        target="_blank"
        rel="noreferrer"
        style={{ color: 'var(--text-dim)', textDecoration: 'underline', textUnderlineOffset: 2 }}
      >
        CARTO
      </a>
    </div>
  )
}