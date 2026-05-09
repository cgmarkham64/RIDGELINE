import type { User } from '../types/auth'
import { api } from './api'

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/api/auth/me')
  return data.user
}

export async function uploadAvatar(avatarDataUrl: string): Promise<User> {
  const { data } = await api.put<{ user: User }>('/api/auth/me/avatar', { avatarDataUrl })
  return data.user
}

export async function removeAvatar(): Promise<User> {
  const { data } = await api.delete<{ user: User }>('/api/auth/me/avatar')
  return data.user
}