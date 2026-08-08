import { useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { Ref } from 'react'
import type L from 'leaflet'
import type { QueryClient } from '@tanstack/react-query'
import type { RouteMapCardHandle } from './routeMapCard.types'
import { api } from '../../../../lib/api'
import { parseGpx, enrichWithElevation } from '../../../../lib/gpx'
import { DEFAULT_FORM } from '../../../map/constants'
import type { Waypoint } from '../../../../types'
import type { SegRow } from './routeStage.types'
import type { StageBodyProps } from '../../types'
import type { ZoneOverlayFlags } from './routeMapCard.types'
import { detectZoneStays, IPW_ZONES, ENCHANTMENTS_ZONES, MBSW_ZONES, nearIpw, nearEnchantments, nearMbsw } from '../permits/zoneDetection.helpers'

type UploadSetters = { setUploadLabel: (v: string | null) => void; setUploadError: (v: string | null) => void }

async function runGpxImport(file: File, trip: StageBodyProps['trip'], qc: QueryClient, setters: UploadSetters) {
  if (!trip?._id) return
  const { setUploadLabel, setUploadError } = setters
  setUploadLabel('Importing…')
  setUploadError(null)
  try {
    const text = await file.text()
    const { track } = parseGpx(text)
    let coordinates = track.coordinates
    if (!coordinates.some(([, , ele]) => ele !== 0)) {
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

async function runGpxRemove(trip: StageBodyProps['trip'], qc: QueryClient, setters: UploadSetters) {
  if (!trip?._id) return
  const { setUploadLabel, setUploadError } = setters
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

function useGpxDragDrop(importFile: (file: File) => Promise<void>, canEdit: boolean, setUploadError: (v: string | null) => void) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

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
    if (!canEdit) return
    const file = Array.from(e.dataTransfer.files).find(f => f.name.endsWith('.gpx'))
    if (!file) { setUploadError('Drop a .gpx file to import'); return }
    await importFile(file)
  }

  return { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop }
}

export function useGpxImport(trip: StageBodyProps['trip'], qc: QueryClient, canEdit: boolean) {
  const [uploadLabel, setUploadLabel] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setters: UploadSetters = { setUploadLabel, setUploadError }

  const importFile = (file: File) => runGpxImport(file, trip, qc, setters)
  const drag = useGpxDragDrop(importFile, canEdit, setUploadError)

  async function handleGpxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await importFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleGpxRemove() {
    await runGpxRemove(trip, qc, setters)
  }

  return {
    uploadLabel, uploadError, fileInputRef, handleGpxUpload, handleGpxRemove,
    triggerFileDialog: () => fileInputRef.current?.click(),
    isDragging: drag.isDragging,
    dragHandlers: {
      onDragEnter: drag.handleDragEnter,
      onDragLeave: drag.handleDragLeave,
      onDragOver: drag.handleDragOver,
      onDrop: drag.handleDrop,
    },
  }
}

async function saveNewWaypoint(
  trip: { _id: string; waypoints?: Waypoint[] },
  qc: QueryClient,
  latLon: { lat: number; lon: number },
  form: typeof DEFAULT_FORM,
  setWpSaving: (v: boolean) => void,
  setWpError: (v: string | null) => void,
) {
  setWpSaving(true); setWpError(null)
  try {
    const newWp: Waypoint = {
      id: Date.now().toString(),
      type: form.type,
      label: form.label.trim(),
      lat: latLon.lat,
      lon: latLon.lon,
      notes: form.notes.trim() || undefined,
    }
    await api.put(`/api/trips/${trip._id}`, { waypoints: [...(trip.waypoints ?? []), newWp] })
    qc.invalidateQueries({ queryKey: ['plan', trip._id] })
    return true
  } catch {
    setWpError('Failed to save waypoint')
    return false
  } finally {
    setWpSaving(false)
  }
}

export function useWaypointPlacement(trip: StageBodyProps['trip'], qc: QueryClient) {
  const [waypointMode, setWaypointMode] = useState(false)
  const [pendingWpLatLon, setPendingWpLatLon] = useState<{ lat: number; lon: number } | null>(null)
  const [wpForm, setWpForm] = useState(DEFAULT_FORM)
  const [wpSaving, setWpSaving] = useState(false)
  const [wpError, setWpError] = useState<string | null>(null)

  function cancelWaypointMode() {
    setWaypointMode(false); setPendingWpLatLon(null); setWpForm(DEFAULT_FORM); setWpError(null)
  }

  async function handleAddWaypoint(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingWpLatLon || !wpForm.label.trim() || !trip?._id) return
    const ok = await saveNewWaypoint({ _id: trip._id, waypoints: trip.waypoints }, qc, pendingWpLatLon, wpForm, setWpSaving, setWpError)
    if (ok) cancelWaypointMode()
  }

  function startPlacingAt(lat: number, lon: number) {
    setPendingWpLatLon({ lat, lon })
    setWaypointMode(false)
  }

  return {
    waypointMode, setWaypointMode,
    pendingWpLatLon, wpForm, wpSaving, wpError,
    handleAddWaypoint, cancelWaypointMode, startPlacingAt,
    onFormChange: (patch: Partial<typeof wpForm>) => setWpForm(f => ({ ...f, ...patch })),
  }
}

// Each overlay only engages for routes actually near that wilderness area, so
// trips elsewhere don't show irrelevant zone boundaries. Checks both GPX-imported
// points and hand-drawn segment paths, since a route can come from either.
export function useZoneOverlays(segments: SegRow[], allPoints: [number, number][], trip: StageBodyProps['trip']): ZoneOverlayFlags {
  const showIpwOverlay = useMemo(
    () => allPoints.some(([lat, lon]) => nearIpw(lat, lon)) ||
      segments.some(s => s.path?.some(([lat, lon]) => nearIpw(lat, lon))),
    [allPoints, segments],
  )
  const showEnchantmentsOverlay = useMemo(
    () => allPoints.some(([lat, lon]) => nearEnchantments(lat, lon)) ||
      segments.some(s => s.path?.some(([lat, lon]) => nearEnchantments(lat, lon))),
    [allPoints, segments],
  )
  const showMbswOverlay = useMemo(
    () => allPoints.some(([lat, lon]) => nearMbsw(lat, lon)) ||
      segments.some(s => s.path?.some(([lat, lon]) => nearMbsw(lat, lon))),
    [allPoints, segments],
  )
  const zoneHighlightIds = useMemo(() => {
    if (!trip?.startDate || segments.length < 2) return []
    try { return detectZoneStays(segments, trip.startDate).needs.map(n => n.zone.properties.id) }
    catch { return [] }
  }, [segments, trip])

  return { showIpwOverlay, showEnchantmentsOverlay, showMbswOverlay, zoneHighlightIds }
}

export const ZONE_SETS = { IPW_ZONES, ENCHANTMENTS_ZONES, MBSW_ZONES }

const FLY_TO_ZOOM = 13
const FLY_TO_DURATION_S = 0.6
const FLY_TO_SCROLL_DELAY_MS = 350

export function useMapCardImperativeHandle(ref: Ref<RouteMapCardHandle>) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    flyTo(lat: number, lon: number) {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => {
        mapRef.current?.invalidateSize()
        mapRef.current?.flyTo([lat, lon], FLY_TO_ZOOM, { duration: FLY_TO_DURATION_S })
      }, FLY_TO_SCROLL_DELAY_MS)
    },
    scrollToTop() {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
  }))

  return { mapRef, containerRef }
}
