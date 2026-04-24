import { useEffect, useRef, useState } from 'react'
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L, { type LatLngBoundsExpression } from 'leaflet'
import type { GpxTrack, GpxTrackEntry, Trip, Waypoint, WaypointType } from '../../types'
import { api } from '../../lib/api'
import { GpxMapSection } from '../trip/GpxMapSection'

// ─── Constants ───────────────────────────────────────────────────────────────

const PLANNED_COLOR = '#38bdf8'
const TRACK_COLORS = [
  '#4ade80',
  '#fb923c',
  '#a78bfa',
  '#f472b6',
  '#34d399',
  '#facc15',
  '#60a5fa',
  '#f87171',
]
const trackColor = (i: number) => TRACK_COLORS[i % TRACK_COLORS.length]

const WAYPOINT_COLOR: Record<WaypointType, string> = {
  campsite: '#f0a030',
  wildlife: '#448860',
  viewpoint: '#5ab4dc',
  'no-water': '#dc2626',
  'some-water': '#d97706',
  'lots-of-water': '#0ea5e9',
  other: '#685646',
}

const WAYPOINT_LABEL: Record<WaypointType, string> = {
  campsite: 'Campsite',
  wildlife: 'Wildlife',
  viewpoint: 'Viewpoint',
  'no-water': 'No Water',
  'some-water': 'Some Water',
  'lots-of-water': 'Lots of Water',
  other: 'Other',
}

const WAYPOINT_TYPES: WaypointType[] = [
  'campsite',
  'wildlife',
  'viewpoint',
  'no-water',
  'some-water',
  'lots-of-water',
  'other',
]

const DEFAULT_FORM = { label: '', type: 'campsite' as WaypointType, notes: '' }

// ─── Type icons ───────────────────────────────────────────────────────────────

function WaypointIcon({ type, size = 14 }: { type: WaypointType; size?: number }) {
  const color = WAYPOINT_COLOR[type]
  switch (type) {
    case 'campsite':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          {/* Tent: two triangular faces meeting at a peak */}
          <path d="M8 2L15 13H1L8 2Z" fill={color} opacity="0.9" />
          {/* Door cutout */}
          <path d="M6.5 13L8 9.5L9.5 13" fill="#0f0d0b" />
          {/* Ground line */}
          <line x1="1" y1="13" x2="15" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'wildlife':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
          {/* Paw: main pad + 4 toes */}
          <ellipse cx="8" cy="11" rx="3.2" ry="2.4" />
          <circle cx="4.8" cy="7.8" r="1.5" />
          <circle cx="8" cy="6.8" r="1.5" />
          <circle cx="11.2" cy="7.8" r="1.5" />
        </svg>
      )
    case 'viewpoint':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          {/* Camera body */}
          <rect x="1.5" y="5" width="13" height="9" rx="1.5" fill={color} opacity="0.9" />
          {/* Viewfinder bump */}
          <path d="M6 5V3.5C6 3 6.5 2.5 7 2.5H9C9.5 2.5 10 3 10 3.5V5" fill={color} opacity="0.7" />
          {/* Lens */}
          <circle cx="8" cy="9.5" r="2.8" fill="#0f0d0b" />
          <circle cx="8" cy="9.5" r="1.6" fill={color} opacity="0.5" />
        </svg>
      )
    case 'no-water':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          {/* Droplet outline */}
          <path
            d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z"
            fill={color}
            fillOpacity="0.25"
            stroke={color}
            strokeWidth="1.2"
          />
          {/* Diagonal slash */}
          <line x1="4.5" y1="4.5" x2="11.5" y2="12.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'some-water':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          {/* Droplet outline */}
          <path
            d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
          />
          {/* Lower ~half filled */}
          <path
            d="M4.15 11C4.75 12.76 6.24 14 8 14C9.76 14 11.25 12.76 11.85 11Z"
            fill={color}
            fillOpacity="0.9"
          />
        </svg>
      )
    case 'lots-of-water':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          {/* Fully filled droplet */}
          <path
            d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z"
            fill={color}
            fillOpacity="0.9"
          />
          {/* Highlight */}
          <ellipse cx="6.4" cy="9.5" rx="1" ry="1.6" fill="white" fillOpacity="0.3" transform="rotate(-15 6.4 9.5)" />
        </svg>
      )
    case 'other':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          {/* Map pin / teardrop */}
          <path
            d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z"
            fill={color}
            opacity="0.9"
          />
          <circle cx="8" cy="6" r="2" fill="#0f0d0b" />
        </svg>
      )
  }
}

// ─── Map icon factories ───────────────────────────────────────────────────────

