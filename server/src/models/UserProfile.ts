import { Schema, model } from 'mongoose'

export type SunAnchor = 'sunrise' | 'sunset'

export interface TimePreference {
  mode: 'relative' | 'static'
  anchor?: SunAnchor
  offsetMinutes?: number
  staticTime?: string
}

export interface WeatherTolerances {
  tempCautionF: number | null
  tempDelayF: number | null
  precipCautionPct: number | null
  precipDelayPct: number | null
  windCautionMph: number | null
  windDelayMph: number | null
}

export interface MacroTargets {
  calories?: string
  protein?: string
  fat?: string
  carbs?: string
}

export interface UserPreferences {
  wakeTime: TimePreference
  onTrailTime: TimePreference
  campByTime: TimePreference
  weatherTolerances: WeatherTolerances
  unitSystem?: 'imperial' | 'metric'
  macroTargets?: MacroTargets
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  wakeTime:           { mode: 'relative', anchor: 'sunrise', offsetMinutes: 0 },
  onTrailTime:        { mode: 'relative', anchor: 'sunrise', offsetMinutes: 60 },
  campByTime:         { mode: 'relative', anchor: 'sunset',  offsetMinutes: -60 },
  weatherTolerances:  { tempCautionF: 45, tempDelayF: 32, precipCautionPct: 40, precipDelayPct: 70, windCautionMph: 30, windDelayMph: 45 },
  unitSystem:         'imperial',
}

interface IUserProfile {
  sub: string
  name: string
  email: string
  avatarUrl?: string
  preferences?: UserPreferences
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    sub:      { type: String, required: true, unique: true, index: true },
    name:     { type: String, required: true },
    email:    { type: String, required: true },
    avatarUrl: { type: String },
    preferences: { type: Schema.Types.Mixed, default: () => ({ ...DEFAULT_PREFERENCES }) },
  },
  { timestamps: true }
)

export const UserProfile = model<IUserProfile>('UserProfile', UserProfileSchema)
