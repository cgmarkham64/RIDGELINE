import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLngBoundsExpression } from 'leaflet'
import L from 'leaflet'
import type { Trip, GpxTrackEntry } from '../../types'
import { parseGpx } from '../../lib/gpx'
import type { ParsedGpx } from '../../lib/gpx'
import { api } from '../../lib/api'
import { makeWaypointIcon, makeStartIcon, makeEndIcon } from '../map/leafletIcons'
import { resolveStartEnd, TILE_LAYERS, type TileLayerKey } from '../map/constants'
import { MapTileToggle } from '../map/MapTileToggle'
import { GpxImportPanel } from './GpxImportPanel'
import { toLatLngs, trackColor, PLANNED_COLOR, type ImportTarget } from './gpxMapSection.helpers'

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions as LatLngBoundsExpression, { padding: [24, 24] })
    }
  }, [map, positions])
  return null
}

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

  const [importing, setImporting] = useState<string | null>(null)
  const [removing, setRemoving]   = useState<string | null>(null)
  const [openMenu, setOpenMenu]   = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [tileLayer, setTileLayer] = useState<TileLayerKey>('topo')

  const gpxTracks = trip.gpxTracks ?? []

  useEffect(() => {
    if (!openMenu) return
    function close() { setOpenMenu(null) }
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

  // ─── Derived map data ─────────────────────────────────────────────────────

  const plannedLatLngs = toLatLngs(trip.gpxPlanned)
  const tracksWithLatLngs = gpxTracks.map((entry, i) => ({
    entry,
    color: trackColor(i),
    positions: toLatLngs(entry.track),
  }))
  const allPoints = [...plannedLatLngs, ...tracksWithLatLngs.flatMap((t) => t.positions)]
  const startEnd  = resolveStartEnd(plannedLatLngs, tracksWithLatLngs)
  const bounds    = allPoints.length > 1 ? L.latLngBounds(allPoints) : null
  const hasAny    = allPoints.length > 1

  return (
    <div>
      <GpxImportPanel
        gpxPlanned={trip.gpxPlanned}
        gpxTracks={gpxTracks}
        importing={importing}
        removing={removing}
        openMenu={openMenu}
        onSetMenu={setOpenMenu}
        onOpenPicker={openPicker}
        onRemovePlanned={removePlanned}
        onRemoveTrack={removeTrack}
      />

      {error && <p className="text-fine text-red mb-2">{error}</p>}

      {showMap && hasAny && bounds ? (
        <div className="relative z-1 rounded-md overflow-hidden border border-border">
          <MapTileToggle current={tileLayer} onToggle={() => setTileLayer(k => k === 'topo' ? 'dark' : 'topo')} />
          <MapContainer
            bounds={bounds}
            boundsOptions={{ padding: [24, 24] }}
            style={{ height: 220, width: '100%' }}
            scrollWheelZoom={false}
            attributionControl={false}
          >
            <TileLayer {...TILE_LAYERS[tileLayer]} />
            {plannedLatLngs.length > 1 && (
              <Polyline positions={plannedLatLngs} color={PLANNED_COLOR} weight={4} opacity={0.9} dashArray="10 6" />
            )}
            {tracksWithLatLngs.map(({ entry, color, positions }) =>
              positions.length > 1 ? (
                <Polyline key={entry.id} positions={positions} color={color} weight={3} opacity={0.9} />
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
                  eventHandlers={onWaypointClick ? { click: () => onWaypointClick(wp.id) } : undefined}
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

          <div className="flex gap-4 px-3 py-2 bg-surface border-t border-border flex-wrap">
            {plannedLatLngs.length > 1 && (
              <div className="flex items-center gap-1.5">
                <svg width="20" height="6">
                  <line x1="0" y1="3" x2="20" y2="3" stroke={PLANNED_COLOR} strokeWidth="2.5" strokeDasharray="5 3" />
                </svg>
                <span className="font-mono text-label tracking-widest uppercase text-text-dim">Planned Route</span>
              </div>
            )}
            {tracksWithLatLngs
              .filter((t) => t.positions.length > 1)
              .map(({ entry, color }) => (
                <div key={entry.id} className="flex items-center gap-1.5">
                  <svg width="20" height="6">
                    <line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="2.5" />
                  </svg>
                  <span className="font-mono text-label tracking-widest uppercase text-text-dim">{entry.label}</span>
                </div>
              ))}
          </div>
        </div>
      ) : showMap ? (
        <div className="border border-dashed border-border rounded-md px-5 py-7 text-center">
          <div className="text-2xl opacity-20 mb-1.5">🗺</div>
          <p className="font-mono text-label tracking-widest uppercase text-text-dim">Import a planned route or GPS track above to render the map</p>
        </div>
      ) : null}

      <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={handleFileChange} />
    </div>
  )
}