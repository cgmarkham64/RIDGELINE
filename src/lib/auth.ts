import type { AuthResponse, LoginInput, RegisterInput } from '../types/auth'
import { api } from './api'

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', input)
  return data
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/register', input)
  return data
}