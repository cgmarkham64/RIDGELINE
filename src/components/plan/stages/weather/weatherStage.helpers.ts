import type { ClimateNormals, DepartureRiskFactor, CardTint, RiskLevel, RiskStyle } from './weatherStage.types'
import type { PlanWeatherData } from '../../types'
import { DEFAULT_WEATHER_TOLERANCES } from '../../../../types/auth'
import type { WeatherTolerances } from '../../../../types/auth'
import { cToF, kmhToMph, mToFt } from '../../../../lib/units'

// ─── Cache TTLs ───────────────────────────────────────────────────────────────

const HOURS_PER_DAY = 24
const MINUTES_PER_HOUR = 60
const SECONDS_PER_MINUTE = 60
const MS_PER_SECOND = 1000
const MS_PER_HOUR = MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND
const MS_PER_DAY = HOURS_PER_DAY * MS_PER_HOUR

// A location string always resolves to the same coordinates — effectively permanent.
const GEOCODE_CACHE_DAYS  = 30
// Historical climate normals barely shift week to week.
const CLIMATE_CACHE_DAYS  = 7
const FORECAST_CACHE_HOURS = 4

export const CACHE_TTL_GEOCODE_MS  = GEOCODE_CACHE_DAYS * MS_PER_DAY
export const CACHE_TTL_CLIMATE_MS  = CLIMATE_CACHE_DAYS * MS_PER_DAY
export const CACHE_TTL_FORECAST_MS = FORECAST_CACHE_HOURS * MS_PER_HOUR

// ─── Risk / correction thresholds ────────────────────────────────────────────

export const LAPSE_RATE_F_PER_1000FT = 3.5  // standard env. lapse rate
export const LAPSE_RATE_ELEVATION_UNIT_FT = 1000
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
const DEGREES_PER_CIRCLE = 360
const DEGREES_PER_CARDINAL_STEP = DEGREES_PER_CIRCLE / CARDINAL_DIRS.length

