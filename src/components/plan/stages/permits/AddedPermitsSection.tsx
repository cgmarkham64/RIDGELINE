import { PermitCard } from './PermitCard'
import { ZoneDetectionStatus } from './ZoneDetectionStatus'
import type { Permit } from './permitsStage.types'

type AddedPermitsSectionProps = {
  permits: Permit[]
  canEdit: boolean
  partySize: number
  onRemove: (id: string) => void
  onEditPermit: (id: string) => void
  onUpdatePermit: (id: string, key: string, value: string) => void
  permitFree: boolean
  onMarkPermitFree: () => void
  zoneDetecting: boolean
  zoneDetectError: string | null
  zoneDetectedAt: string | undefined
  onRedetectZones: () => void
}

function EmptyState({ canEdit, permitFree, onMarkPermitFree }: { canEdit: boolean; permitFree: boolean; onMarkPermitFree: () => void }) {
  return (
    <div className="border border-dashed border-border rounded-lg overflow-hidden">
      <div className="px-6 py-5 text-center text-body-sm text-text-dim">No permits added yet.</div>
      {canEdit && !permitFree && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-dashed border-border bg-pine-dim">
          <span className="text-fine text-text-mid">Trip is permit-free?</span>
          <button
            onClick={onMarkPermitFree}
            className="font-mono text-label tracking-[0.12em] uppercase text-pine hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            Mark as permit-free →
          </button>
        </div>
      )}
    </div>
  )
}

export function AddedPermitsSection({
  permits, canEdit, partySize, onRemove, onEditPermit, onUpdatePermit, permitFree, onMarkPermitFree,
  zoneDetecting, zoneDetectError, zoneDetectedAt, onRedetectZones,
}: AddedPermitsSectionProps) {
  // Only surface the zone-detection status/control once it's actually relevant to this
  // trip — most trips aren't near a wilderness area with zone geometry, and detection
  // finding nothing shouldn't clutter the UI with a control that never does anything.
  const hasZoneDetection = permits.some(p => p.autoDetected)

  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">
          On this trip{permits.length > 0 ? ` (${permits.length})` : ''}
        </div>
        {permits.length === 0 && <span className="font-mono text-label text-text-dim">nothing added yet</span>}
      </div>

      <ZoneDetectionStatus
        show={hasZoneDetection || !!zoneDetectError}
        zoneDetecting={zoneDetecting}
        zoneDetectError={zoneDetectError}
        zoneDetectedAt={zoneDetectedAt}
        canEdit={canEdit}
        onRedetectZones={onRedetectZones}
      />

      {permits.length > 0 ? (
        <div className="flex flex-col gap-3">
          {permits.map(p => (
            <PermitCard
              key={p.id}
              permit={p}
              onRemove={() => onRemove(p.id)}
              onEdit={() => onEditPermit(p.id)}
              onUpdatePermit={(key, val) => onUpdatePermit(p.id, key, val)}
              canEdit={canEdit}
              partySize={partySize}
            />
          ))}
        </div>
      ) : (
        <EmptyState canEdit={canEdit} permitFree={permitFree} onMarkPermitFree={onMarkPermitFree} />
      )}
    </section>
  )
}
