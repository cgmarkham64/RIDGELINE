import { Fragment } from 'react'
import type { WeatherTolerances } from '../../../types/auth'
import { fToC, cToF, mphToKmh, kmhToMph, type UnitSystem } from '../../../lib/units'
import { InfoTooltip } from './InfoTooltip'

const TEMP_MIN_C = -50
const TEMP_MIN_F = -60
const TEMP_MAX_C = 50
const TEMP_MAX_F = 120
const PRECIP_MAX_PCT = 100
const WIND_MAX_KMH = 320
const WIND_MAX_MPH = 200

const TOLERANCE_ROWS: Array<{
  label: string
  cautionKey: keyof WeatherTolerances
  delayKey: keyof WeatherTolerances
  defaultCaution: number
  defaultDelay: number
  unitLabel: (sys: UnitSystem) => string
  toDisplay: (v: number, sys: UnitSystem) => number
  fromDisplay: (v: number, sys: UnitSystem) => number
  min: (sys: UnitSystem) => number
  max: (sys: UnitSystem) => number
  dir: '<' | '>'
}> = [
  {
    label: 'Temp',
    cautionKey: 'tempCautionF', delayKey: 'tempDelayF',
    defaultCaution: 45, defaultDelay: 32,
    unitLabel: sys => sys === 'metric' ? '°C' : '°F',
    toDisplay: (v, sys) => sys === 'metric' ? fToC(v) : v,
    fromDisplay: (v, sys) => sys === 'metric' ? cToF(v) : v,
    min: sys => sys === 'metric' ? TEMP_MIN_C : TEMP_MIN_F,
    max: sys => sys === 'metric' ? TEMP_MAX_C : TEMP_MAX_F,
    dir: '<',
  },
  {
    label: 'Precip',
    cautionKey: 'precipCautionPct', delayKey: 'precipDelayPct',
    defaultCaution: 40, defaultDelay: 70,
    unitLabel: () => '%',
    toDisplay: v => v, fromDisplay: v => v,
    min: () => 0, max: () => PRECIP_MAX_PCT,
    dir: '>',
  },
  {
    label: 'Wind',
    cautionKey: 'windCautionMph', delayKey: 'windDelayMph',
    defaultCaution: 30, defaultDelay: 45,
    unitLabel: sys => sys === 'metric' ? 'km/h' : 'mph',
    toDisplay: (v, sys) => sys === 'metric' ? mphToKmh(v) : v,
    fromDisplay: (v, sys) => sys === 'metric' ? kmhToMph(v) : v,
    min: () => 0,
    max: sys => sys === 'metric' ? WIND_MAX_KMH : WIND_MAX_MPH,
    dir: '>',
  },
]

const toggleCls = (on: boolean) =>
  `w-3 h-3 rounded-[2px] border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
    on ? 'bg-amber border-amber' : 'bg-surface-2 border-border-mid hover:border-amber'
  }`
const inputCls = (on: boolean) =>
  `bg-surface-2 border border-border rounded-sm py-1.5 font-mono text-fine text-center w-full outline-none transition-opacity ${
    on ? 'text-text focus:border-amber' : 'text-text-dim opacity-40 cursor-not-allowed'
  }`
const dimCls = (on: boolean) => `font-mono text-caption text-text-dim text-right transition-opacity ${on ? '' : 'opacity-30'}`
const unitCls = (on: boolean) => `font-mono text-label text-text-dim transition-opacity ${on ? '' : 'opacity-30'}`

export function WeatherToleranceGrid({ tolerances, unitSystem, onChange }: {
  tolerances: WeatherTolerances
  unitSystem: UnitSystem
  onChange: (patch: Partial<WeatherTolerances>) => void
}) {
  return (
    <div className="border-t border-border pt-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Weather tolerances</label>
        <InfoTooltip text="Sets your Go / Caution / Delay thresholds in the Weather stage. Temp triggers on forecast lows; precip and wind trigger above the set value." />
      </div>
      {/* 9-col grid: [label] [toggle] [dir] [input] [unit] [toggle] [dir] [input] [unit] */}
      <div className="grid items-center gap-x-1.5 gap-y-2"
        style={{ gridTemplateColumns: '44px 14px 10px 46px 18px 14px 10px 46px 18px' }}>
        <span /><span /><span />
        <span className="font-mono text-label text-amber/70 text-center">Caution</span>
        <span /><span /><span />
        <span className="font-mono text-label text-red/60 text-center">Delay</span>
        <span />
        {TOLERANCE_ROWS.map(row => {
          const cautionVal = tolerances[row.cautionKey]
          const delayVal   = tolerances[row.delayKey]
          const cautionOn  = cautionVal !== null
          const delayOn    = delayVal   !== null
          const cautionDisplay = cautionVal !== null ? row.toDisplay(cautionVal, unitSystem) : row.toDisplay(row.defaultCaution, unitSystem)
          const delayDisplay   = delayVal   !== null ? row.toDisplay(delayVal, unitSystem)   : row.toDisplay(row.defaultDelay, unitSystem)
          return (
            <Fragment key={row.label}>
              <span className="font-mono text-fine text-text-mid">{row.label}</span>
              <button type="button" onClick={() => onChange({ [row.cautionKey]: cautionOn ? null : row.defaultCaution })} className={toggleCls(cautionOn)}>
                {cautionOn && <span className="text-[6px] text-surface font-bold leading-none select-none">✓</span>}
              </button>
              <span className={dimCls(cautionOn)}>{row.dir}</span>
              <input type="number" disabled={!cautionOn}
                value={cautionDisplay}
                min={row.min(unitSystem)} max={row.max(unitSystem)}
                onChange={e => onChange({ [row.cautionKey]: row.fromDisplay(Number(e.target.value), unitSystem) })}
                className={inputCls(cautionOn)}
              />
              <span className={unitCls(cautionOn)}>{row.unitLabel(unitSystem)}</span>
              <button type="button" onClick={() => onChange({ [row.delayKey]: delayOn ? null : row.defaultDelay })} className={toggleCls(delayOn)}>
                {delayOn && <span className="text-[6px] text-surface font-bold leading-none select-none">✓</span>}
              </button>
              <span className={dimCls(delayOn)}>{row.dir}</span>
              <input type="number" disabled={!delayOn}
                value={delayDisplay}
                min={row.min(unitSystem)} max={row.max(unitSystem)}
                onChange={e => onChange({ [row.delayKey]: row.fromDisplay(Number(e.target.value), unitSystem) })}
                className={inputCls(delayOn)}
              />
              <span className={unitCls(delayOn)}>{row.unitLabel(unitSystem)}</span>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
