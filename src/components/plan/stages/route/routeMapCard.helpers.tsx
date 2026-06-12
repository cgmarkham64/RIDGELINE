import { useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import { type LatLngBoundsExpression } from 'leaflet'
import type { DrawState, SegRow } from './routeStage.types'

const SPLIT_THRESHOLD_PX = 12

function pointToSegDistPx(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

export function FitBounds({ positions, fitKey }: { positions: [number, number][]; fitKey: string }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1)
      map.fitBounds(positions as LatLngBoundsExpression, { padding: [20, 20] })
  // fitKey is the real trigger; positions is read at effect time but intentionally not a dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey])
  return null
}

export function InvalidateSize() {
  const map = useMap()
  useEffect(() => { map.invalidateSize() }, [map])
  return null
}

export type ContextMenuPayload = {
  x: number
  y: number
  segN: number
  edgeIdx: number
  splitPoint: [number, number]
}

export function ContextMenuLayer({
  segments,
  isDrawing,
  canEdit,
  onContextMenu,
  onDismiss,
}: {
  segments: SegRow[]
  isDrawing: boolean
  canEdit: boolean
  onContextMenu: (payload: ContextMenuPayload) => void
  onDismiss: () => void
}) {
  const map = useMap()

  useMapEvents({
    contextmenu(e) {
      e.originalEvent.preventDefault()
      if (isDrawing || !canEdit) return

      const cp = e.containerPoint
      let bestSegN: number | null = null
      let bestEdgeIdx = -1
      let bestDist = SPLIT_THRESHOLD_PX + 1

      for (const seg of segments) {
        if (!seg.path || seg.path.length < 3) continue
        for (let i = 0; i < seg.path.length - 1; i++) {
          const pa = map.latLngToContainerPoint(seg.path[i])
          const pb = map.latLngToContainerPoint(seg.path[i + 1])
          const dist = pointToSegDistPx(cp.x, cp.y, pa.x, pa.y, pb.x, pb.y)
          if (dist < bestDist) {
            bestDist = dist
            bestSegN = seg.n
            bestEdgeIdx = i
          }
        }
      }

      if (bestSegN === null) return

      // Project click onto the nearest edge to get exact split lat/lng
      const seg = segments.find(s => s.n === bestSegN)!
      const pa  = map.latLngToContainerPoint(seg.path![bestEdgeIdx])
      const pb  = map.latLngToContainerPoint(seg.path![bestEdgeIdx + 1])
      const dx = pb.x - pa.x, dy = pb.y - pa.y
      const lenSq = dx * dx + dy * dy
      const t = lenSq > 0
        ? Math.max(0, Math.min(1, ((cp.x - pa.x) * dx + (cp.y - pa.y) * dy) / lenSq))
        : 0
      const proj = map.containerPointToLatLng([pa.x + t * dx, pa.y + t * dy])

      onContextMenu({
        x: cp.x, y: cp.y,
        segN: bestSegN,
        edgeIdx: bestEdgeIdx,
        splitPoint: [proj.lat, proj.lng],
      })
    },
    click() { onDismiss() },
  })

  return null
}

export function WaypointPlaceLayer({
  active,
  onPlace,
}: {
  active: boolean
  onPlace: (lat: number, lon: number) => void
}) {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    if (active) el.style.cursor = 'crosshair'
    return () => { el.style.cursor = '' }
  }, [map, active])
  useMapEvents({
    click(e) { if (active) onPlace(e.latlng.lat, e.latlng.lng) },
  })
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
