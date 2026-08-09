import { shenandoahScore } from '../../../../lib/trailDifficulty'
import { useUnitSystem } from '../../../../hooks/useUnitSystem'
import { DrawConfirmSummary } from './DrawConfirmSummary'
import { ElevSparkline } from './ElevSparkline'
import { DrawConfirmNameFields } from './DrawConfirmNameFields'
import { DrawConfirmDayDetails } from './DrawConfirmDayDetails'
import { DrawConfirmActions } from './DrawConfirmActions'
import { setActiveField } from './drawConfirmTray.helpers'
import type { SetActiveDrawState } from './drawConfirmTray.helpers'
import type { DrawState } from './routeStage.types'

const SUGGESTED_HARD_SCORE_THRESHOLD = 350

type DrawConfirmTrayProps = {
  drawState: Extract<DrawState, { phase: 'active' }>
  setDrawState: SetActiveDrawState
  onCancel: () => void
  onConfirm: () => void
}

export function DrawConfirmTray({ drawState, setDrawState, onCancel, onConfirm }: DrawConfirmTrayProps) {
  const sys = useUnitSystem()
  const score = drawState.result ? shenandoahScore(drawState.result.mi, drawState.result.gain) : null
  const suggestedHard = score !== null && score >= SUGGESTED_HARD_SCORE_THRESHOLD

  return (
    <div className="mt-3 rounded border border-border bg-surface-2 p-3">
      <div className="flex items-center gap-3 mb-2.5">
        <DrawConfirmSummary drawState={drawState} sys={sys} suggestedHard={suggestedHard} />
      </div>

      {drawState.result?.sparkElevs && drawState.result.sparkElevs.length > 1 && (
        <div className="mb-2.5 rounded overflow-hidden" style={{ background: 'var(--surface)' }}>
          <ElevSparkline elevs={drawState.result.sparkElevs} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <DrawConfirmNameFields drawState={drawState} setDrawState={setDrawState} />

        <button
          type="button"
          onClick={() => setActiveField(setDrawState, 'showMore', !drawState.showMore)}
          className="self-start font-mono text-label text-text-dim hover:text-text transition-colors cursor-pointer bg-transparent border-none px-0 flex items-center gap-1"
        >
          {drawState.showMore ? '▴ Less' : '▾ Day details'}
        </button>

        <DrawConfirmDayDetails drawState={drawState} setDrawState={setDrawState} suggestedHard={suggestedHard} />

        <DrawConfirmActions
          editingSeg={!!drawState.editingSeg}
          disabled={!drawState.name.trim() || drawState.loading}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      </div>
    </div>
  )
}
