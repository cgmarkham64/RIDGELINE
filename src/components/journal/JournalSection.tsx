import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Trip, JournalDay } from '../../types'
import { useJournalDays, useSaveJournalDay } from '../../hooks/useJournalDays'
import { api } from '../../lib/api'
import { HikerOverlay } from '../ui/HikerOverlay'
import { DaySelector } from './DaySelector'

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
}

const condInput: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  fontSize: 12,
  background: 'var(--surface)',
  color: 'var(--text)',
  outline: 'none',
  transition: 'border-color 0.14s',
}

export function JournalSection({ trip }: Props) {
  const [selectedDate, setSelectedDate] = useState(trip.startDate.slice(0, 10))
  const { data: entries = [], isLoading } = useJournalDays(trip._id)
  const save = useSaveJournalDay(trip._id)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveStartRef = useRef(0)

  const overlayVisible = scanning || saving

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
  }, [selectedDate, currentEntry?._id, reset])

  // Auto-save when focus leaves the form — but only if body has content
  function handleFormBlur(e: React.FocusEvent<HTMLFormElement>) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    if (!isDirty) return
    if (!getValues('body').trim()) return
    handleSubmit(onSubmit)()
  }

  const MIN_SAVE_OVERLAY_MS = 1000

  async function onSubmit(data: FormValues) {
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
        },
      })

      const elapsed = Date.now() - saveStartRef.current
      const remaining = MIN_SAVE_OVERLAY_MS - elapsed
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining))
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
    // Reset so the same file can be re-selected if needed
    e.target.value = ''

    setScanError(null)
    setScanning(true)

    try {
      const base64 = await fileToBase64(file)
      const { data } = await api.post<Partial<FormValues>>('/api/journal-scan', {
        imageBase64: base64,
        mediaType: file.type,
      })

      // Populate whichever fields the AI returned
      if (data.title) setValue('title', data.title, { shouldDirty: true })
      if (data.milesCovered)
        setValue('milesCovered', String(data.milesCovered), { shouldDirty: true })
      if (data.elevationGainFt)
        setValue('elevationGainFt', String(data.elevationGainFt), { shouldDirty: true })
      if (data.tempLowF) setValue('tempLowF', String(data.tempLowF), { shouldDirty: true })
      if (data.tempHighF) setValue('tempHighF', String(data.tempHighF), { shouldDirty: true })
      if (data.weatherNotes) setValue('weatherNotes', data.weatherNotes, { shouldDirty: true })
      if (data.body) setValue('body', data.body, { shouldDirty: true })

      // Blur any focused form field so the auto-save fires now (while the
      // scan overlay is still up) rather than when the user next clicks elsewhere.
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

      {isLoading ? (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-dim)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Loading…
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} onBlur={handleFormBlur}>
          {/* Hidden file input for journal scan */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleScanFile}
          />

          {/* Entry header: "Day N" + title input + scan button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              flexWrap: 'wrap',
              paddingBottom: 14,
              marginBottom: 18,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--amber)',
                lineHeight: 1,
                letterSpacing: '-0.01em',
                flexShrink: 0,
              }}
            >
              Day {dayNumber}
            </span>
            <input
              {...register('title')}
              placeholder="Add a title…"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--text)',
                background: 'none',
                border: 'none',
                outline: 'none',
                flex: 1,
                minWidth: 120,
                padding: 0,
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              title="Scan a photo of your journal page to auto-fill this entry"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: scanning ? 'var(--text-dim)' : 'var(--amber)',
                background: 'none',
                border: '1px solid currentColor',
                borderRadius: 'var(--r-sm)',
                padding: '4px 8px',
                cursor: scanning ? 'default' : 'pointer',
                flexShrink: 0,
              }}
            >
              {scanning ? 'Scanning…' : '⊕ Scan page'}
            </button>
          </div>

          {scanError && (
            <p style={{ fontSize: 11, color: 'var(--red)', marginBottom: 12 }}>{scanError}</p>
          )}

          {/* Conditions — 5 columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 6,
              marginBottom: 22,
            }}
          >
            <CondCell label="Miles">
              <input
                type="number"
                step="0.1"
                {...register('milesCovered')}
                placeholder="—"
                style={condInput}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-mid)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)'
                }}
              />
            </CondCell>
            <CondCell label="Elev. gain (ft)">
              <input
                type="number"
                step="1"
                {...register('elevationGainFt')}
                placeholder="—"
                style={condInput}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-mid)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)'
                }}
              />
            </CondCell>
            <CondCell label="Temp Low (°F)">
              <input
                type="number"
                step="1"
                {...register('tempLowF')}
                placeholder="—"
                style={condInput}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-mid)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)'
                }}
              />
            </CondCell>
            <CondCell label="Temp High (°F)">
              <input
                type="number"
                step="1"
                {...register('tempHighF')}
                placeholder="—"
                style={condInput}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-mid)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)'
                }}
              />
            </CondCell>
            <CondCell label="Weather">
              <>
                <input
                  {...register('weatherNotes')}
                  list="weather-options"
                  placeholder="Clear, Rain…"
                  autoComplete="off"
                  style={condInput}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--border-mid)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)'
                  }}
                />
                <datalist id="weather-options">
                  {WEATHER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              </>
            </CondCell>
          </div>

          {/* Narrative */}
          <div
            style={{
              borderLeft: '2px solid var(--amber-border)',
              paddingLeft: 16,
              marginBottom: 20,
            }}
          >
            <textarea
              {...register('body')}
              rows={12}
              placeholder="Write about your day — the terrain, how you felt, what you saw…"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: 'var(--font-sans)',
                fontStyle: 'italic',
                fontSize: 14,
                lineHeight: 1.82,
                color: 'var(--text-mid)',
                padding: 0,
              }}
            />
          </div>

          {errors.body && (
            <p style={{ fontSize: 11, color: 'var(--red)', marginBottom: 12 }}>
              {errors.body.message}
            </p>
          )}

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}
          >
            {save.isError && <span style={{ fontSize: 11, color: 'var(--red)' }}>Save failed</span>}
            {savedFeedback && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--pine)',
                }}
              >
                Saved ✓
              </span>
            )}
            {!currentEntry && (
              <button type="submit" disabled={save.isPending} className="btn btn-primary btn-sm">
                {save.isPending ? 'Saving…' : 'Save entry'}
              </button>
            )}
          </div>
        </form>
      )}

      {overlayVisible && (
        <HikerOverlay label={scanning ? 'Scanning journal page…' : 'Saving entry…'} />
      )}
    </section>
  )
}

function CondCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '9px 11px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-mid)',
          marginBottom: 5,
        }}
      >
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
      const result = reader.result as string
      // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
