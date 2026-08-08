import type { Dispatch, SetStateAction } from 'react'
import { WaypointAddDialog } from '../../../map/WaypointAddDialog'
import { DrawModeStepRail } from './DrawModeStepRail'
import { DrawConfirmTray } from './DrawConfirmTray'
import type { useWaypointPlacement } from './routeMapCard.hooks'
import type { DrawState } from './routeStage.types'
import type { DrawPhaseFlags } from './routeMapCard.types'

type RouteMapCardOverlaysProps = {
  wp: ReturnType<typeof useWaypointPlacement>
  drawState: DrawState
  setDrawState: Dispatch<SetStateAction<DrawState>>
  flags: DrawPhaseFlags
  onCancelDraw: () => void
  onConfirmSegment: () => void
  onResetStartPin: () => void
}

export function RouteMapCardOverlays({ wp, drawState, setDrawState, flags, onCancelDraw, onConfirmSegment, onResetStartPin }: RouteMapCardOverlaysProps) {
  return (
    <>
      {wp.pendingWpLatLon && (
        <WaypointAddDialog
          coords={wp.pendingWpLatLon}
          form={wp.wpForm}
          saving={wp.wpSaving}
          error={wp.wpError}
          onChange={wp.onFormChange}
          onSubmit={wp.handleAddWaypoint}
          onClose={wp.cancelWaypointMode}
        />
      )}

      {flags.isDrawing && (
        <DrawModeStepRail drawState={drawState} flags={flags} onCancel={onCancelDraw} onResetStartPin={onResetStartPin} />
      )}

      {drawState.phase === 'active' && (
        <DrawConfirmTray drawState={drawState} setDrawState={setDrawState} onCancel={onCancelDraw} onConfirm={onConfirmSegment} />
      )}
    </>
  )
}
