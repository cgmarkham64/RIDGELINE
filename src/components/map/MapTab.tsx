import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L, { type LatLngBoundsExpression } from 'leaflet'
import type { GpxTrack, GpxTrackEntry, Trip, Waypoint, WaypointType } from '../../types'
import { api } from '../../lib/api'
import { GpxMapSection } from '../trip/GpxMapSection'
import { DEFAULT_FORM, PLANNED_COLOR, mono, trackColor, resolveStartEnd } from './constants'
import { makeWaypointIcon, makePendingIcon, makeStartIcon, makeEndIcon } from './WaypointIcon'
import { FitBounds, MapClickHandler, MapContextMenuHandler, MapFocuser, MapRefCapture } from './MapHelpers'
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
  const [contextMenu, setContextMenu] = useState<{ lat: number; lon: number; x: number; y: number } | null>(null)
  const [waypointContextMenu, setWaypointContextMenu] = useState<{ wp: Waypoint; x: number; y: number } | null>(null)
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
        setContextMenu(null)
        setWaypointContextMenu(null)
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
    <div className="flex flex-col h-full">
      <ControlsBar
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

      <AttributionStrip />
    </div>
  )
}

// ─── Controls bar ─────────────────────────────────────────────────────────────

function ControlsBar({
  trip,
  onTripUpdated,
  waypoints,
  addMode,
  editingId,
  onAddModeStart,
  onCancelAdd,
  onChipSelect,
  onChipEdit,
  onChipDelete,
}: {
  trip: Trip
  onTripUpdated: (t: Trip) => void
  waypoints: Waypoint[]
  addMode: boolean
  editingId: string | null
  onAddModeStart: () => void
  onCancelAdd: () => void
  onChipSelect: (wp: Waypoint) => void
  onChipEdit: (wp: Waypoint) => void
  onChipDelete: (id: string) => void
}) {
  const sortedWaypoints = waypoints.slice().sort((a, b) => b.lon - a.lon || b.lat - a.lat)

  return (
    <div className="shrink-0 border-b border-border flex items-stretch">
      {/* Routes & Tracks */}
      <div className="w-[40%] shrink-0 border-r border-border bg-surface px-4.5 py-3.5 overflow-y-auto max-h-50">
        <div className="sec-label mb-3">
          Routes &amp; Tracks
        </div>
        <GpxMapSection trip={trip} onTripUpdated={onTripUpdated} showMap={false} />
      </div>

      {/* Waypoints */}
      <div className="flex-1 min-w-0 bg-surface overflow-y-auto max-h-50 px-4.5 pt-1.5 pb-3.5">
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: editingId || waypoints.length > 0 ? 12 : 0 }}
        >
          <div className="sec-label m-0 flex-1">Waypoints</div>
          {!addMode && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onAddModeStart}>
              + Add Waypoint
            </button>
          )}
          {addMode && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelAdd}>
              Cancel
            </button>
          )}
        </div>

        {waypoints.length === 0 && !addMode && !editingId ? (
          <p style={mono} className="text-[9px] leading-[1.7]">
            No waypoints yet — mark campsites, wildlife sightings, viewpoints, and more.
          </p>
        ) : waypoints.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {sortedWaypoints.map((wp) => (
              <WaypointChip
                key={wp.id}
                wp={wp}
                isEditing={editingId === wp.id}
                onSelect={() => onChipSelect(wp)}
                onEdit={() => onChipEdit(wp)}
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
  startEnd,
  contextMenu,
  waypointContextMenu,
  onMapClick,
  onMarkerClick,
  onMarkerContextMenu,
  onDeleteWaypoint,
  onFocusDone,
  onContextMenu,
  onDismissContextMenu,
  onDismissWaypointContextMenu,
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
  startEnd: { start: [number, number]; end: [number, number] } | null
  contextMenu: { lat: number; lon: number; x: number; y: number } | null
  waypointContextMenu: { wp: Waypoint; x: number; y: number } | null
  onMapClick: (lat: number, lon: number) => void
  onMarkerClick: (wp: Waypoint) => void
  onMarkerContextMenu: (wp: Waypoint, x: number, y: number) => void
  onDeleteWaypoint: (id: string) => void
  onFocusDone: () => void
  onContextMenu: (lat: number, lon: number, x: number, y: number) => void
  onDismissContextMenu: () => void
  onDismissWaypointContextMenu: () => void
}) {
  return (
    <div
      className="flex-1 min-h-0 relative bg-bg"
      style={{ cursor: addMode ? 'crosshair' : 'default' }}
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
              eventHandlers={{
                click: () => onMarkerClick(wp),
                contextmenu: (e) => {
                  e.originalEvent.preventDefault()
                  e.originalEvent.stopPropagation()
                  onMarkerContextMenu(wp, e.containerPoint.x, e.containerPoint.y)
                },
              }}
            />
          ))}
          {startEnd && (
            <>
              <Marker position={startEnd.start} icon={makeStartIcon()} interactive={false} />
              <Marker position={startEnd.end} icon={makeEndIcon()} interactive={false} />
            </>
          )}
          {pendingLatLon && (
            <Marker
              position={[pendingLatLon.lat, pendingLatLon.lon]}
              icon={makePendingIcon(addFormType)}
              interactive={false}
            />
          )}
          <MapClickHandler active={addMode} onMapClick={onMapClick} onDismiss={onDismissContextMenu} />
          <MapContextMenuHandler onContextMenu={onContextMenu} onDismiss={onDismissContextMenu} />
          {allPoints.length > 1 && <FitBounds positions={allPoints} />}
          <MapRefCapture mapRef={mapRef} />
          <MapFocuser waypoints={waypoints} focusId={focusId} onDone={onFocusDone} />
        </MapContainer>
      ) : (
        <MapEmptyState />
      )}

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onDismiss={onDismissContextMenu}>
          <ContextMenuItem
            icon={<path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6z" />}
            label="Add waypoint here"
            onClick={() => onMapClick(contextMenu.lat, contextMenu.lon)}
          />
        </ContextMenu>
      )}

      {waypointContextMenu && (
        <ContextMenu x={waypointContextMenu.x} y={waypointContextMenu.y} onDismiss={onDismissWaypointContextMenu}>
          <ContextMenuItem
            icon={<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />}
            label="Edit waypoint"
            onClick={() => { onMarkerClick(waypointContextMenu.wp); onDismissWaypointContextMenu() }}
          />
          <ContextMenuItem
            icon={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>}
            label="Remove waypoint"
            danger
            onClick={() => { onDeleteWaypoint(waypointContextMenu.wp.id); onDismissWaypointContextMenu() }}
          />
        </ContextMenu>
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
    <div className="absolute top-3 left-3 z-1000 flex flex-col border border-border rounded-sm overflow-hidden">
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
          className="w-7.5 h-7.5 flex items-center justify-center border-0 text-text-dim"
          style={{
            background: 'rgba(15,13,11,0.82)',
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
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
      className="absolute bottom-4 z-1000 border border-amber-border rounded-sm px-3.5 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase text-amber pointer-events-none whitespace-nowrap"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15,13,11,0.85)',
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
      className="absolute bottom-3 right-3 z-1000 border border-border rounded-md px-3 py-2 flex flex-col gap-1.25"
      style={{ background: 'rgba(15,13,11,0.82)' }}
    >
      {plannedLatLngs.length > 1 && (
        <div className="flex items-center gap-1.75">
          <svg width="20" height="6">
            <line x1="0" y1="3" x2="20" y2="3" stroke={PLANNED_COLOR} strokeWidth="2.5" strokeDasharray="5 3" />
          </svg>
          <span style={mono}>Planned Route</span>
        </div>
      )}
      {visibleTracks.map(({ entry, color }) => (
        <div key={entry.id} className="flex items-center gap-1.75">
          <svg width="20" height="6">
            <line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="2.5" />
          </svg>
          <span style={mono}>{entry.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Context menu primitives ──────────────────────────────────────────────────

function ContextMenu({ x, y, children }: { x: number; y: number; onDismiss: () => void; children: React.ReactNode }) {
  return (
    <div
      className="absolute z-1001 bg-surface border border-border rounded-md overflow-hidden py-0.5"
      style={{ left: x + 4, top: y + 4, minWidth: 172 }}
    >
      {children}
    </div>
  )
}

function ContextMenuItem({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.75 font-mono text-[10px] tracking-[0.08em] uppercase transition-colors duration-80 cursor-pointer ${danger ? 'text-text-dim hover:text-red hover:bg-red-dim' : 'text-text-mid hover:text-amber hover:bg-surface-2'}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5 shrink-0" style={{ strokeWidth: 2 }}>
        {icon}
      </svg>
      {label}
    </button>
  )
}

// ─── Waypoint add dialog ──────────────────────────────────────────────────────

function WaypointAddDialog({
  coords,
  form,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}: {
  coords: { lat: number; lon: number }
  form: typeof DEFAULT_FORM
  saving: boolean
  error: string | null
  onChange: (patch: Partial<typeof DEFAULT_FORM>) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-1002 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-heading text-sm font-extrabold text-text">New Waypoint</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-sm bg-surface-2 border border-border text-text-dim hover:text-text transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5" style={{ strokeWidth: 2 }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-4 py-4">
          <WaypointForm
            coords={coords}
            form={form}
            saving={saving}
            submitLabel="Add waypoint"
            onChange={onChange}
          />
        </form>
        {error && <p className="px-4 pb-3 text-[11px] text-red">{error}</p>}
      </div>
    </div>
  )
}

// ─── Waypoint edit dialog ─────────────────────────────────────────────────────

function WaypointEditDialog({
  waypoint,
  form,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}: {
  waypoint: Waypoint
  form: typeof DEFAULT_FORM
  saving: boolean
  error: string | null
  onChange: (patch: Partial<typeof DEFAULT_FORM>) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-1002 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-heading text-sm font-extrabold text-text">Edit Waypoint</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-sm bg-surface-2 border border-border text-text-dim hover:text-text transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5" style={{ strokeWidth: 2 }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-4 py-4">
          <WaypointForm
            coords={{ lat: waypoint.lat, lon: waypoint.lon }}
            form={form}
            saving={saving}
            submitLabel="Save changes"
            onChange={onChange}
          />
        </form>
        {error && <p className="px-4 pb-3 text-[11px] text-red">{error}</p>}
      </div>
    </div>
  )
}

// ─── Attribution strip ────────────────────────────────────────────────────────

function AttributionStrip() {
  return (
    <div className="shrink-0 px-3.5 py-1.25 border-t border-border bg-surface font-mono text-[9px] tracking-[0.06em] text-text-dim">
      Map data &copy;{' '}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="text-text-dim underline underline-offset-2"
      >
        OpenStreetMap
      </a>{' '}
      contributors, tiles by{' '}
      <a
        href="https://carto.com/attributions"
        target="_blank"
        rel="noreferrer"
        className="text-text-dim underline underline-offset-2"
      >
        CARTO
      </a>
    </div>
  )
}