function waypointSvgString(type: WaypointType, size: number): string {
  const c = WAYPOINT_COLOR[type]
  switch (type) {
    case 'campsite':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2L15 13H1L8 2Z" fill="${c}" opacity="0.9"/>
        <path d="M6.5 13L8 9.5L9.5 13" fill="#0f0d0b"/>
        <line x1="1" y1="13" x2="15" y2="13" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`
    case 'wildlife':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="${c}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="8" cy="11" rx="3.2" ry="2.4"/>
        <circle cx="4.8" cy="7.8" r="1.5"/>
        <circle cx="8" cy="6.8" r="1.5"/>
        <circle cx="11.2" cy="7.8" r="1.5"/>
      </svg>`
    case 'viewpoint':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="5" width="13" height="9" rx="1.5" fill="${c}" opacity="0.9"/>
        <path d="M6 5V3.5C6 3 6.5 2.5 7 2.5H9C9.5 2.5 10 3 10 3.5V5" fill="${c}" opacity="0.7"/>
        <circle cx="8" cy="9.5" r="2.8" fill="#0f0d0b"/>
        <circle cx="8" cy="9.5" r="1.6" fill="${c}" opacity="0.5"/>
      </svg>`
    case 'no-water':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z" fill="${c}" fill-opacity="0.25" stroke="${c}" stroke-width="1.2"/>
        <line x1="4.5" y1="4.5" x2="11.5" y2="12.5" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`
    case 'some-water':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z" fill="none" stroke="${c}" stroke-width="1.2"/>
        <path d="M4.15 11C4.75 12.76 6.24 14 8 14C9.76 14 11.25 12.76 11.85 11Z" fill="${c}" fill-opacity="0.9"/>
      </svg>`
    case 'lots-of-water':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z" fill="${c}" fill-opacity="0.9"/>
        <ellipse cx="6.4" cy="9.5" rx="1" ry="1.6" fill="white" fill-opacity="0.3" transform="rotate(-15 6.4 9.5)"/>
      </svg>`
    case 'other':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" fill="${c}" opacity="0.9"/>
        <circle cx="8" cy="6" r="2" fill="#0f0d0b"/>
      </svg>`
  }
}

function makeWaypointIcon(type: WaypointType, active: boolean): L.DivIcon {
  const color = WAYPOINT_COLOR[type]
  const size = active ? 32 : 28
  const svgSize = active ? 18 : 15
  const dimGlow = color + '33'
  const brightGlow = color + '66'
  const borderColor = active ? color : color + '88'
  return L.divIcon({
    html: `<div class="wp-marker-wrap${active ? ' wp-marker-active' : ''}" style="--wp-border-color:${borderColor};--wp-glow-dim:${dimGlow};--wp-glow-bright:${brightGlow};width:${size}px;height:${size}px;">${waypointSvgString(type, svgSize)}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 2],
  })
}

