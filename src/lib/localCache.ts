// Generic TTL-based cache over localStorage, used to avoid re-hitting third-party
// APIs (geocoding, elevation, OSM data) for inputs we've already resolved recently.

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const MS_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND

export function daysToMs(days: number): number {
  return days * MS_PER_DAY
}

export function readCachedTTL<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number }
    if (Date.now() - ts > ttlMs) { localStorage.removeItem(key); return null }
    return data
  } catch { return null }
}

export function writeCachedTTL<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch { /* quota */ }
}
