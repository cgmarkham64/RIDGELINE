import { PERMIT_DATE_PRESETS } from './permitsStage.constants'
import { toDateInputValue, toTimeInputValue, toDateMs } from './criticalDates.helpers'
import type { Permit, PermitTone } from './permitsStage.types'
import type { PermitTypeName, PlanCriticalDate, ZoneStatus } from '../../types'
import type { CustomDraftInput, DraftDate, DraftZone } from './freeformDialog.types'

export const ZONE_STATUS_BTNS: { value: ZoneStatus; label: string; cls: string }[] = [
  { value: 'available', label: 'Avail',   cls: 'bg-pine-dim border-pine-border text-pine'   },
  { value: 'limited',   label: 'Limited', cls: 'bg-amber-dim border-amber-border text-amber' },
  { value: 'sold_out',  label: 'Full',    cls: 'bg-red-dim border-red-border text-red'       },
]

export const TONE_BTNS: { value: PermitTone; label: string; cls: string }[] = [
  { value: 'amber', label: 'Deadline', cls: 'bg-amber-dim border-amber-border text-amber' },
  { value: 'sky',   label: 'Booking',  cls: 'bg-sky-dim border-sky-border text-sky'       },
  { value: 'pine',  label: 'Info',     cls: 'bg-pine-dim border-pine-border text-pine'     },
]

export const INPUT_CLS = 'px-2.5 py-1.5 bg-surface-2 border border-border rounded font-mono text-fine text-text outline-none focus:border-border-mid transition-[border-color]'

export interface PermitFormFieldDefaults {
  name:       string
  agency:     string
  url:        string
  confirmNum: string
  trailhead:  string
  notes:      string
  draftZones: DraftZone[]
}

const EMPTY_FIELD_DEFAULTS: PermitFormFieldDefaults = {
  name: '', agency: '', url: '', confirmNum: '', trailhead: '', notes: '', draftZones: [],
}

export function permitFormFieldDefaults(initialPermit?: Permit): PermitFormFieldDefaults {
  if (!initialPermit) return EMPTY_FIELD_DEFAULTS
  return {
    name:       initialPermit.name,
    agency:     initialPermit.agency,
    url:        initialPermit.url ?? '',
    confirmNum: initialPermit.fields['Confirmation #'] ?? '',
    trailhead:  initialPermit.fields['Trailhead'] ?? '',
    notes:      initialPermit.why,
    draftZones: initialPermit.zones?.map((z) => ({ zone: z.zone, status: z.status })) ?? [],
  }
}

export function stepLabelClass(current: 'type' | 'details', label: 'type' | 'details'): string {
  if (current === label) return 'text-amber'
  if (current === 'details' && label === 'type') return 'text-pine'
  return 'text-text-dim'
}

export function buildDraftDates(type: PermitTypeName, existing: PlanCriticalDate[]): DraftDate[] {
  const presets    = PERMIT_DATE_PRESETS[type]
  const byLabel    = Object.fromEntries(existing.map(d => [d.label, d]))
  const presetKeys = new Set(presets.map(p => p.label))

  const presetRows: DraftDate[] = presets.map(p => {
    const ex = byLabel[p.label]
    return {
      key:      p.key,
      label:    p.label,
      dateStr:  ex?.dateMs ? toDateInputValue(ex.dateMs) : '',
      timeStr:  ex?.hasTime && ex.dateMs ? toTimeInputValue(ex.dateMs) : '',
      tone:     (ex?.tone as PermitTone | undefined) ?? p.tone,
      isPreset: true,
    }
  })

  const customRows: DraftDate[] = existing
    .filter(d => !presetKeys.has(d.label))
    .map((d, i) => ({
      key:      `custom_${i}`,
      label:    d.label,
      dateStr:  d.dateMs ? toDateInputValue(d.dateMs) : '',
      timeStr:  d.hasTime && d.dateMs ? toTimeInputValue(d.dateMs) : '',
      tone:     d.tone as PermitTone,
      isPreset: false,
    }))

  return [...presetRows, ...customRows]
}

export function buildCustomDraftDate(input: CustomDraftInput, idx: number): DraftDate {
  return {
    key:      `custom_${idx}_${Date.now()}`,
    label:    input.label.trim(),
    dateStr:  input.date,
    timeStr:  input.time,
    tone:     input.tone,
    isPreset: false,
  }
}

export function toCriticalDates(permitId: string, rows: DraftDate[]): PlanCriticalDate[] {
  return rows
    .filter(d => d.dateStr && d.label.trim())
    .map((d, i) => ({
      id:      d.isPreset ? `pcd_${permitId}_${d.key}` : `pcd_${permitId}_custom_${i}`,
      dateMs:  toDateMs(d.dateStr, d.timeStr || undefined),
      hasTime: !!d.timeStr,
      label:   d.label.trim(),
      tone:    d.tone,
      source:  'permit' as const,
    }))
}

interface PermitDraftParams {
  initialPermit?: Permit
  selectedType:   PermitTypeName
  name:           string
  agency:         string
  notes:          string
  confirmNum:     string
  trailhead:      string
  partySize:      number
  draftZones:     DraftZone[]
  url:            string
  draftDates:     DraftDate[]
}

function draftPermitFields(p: PermitDraftParams): Record<string, string> {
  return {
    ...(p.initialPermit?.fields ?? {}),
    ...(p.confirmNum.trim() ? { 'Confirmation #': p.confirmNum.trim() } : {}),
    ...(p.trailhead.trim() ? { 'Trailhead': p.trailhead.trim() } : {}),
  }
}

function draftPermitZones(p: PermitDraftParams) {
  if (p.selectedType !== 'zonenights') return p.initialPermit?.zones
  return p.draftZones.filter(z => z.zone.trim()).map((z, i) => ({ night: i + 1, zone: z.zone.trim(), status: z.status }))
}

export function buildPermitFromDraft(p: PermitDraftParams): Permit {
  const permitId = p.initialPermit?.id ?? `custom_${Date.now()}`
  return {
    id:            permitId,
    type:          p.selectedType,
    name:          p.name.trim(),
    agency:        p.agency.trim(),
    why:           p.notes.trim(),
    fields:        draftPermitFields(p),
    party:         p.partySize,
    zones:         draftPermitZones(p),
    url:           p.url.trim() || undefined,
    zoneId:        p.initialPermit?.zoneId,
    confidence:    p.initialPermit?.confidence,
    criticalDates: toCriticalDates(permitId, p.draftDates),
    autoDetected:  p.initialPermit?.autoDetected,
    zoneWarnings:  p.initialPermit?.zoneWarnings,
  }
}
