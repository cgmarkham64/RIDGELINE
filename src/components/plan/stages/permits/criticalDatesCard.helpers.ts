import type { PlanCriticalDate } from '../../types'

// Strip " — Permit Name" suffix added by extractScanDates before comparing labels
function baseLabel(s: string): string {
  return s.replace(/\s*—\s*.+$/, '').trim().toLowerCase()
}

export function mergeCriticalDates(scanDates: PlanCriticalDate[], manualDates: PlanCriticalDate[]): PlanCriticalDate[] {
  const seen = new Set<string>()
  return [...scanDates, ...manualDates]
    .sort((a, b) => a.dateMs - b.dateMs)
    .filter(d => {
      const key = `${d.dateMs}|${baseLabel(d.label)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}
