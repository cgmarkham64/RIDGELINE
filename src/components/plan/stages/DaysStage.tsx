import { useState } from 'react'
import { JumpChip } from '../JumpChip'
import { Pill } from '../Pill'
import { ProgressBar } from '../ProgressBar'
import { CheckItem } from '../CheckItem'
import { IconTent, IconMountain, IconWater, IconSun } from '../../icons'
import type { StageBodyProps } from '../types'

// ─── Mock data ────────────────────────────────────────────────────────────────

type Exposure = 'low' | 'med' | 'high' | 'extreme'

interface Day {
  n: number
  from: string
  to: string
  mi: number
  gain: number
  water: string
  exp: Exposure
  hard?: boolean
  pass?: string  // named col or pass mid-day; omit for flat/approach days
}

const DAYS: Day[] = [
  { n: 1, from: 'Onion Valley',   to: 'Charlotte Lake',  mi: 12, gain: 3200, water: 'reliable', exp: 'low'     },
  { n: 2, from: 'Charlotte Lake', to: 'Rae Lakes',        mi: 14, gain: 2100, water: 'reliable', exp: 'low'     },
  { n: 3, from: 'Rae Lakes',      to: 'Sixty Lake',       mi: 18, gain: 4400, water: 'reliable', exp: 'med',  pass: 'Glen Pass · 11,978 ft'     },
  { n: 4, from: 'Sixty Lake',     to: 'Bench Lake',       mi: 22, gain: 5100, water: 'reliable', exp: 'high', pass: 'Cartridge Pass · 12,650 ft', hard: true },
  { n: 5, from: 'Bench Lake',     to: 'Lake Marjorie',    mi: 16, gain: 3800, water: 'reliable', exp: 'med',  pass: 'Mather Pass · 12,100 ft'   },
  { n: 6, from: 'Lake Marjorie',  to: 'Crabtree',         mi: 19, gain: 4200, water: 'caches',   exp: 'high', pass: 'Forester Pass · 13,153 ft'  },
  { n: 7, from: 'Crabtree',       to: 'Guitar Lake',      mi: 14, gain: 2800, water: 'reliable', exp: 'med'     },
  { n: 8, from: 'Guitar Lake',    to: 'Whitney Portal',   mi: 17, gain: 4400, water: 'reliable', exp: 'extreme', hard: true },
]

const CHECKLIST = [
  '8 days mapped',
  'Camps assigned',
  'Daily mileage',
  'Water sources',
  'Exposure flagged',
  'Tough days reviewed',
  'Bail-out points',
  'Synced with Route',
]

// Static Tailwind classes keyed by exposure — avoids dynamic class generation
const EXP_CLS: Record<Exposure, string> = {
  low:     'text-pine border-pine-border bg-pine-dim',
  med:     'text-sky border-sky-border bg-sky-dim',
  high:    'text-amber border-amber-border bg-amber-dim',
  extreme: 'text-red border-red-border bg-red-dim',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimeField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1 block">{label}</label>
      <input
        className="w-full px-3 py-2 border border-border rounded-sm text-[13px] bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors"
        defaultValue={value}
      />
    </div>
  )
}

