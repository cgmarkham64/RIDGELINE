import { useState } from 'react'
import type { StageBodyProps } from '../../types'
import { useAuthStore } from '../../../../store/auth'
import { DEFAULT_WEATHER_TOLERANCES } from '../../../../types/auth'
import { useUnitSystem } from '../../../../hooks/useUnitSystem'
import { inForecastWindow, RISK_STYLE } from './weatherStage.helpers'
import { useWeatherTripDates, useWeatherFetching, useWeatherChecklist, useWeatherDerived, useForecastPaging, useToggleWeatherField } from './weatherStage.hooks'
import { WeatherMissingDatesGate } from './WeatherMissingDatesGate'
import { WeatherLocationBanner } from './WeatherLocationBanner'
import { WeatherHistoricalCard } from './WeatherHistoricalCard'
import { WeatherForecastCard } from './WeatherForecastCard'
import { WeatherDepartureCard } from './WeatherDepartureCard'
import { WeatherNotesCard } from './WeatherNotesCard'
import { WeatherRightRail } from './WeatherRightRail'

export function WeatherStage({ plan, onChange, onProgress, trip, canEdit = true, onEditTrip, onJump }: StageBodyProps) {
  const { user } = useAuthStore()
  const tolerances = user?.preferences?.weatherTolerances ?? DEFAULT_WEATHER_TOLERANCES
  const sys = useUnitSystem()
  const dates = useWeatherTripDates(trip)
  const { startDate, endDate, hasDates } = dates

  const { wd, setWd, geoError, climateError, forecastError, coordsLat, coordsLng, geoLoading, climateLoading, forecastLoading } =
    useWeatherFetching(plan, trip, onChange, dates, tolerances)
  const checklist = useWeatherChecklist(wd, onProgress)
  const { elevFt, computedRisk, forecastSunMap, tripWeekPage } = useWeatherDerived(wd, trip, dates, tolerances, coordsLat, coordsLng)

  const [weekPage, setWeekPage] = useState<number | null>(null)
  const toggle = useToggleWeatherField(canEdit, setWd)
  const { currentPage, totalPages, pagedays, midDaySun, hasForecast } = useForecastPaging(wd.cachedForecast, weekPage, tripWeekPage, forecastSunMap)

  if (!hasDates) return <WeatherMissingDatesGate onEditTrip={onEditTrip} />

  const inWindow  = inForecastWindow(startDate)
  const risk      = wd.departureRisk
  const riskStyle = risk ? RISK_STYLE[risk] : null

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4.5">
          <WeatherLocationBanner
            location={trip!.location || ''} startDate={startDate} endDate={endDate}
            coordsLat={coordsLat} coordsLng={coordsLng} geoLoading={geoLoading} geoError={geoError}
          />

          <WeatherHistoricalCard
            startDate={startDate} canEdit={canEdit} historicalReviewed={wd.historicalReviewed}
            onToggleReviewed={() => toggle('historicalReviewed')} climateLoading={climateLoading}
            climateError={climateError} climate={wd.cachedClimate} sys={sys}
          />

          <WeatherForecastCard
            inWindow={inWindow} canEdit={canEdit} forecastChecked={wd.forecastChecked}
            onToggleChecked={() => toggle('forecastChecked')} midDaySun={midDaySun} coordsLng={coordsLng}
            startDate={startDate} forecastLoading={forecastLoading} forecastError={forecastError}
            pagedays={pagedays} hasForecast={hasForecast} endDate={endDate}
            sys={sys} currentPage={currentPage} totalPages={totalPages} onPageChange={setWeekPage}
          />

          <WeatherDepartureCard risk={risk} riskStyle={riskStyle} factors={computedRisk?.factors} elevFt={elevFt} />

          <WeatherNotesCard notes={wd.notes} canEdit={canEdit} onChange={notes => setWd(prev => ({ ...prev, notes }))} />
        </div>

        <WeatherRightRail
          checklist={checklist} inWindow={inWindow} startDate={startDate}
          forecastChecked={wd.forecastChecked} risk={risk} riskStyle={riskStyle} onJump={onJump}
        />
      </div>
    </div>
  )
}
