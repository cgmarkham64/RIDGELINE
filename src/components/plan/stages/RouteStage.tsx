import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L, { type LatLngBoundsExpression } from 'leaflet'
import { useQueryClient } from '@tanstack/react-query'
import { JumpChip } from '../JumpChip'
import { ProgressBar } from '../ProgressBar'
import { CheckItem } from '../CheckItem'
import { initials } from '../../../lib/utils'
import { searchUsers, shareTrip, type UserSearchResult } from '../../../lib/users'
import { unshareTrip } from '../../../lib/trips'
import { api } from '../../../lib/api'
import { parseGpx, enrichWithElevation } from '../../../lib/gpx'
import { ElevationProfile } from '../../trip/ElevationProfile'
import { PLANNED_COLOR, resolveStartEnd, TILE_LAYERS, type TileLayerKey } from '../../map/constants'
import { AttributionStrip, MapRefCapture, ZoomControls } from '../../map/MapHelpers'
import { MapTileToggle } from '../../map/MapTileToggle'
import { makeStartIcon, makeEndIcon, makeWaypointIcon, makeDetectedWaterIcon } from '../../map/leafletIcons'
import { WaypointIcon } from '../../map/WaypointIcon'
import { WAYPOINT_COLOR } from '../../map/constants'
import { fetchDetectedWaterSources, type DetectedWaterSource } from '../../../lib/waterSources'
import { IconPlus, IconMinus, IconMap, IconDownload, IconFile, IconX, IconMoreVertical, IconSparkle, IconTent, IconCheck } from '../../icons'
import { useAuthStore } from '../../../store/auth'
import type { StageBodyProps } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

type SegRow = {
  n: number
  name: string
  mi: number
  gain: number
  notes: string
  path?: [number, number][]
}

type CheckRow = { text: string; done: boolean }

type RoutePreview = {
  path: [number, number][]
  mi: number
  gain: number
  sparkElevs: number[]
}

type DrawState =
  | { phase: 'idle' }
  | { phase: 'placing-start'; editingSeg?: SegRow }
  | { phase: 'placing-end'; start: [number, number]; snappedToPrev: boolean; editingSeg?: SegRow }
  | {
      phase: 'active'
      start: [number, number]
      end: [number, number]
      loading: boolean
      result: RoutePreview | null
      error: string | null
      name: string
      nameAuto: boolean
      segN: number
      notes: string
      showMore: boolean
      editingSeg?: SegRow
    }

type WaterEntry = {
  id: string
  label: string
  waypointType: DetectedWaterSource['waypointType']
  distFromStartMi: number
  snapDistM?: number
  isDetected: boolean
  lat: number
  lon: number
}

type MergedRow =
  | { kind: 'start'; toNextCampMi: number | null; toNextWaterMi: number | null; lat: number | null; lon: number | null }
  | {
      kind: 'camp'
      seg: SegRow
      segIdx: number
      distFromStartMi: number
      isFinish: boolean
      toNextCampMi: number | null
      toNextWaterMi: number | null
      dryLeg: boolean
    }
  | { kind: 'water'; entry: WaterEntry; toNextWaterMi: number | null }

const DEFAULT_CHECKLIST: CheckRow[] = [
  { text: 'Route picked',           done: false },
  { text: 'Entry trailhead set',    done: false },
  { text: 'Exit trailhead set',     done: false },
  { text: 'Distance confirmed',     done: false },
  { text: 'Elevation gain confirmed', done: false },
  { text: 'Segments reviewed',      done: false },
  { text: 'Partners added',         done: false },
  { text: 'Partners reviewed',      done: false },
]

const SEG_COLORS = ['#f0a030', '#4ade80', '#a78bfa', '#f472b6', '#60a5fa', '#34d399', '#fb923c', '#f87171']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLatLngs(coords: [number, number, number][] | undefined): [number, number][] {
  return coords?.map(([lon, lat]) => [lat, lon]) ?? []
}

function coordsToMiles(coords: [number, number, number][]): number {
  let d = 0
  for (let i = 1; i < coords.length; i++) {
    const [lon1, lat1] = coords[i - 1]
    const [lon2, lat2] = coords[i]
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    d += 3958.8 * 2 * Math.asin(Math.sqrt(a))
  }
  return d
}

function haversinePathMiles(path: [number, number][]): number {
  let d = 0
  for (let i = 1; i < path.length; i++) {
    const [lat1, lon1] = path[i - 1]
    const [lat2, lon2] = path[i]
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    d += 3958.8 * 2 * Math.asin(Math.sqrt(a))
  }
  return d
}

function buildGpx(coords: [number, number, number][], name: string): string {
  const trkpts = coords.map(([lon, lat, ele]) =>
    `    <trkpt lat="${lat}" lon="${lon}">${ele ? `<ele>${ele}</ele>` : ''}</trkpt>`
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Ridgeline" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`
}

function downloadGpx(coords: [number, number, number][], name: string) {
  const blob = new Blob([buildGpx(coords, name)], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.toLowerCase().replace(/\s+/g, '-')}.gpx`
  a.click()
  URL.revokeObjectURL(url)
}

// Finds the index of the GPX coordinate closest to a [lat, lng] pin.
function closestGpxIdx(coords: [number, number, number][], pin: [number, number]): number {
  let best = 0, bestDist = Infinity
  for (let i = 0; i < coords.length; i++) {
    const dlat = coords[i][1] - pin[0]
    const dlon = coords[i][0] - pin[1]
    const d = dlat * dlat + dlon * dlon
    if (d < bestDist) { bestDist = d; best = i }
  }
  return best
}

async function fetchRoutePreview(
  start: [number, number],
  end: [number, number],
  gpxCoords?: [number, number, number][],  // [lon, lat, ele] — preferred source
): Promise<RoutePreview> {

  // ── Primary: clip the uploaded GPX track between the two pins ────────────────
  if (gpxCoords && gpxCoords.length > 1) {
    let si = closestGpxIdx(gpxCoords, start)
    let ei = closestGpxIdx(gpxCoords, end)
    if (si !== ei) {
      if (si > ei) [si, ei] = [ei, si]
      const slice = gpxCoords.slice(si, ei + 1)
      const path: [number, number][] = slice.map(([lon, lat]) => [lat, lon])
      const rawElevs = slice.map(([,, ele]) => ele)
      const mi = haversinePathMiles(path)
      let gain = 0
      for (let i = 1; i < rawElevs.length; i++) {
        const delta = rawElevs[i] - rawElevs[i - 1]
        if (delta > 0) gain += delta * 3.28084
      }
      gain = Math.round(gain / 10) * 10
      const SAMPLES = 60
      const step = Math.max(1, Math.floor(rawElevs.length / SAMPLES))
      const sparkElevs = rawElevs.filter((_, i) => i % step === 0 || i === rawElevs.length - 1)
      return { path, mi, gain, sparkElevs }
    }
  }

  // ── Fallback: straight line + Open-Elevation ──────────────────────────────────
  const STEPS = 20
  const path: [number, number][] = Array.from({ length: STEPS + 1 }, (_, i) => [
    start[0] + (end[0] - start[0]) * (i / STEPS),
    start[1] + (end[1] - start[1]) * (i / STEPS),
  ] as [number, number])
  const mi = haversinePathMiles(path)
  const sampled = path.filter((_, i) => i % 2 === 0 || i === path.length - 1)
  let sparkElevs: number[] = []
  let gain = 0
  try {
    const locations = sampled.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))
    const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations }),
    })
    const data = await res.json()
    sparkElevs = (data.results as { elevation: number }[]).map(r => r.elevation)
    for (let i = 1; i < sparkElevs.length; i++) {
      const delta = sparkElevs[i] - sparkElevs[i - 1]
      if (delta > 0) gain += delta * 3.28084
    }
    gain = Math.round(gain / 10) * 10
  } catch { /* no elevation data */ }
  return { path, mi, gain, sparkElevs }
}

function formatCoord([lat, lng]: [number, number]): string {
  return `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`
}

// Snap a [lat, lon] to the nearest GPX vertex and return cumulative miles from the start.
// Uses closest-vertex (not full segment projection) — accurate enough for on-trail waypoints.
function snapToRouteMi(lat: number, lon: number, coords: [number, number, number][]): number {
  let best = 0, bestSq = Infinity
  for (let i = 0; i < coords.length; i++) {
    const dlat = coords[i][1] - lat, dlon = coords[i][0] - lon
    const sq = dlat * dlat + dlon * dlon
    if (sq < bestSq) { bestSq = sq; best = i }
  }
  let d = 0
  for (let i = 1; i <= best; i++) {
    const [lon1, lat1] = coords[i - 1]
    const [lon2, lat2] = coords[i]
    d += haversinePathMiles([[lat1, lon1], [lat2, lon2]])
  }
  return d
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    )
    const data = await res.json()
    return data.name || data.display_name?.split(',')[0] || ''
  } catch {
    return ''
  }
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function ElevSparkline({ elevs }: { elevs: number[] }) {
  if (elevs.length < 2) return null
  const min = Math.min(...elevs)
  const max = Math.max(...elevs)
  const range = max - min || 1
  const W = 1000
  const H = 60
  const PAD = 4
  const pts = elevs.map((e, i): [number, number] => [
    (i / (elevs.length - 1)) * W,
    H - PAD - ((e - min) / range) * (H - PAD * 2),
  ])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const fill = `${d} L${W},${H} L0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 44 }} preserveAspectRatio="none">
      <path d={fill} fill="var(--amber)" fillOpacity={0.08} />
      <path d={d} fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Leaflet helpers ──────────────────────────────────────────────────────────

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1)
      map.fitBounds(positions as LatLngBoundsExpression, { padding: [20, 20] })
  }, [map, positions])
  return null
}

