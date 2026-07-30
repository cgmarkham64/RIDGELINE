/**
 * ZonesOverlay — permit-zone layer for RIDGELINE's react-leaflet maps.
 * Drop inside any <MapContainer> (e.g. RouteMapCard). Works with any wilderness
 * area's ZoneCollection (Indian Peaks, Enchantments, ...).
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

/** A `permit_required: false` feature is a partial-coverage collection's outer
 *  boundary (e.g. MBSW wilderness) — informational only, so it renders as a thin
 *  outline rather than competing visually with the small bookable zones inside it. */
function isBoundaryOnly(f: ZoneFeature): boolean {
  return f.properties.permit_required === false
}

export interface ZonesOverlayProps {
  zones: ZoneCollection
  /** zone ids to emphasize (e.g. zones where the plan has camps) */
  highlightIds?: string[]
  opacity?: number
  onZoneClick?: (zone: ZoneFeature) => void
}

export function ZonesOverlay({
  zones,
  highlightIds = [],
  opacity = 0.35,
  onZoneClick,
}: ZonesOverlayProps) {
  const hot = useMemo(() => new Set(highlightIds), [highlightIds])

  const style = (f?: ZoneFeature): PathOptions => {
    if (!f) return {}
    if (isBoundaryOnly(f)) {
      return { color: '#7a7261', weight: 1, dashArray: '4 4', fillOpacity: 0 }
    }
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