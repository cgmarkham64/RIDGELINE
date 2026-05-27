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
