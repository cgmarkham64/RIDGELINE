import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import L, { type LatLngBoundsExpression } from 'leaflet'
import type { Waypoint } from '../../types'

export function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (fitted.current || positions.length < 2) return
    map.fitBounds(positions as LatLngBoundsExpression, { padding: [32, 32] })
    fitted.current = true
  }, [map, positions])
  return null
}

export function MapRefCapture({ mapRef }: { mapRef: RefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])
  return null
}

export function MapClickHandler({
  active,
  onMapClick,
  onDismiss,
}: {
  active: boolean
  onMapClick: (lat: number, lon: number) => void
  onDismiss?: () => void
}) {
  useMapEvents({
    click(e) {
      onDismiss?.()
      if (active) onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function MapContextMenuHandler({
  onContextMenu,
  onDismiss,
}: {
  onContextMenu: (lat: number, lon: number, x: number, y: number) => void
  onDismiss: () => void
}) {
  useMapEvents({
    contextmenu(e) {
      e.originalEvent.preventDefault()
      onContextMenu(e.latlng.lat, e.latlng.lng, e.containerPoint.x, e.containerPoint.y)
    },
    movestart() {
      onDismiss()
    },
  })
  return null
}

export function MapFocuser({
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