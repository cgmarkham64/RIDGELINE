import { useEffect, useMemo, useRef, useState } from 'react'
import type { StageBodyProps, PlanWeatherData } from '../../types'
import { nominatimGeocode } from '../../../../lib/geocode'
import { tripSunRows } from '../../../../lib/sun'
import type { WeatherTolerances } from '../../../../types/auth'
import {
  isGeocodeCacheValid, isClimateCacheValid, isForecastCacheValid,
  calcDepartureRisk, avgElevationFt, inForecastWindow,
  fetchClimateNormals, fetchForecast,
} from './weatherStage.helpers'
import type { SunTimes } from './weatherStage.types'

const ISO_DATE_PREFIX_LEN = 10
const DAYS_PER_PAGE = 7

export const INITIAL_WEATHER: PlanWeatherData = {
  historicalReviewed: false,
  forecastChecked: false,
  gearAdjusted: false,
  departureRisk: null,
  notes: '',
}

function parseIsoDatePrefix(date: string | undefined): string {
  return date?.slice(0, ISO_DATE_PREFIX_LEN) ?? ''
}

export function useWeatherTripDates(trip: StageBodyProps['trip']) {
  const tripLoc = trip?.location ?? ''
  const startDate = parseIsoDatePrefix(trip?.startDate)
  const endDate = parseIsoDatePrefix(trip?.endDate)
  const hasDates = !!startDate && !!endDate
  const tripMonth = hasDates ? new Date(startDate + 'T00:00:00').getMonth() + 1 : null
  return { tripLoc, startDate, endDate, hasDates, tripMonth }
}

function isStale(forLocation: string | undefined, tripLoc: string): boolean {
  return forLocation !== tripLoc
}

function computeGeoLoading(wd: PlanWeatherData, tripLoc: string, geoError: boolean): boolean {
  return !!tripLoc && (!wd.cachedCoords || isStale(wd.cachedCoords.forLocation, tripLoc)) && !geoError
}

function computeClimateLoading(wd: PlanWeatherData, tripLoc: string, tripMonth: number | null, coordsLat: number | undefined, climateError: boolean): boolean {
  return !!coordsLat && !!tripMonth && (!wd.cachedClimate || isStale(wd.cachedClimate.forLocation, tripLoc)) && !climateError
}

function computeForecastLoading(wd: PlanWeatherData, tripLoc: string, startDate: string, coordsLat: number | undefined, forecastError: boolean): boolean {
  return !!coordsLat && inForecastWindow(startDate) && (!wd.cachedForecast || isStale(wd.cachedForecast.forLocation, tripLoc)) && !forecastError
}

function weatherLoadingFlags(
  wd: PlanWeatherData, tripLoc: string, tripMonth: number | null, startDate: string, coordsLat: number | undefined,
  errors: { geoError: boolean; climateError: boolean; forecastError: boolean },
) {
  return {
    geoLoading: computeGeoLoading(wd, tripLoc, errors.geoError),
    climateLoading: computeClimateLoading(wd, tripLoc, tripMonth, coordsLat, errors.climateError),
    forecastLoading: computeForecastLoading(wd, tripLoc, startDate, coordsLat, errors.forecastError),
  }
}

function initialWeatherState(plan: StageBodyProps['plan'], startDate: string, endDate: string, tolerances: WeatherTolerances, trip: StageBodyProps['trip']): PlanWeatherData {
  const base = plan?.weather ?? INITIAL_WEATHER
  if (base.cachedForecast && base.departureRisk === null && startDate && endDate) {
    const { overall, factors } = calcDepartureRisk(
      base.cachedForecast.days, startDate, endDate,
      trip ? avgElevationFt(trip) : null, base.cachedForecast.elevationFt, tolerances,
    )
    return { ...base, departureRisk: overall, departureFactors: factors }
  }
  return base
}

