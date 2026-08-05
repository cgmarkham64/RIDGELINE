import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Trip, JournalDay } from '../../types'
import { useSaveJournalDay } from '../../hooks/useJournalDays'
import { api } from '../../lib/api'
import { shareTrip } from '../../lib/users'
import { fToC, cToF, milesToKm, kmToMiles, ftToM, mToFt } from '../../lib/units'
import { useUnitSystem } from '../../hooks/useUnitSystem'
import { HikerOverlay } from '../ui/HikerOverlay'
import { TagInput } from './TagInput'
import { CompanionTagInput } from './CompanionTagInput'

const WEATHER_OPTIONS = [
  'Clear',
  'Sunny',
  'Partly Cloudy',
  'Mostly Cloudy',
  'Overcast',
  'Foggy',
  'Misty',
  'Hazy',
  'Smoky',
  'Drizzle',
  'Light Rain',
  'Rain',
  'Heavy Rain',
  'Thunderstorm',
  'Light Snow',
  'Snow',
  'Heavy Snow',
  'Sleet',
  'Hail',
  'Windy',
  'Blustery',
  'Calm',
]

const schema = z.object({
  title: z.string().optional(),
  weatherNotes: z.string().optional(),
  tempLowF: z.string().optional(),
  tempHighF: z.string().optional(),
  milesCovered: z.string().optional(),
  elevationGainFt: z.string().optional(),
  wakeActual: z.string().refine(v => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), 'Use HH:MM format'),
  onTrailActual: z.string().refine(v => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), 'Use HH:MM format'),
  campActual: z.string().refine(v => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), 'Use HH:MM format'),
  body: z.string().min(1, 'Write something before saving'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  trip: Trip
  currentEntry: JournalDay | undefined
  selectedDate: string
  readOnly?: boolean
}

const DAY_MS = 86_400_000
const SAVED_FEEDBACK_TIMEOUT_MS = 2500

const condInputCls =
  'w-full px-2 py-[6px] border border-border focus:border-border-mid rounded-sm text-body-sm bg-surface text-text outline-none transition-[border-color] duration-[140ms]'

function CondCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-2 border border-border rounded-md px-2.75 py-2.25">
      <div className="font-mono text-label tracking-[0.12em] uppercase text-text-mid mb-1.25">
        {label}
      </div>
      {children}
    </div>
  )
}

function entryToDefaults(entry: JournalDay | undefined, sys: 'imperial' | 'metric') {
  return {
    title: entry?.title ?? '',
    weatherNotes: entry?.weatherNotes ?? '',
    tempLowF: entry?.tempLowF != null
      ? (sys === 'metric' ? fToC(entry.tempLowF) : entry.tempLowF).toString() : '',
    tempHighF: entry?.tempHighF != null
      ? (sys === 'metric' ? fToC(entry.tempHighF) : entry.tempHighF).toString() : '',
    milesCovered: entry?.milesCovered != null
      ? (sys === 'metric' ? milesToKm(entry.milesCovered).toFixed(2) : entry.milesCovered.toString()) : '',
    elevationGainFt: entry?.elevationGainFt != null
      ? (sys === 'metric' ? ftToM(entry.elevationGainFt) : entry.elevationGainFt).toString() : '',
    wakeActual: entry?.wakeActual ?? '',
    onTrailActual: entry?.onTrailActual ?? '',
    campActual: entry?.campActual ?? '',
    body: entry?.body ?? '',
  }
}

type SegmentTimes = { n: number; wakeTime?: string; onTrailTime?: string; campByTime?: string }

