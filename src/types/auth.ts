export type SunAnchor = 'sunrise' | 'sunset'

export interface TimePreference {
  mode: 'relative' | 'static'
  anchor?: SunAnchor
  offsetMinutes?: number
  staticTime?: string
}

export interface WeatherTolerances {
  tempCautionF: number | null      // null = disabled; low temp below this → Caution
  tempDelayF: number | null        // null = disabled; low temp below this → Delay
  precipCautionPct: number | null  // null = disabled; precip % above this → Caution
  precipDelayPct: number | null    // null = disabled; precip % above this → Delay
  windCautionMph: number | null    // null = disabled; wind mph above this → Caution
  windDelayMph: number | null      // null = disabled; wind mph above this → Delay
}

export const DEFAULT_WEATHER_TOLERANCES: WeatherTolerances = {
  tempCautionF:    45,
  tempDelayF:      32,
  precipCautionPct: 40,
  precipDelayPct:  70,
  windCautionMph:  30,
  windDelayMph:    45,
}

export interface UserPreferences {
  wakeTime: TimePreference
  onTrailTime: TimePreference
  campByTime: TimePreference
  weatherTolerances: WeatherTolerances
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  wakeTime:           { mode: 'relative', anchor: 'sunrise', offsetMinutes: 0 },
  onTrailTime:        { mode: 'relative', anchor: 'sunrise', offsetMinutes: 60 },
  campByTime:         { mode: 'relative', anchor: 'sunset',  offsetMinutes: -60 },
  weatherTolerances:  { ...DEFAULT_WEATHER_TOLERANCES },
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