function useGeocodeEffect(tripLoc: string, wdRef: React.RefObject<PlanWeatherData>, setWd: React.Dispatch<React.SetStateAction<PlanWeatherData>>, setGeoError: (v: boolean) => void) {
  useEffect(() => {
    if (!tripLoc) return
    if (isGeocodeCacheValid(wdRef.current.cachedCoords, tripLoc)) return
    let cancelled = false
    nominatimGeocode(tripLoc)
      .then(result => {
        if (cancelled) return
        if (!result) { setGeoError(true); return }
        setGeoError(false)
        setWd(prev => ({ ...prev, cachedCoords: { ...result, fetchedAt: new Date().toISOString(), forLocation: tripLoc } }))
      })
      .catch(() => { if (!cancelled) setGeoError(true) })
    return () => { cancelled = true }
  }, [tripLoc, wdRef, setWd, setGeoError])
}

function useClimateEffect(
  coordsLat: number | undefined, coordsLng: number | undefined, tripMonth: number | null, tripLoc: string,
  wdRef: React.RefObject<PlanWeatherData>, setWd: React.Dispatch<React.SetStateAction<PlanWeatherData>>, setClimateError: (v: boolean) => void,
) {
  useEffect(() => {
    if (!coordsLat || !coordsLng || !tripMonth || !tripLoc) return
    if (isClimateCacheValid(wdRef.current.cachedClimate, tripLoc)) return
    let cancelled = false
    fetchClimateNormals(coordsLat, coordsLng, tripMonth)
      .then(climate => {
        if (cancelled) return
        setClimateError(false)
        setWd(prev => ({ ...prev, cachedClimate: { ...climate, fetchedAt: new Date().toISOString(), forLocation: tripLoc } }))
      })
      .catch(() => { if (!cancelled) setClimateError(true) })
    return () => { cancelled = true }
  }, [coordsLat, coordsLng, tripMonth, tripLoc, wdRef, setWd, setClimateError])
}

function useForecastEffect(
  coordsLat: number | undefined, coordsLng: number | undefined, tripLoc: string, hasDates: boolean,
  startDate: string, endDate: string, trip: StageBodyProps['trip'], tolerances: WeatherTolerances,
  wdRef: React.RefObject<PlanWeatherData>, setWd: React.Dispatch<React.SetStateAction<PlanWeatherData>>, setForecastError: (v: boolean) => void,
) {
  useEffect(() => {
    if (!coordsLat || !coordsLng || !tripLoc || !hasDates) return
    if (!inForecastWindow(startDate)) return
    if (isForecastCacheValid(wdRef.current.cachedForecast, tripLoc)) return
    const elevFt = trip ? avgElevationFt(trip) : null
    let cancelled = false
    fetchForecast(coordsLat, coordsLng)
      .then(({ days, elevationFt }) => {
        if (cancelled) return
        setForecastError(false)
        const { overall, factors } = calcDepartureRisk(days, startDate, endDate, elevFt, elevationFt, tolerances)
        setWd(prev => ({
          ...prev,
          cachedForecast: { days, elevationFt, fetchedAt: new Date().toISOString(), forLocation: tripLoc },
          departureRisk: overall,
          departureFactors: factors,
        }))
      })
      .catch(() => { if (!cancelled) setForecastError(true) })
    return () => { cancelled = true }
  }, [coordsLat, coordsLng, tripLoc, hasDates, startDate, endDate, trip, tolerances, wdRef, setWd, setForecastError])
}

export function useWeatherFetching(
  plan: StageBodyProps['plan'],
  trip: StageBodyProps['trip'],
  onChange: StageBodyProps['onChange'],
  dates: ReturnType<typeof useWeatherTripDates>,
  tolerances: WeatherTolerances,
) {
  const { tripLoc, startDate, endDate, tripMonth } = dates
  const [wd, setWd] = useState<PlanWeatherData>(() => initialWeatherState(plan, startDate, endDate, tolerances, trip))
  const [geoError, setGeoError] = useState(false)
  const [climateError, setClimateError] = useState(false)
  const [forecastError, setForecastError] = useState(false)

  const onChangeRef = useRef(onChange)
  const isMounted = useRef(false)
  const wdRef = useRef(wd)

  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => { wdRef.current = wd }, [wd])

  const coordsLat = wd.cachedCoords?.lat
  const coordsLng = wd.cachedCoords?.lng

  useGeocodeEffect(tripLoc, wdRef, setWd, setGeoError)
  useClimateEffect(coordsLat, coordsLng, tripMonth, tripLoc, wdRef, setWd, setClimateError)
  useForecastEffect(coordsLat, coordsLng, tripLoc, dates.hasDates, startDate, endDate, trip, tolerances, wdRef, setWd, setForecastError)

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ weather: wd })
  }, [wd])

  const loading = weatherLoadingFlags(wd, tripLoc, tripMonth, startDate, coordsLat, { geoError, climateError, forecastError })

  return { wd, setWd, geoError, climateError, forecastError, coordsLat, coordsLng, ...loading }
}

