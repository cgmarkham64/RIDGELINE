import { IconAlertTriangle } from '../../../icons'

type ZoneDetectionStatusProps = {
  show: boolean
  zoneDetecting: boolean
  zoneDetectError: string | null
  zoneDetectedAt: string | undefined
  canEdit: boolean
  onRedetectZones: () => void
}

function statusLabel(zoneDetecting: boolean, zoneDetectedAt: string | undefined): string {
  if (zoneDetecting) return 'Checking route against permit zones…'
  if (!zoneDetectedAt) return ''
  const when = new Date(zoneDetectedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  return `Zone permits checked ${when}`
}

export function ZoneDetectionStatus({ show, zoneDetecting, zoneDetectError, zoneDetectedAt, canEdit, onRedetectZones }: ZoneDetectionStatusProps) {
  return (
    <>
      {show && (
        <div className="flex items-center justify-between mb-2.5 -mt-1">
          <span className="font-mono text-label text-text-dim">{statusLabel(zoneDetecting, zoneDetectedAt)}</span>
          {canEdit && (
            <button
              onClick={onRedetectZones}
              disabled={zoneDetecting}
              className="inline-flex items-center gap-1 font-mono text-label tracking-[0.06em] uppercase text-text-dim hover:text-amber transition-colors bg-transparent border-none cursor-pointer p-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Re-detect zones
            </button>
          )}
        </div>
      )}
      {zoneDetectError && (
        <div className="flex items-start gap-2 px-3 py-2 mb-2.5 bg-amber-dim border border-amber-border rounded text-fine text-text-mid">
          <IconAlertTriangle size={13} className="shrink-0 mt-px text-amber" />
          <span>{zoneDetectError}</span>
        </div>
      )}
    </>
  )
}
