import type { GpxTrack } from '../../types'
import { PLANNED_COLOR, type ImportTarget } from './gpxMapSection.helpers'
import { KabobMenu } from './KabobMenu'

export function PlannedRouteRow({
  gpxPlanned,
  importing,
  removing,
  openMenu,
  onSetMenu,
  onOpenPicker,
  onRemovePlanned,
}: {
  gpxPlanned: GpxTrack | undefined | null
  importing: string | null
  removing: string | null
  openMenu: string | null
  onSetMenu: (id: string | null) => void
  onOpenPicker: (target: ImportTarget) => void
  onRemovePlanned: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <svg width="18" height="6" className="shrink-0">
          <line x1="0" y1="3" x2="18" y2="3" stroke={PLANNED_COLOR} strokeWidth="2.5" strokeDasharray="5 3" />
        </svg>
        <div className="min-w-0">
          <div className="font-heading text-body-sm font-bold text-text whitespace-nowrap">Planned Route</div>
          <div className="font-mono text-label tracking-widest uppercase text-text-dim">
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
  )
}
