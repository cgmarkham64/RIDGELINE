import { CheckItem } from '../../CheckItem'
import { ProgressBar } from '../../ProgressBar'
import { forecastTargetDate } from './weatherStage.helpers'

const PERCENT_MULTIPLIER = 100
const FORECAST_GATED_INDEX = 1

type ChecklistRow = { text: string; done: boolean }

type WeatherChecklistPanelProps = {
  checklist: ChecklistRow[]
  inWindow: boolean
  startDate: string
}

export function WeatherChecklistPanel({ checklist, inWindow, startDate }: WeatherChecklistPanelProps) {
  const doneCount = checklist.filter(c => c.done).length

  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
      {checklist.map((c, idx) => {
        const gated = idx === FORECAST_GATED_INDEX && !inWindow
        return (
          <div key={c.text} title={gated ? `Forecast available ${forecastTargetDate(startDate)}` : undefined} className={gated ? 'opacity-40' : ''}>
            <CheckItem text={c.text} done={c.done} />
          </div>
        )
      })}
      <div className="h-px bg-border my-3" />
      <ProgressBar value={(doneCount / checklist.length) * PERCENT_MULTIPLIER} tone="pine" />
      <div className="font-mono text-label text-text-dim text-center mt-1.5">{doneCount} of {checklist.length}</div>
    </div>
  )
}
