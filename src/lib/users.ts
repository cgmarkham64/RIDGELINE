import { api } from './api'

export interface UserSearchResult {
  sub: string
  name: string
}

export async function searchUsers(q: string): Promise<UserSearchResult[]> {
  const { data } = await api.get<UserSearchResult[]>('/api/users/search', { params: { q } })
  return data
}

export async function shareTrip(tripId: string, sub: string, role: 'read' | 'edit' = 'edit'): Promise<void> {
  await api.post(`/api/trips/${tripId}/share`, { sub, role })
}