import { api } from './api'
import type { PermitLink } from '../components/plan/types'

export interface PermitScanResult {
  links: PermitLink[]
}

export async function suggestPermits(tripId: string): Promise<PermitScanResult> {
  const res = await api.post<PermitScanResult>(`/api/trips/${tripId}/permits/suggest`)
  return res.data
}
