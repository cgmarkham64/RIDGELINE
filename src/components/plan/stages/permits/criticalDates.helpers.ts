import type { PermitTone } from './permitsStage.types'
import type { PlanCriticalDate, PlanPermitEntry } from '../../types'

const MONTH_RE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}(,\s*\d{4})?/i
const ISO_RE   = /^\d{4}-\d{2}-\d{2}/
const MONTH_IDX: Record<string, number> = {
  jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11,
}

export function looksLikeDate(v: string) {
  return MONTH_RE.test(v.trim()) || ISO_RE.test(v.trim())
}

export function parseDateMs(dateStr: string): number {
  const iso = Date.parse(dateStr)
  if (!isNaN(iso)) return iso
  const m = dateStr.match(/^(\w{3})\w*\s+(\d{1,2})(?:,\s*(\d{4}))?/i)
  if (m) {
    const idx = MONTH_IDX[m[1].toLowerCase()]
    if (idx !== undefined)
      return new Date(parseInt(m[3] ?? String(new Date().getFullYear())), idx, parseInt(m[2])).getTime()
  }
  return Infinity
}

export function extractScanDates(permits: PlanPermitEntry[]): PlanCriticalDate[] {
  const dates: PlanCriticalDate[] = []
  for (const permit of permits) {
    for (const [key, value] of Object.entries(permit.fields)) {
      if (!looksLikeDate(value)) continue
      const tone: PermitTone =
        permit.type === 'lottery'                               ? 'amber' :
        permit.type === 'reservation' || permit.type === 'hut'  ? 'sky'   : 'pine'
      dates.push({
        id:     `scan__${permit.id}__${key}`,
        date:   value,
        label:  `${key} — ${permit.name}`,
        tone,
        source: 'scan',
      })
    }
  }
  return dates
}