export function useToggleWeatherField(canEdit: boolean, setWd: React.Dispatch<React.SetStateAction<PlanWeatherData>>) {
  return function toggle(field: 'historicalReviewed' | 'forecastChecked' | 'gearAdjusted') {
    if (!canEdit) return
    setWd(prev => ({ ...prev, [field]: !prev[field] }))
  }
}

export function useWeatherChecklist(wd: PlanWeatherData, onProgress: StageBodyProps['onProgress']) {
  const onProgressRef = useRef(onProgress)
  useEffect(() => { onProgressRef.current = onProgress })

  const checklist = useMemo(() => [
    { text: 'Historical climate reviewed', done: wd.historicalReviewed },
    { text: 'Forecast checked',            done: wd.forecastChecked    },
    { text: 'Departure window assessed',   done: wd.departureRisk !== null },
    { text: 'Gear adjusted for conditions', done: wd.gearAdjusted      },
  ], [wd])

  useEffect(() => {
    onProgressRef.current?.(checklist.filter(c => c.done).length, checklist.length)
  }, [checklist])

  return checklist
}

export function useWeatherDerived(
  wd: PlanWeatherData, trip: StageBodyProps['trip'], dates: ReturnType<typeof useWeatherTripDates>,
  tolerances: WeatherTolerances, coordsLat: number | undefined, coordsLng: number | undefined,
) {
  const { startDate, endDate, hasDates } = dates

  const elevFt = useMemo(() => trip ? avgElevationFt(trip) : null, [trip])

  const computedRisk = useMemo(() => {
    if (!wd.cachedForecast || !hasDates) return null
    return calcDepartureRisk(wd.cachedForecast.days, startDate, endDate, elevFt, wd.cachedForecast.elevationFt, tolerances)
  }, [wd.cachedForecast, hasDates, startDate, endDate, elevFt, tolerances])

  const forecastSunMap = useMemo(() => {
    const fc = wd.cachedForecast
    if (!coordsLat || !coordsLng || !fc || fc.days.length === 0) return new Map<string, SunTimes>()
    const map = new Map<string, SunTimes>()
    tripSunRows(coordsLat, coordsLng, fc.days[0].date, fc.days[fc.days.length - 1].date)
      .forEach(r => map.set(r.date.toISOString().slice(0, ISO_DATE_PREFIX_LEN), r))
    return map
  }, [coordsLat, coordsLng, wd.cachedForecast])

  const tripWeekPage = useMemo(() => {
    if (!wd.cachedForecast || !startDate) return 0
    const idx = wd.cachedForecast.days.findIndex(d => d.date >= startDate)
    return idx >= 0 ? Math.floor(idx / DAYS_PER_PAGE) : 0
  }, [wd.cachedForecast, startDate])

  return { elevFt, computedRisk, forecastSunMap, tripWeekPage }
}

export function useForecastPaging(
  forecast: PlanWeatherData['cachedForecast'], weekPage: number | null, tripWeekPage: number,
  forecastSunMap: Map<string, SunTimes>,
) {
  return useMemo(() => {
    const currentPage = weekPage ?? tripWeekPage
    const totalPages  = forecast ? Math.ceil(forecast.days.length / DAYS_PER_PAGE) : 0
    const pagedays    = forecast ? forecast.days.slice(currentPage * DAYS_PER_PAGE, (currentPage + 1) * DAYS_PER_PAGE) : []
    const midDay      = pagedays[Math.floor(pagedays.length / 2)]
    return {
      currentPage,
      totalPages,
      pagedays,
      midDaySun: midDay ? forecastSunMap.get(midDay.date) : undefined,
      hasForecast: !!forecast && forecast.days.length > 0,
    }
  }, [forecast, weekPage, tripWeekPage, forecastSunMap])
}

export { DAYS_PER_PAGE }
