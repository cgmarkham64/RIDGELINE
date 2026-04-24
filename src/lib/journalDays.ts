import { api } from './api'
import type { JournalDay } from '../types'

export interface JournalDayInput {
  tripId: string
  date: string
  dayNumber: number
  title?: string
  body: string
  milesCovered?: number
  elevationGainFt?: number
  weatherNotes?: string
  tempLowF?: number
  tempHighF?: number
}

export async function fetchJournalDays(tripId: string): Promise<JournalDay[]> {
  const { data } = await api.get<JournalDay[]>('/api/journal-days', { params: { tripId } })
  return data
}

export async function createJournalDay(input: JournalDayInput): Promise<JournalDay> {
  const { data } = await api.post<JournalDay>('/api/journal-days', input)
  return data
}

export async function updateJournalDay(id: string, input: JournalDayInput): Promise<JournalDay> {
  const { data } = await api.put<JournalDay>(`/api/journal-days/${id}`, input)
  return data
}
