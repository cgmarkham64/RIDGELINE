const DAY_MS = 86_400_000

// ─── Julian day helpers ───────────────────────────────────────────────────────

function julianDay(date: Date): number {
  return date.getTime() / DAY_MS + 2_440_587.5
}

function julianToDate(jd: number): Date {
  return new Date((jd - 2_440_587.5) * DAY_MS)
}

// ─── Degree ↔ radian helpers ──────────────────────────────────────────────────

const DEG = Math.PI / 180

function sinD(deg: number): number { return Math.sin(deg * DEG) }
function cosD(deg: number): number { return Math.cos(deg * DEG) }
function acosD(x: number): number  { return Math.acos(x) / DEG }

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SunTimes {
  sunrise: Date
  sunset: Date
  daylightHours: number
}

// ─── Core algorithm (NOAA / Meeus simplified) ─────────────────────────────────

/**
 * Returns sunrise/sunset in UTC for the given lat/lng/date.
 * date should be constructed at noon UTC for the calendar day of interest.
 */
export function getSunTimes(lat: number, lng: number, date: Date): SunTimes {
  const jd = julianDay(date)

  const n      = Math.round(jd - 2_451_545 - 0.0009 + lng / 360)
  const jStar  = 2_451_545 + 0.0009 - lng / 360 + n

  const M      = ((357.5291 + 0.98560028 * (jStar - 2_451_545)) % 360 + 360) % 360
  const C      = 1.9148 * sinD(M) + 0.02 * sinD(2 * M) + 0.0003 * sinD(3 * M)
  const lambda = (M + C + 180 + 102.9372) % 360

  const jTransit = jStar + 0.0053 * sinD(M) - 0.0069 * sinD(2 * lambda)

  const sinDecl  = sinD(lambda) * sinD(23.4397)
  const cosDecl  = Math.sqrt(1 - sinDecl * sinDecl)
  const cosOmega = (sinD(-0.833) - sinD(lat) * sinDecl) / (cosD(lat) * cosDecl)

  // Polar night
  if (cosOmega >= 1) {
    const noon = julianToDate(jTransit)
    return { sunrise: noon, sunset: noon, daylightHours: 0 }
  }

  // Midnight sun
  if (cosOmega <= -1) {
    const rise = julianToDate(jTransit - 0.5)
    const set  = julianToDate(jTransit + 0.5)
    return { sunrise: rise, sunset: set, daylightHours: 24 }
  }

  const omega = acosD(cosOmega)
  const jRise = jTransit - omega / 360
  const jSet  = jTransit + omega / 360

  return {
    sunrise: julianToDate(jRise),
    sunset:  julianToDate(jSet),
    daylightHours: (jSet - jRise) * 24,
  }
}

// ─── Multi-day helper ─────────────────────────────────────────────────────────

/**
 * Generates one SunTimes row per calendar day between startDate and endDate
 * inclusive. startDate/endDate are 'YYYY-MM-DD' strings.
 */
export function tripSunRows(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): Array<{ date: Date; sunrise: Date; sunset: Date; daylightHours: number }> {
  const rows: Array<{ date: Date; sunrise: Date; sunset: Date; daylightHours: number }> = []

  const start = new Date(startDate + 'T12:00:00Z')
  const end   = new Date(endDate   + 'T12:00:00Z')

  let cursor = start.getTime()
  const endMs = end.getTime()

  while (cursor <= endMs) {
    const date       = new Date(cursor)
    const { sunrise, sunset, daylightHours } = getSunTimes(lat, lng, date)
    rows.push({ date, sunrise, sunset, daylightHours })
    cursor += DAY_MS
  }

  return rows
}