import { useState, useRef, useEffect } from 'react'
import { ProgressBar } from '../ProgressBar'
import { IconBell, IconCheck, IconDownload, IconPlus, IconFile, IconCircle } from '../icons'
import type { StageBodyProps, ReminderTone, ContactTone, PlanDayEntry } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reminder {
  date: string
  description: string
  tone: ReminderTone
  set: boolean
}

interface Contact {
  name: string
  role: string
  phone: string
  tone: ContactTone
}

interface MapLayer {
  name: string
  size: string
  ok: boolean
}

interface ChecklistItem {
  text: string
  done: boolean
  pending?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_REMINDERS: Reminder[] = [
  { date: 'Jan 25', description: 'Whitney lottery opens reminder',              tone: 'amber', set: true  },
  { date: 'Mar 24', description: 'Lottery results · expect email by 5PM',       tone: 'amber', set: true  },
  { date: 'Aug 1',  description: 'Mail resupply to Bishop PO',                  tone: 'sky',   set: true  },
  { date: 'Aug 8',  description: '72-hr forecast check',                        tone: 'sky',   set: true  },
  { date: 'Aug 10', description: 'Pack shakedown · weigh-in',                   tone: 'sky',   set: false },
  { date: 'Aug 11', description: '5AM · airport · do not check trekking poles', tone: 'pine',  set: true  },
]

const DEFAULT_CONTACTS: Contact[] = [
  { name: 'Sam (home base)',      role: 'check-in · 8PM PT daily', phone: '415-555-0142',      tone: 'amber' },
  { name: 'Inyo Co. Sheriff SAR', role: 'east-side primary',       phone: '760-878-0383',      tone: 'red'   },
  { name: 'Tulare Co. SAR',       role: 'west-side primary',       phone: '559-733-6218',      tone: 'red'   },
  { name: 'Garmin IERCC',         role: 'inReach SOS routing',     phone: 'auto · SOS button', tone: 'sky'   },
]

const DEFAULT_MAP_LAYERS: MapLayer[] = [
  { name: 'CalTopo — Sierra High Route corridor', size: '142 MB · 4 layers', ok: true  },
  { name: 'Gaia GPS — backup',                    size: '88 MB · contours',  ok: true  },
  { name: 'NOAA — wx overlays',                   size: '12 MB',             ok: true  },
  { name: 'OnX — bail-out roads',                 size: '— · pending',       ok: false },
]

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { text: 'Trip one-pager (PDF)',         done: true,  pending: false },
  { text: 'Offline maps · CalTopo',       done: true,  pending: false },
  { text: 'Emergency contacts shared',    done: true,  pending: false },
  { text: 'Garmin inReach plan paid',     done: true,  pending: false },
  { text: 'Car parked at Whitney Portal', done: false, pending: true  },
  { text: 'Keys handed off',              done: false, pending: false },
]

const DEFAULT_DAY_ROWS = [
  'D1 Onion Valley → Charlotte · 12 mi',
  'D2 Charlotte → Rae Lakes · 14 mi',
  'D3 Rae → Sixty Lake · 18 mi',
  'D4 Sixty → Bench Lake · 22 mi ⚠',
  'D5 Bench → Marjorie · 16 mi · RESUPPLY',
  'D6 Marjorie → Crabtree · 19 mi',
  'D7 Crabtree → Guitar Lake · 14 mi',
  'D8 Guitar → Whitney Portal · 17 mi · SUMMIT',
]

const REMINDER_DATE_CLS: Record<ReminderTone, string> = {
  amber: 'text-amber',
  sky:   'text-sky',
  pine:  'text-pine',
}

const CONTACT_AVATAR_CLS: Record<ContactTone, string> = {
  amber: 'bg-amber-dim border-amber-border text-amber',
  sky:   'bg-sky-dim border-sky-border text-sky',
  pine:  'bg-pine-dim border-pine-border text-pine',
  red:   'bg-red-dim border-red-border text-red',
}

// ─── OnePagerPreview ──────────────────────────────────────────────────────────

