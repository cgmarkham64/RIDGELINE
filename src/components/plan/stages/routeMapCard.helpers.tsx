import { useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import { type LatLngBoundsExpression } from 'leaflet'
import type { DrawState } from './routeStage.types'

export function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1)
      map.fitBounds(positions as LatLngBoundsExpression, { padding: [20, 20] })
  }, [map, positions])
  return null
}

export function InvalidateSize() {
  const map = useMap()
  useEffect(() => { map.invalidateSize() }, [map])
  return null
}

export function DrawInteractionLayer({
  drawState,
  onMapClick,
}: {
  drawState: DrawState
  onMapClick: (lat: number, lng: number) => void
}) {
  const map = useMap()
  const active = drawState.phase === 'placing-start' || drawState.phase === 'placing-end'

  useEffect(() => {
    const container = map.getContainer()
    container.style.cursor = active ? 'crosshair' : ''
    return () => { container.style.cursor = '' }
  }, [map, active])

  useMapEvents({
    click(e) {
      if (active) onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })

  return null
}
