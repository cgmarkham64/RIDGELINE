export type UnitSystem = 'imperial' | 'metric'

// ─── Raw conversions ──────────────────────────────────────────────────────────
// Return unrounded floats so they compose safely (round-trip lossless).
// Rounding belongs in format helpers or at the display boundary.
// The literals below (1.60934 km/mi, 3.28084 ft/m, 5/9 °F-°C slope, 32 °F
// offset) are the conversion factors themselves — naming each one would
// fragment the formula rather than clarify it.

export const fToC      = (f: number): number => (f - 32) * 5 / 9
export const cToF      = (c: number): number => c * 9 / 5 + 32
export const milesToKm = (mi: number): number => mi * 1.60934
export const kmToMiles = (km: number): number => km / 1.60934
export const ftToM     = (ft: number): number => ft / 3.28084
export const mToFt     = (m: number): number => m * 3.28084
export const mphToKmh  = (mph: number): number => mph * 1.60934
export const kmhToMph  = (kmh: number): number => kmh / 1.60934

// ─── Unit labels ──────────────────────────────────────────────────────────────

export const tempUnit = (sys: UnitSystem) => sys === 'metric' ? '°C' : '°F'
export const distUnit = (sys: UnitSystem) => sys === 'metric' ? 'km' : 'mi'
export const elevUnit = (sys: UnitSystem) => sys === 'metric' ? 'm' : 'ft'
export const windUnit = (sys: UnitSystem) => sys === 'metric' ? 'km/h' : 'mph'

// ─── Display formatters (canonical input is always imperial) ──────────────────

export function fmtTemp(f: number, sys: UnitSystem): string {
  return sys === 'metric' ? `${Math.round(fToC(f))}°C` : `${Math.round(f)}°F`
}

export function fmtDist(miles: number | null | undefined, sys: UnitSystem, decimals = 1): string {
  if (miles == null) return '—'
  return sys === 'metric'
    ? `${milesToKm(miles).toFixed(decimals)} km`
    : `${miles.toFixed(decimals)} mi`
}

export function fmtElevGain(ft: number | null | undefined, sys: UnitSystem): string {
  if (ft == null) return '—'
  return sys === 'metric'
    ? `+${Math.round(ftToM(ft)).toLocaleString()} m`
    : `+${ft.toLocaleString()} ft`
}

export function fmtElevAbs(ft: number, sys: UnitSystem): string {
  return sys === 'metric'
    ? `${Math.round(ftToM(ft)).toLocaleString()} m`
    : `${Math.round(ft).toLocaleString()} ft`
}

export function fmtElevLoss(ft: number, sys: UnitSystem): string {
  return sys === 'metric'
    ? `-${Math.round(ftToM(ft)).toLocaleString()} m`
    : `-${ft.toLocaleString()} ft`
}

export function fmtWind(mph: number, sys: UnitSystem): string {
  return sys === 'metric' ? `${Math.round(mphToKmh(mph))} km/h` : `${Math.round(mph)} mph`
}

// ─── Form value helpers (for unit-aware inputs) ───────────────────────────────
// Convert stored imperial value → display string in user's unit

export function toDisplayDist(imperialMiles: number, sys: UnitSystem): string {
  return sys === 'metric'
    ? milesToKm(imperialMiles).toFixed(2)
    : imperialMiles.toString()
}

export function fromDisplayDist(displayVal: number, sys: UnitSystem): number {
  return sys === 'metric' ? kmToMiles(displayVal) : displayVal
}

export function toDisplayElevGain(imperialFt: number, sys: UnitSystem): string {
  return sys === 'metric' ? Math.round(ftToM(imperialFt)).toString() : imperialFt.toString()
}

export function fromDisplayElevGain(displayVal: number, sys: UnitSystem): number {
  return sys === 'metric' ? mToFt(displayVal) : displayVal
}

export function toDisplayTemp(imperialF: number, sys: UnitSystem): string {
  return sys === 'metric' ? Math.round(fToC(imperialF)).toString() : imperialF.toString()
}

export function fromDisplayTemp(displayVal: number, sys: UnitSystem): number {
  return sys === 'metric' ? cToF(displayVal) : displayVal
}