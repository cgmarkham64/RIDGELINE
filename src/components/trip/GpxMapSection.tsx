import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLngBoundsExpression } from 'leaflet'
import L from 'leaflet'
import type { Trip, GpxTrack, GpxTrackEntry } from '../../types'
import { parseGpx } from '../../lib/gpx'
import { api } from '../../lib/api'

// ─── Map helpers ─────────────────────────────────────────────────────────────

function toLatLngs(track: GpxTrack | undefined): [number, number][] {
  return track?.coordinates.map(([lon, lat]) => [lat, lon]) ?? []
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions as LatLngBoundsExpression, { padding: [24, 24] })
    }
  }, [map, positions])
  return null
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const mono: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
}

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
}

// ─── Color palette ───────────────────────────────────────────────────────────

const PLANNED_COLOR = '#38bdf8' // sky blue — dashed, reads as "future"

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

function trackColor(index: number) {
  return TRACK_COLORS[index % TRACK_COLORS.length]
}

// ─── Import target ───────────────────────────────────────────────────────────

type ImportTarget =
  | { type: 'planned' }
  | { type: 'track-new' }
  | { type: 'track-replace'; id: string }

// ─── Kabob menu ───────────────────────────────────────────────────────────────

function KabobMenu({
  hasTrack,
  importLabel,
  onImport,
  onRemove,
}: {
  hasTrack: boolean
  importLabel: string
  onImport: () => void
  onRemove: () => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 4px)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        zIndex: 10,
        minWidth: 148,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button style={{ ...menuItemStyle, color: 'var(--text)' }} onClick={onImport}>
        {importLabel}
      </button>
      {hasTrack && (
        <button
          style={{
            ...menuItemStyle,
            color: 'var(--red, #ef4444)',
            borderTop: '1px solid var(--border)',
          }}
          onClick={onRemove}
        >
          Remove
        </button>
      )}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GpxMapSection({
  trip,
  onTripUpdated,
}: {
  trip: Trip
  onTripUpdated: (trip: Trip) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingTarget = useRef<ImportTarget | null>(null)

  // Busy state keys: 'planned' | 'new-track' | track entry id
  const [importing, setImporting] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const gpxTracks = trip.gpxTracks ?? []

  useEffect(() => {
    if (!openMenu) return
    function close() {
      setOpenMenu(null)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenu])

  function openPicker(target: ImportTarget) {
    pendingTarget.current = target
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const target = pendingTarget.current
    if (!file || !target) return

    const busyKey =
      target.type === 'planned' ? 'planned' : target.type === 'track-new' ? 'new-track' : target.id

    setImporting(busyKey)
    setError(null)
    try {
      const text = await file.text()
      const gpxData = parseGpx(text)

      if (target.type === 'planned') {
        const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { gpxPlanned: gpxData })
        onTripUpdated(data)
      } else if (target.type === 'track-new') {
        const newEntry: GpxTrackEntry = {
          id: Date.now().toString(),
          label: `Day ${gpxTracks.length + 1}`,
          track: gpxData,
        }
        const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, {
          gpxTracks: [...gpxTracks, newEntry],
        })
        onTripUpdated(data)
      } else {
        // track-replace: swap the matching entry's track in-place
        const updated = gpxTracks.map((entry) =>
          entry.id === target.id ? { ...entry, track: gpxData } : entry
        )
        const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { gpxTracks: updated })
        onTripUpdated(data)
      }
    } catch (err) {
      console.error('GPX import error:', err)
      setError(err instanceof Error ? err.message : 'Failed to import GPX')
    } finally {
      setImporting(null)
      pendingTarget.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function removePlanned() {
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

  async function removeTrack(id: string) {
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

  // ─── Map data ─────────────────────────────────────────────────────────────

  const plannedLatLngs = toLatLngs(trip.gpxPlanned)
  const tracksWithLatLngs = gpxTracks.map((entry, i) => ({
    entry,
    color: trackColor(i),
    positions: toLatLngs(entry.track),
  }))
  const allPoints = [...plannedLatLngs, ...tracksWithLatLngs.flatMap((t) => t.positions)]
  const bounds = allPoints.length > 1 ? L.latLngBounds(allPoints) : null
  const hasAny = allPoints.length > 1

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    padding: '10px 14px',
    background: 'var(--surface)',
  }

  return (
    <div>
      {/* Import area — single card, stacked */}
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        {/* Planned Route row */}
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <svg width="18" height="6" style={{ flexShrink: 0 }}>
              <line
                x1="0"
                y1="3"
                x2="18"
                y2="3"
                stroke={PLANNED_COLOR}
                strokeWidth="2.5"
                strokeDasharray="5 3"
              />
            </svg>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                }}
              >
                Planned Route
              </div>
              <div style={{ ...mono, fontSize: 8 }}>
                {importing === 'planned'
                  ? 'Importing…'
                  : removing === 'planned'
                    ? 'Removing…'
                    : trip.gpxPlanned
                      ? 'Imported'
                      : 'Import before the trip'}
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 16, lineHeight: 1, padding: '2px 7px', letterSpacing: '0.05em' }}
              disabled={importing === 'planned' || removing === 'planned'}
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenu(openMenu === 'planned' ? null : 'planned')
              }}
            >
              ⋮
            </button>
            {openMenu === 'planned' && (
              <KabobMenu
                hasTrack={!!trip.gpxPlanned}
                importLabel={trip.gpxPlanned ? 'Replace .gpx' : 'Import .gpx'}
                onImport={() => {
                  setOpenMenu(null)
                  openPicker({ type: 'planned' })
                }}
                onRemove={() => {
                  setOpenMenu(null)
                  removePlanned()
                }}
              />
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />

        {/* GPS Tracks section */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: gpxTracks.length > 0 ? 8 : 0,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text)',
              }}
            >
              GPS Tracks
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                flexShrink: 0,
              }}
              disabled={importing === 'new-track'}
              onClick={() => openPicker({ type: 'track-new' })}
            >
              {importing === 'new-track' ? 'Importing…' : '+ Add'}
            </button>
          </div>

          {gpxTracks.length === 0 ? (
            <div style={{ ...mono, fontSize: 8 }}>Import after each day</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {gpxTracks.map((entry, i) => {
                const color = trackColor(i)
                const isImporting = importing === entry.id
                const isRemoving = removing === entry.id
                const busy = isImporting || isRemoving
                const menuOpen = openMenu === entry.id
                return (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <svg width="14" height="6" style={{ flexShrink: 0 }}>
                        <line x1="0" y1="3" x2="14" y2="3" stroke={color} strokeWidth="2.5" />
                      </svg>
                      <span
                        style={{
                          ...mono,
                          fontSize: 8,
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isImporting ? 'Importing…' : isRemoving ? 'Removing…' : entry.label}
                      </span>
                    </div>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{
                          fontSize: 14,
                          lineHeight: 1,
                          padding: '1px 5px',
                          letterSpacing: '0.05em',
                        }}
                        disabled={busy}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenu(menuOpen ? null : entry.id)
                        }}
                      >
                        ⋮
                      </button>
                      {menuOpen && (
                        <KabobMenu
                          hasTrack
                          importLabel="Replace .gpx"
                          onImport={() => {
                            setOpenMenu(null)
                            openPicker({ type: 'track-replace', id: entry.id })
                          }}
                          onRemove={() => {
                            setOpenMenu(null)
                            removeTrack(entry.id)
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 11, color: 'var(--red, #ef4444)', marginBottom: 8 }}>{error}</p>
      )}

      {/* Map */}
      {hasAny && bounds ? (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
        >
          <MapContainer
            bounds={bounds}
            boundsOptions={{ padding: [24, 24] }}
            style={{ height: 220, width: '100%' }}
            scrollWheelZoom={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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
            {tracksWithLatLngs.map(({ entry, color, positions }) =>
              positions.length > 1 ? (
                <Polyline
                  key={entry.id}
                  positions={positions}
                  color={color}
                  weight={3}
                  opacity={0.9}
                />
              ) : null
            )}
            <FitBounds positions={allPoints} />
          </MapContainer>

          {/* Legend — shown when at least one polyline is visible */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              padding: '8px 12px',
              background: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}
          >
            {plannedLatLngs.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="20" height="6">
                  <line
                    x1="0"
                    y1="3"
                    x2="20"
                    y2="3"
                    stroke={PLANNED_COLOR}
                    strokeWidth="2.5"
                    strokeDasharray="5 3"
                  />
                </svg>
                <span style={{ ...mono, fontSize: 8 }}>Planned Route</span>
              </div>
            )}
            {tracksWithLatLngs
              .filter((t) => t.positions.length > 1)
              .map(({ entry, color }) => (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="20" height="6">
                    <line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="2.5" />
                  </svg>
                  <span style={{ ...mono, fontSize: 8 }}>{entry.label}</span>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            border: '1px dashed var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '28px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, opacity: 0.2, marginBottom: 6 }}>🗺</div>
          <p style={mono}>Import a planned route or GPS track above to render the map</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}
