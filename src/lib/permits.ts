import { api } from './api'
import type { PermitLink, PermitTypeName } from '../components/plan/types'

export interface PermitScanResult {
  links: PermitLink[]
}

export async function suggestPermits(tripId: string): Promise<PermitScanResult> {
  const res = await api.post<PermitScanResult>(`/api/trips/${tripId}/permits/suggest`)
  return res.data
}

export interface PermitLookupResult {
  name:             string
  agency:           string
  type:             PermitTypeName
  why:              string
  url?:             string
  criticalDates:    { label: string; dateStr?: string; timeStr?: string; tone: 'amber' | 'sky' | 'pine' }[]
  confidence:       'high' | 'medium' | 'low'
  verificationNote: string
}

export async function lookupPermit(
  tripId: string,
  permitName: string,
  links: PermitLink[],
): Promise<PermitLookupResult> {
  const res = await api.post<PermitLookupResult>(
    `/api/trips/${tripId}/permits/lookup`,
    { permitName, links },
  )
  return res.data
}