function fileToBase64(file: File): Promise<string> {
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

// Keyed by day (currentEntry?._id ?? selectedDate) in the parent so switching days
// remounts this component — form defaults, wildlife, and companions all initialize
// fresh from props instead of needing effects to reset them.
export function JournalEntryForm({ trip, currentEntry, selectedDate, readOnly }: Props) {
  const sys = useUnitSystem()
  const save = useSaveJournalDay(trip._id)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [wildlife, setWildlife] = useState<string[]>(currentEntry?.wildlife ?? [])
  const [companions, setCompanions] = useState<string[]>(currentEntry?.companions ?? [])
  const panelsDirtyRef = useRef(false)
  const pendingShareSubsRef = useRef<string[]>([])
  const [pendingInviteCount, setPendingInviteCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveStartRef = useRef(0)

  const overlayVisible = !readOnly && (scanning || saving)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: entryToDefaults(currentEntry, sys),
  })

  function handleFormBlur(e: React.FocusEvent<HTMLFormElement>) {
    if (readOnly) return
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    if (!isDirty && !panelsDirtyRef.current) return
    if (!getValues('body').trim()) return
    handleSubmit(onSubmit)()
  }

  const MIN_SAVE_OVERLAY_MS = 1000

  async function onSubmit(data: FormValues) {
    if (readOnly) return
    const start = new Date(trip.startDate)
    const sel = new Date(selectedDate)
    const dayNumber = Math.round((sel.getTime() - start.getTime()) / DAY_MS) + 1

    setSaving(true)
    saveStartRef.current = Date.now()

    try {
      await save.mutateAsync({
        id: currentEntry?._id,
        input: {
          tripId: trip._id,
          date: selectedDate,
          dayNumber,
          title: data.title || undefined,
          body: data.body,
          weatherNotes: data.weatherNotes || undefined,
          tempLowF: data.tempLowF ? (sys === 'metric' ? cToF(parseFloat(data.tempLowF)) : parseFloat(data.tempLowF)) : undefined,
          tempHighF: data.tempHighF ? (sys === 'metric' ? cToF(parseFloat(data.tempHighF)) : parseFloat(data.tempHighF)) : undefined,
          milesCovered: data.milesCovered ? (sys === 'metric' ? kmToMiles(parseFloat(data.milesCovered)) : parseFloat(data.milesCovered)) : undefined,
          elevationGainFt: data.elevationGainFt ? (sys === 'metric' ? mToFt(parseFloat(data.elevationGainFt)) : parseFloat(data.elevationGainFt)) : undefined,
          wakeActual:    data.wakeActual    || undefined,
          onTrailActual: data.onTrailActual || undefined,
          campActual:    data.campActual    || undefined,
          wildlife: wildlife.length ? wildlife : undefined,
          companions: companions.length ? companions : undefined,
        },
      })

      const elapsed = Date.now() - saveStartRef.current
      const remaining = MIN_SAVE_OVERLAY_MS - elapsed
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining))
      }

      const subsToShare = pendingShareSubsRef.current.slice()
      pendingShareSubsRef.current = []
      setPendingInviteCount(0)
      for (const sub of subsToShare) {
        try { await shareTrip(trip._id, sub) } catch { /* non-fatal */ }
      }

      setSavedFeedback(true)
      setTimeout(() => setSavedFeedback(false), SAVED_FEEDBACK_TIMEOUT_MS)
    } finally {
      setSaving(false)
    }
  }

  async function handleScanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setScanError(null)
    setScanning(true)

    try {
      const base64 = await fileToBase64(file)
      const { data } = await api.post<Partial<FormValues>>('/api/journal-scan', {
        imageBase64: base64,
        mediaType: file.type,
      })

      if (data.title) setValue('title', data.title, { shouldDirty: true })
      if (data.milesCovered) {
        const mi = parseFloat(String(data.milesCovered))
        setValue('milesCovered', (sys === 'metric' ? milesToKm(mi).toFixed(2) : String(mi)), { shouldDirty: true })
      }
      if (data.elevationGainFt) {
        const ft = parseFloat(String(data.elevationGainFt))
        setValue('elevationGainFt', (sys === 'metric' ? ftToM(ft).toString() : String(ft)), { shouldDirty: true })
      }
      if (data.tempLowF) {
        const f = parseFloat(String(data.tempLowF))
        setValue('tempLowF', (sys === 'metric' ? fToC(f).toString() : String(f)), { shouldDirty: true })
      }
      if (data.tempHighF) {
        const f = parseFloat(String(data.tempHighF))
        setValue('tempHighF', (sys === 'metric' ? fToC(f).toString() : String(f)), { shouldDirty: true })
      }
      if (data.weatherNotes) setValue('weatherNotes', data.weatherNotes, { shouldDirty: true })
      if (data.body) setValue('body', data.body, { shouldDirty: true })

      // Blur any focused field so the auto-save fires while the scan overlay is still up
      ;(document.activeElement as HTMLElement)?.blur()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Scan failed — check the image and try again'
      setScanError(message)
    } finally {
      setScanning(false)
    }
  }

  const start = new Date(trip.startDate)
  const sel = new Date(selectedDate)
  const dayNumber = Math.round((sel.getTime() - start.getTime()) / DAY_MS) + 1

  const routeSegs = ((trip.planStages as { route?: { segments?: SegmentTimes[] } } | undefined)?.route?.segments ?? [])
  const segTimes = routeSegs.find(s => s.n === dayNumber)
  const plannedTimeRows = [
    { label: 'Wake',     planned: segTimes?.wakeTime,    field: 'wakeActual'    as const },
    { label: 'On trail', planned: segTimes?.onTrailTime, field: 'onTrailActual' as const },
    { label: 'Camp by',  planned: segTimes?.campByTime,  field: 'campActual'    as const },
  ].filter(r => r.planned)

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} onBlur={handleFormBlur}>
        <fieldset disabled={!!readOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleScanFile}
        />

        <div className="flex items-baseline gap-2.5 flex-wrap pb-3.5 mb-4.5 border-b border-border">
          <span className="font-heading text-h1 font-extrabold text-amber leading-none tracking-[-0.01em] shrink-0">
            Day {dayNumber}
          </span>
          <input
            {...register('title')}
            placeholder="Add a title…"
            className="font-heading text-lg font-semibold text-text bg-transparent border-0 outline-none flex-1 min-w-30 p-0"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            title="Scan a photo of your journal page to auto-fill this entry"
            className="flex items-center gap-1.25 font-mono text-label tracking-widest uppercase bg-transparent border border-current rounded-sm px-2 py-1 shrink-0"
            style={{
              color: scanning ? 'var(--text-dim)' : 'var(--amber)',
              cursor: scanning ? 'default' : 'pointer',
            }}
          >
            {scanning ? 'Scanning…' : '⊕ Scan page'}
          </button>
        </div>

        {scanError && (
          <p className="text-fine text-red mb-3">{scanError}</p>
        )}

        <div className="grid grid-cols-5 gap-1.5 mb-5.5">
          <CondCell label={sys === 'metric' ? 'Km' : 'Miles'}>
            <input
              type="number"
              step="0.1"
              {...register('milesCovered')}
              placeholder="—"
              className={condInputCls}
            />
          </CondCell>
          <CondCell label={sys === 'metric' ? 'Elev. gain (m)' : 'Elev. gain (ft)'}>
            <input
              type="number"
              step="1"
              {...register('elevationGainFt')}
              placeholder="—"
              className={condInputCls}
            />
          </CondCell>
          <CondCell label={sys === 'metric' ? 'Temp Low (°C)' : 'Temp Low (°F)'}>
            <input
              type="number"
              step="1"
              {...register('tempLowF')}
              placeholder="—"
              className={condInputCls}
            />
          </CondCell>
          <CondCell label={sys === 'metric' ? 'Temp High (°C)' : 'Temp High (°F)'}>
            <input
              type="number"
              step="1"
              {...register('tempHighF')}
              placeholder="—"
              className={condInputCls}
            />
          </CondCell>
          <CondCell label="Weather">
            <>
              <input
                {...register('weatherNotes')}
                list="weather-options"
                placeholder="Clear, Rain…"
                autoComplete="off"
                className={condInputCls}
                onFocus={(e) => { e.target.style.borderColor = 'var(--border-mid)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
              />
              <datalist id="weather-options">
                {WEATHER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} />
                ))}
              </datalist>
            </>
          </CondCell>
        </div>

        {plannedTimeRows.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim shrink-0">Times</span>
              <hr className="flex-1 border-0 border-t border-border" />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {plannedTimeRows.map(({ label, planned, field }) => (
                <div key={field} className="bg-surface-2 border border-border rounded-md px-2.75 py-2.25">
                  <div className="font-mono text-label tracking-[0.12em] uppercase text-text-mid mb-1.25">{label}</div>
                  <div className="font-mono text-label text-text-dim mb-1">Plan: {planned}</div>
                  <input
                    {...register(field)}
                    placeholder="HH:MM"
                    className={condInputCls}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim shrink-0">Field Notes</span>
          <hr className="flex-1 border-0 border-t border-border" />
        </div>
        <div className="border-l-2 border-amber-border pl-4 mb-5">
          <textarea
            {...register('body')}
            rows={12}
            placeholder="Write about your day — the terrain, how you felt, what you saw…"
            className="w-full bg-transparent border-0 outline-none resize-none font-sans italic text-sm leading-[1.82] text-text-mid p-0"
          />
        </div>

        {errors.body && (
          <p className="text-fine text-red mb-3">
            {errors.body.message}
          </p>
        )}

        <div className="flex items-center gap-3 mb-3 mt-1">
          <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim shrink-0">Wildlife</span>
          <hr className="flex-1 border-0 border-t border-border" />
        </div>
        <div className="mb-5">
          <TagInput
            tags={wildlife}
            placeholder="Bear, Marmot, Clark's Nutcracker…"
            onChange={(tags) => { setWildlife(tags); panelsDirtyRef.current = true }}
          />
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim shrink-0">Companions</span>
          <hr className="flex-1 border-0 border-t border-border" />
        </div>
        <div className="mb-5">
          <CompanionTagInput
            tags={companions}
            onChange={(tags) => { setCompanions(tags); panelsDirtyRef.current = true }}
            onMentionAdded={(sub) => {
              if (!pendingShareSubsRef.current.includes(sub)) {
                pendingShareSubsRef.current.push(sub)
                setPendingInviteCount(pendingShareSubsRef.current.length)
              }
            }}
          />
          {pendingInviteCount > 0 && (
            <p className="font-mono text-label text-text-dim mt-2">
              {pendingInviteCount === 1
                ? 'Will send 1 collaboration invite on save'
                : `Will send ${pendingInviteCount} collaboration invites on save`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 justify-end">
          {save.isError && <span className="text-fine text-red">Save failed</span>}
          {savedFeedback && (
            <span className="font-mono text-label tracking-widest uppercase text-pine">
              Saved ✓
            </span>
          )}
          {!currentEntry && (
            <button type="submit" disabled={save.isPending} className="btn btn-primary btn-sm">
              {save.isPending ? 'Saving…' : 'Save entry'}
            </button>
          )}
        </div>
        </fieldset>
      </form>

      {overlayVisible && (
        <HikerOverlay label={scanning ? 'Scanning journal page…' : 'Saving entry…'} />
      )}
    </>
  )
}
