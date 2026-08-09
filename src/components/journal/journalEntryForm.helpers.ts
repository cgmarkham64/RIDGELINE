import type { Trip, JournalDay } from '../../types'
import type { JournalDayInput } from '../../lib/journalDays'
import { fToC, cToF, milesToKm, kmToMiles, ftToM, mToFt } from '../../lib/units'
import type { FormValues, SegmentTimes, PlannedTimeRow } from './journalEntryForm.types'

export const WEATHER_OPTIONS = [
  'Clear', 'Sunny', 'Partly Cloudy', 'Mostly Cloudy', 'Overcast', 'Foggy', 'Misty', 'Hazy', 'Smoky',
  'Drizzle', 'Light Rain', 'Rain', 'Heavy Rain', 'Thunderstorm',
  'Light Snow', 'Snow', 'Heavy Snow', 'Sleet', 'Hail', 'Windy', 'Blustery', 'Calm',
]

export const DAY_MS = 86_400_000
export const SAVED_FEEDBACK_TIMEOUT_MS = 2500
export const MIN_SAVE_OVERLAY_MS = 1000

export const condInputCls =
  'w-full px-2 py-[6px] border border-border focus:border-border-mid rounded-sm text-body-sm bg-surface text-text outline-none transition-[border-color] duration-[140ms]'

export function computeDayNumber(startDate: string, selectedDate: string): number {
  const start = new Date(startDate)
  const sel = new Date(selectedDate)
  return Math.round((sel.getTime() - start.getTime()) / DAY_MS) + 1
}

// Converts a stored imperial value into the display unit system, formatted for a text input.
// `decimals` only applies to the converted (metric) value — imperial always displays the raw number.
function numDefault(value: number | undefined, convert: (v: number) => number, sys: 'imperial' | 'metric', decimals?: number): string {
  if (value == null) return ''
  if (sys !== 'metric') return value.toString()
  const v = convert(value)
  return decimals != null ? v.toFixed(decimals) : v.toString()
}

// Parses a text input value in the display unit system back to the stored imperial value.
function numToSave(value: string | undefined, convert: (v: number) => number, sys: 'imperial' | 'metric'): number | undefined {
  if (!value) return undefined
  const n = parseFloat(value)
  return sys === 'metric' ? convert(n) : n
}

const MILES_DECIMALS = 2

const EMPTY_DEFAULTS: FormValues = {
  title: '', weatherNotes: '', tempLowF: '', tempHighF: '', milesCovered: '', elevationGainFt: '',
  wakeActual: '', onTrailActual: '', campActual: '', body: '',
}

export function entryToDefaults(entry: JournalDay | undefined, sys: 'imperial' | 'metric'): FormValues {
  if (!entry) return EMPTY_DEFAULTS
  return {
    title: entry.title ?? '',
    weatherNotes: entry.weatherNotes ?? '',
    tempLowF: numDefault(entry.tempLowF, fToC, sys),
    tempHighF: numDefault(entry.tempHighF, fToC, sys),
    milesCovered: numDefault(entry.milesCovered, milesToKm, sys, MILES_DECIMALS),
    elevationGainFt: numDefault(entry.elevationGainFt, ftToM, sys),
    wakeActual: entry.wakeActual ?? '',
    onTrailActual: entry.onTrailActual ?? '',
    campActual: entry.campActual ?? '',
    body: entry.body ?? '',
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') { reject(new Error('Unexpected FileReader result type')); return }
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function buildSaveInput(
  data: FormValues,
  trip: Trip,
  selectedDate: string,
  dayNumber: number,
  sys: 'imperial' | 'metric',
  wildlife: string[],
  companions: string[],
): JournalDayInput {
  return {
    tripId: trip._id,
    date: selectedDate,
    dayNumber,
    title: data.title || undefined,
    body: data.body,
    weatherNotes: data.weatherNotes || undefined,
    tempLowF: numToSave(data.tempLowF, cToF, sys),
    tempHighF: numToSave(data.tempHighF, cToF, sys),
    milesCovered: numToSave(data.milesCovered, kmToMiles, sys),
    elevationGainFt: numToSave(data.elevationGainFt, mToFt, sys),
    wakeActual: data.wakeActual || undefined,
    onTrailActual: data.onTrailActual || undefined,
    campActual: data.campActual || undefined,
    wildlife: wildlife.length ? wildlife : undefined,
    companions: companions.length ? companions : undefined,
  }
}

export function buildPlannedTimeRows(trip: Trip, dayNumber: number): PlannedTimeRow[] {
  const routeSegs = ((trip.planStages as { route?: { segments?: SegmentTimes[] } } | undefined)?.route?.segments ?? [])
  const segTimes = routeSegs.find(s => s.n === dayNumber)
  return [
    { label: 'Wake',     planned: segTimes?.wakeTime,    field: 'wakeActual'    as const },
    { label: 'On trail', planned: segTimes?.onTrailTime, field: 'onTrailActual' as const },
    { label: 'Camp by',  planned: segTimes?.campByTime,  field: 'campActual'    as const },
  ].filter(r => r.planned)
}

type ScannedSetValue = (field: keyof FormValues, value: string, opts: { shouldDirty: true }) => void

// `decimals` only applies to the converted (metric) value — imperial always displays the raw number.
function setScannedNumField(
  field: keyof FormValues,
  raw: string | undefined,
  convert: (v: number) => number,
  sys: 'imperial' | 'metric',
  decimals: number | undefined,
  setValue: ScannedSetValue,
): void {
  if (!raw) return
  const n = parseFloat(raw)
  if (sys !== 'metric') { setValue(field, n.toString(), { shouldDirty: true }); return }
  const v = convert(n)
  setValue(field, decimals != null ? v.toFixed(decimals) : v.toString(), { shouldDirty: true })
}

export function applyScannedFields(
  data: Partial<FormValues>,
  sys: 'imperial' | 'metric',
  setValue: ScannedSetValue,
): void {
  if (data.title) setValue('title', data.title, { shouldDirty: true })
  setScannedNumField('milesCovered', data.milesCovered, milesToKm, sys, MILES_DECIMALS, setValue)
  setScannedNumField('elevationGainFt', data.elevationGainFt, ftToM, sys, undefined, setValue)
  setScannedNumField('tempLowF', data.tempLowF, fToC, sys, undefined, setValue)
  setScannedNumField('tempHighF', data.tempHighF, fToC, sys, undefined, setValue)
  if (data.weatherNotes) setValue('weatherNotes', data.weatherNotes, { shouldDirty: true })
  if (data.body) setValue('body', data.body, { shouldDirty: true })
}