function OnePagerPreview({ days, contacts }: { days: PlanDayEntry[] | null; contacts: Contact[] }) {
  const dayRows = days
    ? days.map(d => `D${d.n} ${d.from} → ${d.to} · ${d.mi} mi${d.hard ? ' ⚠' : ''}`)
    : DEFAULT_DAY_ROWS

  const emergencyContacts = contacts.filter(c => c.tone === 'red' || c.tone === 'amber')

  return (
    <div
      className="bg-bg border border-border rounded overflow-hidden font-mono text-text-dim"
      style={{ aspectRatio: '8.5 / 11', padding: '14px 16px', fontSize: 7, lineHeight: 1.5 }}
    >
      <div className="font-heading text-text mb-0.5" style={{ fontSize: 11, fontWeight: 800 }}>
        SIERRA HIGH ROUTE · AUG 11–19
      </div>
      <div className="text-amber tracking-[0.16em] mb-2" style={{ fontSize: 7 }}>
        RIDGELINE TRIP CARD
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-2" style={{ fontSize: 6 }}>
        <div><strong className="text-text">Party</strong><br />Casey M., Jamie T., Lin K., Rae P.</div>
        <div><strong className="text-text">InReach</strong><br />MAPSHARE/casey · check 8PM</div>
        <div><strong className="text-text">Entry</strong><br />Onion Valley · 8/12 7:30AM</div>
        <div><strong className="text-text">Exit</strong><br />Whitney Portal · 8/19 ~3PM</div>
      </div>

      <div className="border-t border-dashed border-border-mid my-1.5" />

      <div className="font-bold text-text mb-0.5" style={{ fontSize: 6, letterSpacing: '0.1em' }}>DAILY PLAN</div>
      {dayRows.map((row, i) => (
        <div key={i} style={{ fontSize: 6 }}>{row}</div>
      ))}

      <div className="border-t border-dashed border-border-mid my-1.5" />

      <div className="font-bold text-text mb-0.5" style={{ fontSize: 6, letterSpacing: '0.1em' }}>EMERGENCY</div>
      {emergencyContacts.map(c => (
        <div key={c.name} style={{ fontSize: 6 }}>{c.name} · {c.phone}</div>
      ))}
    </div>
  )
}

// ─── TakeItItem ───────────────────────────────────────────────────────────────

function TakeItItem({ item, onToggle }: { item: ChecklistItem; onToggle: () => void }) {
  const indicator = item.done ? (
    <span className="w-3.5 h-3.5 rounded-full bg-pine-dim border border-pine-border text-pine flex items-center justify-center shrink-0">
      <IconCheck size={8} />
    </span>
  ) : item.pending ? (
    <span className="w-3.5 h-3.5 rounded-full bg-amber-dim border border-amber-border text-transparent flex items-center justify-center shrink-0">
      <IconCircle size={6} />
    </span>
  ) : (
    <span className="w-3.5 h-3.5 rounded-full border border-border flex items-center justify-center shrink-0 text-transparent">
      <IconCircle size={6} />
    </span>
  )

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2.5 py-1.5 w-full text-left cursor-pointer"
    >
      {indicator}
      <span className={`text-[12px] ${item.done ? 'text-text' : 'text-text-dim'}`}>{item.text}</span>
    </button>
  )
}

// ─── DepartStage ──────────────────────────────────────────────────────────────

