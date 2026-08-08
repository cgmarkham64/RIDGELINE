// Stage-internal types (not persisted)

export interface ClimateNormals {
  avgHighF: number
  avgLowF: number
  precipPct: number   // 0–100
  snowLikely: boolean
}

export interface DepartureRiskFactor {
  date: string        // YYYY-MM-DD
  label: string
  severity: 'moderate' | 'high'
}

export type CardTint = { bg: string; border: string }

export type RiskLevel = 'low' | 'moderate' | 'high'

export type RiskStyle = { label: string; border: string; bg: string; text: string }

export type SunTimes = { sunrise: Date; sunset: Date; daylightHours: number }
