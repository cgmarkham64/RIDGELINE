import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Trip, JournalDay } from '../../types'
import { useJournalDays, useSaveJournalDay } from '../../hooks/useJournalDays'
import { api } from '../../lib/api'
import { searchUsers, shareTrip, type UserSearchResult } from '../../lib/users'
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

// Shared className for condition inputs
const condInputCls =
  'w-full px-2 py-[6px] border border-border focus:border-border-mid rounded-sm text-[12px] bg-surface text-text outline-none transition-[border-color] duration-[140ms]'

export function JournalSection({ trip }: Props) {
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveStartRef = useRef(0)

  useEffect(() => {
    setSelectedDate(trip.startDate.slice(0, 10))
  }, [trip._id, trip.startDate])

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
    setWildlife(currentEntry?.wildlife ?? [])
    setCompanions(currentEntry?.companions ?? [])
    panelsDirtyRef.current = false
    pendingShareSubsRef.current = []
  }, [selectedDate, currentEntry?._id, reset])

  // Auto-save when focus leaves the form — but only if body has content
  function handleFormBlur(e: React.FocusEvent<HTMLFormElement>) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    if (!isDirty && !panelsDirtyRef.current) return
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
          wildlife: wildlife.length ? wildlife : undefined,
          companions: companions.length ? companions : undefined,
        },
      })

      const elapsed = Date.now() - saveStartRef.current
      const remaining = MIN_SAVE_OVERLAY_MS - elapsed
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining))
      }

      // Share trip with any @mentioned companions added this save
      const subsToShare = pendingShareSubsRef.current.slice()
      pendingShareSubsRef.current = []
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
        <p className="font-mono text-[9px] text-text-dim tracking-widest uppercase">
          Loading…
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} onBlur={handleFormBlur}>
          {/* Hidden file input for journal scan */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleScanFile}
          />

          {/* Entry header: "Day N" + title input + scan button */}
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

          {/* Conditions — 5 columns */}
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

          {/* Narrative */}
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

          {/* Wildlife */}
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

          {/* Companions */}
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim shrink-0">Companions</span>
            <hr className="flex-1 border-0 border-t border-border" />
          </div>
          <div className="mb-5">
            <CompanionTagInput
              tags={companions}
              onChange={(tags) => { setCompanions(tags); panelsDirtyRef.current = true }}
              onMentionAdded={(sub) => {
                if (!pendingShareSubsRef.current.includes(sub))
                  pendingShareSubsRef.current.push(sub)
              }}
            />
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

function TagInput({
  tags,
  placeholder,
  onChange,
}: {
  tags: string[]
  placeholder: string
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  function addTag(value: string) {
    const trimmed = value.trim()
    if (!trimmed || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[32px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-surface-2 border border-border rounded-sm px-2 py-0.5 font-mono text-[10px] text-text-mid"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-text-dim hover:text-amber leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-24 bg-transparent border-0 outline-none font-mono text-[11px] text-text placeholder:text-text-dim"
      />
    </div>
  )
}

function CompanionTagInput({
  tags,
  onChange,
  onMentionAdded,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  onMentionAdded: (sub: string) => void
}) {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)

  const mentionQuery = input.startsWith('@') ? input.slice(1) : null

  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const users = await searchUsers(mentionQuery)
        setResults(users)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [mentionQuery])

  function addTag(label: string, sub?: string) {
    const trimmed = label.trim()
    if (!trimmed || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    if (sub) onMentionAdded(sub)
    setInput('')
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (open && results.length > 0) {
        addTag(`@${results[0].name}`, results[0].sub)
      } else if (mentionQuery === null && input.trim()) {
        addTag(input)
      }
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 items-center min-h-[32px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`flex items-center gap-1 border rounded-sm px-2 py-0.5 font-mono text-[10px] ${
              tag.startsWith('@')
                ? 'bg-amber-dim border-amber-border text-amber'
                : 'bg-surface-2 border-border text-text-mid'
            }`}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-text-dim hover:text-amber leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150)
            if (mentionQuery === null && input.trim()) addTag(input)
          }}
          placeholder={tags.length === 0 ? 'Add names, or type @ to mention a user…' : ''}
          className="flex-1 min-w-32 bg-transparent border-0 outline-none font-mono text-[11px] text-text placeholder:text-text-dim"
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-mid rounded-md overflow-hidden z-10 shadow-lg">
          {searching ? (
            <div className="px-3 py-2.5 font-mono text-[10px] text-text-dim">Searching…</div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <button
                key={user.sub}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(`@${user.name}`, user.sub) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-2 transition-colors duration-100"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-mono text-[9px] font-bold"
                  style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}
                >
                  {initials(user.name)}
                </div>
                <div className="min-w-0">
                  <div className="font-sans text-[12px] font-medium text-text truncate">{user.name}</div>
                  <div className="font-mono text-[9px] text-text-dim truncate">{user.email}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2.5 font-mono text-[10px] text-text-dim">No users found</div>
          )}
        </div>
      )}
    </div>
  )
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
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