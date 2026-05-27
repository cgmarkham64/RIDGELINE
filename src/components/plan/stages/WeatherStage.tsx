import { useState, useEffect, useRef, useMemo } from 'react'
import type { StageBodyProps, PlanWeatherData } from '../types'
import { CheckItem } from '../CheckItem'
import { ProgressBar } from '../ProgressBar'
import { JumpChip } from '../JumpChip'
import { IconAlertTriangle, IconCalendar, IconCheck } from '../../icons'
import { nominatimGeocode } from '../../../lib/geocode'
import { tripSunRows } from '../../../lib/sun'
import {
  isGeocodeCacheValid, isClimateCacheValid, isForecastCacheValid,
  parseClimateNormals, parseForecastDays, calcDepartureRisk,
  avgElevationFt, inForecastWindow, forecastTargetDate, daysUntil,
} from './weatherStage.helpers'
import type { ClimateNormals } from './weatherStage.types'

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

// ─── WeatherStage ─────────────────────────────────────────────────────────────

export function WeatherStage({ onJump, plan, onChange, onProgress, trip, canEdit = true, onEditTrip }: StageBodyProps) {
  const tripLoc = trip?.location ?? ''

  const [wd, setWd] = useState<PlanWeatherData>(() => {
    const base = plan?.weather ?? INITIAL_WEATHER
    // Pre-compute departure risk if cached forecast exists but risk wasn't stored
    if (base.cachedForecast && base.departureRisk === null && trip?.startDate && trip?.endDate) {
      const { overall } = calcDepartureRisk(
        base.cachedForecast.days, trip.startDate, trip.endDate, avgElevationFt(trip),
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

  const onChangeRef   = useRef(onChange)
  const onProgressRef = useRef(onProgress)
  const isMounted     = useRef(false)
  const wdRef         = useRef(wd)

  useEffect(() => { onChangeRef.current   = onChange })
  useEffect(() => { onProgressRef.current = onProgress })
  useEffect(() => { wdRef.current = wd }, [wd])

  const hasDates  = !!(trip?.startDate && trip?.endDate)
  const tripMonth = hasDates ? new Date(trip!.startDate + 'T00:00:00').getMonth() + 1 : null
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
    if (!coordsLat || !coordsLng || !tripLoc || !trip?.startDate || !trip?.endDate) return
    if (!inForecastWindow(trip.startDate)) return
    if (isForecastCacheValid(wdRef.current.cachedForecast, tripLoc)) return
    const startDate = trip.startDate
    const endDate   = trip.endDate
    const elevFt    = avgElevationFt(trip)
    let cancelled   = false
    fetchForecast(coordsLat, coordsLng)
      .then(days => {
        if (cancelled) return
        setForecastError(false)
        const { overall } = calcDepartureRisk(days, startDate, endDate, elevFt)
        setWd(prev => ({
          ...prev,
          cachedForecast: { days, fetchedAt: new Date().toISOString(), forLocation: tripLoc },
          departureRisk: overall,
        }))
      })
      .catch(() => { if (!cancelled) setForecastError(true) })
    return () => { cancelled = true }
  }, [coordsLat, coordsLng, tripLoc, trip?.startDate, trip?.endDate, trip])

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

  // Factors list for display — recomputed from cached forecast + current trip dates
  const computedRisk = useMemo(() => {
    if (!wd.cachedForecast || !trip?.startDate || !trip?.endDate) return null
    return calcDepartureRisk(wd.cachedForecast.days, trip.startDate, trip.endDate, avgElevationFt(trip))
  }, [wd.cachedForecast, trip])

  const sunRows = useMemo(() => {
    if (!coordsLat || !coordsLng || !hasDates) return []
    return tripSunRows(coordsLat, coordsLng, trip!.startDate, trip!.endDate)
  }, [coordsLat, coordsLng, hasDates, trip])

  function toggle(field: 'historicalReviewed' | 'forecastChecked' | 'sunriseReviewed' | 'gearAdjusted') {
    if (!canEdit) return
    setWd(prev => ({ ...prev, [field]: !prev[field] }))
  }

  // Derived loading indicators — no separate loading state needed
  const geoLoading      = !!tripLoc && (!wd.cachedCoords  || wd.cachedCoords.forLocation  !== tripLoc) && !geoError
  const climateLoading  = !!coordsLat && !!tripMonth && (!wd.cachedClimate  || wd.cachedClimate.forLocation  !== tripLoc) && !climateError
  const forecastLoading = !!coordsLat && inForecastWindow(trip?.startDate ?? '') && (!wd.cachedForecast || wd.cachedForecast.forLocation !== tripLoc) && !forecastError

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

  const climate   = wd.cachedClimate
  const forecast  = wd.cachedForecast
  const doneCount = checklist.filter(c => c.done).length
  const inWindow  = inForecastWindow(trip!.startDate)
  const daysAway  = daysUntil(trip!.startDate)
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
                {new Date(trip!.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' – '}
                {new Date(trip!.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}{sunRows.length} day{sunRows.length !== 1 ? 's' : ''}
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
                Typical {new Date(trip!.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long' })} · 3-yr avg
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
                {([
                  { v: `${climate.avgHighF}°F`, l: 'avg high'    },
                  { v: `${climate.avgLowF}°F`,  l: 'avg low'     },
                  { v: `${climate.precipPct}%`, l: 'precip days' },
                  { v: climate.snowLikely ? 'likely' : 'rare',   l: 'snow' },
                ] as const).map(s => (
                  <div key={s.l} className="bg-surface px-3 py-2">
                    <div className="font-heading text-[16px] font-extrabold text-amber leading-none">{s.v}</div>
                    <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sunrise / sunset table */}
          {sunRows.length > 0 && coordsLng != null && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Sunrise · Sunset · Daylight</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[9px] text-text-dim">
                    feeds <JumpChip to="depart" onJump={onJump}>Depart</JumpChip> schedule
                  </span>
                  {canEdit && (
                    <button type="button" onClick={() => toggle('sunriseReviewed')}
                      className={`flex items-center gap-1.5 px-2 py-0.5 font-mono text-[9px] rounded border cursor-pointer transition-colors ${wd.sunriseReviewed ? 'bg-pine-dim border-pine-border text-pine' : 'bg-surface-2 border-border text-text-dim hover:border-border-mid'}`}>
                      Noted
                    </button>
                  )}
                </div>
              </div>
              {sunRows.map((row, i) => (
                <div key={i} className={`grid grid-cols-[90px_1fr_1fr_70px] gap-3 px-4 py-2 items-center ${i < sunRows.length - 1 ? 'border-b border-border' : ''}`}>
                  <span className="font-mono text-[9px] text-amber font-bold">
                    {row.date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="font-mono text-[11px] text-text">{fmtSolarTime(row.sunrise, coordsLng)}</span>
                  <span className="font-mono text-[11px] text-text">{fmtSolarTime(row.sunset, coordsLng)}</span>
                  <span className="font-mono text-[11px] text-text-dim">{row.daylightHours.toFixed(1)} h</span>
                </div>
              ))}
            </div>
          )}

          {/* Live forecast / placeholder */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">10-Day Forecast</span>
              {inWindow && canEdit && (
                <button type="button" onClick={() => toggle('forecastChecked')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9px] rounded border cursor-pointer transition-colors ${wd.forecastChecked ? 'bg-pine-dim border-pine-border text-pine' : 'bg-surface-2 border-border text-text-dim hover:border-border-mid'}`}>
                  {wd.forecastChecked && <IconCheck size={9} />} Checked
                </button>
              )}
            </div>
            {!inWindow && (
              <div className="px-4 py-6 text-center">
                <div className="font-heading text-[15px] font-bold text-text mb-1">Not in forecast range yet.</div>
                <div className="font-mono text-[11px] text-text-mid">
                  Check back <span className="text-amber font-semibold">{forecastTargetDate(trip!.startDate)}</span>
                  {daysAway > 14 ? ` · ${daysAway - 14} days from now` : ''}
                </div>
              </div>
            )}
            {inWindow && forecastLoading && <div className="font-mono text-[11px] text-text-dim py-6 text-center">Loading forecast…</div>}
            {inWindow && forecastError   && <div className="font-mono text-[11px] text-red py-6 text-center">Failed to load forecast.</div>}
            {inWindow && forecast && forecast.days.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {['Date', 'High', 'Low', 'Precip', 'Condition', 'Wind'].map(h => (
                        <th key={h} className="px-3 py-1.5 font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim text-left font-normal whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.days.map((d, i) => (
                      <tr key={d.date} className={i < forecast.days.length - 1 ? 'border-b border-border' : ''}>
                        <td className="px-3 py-1.5 font-mono text-[10px] text-amber font-semibold whitespace-nowrap">{fmtShortDate(d.date)}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-text">{d.highF}°</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-text-mid">{d.lowF}°</td>
                        <td className="px-3 py-1.5 font-mono text-[11px]">
                          <span className={d.precipPct > 40 ? 'text-sky font-semibold' : 'text-text-mid'}>{d.precipPct}%</span>
                        </td>
                        <td className="px-3 py-1.5 text-[11px] text-text-mid whitespace-nowrap">{d.conditionLabel}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-text-mid whitespace-nowrap">{d.windMph} mph {d.windDir}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Departure window */}
          {computedRisk && risk && riskStyle && (
            <div className={`border rounded-lg p-[18px] ${riskStyle.border} ${riskStyle.bg}`}>
              <div className={`flex items-center gap-2.5 mb-2 ${riskStyle.text}`}>
                {risk === 'low'
                  ? <IconCheck size={14} />
                  : <IconAlertTriangle size={14} className={riskStyle.text} />
                }
                <span className="font-heading text-[15px] font-extrabold">
                  Departure window: {riskStyle.label}
                </span>
              </div>
              {computedRisk.factors.length === 0
                ? <p className="text-[12px] text-text-mid">No significant weather risks in the forecast window.</p>
                : (
                  <ul className="flex flex-col gap-1 mt-1">
                    {computedRisk.factors.map((f, i) => (
                      <li key={i} className={`flex items-center gap-2 text-[11px] ${riskStyle.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
                        <span className="font-mono text-[9px] text-text-dim">{fmtShortDate(f.date)}</span>
                        <span className="text-text-mid">{f.label}</span>
                      </li>
                    ))}
                  </ul>
                )
              }
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
                <div key={c.text} title={gated ? `Forecast available ${forecastTargetDate(trip!.startDate)}` : undefined} className={gated ? 'opacity-40' : ''}>
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

          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2">Gear check</div>
            <p className="text-[11px] text-text-mid leading-relaxed mb-2.5">
              After reviewing your loadout against the forecast, mark gear adjusted.
            </p>
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