export function degToCardinal(deg: number): string {
  const index = Math.round(((deg % DEGREES_PER_CIRCLE) + DEGREES_PER_CIRCLE) % DEGREES_PER_CIRCLE / DEGREES_PER_CARDINAL_STEP) % CARDINAL_DIRS.length
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

const PRECIP_DAY_THRESHOLD_MM = 0.5
const PERCENT_MULTIPLIER = 100
const SNOW_LIKELY_DAY_FRACTION = 0.2

export function parseClimateNormals(data: ClimateApiResponse): ClimateNormals {
  const { temperature_2m_max, temperature_2m_min, precipitation_sum, snowfall_sum } = data.daily
  const total = temperature_2m_max.length

  const avgHighC = temperature_2m_max.reduce((s, v) => s + v, 0) / total
  const avgLowC  = temperature_2m_min.reduce((s, v) => s + v, 0) / total

  const precipDays  = precipitation_sum.filter(v => v > PRECIP_DAY_THRESHOLD_MM).length
  const snowDays    = snowfall_sum.filter(v => v > 0).length

  return {
    avgHighF:   cToF(avgHighC),
    avgLowF:    cToF(avgLowC),
    precipPct:  Math.round((precipDays / total) * PERCENT_MULTIPLIER),
    snowLikely: snowDays / total > SNOW_LIKELY_DAY_FRACTION,
  }
}

interface ForecastApiResponse {
  elevation: number  // meters — elevation of the forecast model's grid cell, i.e. what lowF/highF are valid for
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

type ForecastDay = NonNullable<PlanWeatherData['cachedForecast']>['days'][number]

// Forecast lows are already valid for the forecast grid cell's own elevation, so only the
// elevation *gained* above that point (not the trip's raw elevation) should be lapse-rate corrected.
function elevGainFt(tripElevFt: number | null, forecastElevFt: number | null): number {
  if (tripElevFt === null || forecastElevFt === null) return 0
  return tripElevFt - forecastElevFt
}

function tempFactor(d: ForecastDay, tripElevFt: number | null, forecastElevFt: number | null, tolerances: WeatherTolerances): DepartureRiskFactor | null {
  const adjustedLowF = d.lowF - (elevGainFt(tripElevFt, forecastElevFt) / LAPSE_RATE_ELEVATION_UNIT_FT) * LAPSE_RATE_F_PER_1000FT
  if (tolerances.tempDelayF !== null && adjustedLowF <= tolerances.tempDelayF) {
    return { date: d.date, severity: 'high', label: `Freezing temps (forecast ${Math.round(d.lowF)}°F → ${Math.round(adjustedLowF)}°F at your elevation)` }
  }
  if (tolerances.tempCautionF !== null && adjustedLowF <= tolerances.tempCautionF) {
    return { date: d.date, severity: 'moderate', label: `Cold temps (forecast ${Math.round(d.lowF)}°F → ${Math.round(adjustedLowF)}°F at your elevation)` }
  }
  return null
}

function precipFactor(d: ForecastDay, tolerances: WeatherTolerances): DepartureRiskFactor | null {
  if (tolerances.precipDelayPct !== null && d.precipPct > tolerances.precipDelayPct) {
    return { date: d.date, severity: 'high', label: `Very high precip chance (${d.precipPct}%)` }
  }
  if (tolerances.precipCautionPct !== null && d.precipPct > tolerances.precipCautionPct) {
    return { date: d.date, severity: 'moderate', label: `High precip chance (${d.precipPct}%)` }
  }
  return null
}

function windFactor(d: ForecastDay, tolerances: WeatherTolerances): DepartureRiskFactor | null {
  if (tolerances.windDelayMph !== null && d.windMph >= tolerances.windDelayMph) {
    return { date: d.date, severity: 'high', label: `Dangerous winds (${d.windMph} mph)` }
  }
  if (tolerances.windCautionMph !== null && d.windMph >= tolerances.windCautionMph) {
    return { date: d.date, severity: 'moderate', label: `High winds (${d.windMph} mph)` }
  }
  return null
}

function dayRiskFactors(d: ForecastDay, tripElevFt: number | null, forecastElevFt: number | null, tolerances: WeatherTolerances): DepartureRiskFactor[] {
  return [tempFactor(d, tripElevFt, forecastElevFt, tolerances), precipFactor(d, tolerances), windFactor(d, tolerances)]
    .filter((f): f is DepartureRiskFactor => f !== null)
}

export function calcDepartureRisk(
  forecastDays: NonNullable<PlanWeatherData['cachedForecast']>['days'],
  startDate: string,
  endDate: string,
  tripElevFt: number | null,
  forecastElevFt: number | null,
  tolerances: WeatherTolerances = DEFAULT_WEATHER_TOLERANCES,
): { overall: 'low' | 'moderate' | 'high'; factors: DepartureRiskFactor[] } {
  const inRange = forecastDays.filter(d => d.date >= startDate && d.date <= endDate)
  const factors = inRange.flatMap(d => dayRiskFactors(d, tripElevFt, forecastElevFt, tolerances))

  const overall: 'low' | 'moderate' | 'high' =
    factors.some(f => f.severity === 'high') ? 'high' :
    factors.length > 0                        ? 'moderate' :
    'low'

  return { overall, factors }
}

// ─── GPX average elevation ────────────────────────────────────────────────────

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
  return mToFt(avgM)
}

// ─── Date utilities ───────────────────────────────────────────────────────────

export const FORECAST_WINDOW_DAYS = 14
export const DAY_MS = 86_400_000

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

// ─── Open-Meteo fetchers ──────────────────────────────────────────────────────

const ARCHIVE_URL  = 'https://archive-api.open-meteo.com/v1/archive'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const CLIMATE_LOOKBACK_YEARS = 3

type ApiClimateRow = { daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_sum?: number[]; snowfall_sum?: number[] } }

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export async function fetchClimateNormals(lat: number, lng: number, month: number): Promise<ClimateNormals> {
  const year = new Date().getFullYear()
  const lastDay = new Date(year, month, 0).getDate()
  const results = await Promise.all(
    Array.from({ length: CLIMATE_LOOKBACK_YEARS }, (_, i) => year - i - 1).map(y =>
      fetch(`${ARCHIVE_URL}?latitude=${lat}&longitude=${lng}&start_date=${y}-${pad2(month)}-01&end_date=${y}-${pad2(month)}-${pad2(lastDay)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum&timezone=UTC`)
        .then(r => r.json() as Promise<ApiClimateRow>)
    )
  )
  const combined = {
    daily: {
      temperature_2m_max: results.flatMap(d => d.daily?.temperature_2m_max ?? []),
      temperature_2m_min: results.flatMap(d => d.daily?.temperature_2m_min ?? []),
      precipitation_sum:  results.flatMap(d => d.daily?.precipitation_sum  ?? []),
      snowfall_sum:       results.flatMap(d => d.daily?.snowfall_sum        ?? []),
    },
  }
  if (!combined.daily.temperature_2m_max.length) throw new Error('No climate data')
  return parseClimateNormals(combined)
}

export async function fetchForecast(
  lat: number, lng: number,
): Promise<{ days: NonNullable<PlanWeatherData['cachedForecast']>['days']; elevationFt: number | null }> {
  const data: ForecastApiResponse = await fetch(`${FORECAST_URL}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max,winddirection_10m_dominant&timezone=auto&forecast_days=14`).then(r => r.json())
  return {
    days: parseForecastDays(data),
    elevationFt: typeof data.elevation === 'number' ? mToFt(data.elevation) : null,
  }
}

