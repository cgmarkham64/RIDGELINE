import { type ReactNode, useState } from 'react'
import type { GpxTrack, GpxTrackEntry, Waypoint } from '../../types'
import { WAYPOINT_COLOR } from '../map/constants'

// ─── Source resolution ────────────────────────────────────────────────────────

function hasElevationData(track: GpxTrack): boolean {
  return track.coordinates.some((coord) => coord[2] !== 0)
}

// Entries without a timestamp sort to the end, preserving their original order
function sortedByTimestamp(entries: GpxTrackEntry[]): GpxTrackEntry[] {
  return entries.slice().sort((a, b) => {
    if (!a.firstTimestamp && !b.firstTimestamp) return 0
    if (!a.firstTimestamp) return 1
    if (!b.firstTimestamp) return -1
    return a.firstTimestamp.localeCompare(b.firstTimestamp)
  })
}

interface Source {
  tracks: GpxTrack[]
  labels: string[]
  heading: string
}

function resolveSource(
  planned: GpxTrack | undefined,
  gpxTracks: GpxTrackEntry[]
): Source | null {
  if (planned && planned.coordinates.length >= 2 && hasElevationData(planned)) {
    return { tracks: [planned], labels: ['Planned Route'], heading: 'Planned Route' }
  }

  const valid = gpxTracks.filter(
    (e) => e.track.coordinates.length >= 2 && hasElevationData(e.track)
  )
  if (valid.length === 0) return null

  const sorted = sortedByTimestamp(valid)
  return {
    tracks: sorted.map((e) => e.track),
    labels: sorted.map((e) => e.label),
    heading: sorted.length === 1 ? sorted[0].label : `${sorted.length} GPS Tracks`,
  }
}

// ─── Geo helpers ──────────────────────────────────────────────────────────────

const M_TO_FT = 3.28084

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr
  const stride = Math.ceil(arr.length / max)
  const result = arr.filter((_, i) => i % stride === 0)
  if (result[result.length - 1] !== arr[arr.length - 1]) result.push(arr[arr.length - 1])
  return result
}

interface Point { distMi: number; eleFt: number; lat: number; lon: number }

interface CombinedPoints {
  pts: Point[]
  /** distMi values where each track after the first begins — used to draw day dividers */
  boundaries: number[]
}

function buildCombinedPoints(tracks: GpxTrack[]): CombinedPoints {
  const perTrack = Math.max(50, Math.ceil(400 / tracks.length))
  let cumDist = 0
  const pts: Point[] = []
  const boundaries: number[] = []

  for (let t = 0; t < tracks.length; t++) {
    const sampled = downsample(tracks[t].coordinates, perTrack)
    if (t > 0) boundaries.push(cumDist)
    for (let i = 0; i < sampled.length; i++) {
      const [lon, lat, ele] = sampled[i]
      if (i > 0) {
        const [pLon, pLat] = sampled[i - 1]
        cumDist += haversineMiles(pLat, pLon, lat, lon)
      }
      pts.push({ distMi: cumDist, eleFt: ele * M_TO_FT, lat, lon })
    }
  }

  return { pts, boundaries }
}

function findNearestPoint(pts: Point[], lat: number, lon: number): Point {
  let nearest = pts[0]
  let minDist = Infinity
  for (const pt of pts) {
    const d = haversineMiles(pt.lat, pt.lon, lat, lon)
    if (d < minDist) { minDist = d; nearest = pt }
  }
  return nearest
}

function computeStats(pts: Point[]) {
  let gain = 0
  let loss = 0
  let minEle = pts[0].eleFt
  let maxEle = pts[0].eleFt
  for (let i = 1; i < pts.length; i++) {
    const ele = pts[i].eleFt
    const delta = ele - pts[i - 1].eleFt
    if (delta > 0) gain += delta
    else loss += Math.abs(delta)
    if (ele < minEle) minEle = ele
    if (ele > maxEle) maxEle = ele
  }
  return {
    gain: Math.round(gain),
    loss: Math.round(loss),
    minEle,
    maxEle,
    totalDist: pts[pts.length - 1].distMi,
  }
}

