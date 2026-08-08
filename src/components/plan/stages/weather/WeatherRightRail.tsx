import { WeatherChecklistPanel } from './WeatherChecklistPanel'
import { WeatherReminderBanner } from './WeatherReminderBanner'
import { WeatherGearReviewBanner } from './WeatherGearReviewBanner'
import type { RiskLevel, RiskStyle } from './weatherStage.types'

type ChecklistRow = { text: string; done: boolean }

type WeatherRightRailProps = {
  checklist: ChecklistRow[]
  inWindow: boolean
  startDate: string
  forecastChecked: boolean
  risk: RiskLevel | null
  riskStyle: RiskStyle | null
  onJump?: (stage: string) => void
}

export function WeatherRightRail({ checklist, inWindow, startDate, forecastChecked, risk, riskStyle, onJump }: WeatherRightRailProps) {
  return (
    <aside className="flex flex-col gap-3.5">
      <WeatherChecklistPanel checklist={checklist} inWindow={inWindow} startDate={startDate} />
      {forecastChecked && <WeatherReminderBanner />}
      {risk && risk !== 'low' && riskStyle && <WeatherGearReviewBanner riskStyle={riskStyle} onJump={onJump} />}
    </aside>
  )
}
