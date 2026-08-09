import type L from 'leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import type { GpxTrackEntry, Waypoint, WaypointType } from '../../types'
import { mono, PLANNED_COLOR, type TileLayerKey } from './constants'
import { MapTileToggle } from './MapTileToggle'
import { MapCanvas } from './MapCanvas'
import { MapContextMenus } from './MapContextMenus'

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
      className="absolute bottom-4 z-1000 border border-amber-border rounded-sm px-3.5 py-1.5 font-mono text-caption tracking-[0.12em] uppercase text-amber pointer-events-none whitespace-nowrap"
      style={{ left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,13,11,0.85)' }}
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

interface MapAreaProps {
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
  tileLayer: TileLayerKey
  onTileToggle: () => void
}

export function MapArea(props: MapAreaProps) {
  const { addMode, allPoints, plannedLatLngs, tracksWithLatLngs, mapRef, contextMenu, waypointContextMenu, tileLayer } = props

  return (
    <div className="flex-1 min-h-0 relative bg-bg" style={{ cursor: addMode ? 'crosshair' : 'default' }}>
      <MapCanvas {...props} />

      <MapContextMenus
        contextMenu={contextMenu}
        waypointContextMenu={waypointContextMenu}
        onMapClick={props.onMapClick}
        onMarkerClick={props.onMarkerClick}
        onDeleteWaypoint={props.onDeleteWaypoint}
        onDismissContextMenu={props.onDismissContextMenu}
        onDismissWaypointContextMenu={props.onDismissWaypointContextMenu}
      />

      <ZoomControls mapRef={mapRef} allPoints={allPoints} />
      <MapTileToggle current={tileLayer} onToggle={props.onTileToggle} />
      {addMode && <AddModeHint />}
      <TrackLegend plannedLatLngs={plannedLatLngs} tracksWithLatLngs={tracksWithLatLngs} />
    </div>
  )
}
