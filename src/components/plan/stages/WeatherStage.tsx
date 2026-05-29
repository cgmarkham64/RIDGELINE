import { useState, useEffect, useRef, useMemo } from 'react'
import type { StageBodyProps, PlanWeatherData } from '../types'
import { CheckItem } from '../CheckItem'
import { ProgressBar } from '../ProgressBar'
import { IconAlertTriangle, IconCalendar, IconCheck, IconChevronLeft, IconChevronRight, IconPackage, IconSun } from '../../icons'
import { nominatimGeocode } from '../../../lib/geocode'
import { tripSunRows } from '../../../lib/sun'
import {
  isGeocodeCacheValid, isClimateCacheValid, isForecastCacheValid,
  parseClimateNormals, parseForecastDays, calcDepartureRisk,
  avgElevationFt, inForecastWindow, forecastTargetDate, daysUntil,
} from './weatherStage.helpers'
import type { ClimateNormals } from './weatherStage.types'
import { WmoConditionIcon } from './WmoConditionIcon'
import { useAuthStore } from '../../../store/auth'
import { DEFAULT_WEATHER_TOLERANCES } from '../../../types/auth'
import { fmtTemp, fmtWind } from '../../../lib/units'
import { useUnitSystem } from '../../../hooks/useUnitSystem'

const ARCHIVE_URL  = 'https://archive-api.open-meteo.com/v1/archive'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

const INITIAL_WEATHER: PlanWeatherData = {
  historicalReviewed: false,
  forecastChecked: false,
  sunriseReviewed: false,
  gearAdjusted: false,
  departureRisk: null,
  notes: '',
}

type ApiClimateRow = { daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_sum?: number[]; snowfall_sum?: number[] } }

