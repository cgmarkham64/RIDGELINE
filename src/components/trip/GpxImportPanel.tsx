import type { GpxTrack, GpxTrackEntry } from '../../types'
import type { ImportTarget } from './gpxMapSection.helpers'
import { PlannedRouteRow } from './PlannedRouteRow'
import { GpsTracksSection } from './GpsTracksSection'

export function GpxImportPanel({
  gpxPlanned,
  gpxTracks,
  importing,
  removing,
  openMenu,
  onSetMenu,
  onOpenPicker,
  onRemovePlanned,
  onRemoveTrack,
}: {
  gpxPlanned: GpxTrack | undefined | null
  gpxTracks: GpxTrackEntry[]
  importing: string | null
  removing: string | null
  openMenu: string | null
  onSetMenu: (id: string | null) => void
  onOpenPicker: (target: ImportTarget) => void
  onRemovePlanned: () => void
  onRemoveTrack: (id: string) => void
}) {
  return (
    <div className="border border-border rounded-md px-3.5 py-2.5 bg-surface mb-3">
      <PlannedRouteRow
        gpxPlanned={gpxPlanned}
        importing={importing}
        removing={removing}
        openMenu={openMenu}
        onSetMenu={onSetMenu}
        onOpenPicker={onOpenPicker}
        onRemovePlanned={onRemovePlanned}
      />

      <div className="border-t border-border my-2.5" />

      <GpsTracksSection
        gpxTracks={gpxTracks}
        importing={importing}
        removing={removing}
        openMenu={openMenu}
        onSetMenu={onSetMenu}
        onOpenPicker={onOpenPicker}
        onRemoveTrack={onRemoveTrack}
      />
    </div>
  )
}