export function DepartStage({ plan, onChange }: StageBodyProps) {
  const d = plan?.depart

  const [reminders, setReminders] = useState<Reminder[]>(() => d?.reminders ?? DEFAULT_REMINDERS)
  const [contacts]                = useState<Contact[]>(() => d?.contacts   ?? DEFAULT_CONTACTS)
  const [mapLayers, setMapLayers] = useState<MapLayer[]>(() => d?.mapLayers ?? DEFAULT_MAP_LAYERS)
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => d?.checklist ?? DEFAULT_CHECKLIST)

  const isMounted   = useRef(false)
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ depart: { reminders, contacts, mapLayers, checklist } })
  }, [reminders, contacts, mapLayers, checklist])

  const days = plan?.days?.days ?? null

  function toggleReminder(i: number) {
    setReminders(prev => prev.map((r, idx) => idx !== i ? r : { ...r, set: !r.set }))
  }

  function downloadLayer(i: number) {
    setMapLayers(prev => prev.map((m, idx) => idx !== i ? m : { ...m, ok: true, size: m.size.replace('— · pending', 'downloading…') }))
  }

  function toggleChecklist(i: number) {
    setChecklist(prev => prev.map((c, idx) => idx !== i ? c : { ...c, done: !c.done, pending: false }))
  }

  const readyCount = mapLayers.filter(m => m.ok).length
  const doneCount  = checklist.filter(c => c.done).length
  const progress   = Math.round((doneCount / checklist.length) * 100)

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_320px]">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-[18px]">

          {/* Reminders */}
          <div className="bg-surface border border-border rounded-lg p-[18px]">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Reminders</div>
            {reminders.map((r, i) => (
              <div
                key={r.date + r.description}
                className={`grid items-center gap-3 py-2.5 ${i < reminders.length - 1 ? 'border-b border-border' : ''}`}
                style={{ gridTemplateColumns: '56px 1fr 56px' }}
              >
                <span className={`font-mono text-[11px] font-bold ${REMINDER_DATE_CLS[r.tone]}`}>
                  {r.date}
                </span>
                <span className="text-[12px] text-text">{r.description}</span>
                {r.set ? (
                  <span className="font-mono text-[8px] tracking-[0.12em] uppercase text-pine text-right">SET</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleReminder(i)}
                    className="font-heading text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-1 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer text-right"
                  >
                    Set
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Emergency contacts */}
          <div className="bg-surface border border-border rounded-lg p-[18px]">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Emergency contacts</span>
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
              >
                <IconPlus /> Contact
              </button>
            </div>
            {contacts.map((c, i) => (
              <div
                key={c.name}
                className={`grid items-center gap-3 py-2 ${i < contacts.length - 1 ? 'border-b border-border' : ''}`}
                style={{ gridTemplateColumns: '28px 1fr auto' }}
              >
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${CONTACT_AVATAR_CLS[c.tone]}`}>
                  <IconBell />
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-text leading-snug">{c.name}</div>
                  <div className="font-mono text-[9px] text-text-dim mt-0.5">{c.role}</div>
                </div>
                <span className="font-mono text-[10px] text-text-mid whitespace-nowrap">{c.phone}</span>
              </div>
            ))}
          </div>

          {/* Offline maps */}
          <div className="bg-surface border border-border rounded-lg p-[18px]">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Offline maps</span>
              <span className="font-mono text-[9px] text-text-dim">cached to all phones</span>
              <span className={`ml-auto font-mono text-[10px] ${readyCount === mapLayers.length ? 'text-pine' : 'text-amber'}`}>
                {readyCount} of {mapLayers.length} ready
              </span>
            </div>
            {mapLayers.map((m, i) => (
              <div
                key={m.name}
                className={`grid items-center gap-2.5 py-2 ${i < mapLayers.length - 1 ? 'border-b border-border' : ''}`}
                style={{ gridTemplateColumns: '18px 1fr auto' }}
              >
                <span className={m.ok ? 'text-pine' : 'text-amber'}>
                  {m.ok ? <IconCheck size={12} /> : <IconCircle size={12} />}
                </span>
                <div className="min-w-0">
                  <div className="text-[11.5px] font-semibold text-text leading-snug">{m.name}</div>
                  <div className="font-mono text-[9px] text-text-dim mt-0.5">{m.size}</div>
                </div>
                {!m.ok && (
                  <button
                    type="button"
                    onClick={() => downloadLayer(i)}
                    className="inline-flex items-center gap-1.5 font-heading text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-1 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <IconDownload /> Download
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right rail ── */}
        <aside className="flex flex-col gap-3.5">

          {/* One-pager */}
          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">One-pager</span>
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1.5 font-heading text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-1 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
              >
                <IconFile /> PDF
              </button>
            </div>
            <OnePagerPreview days={days} contacts={contacts} />
            <p className="font-mono text-[9px] text-text-dim italic mt-2 leading-relaxed">
              Auto-generated from Route, Days, Permits, Food. Print &amp; leave with Sam.
            </p>
          </div>

          {/* Take it with you */}
          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">Take it with you</div>
            {checklist.map((item, i) => (
              <TakeItItem key={item.text} item={item} onToggle={() => toggleChecklist(i)} />
            ))}
            <div className="h-px bg-border my-3" />
            <ProgressBar value={progress} tone="pine" />
            <div className="font-mono text-[9px] text-text-dim text-center mt-1.5">{doneCount} of {checklist.length}</div>
          </div>
        </aside>
      </div>
    </div>
  )
}