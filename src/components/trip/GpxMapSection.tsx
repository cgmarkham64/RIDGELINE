import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLngBoundsExpression } from 'leaflet'
import L from 'leaflet'
import type { Trip, GpxTrack, GpxTrackEntry } from '../../types'
import { parseGpx } from '../../lib/gpx'
import type { ParsedGpx } from '../../lib/gpx'
import { api } from '../../lib/api'
import { makeWaypointIcon, makeStartIcon, makeEndIcon } from '../map/WaypointIcon'
import { resolveStartEnd } from '../map/constants'

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
      className="absolute right-0 top-[calc(100%+4px)] bg-surface border border-border rounded-md z-10 min-w-37 overflow-hidden"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="block w-full text-left px-3 py-2 text-[11px] font-mono tracking-[0.06em] uppercase bg-transparent border-0 cursor-pointer text-text"
        onClick={onImport}
      >
        {importLabel}
      </button>
      {hasTrack && (
        <button
          className="block w-full text-left px-3 py-2 text-[11px] font-mono tracking-[0.06em] uppercase bg-transparent border-0 cursor-pointer text-red border-t border-border"
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
  showMap = true,
  activeWaypointId,
  onWaypointClick,
}: {
  trip: Trip
  onTripUpdated: (trip: Trip) => void
  showMap?: boolean
  activeWaypointId?: string | null
  onWaypointClick?: (id: string) => void
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
      const { track, firstTimestamp }: ParsedGpx = parseGpx(text)

      if (target.type === 'planned') {
        const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, { gpxPlanned: track })
        onTripUpdated(data)
      } else if (target.type === 'track-new') {
        const newEntry: GpxTrackEntry = {
          id: Date.now().toString(),
          label: `Day ${gpxTracks.length + 1}`,
          track,
          firstTimestamp,
        }
        const { data } = await api.put<Trip>(`/api/trips/${trip._id}`, {
          gpxTracks: [...gpxTracks, newEntry],
        })
        onTripUpdated(data)
      } else {
        // track-replace: swap the matching entry's track in-place, refresh its timestamp
        const updated = gpxTracks.map((entry) =>
          entry.id === target.id ? { ...entry, track, firstTimestamp } : entry
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
  const startEnd = resolveStartEnd(plannedLatLngs, tracksWithLatLngs)
  const bounds = allPoints.length > 1 ? L.latLngBounds(allPoints) : null
  const hasAny = allPoints.length > 1

  return (
    <div>
      {/* Import area — single card, stacked */}
      <div className="border border-border rounded-md px-3.5 py-2.5 bg-surface mb-3">
        {/* Planned Route row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <svg width="18" height="6" className="shrink-0">
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
            <div className="min-w-0">
              <div className="font-heading text-[12px] font-bold text-text whitespace-nowrap">
                Planned Route
              </div>
              <div className="font-mono text-[9px] tracking-widest uppercase text-text-dim">
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
          <div className="relative shrink-0">
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
        <div className="border-t border-border my-2.5" />

        {/* GPS Tracks section */}
        <div>
          <div
            className="flex items-center justify-between gap-2"
            style={{ marginBottom: gpxTracks.length > 0 ? 8 : 0 }}
          >
            <div className="font-heading text-[12px] font-bold text-text">
              GPS Tracks
            </div>
            <button
              className="btn btn-ghost btn-sm shrink-0"
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '2px 8px',
              }}
              disabled={importing === 'new-track'}
              onClick={() => openPicker({ type: 'track-new' })}
            >
              {importing === 'new-track' ? 'Importing…' : '+ Add'}
            </button>
          </div>

          {gpxTracks.length === 0 ? (
            <div className="font-mono text-[9px] tracking-widest uppercase text-text-dim">Import after each day</div>
          ) : (
            <div className={"flex flex-col gap-1.25"}>
              {gpxTracks.map((entry, i) => {
                const color = trackColor(i)
                const isImporting = importing === entry.id
                const isRemoving = removing === entry.id
                const busy = isImporting || isRemoving
                const menuOpen = openMenu === entry.id
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-1.5"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <svg width="14" height="6" className="shrink-0">
                        <line x1="0" y1="3" x2="14" y2="3" stroke={color} strokeWidth="2.5" />
                      </svg>
                      <span
                        className="font-mono text-[9px] tracking-widest uppercase text-text overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        {isImporting ? 'Importing…' : isRemoving ? 'Removing…' : entry.label}
                      </span>
                    </div>
                    <div className="relative shrink-0">
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
        <p className="text-[11px] text-red mb-2">{error}</p>
      )}

      {/* Map — hidden when showMap={false} (e.g. map tab renders its own full-size map) */}
      {showMap && hasAny && bounds ? (
        <div className="relative z-1 rounded-md overflow-hidden border border-border">
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
            {(trip.waypoints ?? []).map((wp) => {
              const isActive = wp.id === activeWaypointId
              return (
                <Marker
                  key={wp.id}
                  position={[wp.lat, wp.lon]}
                  icon={makeWaypointIcon(wp.type, isActive, isActive ? 26 : 20)}
                  interactive={!!onWaypointClick}
                  eventHandlers={
                    onWaypointClick
                      ? { click: () => onWaypointClick(wp.id) }
                      : undefined
                  }
                />
              )
            })}
            {startEnd && (
              <>
                <Marker position={startEnd.start} icon={makeStartIcon(18)} interactive={false} />
                <Marker position={startEnd.end} icon={makeEndIcon(18)} interactive={false} />
              </>
            )}
            <FitBounds positions={allPoints} />
          </MapContainer>

          {/* Legend — shown when at least one polyline is visible */}
          <div className="flex gap-4 px-3 py-2 bg-surface border-t border-border flex-wrap">
            {plannedLatLngs.length > 1 && (
              <div className="flex items-center gap-1.5">
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
                <span className="font-mono text-[9px] tracking-widest uppercase text-text-dim">Planned Route</span>
              </div>
            )}
            {tracksWithLatLngs
              .filter((t) => t.positions.length > 1)
              .map(({ entry, color }) => (
                <div key={entry.id} className="flex items-center gap-1.5">
                  <svg width="20" height="6">
                    <line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="2.5" />
                  </svg>
                  <span className="font-mono text-[9px] tracking-widest uppercase text-text-dim">{entry.label}</span>
                </div>
              ))}
          </div>
        </div>
      ) : showMap ? (
        <div className="border border-dashed border-border rounded-md px-5 py-7 text-center">
          <div className="text-2xl opacity-20 mb-1.5">🗺</div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-text-dim">Import a planned route or GPS track above to render the map</p>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}