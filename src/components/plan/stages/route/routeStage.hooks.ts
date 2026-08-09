import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import L from 'leaflet'
import { resolveStartEnd } from '../../../map/constants'
import { fetchDetectedWaterSources, type DetectedWaterSource } from '../../../../lib/waterSources'
import { useAuthStore } from '../../../../store/auth'
import { DEFAULT_USER_PREFERENCES } from '../../../../types/auth'
import { suggestHard } from '../../../../lib/trailDifficulty'
import type { SegRow, CheckRow, DrawState, ReconnectUpdate, RoutePreview } from './routeStage.types'
import type { StageBodyProps } from '../../types'
import {
  toLatLngs, gpxCoordsToMiles, buildMergedRows, DEFAULT_CHECKLIST,
  fetchRoutePreview, reverseGeocode, fetchSunTimes, resolveTimePreference,
  computeEditDrawState, computeNewSegmentDrawState, buildActiveDrawStateFromClick,
  computeEndpointReconnectUpdates, computeEditReconnectUpdates, applyReconnectResults,
  splitSegmentAt,
} from './routeStage.helpers'

const ISO_DATE_LENGTH = 10
const TRACK_COLORS = ['#4ade80', '#fb923c', '#a78bfa', '#f472b6', '#34d399']

// ─── Checklist + persistence ────────────────────────────────────────────────────

function initialChecklist(plan: StageBodyProps['plan']): CheckRow[] {
  const validTexts = new Set(DEFAULT_CHECKLIST.map(c => c.text))
  const saved = plan?.route?.checklist?.filter((c: CheckRow) => validTexts.has(c.text))
  return saved?.length ? saved : DEFAULT_CHECKLIST
}

export function useRouteChecklist(plan: StageBodyProps['plan'], segments: SegRow[], onProgress: StageBodyProps['onProgress']) {
  const [checklist, setChecklist] = useState<CheckRow[]>(() => initialChecklist(plan))

  const effectiveChecklist = useMemo(() =>
    checklist.map(c =>
      c.text === 'Exposure & water annotated'
        ? { ...c, done: segments.length > 0 && segments.every(s => !!s.exposure && !!s.water) }
        : c
    ),
    [checklist, segments],
  )

  const onProgressRef = useRef(onProgress)
  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])
  useEffect(() => {
    onProgressRef.current?.(effectiveChecklist.filter(c => c.done).length, effectiveChecklist.length)
  }, [effectiveChecklist])

  function toggleCheck(i: number) {
    setChecklist(prev => prev.map((c, idx) => idx === i ? { ...c, done: !c.done } : c))
  }

  return {
    checklist, setChecklist, effectiveChecklist, toggleCheck,
    doneCount: effectiveChecklist.filter(c => c.done).length,
  }
}

export function useRoutePersist(onChange: StageBodyProps['onChange'], segments: SegRow[], checklist: CheckRow[]) {
  const isMounted = useRef(false)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ route: { segments, checklist, sourceFiles: [] } })
  }, [segments, checklist])
}

// ─── Detected water sources ─────────────────────────────────────────────────────

export function useDetectedWater(trip: StageBodyProps['trip']) {
  const [waterResult, setWaterResult] = useState<{ sources: DetectedWaterSource[]; error: string | null; key: string | null }>(
    { sources: [], error: null, key: null },
  )

  const gpxCoords = trip?.gpxPlanned?.coordinates
  const coordsKey = gpxCoords && gpxCoords.length >= 2
    ? `${gpxCoords.length}:${gpxCoords[0][0]},${gpxCoords[gpxCoords.length - 1][0]}`
    : null

  const visibleWater = useMemo(
    () => coordsKey !== null && waterResult.key === coordsKey ? waterResult.sources : [],
    [coordsKey, waterResult],
  )
  const displayLoading = coordsKey !== null && waterResult.key !== coordsKey
  const displayError = coordsKey !== null && waterResult.key === coordsKey ? waterResult.error : null

  useEffect(() => {
    if (!coordsKey) return
    let cancelled = false
    fetchDetectedWaterSources(gpxCoords!)
      .then(sources => { if (!cancelled) setWaterResult({ sources, error: null, key: coordsKey }) })
      .catch(err => { if (!cancelled) setWaterResult({ sources: [], error: err instanceof Error ? err.message : 'Detection failed', key: coordsKey }) })
    return () => { cancelled = true }
  }, [coordsKey, gpxCoords])

  return { visibleWater, displayLoading, displayError }
}

