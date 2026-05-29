import type { ClimateNormals, DepartureRiskFactor } from './weatherStage.types'
import type { PlanWeatherData } from '../../types'
import { DEFAULT_WEATHER_TOLERANCES } from '../../../../types/auth'
import type { WeatherTolerances } from '../../../../types/auth'
import { cToF, kmhToMph } from '../../../../lib/units'

// ─── Cache TTLs ───────────────────────────────────────────────────────────────

export const CACHE_TTL_GEOCODE_MS  = 12 * 60 * 60 * 1000  // 12 h
export const CACHE_TTL_CLIMATE_MS  = 24 * 60 * 60 * 1000  // 24 h
export const CACHE_TTL_FORECAST_MS =  4 * 60 * 60 * 1000  //  4 h

// ─── Risk / correction thresholds ────────────────────────────────────────────

export const LAPSE_RATE_F_PER_1000FT = 3.5  // standard env. lapse rate
export const SAMPLE_COUNT            = 50   // points to sample from GPX for avg elevation

// ─── Cache validity ───────────────────────────────────────────────────────────

export function isCacheValid(
  fetchedAt: string | undefined,
  forLocation: string | undefined,
  currentLocation: string,
  ttlMs: number,
): boolean {
  if (!fetchedAt || !forLocation) return false
  if (forLocation !== currentLocation) return false
  if (Date.now() - new Date(fetchedAt).getTime() >= ttlMs) return false
  return true
}

export function isGeocodeCacheValid(
  cache: PlanWeatherData['cachedCoords'],
  location: string,
): boolean {
  return isCacheValid(cache?.fetchedAt, cache?.forLocation, location, CACHE_TTL_GEOCODE_MS)
}

export function isClimateCacheValid(
  cache: PlanWeatherData['cachedClimate'],
  location: string,
): boolean {
  return isCacheValid(cache?.fetchedAt, cache?.forLocation, location, CACHE_TTL_CLIMATE_MS)
}

export function isForecastCacheValid(
  cache: PlanWeatherData['cachedForecast'],
  location: string,
): boolean {
  return isCacheValid(cache?.fetchedAt, cache?.forLocation, location, CACHE_TTL_FORECAST_MS)
}

// ─── WMO weather code labels ──────────────────────────────────────────────────

const WMO_LABELS: Record<number, string> = {
  0:  'Clear',
  1:  'Mainly clear',
  2:  'Partly cloudy',
  3:  'Overcast',
  45: 'Fog',
  48: 'Icy fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Showers',
  82: 'Heavy showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'T-storm + hail',
  99: 'T-storm + heavy hail',
}

export function wmoLabel(code: number): string {
  return WMO_LABELS[code] ?? 'Unknown'
}

// ─── Wind direction ───────────────────────────────────────────────────────────

const CARDINAL_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const

export function degToCardinal(deg: number): string {
  const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8
  return CARDINAL_DIRS[index]
}

// ─── Open-Meteo response parsers ──────────────────────────────────────────────

interface ClimateApiResponse {
  daily: {
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    snowfall_sum: number[]
  }
}

export function parseClimateNormals(data: ClimateApiResponse): ClimateNormals {
  const { temperature_2m_max, temperature_2m_min, precipitation_sum, snowfall_sum } = data.daily
  const total = temperature_2m_max.length

  const avgHighC = temperature_2m_max.reduce((s, v) => s + v, 0) / total
  const avgLowC  = temperature_2m_min.reduce((s, v) => s + v, 0) / total

  const precipDays  = precipitation_sum.filter(v => v > 0.5).length
  const snowDays    = snowfall_sum.filter(v => v > 0).length

  return {
    avgHighF:   cToF(avgHighC),
    avgLowF:    cToF(avgLowC),
    precipPct:  Math.round((precipDays / total) * 100),
    snowLikely: snowDays / total > 0.2,
  }
}

interface ForecastApiResponse {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    weathercode: number[]
    windspeed_10m_max: number[]
    winddirection_10m_dominant: number[]
  }
}

export function parseForecastDays(
  data: ForecastApiResponse,
): NonNullable<PlanWeatherData['cachedForecast']>['days'] {
  const {
    time,
    temperature_2m_max,
    temperature_2m_min,
    precipitation_probability_max,
    weathercode,
    windspeed_10m_max,
    winddirection_10m_dominant,
  } = data.daily

  return time.map((date, i) => ({
    date,
    highF:          cToF(temperature_2m_max[i]),
    lowF:           cToF(temperature_2m_min[i]),
    precipPct:      precipitation_probability_max[i],
    conditionCode:  weathercode[i],
    conditionLabel: wmoLabel(weathercode[i]),
    windMph:        kmhToMph(windspeed_10m_max[i]),
    windDir:        degToCardinal(winddirection_10m_dominant[i]),
  }))
}

