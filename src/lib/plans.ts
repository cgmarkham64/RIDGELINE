import { api } from './api'
import type { Trip } from '../types'

const ISO_DATE_LENGTH = 10

function todayIso() {
  return new Date().toISOString().slice(0, ISO_DATE_LENGTH)
}

export async function fetchPlans(): Promise<Trip[]> {
  const { data } = await api.get<Trip[]>('/api/trips')
  return data.filter((t) => t.status === 'planning' || t.status === 'ready')
}

export async function fetchPlan(id: string): Promise<Trip> {
  const { data } = await api.get<Trip>(`/api/trips/${id}`)
  return data
}

export async function createPlan(): Promise<Trip> {
  const today = todayIso()
  const { data } = await api.post<Trip>('/api/trips', {
    title: 'Untitled Trip',
    location: '',
    startDate: today,
    endDate: today,
    status: 'planning',
    planStages: {},
  })
  return data
}

export async function updatePlan(
  id: string,
  body: {
    title?: string
    location?: string
    startDate?: string
    endDate?: string
    planStages?: object
    status?: string
  }
): Promise<Trip> {
  const { data } = await api.put<Trip>(`/api/trips/${id}`, body)
  return data
}

export async function deletePlan(id: string): Promise<void> {
  await api.delete(`/api/trips/${id}`)
}