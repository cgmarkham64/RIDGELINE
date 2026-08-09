import type { GpxTrackEntry } from '../../types'
import type { ImportTarget } from './gpxMapSection.helpers'
import { KabobMenu } from './KabobMenu'

export function GpsTrackRow({
  entry,
  color,
  isImporting,
  isRemoving,
  menuOpen,
  onSetMenu,
  onOpenPicker,
  onRemoveTrack,
}: {
  entry: GpxTrackEntry
  color: string
  isImporting: boolean
  isRemoving: boolean
  menuOpen: boolean
  onSetMenu: (id: string | null) => void
  onOpenPicker: (target: ImportTarget) => void
  onRemoveTrack: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-1.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <svg width="14" height="6" className="shrink-0">
          <line x1="0" y1="3" x2="14" y2="3" stroke={color} strokeWidth="2.5" />
        </svg>
        <span className="font-mono text-label tracking-widest uppercase text-text overflow-hidden text-ellipsis whitespace-nowrap">
          {isImporting ? 'Importing…' : isRemoving ? 'Removing…' : entry.label}
        </span>
      </div>
      <div className="relative shrink-0">
        <button
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 14, lineHeight: 1, padding: '1px 5px', letterSpacing: '0.05em' }}
          disabled={isImporting || isRemoving}
          onClick={(e) => { e.stopPropagation(); onSetMenu(menuOpen ? null : entry.id) }}
        >
          ⋮
        </button>
        {menuOpen && (
          <KabobMenu
            hasTrack
            importLabel="Replace .gpx"
            onImport={() => { onSetMenu(null); onOpenPicker({ type: 'track-replace', id: entry.id }) }}
            onRemove={() => { onSetMenu(null); onRemoveTrack(entry.id) }}
          />
        )}
      </div>
    </div>
  )
}