// ─── Map data derivation ────────────────────────────────────────────────────────

function buildSourceFiles(trip: StageBodyProps['trip']) {
  const planned = trip?.gpxPlanned
    ? [{ name: 'Planned Route', meta: `${gpxCoordsToMiles(trip.gpxPlanned.coordinates).toFixed(1)} mi · GPX`, coords: trip.gpxPlanned.coordinates }]
    : []
  const tracks = (trip?.gpxTracks ?? []).map(t => ({
    name: t.label,
    meta: `${gpxCoordsToMiles(t.track.coordinates).toFixed(1)} mi · GPS track`,
    coords: t.track.coordinates,
  }))
  return [...planned, ...tracks]
}

export function useRouteMapData(trip: StageBodyProps['trip'], segments: SegRow[], visibleWater: DetectedWaterSource[]) {
  const mergedRows = useMemo(
    () => buildMergedRows(segments, visibleWater, trip?.waypoints, trip?.gpxPlanned?.coordinates),
    [segments, visibleWater, trip?.waypoints, trip?.gpxPlanned?.coordinates],
  )

  const totalMiles = segments.reduce((s, x) => s + x.mi, 0)
  const totalGain = segments.reduce((s, x) => s + x.gain, 0)

  const plannedLatLngs = toLatLngs(trip?.gpxPlanned?.coordinates)
  const tracksWithLatLngs = (trip?.gpxTracks ?? []).map((entry, i) => ({
    entry,
    positions: toLatLngs(entry.track.coordinates),
    color: TRACK_COLORS[i % TRACK_COLORS.length],
  }))
  const allPoints: [number, number][] = [...plannedLatLngs, ...tracksWithLatLngs.flatMap(t => t.positions)]
  const bounds = allPoints.length > 1 ? L.latLngBounds(allPoints) : null
  const startEnd = resolveStartEnd(plannedLatLngs, tracksWithLatLngs)
  const sourceFiles = buildSourceFiles(trip)

  return { mergedRows, totalMiles, totalGain, plannedLatLngs, tracksWithLatLngs, allPoints, bounds, startEnd, sourceFiles }
}

// ─── Adjacent-segment reconnection ──────────────────────────────────────────────

export function useSegmentReconnect(
  gpxCoords: [number, number, number][] | undefined,
  setSegments: Dispatch<SetStateAction<SegRow[]>>,
  setRepositioning: Dispatch<SetStateAction<Set<number>>>,
) {
  return useCallback(async (toUpdate: ReconnectUpdate[]) => {
    if (toUpdate.length === 0) return
    setRepositioning(new Set(toUpdate.map(u => u.si)))
    const results = await Promise.all(
      toUpdate.map(async ({ si, start, end }) => ({
        si,
        preview: await fetchRoutePreview(start, end, gpxCoords).catch(() => null),
      }))
    )
    setRepositioning(new Set())
    setSegments(prev => applyReconnectResults(prev, results))
  }, [gpxCoords, setSegments, setRepositioning])
}

// ─── Simple segment list edits ──────────────────────────────────────────────────

export function useRouteCrossLinks(
  mapCardRef: RefObject<{ flyTo(lat: number, lon: number): void; scrollToTop(): void } | null>,
  tableRef: RefObject<{ scrollToRow(rowId: string): void } | null>,
) {
  const [activeRowId, setActiveRowId] = useState<string | null>(null)

  function flyToRow(lat: number | null, lon: number | null, rowId: string) {
    setActiveRowId(rowId)
    if (lat != null && lon != null) mapCardRef.current?.flyTo(lat, lon)
  }

  function handleCampClick(rowId: string) {
    setActiveRowId(rowId)
    tableRef.current?.scrollToRow(rowId)
  }

  return { activeRowId, flyToRow, handleCampClick }
}

