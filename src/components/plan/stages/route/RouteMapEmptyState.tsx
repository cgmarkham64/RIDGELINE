import { IconMap } from '../../../icons'

const EMPTY_MAP_ICON_SIZE = 28

export function RouteMapEmptyState({ canEdit, onImportClick }: { canEdit: boolean; onImportClick: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2" style={{ background: 'var(--surface-2)' }}>
      <span className="text-text-dim"><IconMap size={EMPTY_MAP_ICON_SIZE} /></span>
      <p className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">No GPX uploaded</p>
      {canEdit ? (
        <button
          onClick={onImportClick}
          className="font-mono text-label text-text-dim underline underline-offset-2 hover:text-text transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          Import a planned route .gpx to see the map
        </button>
      ) : (
        <p className="text-fine text-text-dim">Map available after GPX upload</p>
      )}
    </div>
  )
}
