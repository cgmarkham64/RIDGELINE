import { DetectionBanner } from './DetectionBanner'
import { PermitResourceLinks } from './PermitResourceLinks'
import { AddPermitForm } from './AddPermitForm'
import { AddedPermitsSection } from './AddedPermitsSection'
import type { Permit } from './permitsStage.types'
import type { PermitLink } from '../../types'

type PermitsListViewProps = {
  permits: Permit[]
  links: PermitLink[]
  onRemove: (id: string) => void
  onEditPermit: (id: string) => void
  onAddFreeform: () => void
  onUpdatePermit: (id: string, key: string, value: string) => void
  canEdit: boolean
  partySize: number
  scanning: boolean
  scanError: string | null
  lastScanned: string | undefined
  onRescan: () => void
  permitFree: boolean
  onMarkPermitFree: () => void
  onSearch: (name: string) => void
  lookupLoading: boolean
  lookupError: string | null
  canLookup: boolean
  zoneDetecting: boolean
  zoneDetectError: string | null
  zoneDetectedAt: string | undefined
  onRedetectZones: () => void
}

export function PermitsListView({
  permits, links, onRemove, onEditPermit, onAddFreeform, onUpdatePermit,
  canEdit, partySize, scanning, scanError, lastScanned, onRescan,
  permitFree, onMarkPermitFree,
  onSearch, lookupLoading, lookupError, canLookup,
  zoneDetecting, zoneDetectError, zoneDetectedAt, onRedetectZones,
}: PermitsListViewProps) {
  return (
    <div className="flex flex-col gap-[22px]">
      <DetectionBanner
        scanning={scanning} scanError={scanError} linksCount={links.length} lastScanned={lastScanned}
        permitFree={permitFree} canEdit={canEdit} onRescan={onRescan} onMarkPermitFree={onMarkPermitFree}
      />

      <PermitResourceLinks links={links} canEdit={canEdit} canLookup={canLookup} lookupLoading={lookupLoading} onSearch={onSearch} />

      {canEdit && (
        <AddPermitForm onSearch={onSearch} lookupLoading={lookupLoading} lookupError={lookupError} canLookup={canLookup} onAddFreeform={onAddFreeform} />
      )}

      <AddedPermitsSection
        permits={permits} canEdit={canEdit} partySize={partySize}
        onRemove={onRemove} onEditPermit={onEditPermit} onUpdatePermit={onUpdatePermit}
        permitFree={permitFree} onMarkPermitFree={onMarkPermitFree}
        zoneDetecting={zoneDetecting} zoneDetectError={zoneDetectError} zoneDetectedAt={zoneDetectedAt} onRedetectZones={onRedetectZones}
      />
    </div>
  )
}
