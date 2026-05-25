import type { GpxTrack, GpxTrackEntry } from '../../types'
import { PLANNED_COLOR, trackColor, type ImportTarget } from './gpxMapSection.helpers'

function KabobMenu({
  hasTrack,
  importLabel,
  onImport,
  onRemove,
}: {
  hasTrack: boolean
  importLabel: string
  onImport: () => void
  onRemove: () => void
}) {
  return (
    <div
      className="absolute right-0 top-[calc(100%+4px)] bg-surface border border-border rounded-md z-10 min-w-37 overflow-hidden"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="block w-full text-left px-3 py-2 text-[11px] font-mono tracking-[0.06em] uppercase bg-transparent border-0 cursor-pointer text-text"
        onClick={onImport}
      >
        {importLabel}
      </button>
      {hasTrack && (
        <button
          className="block w-full text-left px-3 py-2 text-[11px] font-mono tracking-[0.06em] uppercase bg-transparent border-0 cursor-pointer text-red border-t border-border"
          onClick={onRemove}
        >
          Remove
        </button>
      )}
    </div>
  )
}

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
      {/* Planned Route row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <svg width="18" height="6" className="shrink-0">
            <line x1="0" y1="3" x2="18" y2="3" stroke={PLANNED_COLOR} strokeWidth="2.5" strokeDasharray="5 3" />
          </svg>
          <div className="min-w-0">
            <div className="font-heading text-[12px] font-bold text-text whitespace-nowrap">Planned Route</div>
            <div className="font-mono text-[9px] tracking-widest uppercase text-text-dim">
              {importing === 'planned'
                ? 'Importing…'
                : removing === 'planned'
                  ? 'Removing…'
                  : gpxPlanned
                    ? 'Imported'
                    : 'Import before the trip'}
            </div>
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 16, lineHeight: 1, padding: '2px 7px', letterSpacing: '0.05em' }}
            disabled={importing === 'planned' || removing === 'planned'}
            onClick={(e) => { e.stopPropagation(); onSetMenu(openMenu === 'planned' ? null : 'planned') }}
          >
            ⋮
          </button>
          {openMenu === 'planned' && (
            <KabobMenu
              hasTrack={!!gpxPlanned}
              importLabel={gpxPlanned ? 'Replace .gpx' : 'Import .gpx'}
              onImport={() => { onSetMenu(null); onOpenPicker({ type: 'planned' }) }}
              onRemove={() => { onSetMenu(null); onRemovePlanned() }}
            />
          )}
        </div>
      </div>

      <div className="border-t border-border my-2.5" />

      {/* GPS Tracks section */}
      <div>
        <div
          className="flex items-center justify-between gap-2"
          style={{ marginBottom: gpxTracks.length > 0 ? 8 : 0 }}
        >
          <div className="font-heading text-[12px] font-bold text-text">GPS Tracks</div>
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
          <div className="font-mono text-[9px] tracking-widest uppercase text-text-dim">Import after each day</div>
        ) : (
          <div className="flex flex-col gap-1.25">
            {gpxTracks.map((entry, i) => {
              const color = trackColor(i)
              const isImporting = importing === entry.id
              const isRemoving = removing === entry.id
              const menuOpen = openMenu === entry.id
              return (
                <div key={entry.id} className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <svg width="14" height="6" className="shrink-0">
                      <line x1="0" y1="3" x2="14" y2="3" stroke={color} strokeWidth="2.5" />
                    </svg>
                    <span className="font-mono text-[9px] tracking-widest uppercase text-text overflow-hidden text-ellipsis whitespace-nowrap">
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
            })}
          </div>
        )}
      </div>
    </div>
  )
}