// ─── SVG chart ────────────────────────────────────────────────────────────────

const VB_W = 260
const VB_H = 90
const PAD = { l: 2, r: 2, t: 10, b: 13 }
const CW = VB_W - PAD.l - PAD.r
const CH = VB_H - PAD.t - PAD.b
const TOOLTIP_H = 13
const TOOLTIP_PAD_X = 5

function toSvg(
  pts: Point[],
  px: (distMi: number) => number,
  py: (eleFt: number) => number,
  totalDist: number,
  boundaries: number[],
  labels: string[],
) {
  const lineD = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.distMi).toFixed(1)},${py(p.eleFt).toFixed(1)}`)
    .join(' ')
  const areaD = `${lineD} L${(PAD.l + CW).toFixed(1)},${(PAD.t + CH).toFixed(1)} L${PAD.l},${(PAD.t + CH).toFixed(1)} Z`

  const gridLines = [0.25, 0.5, 0.75].map((frac) => ({
    y: PAD.t + CH - frac * CH,
  }))

  const distTicks = [0, 0.5, 1].map((frac) => ({
    x: PAD.l + frac * CW,
    distLabel: (frac * totalDist).toFixed(1),
  }))

  // Index i = boundary between track i and i+1, so the label is labels[i+1]
  const dividers = boundaries.map((distMi, i) => ({
    x: px(distMi),
    label: labels[i + 1],
  }))

  return { lineD, areaD, gridLines, distTicks, dividers }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const monoCls = 'font-mono text-[8px] tracking-[0.1em] uppercase text-text-dim text-center'
const svgMonoStyle = { fontFamily: 'var(--font-mono)', fill: 'var(--text-dim)', letterSpacing: '0.05em' }

// ─── Component ────────────────────────────────────────────────────────────────

export function ElevationProfile({
  planned,
  gpxTracks = [],
  waypoints = [],
  activeWaypointId,
  onWaypointClick,
}: {
  planned: GpxTrack | undefined
  gpxTracks?: GpxTrackEntry[]
  waypoints?: Waypoint[]
  activeWaypointId?: string | null
  onWaypointClick?: (id: string) => void
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const source = resolveSource(planned, gpxTracks)

  if (!source) {
    const hasAnyTrack = !!planned || gpxTracks.length > 0
    return (
      <p className={`${monoCls} leading-[1.8] text-left`}>
        {hasAnyTrack
          ? 'No elevation data found — try importing a recorded GPS track'
          : 'Import a planned route or GPS track to see the elevation profile'}
      </p>
    )
  }

  const { tracks, labels, heading } = source
  const { pts, boundaries } = buildCombinedPoints(tracks)
  const { gain, loss, minEle, maxEle, totalDist } = computeStats(pts)

  const eleRange = maxEle - minEle || 1
  const px = (distMi: number) => PAD.l + (distMi / totalDist) * CW
  const py = (eleFt: number) => PAD.t + CH - ((eleFt - minEle) / eleRange) * CH

  const { lineD, areaD, gridLines, distTicks, dividers } = toSvg(
    pts, px, py, totalDist, boundaries, labels
  )

  const waypointMarkers = waypoints.map((wp) => {
    const nearest = findNearestPoint(pts, wp.lat, wp.lon)
    return {
      id: wp.id,
      x: px(nearest.distMi),
      y: py(nearest.eleFt),
      color: WAYPOINT_COLOR[wp.type],
      label: wp.label,
    }
  })

  const hoveredMarker = hoveredId ? waypointMarkers.find((m) => m.id === hoveredId) : null

  let tooltipEl: ReactNode = null
  if (hoveredMarker) {
    const { x, y, color, label } = hoveredMarker
    const tooltipW = label.length * 5.5 + TOOLTIP_PAD_X * 2
    const tooltipX = Math.max(PAD.l, Math.min(x - tooltipW / 2, PAD.l + CW - tooltipW))
    const tooltipY = y - TOOLTIP_H - 5
    tooltipEl = (
      <g style={{ pointerEvents: 'none' }}>
        <rect
          x={tooltipX} y={tooltipY}
          width={tooltipW} height={TOOLTIP_H}
          rx="1.5"
          fill="#1a1814"
          stroke={color}
          strokeWidth="0.6"
          opacity="0.95"
        />
        <text
          x={tooltipX + tooltipW / 2}
          y={tooltipY + TOOLTIP_H - 3}
          textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: color, letterSpacing: '0.04em' }}
        >
          {label}
        </text>
      </g>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <span className={`${monoCls} text-[7px]`}>{heading}</span>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        preserveAspectRatio="none"
        overflow="visible"
        style={{ display: 'block', height: 80 }}
      >
        {gridLines.map(({ y }) => (
          <line
            key={y}
            x1={PAD.l} y1={y} x2={PAD.l + CW} y2={y}
            stroke="var(--border)" strokeWidth="0.5"
          />
        ))}

        <line
          x1={PAD.l} y1={PAD.t + CH} x2={PAD.l + CW} y2={PAD.t + CH}
          stroke="var(--border)" strokeWidth="0.7"
        />

        <path d={areaD} fill="var(--amber)" fillOpacity="0.12" />
        <path d={lineD} fill="none" stroke="var(--amber)" strokeWidth="1.2" strokeLinejoin="round" />

        {waypointMarkers.map(({ id, x, y, color }) => {
          const isActive = id === activeWaypointId
          return (
            <g
              key={id}
              style={{ cursor: 'pointer' }}
              onClick={() => onWaypointClick?.(id)}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <line
                x1={x} y1={y} x2={x} y2={PAD.t + CH}
                stroke={color} strokeWidth={isActive ? 1.2 : 0.8} strokeDasharray="1.5 1.5" opacity={isActive ? 0.9 : 0.6}
              />
              <circle cx={x} cy={y} r={isActive ? 3.5 : 2.5} fill={color} opacity="0.95" />
              {isActive && <circle cx={x} cy={y} r="5.5" fill={color} opacity="0.2" />}
            </g>
          )
        })}

        {tooltipEl}

        {dividers.map(({ x, label }) => (
          <g key={x}>
            <line
              x1={x} y1={PAD.t} x2={x} y2={PAD.t + CH}
              stroke="var(--border)" strokeWidth="1" strokeDasharray="2 2"
            />
            <text
              x={x + 2}
              y={PAD.t + 5}
              style={{ ...svgMonoStyle, fontSize: 4.5 }}
            >
              {label}
            </text>
          </g>
        ))}

        {distTicks.map(({ x, distLabel }) => (
          <text
            key={x}
            x={x}
            y={VB_H - 0.5}
            textAnchor={x <= PAD.l ? 'start' : x >= PAD.l + CW - 1 ? 'end' : 'middle'}
            style={{ ...svgMonoStyle, fontSize: 9 }}
          >
            {distLabel} mi
          </text>
        ))}
      </svg>

      <div className="grid grid-cols-4 gap-1">
        {[
          { key: 'Gain', value: `+${gain.toLocaleString()} ft` },
          { key: 'Loss', value: `-${loss.toLocaleString()} ft` },
          { key: 'Max', value: `${Math.round(maxEle).toLocaleString()} ft` },
          { key: 'Dist', value: `${totalDist.toFixed(1)} mi` },
        ].map(({ key, value }) => (
          <div key={key} className="bg-surface-2 rounded-sm px-1 py-1.25">
            <span className={monoCls}>{key}</span>
            <span className="font-mono text-[11px] tracking-[0.04em] text-amber block mt-0.5">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}