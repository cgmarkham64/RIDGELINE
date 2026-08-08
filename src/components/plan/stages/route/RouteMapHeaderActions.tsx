import { IconDownload, IconX, IconPlus } from '../../../icons'

const REMOVE_ICON_SIZE = 12
const ACTION_ICON_SIZE = 9

type RouteMapHeaderActionsProps = {
  hasGpx: boolean
  uploadLabel: string | null
  waypointMode: boolean
  onImportClick: () => void
  onRemoveGpx: () => void
  onToggleWaypointMode: () => void
}

export function RouteMapHeaderActions({
  hasGpx, uploadLabel, waypointMode, onImportClick, onRemoveGpx, onToggleWaypointMode,
}: RouteMapHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {hasGpx && uploadLabel === null && (
        <button
          onClick={onRemoveGpx}
          title="Remove planned route"
          className="p-1 rounded text-text-dim hover:text-red transition-colors cursor-pointer bg-transparent border-none"
        >
          <IconX size={REMOVE_ICON_SIZE} />
        </button>
      )}
      <button
        onClick={onImportClick}
        disabled={uploadLabel !== null}
        className="inline-flex items-center gap-1.5 font-heading text-label font-bold tracking-widest uppercase px-2 py-1 rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <IconDownload size={ACTION_ICON_SIZE} />
        {uploadLabel ?? (hasGpx ? 'Replace' : 'Import .gpx')}
      </button>
      <button
        onClick={onToggleWaypointMode}
        className={`inline-flex items-center gap-1.5 font-heading text-label font-bold tracking-widest uppercase px-2 py-1 rounded border transition-colors cursor-pointer bg-transparent ${
          waypointMode
            ? 'border-amber-border text-amber'
            : 'border-border text-text-dim hover:text-text hover:border-border-mid'
        }`}
      >
        <IconPlus size={ACTION_ICON_SIZE} />
        {waypointMode ? 'Cancel' : 'Waypoint'}
      </button>
    </div>
  )
}
