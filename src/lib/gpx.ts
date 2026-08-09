import type { GpxTrack } from '../types'

export interface ParsedGpx {
  track: GpxTrack
  /** ISO 8601 timestamp of the first track point — present when the GPX includes <time> elements */
  firstTimestamp?: string
}

const ELEVATION_BATCH = 100

function interpolateElevations(
  result: [number, number, number][],
  indices: number[]
): void {
  for (let si = 0; si < indices.length - 1; si++) {
    const i0 = indices[si]
    const i1 = indices[si + 1]
    const e0 = result[i0][2]
    const e1 = result[i1][2]
    for (let i = i0 + 1; i < i1; i++) {
      const t = (i - i0) / (i1 - i0)
      result[i][2] = e0 + t * (e1 - e0)
    }
  }
}

/**
 * Fills in missing elevation data (all-zero ele values) by querying the
 * Open-Meteo elevation API. Samples up to ELEVATION_BATCH evenly-spaced
 * points and linearly interpolates elevations for the rest.
 * Throws if the network request fails — callers should handle gracefully.
 */
export async function enrichWithElevation(
  coords: [number, number, number][]
): Promise<[number, number, number][]> {
  if (coords.length === 0) return coords
  if (coords.some(([,, ele]) => ele !== 0)) return coords

  const indices =
    coords.length <= ELEVATION_BATCH
      ? Array.from({ length: coords.length }, (_, i) => i)
      : Array.from({ length: ELEVATION_BATCH }, (_, i) =>
          Math.round((i * (coords.length - 1)) / (ELEVATION_BATCH - 1))
        )

  const lats = indices.map((i) => coords[i][1]).join(',')
  const lons = indices.map((i) => coords[i][0]).join(',')

  const res = await fetch(
    `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`
  )
  if (!res.ok) throw new Error('Elevation lookup failed')
  const data: { elevation: (number | null)[] } = await res.json()

  const result: [number, number, number][] = coords.map((c) => [c[0], c[1], c[2]])
  indices.forEach((origIdx, si) => {
    result[origIdx][2] = data.elevation[si] ?? 0
  })

  if (coords.length > ELEVATION_BATCH) {
    interpolateElevations(result, indices)
  }

  return result
}

export function parseGpx(gpxText: string): ParsedGpx {
  const parser = new DOMParser()
  const doc = parser.parseFromString(gpxText, 'application/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('Invalid GPX file')

  const trkpts = Array.from(doc.querySelectorAll('trkpt, rtept'))
  if (trkpts.length === 0) throw new Error('No track points found in GPX file')

  const coordinates: [number, number, number][] = trkpts.map((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') ?? '0')
    const lon = parseFloat(pt.getAttribute('lon') ?? '0')
    const eleEl = pt.querySelector('ele')
    const ele = eleEl ? parseFloat(eleEl.textContent ?? '0') : 0
    return [lon, lat, ele]
  })

  const firstTimeEl = trkpts[0]?.querySelector('time')
  const firstTimestamp = firstTimeEl?.textContent?.trim() || undefined

  return { track: { type: 'LineString', coordinates }, firstTimestamp }
}