function makePendingIcon(type: WaypointType): L.DivIcon {
  const color = WAYPOINT_COLOR[type]
  const size = 30
  return L.divIcon({
    html: `<div class="wp-marker-wrap wp-marker-active" style="--wp-border-color:${color};--wp-glow-dim:${color}33;--wp-glow-bright:${color}66;width:${size}px;height:${size}px;opacity:0.85;">${waypointSvgString(type, 16)}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLatLngs(track: GpxTrack | undefined): [number, number][] {
  return track?.coordinates.map(([lon, lat]) => [lat, lon]) ?? []
}

const mono: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 120,
  padding: '5px 9px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  fontSize: 12,
  background: 'var(--surface2)',
  color: 'var(--text)',
  outline: 'none',
}

// ─── Map sub-components ───────────────────────────────────────────────────────

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (fitted.current || positions.length < 2) return
    map.fitBounds(positions as LatLngBoundsExpression, { padding: [32, 32] })
    fitted.current = true
  }, [map, positions])
  return null
}

function MapRefCapture({ mapRef }: { mapRef: React.RefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])
  return null
}

function MapClickHandler({
  active,
  onMapClick,
}: {
  active: boolean
  onMapClick: (lat: number, lon: number) => void
}) {
  useMapEvents({
    click(e) {
      if (active) onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapFocuser({
  waypoints,
  focusId,
  onDone,
}: {
  waypoints: Waypoint[]
  focusId: string | null
  onDone: () => void
}) {
  const map = useMap()
  useEffect(() => {
    if (!focusId) return
    const wp = waypoints.find((w) => w.id === focusId)
    if (wp) map.setView([wp.lat, wp.lon], Math.max(map.getZoom(), 14), { animate: true })
    onDone()
  }, [focusId]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// ─── Inline type pill row (shared by add + edit forms) ────────────────────────

function TypePills({
  value,
  onChange,
}: {
  value: WaypointType
  onChange: (t: WaypointType) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {WAYPOINT_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            border: `1px solid ${value === t ? WAYPOINT_COLOR[t] : 'var(--border)'}`,
            borderRadius: 'var(--r-sm)',
            background: value === t ? `${WAYPOINT_COLOR[t]}22` : 'transparent',
            color: value === t ? WAYPOINT_COLOR[t] : 'var(--text-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          <WaypointIcon type={t} size={11} />
          {WAYPOINT_LABEL[t]}
        </button>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const trackPoints: [number, number][] = [
    ...plannedLatLngs,
    ...tracksWithLatLngs.flatMap((t) => t.positions),
  ]
  const waypointPoints: [number, number][] = waypoints.map((w) => [w.lat, w.lon])
  const allPoints: [number, number][] = [...trackPoints, ...waypointPoints]
  const bounds = allPoints.length > 0 ? L.latLngBounds(allPoints) : null

  function startEdit(wp: Waypoint) {
    setEditingId(wp.id)
    setEditForm({ label: wp.label, type: wp.type, notes: wp.notes ?? '' })
    cancelAdd()
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function handleMapClick(lat: number, lon: number) {
    setAddMode(false)
    setPendingLatLon({ lat, lon })
    setAddForm(DEFAULT_FORM)
    cancelEdit()
  }

  function cancelAdd() {
    setPendingLatLon(null)
    setAddForm(DEFAULT_FORM)
    setAddMode(false)
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
          ? { ...w, type: editForm.type, label: editForm.label.trim(), notes: editForm.notes.trim() || undefined }
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

  const isAdding = addMode || !!pendingLatLon

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Controls bar (routes + waypoints side-by-side) ────────────────────── */}
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
          {/* Header row */}
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
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddMode(true)}>
                + Add Waypoint
              </button>
            )}
            {(isAdding || editingId) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  cancelAdd()
                  cancelEdit()
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {/* Waiting for map click */}
          {addMode && !pendingLatLon && (
            <p style={{ ...mono, color: 'var(--amber)', lineHeight: 1.7 }}>
              Click anywhere on the map below to place a waypoint
            </p>
          )}

          {/* Add form */}
          {pendingLatLon && (
            <form onSubmit={handleAddWaypoint} style={{ marginBottom: waypoints.length > 0 ? 12 : 0 }}>
              <WaypointForm
                coords={pendingLatLon}
                form={addForm}
                saving={saving}
                submitLabel="Add"
                onChange={(patch) => setAddForm((f) => ({ ...f, ...patch }))}
              />
            </form>
          )}

          {/* Edit form */}
          {editingId && (
            <form onSubmit={handleSaveEdit} style={{ marginBottom: waypoints.length > 0 ? 12 : 0 }}>
              <WaypointForm
                form={editForm}
                saving={saving}
                submitLabel="Save"
                onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
              />
            </form>
          )}

          {error && <p style={{ fontSize: 11, color: 'var(--red)', marginBottom: 8 }}>{error}</p>}

          {/* Chips */}
          {waypoints.length === 0 && !isAdding && !editingId ? (
            <p style={{ ...mono, fontSize: 9, lineHeight: 1.7 }}>
              No waypoints yet — mark campsites, wildlife sightings, viewpoints, and more.
            </p>
          ) : waypoints.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {waypoints.slice().sort((a, b) => b.lon - a.lon || b.lat - a.lat).map((wp) => (
                <WaypointChip
                  key={wp.id}
                  wp={wp}
                  isEditing={editingId === wp.id}
                  onSelect={() => { if (editingId === wp.id) { cancelEdit() } else { startEdit(wp); setFocusId(wp.id) } }}
                  onDelete={() => handleDeleteWaypoint(wp.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Map ──────────────────────────────────────────────────────────────── */}
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
              <Polyline
                positions={plannedLatLngs}
                color={PLANNED_COLOR}
                weight={4}
                opacity={0.9}
                dashArray="10 6"
              />
            )}
            {tracksWithLatLngs.map(
              ({ entry, color, positions }) =>
                positions.length > 1 && (
                  <Polyline key={entry.id} positions={positions} color={color} weight={3} opacity={0.9} />
                )
            )}
            {waypoints.map((wp) => {
              const active = editingId === wp.id
              return (
                <Marker
                  key={wp.id}
                  position={[wp.lat, wp.lon]}
                  icon={makeWaypointIcon(wp.type, active)}
                >
                  <Popup>
                    <WaypointPopup
                      wp={wp}
                      onEdit={() => startEdit(wp)}
                      onDelete={() => handleDeleteWaypoint(wp.id)}
                    />
                  </Popup>
                </Marker>
              )
            })}
            {pendingLatLon && (
              <Marker
                position={[pendingLatLon.lat, pendingLatLon.lon]}
                icon={makePendingIcon(addForm.type)}
                interactive={false}
              />
            )}
            <MapClickHandler active={addMode} onMapClick={handleMapClick} />
            {allPoints.length > 1 && <FitBounds positions={allPoints} />}
            <MapRefCapture mapRef={mapRef} />
            <MapFocuser waypoints={waypoints} focusId={focusId} onDone={() => setFocusId(null)} />
          </MapContainer>
        ) : (
          <MapEmptyState />
        )}

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
                  mapRef.current?.fitBounds(allPoints as LatLngBoundsExpression, {
                    padding: [32, 32],
                    animate: true,
                  })
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

        {addMode && (
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
        )}

        {(plannedLatLngs.length > 1 || tracksWithLatLngs.some((t) => t.positions.length > 1)) && (
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
            {tracksWithLatLngs
              .filter((t) => t.positions.length > 1)
              .map(({ entry, color }) => (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="20" height="6">
                    <line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="2.5" />
                  </svg>
                  <span style={mono}>{entry.label}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── Attribution strip ─────────────────────────────────────────────────── */}
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
    </div>
  )
}

// ─── Shared form row (add + edit) ─────────────────────────────────────────────

function WaypointForm({
  coords,
  form,
  saving,
  submitLabel,
  onChange,
}: {
  coords?: { lat: number; lon: number }
  form: { label: string; type: WaypointType; notes: string }
  saving: boolean
  submitLabel: string
  onChange: (patch: Partial<typeof form>) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {coords && (
        <span style={{ ...mono, fontSize: 8, color: 'var(--amber)', flexShrink: 0 }}>
          {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
        </span>
      )}
      <TypePills value={form.type} onChange={(t) => onChange({ type: t })} />
      <input
        style={inputStyle}
        placeholder="Name this waypoint…"
        value={form.label}
        onChange={(e) => onChange({ label: e.target.value })}
        autoFocus
        required
      />
      <input
        style={inputStyle}
        placeholder="Notes (optional)"
        value={form.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
      />
      <button
        type="submit"
        disabled={saving || !form.label.trim()}
        className="btn btn-primary btn-sm"
        style={{ flexShrink: 0 }}
      >
        {saving ? 'Saving…' : submitLabel}
      </button>
    </div>
  )
}

// ─── Waypoint chip ────────────────────────────────────────────────────────────

function WaypointChip({
  wp,
  isEditing,
  onSelect,
  onDelete,
}: {
  wp: Waypoint
  isEditing: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      onClick={onSelect}
      title={isEditing ? undefined : wp.notes ?? 'Click to edit'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px 5px 10px',
        background: isEditing ? `${WAYPOINT_COLOR[wp.type]}18` : 'var(--surface2)',
        border: `1px solid ${isEditing ? WAYPOINT_COLOR[wp.type] : `${WAYPOINT_COLOR[wp.type]}44`}`,
        borderRadius: 20,
        cursor: 'pointer',
        maxWidth: 240,
      }}
    >
      <WaypointIcon type={wp.type} size={17} />
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          color: 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {wp.label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: WAYPOINT_COLOR[wp.type],
          flexShrink: 0,
        }}
      >
        {WAYPOINT_LABEL[wp.type]}
      </span>
      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        title="Remove"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-dim)',
          fontSize: 14,
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

// ─── Waypoint popup (inside Leaflet map) ─────────────────────────────────────

function WaypointPopup({
  wp,
  onEdit,
  onDelete,
}: {
  wp: Waypoint
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', minWidth: 140 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{wp.label}</div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: WAYPOINT_COLOR[wp.type],
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <WaypointIcon type={wp.type} size={11} />
        {WAYPOINT_LABEL[wp.type]}
      </div>
      {wp.notes && (
        <div style={{ fontSize: 12, color: '#555', marginBottom: 6, lineHeight: 1.5 }}>
          {wp.notes}
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#888', marginBottom: 8 }}>
        {wp.lat.toFixed(5)}, {wp.lon.toFixed(5)}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onEdit}
          style={{
            background: 'none',
            border: '1px solid #bbb',
            borderRadius: 4,
            padding: '3px 8px',
            fontSize: 11,
            cursor: 'pointer',
            color: '#333',
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: '3px 8px',
            fontSize: 11,
            cursor: 'pointer',
            color: '#e53e3e',
          }}
        >
          Remove
        </button>
      </div>
    </div>
  )
}

// ─── Empty map state ──────────────────────────────────────────────────────────

function MapEmptyState() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        background: 'var(--bg)',
      }}
    >
      <div style={{ fontSize: 32, opacity: 0.15 }}>🗺</div>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          textAlign: 'center',
          maxWidth: 220,
          lineHeight: 1.8,
        }}
      >
        Import a planned route or GPS track in the right panel, or add a waypoint below to render
        the map
      </p>
    </div>
  )
}