export function useSegmentListActions(setSegments: Dispatch<SetStateAction<SegRow[]>>) {
  function deleteSegment(n: number) {
    setSegments(prev => prev.filter(s => s.n !== n).map((s, i) => ({ ...s, n: i + 1 })))
  }

  function splitSegment(segN: number, edgeIdx: number, splitPoint: [number, number]) {
    setSegments(prev => {
      const segIdx = prev.findIndex(s => s.n === segN)
      if (segIdx === -1) return prev
      const parts = splitSegmentAt(prev[segIdx], edgeIdx, splitPoint)
      if (!parts) return prev
      const next = [...prev]
      next.splice(segIdx, 1, { ...parts.segA, n: 0 }, { ...parts.segB, n: 0 })
      return next.map((s, i) => ({ ...s, n: i + 1 }))
    })
  }

  function reorderSegments(fromN: number, toN: number) {
    setSegments(prev => {
      const fromIdx = prev.findIndex(s => s.n === fromN)
      const toIdx = prev.findIndex(s => s.n === toN)
      if (fromIdx === -1 || toIdx === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next.map((s, i) => ({ ...s, n: i + 1 }))
    })
  }

  return { deleteSegment, splitSegment, reorderSegments }
}

// ─── Draw mode ──────────────────────────────────────────────────────────────────

function resolveHard(hard: boolean | undefined, mi: number, gain: number): boolean | undefined {
  return hard ?? (suggestHard(mi, gain) || undefined)
}

function buildConfirmedSeg(drawState: Extract<DrawState, { phase: 'active' }>): Omit<SegRow, 'n'> {
  const { result, name, notes, water, exposure, hard, wakeTime, onTrailTime, campByTime } = drawState
  const mi = result ? parseFloat(result.mi.toFixed(1)) : 0
  const gain = result?.gain ?? 0
  return {
    name: name.trim() || 'Unnamed segment',
    mi, gain,
    notes: notes.trim(),
    path: result?.path,
    water, exposure,
    hard: resolveHard(hard, mi, gain),
    wakeTime: wakeTime || undefined,
    onTrailTime: onTrailTime || undefined,
    campByTime: campByTime || undefined,
  }
}

function mergeSunTimesIntoDrawState(prev: DrawState, result: { sunrise: string; sunset: string } | null): DrawState {
  if (prev.phase !== 'active') return prev
  if (!result) return { ...prev, sunTimesLoading: false }
  const prefs = useAuthStore.getState().user?.preferences ?? DEFAULT_USER_PREFERENCES
  return {
    ...prev,
    sunTimesLoading: false,
    wakeTime: prev.wakeTime ?? resolveTimePreference(prefs.wakeTime, result.sunrise, result.sunset),
    onTrailTime: prev.onTrailTime ?? resolveTimePreference(prefs.onTrailTime, result.sunrise, result.sunset),
    campByTime: prev.campByTime ?? resolveTimePreference(prefs.campByTime, result.sunrise, result.sunset),
  }
}

function suggestSegmentName(existingName: string, segN: number | undefined, startGeocode: string, endGeocode: string): string {
  if (segN === undefined) return existingName
  const startName = startGeocode || (segN === 1 ? 'Trailhead' : `Campsite ${segN - 1}`)
  const endName = endGeocode || `Campsite ${segN}`
  return `${startName} to ${endName}`
}

function mergeFetchResultIntoDrawState(
  prev: DrawState, preview: RoutePreview | null, existingName: string, segN: number | undefined,
  startGeocode: string, endGeocode: string,
): DrawState {
  if (prev.phase !== 'active') return prev
  const suggestedName = prev.nameAuto ? suggestSegmentName(existingName, segN, startGeocode, endGeocode) : prev.name
  return {
    ...prev,
    loading: false,
    result: preview,
    error: preview ? null : 'Could not auto-calculate — enter values manually',
    name: suggestedName,
    hard: prev.hard !== undefined ? prev.hard : resolveHard(undefined, preview?.mi ?? 0, preview?.gain ?? 0),
  }
}

function useSunTimesFetch(
  trip: StageBodyProps['trip'],
  sunFetchSeqRef: RefObject<number>,
  setDrawState: Dispatch<SetStateAction<DrawState>>,
) {
  return useCallback(async (end: [number, number], segN: number) => {
    const seq = ++sunFetchSeqRef.current
    try {
      // slice(0,10) normalises both "2025-05-25" and "2025-05-25T00:00:00.000Z"
      const base = (trip?.startDate ?? new Date().toISOString()).slice(0, ISO_DATE_LENGTH)
      const d = new Date(base + 'T00:00:00')
      d.setDate(d.getDate() + segN - 1)
      const date = d.toISOString().slice(0, ISO_DATE_LENGTH)
      const result = await fetchSunTimes(end[0], end[1], date)
      if (sunFetchSeqRef.current !== seq) return
      setDrawState(prev => mergeSunTimesIntoDrawState(prev, result))
    } catch {
      if (sunFetchSeqRef.current !== seq) return
      setDrawState(prev => prev.phase === 'active' ? { ...prev, sunTimesLoading: false } : prev)
    }
  }, [trip, sunFetchSeqRef, setDrawState])
}

function useSegmentPreviewFetch(fetchSeqRef: RefObject<number>, setDrawState: Dispatch<SetStateAction<DrawState>>) {
  return useCallback(async (
    start: [number, number], end: [number, number], existingName: string, autoName: boolean,
    gpxCoordsArg?: [number, number, number][], segN?: number,
  ) => {
    const seq = ++fetchSeqRef.current
    setDrawState(prev => prev.phase === 'active' ? { ...prev, loading: true, result: null, error: null } : prev)

    const [preview, startGeocode, endGeocode] = await Promise.all([
      fetchRoutePreview(start, end, gpxCoordsArg).catch(() => null),
      autoName ? reverseGeocode(start[0], start[1]) : Promise.resolve(''),
      autoName ? reverseGeocode(end[0], end[1]) : Promise.resolve(''),
    ])
    if (fetchSeqRef.current !== seq) return

    setDrawState(prev => mergeFetchResultIntoDrawState(prev, preview, existingName, segN, startGeocode, endGeocode))
  }, [fetchSeqRef, setDrawState])
}

type DrawFetchers = {
  triggerFetch: ReturnType<typeof useSegmentPreviewFetch>
  triggerSunFetch: ReturnType<typeof useSunTimesFetch>
}

type DrawCtx = DrawFetchers & {
  segments: SegRow[]
  gpxCoords: [number, number, number][] | undefined
  drawState: DrawState
  setDrawState: Dispatch<SetStateAction<DrawState>>
  setSegments: Dispatch<SetStateAction<SegRow[]>>
  reconnect: (toUpdate: ReconnectUpdate[]) => Promise<void>
  fetchSeqRef: RefObject<number>
  sunFetchSeqRef: RefObject<number>
  onScrollToTop: () => void
}

function enterDrawImpl(ctx: DrawCtx, editingSeg?: SegRow) {
  ctx.onScrollToTop()
  const path = editingSeg?.path
  if (editingSeg && path && path.length >= 2) {
    const seg = { ...editingSeg, path }
    ctx.setDrawState(computeEditDrawState(seg))
    const start = path[0]
    const end = path[path.length - 1]
    const hasTimes = !!(seg.wakeTime || seg.onTrailTime || seg.campByTime)
    ctx.triggerFetch(start, end, seg.name, false, ctx.gpxCoords)
    if (!hasTimes) ctx.triggerSunFetch(end, seg.n)
  } else {
    ctx.setDrawState(computeNewSegmentDrawState(ctx.segments))
  }
}

function cancelDrawImpl(ctx: DrawCtx) {
  ctx.setDrawState({ phase: 'idle' })
  ctx.fetchSeqRef.current++
  ctx.sunFetchSeqRef.current++
}

function resetStartPinImpl(ctx: DrawCtx) {
  ctx.fetchSeqRef.current++
  ctx.setDrawState(prev =>
    prev.phase === 'placing-end' || prev.phase === 'active'
      ? { phase: 'placing-start', editingSeg: prev.editingSeg }
      : prev
  )
}

function handleMapClickImpl(ctx: DrawCtx, lat: number, lng: number) {
  if (ctx.drawState.phase === 'placing-start') {
    ctx.setDrawState({ phase: 'placing-end', start: [lat, lng], snappedToPrev: false, editingSeg: ctx.drawState.editingSeg })
  } else if (ctx.drawState.phase === 'placing-end') {
    const newState = buildActiveDrawStateFromClick(ctx.drawState, ctx.segments, lat, lng)
    ctx.setDrawState(newState)
    ctx.triggerFetch(ctx.drawState.start, newState.end, newState.name, true, ctx.gpxCoords, newState.segN)
    ctx.triggerSunFetch(newState.end, newState.segN)
  }
}

function handlePinDragImpl(ctx: DrawCtx, which: 'start' | 'end', lat: number, lng: number) {
  if (ctx.drawState.phase !== 'active') return
  const start = which === 'start' ? [lat, lng] as [number, number] : ctx.drawState.start
  const end = which === 'end' ? [lat, lng] as [number, number] : ctx.drawState.end
  ctx.setDrawState(prev => prev.phase === 'active' ? { ...prev, start, end } : prev)
  ctx.triggerFetch(start, end, ctx.drawState.name, ctx.drawState.nameAuto, ctx.gpxCoords, ctx.drawState.segN)
}

async function handleConfirmSegmentImpl(ctx: DrawCtx) {
  if (ctx.drawState.phase !== 'active') return
  const { editingSeg, start: newStart, end: newEnd } = ctx.drawState
  const newSeg = buildConfirmedSeg(ctx.drawState)

  if (editingSeg) {
    ctx.setSegments(prev => prev.map(s => s.n === editingSeg.n ? { ...newSeg, n: editingSeg.n } : s))
    ctx.setDrawState({ phase: 'idle' })
    await ctx.reconnect(computeEditReconnectUpdates(ctx.segments, editingSeg, newStart, newEnd))
  } else {
    const n = (ctx.segments[ctx.segments.length - 1]?.n ?? 0) + 1
    ctx.setSegments(prev => [...prev, { ...newSeg, n }])
    ctx.setDrawState({ phase: 'idle' })
  }
}

async function handleEndpointDragImpl(ctx: DrawCtx, segIdx: number, which: 'start' | 'end', lat: number, lng: number) {
  const seg = ctx.segments[segIdx]
  if (!seg?.path?.length) return
  await ctx.reconnect(computeEndpointReconnectUpdates(ctx.segments, segIdx, which, [lat, lng]))
}

export function useDrawMode(
  trip: StageBodyProps['trip'],
  segments: SegRow[],
  setSegments: Dispatch<SetStateAction<SegRow[]>>,
  reconnect: (toUpdate: ReconnectUpdate[]) => Promise<void>,
  onScrollToTop: () => void,
) {
  const [drawState, setDrawState] = useState<DrawState>({ phase: 'idle' })
  const fetchSeqRef = useRef(0)
  const sunFetchSeqRef = useRef(0)
  const gpxCoords = trip?.gpxPlanned?.coordinates

  const triggerSunFetch = useSunTimesFetch(trip, sunFetchSeqRef, setDrawState)
  const triggerFetch = useSegmentPreviewFetch(fetchSeqRef, setDrawState)

  const ctx: DrawCtx = {
    segments, gpxCoords, drawState, setDrawState, setSegments, reconnect,
    triggerFetch, triggerSunFetch, fetchSeqRef, sunFetchSeqRef, onScrollToTop,
  }

  return {
    drawState, setDrawState,
    enterDraw: (editingSeg?: SegRow) => enterDrawImpl(ctx, editingSeg),
    cancelDraw: () => cancelDrawImpl(ctx),
    resetStartPin: () => resetStartPinImpl(ctx),
    handleMapClick: (lat: number, lng: number) => handleMapClickImpl(ctx, lat, lng),
    handlePinDrag: (which: 'start' | 'end', lat: number, lng: number) => handlePinDragImpl(ctx, which, lat, lng),
    handleConfirmSegment: () => handleConfirmSegmentImpl(ctx),
    handleEndpointDrag: (segIdx: number, which: 'start' | 'end', lat: number, lng: number) =>
      handleEndpointDragImpl(ctx, segIdx, which, lat, lng),
  }
}
