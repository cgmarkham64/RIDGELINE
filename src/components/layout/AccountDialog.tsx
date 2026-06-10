import React, { useRef, useState } from 'react'
import { useAuthStore } from '../../store/auth'
import { uploadAvatar, removeAvatar, updatePreferences } from '../../lib/auth'
import { initials } from '../../lib/utils'
import { IconX } from '../icons'
import type { TimePreference, UserPreferences, WeatherTolerances } from '../../types/auth'
import { DEFAULT_USER_PREFERENCES } from '../../types/auth'
import { fToC, cToF, mphToKmh, kmhToMph, type UnitSystem } from '../../lib/units'

interface Props {
  onClose: () => void
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const size = 200
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      const scale = Math.max(size / img.width, size / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

function apiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { error?: string } } }).response
    if (res?.data?.error) return res.data.error
  }
  return fallback
}

function InfoTooltip({ text, align = 'center' }: { text: string; align?: 'center' | 'right' }) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pos = align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'

  function show() {
    if (timer.current) clearTimeout(timer.current)
    setOpen(true)
  }
  function hide() {
    timer.current = setTimeout(() => setOpen(false), 80)
  }

  return (
    <div className="relative inline-flex items-center shrink-0">
      <span
        onMouseEnter={show} onMouseLeave={hide}
        className="w-3.5 h-3.5 rounded-full border border-text-dim/50 flex items-center justify-center cursor-default text-text-dim hover:border-amber hover:text-amber transition-colors duration-80"
      >
        <span className="font-mono text-[8px] leading-none select-none">i</span>
      </span>
      <div
        onMouseEnter={show} onMouseLeave={hide}
        className={`absolute bottom-full mb-2 w-48 bg-surface-3 border border-border-mid rounded px-2.5 py-2 font-mono text-caption text-text-mid leading-relaxed z-50 whitespace-normal transition-opacity duration-200 ease-out ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${pos}`}
      >
        {text}
      </div>
    </div>
  )
}

function TimePrefRow({ label, pref, onChange }: {
  label: string
  pref: TimePreference
  onChange: (patch: Partial<TimePreference>) => void
}) {
  const selectCls = 'bg-surface-2 border border-border rounded-sm px-2 py-1.5 text-text font-mono text-fine outline-none focus:border-amber cursor-pointer shrink-0'
  const inputCls  = 'bg-surface-2 border border-border rounded-sm px-2 py-1.5 text-text font-mono text-fine outline-none focus:border-amber text-center shrink-0'

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-fine text-text-mid w-[58px] shrink-0">{label}</span>
      <select
        value={pref.mode}
        onChange={e => onChange({ mode: e.target.value as TimePreference['mode'], staticTime: undefined, anchor: 'sunrise', offsetMinutes: 0 })}
        className={selectCls + ' w-[100px]'}
      >
        <option value="relative">Relative</option>
        <option value="static">Fixed time</option>
      </select>
      {pref.mode === 'relative' ? (
        <>
          <select
            value={pref.anchor ?? 'sunrise'}
            onChange={e => onChange({ anchor: e.target.value as 'sunrise' | 'sunset' })}
            className={selectCls + ' w-[74px]'}
          >
            <option value="sunrise">Sunrise</option>
            <option value="sunset">Sunset</option>
          </select>
          <input
            type="number"
            value={pref.offsetMinutes ?? 0}
            onChange={e => onChange({ offsetMinutes: parseInt(e.target.value, 10) || 0 })}
            className={inputCls + ' w-[56px]'}
          />
          <span className="font-mono text-caption text-text-dim shrink-0">min</span>
          <InfoTooltip align="right" text="Negative = before the anchor. −60 means 60 min before sunrise/sunset." />
        </>
      ) : (
        <input
          type="time"
          value={pref.staticTime ?? '06:00'}
          onChange={e => onChange({ staticTime: e.target.value })}
          className={inputCls + ' w-[108px]'}
        />
      )}
    </div>
  )
}

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
    min: sys => sys === 'metric' ? -50 : -60,
    max: sys => sys === 'metric' ? 50 : 120,
    dir: '<',
  },
  {
    label: 'Precip',
    cautionKey: 'precipCautionPct', delayKey: 'precipDelayPct',
    defaultCaution: 40, defaultDelay: 70,
    unitLabel: () => '%',
    toDisplay: v => v, fromDisplay: v => v,
    min: () => 0, max: () => 100,
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
    max: sys => sys === 'metric' ? 320 : 200,
    dir: '>',
  },
]

