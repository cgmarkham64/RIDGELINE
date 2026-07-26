/**
 * IpwZonesOverlay — permit-zone layer for RIDGELINE's react-leaflet maps.
 * Drop inside any <MapContainer> (e.g. RouteMapCard).
 */
import { useMemo } from 'react'
import { GeoJSON, Tooltip } from 'react-leaflet'
import type { PathOptions } from 'leaflet'
import type { ZoneCollection, ZoneFeature } from '../../../../lib/zoneGeometry'

const FILL = {
  closed: '#ede98a',       // Four Lakes — no camping in season
  campfiresOk: '#8fc7e8',  // west-of-Divide zones
  noCampfires: '#d9a6e8',
} as const

function fillFor(f: ZoneFeature): string {
  const p = f.properties
  if (!p.camping_allowed) return FILL.closed
  return p.campfires_allowed ? FILL.campfiresOk : FILL.noCampfires
}

export interface IpwZonesOverlayProps {
  zones: ZoneCollection
  /** zone ids to emphasize (e.g. zones where the plan has camps) */
  highlightIds?: string[]
  opacity?: number
  onZoneClick?: (zone: ZoneFeature) => void
}

export function IpwZonesOverlay({
  zones,
  highlightIds = [],
  opacity = 0.35,
  onZoneClick,
}: IpwZonesOverlayProps) {
  const hot = useMemo(() => new Set(highlightIds), [highlightIds])

  const style = (f?: ZoneFeature): PathOptions => {
    if (!f) return {}
    const emphasized = hot.has(f.properties.id)
    return {
      color: emphasized ? '#2f2a1e' : '#4a4438',
      weight: emphasized ? 2.5 : 1.2,
      fillColor: fillFor(f),
      fillOpacity: emphasized ? Math.min(opacity + 0.25, 0.75) : opacity,
    }
  }

  return (
    <GeoJSON
      data={zones}
      style={style as never}
      onEachFeature={(feature, layer) => {
        const f = feature as ZoneFeature
        layer.bindTooltip(f.properties.name, { sticky: true, direction: 'top' })
        if (onZoneClick) layer.on('click', () => onZoneClick(f))
        layer.on('mouseover', () => (layer as never as { setStyle: (s: PathOptions) => void }).setStyle({ weight: 2.5 }))
        layer.on('mouseout', () => (layer as never as { setStyle: (s: PathOptions) => void }).setStyle(style(f)))
      }}
    >
      <Tooltip sticky />
    </GeoJSON>
  )
}