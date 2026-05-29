import { api } from './api'
import type { PlanPermitEntry, PermitSource } from '../components/plan/types'

export interface PermitScanResult {
  permits: PlanPermitEntry[]
  sources: PermitSource[]
}

export async function suggestPermits(tripId: string): Promise<PermitScanResult> {
  const res = await api.post<PermitScanResult>(`/api/trips/${tripId}/permits/suggest`)
  return res.data
}