function WaypointRow({ time, name, loc, icon, last }: {
  time: string; name: string; loc: string
  icon: 'tent' | 'mountain' | 'water'; last?: boolean
}) {
  return (
    <div
      className={`grid items-center gap-3 py-2 grid-cols-[70px_22px_1fr] ${last ? '' : 'border-b border-border'}`}
    >
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

export function DaysStage({ onJump, plan }: StageBodyProps) {
  // onChange not called: days array comes from plan prop (no local edit state yet).
  // Time fields use defaultValue (uncontrolled) — wire onChange when they become controlled.
  const days = plan?.days?.days ?? (plan !== undefined ? [] : DAYS)
  const [sel, setSel] = useState(Math.min(3, Math.max(0, days.length - 1)))

  const d = days[sel]

  const totalMi   = days.reduce((a, x) => a + x.mi, 0)
  const totalGain = days.reduce((a, x) => a + x.gain, 0)
  const longest   = days.length > 0 ? Math.max(...days.map(x => x.mi)) : 0
  const campCount = Math.max(0, days.length - 1)
  const longDays  = days.filter(x => x.mi > 20)

  if (days.length === 0) {
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
            {' '}first, or add days manually once that stage is wired to the backend.
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

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_320px]">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-[18px]">

          {/* Header stat strip */}
          <div className="grid grid-cols-4 gap-px bg-border rounded-lg overflow-hidden">
            {[
              { v: String(totalMi),                  l: 'total miles' },
              { v: totalGain.toLocaleString(),        l: 'gain (ft)' },
              { v: String(longest),                   l: 'longest day' },
              { v: String(campCount),                  l: 'camps' },
            ].map(s => (
              <div key={s.l} className="bg-surface px-3 py-2">
                <div className="font-heading text-[18px] font-extrabold text-amber leading-none">{s.v}</div>
                <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-text-dim mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Day list */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {days.map((dd, i) => (
              <button
                key={dd.n}
                onClick={() => setSel(i)}
                className={[
                  'w-full text-left grid items-center gap-3.5 px-4 py-3 border-l-2 transition-colors grid-cols-[52px_1fr_70px_90px_70px_60px]',
                  i < days.length - 1 ? 'border-b border-border' : '',
                  sel === i
                    ? 'bg-amber-glow border-l-amber'
                    : 'border-l-transparent hover:bg-surface-2',
                ].join(' ')}
              >
                <span className="font-mono text-[10px] font-bold text-amber text-center py-1 px-2 bg-amber-dim border border-amber-border rounded">
                  D{dd.n}
                </span>
                <div>
                  <div className="text-[12px] font-semibold text-text">{dd.from} → {dd.to}</div>
                  <div className="font-mono text-[9px] text-text-dim mt-0.5">Aug {11 + dd.n} · water {dd.water}</div>
                </div>
                <span className="font-mono text-[11px] text-text">{dd.mi} mi</span>
                <span className="font-mono text-[11px] text-text-mid">{dd.gain.toLocaleString()} ft</span>
                <span className={`font-mono text-[9px] font-semibold text-center py-0.5 px-1.5 rounded border uppercase tracking-[0.08em] ${EXP_CLS[dd.exp]}`}>
                  {dd.exp}
                </span>
                {dd.hard
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
            <div className="flex items-baseline gap-2.5 mb-3">
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-amber">Day {d.n}</span>
              <span className="font-heading text-[16px] font-extrabold text-text">{d.from} → {d.to}</span>
              <span className="font-mono text-[9px] text-text-dim ml-auto">{d.mi} mi · {d.gain.toLocaleString()} ft</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-3.5">
              <TimeField label="Wake"     value="5:30 AM" />
              <TimeField label="On-trail" value="6:15 AM" />
              <TimeField label="Camp by"  value="6:00 PM" />
            </div>
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2">Waypoints</div>
            <WaypointRow time="6:30 AM"  name="Leave camp"    loc={d.from}       icon="tent"     />
            {d.pass && <WaypointRow time="10:30 AM" name="Pass / col" loc={d.pass} icon="mountain" />}
            <WaypointRow time="1:00 PM"  name="Lunch + water" loc="Lake outflow" icon="water"    />
            <WaypointRow time="5:30 PM"  name="Make camp"     loc={d.to}         icon="tent"     last />
          </div>

          {/* Helper banner */}
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
        </div>

        {/* ── Right rail ── */}
        <aside className="flex flex-col gap-3.5">

          {/* Stage checklist */}
          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
            {CHECKLIST.map(text => <CheckItem key={text} text={text} done />)}
            <div className="h-px bg-border my-3" />
            <ProgressBar value={100} tone="pine" />
            <div className="font-mono text-[9px] text-text-dim text-center mt-1.5">8 of 8</div>
          </div>

          {/* Forecast */}
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