// ─── Display formatting ───────────────────────────────────────────────────────

const DEGREES_PER_TIMEZONE_HOUR = 15
const MS_PER_HOUR_DISPLAY       = 3_600_000
const HOURS_PER_12H_CLOCK       = 12

export function fmtSolarTime(d: Date, lng: number): string {
  const local = new Date(d.getTime() + Math.round(lng / DEGREES_PER_TIMEZONE_HOUR) * MS_PER_HOUR_DISPLAY)
  const h = local.getUTCHours(), m = local.getUTCMinutes()
  return `${h % HOURS_PER_12H_CLOCK || HOURS_PER_12H_CLOCK}:${String(m).padStart(2, '0')} ${h >= HOURS_PER_12H_CLOCK ? 'PM' : 'AM'}`
}

export function fmtShortDate(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const DEFAULT_TINT: CardTint = { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)' } // clear

const TINT_BY_WMO_CODE: Record<number, CardTint> = {
  99: { bg: 'rgba(127,29,29,0.28)',   border: 'rgba(185,28,28,0.65)'  }, // t-storm + heavy hail
  96: { bg: 'rgba(153,27,27,0.22)',   border: 'rgba(220,38,38,0.55)'  }, // t-storm + hail
  95: { bg: 'rgba(239,68,68,0.18)',   border: 'rgba(239,68,68,0.5)'   }, // thunderstorm
  82: { bg: 'rgba(37,99,235,0.22)',   border: 'rgba(59,130,246,0.55)' }, // heavy showers
  86: { bg: 'rgba(147,197,253,0.22)', border: 'rgba(147,197,253,0.5)' }, // heavy snow showers
  75: { bg: 'rgba(147,197,253,0.2)',  border: 'rgba(147,197,253,0.48)'}, // heavy snow
  65: { bg: 'rgba(37,99,235,0.2)',    border: 'rgba(59,130,246,0.5)'  }, // heavy rain
  81: { bg: 'rgba(59,130,246,0.16)',  border: 'rgba(96,165,250,0.45)' }, // showers
  85: { bg: 'rgba(186,230,253,0.15)', border: 'rgba(147,197,253,0.35)'}, // snow showers
  73: { bg: 'rgba(186,230,253,0.16)', border: 'rgba(147,197,253,0.38)'}, // snow
  63: { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(96,165,250,0.4)'  }, // rain
  80: { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(147,197,253,0.35)'}, // rain showers
  71: { bg: 'rgba(186,230,253,0.1)',  border: 'rgba(186,230,253,0.28)'}, // light snow
  77: { bg: 'rgba(186,230,253,0.1)',  border: 'rgba(186,230,253,0.28)'}, // snow grains
  61: { bg: 'rgba(96,165,250,0.1)',   border: 'rgba(147,197,253,0.3)' }, // light rain
  55: { bg: 'rgba(96,165,250,0.09)',  border: 'rgba(147,197,253,0.28)'}, // heavy drizzle
  53: { bg: 'rgba(147,197,253,0.07)', border: 'rgba(186,230,253,0.24)'}, // drizzle
  51: { bg: 'rgba(186,230,253,0.05)', border: 'rgba(186,230,253,0.18)'}, // light drizzle
  48: { bg: 'rgba(100,116,139,0.13)', border: 'rgba(100,116,139,0.3)' }, // icy fog
  45: { bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.25)'}, // fog
  3:  { bg: 'rgba(71,85,105,0.1)',    border: 'rgba(100,116,139,0.22)'}, // overcast
  2:  { bg: 'rgba(251,191,36,0.07)',  border: 'rgba(148,163,184,0.22)'}, // partly cloudy
  1:  { bg: 'rgba(251,191,36,0.11)',  border: 'rgba(251,191,36,0.3)'  }, // mainly clear
}

export function cardTint(code: number): CardTint {
  return TINT_BY_WMO_CODE[code] ?? DEFAULT_TINT
}

export const RISK_STYLE: Record<RiskLevel, RiskStyle> = {
  low:      { label: 'Go',      border: 'border-pine-border',  bg: 'bg-pine-dim',  text: 'text-pine'  },
  moderate: { label: 'Caution', border: 'border-amber-border', bg: 'bg-amber-dim', text: 'text-amber' },
  high:     { label: 'Delay',   border: 'border-red-border',   bg: 'bg-red-dim',   text: 'text-red'   },
}

// A "Go" window has no flagged conditions, so there's nothing for gear to be adjusted against.
export function isGearReviewNeeded(risk: RiskLevel | null | undefined): boolean {
  return risk === 'moderate' || risk === 'high'
}
