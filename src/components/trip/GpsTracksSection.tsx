import type { GpxTrackEntry } from '../../types'
import { trackColor, type ImportTarget } from './gpxMapSection.helpers'
import { GpsTrackRow } from './GpsTrackRow'

const SECTION_MARGIN_PX = 8

export function GpsTracksSection({
  gpxTracks,
  importing,
  removing,
  openMenu,
  onSetMenu,
  onOpenPicker,
  onRemoveTrack,
}: {
  gpxTracks: GpxTrackEntry[]
  importing: string | null
  removing: string | null
  openMenu: string | null
  onSetMenu: (id: string | null) => void
  onOpenPicker: (target: ImportTarget) => void
  onRemoveTrack: (id: string) => void
}) {
  return (
    <div>
      <div
        className="flex items-center justify-between gap-2"
        style={{ marginBottom: gpxTracks.length > 0 ? SECTION_MARGIN_PX : 0 }}
      >
        <div className="font-heading text-body-sm font-bold text-text">GPS Tracks</div>
        <button
          className="btn btn-ghost btn-sm shrink-0"
          style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px' }}
          disabled={importing === 'new-track'}
          onClick={() => onOpenPicker({ type: 'track-new' })}
        >
          {importing === 'new-track' ? 'Importing…' : '+ Add'}
        </button>
      </div>

      {gpxTracks.length === 0 ? (
        <div className="font-mono text-label tracking-widest uppercase text-text-dim">Import after each day</div>
      ) : (
        <div className="flex flex-col gap-1.25">
          {gpxTracks.map((entry, i) => (
            <GpsTrackRow
              key={entry.id}
              entry={entry}
              color={trackColor(i)}
              isImporting={importing === entry.id}
              isRemoving={removing === entry.id}
              menuOpen={openMenu === entry.id}
              onSetMenu={onSetMenu}
              onOpenPicker={onOpenPicker}
              onRemoveTrack={onRemoveTrack}
            />
          ))}
        </div>
      )}
    </div>
  )
}
