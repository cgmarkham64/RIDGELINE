import { useState, useEffect, useRef, useMemo } from 'react'
import { JumpChip } from '../JumpChip'
import { Pill } from '../Pill'
import { ProgressBar } from '../ProgressBar'
import { CheckItem } from '../CheckItem'
import { IconTent, IconMountain, IconWater, IconSun } from '../../icons'
import type { StageBodyProps } from '../types'
import type { SegRow } from './routeStage.types'
import { EXP_LABEL } from './routeStage.helpers'

type Exposure = 'low' | 'med' | 'high' | 'extreme'

const EXP_CLS: Record<Exposure, string> = {
  low:     'text-pine border-pine-border bg-pine-dim',
  med:     'text-sky border-sky-border bg-sky-dim',
  high:    'text-amber border-amber-border bg-amber-dim',
  extreme: 'text-red border-red-border bg-red-dim',
}

const WATER_LABEL: Record<string, string> = {
  reliable: 'reliable',
  caches:   'caches',
  dry:      'dry',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WaypointRow({ time, name, loc, icon, last }: {
  time: string; name: string; loc: string
  icon: 'tent' | 'mountain' | 'water'; last?: boolean
}) {
  return (
    <div className={`grid items-center gap-3 py-2 grid-cols-[70px_22px_1fr] ${last ? '' : 'border-b border-border'}`}>
      <span className="font-mono text-[10px] text-text-mid">{time}</span>
      {icon === 'tent'     && <IconTent />}
      {icon === 'mountain' && <IconMountain />}
      {icon === 'water'    && <IconWater />}
      <div>
        <div className="text-[12px] font-semibold text-text">{name}</div>
        <div className="font-mono text-[9px] text-text-dim mt-0.5">{loc}</div>
      </div>
    </div>
  )
}

// ─── Days Stage ───────────────────────────────────────────────────────────────

export function DaysStage({ onJump, plan, onChange, onProgress }: StageBodyProps) {
  const [segs, setSegs] = useState<SegRow[]>(plan?.route?.segments ?? [])
  const [sel, setSel]   = useState(0)

  const onChangeRef   = useRef(onChange)
  const onProgressRef = useRef(onProgress)
  const isMounted     = useRef(false)
  const routeRef      = useRef({
    sourceFiles: plan?.route?.sourceFiles ?? [],
    checklist:   plan?.route?.checklist   ?? [],
  })

  useEffect(() => {
    onChangeRef.current   = onChange
    onProgressRef.current = onProgress
  })

  const checklist = useMemo(() => [
    { text: 'Segments added',    done: segs.length > 0 },
    { text: 'Daily mileage set', done: segs.length > 0 && segs.every(s => s.mi > 0) },
    { text: 'Water sources set', done: segs.length > 0 && segs.every(s => !!s.water) },
    { text: 'Exposure flagged',  done: segs.length > 0 && segs.every(s => !!s.exp) },
    { text: 'Tough days reviewed', done: segs.length > 0 },
    { text: 'Bail-out points',   done: false },
  ], [segs])

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ route: { segments: segs, ...routeRef.current } })
  }, [segs])

  useEffect(() => {
    const done = checklist.filter(c => c.done).length
    onProgressRef.current?.(done, checklist.length)
  }, [checklist])

  function updateSeg(idx: number, patch: Partial<SegRow>) {
    setSegs(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  const d = segs[sel]

  const totalMi   = segs.reduce((a, x) => a + x.mi, 0)
  const totalGain = segs.reduce((a, x) => a + x.gain, 0)
  const longest   = segs.length > 0 ? Math.max(...segs.map(x => x.mi)) : 0
  const campCount = Math.max(0, segs.length - 1)
  const longDays  = segs.filter(x => x.mi > 20)
  const doneCount = checklist.filter(c => c.done).length

  if (segs.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[520px] mx-auto mt-16 text-center">
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Stage 2 · Days</div>
          <h2 className="font-heading text-[22px] font-extrabold text-text mb-2">No days planned yet.</h2>
          <p className="text-[13px] text-text-mid leading-relaxed mb-6">
            Days are generated from your route segments. Finish{' '}
            <button
              type="button"
              onClick={() => onJump('route')}
              className="text-amber underline underline-offset-2 cursor-pointer bg-transparent border-none"
            >
              Stage 1 · Route
            </button>
            {' '}first to populate this stage.
          </p>
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-dim border border-amber-border rounded-lg text-left mt-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-amber shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-[12px] text-text-mid leading-relaxed">
              <span className="font-semibold text-amber">Your journal uses this itinerary.</span>{' '}
              Fill in your days before going on trail — if Days is still empty when your trip starts, journal entries fall back to one panel per calendar day.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!d) return null

  const [namePart1, namePart2] = d.name.split(/ to | → /i)

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_320px]">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-[18px]">

          {/* Header stat strip */}
          <div className="grid grid-cols-4 gap-px bg-border rounded-lg overflow-hidden">
            {[
              { v: String(totalMi),           l: 'total miles' },
              { v: totalGain.toLocaleString(), l: 'gain (ft)'   },
              { v: String(longest),            l: 'longest day' },
              { v: String(campCount),          l: 'camps'       },
            ].map(s => (
              <div key={s.l} className="bg-surface px-3 py-2">
                <div className="font-heading text-[18px] font-extrabold text-amber leading-none">{s.v}</div>
                <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Segment list */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {segs.map((seg, i) => (
              <button
                key={seg.n}
                onClick={() => setSel(i)}
                className={[
                  'w-full text-left grid items-center gap-3.5 px-4 py-3 border-l-2 transition-colors grid-cols-[52px_1fr_70px_90px_70px_60px]',
                  i < segs.length - 1 ? 'border-b border-border' : '',
                  sel === i
                    ? 'bg-amber-glow border-l-amber'
                    : 'border-l-transparent hover:bg-surface-2',
                ].join(' ')}
              >
                <span className="font-mono text-[10px] font-bold text-amber text-center py-1 px-2 bg-amber-dim border border-amber-border rounded">
                  D{seg.n}
                </span>
                <div>
                  <div className="text-[12px] font-semibold text-text">{seg.name}</div>
                  <div className="font-mono text-[9px] text-text-dim mt-0.5">
                    water: {seg.water ? WATER_LABEL[seg.water] : '—'}
                    {seg.pass ? ` · ${seg.pass}` : ''}
                  </div>
                </div>
                <span className="font-mono text-[11px] text-text">{seg.mi} mi</span>
                <span className="font-mono text-[11px] text-text-mid">{seg.gain.toLocaleString()} ft</span>
                {seg.exp
                  ? <span className={`font-mono text-[9px] font-semibold text-center py-0.5 px-1.5 rounded border uppercase tracking-[0.08em] ${EXP_CLS[seg.exp]}`}>
                      {EXP_LABEL[seg.exp]}
                    </span>
                  : <span className="font-mono text-[9px] text-text-dim text-center py-0.5 px-1.5">—</span>
                }
                {seg.hard
                  ? <Pill tone="amber">tough</Pill>
                  : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-pine">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
              </button>
            ))}
          </div>

          {/* Selected day detail */}
          <div key={d.n} className="bg-surface border border-border rounded-lg p-[18px]">
            <div className="flex items-baseline gap-2.5 mb-4">
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-amber">Day {d.n}</span>
              <span className="font-heading text-[16px] font-extrabold text-text">{d.name}</span>
              <span className="font-mono text-[9px] text-text-dim ml-auto">{d.mi} mi · {d.gain.toLocaleString()} ft</span>
            </div>

            {/* Editable day metadata */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div>
                <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1 block">Water</label>
                <select
                  className="w-full px-2.5 py-1.5 border border-border rounded-sm text-[12px] bg-surface-2 text-text outline-none focus:border-border-mid transition-colors"
                  value={d.water ?? ''}
                  onChange={e => {
                    const v = e.target.value
                    updateSeg(sel, { water: v === '' ? undefined : v as SegRow['water'] })
                  }}
                >
                  <option value="">— not set —</option>
                  <option value="reliable">Reliable</option>
                  <option value="caches">Caches</option>
                  <option value="dry">Dry</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1 block">Exposure</label>
                <select
                  className="w-full px-2.5 py-1.5 border border-border rounded-sm text-[12px] bg-surface-2 text-text outline-none focus:border-border-mid transition-colors"
                  value={d.exp ?? ''}
                  onChange={e => {
                    const v = e.target.value
                    updateSeg(sel, { exp: v === '' ? undefined : v as SegRow['exp'] })
                  }}
                >
                  <option value="">— not set —</option>
                  <option value="low">Low</option>
                  <option value="med">Moderate</option>
                  <option value="high">High</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1 block">Pass / col</label>
                <input
                  className="w-full px-2.5 py-1.5 border border-border rounded-sm text-[12px] bg-surface-2 text-text outline-none focus:border-border-mid transition-colors placeholder:text-text-dim"
                  value={d.pass ?? ''}
                  onChange={e => updateSeg(sel, { pass: e.target.value || undefined })}
                  placeholder="e.g. Glen Pass · 11,978 ft"
                />
              </div>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={d.hard ?? false}
                    onChange={e => updateSeg(sel, { hard: e.target.checked || undefined })}
                  />
                  <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${d.hard ? 'bg-amber-dim border-amber-border' : 'bg-surface border-border'}`}>
                    {d.hard && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="font-mono text-[11px] text-text">Tough day</span>
                </label>
              </div>
            </div>

            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2">Waypoints</div>
            <WaypointRow time="6:30 AM"  name="Leave camp"    loc={namePart1 ?? d.name}              icon="tent"     />
            {d.pass && <WaypointRow time="10:30 AM" name="Pass / col" loc={d.pass}                   icon="mountain" />}
            <WaypointRow time="1:00 PM"  name="Lunch + water" loc="Lake outflow"                     icon="water"    />
            <WaypointRow time="5:30 PM"  name="Make camp"     loc={namePart2?.trim() ?? d.name}      icon="tent"     last />
          </div>

          {/* Long-day banner */}
          {longDays.length > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-dim border border-amber-border rounded-lg text-[11px] text-text-mid">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-amber shrink-0">
                <path d="M17 18a4 4 0 0 0 0-8 6 6 0 0 0-11.7-1.5A4.5 4.5 0 0 0 6 18z" />
              </svg>
              <span>
                {longDays.map((x, i) => (
                  <span key={x.n}>{i > 0 ? ' and ' : ''}Day {x.n}</span>
                ))}{' '}push{longDays.length === 1 ? 'es' : ''} past 20 mi — confirm caloric load in{' '}
                <JumpChip to="food" onJump={onJump}>Food</JumpChip>
              </span>
            </div>
          )}
        </div>

        {/* ── Right rail ── */}
        <aside className="flex flex-col gap-3.5">

          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
            {checklist.map(c => <CheckItem key={c.text} text={c.text} done={c.done} />)}
            <div className="h-px bg-border my-3" />
            <ProgressBar value={(doneCount / checklist.length) * 100} tone="pine" />
            <div className="font-mono text-[9px] text-text-dim text-center mt-1.5">{doneCount} of {checklist.length}</div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">Forecast — Aug 15</div>
            <div className="flex items-center gap-3">
              <IconSun />
              <div className="flex-1">
                <div className="font-heading text-[22px] font-extrabold text-text leading-none">72° / 38°</div>
                <div className="font-mono text-[9px] text-text-dim mt-1">Clear · light NW wind</div>
              </div>
            </div>
            <p className="text-[10px] text-text-mid mt-2 italic">10-day window before trip. Re-check 72 hrs out.</p>
          </div>

        </aside>
      </div>
    </div>
  )
}