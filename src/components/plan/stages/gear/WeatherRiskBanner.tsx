import { JumpChip } from '../../JumpChip'
import { IconAlertTriangle } from '../../../icons'
import { WEATHER_RISK_STYLE, fmtShortDate } from './gearStage.constants'
import type { PlanWeatherData } from '../../types'

export function WeatherRiskBanner({ risk, factors, onJump }: {
  risk: 'moderate' | 'high'
  factors: PlanWeatherData['departureFactors']
  onJump: (id: string) => void
}) {
  const ws = WEATHER_RISK_STYLE[risk]

  return (
    <div className={`border rounded-lg p-[18px] ${ws.border} ${ws.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-2 ${ws.text}`}>
          <IconAlertTriangle size={13} className={ws.text} />
          <span className="font-mono text-label tracking-[0.16em] uppercase">
            Weather {ws.label} — review your loadout
          </span>
        </div>
        <JumpChip to="weather" onJump={onJump}>View forecast</JumpChip>
      </div>
      {factors && factors.length > 0 && (
        <ul className="flex flex-col gap-1 mt-1">
          {factors.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ws.text} bg-current`} />
              <span className="font-mono text-caption text-text-dim">{fmtShortDate(f.date)}</span>
              <span className="text-body text-text-mid">{f.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}