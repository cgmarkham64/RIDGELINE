export type SunAnchor = 'sunrise' | 'sunset'

export interface TimePreference {
  mode: 'relative' | 'static'
  anchor?: SunAnchor
  offsetMinutes?: number
  staticTime?: string
}

export interface UserPreferences {
  wakeTime: TimePreference
  onTrailTime: TimePreference
  campByTime: TimePreference
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  wakeTime:    { mode: 'relative', anchor: 'sunrise', offsetMinutes: 0 },
  onTrailTime: { mode: 'relative', anchor: 'sunrise', offsetMinutes: 60 },
  campByTime:  { mode: 'relative', anchor: 'sunset',  offsetMinutes: -60 },
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  preferences?: UserPreferences
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}
