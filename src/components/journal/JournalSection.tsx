import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Trip, JournalDay } from '../../types'
import { useJournalDays, useSaveJournalDay } from '../../hooks/useJournalDays'
import { api } from '../../lib/api'
import { shareTrip } from '../../lib/users'
import { HikerOverlay } from '../ui/HikerOverlay'
import { MoonLoader } from '../ui/MoonLoader'
import { DaySelector } from './DaySelector'
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
  body: z.string().min(1, 'Write something before saving'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  trip: Trip
  readOnly?: boolean
}

const condInputCls =
  'w-full px-2 py-[6px] border border-border focus:border-border-mid rounded-sm text-[12px] bg-surface text-text outline-none transition-[border-color] duration-[140ms]'

function CondCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-2 border border-border rounded-md px-2.75 py-2.25">
      <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-mid mb-1.25">
        {label}
      </div>
      {children}
    </div>
  )
}

function entryToDefaults(entry: JournalDay | undefined) {
  return {
    title: entry?.title ?? '',
    weatherNotes: entry?.weatherNotes ?? '',
    tempLowF: entry?.tempLowF?.toString() ?? '',
    tempHighF: entry?.tempHighF?.toString() ?? '',
    milesCovered: entry?.milesCovered?.toString() ?? '',
    elevationGainFt: entry?.elevationGainFt?.toString() ?? '',
    body: entry?.body ?? '',
  }
}

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

export function JournalSection({ trip, readOnly }: Props) {
  const [selectedDate, setSelectedDate] = useState(trip.startDate.slice(0, 10))
  const { data: entries = [], isLoading } = useJournalDays(trip._id)
  const save = useSaveJournalDay(trip._id)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [wildlife, setWildlife] = useState<string[]>([])
  const [companions, setCompanions] = useState<string[]>([])
  const panelsDirtyRef = useRef(false)
  const pendingShareSubsRef = useRef<string[]>([])
  const [pendingInviteCount, setPendingInviteCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveStartRef = useRef(0)

  useEffect(() => {
    setSelectedDate(trip.startDate.slice(0, 10))
  }, [trip._id, trip.startDate])

  const overlayVisible = !readOnly && (scanning || saving)

  const currentEntry = entries.find((e) => e.date.slice(0, 10) === selectedDate)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: entryToDefaults(currentEntry),
  })

  useEffect(() => {
    reset(entryToDefaults(currentEntry))
    setWildlife(currentEntry?.wildlife ?? [])
    setCompanions(currentEntry?.companions ?? [])
    panelsDirtyRef.current = false
    pendingShareSubsRef.current = []
    setPendingInviteCount(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, currentEntry?._id, reset]) // intentional: re-run on ID change only, not every mutation

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
    const dayNumber = Math.round((sel.getTime() - start.getTime()) / 86_400_000) + 1

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
          tempLowF: data.tempLowF ? parseFloat(data.tempLowF) : undefined,
          tempHighF: data.tempHighF ? parseFloat(data.tempHighF) : undefined,
          milesCovered: data.milesCovered ? parseFloat(data.milesCovered) : undefined,
          elevationGainFt: data.elevationGainFt ? parseFloat(data.elevationGainFt) : undefined,
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
      setTimeout(() => setSavedFeedback(false), 2500)
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
      if (data.milesCovered)
        setValue('milesCovered', String(data.milesCovered), { shouldDirty: true })
      if (data.elevationGainFt)
        setValue('elevationGainFt', String(data.elevationGainFt), { shouldDirty: true })
      if (data.tempLowF) setValue('tempLowF', String(data.tempLowF), { shouldDirty: true })
      if (data.tempHighF) setValue('tempHighF', String(data.tempHighF), { shouldDirty: true })
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
  const dayNumber = Math.round((sel.getTime() - start.getTime()) / 86_400_000) + 1

  return (
    <section>
      <div className="sec-label">Journal</div>

      <DaySelector
        startDate={trip.startDate}
        endDate={trip.endDate}
        selectedDate={selectedDate}
        entries={entries}
        onSelect={(date) => setSelectedDate(date)}
      />

      {readOnly && (
        <div className="mb-4 px-3 py-2 rounded border border-border bg-surface-2 font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">
          View only — you have view access to this trip
        </div>
      )}

      {isLoading ? (
        <MoonLoader />
      ) : (
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
            <span className="font-heading text-[28px] font-extrabold text-amber leading-none tracking-[-0.01em] shrink-0">
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
              className="flex items-center gap-1.25 font-mono text-[9px] tracking-widest uppercase bg-transparent border border-current rounded-sm px-2 py-1 shrink-0"
              style={{
                color: scanning ? 'var(--text-dim)' : 'var(--amber)',
                cursor: scanning ? 'default' : 'pointer',
              }}
            >
              {scanning ? 'Scanning…' : '⊕ Scan page'}
            </button>
          </div>

          {scanError && (
            <p className="text-[11px] text-red mb-3">{scanError}</p>
          )}

          <div className="grid grid-cols-5 gap-1.5 mb-5.5">
            <CondCell label="Miles">
              <input
                type="number"
                step="0.1"
                {...register('milesCovered')}
                placeholder="—"
                className={condInputCls}
              />
            </CondCell>
            <CondCell label="Elev. gain (ft)">
              <input
                type="number"
                step="1"
                {...register('elevationGainFt')}
                placeholder="—"
                className={condInputCls}
              />
            </CondCell>
            <CondCell label="Temp Low (°F)">
              <input
                type="number"
                step="1"
                {...register('tempLowF')}
                placeholder="—"
                className={condInputCls}
              />
            </CondCell>
            <CondCell label="Temp High (°F)">
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

          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim shrink-0">Field Notes</span>
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
            <p className="text-[11px] text-red mb-3">
              {errors.body.message}
            </p>
          )}

          <div className="flex items-center gap-3 mb-3 mt-1">
            <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim shrink-0">Wildlife</span>
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
            <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim shrink-0">Companions</span>
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
              <p className="font-mono text-[9px] text-text-dim mt-2">
                {pendingInviteCount === 1
                  ? 'Will send 1 collaboration invite on save'
                  : `Will send ${pendingInviteCount} collaboration invites on save`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 justify-end">
            {save.isError && <span className="text-[11px] text-red">Save failed</span>}
            {savedFeedback && (
              <span className="font-mono text-[9px] tracking-widest uppercase text-pine">
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
      )}

      {overlayVisible && (
        <HikerOverlay label={scanning ? 'Scanning journal page…' : 'Saving entry…'} />
      )}
    </section>
  )
}