function InvalidateSize() {
  const map = useMap()
  useEffect(() => { map.invalidateSize() }, [map])
  return null
}

// Handles map click events and applies crosshair cursor in draw mode
function DrawInteractionLayer({
  drawState,
  onMapClick,
}: {
  drawState: DrawState
  onMapClick: (lat: number, lng: number) => void
}) {
  const map = useMap()
  const active = drawState.phase === 'placing-start' || drawState.phase === 'placing-end'

  useEffect(() => {
    const container = map.getContainer()
    container.style.cursor = active ? 'crosshair' : ''
    return () => { container.style.cursor = '' }
  }, [map, active])

  useMapEvents({
    click(e) {
      if (active) onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })

  return null
}

// ─── Draw pins icon variants ──────────────────────────────────────────────────

function makeDrawStartIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#0f0d0b;border:2px solid #4ade80;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px #4ade8088;cursor:grab;">
      <div style="width:6px;height:6px;border-radius:50%;background:#4ade80;"></div>
    </div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function makeDrawEndIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#0f0d0b;border:2px solid #f87171;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px #f8717188;cursor:grab;">
      <div style="width:6px;height:6px;border-radius:50%;background:#f87171;"></div>
    </div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

// ─── Route Stage ──────────────────────────────────────────────────────────────

export function RouteStage({ onJump, plan, onChange, onProgress, trip, canEdit }: StageBodyProps) {
  const [segments,      setSegments]      = useState<SegRow[]>(plan?.route?.segments ?? [])
  const [checklist,     setChecklist]     = useState<CheckRow[]>(plan?.route?.checklist ?? DEFAULT_CHECKLIST)
  const [drawState,     setDrawState]     = useState<DrawState>({ phase: 'idle' })
  const [detectedWater, setDetectedWater] = useState<DetectedWaterSource[]>([])
  const [waterLoading,  setWaterLoading]  = useState(false)
  const [waterError,    setWaterError]    = useState<string | null>(null)
  const [activeRowId,   setActiveRowId]   = useState<string | null>(null)
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [tileLayer,   setTileLayer] = useState<TileLayerKey>('topo')
  const [uploadLabel, setUploadLabel] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging,    setIsDragging]    = useState(false)
  const [repositioning, setRepositioning] = useState(new Set<number>())
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const mapRef        = useRef<L.Map | null>(null)
  const mapCardRef    = useRef<HTMLDivElement>(null)
  const dragCounter   = useRef(0)
  const fetchSeqRef   = useRef(0)
  const qc = useQueryClient()

  const isMounted     = useRef(false)
  const onChangeRef   = useRef(onChange)
  const onProgressRef = useRef(onProgress)
  useEffect(() => { onChangeRef.current   = onChange   }, [onChange])
  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])

  useEffect(() => {
    onProgressRef.current?.(checklist.filter(c => c.done).length, checklist.length)
  }, [checklist])

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ route: { segments, checklist, sourceFiles: [] } })
  }, [segments, checklist])

  // ── Detected water sources ───────────────────────────────────────────────────

  const gpxCoords = trip?.gpxPlanned?.coordinates
  useEffect(() => {
    if (!gpxCoords || gpxCoords.length < 2) {
      setDetectedWater([])
      setWaterError(null)
      return
    }
    let cancelled = false
    setWaterLoading(true)
    setWaterError(null)
    fetchDetectedWaterSources(gpxCoords)
      .then(sources => { if (!cancelled) { setDetectedWater(sources); setWaterLoading(false) } })
      .catch(err   => { if (!cancelled) { setWaterError(err instanceof Error ? err.message : 'Detection failed'); setWaterLoading(false) } })
    return () => { cancelled = true }
  }, [gpxCoords])

  // ── Merged route + water list ─────────────────────────────────────────────────

  const mergedRows = useMemo((): MergedRow[] => {
    const routeCoords = trip?.gpxPlanned?.coordinates

    // Water entries: auto-detected + manual water waypoints from trip
    const waterEntries: WaterEntry[] = detectedWater.map(d => ({
      id: d.id, label: d.label, waypointType: d.waypointType,
      distFromStartMi: d.distFromStartMi, snapDistM: d.snapDistM, isDetected: true,
      lat: d.lat, lon: d.lon,
    }))
    if (routeCoords && routeCoords.length >= 2) {
      for (const wp of (trip?.waypoints ?? [])) {
        if (!['lots-of-water', 'some-water', 'no-water'].includes(wp.type)) continue
        waterEntries.push({
          id: wp.id, label: wp.label || wp.type,
          waypointType: wp.type as WaterEntry['waypointType'],
          distFromStartMi: snapToRouteMi(wp.lat, wp.lon, routeCoords),
          isDetected: false, lat: wp.lat, lon: wp.lon,
        })
      }
    }
    waterEntries.sort((a, b) => a.distFromStartMi - b.distFromStartMi)

    if (segments.length === 0 && waterEntries.length === 0) return []

    // Accumulated camp distances
    let cumul = 0
    const campDists: number[] = []
    for (const seg of segments) { cumul += seg.mi; campDists.push(cumul) }

    const rows: MergedRow[] = []

    // Trailhead
    if (segments.length > 0) {
      const firstWater = waterEntries.find(w => w.waypointType !== 'no-water')
      const thPos = segments[0]?.path?.[0] ?? null
      rows.push({
        kind: 'start',
        toNextCampMi: campDists[0] ?? null,
        toNextWaterMi: firstWater?.distFromStartMi ?? null,
        lat: thPos ? thPos[0] : null,
        lon: thPos ? thPos[1] : null,
      })
    }

    // Camp / finish rows
    for (let i = 0; i < segments.length; i++) {
      const dist       = campDists[i]
      const isFinish   = i === segments.length - 1
      const nextDist   = campDists[i + 1] ?? null
      const nextWater  = waterEntries.find(w => w.distFromStartMi > dist && w.waypointType !== 'no-water')
      const dryLeg     = !isFinish && !waterEntries.some(
        w => w.distFromStartMi > dist && nextDist !== null && w.distFromStartMi < nextDist && w.waypointType !== 'no-water'
      )
      rows.push({
        kind: 'camp', seg: segments[i], segIdx: i,
        distFromStartMi: dist, isFinish,
        toNextCampMi: nextDist !== null ? nextDist - dist : null,
        toNextWaterMi: nextWater ? nextWater.distFromStartMi - dist : null,
        dryLeg,
      })
    }

    // Water rows
    for (let i = 0; i < waterEntries.length; i++) {
      const next = waterEntries[i + 1]
      rows.push({
        kind: 'water', entry: waterEntries[i],
        toNextWaterMi: next ? next.distFromStartMi - waterEntries[i].distFromStartMi : null,
      })
    }

    rows.sort((a, b) => {
      const da = a.kind === 'start' ? -Infinity : a.kind === 'camp' ? a.distFromStartMi : a.entry.distFromStartMi
      const db = b.kind === 'start' ? -Infinity : b.kind === 'camp' ? b.distFromStartMi : b.entry.distFromStartMi
      if (da !== db) return da - db
      if (a.kind === 'water' && b.kind !== 'water') return 1
      if (b.kind === 'water' && a.kind !== 'water') return -1
      return 0
    })

    return rows
  }, [segments, detectedWater, trip?.waypoints, trip?.gpxPlanned?.coordinates])

  const totalMiles = segments.reduce((s, x) => s + x.mi, 0)
  const totalGain  = segments.reduce((s, x) => s + x.gain, 0)
  const doneCount  = checklist.filter(c => c.done).length

  const partners: { name: string; sub: string }[] = [
    ...(trip?.ownerSub ? [{ sub: trip.ownerSub, name: trip.ownerName ?? 'Owner' }] : []),
    ...(trip?.sharedWith?.map(c => ({ sub: c.sub, name: c.name })) ?? []),
  ]


  // ── GPX upload ───────────────────────────────────────────────────────────────

  async function handleGpxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !trip?._id) return
    setUploadLabel('Importing…')
    setUploadError(null)
    try {
      const text = await file.text()
      const { track } = parseGpx(text)
      let coordinates = track.coordinates
      if (!coordinates.some(([,, ele]) => ele !== 0)) {
        setUploadLabel('Fetching elevation…')
        try { coordinates = await enrichWithElevation(coordinates) } catch { /* keep zeros */ }
      }
      setUploadLabel('Saving…')
      await api.put(`/api/trips/${trip._id}`, { gpxPlanned: { ...track, coordinates } })
      qc.invalidateQueries({ queryKey: ['plan', trip._id] })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to import GPX')
    } finally {
      setUploadLabel(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleGpxRemove() {
    if (!trip?._id) return
    setUploadLabel('Removing…')
    setUploadError(null)
    try {
      await api.put(`/api/trips/${trip._id}`, { gpxPlanned: null })
      qc.invalidateQueries({ queryKey: ['plan', trip._id] })
    } catch {
      setUploadError('Failed to remove route')
    } finally {
      setUploadLabel(null)
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current++
    if (dragCounter.current === 1) setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault() }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    if (!canEdit || !trip?._id) return
    const file = Array.from(e.dataTransfer.files).find(f => f.name.endsWith('.gpx'))
    if (!file) { setUploadError('Drop a .gpx file to import'); return }
    setUploadLabel('Importing…')
    setUploadError(null)
    try {
      const text = await file.text()
      const { track } = parseGpx(text)
      let coordinates = track.coordinates
      if (!coordinates.some(([,, ele]) => ele !== 0)) {
        setUploadLabel('Fetching elevation…')
        try { coordinates = await enrichWithElevation(coordinates) } catch { /* keep zeros */ }
      }
      setUploadLabel('Saving…')
      await api.put(`/api/trips/${trip._id}`, { gpxPlanned: { ...track, coordinates } })
      qc.invalidateQueries({ queryKey: ['plan', trip._id] })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to import GPX')
    } finally {
      setUploadLabel(null)
    }
  }

  // ── Partner invite ───────────────────────────────────────────────────────────

  const [partnersMenuOpen, setPartnersMenuOpen] = useState(false)
  const partnersMenuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!partnersMenuOpen) return
    function handleOutside(e: MouseEvent) {
      if (!partnersMenuRef.current?.contains(e.target as Node)) setPartnersMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [partnersMenuOpen])

  const [inviteOpen,      setInviteOpen]      = useState(false)
  const [inviteQuery,     setInviteQuery]     = useState('')
  const [inviteResults,   setInviteResults]   = useState<UserSearchResult[]>([])
  const [inviteSearching, setInviteSearching] = useState(false)
  const [inviteMsg,       setInviteMsg]       = useState<{ text: string; tone: 'pine' | 'red' } | null>(null)
  const [pendingInvites,  setPendingInvites]  = useState<{ sub: string; name: string }[]>([])
  const inviteTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inviteSearchId = useRef(0)

  const currentUserSub = useAuthStore(s => s.user?.id)
  const isOwner  = !!currentUserSub && currentUserSub === trip?.ownerSub
  const soloTrip = partners.length <= 1 && pendingInvites.length === 0

  function handleInviteQueryChange(q: string) {
    setInviteQuery(q)
    clearTimeout(inviteTimer.current)
    if (q.trim().length < 2) { setInviteResults([]); setInviteSearching(false); return }
    setInviteSearching(true)
    const id = ++inviteSearchId.current
    const existingSubs = new Set([
      ...(trip?.sharedWith?.map(c => c.sub) ?? []),
      ...(trip?.ownerSub ? [trip.ownerSub] : []),
      ...pendingInvites.map(p => p.sub),
    ])
    inviteTimer.current = setTimeout(() => {
      searchUsers(q.trim())
        .then(users => {
          if (id !== inviteSearchId.current) return
          setInviteResults(users.filter(u => !existingSubs.has(u.sub)))
          setInviteSearching(false)
        })
        .catch(() => { if (id === inviteSearchId.current) setInviteSearching(false) })
    }, 300)
  }

  async function handleInvite(user: UserSearchResult) {
    if (!trip?._id) return
    setInviteMsg(null)
    try {
      await shareTrip(trip._id, user.sub, 'edit')
      setPendingInvites(prev => [...prev, { sub: user.sub, name: user.name }])
      setChecklist(prev => prev.map(c => PARTNER_ITEMS.includes(c.text) ? { ...c, done: false } : c))
      setInviteQuery('')
      setInviteResults([])
      setInviteMsg({ text: `Invite sent to ${user.name}`, tone: 'pine' })
      setTimeout(() => setInviteMsg(null), 3000)
    } catch {
      setInviteMsg({ text: 'Failed to send invite', tone: 'red' })
    }
  }

  function closeInvitePanel() {
    setInviteOpen(false)
    setInviteQuery('')
    setInviteResults([])
    setInviteMsg(null)
  }

  async function handleRemovePartner(sub: string, isPending: boolean) {
    if (!trip?._id) return
    try {
      await unshareTrip(trip._id, sub)
      if (isPending) setPendingInvites(prev => prev.filter(p => p.sub !== sub))
      qc.invalidateQueries({ queryKey: ['plan', trip._id] })
    } catch { /* silently ignore */ }
  }

  // ── Checklist ────────────────────────────────────────────────────────────────

  const PARTNER_ITEMS = ['Partners added', 'Partners reviewed']

  function toggleCheck(i: number) {
    setChecklist(prev => prev.map((c, idx) => idx === i ? { ...c, done: !c.done } : c))
  }

  function confirmNoPartners() {
    setChecklist(prev => prev.map(c => PARTNER_ITEMS.includes(c.text) ? { ...c, done: true } : c))
  }

  // ── Draw mode ────────────────────────────────────────────────────────────────

  function enterDraw(editingSeg?: SegRow) {
    mapCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (editingSeg?.path && editingSeg.path.length >= 2) {
      // Edit: re-enter with existing pins pre-loaded
      const start = editingSeg.path[0]
      const end   = editingSeg.path[editingSeg.path.length - 1]
      setDrawState({
        phase: 'active', start, end,
        loading: false, result: null, error: null,
        name: editingSeg.name, nameAuto: false, segN: editingSeg.n,
        notes: editingSeg.notes,
        showMore: !!editingSeg.notes,
        editingSeg,
      })
      triggerFetch(start, end, editingSeg.name, false, trip?.gpxPlanned?.coordinates)
    } else {
      // New segment: auto-snap start to previous segment's endpoint if available
      const prevPath = segments[segments.length - 1]?.path
      const snapPoint = prevPath?.length ? prevPath[prevPath.length - 1] : null
      if (snapPoint) {
        setDrawState({ phase: 'placing-end', start: snapPoint, snappedToPrev: true })
      } else {
        setDrawState({ phase: 'placing-start' })
      }
    }
  }

  function cancelDraw() {
    setDrawState({ phase: 'idle' })
    fetchSeqRef.current++
  }

  const triggerFetch = useCallback(async (
    start: [number, number],
    end: [number, number],
    existingName: string,
    autoName: boolean,
    gpxCoords?: [number, number, number][],
    segN?: number,
  ) => {
    const seq = ++fetchSeqRef.current
    setDrawState(prev =>
      prev.phase === 'active'
        ? { ...prev, loading: true, result: null, error: null }
        : prev
    )

    const [preview, startGeocode, endGeocode] = await Promise.all([
      fetchRoutePreview(start, end, gpxCoords).catch(() => null),
      autoName ? reverseGeocode(start[0], start[1]) : Promise.resolve(''),
      autoName ? reverseGeocode(end[0], end[1])   : Promise.resolve(''),
    ])

    if (fetchSeqRef.current !== seq) return

    setDrawState(prev => {
      if (prev.phase !== 'active') return prev
      let suggestedName = existingName
      if (prev.nameAuto && segN !== undefined) {
        const startName = startGeocode || (segN === 1 ? 'Trailhead' : `Campsite ${segN - 1}`)
        const endName   = endGeocode   || `Campsite ${segN}`
        suggestedName = `${startName} to ${endName}`
      }
      return {
        ...prev,
        loading: false,
        result: preview,
        error: preview ? null : 'Could not auto-calculate — enter values manually',
        name: prev.nameAuto ? suggestedName : prev.name,
      }
    })
  }, [])

  function handleMapClick(lat: number, lng: number) {
    if (drawState.phase === 'placing-start') {
      setDrawState({
        phase: 'placing-end',
        start: [lat, lng],
        snappedToPrev: false,
        editingSeg: drawState.editingSeg,
      })
    } else if (drawState.phase === 'placing-end') {
      const start = drawState.start
      const end: [number, number] = [lat, lng]
      const segN = drawState.editingSeg?.n ?? ((segments[segments.length - 1]?.n ?? 0) + 1)
      const defaultName = `Segment ${segN}`
      setDrawState({
        phase: 'active', start, end,
        loading: true, result: null, error: null,
        name: defaultName, nameAuto: true, segN,
        notes: drawState.editingSeg?.notes ?? '',
        showMore: !!drawState.editingSeg?.notes,
        editingSeg: drawState.editingSeg,
      })
      triggerFetch(start, end, defaultName, true, trip?.gpxPlanned?.coordinates, segN)
    }
  }

  function handlePinDrag(which: 'start' | 'end', lat: number, lng: number) {
    if (drawState.phase !== 'active') return
    const start = which === 'start' ? [lat, lng] as [number, number] : drawState.start
    const end   = which === 'end'   ? [lat, lng] as [number, number] : drawState.end
    setDrawState(prev =>
      prev.phase === 'active' ? { ...prev, start, end } : prev
    )
    triggerFetch(start, end, drawState.name, drawState.nameAuto, trip?.gpxPlanned?.coordinates, drawState.segN)
  }

  function handleConfirmSegment() {
    if (drawState.phase !== 'active') return
    const { result, name, notes, editingSeg } = drawState
    const newSeg: Omit<SegRow, 'n'> = {
      name: name.trim() || 'Unnamed segment',
      mi:   result ? parseFloat(result.mi.toFixed(1)) : 0,
      gain: result?.gain ?? 0,
      notes: notes.trim(),
      path: result?.path,
    }
    if (editingSeg) {
      setSegments(prev => prev.map(s => s.n === editingSeg.n ? { ...newSeg, n: editingSeg.n } : s))
    } else {
      const n = (segments[segments.length - 1]?.n ?? 0) + 1
      setSegments(prev => [...prev, { ...newSeg, n }])
    }
    setDrawState({ phase: 'idle' })
  }

  function deleteSegment(n: number) {
    setSegments(prev => prev.filter(s => s.n !== n).map((s, i) => ({ ...s, n: i + 1 })))
  }

  async function handleEndpointDrag(segIdx: number, which: 'start' | 'end', lat: number, lng: number) {
    const snap = segments  // capture at drag-end time
    const seg = snap[segIdx]
    if (!seg?.path?.length) return

    const newPos: [number, number] = [lat, lng]
    const toUpdate: { si: number; start: [number, number]; end: [number, number] }[] = []

    toUpdate.push({
      si: segIdx,
      start: which === 'start' ? newPos : seg.path[0],
      end:   which === 'end'   ? newPos : seg.path[seg.path.length - 1],
    })

    // Keep chain connected: moving the end of seg N also moves the start of seg N+1
    if (which === 'end') {
      const next = snap[segIdx + 1]
      if (next?.path?.length)
        toUpdate.push({ si: segIdx + 1, start: newPos, end: next.path[next.path.length - 1] })
    }
    // Moving the start of seg N also moves the end of seg N-1
    if (which === 'start') {
      const prev = snap[segIdx - 1]
      if (prev?.path?.length)
        toUpdate.push({ si: segIdx - 1, start: prev.path[0], end: newPos })
    }

    setRepositioning(new Set(toUpdate.map(u => u.si)))

    const results = await Promise.all(
      toUpdate.map(async ({ si, start, end }) => ({
        si,
        preview: await fetchRoutePreview(start, end, trip?.gpxPlanned?.coordinates).catch(() => null),
      }))
    )

    setRepositioning(new Set())
    setSegments(prev => {
      let next = [...prev]
      for (const { si, preview } of results) {
        if (!preview) continue
        next = next.map((s, i) =>
          i === si ? { ...s, mi: parseFloat(preview.mi.toFixed(1)), gain: preview.gain, path: preview.path } : s
        )
      }
      return next
    })
  }

  // ── Row / map cross-linking ───────────────────────────────────────────────────

  function flyToRow(lat: number | null, lon: number | null, rowId: string) {
    setActiveRowId(rowId)
    if (lat == null || lon == null || !mapRef.current) return
    mapCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => {
      mapRef.current?.invalidateSize()
      mapRef.current?.flyTo([lat, lon], 13, { duration: 0.6 })
    }, 350)
  }

  function scrollToRow(rowId: string) {
    setActiveRowId(rowId)
    rowRefs.current.get(rowId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  // ── Map data ──────────────────────────────────────────────────────────────────

  const plannedLatLngs = toLatLngs(trip?.gpxPlanned?.coordinates)
  const tracksWithLatLngs = (trip?.gpxTracks ?? []).map((entry, i) => ({
    entry,
    positions: toLatLngs(entry.track.coordinates),
    color: ['#4ade80', '#fb923c', '#a78bfa', '#f472b6', '#34d399'][i % 5],
  }))
  const allPoints: [number, number][] = [
    ...plannedLatLngs,
    ...tracksWithLatLngs.flatMap(t => t.positions),
  ]
  const bounds = allPoints.length > 1 ? L.latLngBounds(allPoints) : null
  const startEnd = resolveStartEnd(plannedLatLngs, tracksWithLatLngs)

  const sourceFiles = [
    ...(trip?.gpxPlanned
      ? [{ name: 'Planned Route', meta: `${coordsToMiles(trip.gpxPlanned.coordinates).toFixed(1)} mi · GPX`, coords: trip.gpxPlanned.coordinates }]
      : []),
    ...(trip?.gpxTracks ?? []).map(t => ({
      name: t.label,
      meta: `${coordsToMiles(t.track.coordinates).toFixed(1)} mi · GPS track`,
      coords: t.track.coordinates,
    })),
  ]

  // Draw mode derived
  const isDrawing   = drawState.phase !== 'idle'
  const startPlaced = drawState.phase === 'placing-end' || drawState.phase === 'active'
  const endPlaced   = drawState.phase === 'active'

  function resetStartPin() {
    fetchSeqRef.current++
    setDrawState(prev =>
      prev.phase === 'placing-end' || prev.phase === 'active'
        ? { phase: 'placing-start', editingSeg: prev.editingSeg }
        : prev
    )
  }

  const mapProps = bounds
    ? { bounds: bounds as LatLngBoundsExpression, boundsOptions: { padding: [20, 20] as [number, number] } }
    : { center: [40.0, -105.5] as [number, number], zoom: 5 }

  const showMap = !!bounds || isDrawing || segments.some(s => s.path?.length)

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 pb-20">
        <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_320px]">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-[18px]">

            {/* Route summary + map */}
            <div
              ref={mapCardRef}
              className={`bg-surface border rounded-lg p-[18px] transition-colors ${isDragging ? 'border-amber-border' : isDrawing ? 'border-amber-border' : 'border-border'}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex items-start gap-3 mb-3.5">
                <span className="w-8 h-8 rounded-md flex items-center justify-center bg-pine-dim border border-pine-border text-pine shrink-0 mt-0.5">
                  <IconMap size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-[14px] font-extrabold text-text">
                    {trip?.title ?? 'Untitled Trip'}
                  </div>
                  <div className="font-mono text-[9px] text-text-dim mt-0.5">
                    {segments.length > 0
                      ? `${totalMiles.toFixed(1)} mi · +${totalGain.toLocaleString()} ft gain · ${segments.length} segment${segments.length !== 1 ? 's' : ''}`
                      : 'No segments added yet'}
                  </div>
                </div>
                {canEdit && !isDrawing && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {trip?.gpxPlanned && uploadLabel === null && (
                      <button
                        onClick={handleGpxRemove}
                        title="Remove planned route"
                        className="p-1 rounded text-text-dim hover:text-red transition-colors cursor-pointer bg-transparent border-none"
                      >
                        <IconX size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLabel !== null}
                      className="inline-flex items-center gap-1.5 font-heading text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-1 rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <IconDownload size={9} />
                      {uploadLabel ?? (trip?.gpxPlanned ? 'Replace' : 'Import .gpx')}
                    </button>
                  </div>
                )}
              </div>

              {uploadError && (
                <p className="font-mono text-[9px] text-red mb-2">{uploadError}</p>
              )}

              {/* Map */}
              <div
                className="relative rounded overflow-hidden border border-border"
                style={{ height: '44vh' }}
              >
                <MapTileToggle current={tileLayer} onToggle={() => setTileLayer(k => k === 'topo' ? 'dark' : 'topo')} />
                {isDragging && canEdit && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-none"
                    style={{ background: 'rgba(15,13,11,0.75)', borderRadius: 'inherit' }}>
                    <IconDownload size={22} />
                    <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-amber">Drop .gpx to import</p>
                  </div>
                )}

                {showMap ? (
                  <MapContainer
                    key="route-map"
                    {...mapProps}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer {...TILE_LAYERS[tileLayer]} />

                    {/* Planned route */}
                    {plannedLatLngs.length > 1 && (<>
                      <Polyline positions={plannedLatLngs} color={PLANNED_COLOR} weight={14} opacity={0.18} />
                      <Polyline positions={plannedLatLngs} color={PLANNED_COLOR} weight={4} opacity={0.95} dashArray="10 6" />
                    </>)}

                    {/* GPS tracks */}
                    {tracksWithLatLngs.map(({ entry, color, positions }) =>
                      positions.length > 1 ? (
                        <Polyline key={entry.id} positions={positions} color={color} weight={3} opacity={0.9} />
                      ) : null
                    )}

                    {/* Committed segment polylines — solid, prominent, on top of GPX trail */}
                    {segments.map((s, i) =>
                      s.path && s.path.length > 1 ? (
                        <Polyline
                          key={`seg-${s.n}`}
                          positions={s.path}
                          color={SEG_COLORS[i % SEG_COLORS.length]}
                          weight={4}
                          opacity={1}
                        />
                      ) : null
                    )}

                    {/* Auto-detected water source markers */}
                    {detectedWater.map(src => (
                      <Marker
                        key={src.id}
                        position={[src.lat, src.lon]}
                        icon={activeRowId === src.id
                          ? makeWaypointIcon(src.waypointType, true, 28)
                          : makeDetectedWaterIcon(src.waypointType, 24)}
                        eventHandlers={{ click: () => mapRef.current?.panTo([src.lat, src.lon]) }}
                      >
                        <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                            {src.label} · {src.distFromStartMi.toFixed(1)} mi from TH
                            {src.checkDate && (
                              <span style={{ display: 'block', opacity: 0.6, fontSize: 9 }}>
                                OSM updated {src.checkDate}
                              </span>
                            )}
                          </span>
                        </Tooltip>
                      </Marker>
                    ))}

                    {/* Campsite tent markers — draggable intermediate endpoints */}
                    {segments.map((s, i) =>
                      i < segments.length - 1 && s.path?.length ? (
                        <Marker
                          key={`camp-${s.n}`}
                          position={s.path[s.path.length - 1]}
                          icon={makeWaypointIcon('campsite', activeRowId === `camp-${s.n}`, 28)}
                          draggable={!isDrawing && repositioning.size === 0}
                          eventHandlers={{
                            dragend(e) {
                              const { lat, lng } = (e.target as L.Marker).getLatLng()
                              handleEndpointDrag(i, 'end', lat, lng)
                            },
                            click: () => scrollToRow(`camp-${s.n}`),
                          }}
                        >
                          <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                              {s.name}
                            </span>
                          </Tooltip>
                        </Marker>
                      ) : null
                    )}

                    {/* Start/end markers — draggable when from segment data (not GPX) */}
                    {startEnd ? (<>
                      <Marker position={startEnd.start} icon={makeStartIcon(16)} interactive={false} />
                      <Marker position={startEnd.end}   icon={makeEndIcon(16)}   interactive={false} />
                    </>) : (<>
                      {segments[0]?.path?.length ? (
                        <Marker
                          position={segments[0].path![0]}
                          icon={makeStartIcon(18)}
                          draggable={!isDrawing && repositioning.size === 0}
                          eventHandlers={{
                            dragend(e) {
                              const { lat, lng } = (e.target as L.Marker).getLatLng()
                              handleEndpointDrag(0, 'start', lat, lng)
                            },
                          }}
                        />
                      ) : null}
                      {segments[segments.length - 1]?.path?.length ? (
                        <Marker
                          position={segments[segments.length - 1].path![segments[segments.length - 1].path!.length - 1]}
                          icon={makeEndIcon(18)}
                          draggable={!isDrawing && repositioning.size === 0}
                          eventHandlers={{
                            dragend(e) {
                              const { lat, lng } = (e.target as L.Marker).getLatLng()
                              handleEndpointDrag(segments.length - 1, 'end', lat, lng)
                            },
                          }}
                        />
                      ) : null}
                    </>)}

                    {/* Draw mode: preview polyline + draggable pins */}
                    {drawState.phase === 'active' && drawState.result && (
                      <Polyline
                        positions={drawState.result.path}
                        color="#f0a030"
                        weight={3}
                        opacity={0.9}
                        dashArray="8 5"
                      />
                    )}
                    {(drawState.phase === 'placing-end' || drawState.phase === 'active') && (
                      <Marker
                        position={drawState.start}
                        icon={makeDrawStartIcon()}
                        draggable={drawState.phase === 'active'}
                        eventHandlers={{
                          dragend(e) {
                            const { lat, lng } = (e.target as L.Marker).getLatLng()
                            handlePinDrag('start', lat, lng)
                          },
                        }}
                      />
                    )}
                    {drawState.phase === 'active' && (
                      <Marker
                        position={drawState.end}
                        icon={makeDrawEndIcon()}
                        draggable
                        eventHandlers={{
                          dragend(e) {
                            const { lat, lng } = (e.target as L.Marker).getLatLng()
                            handlePinDrag('end', lat, lng)
                          },
                        }}
                      />
                    )}

                    <DrawInteractionLayer drawState={drawState} onMapClick={handleMapClick} />
                    <MapRefCapture mapRef={mapRef} />
                    {bounds && <FitBounds positions={allPoints} />}
                    <InvalidateSize />
                  </MapContainer>
                ) : (
                  <div
                    className="h-full flex flex-col items-center justify-center gap-2"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <span className="text-text-dim"><IconMap size={28} /></span>
                    <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">No GPX uploaded</p>
                    {canEdit ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="font-mono text-[9px] text-text-dim underline underline-offset-2 hover:text-text transition-colors cursor-pointer bg-transparent border-none p-0"
                      >
                        Import a planned route .gpx to see the map
                      </button>
                    ) : (
                      <p className="text-[11px] text-text-dim">Map available after GPX upload</p>
                    )}
                  </div>
                )}

                <ZoomControls mapRef={mapRef} allPoints={allPoints} />
              </div>
              <AttributionStrip tileLayer={tileLayer} />

              {/* Draw mode: step rail + coordinate chips */}
              {isDrawing && (
                <div className="flex flex-col gap-2 mt-3">

                  {/* Step rail */}
                  <div className="flex items-center justify-between px-3 py-2 rounded border border-amber-border bg-amber-dim">
                    <div className="flex items-center gap-3">
                      {/* Step 1 — Start */}
                      <div className="flex items-center gap-1.5">
                        {startPlaced ? (
                          <span className="w-[14px] h-[14px] rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--pine)' }}>
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                        ) : (
                          <span className="w-[14px] h-[14px] rounded-full border border-amber flex items-center justify-center shrink-0">
                            <span className="font-mono text-[7px] font-bold text-amber">1</span>
                          </span>
                        )}
                        <span className={`font-mono text-[9px] tracking-[0.1em] uppercase ${startPlaced ? 'text-pine' : 'text-amber font-bold'}`}>Start</span>
                      </div>

                      <span className="text-text-dim text-[9px]">→</span>

                      {/* Step 2 — End */}
                      <div className="flex items-center gap-1.5">
                        {endPlaced ? (
                          <span className="w-[14px] h-[14px] rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--pine)' }}>
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                        ) : (
                          <span className={`w-[14px] h-[14px] rounded-full border flex items-center justify-center shrink-0 ${startPlaced ? 'border-amber' : 'border-border'}`}>
                            <span className={`font-mono text-[7px] font-bold ${startPlaced ? 'text-amber' : 'text-text-dim'}`}>2</span>
                          </span>
                        )}
                        <span className={`font-mono text-[9px] tracking-[0.1em] uppercase ${endPlaced ? 'text-pine' : startPlaced ? 'text-amber font-bold' : 'text-text-dim'}`}>End</span>
                        {!endPlaced && startPlaced && (
                          <span className="font-mono text-[9px] text-text-dim">— click map</span>
                        )}
                        {!startPlaced && (
                          <span className="font-mono text-[9px] text-text-dim">— click map</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={cancelDraw}
                      className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded border border-border text-text-dim bg-surface hover:text-text hover:border-border-mid transition-colors cursor-pointer ml-4 shrink-0"
                    >
                      <IconX size={9} />
                      Cancel
                    </button>
                  </div>

                  {/* Coordinate chips */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={startPlaced ? resetStartPin : undefined}
                      disabled={!startPlaced}
                      title={startPlaced ? 'Click to reposition start' : undefined}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-left w-full transition-colors ${
                        startPlaced
                          ? 'border-pine-border bg-pine-dim hover:brightness-110 cursor-pointer'
                          : 'border-border bg-surface-2 opacity-40 cursor-default'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: startPlaced ? 'var(--pine)' : 'var(--border)' }} />
                      <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-text-dim shrink-0">Start</span>
                      <span className={`font-mono text-[9px] truncate ${startPlaced ? 'text-pine' : 'text-text-dim italic'}`}>
                        {startPlaced ? formatCoord(drawState.start) : 'not placed'}
                      </span>
                    </button>

                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded border ${
                      endPlaced ? 'border-amber-border bg-amber-dim'
                        : startPlaced ? 'border-amber-border bg-surface-2'
                        : 'border-border bg-surface-2 opacity-40'
                    }`}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: endPlaced ? 'var(--amber)' : 'transparent', border: endPlaced ? 'none' : `1px solid ${startPlaced ? 'var(--amber)' : 'var(--border)'}` }} />
                      <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-text-dim shrink-0">End</span>
                      <span className={`font-mono text-[9px] truncate ${endPlaced ? 'text-amber' : 'text-text-dim italic'}`}>
                        {endPlaced ? formatCoord(drawState.end) : startPlaced ? 'click map to place' : 'waiting…'}
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* Draw mode confirm tray */}
              {drawState.phase === 'active' && (
                <div className="mt-3 rounded border border-border bg-surface-2 p-3">
                  {/* Preview stats row */}
                  <div className="flex items-center gap-3 mb-2.5">
                    {drawState.loading ? (
                      <span className="font-mono text-[9px] text-text-dim tracking-[0.1em]">Calculating…</span>
                    ) : drawState.result ? (
                      <>
                        <span className="font-mono text-[11px] font-bold text-amber">
                          {drawState.result.mi.toFixed(1)} mi
                        </span>
                        <span className="font-mono text-[10px] text-text-mid">
                          +{drawState.result.gain.toLocaleString()} ft gain
                        </span>
                        {drawState.result.sparkElevs.length > 1 && (
                          <span className="font-mono text-[9px] text-text-dim">
                            (drag pins to recalculate)
                          </span>
                        )}
                      </>
                    ) : drawState.error ? (
                      <span className="font-mono text-[9px] text-text-dim">{drawState.error}</span>
                    ) : null}
                  </div>

                  {/* Sparkline */}
                  {drawState.result?.sparkElevs && drawState.result.sparkElevs.length > 1 && (
                    <div className="mb-2.5 rounded overflow-hidden" style={{ background: 'var(--surface)' }}>
                      <ElevSparkline elevs={drawState.result.sparkElevs} />
                    </div>
                  )}

                  {/* Name field */}
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1 block">
                        Segment name
                      </label>
                      <input
                        className="w-full px-2.5 py-[6px] bg-surface border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]"
                        value={drawState.name}
                        onChange={e =>
                          setDrawState(prev =>
                            prev.phase === 'active'
                              ? { ...prev, name: e.target.value, nameAuto: false }
                              : prev
                          )
                        }
                        placeholder="e.g. Onion Valley → Kearsarge Pass"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1 block">Notes</label>
                      <input
                        className="w-full px-2.5 py-[6px] bg-surface border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]"
                        value={drawState.notes}
                        onChange={e =>
                          setDrawState(prev =>
                            prev.phase === 'active' ? { ...prev, notes: e.target.value } : prev
                          )
                        }
                        placeholder="Trail conditions, hazards…"
                      />
                    </div>

                    <div className="flex gap-2 justify-end mt-1">
                      <button
                        onClick={cancelDraw}
                        className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmSegment}
                        disabled={!drawState.name.trim() || drawState.loading}
                        className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase rounded border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
                      >
                        {drawState.editingSeg ? 'Update segment' : 'Add segment'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Elevation profile */}
            {(trip?.gpxPlanned || (trip?.gpxTracks ?? []).length > 0) && (
              <div className="bg-surface border border-border rounded-lg p-[18px]">
                <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">
                  Elevation Profile
                </div>
                <ElevationProfile
                  planned={trip?.gpxPlanned}
                  gpxTracks={trip?.gpxTracks}
                />
              </div>
            )}

            {/* Merged route + water table */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Route</span>
                {segments.length > 0 && (
                  <span className="font-mono text-[9px] text-text-dim">
                    {segments.length} seg{segments.length !== 1 ? 's' : ''} · auto-pulls into{' '}
                    <JumpChip to="days" onJump={onJump}>Days</JumpChip>
                  </span>
                )}
                {waterLoading && <span className="font-mono text-[9px] text-text-dim">· detecting water…</span>}
                {waterError && <span className="font-mono text-[9px] text-red" title={waterError}>· water error</span>}
                {canEdit && !isDrawing && (
                  <button
                    onClick={() => enterDraw()}
                    className="ml-auto inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1.5 rounded border border-border text-text bg-transparent hover:border-border-mid transition-colors cursor-pointer"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add segment
                  </button>
                )}
                {isDrawing && <span className="ml-auto font-mono text-[9px] tracking-[0.1em] uppercase text-amber">Drawing…</span>}
              </div>

              {mergedRows.length > 0 && (
                <div
                  className="grid items-center px-4 py-1.5 gap-3 border-b border-border"
                  style={{ gridTemplateColumns: '20px 1fr 60px 72px 72px auto' }}
                >
                  <span />
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">Name</span>
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">From TH</span>
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">Next camp</span>
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">Next water</span>
                  {canEdit && <span />}
                </div>
              )}

              {mergedRows.length === 0 && !isDrawing && (
                <div className="px-4 py-8 text-center">
                  <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1.5">No segments yet</p>
                  <p className="text-[12px] text-text-mid">
                    {canEdit
                      ? 'Click "Add segment" above, then click two points on the map to define a leg.'
                      : 'No segments have been added to this route.'}
                  </p>
                </div>
              )}

              {mergedRows.map((row, i) => {
                const isLast = i === mergedRows.length - 1
                const border = isLast ? '' : 'border-b border-border'
                const GRID = '20px 1fr 60px 72px 72px auto'
                const ACTIVE_BG = 'rgba(240,160,48,0.08)'

                if (row.kind === 'start') return (
                  <div key="trailhead"
                    ref={el => { if (el) rowRefs.current.set('trailhead', el); else rowRefs.current.delete('trailhead') }}
                    className={`grid items-center px-4 py-2 gap-3 ${border} cursor-pointer transition-colors`}
                    style={{ gridTemplateColumns: GRID, background: activeRowId === 'trailhead' ? ACTIVE_BG : 'var(--surface-2)' }}
                    onClick={() => flyToRow(row.lat, row.lon, 'trailhead')}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M5.5 4.5L12 8L5.5 11.5Z" fill="#4ade80" opacity="0.95" />
                    </svg>
                    <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">Trailhead</span>
                    <span className="font-mono text-[10px] text-text-dim">0.0 mi</span>
                    <span className="font-mono text-[10px] text-text-mid">
                      {row.toNextCampMi !== null ? `${row.toNextCampMi.toFixed(1)} mi` : '—'}
                    </span>
                    {waterLoading && row.toNextWaterMi === null
                      ? <span className="font-mono text-[10px] text-text-dim">…</span>
                      : row.toNextWaterMi !== null
                        ? <span className="font-mono text-[10px]" style={{ color: '#0ea5e9' }}>{row.toNextWaterMi.toFixed(1)} mi</span>
                        : <span className="font-mono text-[10px] text-amber">None</span>
                    }
                    <span />
                  </div>
                )

                if (row.kind === 'camp') {
                  const rowId = `camp-${row.seg.n}`
                  const campPos = row.seg.path?.[row.seg.path.length - 1] ?? null
                  return (
                    <div key={rowId}
                      ref={el => { if (el) rowRefs.current.set(rowId, el); else rowRefs.current.delete(rowId) }}
                      className={`grid items-center px-4 py-2.5 gap-3 ${border} cursor-pointer transition-colors ${repositioning.has(row.segIdx) ? 'opacity-50' : ''}`}
                      style={{ gridTemplateColumns: GRID, background: activeRowId === rowId ? ACTIVE_BG : undefined }}
                      onClick={() => flyToRow(campPos?.[0] ?? null, campPos?.[1] ?? null, rowId)}
                    >
                      <span className={row.isFinish ? 'text-red' : 'text-amber'}>
                        {row.isFinish ? <IconCheck size={12} /> : <IconTent />}
                      </span>
                      <span className="text-[12px] font-semibold text-text truncate">{row.seg.name}</span>
                      <span className="font-mono text-[10px] text-text">
                        {repositioning.has(row.segIdx) ? '…' : `${row.distFromStartMi.toFixed(1)} mi`}
                      </span>
                      {row.isFinish
                        ? <span className="font-mono text-[10px] text-text-dim">—</span>
                        : <span className="font-mono text-[10px] text-text-mid">
                            {row.toNextCampMi !== null ? `${row.toNextCampMi.toFixed(1)} mi` : '—'}
                          </span>
                      }
                      {row.isFinish
                        ? <span className="font-mono text-[10px] text-text-dim">—</span>
                        : waterLoading && row.toNextWaterMi === null
                          ? <span className="font-mono text-[10px] text-text-dim">…</span>
                          : row.toNextWaterMi !== null
                            ? <span className="font-mono text-[10px]"
                                style={{ color: row.dryLeg ? 'var(--amber)' : '#0ea5e9' }}
                                title={row.dryLeg ? 'No water on this leg — nearest is further ahead' : undefined}
                              >
                                {row.toNextWaterMi.toFixed(1)} mi{row.dryLeg ? ' ↑' : ''}
                              </span>
                            : <span className="font-mono text-[10px] text-amber">None</span>
                      }
                      {canEdit
                        ? <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { if (!isDrawing) enterDraw(row.seg) }} disabled={isDrawing}
                              title="Edit segment"
                              className="p-1 rounded text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none disabled:opacity-30 disabled:cursor-not-allowed">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button onClick={() => { if (!isDrawing) deleteSegment(row.seg.n) }} disabled={isDrawing}
                              title="Delete segment"
                              className="p-1 rounded text-text-dim hover:text-red hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none disabled:opacity-30 disabled:cursor-not-allowed">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          </div>
                        : <span />
                      }
                    </div>
                  )
                }

                // Water row
                return (
                  <div key={row.entry.id}
                    ref={el => { if (el) rowRefs.current.set(row.entry.id, el); else rowRefs.current.delete(row.entry.id) }}
                    className={`grid items-center px-4 py-2.5 gap-3 ${border} cursor-pointer transition-colors`}
                    style={{ gridTemplateColumns: GRID, background: activeRowId === row.entry.id ? ACTIVE_BG : undefined }}
                    onClick={() => flyToRow(row.entry.lat, row.entry.lon, row.entry.id)}
                  >
                    <span style={{ color: WAYPOINT_COLOR[row.entry.waypointType] }}>
                      <WaypointIcon type={row.entry.waypointType} size={14} />
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[12px] font-semibold text-text truncate">{row.entry.label}</span>
                      {row.entry.isDetected && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 font-mono text-[9px] tracking-[0.06em] uppercase px-1 py-0.5 rounded-sm border border-dashed border-border text-text-dim/60">
                          <IconSparkle />auto
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-text">{row.entry.distFromStartMi.toFixed(1)} mi</span>
                    <span className="font-mono text-[10px] text-text-dim">—</span>
                    {row.toNextWaterMi !== null
                      ? <span className="font-mono text-[10px] text-text-mid">{row.toNextWaterMi.toFixed(1)} mi</span>
                      : <span className="font-mono text-[10px] text-text-dim">—</span>
                    }
                    <span />
                  </div>
                )
              })}
            </div>

          </div>

          {/* ── Right rail ── */}
          <aside className="flex flex-col gap-3.5">

            {/* Stage checklist */}
            <div className="bg-surface border border-border rounded-lg p-3.5">
              <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
              {checklist.map((c, i) => (
                <CheckItem
                  key={c.text}
                  text={c.text}
                  done={c.done}
                  na={soloTrip && !c.done && PARTNER_ITEMS.includes(c.text)}
                  onToggle={canEdit ? () => toggleCheck(i) : undefined}
                />
              ))}
              <div className="h-px bg-border my-3" />
              <ProgressBar
                value={checklist.length > 0 ? (doneCount / checklist.length) * 100 : 0}
                tone={doneCount === checklist.length && checklist.length > 0 ? 'pine' : 'amber'}
              />
              <div className="font-mono text-[9px] text-text-dim text-center mt-1.5">
                {doneCount} of {checklist.length}
              </div>
            </div>

            {/* Partners */}
            <div className="bg-surface border border-border rounded-lg p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">
                  Partners ({partners.length + pendingInvites.length})
                </span>
                {canEdit && !inviteOpen && (
                  <div ref={partnersMenuRef} className="relative">
                    <button
                      onClick={() => setPartnersMenuOpen(v => !v)}
                      className="p-1 rounded text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <IconMoreVertical size={14} />
                    </button>
                    {partnersMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-surface border border-border-mid rounded shadow-xl z-20 overflow-hidden min-w-[160px]">
                        <button
                          onMouseDown={() => { setPartnersMenuOpen(false); setInviteOpen(true) }}
                          className="w-full flex items-center gap-2 px-3 py-2 font-heading text-[10px] font-bold tracking-[0.08em] uppercase text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none text-left"
                        >
                          <IconPlus size={10} />
                          Add partner
                        </button>
                        {isOwner && soloTrip && (
                          <button
                            onMouseDown={() => { setPartnersMenuOpen(false); confirmNoPartners() }}
                            className="w-full flex items-center gap-2 px-3 py-2 font-heading text-[10px] font-bold tracking-[0.08em] uppercase text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none text-left border-t border-border"
                          >
                            <IconMinus size={10} />
                            No partners
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {partners.length === 0 && pendingInvites.length === 0 && !inviteOpen && (
                <p className="font-mono text-[9px] text-text-dim italic">No partners yet.</p>
              )}

              {[...partners.map(p => ({ ...p, pending: false })), ...pendingInvites.map(p => ({ ...p, pending: true }))].map((p, i, arr) => {
                const isThisOwner = p.sub === trip?.ownerSub
                return (
                  <div key={p.sub} className={`flex items-center gap-2.5 py-2 ${i < arr.length - 1 || inviteOpen ? 'border-b border-border' : ''}`}>
                    <span className="w-[26px] h-[26px] rounded-full bg-surface-2 border border-border-mid flex items-center justify-center font-heading text-[10px] font-extrabold text-amber shrink-0">
                      {initials(p.name)}
                    </span>
                    <span className="text-[11px] font-semibold text-text truncate flex-1 min-w-0">{p.name}</span>
                    {p.pending && (
                      <span className="font-mono text-[9px] tracking-[0.12em] text-amber shrink-0">PENDING</span>
                    )}
                    {isOwner && !isThisOwner && (
                      <button
                        onClick={() => handleRemovePartner(p.sub, p.pending)}
                        title={p.pending ? 'Cancel invite' : 'Remove partner'}
                        className="p-1 rounded text-text-dim hover:text-red hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none shrink-0"
                      >
                        <IconX size={10} />
                      </button>
                    )}
                  </div>
                )
              })}

              {inviteOpen && (
                <div className="pt-2.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={inviteQuery}
                      onChange={e => handleInviteQueryChange(e.target.value)}
                      placeholder="Search by name or email…"
                      autoFocus
                      className="w-full px-2.5 py-[6px] bg-surface-2 border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]"
                    />
                    {inviteSearching && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[9px] text-text-dim">…</span>
                    )}
                    {inviteResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-mid rounded shadow-xl z-10 overflow-hidden">
                        {inviteResults.map(u => (
                          <button
                            key={u.sub}
                            onMouseDown={e => { e.preventDefault(); handleInvite(u) }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left bg-transparent border-none cursor-pointer hover:bg-surface-2 transition-colors"
                          >
                            <span className="w-[22px] h-[22px] rounded-full bg-surface-2 border border-border flex items-center justify-center font-heading text-[9px] font-extrabold text-amber shrink-0">
                              {initials(u.name)}
                            </span>
                            <span className="text-[11px] text-text truncate">{u.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {inviteMsg && (
                    <p className="font-mono text-[9px] mt-1.5" style={{ color: inviteMsg.tone === 'pine' ? 'var(--pine)' : 'var(--red)' }}>
                      {inviteMsg.text}
                    </p>
                  )}
                  <button
                    onClick={closeInvitePanel}
                    className="font-mono text-[9px] text-text-dim hover:text-text transition-colors cursor-pointer bg-transparent border-none p-0 mt-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Source files */}
            <div className="bg-surface border border-border rounded-lg p-3.5">
              <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">Source files</div>
              {sourceFiles.length === 0 ? (
                <p className="font-mono text-[9px] text-text-dim leading-relaxed">
                  No files yet — import a planned route .gpx above.
                </p>
              ) : sourceFiles.map((f, i) => (
                <div key={f.name} className={`flex items-center gap-2 py-1.5 ${i < sourceFiles.length - 1 ? 'border-b border-border' : ''}`}>
                  <span className="text-text-mid shrink-0"><IconFile size={11} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[12px] text-text truncate">{f.name}</div>
                    <div className="font-mono text-[10px] text-text-dim mt-0.5">{f.meta}</div>
                  </div>
                  <button
                    onClick={() => downloadGpx(f.coords, f.name)}
                    title="Download .gpx"
                    className="p-1 rounded text-text-dim hover:text-amber transition-colors cursor-pointer bg-transparent border-none shrink-0"
                  >
                    <IconDownload size={11} />
                  </button>
                </div>
              ))}
            </div>

          </aside>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        className="hidden"
        onChange={handleGpxUpload}
      />
    </>
  )
}