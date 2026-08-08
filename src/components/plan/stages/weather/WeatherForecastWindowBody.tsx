import { WeatherForecastSunTimes } from './WeatherForecastSunTimes'
import { WeatherForecastNotInWindow } from './WeatherForecastNotInWindow'
import { WeatherForecastPagination } from './WeatherForecastPagination'
import { WeatherForecastDaysGrid } from './WeatherForecastDaysGrid'
import type { UnitSystem } from '../../../../lib/units'
import type { PlanWeatherData } from '../../types'
import type { SunTimes } from './weatherStage.types'

type ForecastDay = NonNullable<PlanWeatherData['cachedForecast']>['days'][number]

type WeatherForecastWindowBodyProps = {
  inWindow: boolean
  midDaySun: SunTimes | undefined
  coordsLng: number | undefined
  startDate: string
  endDate: string
  forecastLoading: boolean
  forecastError: boolean
  hasForecast: boolean
  pagedays: ForecastDay[]
  sys: UnitSystem
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function WeatherForecastWindowBody({
  inWindow, midDaySun, coordsLng, startDate, endDate, forecastLoading, forecastError, hasForecast,
  pagedays, sys, currentPage, totalPages, onPageChange,
}: WeatherForecastWindowBodyProps) {
  if (!inWindow) return <WeatherForecastNotInWindow startDate={startDate} />

  return (
    <>
      {midDaySun && coordsLng != null && <WeatherForecastSunTimes sun={midDaySun} lng={coordsLng} />}
      {forecastLoading && <div className="font-mono text-fine text-text-dim py-6 text-center">Loading forecast…</div>}
      {forecastError   && <div className="font-mono text-fine text-red py-6 text-center">Failed to load forecast.</div>}
      {hasForecast && (
        <>
          <WeatherForecastPagination pagedays={pagedays} currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
          <WeatherForecastDaysGrid pagedays={pagedays} startDate={startDate} endDate={endDate} sys={sys} />
        </>
      )}
    </>
  )
}
