import { useState, useId, useEffect, useRef } from 'react'
import { JumpChip } from '../JumpChip'
import { ProgressBar } from '../ProgressBar'
import { CheckItem } from '../CheckItem'
import type { StageBodyProps, PermitTypeName, ZoneStatus } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

type PermitTone = 'amber' | 'sky' | 'pine'
type ViewMode = 'list' | 'map'

interface ZoneNight {
  night: number
  zone: string
  status: ZoneStatus
}

interface Permit {
  id: string
  type: PermitTypeName
  name: string
  agency: string
  why: string
  fields: Record<string, string>
  party: number
  zones?: ZoneNight[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERMIT_TYPES: Record<PermitTypeName, { label: string; tone: PermitTone; hint: string }> = {
  lottery:     { label: 'Lottery',             tone: 'amber', hint: 'Apply window → results → accept' },
  reservation: { label: 'Advance reservation', tone: 'sky',   hint: 'Books on open date, fills fast' },
  walkup:      { label: 'Walk-up',             tone: 'amber', hint: 'Day-of, first-come' },
  selfissue:   { label: 'Self-issue',          tone: 'pine',  hint: 'Free trailhead register, no booking' },
  zonenights:  { label: 'Zone-by-zone',        tone: 'amber', hint: 'One permit, specifies zones/nights' },
  hut:         { label: 'Hut reservation',     tone: 'sky',   hint: 'Per-night booking (refugio/hut)' },
  parking:     { label: 'Parking pass',        tone: 'pine',  hint: 'Trailhead lot — separate from wilderness' },
  fishing:     { label: 'Fishing license',     tone: 'pine',  hint: 'Activity license' },
  vehicle:     { label: 'Vehicle entry',       tone: 'pine',  hint: 'NPS-style park entry' },
}

const TONE_CLS: Record<PermitTone, string> = {
  amber: 'bg-amber-dim border-amber-border text-amber',
  sky:   'bg-sky-dim border-sky-border text-sky',
  pine:  'bg-pine-dim border-pine-border text-pine',
}

const ZONE_STATUS_CLS: Record<ZoneStatus, string> = {
  available: 'text-pine',
  limited:   'text-amber',
  sold_out:  'text-red',
}

const INITIAL_PERMITS: Permit[] = [
  {
    id: 'sgt_whitney',
    type: 'lottery',
    name: 'Mt. Whitney Zone (overnight)',
    agency: 'Inyo NF · recreation.gov',
    why: 'Your route exits via Whitney Portal — overnight permits are required Apr–Nov.',
    fields: {
      'Lottery opens':  'Feb 1, 2026',
      'Lottery closes': 'Mar 15, 2026',
      'Results':        'Mar 24, 2026',
      'Walk-up backup': 'Day-of 11 AM',
    },
    party: 4,
  },
  {
    id: 'sgt_inyo',
    type: 'reservation',
    name: 'Inyo NF wilderness — Onion Valley entry',
    agency: 'Inyo NF · recreation.gov',
    why: 'Entry trailhead Onion Valley enters Inyo wilderness — quota of 60/day applies May–Nov.',
    fields: {
      'Booking opens': '6 months out',
      'Booked':        'Mar 12, 2026',
      'Confirmation':  'INV-7724-K',
    },
    party: 4,
  },
]

const INITIAL_SUGGESTIONS: Permit[] = [
  {
    id: 'sgt_canister',
    type: 'selfissue',
    name: 'Bear canister registration (SEKI)',
    agency: 'Sequoia & Kings Canyon NPS',
    why: 'Approved canister required when route crosses SEKI lands (Day 3–6).',
    fields: {},
    party: 4,
  },
  {
    id: 'sgt_parking',
    type: 'parking',
    name: 'Onion Valley trailhead parking',
    agency: 'Inyo NF',
    why: 'Lot fills July–Sep weekends; no fee, but space-limited.',
    fields: { 'Reserve at': 'recreation.gov', 'Backup': 'Independence shuttle' },
    party: 4,
  },
]

const CRITICAL_DATES = [
  { date: 'Feb 1',  label: 'Whitney lottery opens',  tone: 'amber' as PermitTone },
  { date: 'Mar 12', label: 'Inyo entry — book',       tone: 'sky'   as PermitTone },
  { date: 'Mar 15', label: 'Whitney lottery closes',  tone: 'amber' as PermitTone },
  { date: 'Mar 24', label: 'Whitney results',         tone: 'sky'   as PermitTone },
]

const MAP_ZONES = [
  { id: 'inyo',    name: 'Inyo wilderness', color: '#5aa478', poly: '50,60 200,50 220,180 80,200',                    status: 'available' as ZoneStatus, night: 1 },
  { id: 'seki',    name: 'SEKI',            color: '#5ab4dc', poly: '200,50 360,80 340,220 220,180',                  status: 'available' as ZoneStatus, night: 3 },
  { id: 'whitney', name: 'Whitney zone',    color: '#f0a030', poly: '340,220 360,80 410,180 380,290 280,300 220,180', status: 'limited'   as ZoneStatus, night: 7 },
]
const MAP_ROUTE = '70,180 130,140 190,110 250,90 310,110 350,150 380,200 360,260 310,280'

const ZONE_PERMIT_MAP: Record<string, string> = {
  whitney: 'sgt_whitney',
  inyo:    'sgt_inyo',
  seki:    'sgt_canister',
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function IconPlus({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function IconCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function IconList() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
function IconLayers() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}
function IconChevronLeft() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
function IconChevronRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
function IconSparkle() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
}
function IconMap({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

// Per-type icons for permit cards and suggestion rows
function PermitTypeIcon({ type, size = 15 }: { type: PermitTypeName; size?: number }) {
  const base = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'lottery':
      return <svg {...base}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
    case 'reservation':
      return <svg {...base}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'walkup':
      return <svg {...base}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    case 'selfissue':
      return <svg {...base}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    case 'zonenights':
      return <svg {...base}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    case 'hut':
      return <svg {...base}><path d="M3 21l9-15 9 15z"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="6" x2="12" y2="21"/></svg>
    case 'parking':
      return <svg {...base}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>
    case 'fishing':
      return <svg {...base}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
    case 'vehicle':
      return <svg {...base}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  }
}

// ─── TypeChip ─────────────────────────────────────────────────────────────────

function TypeChip({ type }: { type: PermitTypeName }) {
  const t = PERMIT_TYPES[type]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[9px] tracking-[0.06em] uppercase font-semibold ${TONE_CLS[t.tone]}`}>
      {t.label}
    </span>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, value, readOnly }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="font-mono text-[8px] tracking-[0.14em] uppercase text-text-dim mb-1 block">{label}</label>
      <input
        className="w-full px-2.5 py-1.5 border border-border rounded-sm text-[11px] bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors read-only:text-text-mid read-only:cursor-default"
        defaultValue={value}
        readOnly={readOnly}
      />
    </div>
  )
}

// ─── PermitCard ───────────────────────────────────────────────────────────────

function PermitCard({ permit, onRemove, onViewMap, onOverrideParty }: {
  permit: Permit
  onRemove: () => void
  onViewMap: () => void
  onOverrideParty: () => void
}) {
  const t = PERMIT_TYPES[permit.type]
  const fields = Object.entries(permit.fields)

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${TONE_CLS[t.tone]}`}>
          <PermitTypeIcon type={permit.type} size={15} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <TypeChip type={permit.type} />
            <span className="font-mono text-[9px] text-text-dim">
              party {permit.party}
              <button
                onClick={onOverrideParty}
                className="ml-1 text-amber bg-transparent border-none cursor-pointer font-mono text-[9px] p-0 hover:underline"
              >
                override
              </button>
            </span>
          </div>
          <div className="font-heading text-[14px] font-extrabold text-text leading-snug">{permit.name}</div>
          <div className="font-mono text-[9px] text-text-dim mt-0.5">{permit.agency}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onViewMap}
            className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.08em] uppercase text-text-dim hover:text-sky px-2 py-1 border border-transparent hover:border-sky-border hover:bg-sky-dim rounded transition-colors"
          >
            <IconMap size={10} /> Map
          </button>
          <button onClick={onRemove} className="text-text-dim hover:text-red p-1 transition-colors" title="Remove">
            <IconX size={14} />
          </button>
        </div>
      </div>

      {/* Adaptive body keyed off type */}
      {permit.type === 'lottery' && fields.length > 0 && (
        <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 4)}, 1fr)` }}>
          {fields.map(([k, v]) => <Field key={k} label={k} value={v} />)}
        </div>
      )}
      {permit.type === 'reservation' && fields.length > 0 && (
        <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 3)}, 1fr)` }}>
          {fields.map(([k, v]) => <Field key={k} label={k} value={v} />)}
        </div>
      )}
      {permit.type === 'walkup' && (
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Window opens" value="11:00 AM" />
          <Field label="Arrive by"    value="9:30 AM" />
        </div>
      )}
      {permit.type === 'selfissue' && (
        <div className="flex items-center gap-2.5 px-3 py-2 bg-pine-dim border border-pine-border rounded text-[11px] text-text-mid">
          <span className="text-pine shrink-0"><IconCheck size={12} /></span>
          No booking required — self-issue at the trailhead. We'll add a reminder.
        </div>
      )}
      {permit.type === 'zonenights' && (
        <>
          {fields.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {fields.map(([k, v]) => <Field key={k} label={k} value={v} />)}
            </div>
          )}
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-1.5">Zones × nights</div>
          <div className="flex flex-col gap-1">
            {(permit.zones ?? []).map(z => (
              <div
                key={z.night}
                className="grid items-center gap-2.5 px-3 py-2 bg-bg border border-border rounded grid-cols-[44px_1fr_72px]"
              >
                <span className="font-mono text-[10px] font-bold text-amber text-center py-0.5 px-1.5 bg-amber-dim border border-amber-border rounded">
                  N{z.night}
                </span>
                <span className="text-[12px]">{z.zone}</span>
                <span className={`font-mono text-[9px] text-right uppercase tracking-[0.08em] ${ZONE_STATUS_CLS[z.status]}`}>
                  {z.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      {permit.type === 'parking' && fields.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {fields.map(([k, v]) => <Field key={k} label={k} value={v} />)}
        </div>
      )}
    </div>
  )
}

// ─── SuggestionRow ────────────────────────────────────────────────────────────

function SuggestionRow({ permit, onAccept, onReject, onViewMap }: {
  permit: Permit
  onAccept: () => void
  onReject: () => void
  onViewMap: () => void
}) {
  const t = PERMIT_TYPES[permit.type]
  return (
    <div
      className="grid items-start gap-3.5 px-4 py-3.5 bg-surface border border-border rounded-lg grid-cols-[32px_1fr_auto]"
    >
      <span className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${TONE_CLS[t.tone]}`}>
        <PermitTypeIcon type={permit.type} size={15} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <TypeChip type={permit.type} />
          <span className="font-heading text-[13px] font-bold text-text">{permit.name}</span>
        </div>
        <div className="font-mono text-[9px] text-text-dim mb-1">{permit.agency}</div>
        <div className="text-[11px] text-text-mid italic leading-relaxed">{permit.why}</div>
      </div>
      <div className="flex flex-col gap-1.5 items-end shrink-0">
        <button
          onClick={onAccept}
          className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer"
        >
          <IconPlus size={10} /> Add
        </button>
        <button
          onClick={onViewMap}
          className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.08em] uppercase text-text-dim hover:text-sky transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          <IconMap size={9} /> Map
        </button>
        <button
          onClick={onReject}
          className="font-mono text-[9px] tracking-[0.1em] uppercase text-text-dim hover:text-text transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          Not needed
        </button>
      </div>
    </div>
  )
}

// ─── MapZoneSvg — shared placeholder topo (uses useId to avoid global id collisions) ──

function MapZoneSvg({ highlightId }: { highlightId?: string }) {
  const uid = useId()
  const patternId = `topo-modal-${uid}`
  return (
    <div className="relative rounded border border-border overflow-hidden h-[240px] bg-[#0e1810]">
      <svg viewBox="0 0 440 240" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 pointer-events-none">
        <defs>
          <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="440" height="240" fill={`url(#${patternId})`} />
        {MAP_ZONES.map(zone => (
          <polygon
            key={zone.id}
            points={zone.poly}
            fill={zone.color}
            fillOpacity={highlightId === zone.id ? 0.32 : 0.12}
            stroke={zone.color}
            strokeOpacity={highlightId === zone.id ? 0.9 : 0.4}
            strokeWidth={highlightId === zone.id ? 2 : 1}
          />
        ))}
        <polyline points={MAP_ROUTE} fill="none" stroke="#f0a030" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {MAP_ZONES.map(zone => {
          const pts = zone.poly.split(' ').map(p => p.split(',').map(Number))
          const cx = pts.reduce((a, [x]) => a + x, 0) / pts.length
          const cy = pts.reduce((a, [, y]) => a + y, 0) / pts.length
          return (
            <text key={zone.id} x={cx} y={cy} textAnchor="middle" fontSize="9"
              fontFamily="JetBrains Mono, monospace" fill={zone.color} fontWeight="600">
              {zone.name}
            </text>
          )
        })}
      </svg>
      <div className="absolute bottom-2.5 left-2.5 flex gap-3 px-2.5 py-1.5 rounded border border-border font-mono text-[8px] text-text-dim bg-[rgba(15,13,11,0.8)]">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-px bg-amber" /> route</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 border border-sky bg-[rgba(90,180,220,0.25)] opacity-60" /> zone</span>
      </div>
    </div>
  )
}

// ─── MapModal ─────────────────────────────────────────────────────────────────

function MapModal({ permit, onClose }: { permit: Permit; onClose: () => void }) {
  const t = PERMIT_TYPES[permit.type]
  const matchingZone = MAP_ZONES.find(z =>
    (z.id === 'whitney' && permit.id === 'sgt_whitney') ||
    (z.id === 'inyo'    && permit.id === 'sgt_inyo') ||
    (z.id === 'seki'    && permit.id === 'sgt_canister')
  )
  const fields = Object.entries(permit.fields)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(10,9,8,0.78)]">
      <div className="bg-surface border border-border rounded-xl w-full max-w-[640px] overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
          <span className={`w-7 h-7 rounded flex items-center justify-center border shrink-0 ${TONE_CLS[t.tone]}`}>
            <PermitTypeIcon type={permit.type} size={13} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-heading text-[13px] font-bold text-text truncate">{permit.name}</div>
            <div className="font-mono text-[9px] text-text-dim mt-0.5">{permit.agency}</div>
          </div>
          <TypeChip type={permit.type} />
          <button onClick={onClose} className="text-text-dim hover:text-text p-1 transition-colors ml-1">
            <IconX size={16} />
          </button>
        </div>
        <div className="p-5">
          <MapZoneSvg highlightId={matchingZone?.id} />
          {permit.why && (
            <div className="mt-3.5 text-[11px] text-text-mid italic leading-relaxed">{permit.why}</div>
          )}
          {fields.length > 0 && (
            <div className="grid gap-2.5 mt-3.5" style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 3)}, 1fr)` }}>
              {fields.map(([k, v]) => <Field key={k} label={k} value={v} readOnly />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── FreeformDialog ───────────────────────────────────────────────────────────

function FreeformDialog({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (permit: Permit) => void
}) {
  const [step, setStep] = useState<'type' | 'details'>('type')
  const [selectedType, setSelectedType] = useState<PermitTypeName | null>(null)
  const [name, setName] = useState('')
  const [agency, setAgency] = useState('')
  const [notes, setNotes] = useState('')

  function handleAdd() {
    if (!selectedType || !name.trim()) return
    onAdd({
      id: `custom_${Date.now()}`,
      type: selectedType,
      name: name.trim(),
      agency: agency.trim(),
      why: notes.trim(),
      fields: {},
      party: 4,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(10,9,8,0.78)]">
      <div className="bg-surface border border-border rounded-xl w-full max-w-[520px] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
          <span className="font-heading text-[14px] font-extrabold text-text flex-1">Add permit</span>
          <div className="flex items-center gap-1.5 mr-2">
            {(['type', 'details'] as const).map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`font-mono text-[9px] tracking-[0.1em] uppercase ${
                  step === s ? 'text-amber' : (step === 'details' && s === 'type') ? 'text-pine' : 'text-text-dim'
                }`}>
                  {s === 'type' ? 'Type' : 'Details'}
                </span>
                {i < 1 && <span className="text-border text-[10px]">·</span>}
              </span>
            ))}
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text p-1 transition-colors">
            <IconX size={16} />
          </button>
        </div>

        <div className="p-5">
          {step === 'type' && (
            <>
              <p className="text-[12px] text-text-mid mb-4 leading-relaxed">What kind of permit do you need?</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(PERMIT_TYPES) as [PermitTypeName, typeof PERMIT_TYPES[PermitTypeName]][]).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`flex flex-col items-start gap-1.5 p-3 rounded border text-left transition-colors cursor-pointer ${
                      selectedType === key ? TONE_CLS[t.tone] : 'bg-transparent border-border text-text-mid hover:border-border-mid'
                    }`}
                  >
                    <span className="font-mono text-[9px] tracking-[0.1em] uppercase font-semibold">{t.label}</span>
                    <span className="text-[10px] text-text-dim leading-snug">{t.hint}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-start gap-2.5 px-3 py-2.5 bg-amber-dim border border-amber-border rounded text-[11px] text-text-mid">
                <span className="text-amber shrink-0 mt-0.5"><IconSparkle /></span>
                <div>
                  <span className="font-semibold text-text">AI-assisted fill coming soon.</span>{' '}
                  Enter a permit name and Claude will look up key dates, agency info, and booking links for you.
                </div>
              </div>
            </>
          )}

          {step === 'details' && selectedType && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <TypeChip type={selectedType} />
                <button
                  onClick={() => setStep('type')}
                  className="font-mono text-[9px] text-text-dim hover:text-text transition-colors uppercase tracking-[0.1em] bg-transparent border-none cursor-pointer p-0"
                >
                  Change
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1.5 block">Permit name *</label>
                  <input
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-surface-2 text-text outline-none focus:border-border-mid transition-colors"
                    placeholder="e.g. Mt. Whitney overnight permit"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1.5 block">Agency / issuer</label>
                  <input
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-surface-2 text-text outline-none focus:border-border-mid transition-colors"
                    placeholder="e.g. Inyo NF · recreation.gov"
                    value={agency}
                    onChange={e => setAgency(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1.5 block">Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-surface-2 text-text outline-none focus:border-border-mid transition-colors resize-none"
                    placeholder="Why this permit is needed, key dates, links…"
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-[0.1em] uppercase text-text-dim hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            Cancel
          </button>
          {step === 'type' ? (
            <button
              onClick={() => selectedType && setStep('details')}
              disabled={!selectedType}
              className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <IconChevronRight />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('type')}
                className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
              >
                <IconChevronLeft /> Back
              </button>
              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <IconPlus size={10} /> Add to trip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PermitsListView ──────────────────────────────────────────────────────────

function PermitsListView({ permits, suggestions, onAcceptAll, onAccept, onReject, onRemove, onViewMap, onAddFreeform, onOverrideParty, partyConfirmed, onConfirmParty, onJump }: {
  permits: Permit[]
  suggestions: Permit[]
  onAcceptAll: () => void
  onAccept: (p: Permit) => void
  onReject: (p: Permit) => void
  onRemove: (id: string) => void
  onViewMap: (p: Permit) => void
  onAddFreeform: () => void
  onOverrideParty: () => void
  partyConfirmed: boolean
  onConfirmParty: () => void
  onJump: (id: string) => void
}) {
  const [search, setSearch] = useState('')

  return (
    <div className="flex flex-col gap-[22px]">

      {/* Detection banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-dim border border-amber-border rounded-lg">
        <span className="text-amber shrink-0"><IconMap size={16} /></span>
        <div className="flex-1 min-w-0">
          <div className="font-heading text-[12px] font-bold text-amber">
            We checked your route — 4 permit types across 2 agencies
          </div>
          <div className="font-mono text-[9px] text-text-mid mt-0.5">
            Suggestions pulled from{' '}
            <JumpChip to="route" onJump={onJump}>Route</JumpChip>
            {' · '}party of 4 from{' '}
            <JumpChip to="days" onJump={onJump}>Days</JumpChip>
            {' · '}
            {partyConfirmed ? (
              <span className="text-pine">confirmed <span className="inline-block">✓</span></span>
            ) : (
              <button
                onClick={onConfirmParty}
                className="text-amber hover:underline bg-transparent border-none cursor-pointer font-mono text-[9px] p-0"
              >
                confirm party →
              </button>
            )}
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer shrink-0">
          Re-scan
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Suggested for your route</div>
            <button
              onClick={onAcceptAll}
              className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
            >
              <IconCheck size={10} /> Accept all
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {suggestions.map(s => (
              <SuggestionRow
                key={s.id}
                permit={s}
                onAccept={() => onAccept(s)}
                onReject={() => onReject(s)}
                onViewMap={() => onViewMap(s)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Added permits */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">
            On this trip{permits.length > 0 ? ` (${permits.length})` : ''}
          </div>
          {permits.length === 0 && (
            <span className="font-mono text-[9px] text-text-dim">nothing added yet</span>
          )}
        </div>
        {permits.length > 0 ? (
          <div className="flex flex-col gap-3">
            {permits.map(p => (
              <PermitCard
                key={p.id}
                permit={p}
                onRemove={() => onRemove(p.id)}
                onViewMap={() => onViewMap(p)}
                onOverrideParty={onOverrideParty}
              />
            ))}
          </div>
        ) : (
          <div className="px-6 py-6 text-center border border-dashed border-border rounded-lg text-[12px] text-text-dim">
            Accept a suggestion above, or add one manually below.
          </div>
        )}
      </section>

      {/* Add another */}
      <section className="pt-1">
        <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">Add another</div>
        <div className="flex gap-2.5 p-1 bg-surface border border-border rounded-lg">
          <div className="flex-1 flex items-center gap-2 px-3 text-text-dim">
            <IconSearch />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agencies, units, or trailheads…"
              className="flex-1 bg-transparent border-none text-[12px] text-text outline-none py-2.5 placeholder:text-text-dim"
            />
          </div>
          <button
            onClick={onAddFreeform}
            className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-3.5 py-2 border-l border-border text-text-mid bg-transparent hover:text-text hover:bg-surface-2 transition-colors cursor-pointer rounded-r"
          >
            <IconPlus size={10} /> Free-form
          </button>
        </div>
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {(Object.entries(PERMIT_TYPES) as [PermitTypeName, typeof PERMIT_TYPES[PermitTypeName]][]).map(([key, t]) => (
            <button
              key={key}
              onClick={onAddFreeform}
              title={t.hint}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border text-text-mid text-[10px] font-medium bg-transparent hover:border-border-mid hover:text-text transition-colors cursor-pointer"
            >
              <IconPlus size={9} /> {t.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── PermitsMapView ───────────────────────────────────────────────────────────

function PermitsMapView({ permits, suggestions, onAccept, onViewMap, onJump }: {
  permits: Permit[]
  suggestions: Permit[]
  onAccept: (p: Permit) => void
  onViewMap: (p: Permit) => void
  onJump: (id: string) => void
}) {
  const uid = useId()
  const patternId = `topo-mv-${uid}`
  const [activeIdx, setActiveIdx] = useState(0)
  const z = MAP_ZONES[activeIdx]

  const allPermits = [...permits, ...suggestions]
  const linkedPermit = allPermits.find(p => p.id === ZONE_PERMIT_MAP[z.id])
  const isAdded = linkedPermit ? permits.some(p => p.id === linkedPermit.id) : false

  return (
    <div className="flex flex-col gap-[18px]">

      {/* Map SVG panel */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <span className="text-amber shrink-0"><IconMap size={14} /></span>
          <div className="flex-1 min-w-0">
            <div className="font-heading text-[13px] font-bold text-text">Permit zones along your route</div>
            <div className="font-mono text-[9px] text-text-dim mt-0.5">
              Sierra High Route · {MAP_ZONES.length} zones · tap a zone to view its permit
            </div>
          </div>
        </div>
        <div className="relative h-[300px] bg-[#0e1810]">
          <svg
            viewBox="0 0 440 300"
            width="100%" height="100%"
            preserveAspectRatio="xMidYMid meet"
            className="block"
          >
            <defs>
              <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="440" height="300" fill={`url(#${patternId})`} />
            {MAP_ZONES.map((zone, i) => (
              <polygon
                key={zone.id}
                points={zone.poly}
                fill={zone.color}
                fillOpacity={i === activeIdx ? 0.28 : 0.12}
                stroke={zone.color}
                strokeOpacity={i === activeIdx ? 0.9 : 0.4}
                strokeWidth={i === activeIdx ? 2 : 1}
                className="cursor-pointer transition-all duration-150"
                onClick={() => setActiveIdx(i)}
              />
            ))}
            <polyline
              points={MAP_ROUTE}
              fill="none" stroke="#f0a030"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            />
            {MAP_ZONES.map(zone => {
              const pts = zone.poly.split(' ').map(p => p.split(',').map(Number))
              const cx = pts.reduce((a, [x]) => a + x, 0) / pts.length
              const cy = pts.reduce((a, [, y]) => a + y, 0) / pts.length
              return (
                <g key={zone.id}>
                  <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9"
                    fontFamily="JetBrains Mono, monospace" fill={zone.color} fontWeight="600">
                    {zone.name}
                  </text>
                  <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8"
                    fontFamily="Karla, sans-serif" fill="rgba(255,255,255,0.45)">
                    Night {zone.night}
                  </text>
                </g>
              )
            })}
          </svg>
          <div className="absolute bottom-2.5 left-2.5 flex gap-3 px-2.5 py-1.5 rounded border border-border font-mono text-[8px] text-text-dim bg-[rgba(15,13,11,0.8)]">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-px bg-amber" /> route</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 border border-sky bg-[rgba(90,180,220,0.25)] opacity-60" /> zone</span>
          </div>
        </div>
      </div>

      {/* Active zone detail */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-surface-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: z.color }} />
          <span className="font-mono text-[9px] text-text-dim uppercase tracking-[0.1em]">
            Zone {activeIdx + 1} of {MAP_ZONES.length}
          </span>
          <span className="font-heading text-[13px] font-bold text-text">{z.name}</span>
          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="p-1.5 border border-border rounded text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconChevronLeft />
            </button>
            <button
              onClick={() => setActiveIdx(i => Math.min(MAP_ZONES.length - 1, i + 1))}
              disabled={activeIdx === MAP_ZONES.length - 1}
              className="p-1.5 border border-border rounded text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconChevronRight />
            </button>
          </div>
        </div>
        <div className="p-4">
          {linkedPermit ? (
            isAdded ? (
              <div className="flex items-center gap-2 text-[12px] text-text-mid">
                <span className="text-pine shrink-0"><IconCheck size={14} /></span>
                <span>
                  Permit added —{' '}
                  <button
                    onClick={() => onViewMap(linkedPermit)}
                    className="text-sky hover:underline bg-transparent border-none cursor-pointer p-0 text-[12px]"
                  >
                    view detail
                  </button>
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <TypeChip type={linkedPermit.type} />
                  <span className="font-heading text-[13px] font-bold text-text">{linkedPermit.name}</span>
                </div>
                <div className="text-[11px] text-text-mid italic leading-relaxed mb-3">{linkedPermit.why}</div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onAccept(linkedPermit)}
                    className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer"
                  >
                    <IconPlus size={10} /> Add to trip
                  </button>
                  <button
                    onClick={() => onViewMap(linkedPermit)}
                    className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
                  >
                    <IconMap size={10} /> Focus detail
                  </button>
                </div>
              </>
            )
          ) : (
            <div className="text-[12px] text-text-mid italic">No permit detected for this zone.</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-border rounded-lg text-[11px] text-text-mid">
        <span className="text-text-dim shrink-0"><IconMap size={14} /></span>
        <span className="flex-1">
          {permits.length} of {MAP_ZONES.length} zones covered.{' '}
          Re-routing in <JumpChip to="route" onJump={onJump}>Route</JumpChip> will rescan zones.
        </span>
      </div>
    </div>
  )
}

// ─── Right-rail date row ──────────────────────────────────────────────────────

function DateRow({ date, label, tone, last }: { date: string; label: string; tone: PermitTone; last?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 py-2 ${last ? '' : 'border-b border-border'}`}>
      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${TONE_CLS[tone]}`}>{date}</span>
      <span className="text-[11px] text-text-mid flex-1">{label}</span>
    </div>
  )
}