// ─── Departure risk ───────────────────────────────────────────────────────────

export function calcDepartureRisk(
  forecastDays: NonNullable<PlanWeatherData['cachedForecast']>['days'],
  startDate: string,
  endDate: string,
  avgElevFt: number | null,
  tolerances: WeatherTolerances = DEFAULT_WEATHER_TOLERANCES,
): { overall: 'low' | 'moderate' | 'high'; factors: DepartureRiskFactor[] } {
  const inRange = forecastDays.filter(d => d.date >= startDate && d.date <= endDate)
  const factors: DepartureRiskFactor[] = []

  for (const d of inRange) {
    const adjustedLowF = d.lowF - ((avgElevFt ?? 0) / 1000) * LAPSE_RATE_F_PER_1000FT

    if (tolerances.tempDelayF !== null && adjustedLowF <= tolerances.tempDelayF) {
      factors.push({
        date:     d.date,
        label:    `Freezing temps (forecast ${Math.round(d.lowF)}°F → ${Math.round(adjustedLowF)}°F at your elevation)`,
        severity: 'high',
      })
    } else if (tolerances.tempCautionF !== null && adjustedLowF <= tolerances.tempCautionF) {
      factors.push({
        date:     d.date,
        label:    `Cold temps (forecast ${Math.round(d.lowF)}°F → ${Math.round(adjustedLowF)}°F at your elevation)`,
        severity: 'moderate',
      })
    }

    if (tolerances.precipDelayPct !== null && d.precipPct > tolerances.precipDelayPct) {
      factors.push({
        date:     d.date,
        label:    `Very high precip chance (${d.precipPct}%)`,
        severity: 'high',
      })
    } else if (tolerances.precipCautionPct !== null && d.precipPct > tolerances.precipCautionPct) {
      factors.push({
        date:     d.date,
        label:    `High precip chance (${d.precipPct}%)`,
        severity: 'moderate',
      })
    }

    if (tolerances.windDelayMph !== null && d.windMph >= tolerances.windDelayMph) {
      factors.push({
        date:     d.date,
        label:    `Dangerous winds (${d.windMph} mph)`,
        severity: 'high',
      })
    } else if (tolerances.windCautionMph !== null && d.windMph >= tolerances.windCautionMph) {
      factors.push({
        date:     d.date,
        label:    `High winds (${d.windMph} mph)`,
        severity: 'moderate',
      })
    }
  }

  const overall: 'low' | 'moderate' | 'high' =
    factors.some(f => f.severity === 'high') ? 'high' :
    factors.length > 0                        ? 'moderate' :
    'low'

  return { overall, factors }
}

// ─── GPX average elevation ────────────────────────────────────────────────────

const M_TO_FT = 3.28084

interface TripLike {
  gpxPlanned?: { coordinates: [number, number, number][] }
  gpxTracks?:  { track: { coordinates: [number, number, number][] } }[]
}

export function avgElevationFt(trip: TripLike): number | null {
  const coords =
    trip.gpxPlanned?.coordinates ??
    trip.gpxTracks?.[0]?.track.coordinates

  if (!coords || coords.length === 0) return null

  const step    = Math.max(1, Math.floor(coords.length / SAMPLE_COUNT))
  const sampled = coords.filter((_, i) => i % step === 0)
  const valid   = sampled.filter(c => c[2] !== 0)

  if (valid.length === 0) return null

  const avgM = valid.reduce((s, c) => s + c[2], 0) / valid.length
  return avgM * M_TO_FT
}

// ─── Date utilities ───────────────────────────────────────────────────────────

const FORECAST_WINDOW_DAYS = 14
const DAY_MS = 86_400_000

export function daysUntil(dateStr: string): number {
  return Math.ceil(
    (new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / DAY_MS,
  )
}

export function inForecastWindow(startDate: string): boolean {
  return daysUntil(startDate) <= FORECAST_WINDOW_DAYS
}

export function forecastTargetDate(startDate: string): string {
  return new Date(
    new Date(startDate).getTime() - FORECAST_WINDOW_DAYS * DAY_MS,
  ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
