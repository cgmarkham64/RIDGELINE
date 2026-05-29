import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import L, { type LatLngBoundsExpression } from 'leaflet'
import type { Waypoint } from '../../types'
import { IconPlus, IconMinus, IconFitBounds } from '../icons'
import type { TileLayerKey } from './constants'

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

export function ZoomControls({
  mapRef,
  allPoints,
}: {
  mapRef: RefObject<L.Map | null>
  allPoints: [number, number][]
}) {
  return (
    <div className="absolute top-3 left-3 z-[1000] flex flex-col border border-border rounded-sm overflow-hidden">
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
          className="w-7.5 h-7.5 flex items-center justify-center border-0 text-text-dim hover:text-text transition-colors cursor-pointer"
          style={{
            background: 'rgba(15,13,11,0.82)',
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            cursor: action === 'fit' && allPoints.length < 2 ? 'default' : 'pointer',
            opacity: action === 'fit' && allPoints.length < 2 ? 0.4 : 1,
          }}
        >
          {action === 'in'  && <IconPlus size={13} />}
          {action === 'out' && <IconMinus size={13} />}
          {action === 'fit' && <IconFitBounds size={13} />}
        </button>
      ))}
    </div>
  )
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

export function AttributionStrip({ tileLayer }: { tileLayer: TileLayerKey }) {
  return (
    <div className="px-3 py-1 border-t border-border bg-surface font-mono text-label tracking-[0.06em] text-text-dim">
      Map data &copy;{' '}
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-text transition-colors">
        OpenStreetMap
      </a>{' '}
      contributors, tiles by{' '}
      {tileLayer === 'topo' ? (
        <a href="https://opentopomap.org" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-text transition-colors">
          OpenTopoMap
        </a>
      ) : (
        <a href="https://carto.com/attributions" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-text transition-colors">
          CARTO
        </a>
      )}
    </div>
  )
}