import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type L from 'leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import type { GpxTrackEntry, Waypoint, WaypointType } from '../../types'
import { PLANNED_COLOR, TILE_LAYERS, type TileLayerKey } from './constants'
import { makeWaypointIcon, makePendingIcon, makeStartIcon, makeEndIcon } from './leafletIcons'
import { FitBounds, MapClickHandler, MapContextMenuHandler, MapFocuser, MapRefCapture } from './MapHelpers'
import { MapEmptyState } from './MapEmptyState'

interface MapCanvasProps {
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
  tileLayer: TileLayerKey
  onMapClick: (lat: number, lon: number) => void
  onMarkerClick: (wp: Waypoint) => void
  onMarkerContextMenu: (wp: Waypoint, x: number, y: number) => void
  onFocusDone: () => void
  onContextMenu: (lat: number, lon: number, x: number, y: number) => void
  onDismissContextMenu: () => void
}

export function MapCanvas(props: MapCanvasProps) {
  const {
    bounds, allPoints, plannedLatLngs, tracksWithLatLngs, waypoints, editingId,
    addMode, pendingLatLon, addFormType, focusId, mapRef, startEnd, tileLayer,
    onMapClick, onMarkerClick, onMarkerContextMenu, onFocusDone, onContextMenu, onDismissContextMenu,
  } = props

  if (!bounds) return <MapEmptyState />

  return (
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
  )
}
