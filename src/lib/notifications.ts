import { api } from './api'
import type { AppNotification } from '../types'

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>('/api/notifications')
  return data
}

export async function acceptInvite(id: string): Promise<void> {
  await api.post(`/api/notifications/${id}/accept`)
}

export async function declineInvite(id: string): Promise<void> {
  await api.post(`/api/notifications/${id}/decline`)
}

export async function markAllRead(): Promise<void> {
  await api.patch('/api/notifications/read-all')
}