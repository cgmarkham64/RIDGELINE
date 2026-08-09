import { useMemo } from 'react'
import { PermitsMainPanel } from './PermitsMainPanel'
import { PermitsRightRail } from './PermitsRightRail'
import { PermitsOverlays } from './PermitsOverlays'
import { randomPermitSaying } from '../../../ui/sayings'
import { usePermitsStageState, computeLocationLabel } from './permitsStage.hooks'
import type { StageBodyProps } from '../../types'

export function PermitsStage({ plan, onChange, onProgress, trip, canEdit = true }: StageBodyProps) {
  const permitSaying = useMemo(() => randomPermitSaying(), [])
  const { partySize, s, scanDates, scan, zoneDetection, dialog, lookup, actions, checklist } =
    usePermitsStageState(plan, onChange, onProgress, trip)

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 pb-20">
        <div className="grid gap-7 grid-cols-[1fr_360px]">
          <PermitsMainPanel
            locationLabel={computeLocationLabel(trip)}
            permits={s.permits} links={s.links} onRemove={actions.remove} onEditPermit={dialog.openEdit}
            onAddFreeform={dialog.openAdd} onUpdatePermit={actions.updatePermitField} canEdit={canEdit} partySize={partySize}
            scanning={scan.scanning} scanError={scan.scanError} lastScanned={s.lastScanned} onRescan={scan.runScan}
            permitFree={s.permitFree} onMarkPermitFree={() => s.setPermitFree(true)}
            onSearch={lookup.handleSearch} lookupLoading={lookup.lookupLoading} lookupError={lookup.lookupError}
            canLookup={!!trip?._id} zoneDetecting={zoneDetection.zoneDetecting} zoneDetectError={zoneDetection.zoneDetectError}
            zoneDetectedAt={s.zoneDetectedAt} onRedetectZones={() => zoneDetection.runZoneDetection(true)}
          />

          <PermitsRightRail
            trip={trip} canEdit={canEdit} permitFree={s.permitFree}
            item1={checklist.item1} item2={checklist.item2} item3={checklist.item3}
            doneCount={checklist.doneCount} progress={checklist.progress}
            onUnmarkPermitFree={() => s.setPermitFree(false)}
            onTogglePartyConfirmed={() => s.setPartyConfirmed(v => !v)}
            onToggleBackupPlanned={() => s.setBackupPlanned(v => !v)}
            partyConfirmed={s.partyConfirmed} onConfirmParty={() => s.setPartyConfirmed(true)}
            criticalDates={s.criticalDates} scanDates={scanDates}
            onAddCriticalDate={d => s.setCriticalDates(prev => [...prev, d])}
            onRemoveCriticalDate={actions.removeCriticalDate}
          />
        </div>
      </div>

      <PermitsOverlays
        lookupLoading={lookup.lookupLoading} zoneDetecting={zoneDetection.zoneDetecting} freeformOpen={dialog.freeformOpen}
        permitSaying={permitSaying} partySize={partySize}
        editingPermit={dialog.editingPermit} aiPrefill={dialog.aiPrefill}
        onCloseDialog={dialog.closeDialog} onSaveDialog={dialog.handleDialogSave}
      />
    </>
  )
}
