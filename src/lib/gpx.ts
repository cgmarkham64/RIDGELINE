import type { GpxTrack } from '../types'

export function parseGpx(gpxText: string): GpxTrack {
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

  return { type: 'LineString', coordinates }
}
