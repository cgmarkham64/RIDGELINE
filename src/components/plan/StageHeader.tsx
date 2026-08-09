import { useState } from 'react'
import type { Stage } from './types'
import type { SaveState } from './PlanWizard'
import { STAGE_TITLES, STAGE_SUBS } from './constants'
import { BackToPlanningDialog } from './BackToPlanningDialog'
import { StageHeaderBreadcrumb } from './StageHeaderBreadcrumb'
import { StageHeaderActions } from './StageHeaderActions'

interface StageHeaderProps {
  stage: Stage
  stageIdx: number
  saveState: SaveState
  onJump: (id: string) => void
  onPrev: () => void
  onNext: () => void
  tripStatus?: string
  isOwner?: boolean
  onStatusChange?: (newStatus: string) => void
}

export function StageHeader({ stage, stageIdx, saveState, onJump, onPrev, onNext, tripStatus, isOwner, onStatusChange }: StageHeaderProps) {
  const [confirmBack, setConfirmBack] = useState(false)

  return (
    <>
      <div className="px-8 pt-5 pb-3.5 border-b border-border bg-surface shrink-0">
        <StageHeaderBreadcrumb stage={stage} saveState={saveState} onJump={onJump} />

        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="font-heading text-[26px] font-extrabold tracking-[-0.005em] text-text">
              {STAGE_TITLES[stage.id]}
            </h1>
            <p className="text-body text-text-mid mt-0.5">{STAGE_SUBS[stage.id]}</p>
          </div>
          <StageHeaderActions
            stageIdx={stageIdx}
            tripStatus={tripStatus}
            isOwner={isOwner}
            onStatusChange={onStatusChange}
            onPrev={onPrev}
            onNext={onNext}
            onBackClick={() => setConfirmBack(true)}
          />
        </div>
      </div>

      {confirmBack && (
        <BackToPlanningDialog
          onCancel={() => setConfirmBack(false)}
          onConfirm={() => { onStatusChange?.('planning'); setConfirmBack(false) }}
        />
      )}
    </>
  )
}