async function fetchClimateNormals(lat: number, lng: number, month: number): Promise<ClimateNormals> {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = new Date().getFullYear()
  const lastDay = new Date(year, month, 0).getDate()
  const results = await Promise.all(
    [year - 1, year - 2, year - 3].map(y =>
      fetch(`${ARCHIVE_URL}?latitude=${lat}&longitude=${lng}&start_date=${y}-${pad(month)}-01&end_date=${y}-${pad(month)}-${pad(lastDay)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum&timezone=UTC`)
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

async function fetchForecast(lat: number, lng: number): Promise<NonNullable<PlanWeatherData['cachedForecast']>['days']> {
  const data = await fetch(`${FORECAST_URL}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max,winddirection_10m_dominant&timezone=auto&forecast_days=14`).then(r => r.json())
  return parseForecastDays(data)
}

function fmtSolarTime(d: Date, lng: number): string {
  const local = new Date(d.getTime() + Math.round(lng / 15) * 3_600_000)
  const h = local.getUTCHours(), m = local.getUTCMinutes()
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function fmtShortDate(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const RISK_STYLE: Record<'low' | 'moderate' | 'high', { label: string; border: string; bg: string; text: string }> = {
  low:      { label: 'Go',      border: 'border-pine-border',  bg: 'bg-pine-dim',  text: 'text-pine'  },
  moderate: { label: 'Caution', border: 'border-amber-border', bg: 'bg-amber-dim', text: 'text-amber' },
  high:     { label: 'Delay',   border: 'border-red-border',   bg: 'bg-red-dim',   text: 'text-red'   },
}

// ─── Forecast card tint ───────────────────────────────────────────────────────
// Maps WMO weather code to a card background/border color.
// Severity runs: clear (amber-warm) → cloudy/fog (gray) → precip (blue) → storm (red).

function cardTint(code: number): { bg: string; border: string } {
  if (code === 99) return { bg: 'rgba(127,29,29,0.28)',   border: 'rgba(185,28,28,0.65)'  } // t-storm + heavy hail
  if (code === 96) return { bg: 'rgba(153,27,27,0.22)',   border: 'rgba(220,38,38,0.55)'  } // t-storm + hail
  if (code === 95) return { bg: 'rgba(239,68,68,0.18)',   border: 'rgba(239,68,68,0.5)'   } // thunderstorm
  if (code === 82) return { bg: 'rgba(37,99,235,0.22)',   border: 'rgba(59,130,246,0.55)' } // heavy showers
  if (code === 86) return { bg: 'rgba(147,197,253,0.22)', border: 'rgba(147,197,253,0.5)' } // heavy snow showers
  if (code === 75) return { bg: 'rgba(147,197,253,0.2)',  border: 'rgba(147,197,253,0.48)'} // heavy snow
  if (code === 65) return { bg: 'rgba(37,99,235,0.2)',    border: 'rgba(59,130,246,0.5)'  } // heavy rain
  if (code === 81) return { bg: 'rgba(59,130,246,0.16)',  border: 'rgba(96,165,250,0.45)' } // showers
  if (code === 85) return { bg: 'rgba(186,230,253,0.15)', border: 'rgba(147,197,253,0.35)'} // snow showers
  if (code === 73) return { bg: 'rgba(186,230,253,0.16)', border: 'rgba(147,197,253,0.38)'} // snow
  if (code === 63) return { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(96,165,250,0.4)'  } // rain
  if (code === 80) return { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(147,197,253,0.35)'} // rain showers
  if (code === 71) return { bg: 'rgba(186,230,253,0.1)',  border: 'rgba(186,230,253,0.28)'} // light snow
  if (code === 77) return { bg: 'rgba(186,230,253,0.1)',  border: 'rgba(186,230,253,0.28)'} // snow grains
  if (code === 61) return { bg: 'rgba(96,165,250,0.1)',   border: 'rgba(147,197,253,0.3)' } // light rain
  if (code === 55) return { bg: 'rgba(96,165,250,0.09)',  border: 'rgba(147,197,253,0.28)'} // heavy drizzle
  if (code === 53) return { bg: 'rgba(147,197,253,0.07)', border: 'rgba(186,230,253,0.24)'} // drizzle
  if (code === 51) return { bg: 'rgba(186,230,253,0.05)', border: 'rgba(186,230,253,0.18)'} // light drizzle
  if (code === 48) return { bg: 'rgba(100,116,139,0.13)', border: 'rgba(100,116,139,0.3)' } // icy fog
  if (code === 45) return { bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.25)'} // fog
  if (code === 3)  return { bg: 'rgba(71,85,105,0.1)',    border: 'rgba(100,116,139,0.22)'} // overcast
  if (code === 2)  return { bg: 'rgba(251,191,36,0.07)',  border: 'rgba(148,163,184,0.22)'} // partly cloudy
  if (code === 1)  return { bg: 'rgba(251,191,36,0.11)',  border: 'rgba(251,191,36,0.3)'  } // mainly clear
  return             { bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.4)'  }       // clear
}

const DAYS_PER_PAGE = 7

// ─── WeatherStage ─────────────────────────────────────────────────────────────

export function WeatherStage({ plan, onChange, onProgress, trip, canEdit = true, onEditTrip }: StageBodyProps) {
  const { user } = useAuthStore()
  const tolerances = user?.preferences?.weatherTolerances ?? DEFAULT_WEATHER_TOLERANCES
  const sys = useUnitSystem()

  const tripLoc  = trip?.location ?? ''
  // Normalize to YYYY-MM-DD — API dates may arrive as full ISO strings
  const startDate = trip?.startDate?.slice(0, 10) ?? ''
  const endDate   = trip?.endDate?.slice(0, 10) ?? ''
  const hasDates  = !!(startDate && endDate)
  const tripMonth = hasDates ? new Date(startDate + 'T00:00:00').getMonth() + 1 : null

  const [wd, setWd] = useState<PlanWeatherData>(() => {
    const base = plan?.weather ?? INITIAL_WEATHER
    // Pre-compute departure risk if cached forecast exists but risk wasn't stored
    if (base.cachedForecast && base.departureRisk === null && startDate && endDate) {
      const { overall } = calcDepartureRisk(
        base.cachedForecast.days, startDate, endDate, trip ? avgElevationFt(trip) : null, tolerances,
      )
      return { ...base, departureRisk: overall }
    }
    return base
  })

  // Error flags — set only inside async callbacks to satisfy react-hooks/set-state-in-effect.
  // Loading state is derived from whether cached data is stale for the current location.
  const [geoError,      setGeoError]      = useState(false)
  const [climateError,  setClimateError]  = useState(false)
  const [forecastError, setForecastError] = useState(false)
  // null = auto-follow tripWeekPage; number = user has explicitly navigated
  const [weekPage, setWeekPage] = useState<number | null>(null)

  const onChangeRef   = useRef(onChange)
  const onProgressRef = useRef(onProgress)
  const isMounted     = useRef(false)
  const wdRef         = useRef(wd)

  useEffect(() => { onChangeRef.current   = onChange })
  useEffect(() => { onProgressRef.current = onProgress })
  useEffect(() => { wdRef.current = wd }, [wd])
  const coordsLat = wd.cachedCoords?.lat
  const coordsLng = wd.cachedCoords?.lng

  // ── Geocode when location changes ────────────────────────────────────────
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
  }, [tripLoc])

  // ── Historical climate once coords + month are known ──────────────────────
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
  }, [coordsLat, coordsLng, tripMonth, tripLoc])

  // ── Live forecast — only within 14-day window ─────────────────────────────
  useEffect(() => {
    if (!coordsLat || !coordsLng || !tripLoc || !hasDates) return
    if (!inForecastWindow(startDate)) return
    if (isForecastCacheValid(wdRef.current.cachedForecast, tripLoc)) return
    const elevFt  = trip ? avgElevationFt(trip) : null
    let cancelled = false
    fetchForecast(coordsLat, coordsLng)
      .then(days => {
        if (cancelled) return
        setForecastError(false)
        const { overall } = calcDepartureRisk(days, startDate, endDate, elevFt, tolerances)
        setWd(prev => ({
          ...prev,
          cachedForecast: { days, fetchedAt: new Date().toISOString(), forLocation: tripLoc },
          departureRisk: overall,
        }))
      })
      .catch(() => { if (!cancelled) setForecastError(true) })
    return () => { cancelled = true }
  }, [coordsLat, coordsLng, tripLoc, hasDates, startDate, endDate, trip, tolerances])

  // ── Persist changes ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ weather: wd })
  }, [wd])

  const checklist = useMemo(() => [
    { text: 'Historical climate reviewed', done: wd.historicalReviewed },
    { text: 'Forecast checked',            done: wd.forecastChecked    },
    { text: 'Sunrise/sunset noted',        done: wd.sunriseReviewed    },
    { text: 'Departure window assessed',   done: wd.departureRisk !== null },
    { text: 'Gear adjusted for conditions', done: wd.gearAdjusted      },
  ], [wd])

  useEffect(() => {
    onProgressRef.current?.(checklist.filter(c => c.done).length, checklist.length)
  }, [checklist])

  const elevFt = useMemo(() => trip ? avgElevationFt(trip) : null, [trip])

  // Factors list for display — recomputed from cached forecast + current trip dates
  const computedRisk = useMemo(() => {
    if (!wd.cachedForecast || !hasDates) return null
    return calcDepartureRisk(wd.cachedForecast.days, startDate, endDate, elevFt, tolerances)
  }, [wd.cachedForecast, hasDates, startDate, endDate, elevFt, tolerances])

  // Sun times for every forecast day — used in card hover face and nav bar.
  // Keyed by YYYY-MM-DD for O(1) lookup per card.
  const forecastSunMap = useMemo(() => {
    const fc = wd.cachedForecast
    if (!coordsLat || !coordsLng || !fc || fc.days.length === 0) {
      return new Map<string, { sunrise: Date; sunset: Date; daylightHours: number }>()
    }
    const map = new Map<string, { sunrise: Date; sunset: Date; daylightHours: number }>()
    tripSunRows(coordsLat, coordsLng, fc.days[0].date, fc.days[fc.days.length - 1].date)
      .forEach(r => map.set(r.date.toISOString().slice(0, 10), r))
    return map
  }, [coordsLat, coordsLng, wd.cachedForecast])

  // Auto-advance to the week containing the trip start date when forecast loads.
  // Derived via useMemo (not useEffect) to avoid setState-in-effect rule.
  const tripWeekPage = useMemo(() => {
    if (!wd.cachedForecast || !startDate) return 0
    const idx = wd.cachedForecast.days.findIndex(d => d.date >= startDate)
    return idx >= 0 ? Math.floor(idx / DAYS_PER_PAGE) : 0
  }, [wd.cachedForecast, startDate])

  function toggle(field: 'historicalReviewed' | 'forecastChecked' | 'sunriseReviewed' | 'gearAdjusted') {
    if (!canEdit) return
    setWd(prev => ({ ...prev, [field]: !prev[field] }))
  }

  // Derived loading indicators — no separate loading state needed
  const geoLoading      = !!tripLoc && (!wd.cachedCoords  || wd.cachedCoords.forLocation  !== tripLoc) && !geoError
  const climateLoading  = !!coordsLat && !!tripMonth && (!wd.cachedClimate  || wd.cachedClimate.forLocation  !== tripLoc) && !climateError
  const forecastLoading = !!coordsLat && inForecastWindow(startDate) && (!wd.cachedForecast || wd.cachedForecast.forLocation !== tripLoc) && !forecastError

  // ── Missing dates gate ────────────────────────────────────────────────────
  if (!hasDates) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[480px] mx-auto mt-16">
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Stage 2 · Weather</div>
          <h2 className="font-heading text-[22px] font-extrabold text-text mb-2">Start and end dates required.</h2>
          <p className="text-[13px] text-text-mid leading-relaxed mb-5">
            Weather analysis, sunrise/sunset times, and the forecast window all depend on knowing when your trip starts and ends.
          </p>
          <div className="flex items-start gap-3 px-4 py-3 bg-red-dim border border-red-border rounded-lg mb-5">
            <IconAlertTriangle size={14} className="text-red" />
            <p className="text-[12px] text-text-mid leading-relaxed">
              <span className="font-semibold text-red">Trip dates are not set.</span>{' '}
              Add start and end dates to enable this stage.
            </p>
          </div>
          {onEditTrip && (
            <button type="button" onClick={onEditTrip}
              className="px-4 py-2 font-heading text-[10px] font-bold tracking-widest uppercase rounded border cursor-pointer transition-colors"
              style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}>
              Set trip dates
            </button>
          )}
        </div>
      </div>
    )
  }

  const climate     = wd.cachedClimate
  const forecast    = wd.cachedForecast
  const currentPage = weekPage ?? tripWeekPage
  const totalPages  = forecast ? Math.ceil(forecast.days.length / DAYS_PER_PAGE) : 0
  const pagedays    = forecast ? forecast.days.slice(currentPage * DAYS_PER_PAGE, (currentPage + 1) * DAYS_PER_PAGE) : []
  const midDay      = pagedays[Math.floor(pagedays.length / 2)]
  const midDaySun   = midDay ? forecastSunMap.get(midDay.date) : undefined
  const doneCount   = checklist.filter(c => c.done).length
  const inWindow  = inForecastWindow(startDate)
  const daysAway  = daysUntil(startDate)
  const risk      = wd.departureRisk
  const riskStyle = risk ? RISK_STYLE[risk] : null

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_300px]">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-[18px]">

          {/* Location + date banner */}
          <div className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <IconCalendar size={15} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-text truncate">{trip!.location || '—'}</div>
              <div className="font-mono text-[9px] text-text-dim mt-0.5">
                {new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' – '}
                {new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {hasDates && ` · ${Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000) + 1} days`}
                {coordsLat != null ? ` · ${coordsLat.toFixed(2)}°, ${coordsLng!.toFixed(2)}°` : ''}
              </div>
            </div>
            {geoLoading && <span className="font-mono text-[9px] text-text-dim shrink-0">geocoding…</span>}
            {geoError   && <span className="font-mono text-[9px] text-red shrink-0">location not found</span>}
          </div>

          {/* Historical climate */}
          <div className="bg-surface border border-border rounded-lg p-[18px]">
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">
                Typical {new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long' })} · 3-yr avg
              </div>
              {canEdit && (
                <button type="button" onClick={() => toggle('historicalReviewed')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9px] rounded border cursor-pointer transition-colors ${wd.historicalReviewed ? 'bg-pine-dim border-pine-border text-pine' : 'bg-surface-2 border-border text-text-dim hover:border-border-mid'}`}>
                  {wd.historicalReviewed && <IconCheck size={9} />} Reviewed
                </button>
              )}
            </div>
            {climateLoading && <div className="font-mono text-[11px] text-text-dim py-4 text-center">Fetching climate data…</div>}
            {climateError   && <div className="font-mono text-[11px] text-red py-4 text-center">Failed to load climate data.</div>}
            {climate && (
              <div className="grid grid-cols-4 gap-px bg-border rounded overflow-hidden">
                {[
                  { v: fmtTemp(climate.avgHighF, sys), l: 'avg high'    },
                  { v: fmtTemp(climate.avgLowF, sys),  l: 'avg low'     },
                  { v: `${climate.precipPct}%`,         l: 'precip days' },
                  { v: climate.snowLikely ? 'likely' : 'rare', l: 'snow' },
                ].map(s => (
                  <div key={s.l} className="bg-surface px-3 py-2">
                    <div className="font-heading text-[16px] font-extrabold text-amber leading-none">{s.v}</div>
                    <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Live forecast / placeholder */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Forecast</span>
              {inWindow && canEdit && (
                <button type="button" onClick={() => toggle('forecastChecked')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9px] rounded border cursor-pointer transition-colors ${wd.forecastChecked ? 'bg-pine-dim border-pine-border text-pine' : 'bg-surface-2 border-border text-text-dim hover:border-border-mid'}`}>
                  {wd.forecastChecked && <IconCheck size={9} />} Checked
                </button>
              )}
            </div>
            {inWindow && midDaySun && coordsLng != null && (
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border">
                <IconSun size={12} />
                <div className="flex items-center gap-4 flex-1">
                  <span className="font-mono text-[9px] text-text-dim">↑ {fmtSolarTime(midDaySun.sunrise, coordsLng)}</span>
                  <span className="font-mono text-[9px] text-text-dim">↓ {fmtSolarTime(midDaySun.sunset, coordsLng)}</span>
                  <span className="font-mono text-[9px] text-text-dim">{midDaySun.daylightHours.toFixed(1)} hrs daylight</span>
                </div>
                {canEdit && (
                  <button type="button" onClick={() => toggle('sunriseReviewed')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9px] rounded border cursor-pointer transition-colors ${wd.sunriseReviewed ? 'bg-pine-dim border-pine-border text-pine' : 'bg-surface-2 border-border text-text-dim hover:border-border-mid'}`}>
                    {wd.sunriseReviewed && <IconCheck size={9} />} Noted
                  </button>
                )}
              </div>
            )}
            {!inWindow && (
              <div className="px-4 py-6 text-center">
                <div className="font-heading text-[15px] font-bold text-text mb-1">Not in forecast range yet.</div>
                <div className="font-mono text-[11px] text-text-mid">
                  Check back <span className="text-amber font-semibold">{forecastTargetDate(startDate)}</span>
                  {daysAway > 14 ? ` · ${daysAway - 14} days from now` : ''}
                </div>
              </div>
            )}
            {inWindow && forecastLoading && <div className="font-mono text-[11px] text-text-dim py-6 text-center">Loading forecast…</div>}
            {inWindow && forecastError   && <div className="font-mono text-[11px] text-red py-6 text-center">Failed to load forecast.</div>}
            {inWindow && forecast && forecast.days.length > 0 && (
              <>
                {/* Week pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <button
                      type="button"
                      onClick={() => setWeekPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="p-1 rounded text-text-dim hover:text-text disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <IconChevronLeft size={13} />
                    </button>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[9px] text-text-dim">
                        {pagedays[0] && fmtShortDate(pagedays[0].date)}
                        {' – '}
                        {pagedays[pagedays.length - 1] && fmtShortDate(pagedays[pagedays.length - 1].date)}
                      </span>
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setWeekPage(i)}
                            className="rounded-full transition-colors cursor-pointer"
                            style={{
                              width: 6, height: 6,
                              background: i === currentPage ? 'var(--amber)' : 'var(--border-mid)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWeekPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="p-1 rounded text-text-dim hover:text-text disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <IconChevronRight size={13} />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-7 gap-2 p-3">
                  {pagedays.map((d) => {
                    const { bg, border } = cardTint(d.conditionCode)
                    const inTrip = d.date >= startDate && d.date <= endDate
                    const dateObj = new Date(d.date + 'T00:00:00')
                    return (
                      <div key={d.date}
                        className="relative rounded-lg overflow-hidden flex flex-col gap-2 p-2.5"
                        style={{
                          background: bg,
                          border: `1px solid ${inTrip ? 'rgba(245,158,11,0.55)' : border}`,
                          minHeight: '112px',
                          boxShadow: inTrip ? 'inset 0 2px 0 rgba(245,158,11,0.45)' : undefined,
                        }}>

                        {/* Background icon — decorative */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                          aria-hidden="true" style={{ opacity: 0.13 }}>
                          <WmoConditionIcon code={d.conditionCode} size={54} />
                        </div>

                        {/* Date */}
                        <div className="relative z-10">
                          <div className="font-mono text-[9px] tracking-[0.08em] uppercase leading-none mb-0.5"
                            style={{ color: inTrip ? 'var(--amber)' : 'var(--text-dim)' }}>
                            {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="font-mono text-[9px] text-text-mid leading-none">
                            {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>

                        {/* High / low */}
                        <div className="relative z-10 flex-1 flex items-center gap-1.5">
                          <span className="font-heading text-[16px] font-extrabold text-text leading-none">{fmtTemp(d.highF, sys)}</span>
                          <span className="font-mono text-[10px] text-text-dim leading-none">{fmtTemp(d.lowF, sys)}</span>
                        </div>

                        {/* Precip + wind */}
                        <div className="relative z-10 space-y-0.5">
                          <div className="font-mono text-[9px] leading-none"
                            style={{ color: d.precipPct >= 40 ? 'var(--sky)' : 'var(--text-dim)', fontWeight: d.precipPct >= 40 ? 600 : undefined }}>
                            {d.precipPct}%
                          </div>
                          <div className="font-mono text-[9px] text-text-dim leading-none">{fmtWind(d.windMph, sys)} {d.windDir}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Departure window */}
          {computedRisk && risk && riskStyle && (
            <div className={`border rounded-lg overflow-hidden ${riskStyle.border} ${riskStyle.bg}`}>
              {/* Verdict */}
              <div className={`flex flex-col items-center gap-1.5 px-[18px] py-5 border-b ${riskStyle.border}`}>
                <div className={`${riskStyle.text}`}>
                  {risk === 'low'
                    ? <IconCheck size={22} />
                    : <IconAlertTriangle size={22} className={riskStyle.text} />
                  }
                </div>
                <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Departure window</div>
                <div className={`font-heading text-[22px] font-extrabold leading-tight ${riskStyle.text}`}>
                  {riskStyle.label}
                </div>
              </div>

              {/* Detail */}
              <div className="px-[18px] py-3.5">
                {computedRisk.factors.length === 0
                  ? <p className="text-[13px] text-text-mid text-center">No significant weather risks in the forecast window.</p>
                  : (
                    <>
                      <ul className="flex flex-col gap-2 text-center">
                        {computedRisk.factors.map((f, i) => (
                          <li key={i}>
                            <span className="font-mono text-[10px] text-text-dim">{fmtShortDate(f.date)}</span>
                            <span className="font-mono text-[10px] text-text-dim mx-1.5">·</span>
                            <span className="text-[13px] text-text-mid">{f.label}</span>
                          </li>
                        ))}
                      </ul>
                      {elevFt !== null && (
                        <p className="font-mono text-[9px] text-text-dim mt-2.5 text-center">
                          Temps adjusted for avg. trip elevation (~{Math.round(elevFt).toLocaleString()} ft)
                        </p>
                      )}
                    </>
                  )
                }
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-surface border border-border rounded-lg p-[18px]">
            <label className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2 block">Weather notes</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-sm text-[12px] bg-surface-2 text-text outline-none focus:border-border-mid transition-colors resize-none leading-relaxed"
              rows={3}
              placeholder="Conditions, concerns, or anything worth noting…"
              value={wd.notes}
              disabled={!canEdit}
              onChange={e => setWd(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>

        {/* ── Right rail ── */}
        <aside className="flex flex-col gap-3.5">

          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
            {checklist.map((c, idx) => {
              const gated = idx === 1 && !inWindow
              return (
                <div key={c.text} title={gated ? `Forecast available ${forecastTargetDate(startDate)}` : undefined} className={gated ? 'opacity-40' : ''}>
                  <CheckItem text={c.text} done={c.done} />
                </div>
              )
            })}
            <div className="h-px bg-border my-3" />
            <ProgressBar value={(doneCount / checklist.length) * 100} tone="pine" />
            <div className="font-mono text-[9px] text-text-dim text-center mt-1.5">{doneCount} of {checklist.length}</div>
          </div>

          {wd.forecastChecked && (
            <div className="flex items-start gap-2.5 px-3 py-3 bg-amber-dim border border-amber-border rounded-lg">
              <IconAlertTriangle size={12} className="text-amber mt-0.5" />
              <p className="text-[11px] text-text-mid leading-relaxed">
                <span className="font-semibold text-amber block mb-0.5">Re-check forecast 72 hrs before departure.</span>
                Conditions can shift fast in the mountains.
              </p>
            </div>
          )}

          <div className="bg-surface border border-border rounded-lg p-3.5 flex flex-col items-center text-center gap-2">
            <span className="text-text-dim mt-0.5 [&>svg]:w-[18px] [&>svg]:h-[18px]"><IconPackage /></span>
            <div>
              <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Gear check</div>
              <p className="text-[11px] text-text-mid leading-relaxed mt-1">
                Review your loadout against the forecast, then mark it adjusted.
              </p>
            </div>
            {canEdit && (
              <button type="button" onClick={() => toggle('gearAdjusted')}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 font-mono text-[9px] rounded border cursor-pointer transition-colors ${wd.gearAdjusted ? 'bg-pine-dim border-pine-border text-pine' : 'bg-surface-2 border-border text-text-dim hover:border-border-mid'}`}>
                {wd.gearAdjusted && <IconCheck size={9} />}
                {wd.gearAdjusted ? 'Gear adjusted ✓' : 'Mark gear adjusted'}
              </button>
            )}
          </div>

        </aside>
      </div>
    </div>
  )
}
