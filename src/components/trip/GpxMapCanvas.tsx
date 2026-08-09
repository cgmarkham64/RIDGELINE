import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type L from 'leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import type { Trip, GpxTrackEntry } from '../../types'
import { makeWaypointIcon, makeStartIcon, makeEndIcon } from '../map/leafletIcons'
import { TILE_LAYERS, type TileLayerKey } from '../map/constants'
import { PLANNED_COLOR } from './gpxMapSection.helpers'

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions as LatLngBoundsExpression, { padding: [24, 24] })
    }
  }, [map, positions])
  return null
}

export function GpxMapCanvas({
  bounds, allPoints, plannedLatLngs, tracksWithLatLngs, startEnd, waypoints, activeWaypointId, onWaypointClick, tileLayer,
}: {
  bounds: L.LatLngBounds
  allPoints: [number, number][]
  plannedLatLngs: [number, number][]
  tracksWithLatLngs: { entry: GpxTrackEntry; color: string; positions: [number, number][] }[]
  startEnd: { start: [number, number]; end: [number, number] } | null
  waypoints: Trip['waypoints']
  activeWaypointId?: string | null
  onWaypointClick?: (id: string) => void
  tileLayer: TileLayerKey
}) {
  return (
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
      {(waypoints ?? []).map((wp) => {
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
  )
}
