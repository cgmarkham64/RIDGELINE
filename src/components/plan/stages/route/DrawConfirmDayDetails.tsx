import { WaterExposureSelects } from './WaterExposureSelects'
import { SunTimesFields } from './SunTimesFields'
import { ToughDayToggle } from './ToughDayToggle'
import type { SetActiveDrawState } from './drawConfirmTray.helpers'
import type { DrawState } from './routeStage.types'

type DrawConfirmDayDetailsProps = {
  drawState: Extract<DrawState, { phase: 'active' }>
  setDrawState: SetActiveDrawState
  suggestedHard: boolean
}

export function DrawConfirmDayDetails({ drawState, setDrawState, suggestedHard }: DrawConfirmDayDetailsProps) {
  if (!drawState.showMore) return null

  return (
    <div className="flex flex-col gap-2 pt-1 border-t border-border">
      <WaterExposureSelects drawState={drawState} setDrawState={setDrawState} />
      <SunTimesFields drawState={drawState} setDrawState={setDrawState} />
      <ToughDayToggle drawState={drawState} setDrawState={setDrawState} suggestedHard={suggestedHard} />
    </div>
  )
}