// ─── PermitsStage ─────────────────────────────────────────────────────────────

export function PermitsStage({ onJump, plan, onChange }: StageBodyProps) {
  const [viewMode, setViewMode]         = useState<ViewMode>('list')
  const [permits, setPermits]           = useState<Permit[]>(() => (plan?.permits?.permits as Permit[] | undefined) ?? INITIAL_PERMITS)
  const [suggestions, setSuggestions]   = useState<Permit[]>(INITIAL_SUGGESTIONS)
  const [mapModalPermit, setMapModal]   = useState<Permit | null>(null)
  const [freeformOpen, setFreeformOpen] = useState(false)
  const [permitFree, setPermitFree]     = useState(() => plan?.permits?.permitFree ?? false)
  const [partyConfirmed, setPartyConfirmed] = useState(false)
  const remindersSet  = false  // wired when reminders UI is built
  const backupPlanned = false  // wired when walk-up backup UI is built

  const isMounted   = useRef(false)
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ permits: { permits: permits as unknown as import('../types').PlanPermitEntry[], permitFree } })
  }, [permits, permitFree])

  function accept(p: Permit) {
    setPermits(prev => prev.some(x => x.id === p.id) ? prev : [...prev, p])
    setSuggestions(prev => prev.filter(x => x.id !== p.id))
  }
  function acceptAll() {
    const toAdd = suggestions.filter(s => !permits.some(p => p.id === s.id))
    setPermits(prev => [...prev, ...toAdd])
    setSuggestions([])
  }
  function reject(p: Permit) {
    setSuggestions(prev => prev.filter(x => x.id !== p.id))
  }
  function remove(id: string) {
    setPermits(prev => prev.filter(p => p.id !== id))
  }
  function addCustom(p: Permit) {
    setPermits(prev => [...prev, p])
    setFreeformOpen(false)
  }

  const hasPermits  = permits.length > 0
  const allReviewed = suggestions.length === 0

  const item1 = hasPermits
  const item2 = allReviewed
  const item3 = partyConfirmed
  const item4 = remindersSet
  const item5 = backupPlanned
  const doneCount = [item1, item2, item3, item4, item5].filter(Boolean).length
  const progress  = Math.round((doneCount / 5) * 100)

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 pb-20">
        <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_320px]">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-[18px]">

            {/* Section header + List ⇄ Map toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-heading text-[16px] font-extrabold text-text">Permits & access</div>
                <div className="font-mono text-[9px] text-text-dim mt-0.5">Sierra High Route · Inyo NF, CA</div>
              </div>
              <div className="flex items-stretch bg-surface-2 border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-heading font-bold tracking-[0.06em] uppercase transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-amber-dim text-amber'
                      : 'bg-transparent text-text-mid hover:text-text hover:bg-surface-3'
                  }`}
                >
                  <IconList /> List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-heading font-bold tracking-[0.06em] uppercase transition-colors cursor-pointer border-l border-border ${
                    viewMode === 'map'
                      ? 'bg-amber-dim text-amber'
                      : 'bg-transparent text-text-mid hover:text-text hover:bg-surface-3'
                  }`}
                >
                  <IconLayers /> Map
                </button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <PermitsListView
                permits={permits}
                suggestions={suggestions}
                onAcceptAll={acceptAll}
                onAccept={accept}
                onReject={reject}
                onRemove={remove}
                onViewMap={p => setMapModal(p)}
                onAddFreeform={() => setFreeformOpen(true)}
                onOverrideParty={() => setPartyConfirmed(false)}
                partyConfirmed={partyConfirmed}
                onConfirmParty={() => setPartyConfirmed(true)}
                onJump={onJump}
              />
            ) : (
              <PermitsMapView
                permits={permits}
                suggestions={suggestions}
                onAccept={accept}
                onViewMap={p => setMapModal(p)}
                onJump={onJump}
              />
            )}
          </div>

          {/* ── Right rail ── */}
          <aside className="flex flex-col gap-3.5">

            {/* Stage checklist — context-aware for permit-free mode */}
            <div className="bg-surface border border-border rounded-lg p-3.5">
              <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
              {permitFree ? (
                <>
                  <CheckItem text="Route reviewed for permits" done />
                  <CheckItem text="Confirmed — no permits required" done />
                </>
              ) : (
                <>
                  <CheckItem text="At least one permit added"  done={item1} />
                  <CheckItem text="All suggestions reviewed"   done={item2} />
                  <CheckItem text="Party size confirmed"       done={item3} />
                  <CheckItem text="Reminders set"              done={item4} />
                  <CheckItem text="Walk-up backup planned"     done={item5} />
                </>
              )}
              <div className="h-px bg-border my-3" />
              <ProgressBar value={permitFree ? 100 : progress} tone={permitFree ? 'pine' : 'amber'} />
              <div className="font-mono text-[9px] text-text-dim text-center mt-1.5">
                {permitFree ? '2 of 2 · permit-free' : `${doneCount} of 5`}
              </div>
            </div>

            {/* Critical dates — hidden in permit-free mode */}
            {!permitFree && (
              <div className="bg-surface border border-border rounded-lg p-3.5">
                <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-1">Critical dates</div>
                {CRITICAL_DATES.map((d, i) => (
                  <DateRow key={d.label} {...d} last={i === CRITICAL_DATES.length - 1} />
                ))}
              </div>
            )}

            {/* Permit-free callout */}
            {!permitFree ? (
              <div className="flex items-start gap-2.5 px-3 py-3 bg-pine-dim border border-pine-border rounded-lg">
                <span className="text-pine shrink-0 mt-0.5"><IconCheck size={14} /></span>
                <div className="text-[11px] text-text-mid">
                  <span className="font-semibold text-text">No permit needed?</span>{' '}
                  If you've reviewed and your trip is permit-free, mark this stage complete.
                  <button
                    onClick={() => setPermitFree(true)}
                    className="block mt-2 font-mono text-[9px] tracking-[0.12em] uppercase text-pine hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
                  >
                    Mark as permit-free →
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 px-3 py-3 bg-pine-dim border border-pine-border rounded-lg">
                <span className="text-pine shrink-0 mt-0.5"><IconCheck size={14} /></span>
                <div className="flex-1 text-[11px] text-text-mid">
                  <span className="font-semibold text-text">Stage complete — permit-free trip.</span>
                </div>
                <button
                  onClick={() => setPermitFree(false)}
                  className="text-text-dim hover:text-text p-0.5 transition-colors bg-transparent border-none cursor-pointer shrink-0"
                  title="Undo"
                >
                  <IconX size={12} />
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>

      {mapModalPermit && (
        <MapModal permit={mapModalPermit} onClose={() => setMapModal(null)} />
      )}
      {freeformOpen && (
        <FreeformDialog onClose={() => setFreeformOpen(false)} onAdd={addCustom} />
      )}
    </>
  )
}