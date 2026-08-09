import { FreeformDialog } from './FreeformDialog'
import { HikerOverlay } from '../../../ui/HikerOverlay'
import type { Saying } from '../../../ui/sayings'
import type { Permit } from './permitsStage.types'
import type { PermitLookupResult } from '../../../../lib/permits'

type PermitsOverlaysProps = {
  lookupLoading: boolean
  zoneDetecting: boolean
  freeformOpen: boolean
  permitSaying: Saying
  partySize: number
  editingPermit: Permit | undefined
  aiPrefill: { confidence: PermitLookupResult['confidence']; verificationNote: string } | undefined
  onCloseDialog: () => void
  onSaveDialog: (p: Permit) => void
}

export function PermitsOverlays({
  lookupLoading, zoneDetecting, freeformOpen, permitSaying, partySize,
  editingPermit, aiPrefill, onCloseDialog, onSaveDialog,
}: PermitsOverlaysProps) {
  return (
    <>
      {lookupLoading && <HikerOverlay label="Looking up permit details…" saying={permitSaying} />}
      {zoneDetecting && <HikerOverlay label="Checking your route against known permit zones…" saying={permitSaying} />}
      {freeformOpen && (
        <FreeformDialog
          onClose={onCloseDialog}
          onSave={onSaveDialog}
          partySize={partySize}
          initialPermit={editingPermit}
          aiPrefill={aiPrefill}
        />
      )}
    </>
  )
}
