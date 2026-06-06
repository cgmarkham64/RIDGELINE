import type { PlanCriticalDate, PlanPermitEntry } from '../../types'

// ── Epoch ↔ input value helpers ───────────────────────────────────────────────

export function toDateInputValue(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function toTimeInputValue(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function toDateMs(dateStr: string, timeStr?: string): number {
  return new Date(`${dateStr}T${timeStr ?? '00:00'}`).getTime()
}

// ── Display formatting ────────────────────────────────────────────────────────

const DATE_FMT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
const DATETIME_FMT: Intl.DateTimeFormatOptions = {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
}

export function formatCriticalDate(d: PlanCriticalDate): string {
  if (!d.dateMs || isNaN(d.dateMs)) return '—'
  return new Intl.DateTimeFormat(undefined, d.hasTime ? DATETIME_FMT : DATE_FMT).format(d.dateMs)
}

export function formatDateOnly(ms: number): string {
  if (!ms || isNaN(ms)) return '—'
  return new Intl.DateTimeFormat(undefined, DATE_FMT).format(ms)
}

// ── Roll up per-permit critical dates for the right rail ──────────────────────

export function extractScanDates(permits: PlanPermitEntry[]): PlanCriticalDate[] {
  const dates: PlanCriticalDate[] = []
  for (const permit of permits) {
    for (const cd of permit.criticalDates ?? []) {
      if (!cd.dateMs) continue
      dates.push({
        ...cd,
        id:     `permit__${permit.id}__${cd.id}`,
        label:  `${cd.label} — ${permit.name}`,
        source: 'permit',
      })
    }
  }
  return dates
}
