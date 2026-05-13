import { api } from './api'
import type { PlanMeta, PlanData } from '../components/plan/types'

export interface PlanRecord {
  _id: string
  ownerSub: string
  meta: PlanMeta
  stages: PlanData
  createdAt: string
  updatedAt: string
}

export async function fetchPlans(): Promise<PlanRecord[]> {
  const { data } = await api.get<PlanRecord[]>('/api/plans')
  return data
}

export async function fetchPlan(id: string): Promise<PlanRecord> {
  const { data } = await api.get<PlanRecord>(`/api/plans/${id}`)
  return data
}

export async function createPlan(meta?: Partial<PlanMeta>): Promise<PlanRecord> {
  meta = meta ?? {}
  const { data } = await api.post<PlanRecord>('/api/plans', { meta, stages: {} })
  return data
}

export async function updatePlan(
  id: string,
  body: { meta?: Partial<PlanMeta>; stages?: PlanData }
): Promise<PlanRecord> {
  const { data } = await api.put<PlanRecord>(`/api/plans/${id}`, body)
  return data
}

export async function deletePlan(id: string): Promise<void> {
  await api.delete(`/api/plans/${id}`)
}