import type { User } from '../types/auth'
import { api } from './api'

export async function localLogin(email: string, password: string): Promise<{ token: string; user: User }> {
  const { data } = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password })
  return data
}

export async function localRegister(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
  const { data } = await api.post<{ token: string; user: User }>('/api/auth/register', { name, email, password })
  return data
}

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