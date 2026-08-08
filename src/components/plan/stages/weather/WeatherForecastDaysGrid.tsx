import { WeatherForecastDayCard } from './WeatherForecastDayCard'
import type { UnitSystem } from '../../../../lib/units'
import type { PlanWeatherData } from '../../types'

type ForecastDay = NonNullable<PlanWeatherData['cachedForecast']>['days'][number]

type WeatherForecastDaysGridProps = {
  pagedays: ForecastDay[]
  startDate: string
  endDate: string
  sys: UnitSystem
}

export function WeatherForecastDaysGrid({ pagedays, startDate, endDate, sys }: WeatherForecastDaysGridProps) {
  return (
    <div className="grid grid-cols-7 gap-2 p-3">
      {pagedays.map(d => (
        <WeatherForecastDayCard key={d.date} day={d} inTrip={d.date >= startDate && d.date <= endDate} sys={sys} />
      ))}
    </div>
  )
}
