import { ZonesOverlay } from './ZonesOverlay'
import { ZONE_SETS } from './routeMapCard.hooks'
import type { ZoneOverlayFlags } from './routeMapCard.types'

export function RouteMapZoneOverlays({ showIpwOverlay, showEnchantmentsOverlay, showMbswOverlay, zoneHighlightIds }: ZoneOverlayFlags) {
  return (
    <>
      {showIpwOverlay && <ZonesOverlay zones={ZONE_SETS.IPW_ZONES} highlightIds={zoneHighlightIds} />}
      {showEnchantmentsOverlay && <ZonesOverlay zones={ZONE_SETS.ENCHANTMENTS_ZONES} highlightIds={zoneHighlightIds} />}
      {showMbswOverlay && <ZonesOverlay zones={ZONE_SETS.MBSW_ZONES} highlightIds={zoneHighlightIds} />}
    </>
  )
}
