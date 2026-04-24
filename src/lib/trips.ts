import { api } from './api'
import type { Trip } from '../types'

export interface TripInput {
  title: string
  location: string
  startDate: string
  endDate: string
  description?: string
  distanceMiles?: number
  elevationGainFt?: number
}

export async function fetchTrips(): Promise<Trip[]> {
  const { data } = await api.get<Trip[]>('/api/trips')
  return data
}

export async function createTrip(input: TripInput): Promise<Trip> {
  const { data } = await api.post<Trip>('/api/trips', input)
  return data
}

export async function updateTrip(id: string, input: TripInput): Promise<Trip> {
  const { data } = await api.put<Trip>(`/api/trips/${id}`, input)
  return data
}

export async function deleteTrip(id: string): Promise<void> {
  await api.delete(`/api/trips/${id}`)
}
