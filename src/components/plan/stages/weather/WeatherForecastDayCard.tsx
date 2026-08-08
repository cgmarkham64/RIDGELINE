import { WmoConditionIcon } from './WmoConditionIcon'
import { cardTint } from './weatherStage.helpers'
import { fmtTemp, fmtWind } from '../../../../lib/units'
import type { UnitSystem } from '../../../../lib/units'
import type { PlanWeatherData } from '../../types'

const BG_ICON_SIZE = 54
const BG_ICON_OPACITY = 0.13
const CARD_MIN_HEIGHT = '112px'
const IN_TRIP_BORDER = 'rgba(245,158,11,0.55)'
const IN_TRIP_SHADOW = 'inset 0 2px 0 rgba(245,158,11,0.45)'
const PRECIP_WARN_THRESHOLD_PCT = 40
const BOLD_FONT_WEIGHT = 600

type ForecastDay = NonNullable<PlanWeatherData['cachedForecast']>['days'][number]

export function WeatherForecastDayCard({ day, inTrip, sys }: { day: ForecastDay; inTrip: boolean; sys: UnitSystem }) {
  const { bg, border } = cardTint(day.conditionCode)
  const dateObj = new Date(day.date + 'T00:00:00')
  const precipHot = day.precipPct >= PRECIP_WARN_THRESHOLD_PCT

  return (
    <div
      className="relative rounded-lg overflow-hidden flex flex-col gap-2 p-2.5"
      style={{
        background: bg,
        border: `1px solid ${inTrip ? IN_TRIP_BORDER : border}`,
        minHeight: CARD_MIN_HEIGHT,
        boxShadow: inTrip ? IN_TRIP_SHADOW : undefined,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true" style={{ opacity: BG_ICON_OPACITY }}>
        <WmoConditionIcon code={day.conditionCode} size={BG_ICON_SIZE} />
      </div>

      <div className="relative z-10">
        <div className="font-mono text-label tracking-[0.08em] uppercase leading-none mb-0.5" style={{ color: inTrip ? 'var(--amber)' : 'var(--text-dim)' }}>
          {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div className="font-mono text-label text-text-mid leading-none">
          {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center gap-1.5">
        <span className="font-heading text-body-lg font-extrabold text-text leading-none">{fmtTemp(day.highF, sys)}</span>
        <span className="font-mono text-caption text-text-dim leading-none">{fmtTemp(day.lowF, sys)}</span>
      </div>

      <div className="relative z-10 space-y-0.5">
        <div className="font-mono text-label leading-none" style={{ color: precipHot ? 'var(--sky)' : 'var(--text-dim)', fontWeight: precipHot ? BOLD_FONT_WEIGHT : undefined }}>
          {day.precipPct}%
        </div>
        <div className="font-mono text-label text-text-dim leading-none">{fmtWind(day.windMph, sys)} {day.windDir}</div>
      </div>
    </div>
  )
}