export function AccountDialog({ onClose }: Props) {
  const { user, updateUser } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile')

  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [prefs, setPrefs] = useState<UserPreferences>(() => ({
    ...DEFAULT_USER_PREFERENCES,
    ...user?.preferences,
    weatherTolerances: user?.preferences?.weatherTolerances ?? DEFAULT_USER_PREFERENCES.weatherTolerances,
    unitSystem: user?.preferences?.unitSystem ?? 'imperial',
  }))
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsError, setPrefsError] = useState<string | null>(null)
  const [prefsSaved, setPrefsSaved] = useState(false)

  if (!user) return null

  function patchTimePref(key: 'wakeTime' | 'onTrailTime' | 'campByTime', patch: Partial<TimePreference>) {
    setPrefs(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
    setPrefsSaved(false)
  }

  function patchWeatherTolerance(patch: Partial<WeatherTolerances>) {
    setPrefs(prev => ({ ...prev, weatherTolerances: { ...prev.weatherTolerances, ...patch } }))
    setPrefsSaved(false)
  }

  async function handleSavePreferences() {
    setPrefsSaving(true)
    setPrefsError(null)
    try {
      const updated = await updatePreferences(prefs)
      updateUser({ preferences: updated.preferences })
      setPrefsSaved(true)
      setTimeout(() => setPrefsSaved(false), 2500)
    } catch (err: unknown) {
      setPrefsError(apiError(err, 'Save failed. Please try again.'))
    } finally {
      setPrefsSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarError('File must be an image (JPEG, PNG, WEBP, etc.)')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    const MAX_BYTES = 5 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      setAvatarError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 5 MB.`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setAvatarSaving(true)
    setAvatarError(null)
    try {
      const dataUrl = await resizeImage(file)
      const updated = await uploadAvatar(dataUrl)
      updateUser({ avatarUrl: updated.avatarUrl ?? undefined })
    } catch (err: unknown) {
      setAvatarError(apiError(err, 'Upload failed. Please try again.'))
    } finally {
      setAvatarSaving(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleRemoveAvatar() {
    setAvatarSaving(true)
    setAvatarError(null)
    try {
      await removeAvatar()
      updateUser({ avatarUrl: undefined })
    } catch (err: unknown) {
      setAvatarError(apiError(err, 'Remove failed'))
    } finally {
      setAvatarSaving(false)
    }
  }

  const tabCls = (tab: typeof activeTab) =>
    `pb-2.5 pr-5 font-mono text-fine border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-x-0 border-t-0 ${
      activeTab === tab
        ? 'text-amber border-amber'
        : 'text-text-dim border-transparent hover:text-text-mid'
    }`

  return (
    <div
      className="fixed inset-0 z-1001 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-mid rounded-lg w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sticky header + tab strip ────────────────────────────────────── */}
        <div className="sticky top-0 bg-surface z-1 border-b border-border">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <span className="font-heading text-sm font-extrabold text-text">Account</span>
            <button onClick={onClose} className="w-7 h-7 rounded-sm flex items-center justify-center bg-surface-2 border border-border cursor-pointer text-text-dim">
              <IconX size={14} />
            </button>
          </div>
          <div className="flex px-5">
            <button className={tabCls('profile')}    onClick={() => setActiveTab('profile')}>Profile</button>
            <button className={tabCls('preferences')} onClick={() => setActiveTab('preferences')}>Preferences</button>
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">

          {/* ── Profile tab ──────────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <>
              <div className="flex flex-col items-center gap-2.5">
                <button
                  title="Change photo"
                  onClick={() => fileRef.current?.click()}
                  className="group w-20 h-20 rounded-full overflow-hidden cursor-pointer bg-surface-3 flex items-center justify-center relative shrink-0 p-0 border-2 border-border-mid hover:border-amber transition-[border-color] duration-30"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover block" />
                  ) : (
                    <span className="font-heading text-[26px] font-extrabold text-amber leading-none">
                      {initials(user.name)}
                    </span>
                  )}
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-80"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" className="w-5 h-5" style={{ strokeWidth: 1.8 }}>
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                </button>

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarSaving}
                    className="bg-transparent border-0 font-mono text-fine p-0 transition-colors duration-80 text-text-mid hover:text-amber"
                    style={{ cursor: avatarSaving ? 'default' : 'pointer' }}
                  >
                    {avatarSaving ? 'Saving…' : 'Change photo'}
                  </button>
                  {user.avatarUrl && !avatarSaving && (
                    <>
                      <span className="text-border-mid text-caption">·</span>
                      <button onClick={handleRemoveAvatar} className="bg-transparent border-0 cursor-pointer p-0 font-mono text-fine transition-colors duration-30 text-text-dim hover:text-red">
                        Remove
                      </button>
                    </>
                  )}
                </div>
                {avatarError && <p className="font-mono text-caption text-red m-0">{avatarError}</p>}
              </div>

              <div className="border-t border-border pt-4 flex flex-col gap-3">
                <div>
                  <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1.25 block">Name</label>
                  <input value={user.name} readOnly className="w-full bg-surface-2 border border-border rounded-sm px-2.5 py-2 text-text-dim font-sans text-body outline-none cursor-default" />
                </div>
                <div>
                  <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1.25 block">Email</label>
                  <input value={user.email} readOnly className="w-full bg-surface-2 border border-border rounded-sm px-2.5 py-2 text-text-dim font-sans text-body outline-none cursor-default" />
                </div>
              </div>
            </>
          )}

          {/* ── Preferences tab ──────────────────────────────────────────────── */}
          {activeTab === 'preferences' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Units</label>
                <div className="flex gap-1">
                  {(['imperial', 'metric'] as const).map(sys => (
                    <button
                      key={sys}
                      type="button"
                      onClick={() => { setPrefs(prev => ({ ...prev, unitSystem: sys })); setPrefsSaved(false) }}
                      className="flex-1 py-[5px] font-mono text-caption rounded-sm border transition-colors duration-100 cursor-pointer"
                      style={{
                        background:   prefs.unitSystem === sys ? 'var(--color-amber-dim)'    : 'var(--color-surface-2)',
                        borderColor:  prefs.unitSystem === sys ? 'var(--color-amber-border)' : 'var(--color-border)',
                        color:        prefs.unitSystem === sys ? 'var(--color-amber)'        : 'var(--color-text-dim)',
                      }}
                    >
                      {sys === 'imperial' ? 'Imperial (mi, °F)' : 'Metric (km, °C)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                  <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Default times</label>
                  <InfoTooltip text="Auto-fills new route segments. Relative anchors to local sunrise or sunset on each hiking day." />
                </div>
                <div className="flex flex-col gap-2.5">
                  <TimePrefRow label="Wake"     pref={prefs.wakeTime}     onChange={patch => patchTimePref('wakeTime',     patch)} />
                  <TimePrefRow label="On trail" pref={prefs.onTrailTime}  onChange={patch => patchTimePref('onTrailTime',  patch)} />
                  <TimePrefRow label="Camp by"  pref={prefs.campByTime}   onChange={patch => patchTimePref('campByTime',   patch)} />
                </div>
              </div>

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
                    const sys        = prefs.unitSystem
                    const cautionVal = prefs.weatherTolerances[row.cautionKey]
                    const delayVal   = prefs.weatherTolerances[row.delayKey]
                    const cautionOn  = cautionVal !== null
                    const delayOn    = delayVal   !== null
                    const cautionDisplay = cautionVal !== null ? row.toDisplay(cautionVal, sys) : row.toDisplay(row.defaultCaution, sys)
                    const delayDisplay   = delayVal   !== null ? row.toDisplay(delayVal, sys)   : row.toDisplay(row.defaultDelay, sys)
                    const toggleCls  = (on: boolean) =>
                      `w-3 h-3 rounded-[2px] border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        on ? 'bg-amber border-amber' : 'bg-surface-2 border-border-mid hover:border-amber'
                      }`
                    const inputCls = (on: boolean) =>
                      `bg-surface-2 border border-border rounded-sm py-1.5 font-mono text-fine text-center w-full outline-none transition-opacity ${
                        on ? 'text-text focus:border-amber' : 'text-text-dim opacity-40 cursor-not-allowed'
                      }`
                    const dimCls  = (on: boolean) => `font-mono text-caption text-text-dim text-right transition-opacity ${on ? '' : 'opacity-30'}`
                    const unitCls = (on: boolean) => `font-mono text-label text-text-dim transition-opacity ${on ? '' : 'opacity-30'}`
                    return (
                      <>
                        <span key={row.label} className="font-mono text-fine text-text-mid">{row.label}</span>
                        <button type="button" onClick={() => patchWeatherTolerance({ [row.cautionKey]: cautionOn ? null : row.defaultCaution })} className={toggleCls(cautionOn)}>
                          {cautionOn && <span className="text-[6px] text-surface font-bold leading-none select-none">✓</span>}
                        </button>
                        <span className={dimCls(cautionOn)}>{row.dir}</span>
                        <input type="number" disabled={!cautionOn}
                          value={cautionDisplay}
                          min={row.min(sys)} max={row.max(sys)}
                          onChange={e => patchWeatherTolerance({ [row.cautionKey]: row.fromDisplay(Number(e.target.value), sys) })}
                          className={inputCls(cautionOn)}
                        />
                        <span className={unitCls(cautionOn)}>{row.unitLabel(sys)}</span>
                        <button type="button" onClick={() => patchWeatherTolerance({ [row.delayKey]: delayOn ? null : row.defaultDelay })} className={toggleCls(delayOn)}>
                          {delayOn && <span className="text-[6px] text-surface font-bold leading-none select-none">✓</span>}
                        </button>
                        <span className={dimCls(delayOn)}>{row.dir}</span>
                        <input type="number" disabled={!delayOn}
                          value={delayDisplay}
                          min={row.min(sys)} max={row.max(sys)}
                          onChange={e => patchWeatherTolerance({ [row.delayKey]: row.fromDisplay(Number(e.target.value), sys) })}
                          className={inputCls(delayOn)}
                        />
                        <span className={unitCls(delayOn)}>{row.unitLabel(sys)}</span>
                      </>
                    )
                  })}
                </div>
              </div>

              <div className="border-t border-border pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                  <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Daily macro targets</label>
                  <InfoTooltip text="Pre-fills the Food stage on new trips. Override per-trip any time." />
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {([
                    { key: 'calories', label: 'Calories', placeholder: 'e.g. 3,800' },
                    { key: 'protein',  label: 'Protein',  placeholder: 'e.g. 120 g'  },
                    { key: 'fat',      label: 'Fat',      placeholder: 'e.g. 80 g'   },
                    { key: 'carbs',    label: 'Carbs',    placeholder: 'e.g. 400 g'  },
                  ] as const).map(f => (
                    <div key={f.key}>
                      <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1 block">{f.label}</label>
                      <input
                        className="w-full px-2.5 py-2 border border-border rounded-sm text-body-sm bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors placeholder:text-text-dim"
                        placeholder={f.placeholder}
                        value={prefs.macroTargets?.[f.key] ?? ''}
                        onChange={e => {
                          setPrefs(prev => ({ ...prev, macroTargets: { ...prev.macroTargets, [f.key]: e.target.value } }))
                          setPrefsSaved(false)
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {prefsError && <p className="font-mono text-caption text-red m-0">{prefsError}</p>}
              <button
                onClick={handleSavePreferences}
                disabled={prefsSaving}
                className="self-start font-mono text-fine px-3 py-1.5 rounded-sm border transition-colors duration-80 cursor-pointer disabled:opacity-50 disabled:cursor-default"
                style={{
                  background:   prefsSaved ? 'var(--color-amber)'    : 'var(--color-surface-2)',
                  borderColor:  prefsSaved ? 'var(--color-amber)'    : 'var(--color-border)',
                  color:        prefsSaved ? 'var(--color-surface)'  : 'var(--color-text-mid)',
                }}
              >
                {prefsSaving ? 'Saving…' : prefsSaved ? 'Saved' : 'Save preferences'}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
