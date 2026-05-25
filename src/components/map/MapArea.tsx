import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L, { type LatLngBoundsExpression } from 'leaflet'
import type { GpxTrackEntry, Waypoint, WaypointType } from '../../types'
import { PLANNED_COLOR, mono, TILE_LAYERS, type TileLayerKey } from './constants'
import { MapTileToggle } from './MapTileToggle'
import { makeWaypointIcon, makePendingIcon, makeStartIcon, makeEndIcon } from './leafletIcons'
import { FitBounds, MapClickHandler, MapContextMenuHandler, MapFocuser, MapRefCapture } from './MapHelpers'
import { MapEmptyState } from './MapEmptyState'

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

export function MapArea({
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
  tileLayer,
  onTileToggle,
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
  tileLayer: TileLayerKey
  onTileToggle: () => void
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
          <TileLayer {...TILE_LAYERS[tileLayer]} />
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
      <MapTileToggle current={tileLayer} onToggle={onTileToggle} />
      {addMode && <AddModeHint />}
      <TrackLegend plannedLatLngs={plannedLatLngs} tracksWithLatLngs={tracksWithLatLngs} />
    </div>
  )
}