import { forecastTargetDate, FORECAST_WINDOW_DAYS, daysUntil } from './weatherStage.helpers'

export function WeatherForecastNotInWindow({ startDate }: { startDate: string }) {
  const daysAway = daysUntil(startDate)

  return (
    <div className="px-4 py-6 text-center">
      <div className="font-heading text-[15px] font-bold text-text mb-1">Not in forecast range yet.</div>
      <div className="font-mono text-fine text-text-mid">
        Check back <span className="text-amber font-semibold">{forecastTargetDate(startDate)}</span>
        {daysAway > FORECAST_WINDOW_DAYS ? ` · ${daysAway - FORECAST_WINDOW_DAYS} days from now` : ''}
      </div>
    </div>
  )
}
