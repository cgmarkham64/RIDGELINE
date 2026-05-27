import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import L from 'leaflet'
import { resolveStartEnd } from '../../map/constants'
import { fetchDetectedWaterSources, type DetectedWaterSource } from '../../../lib/waterSources'
import {
  toLatLngs, gpxCoordsToMiles, buildMergedRows,
  DEFAULT_CHECKLIST, PARTNER_ITEMS, fetchRoutePreview, reverseGeocode,
  fetchSunTimes, splitSegmentAt, resolveTimePreference,
} from './routeStage.helpers'
import { useAuthStore } from '../../../store/auth'
import { DEFAULT_USER_PREFERENCES } from '../../../types/auth'
import type { SegRow, CheckRow, DrawState } from './routeStage.types'
import { RouteMapCard, type RouteMapCardHandle } from './RouteMapCard'
import { RouteTable, type RouteTableHandle } from './RouteTable'
import { RouteRightRail } from './RouteRightRail'
import { suggestHard } from '../../../lib/trailDifficulty'
import type { StageBodyProps } from '../types'

export function RouteStage({ onJump, plan, onChange, onProgress, trip, canEdit }: StageBodyProps) {
  const [segments,      setSegments]      = useState<SegRow[]>(plan?.route?.segments ?? [])
  const [checklist,     setChecklist]     = useState<CheckRow[]>(plan?.route?.checklist ?? DEFAULT_CHECKLIST)
  const [drawState,     setDrawState]     = useState<DrawState>({ phase: 'idle' })
  const [waterResult,   setWaterResult]   = useState<{ sources: DetectedWaterSource[]; error: string | null; key: string | null }>({ sources: [], error: null, key: null })
  const [activeRowId,   setActiveRowId]   = useState<string | null>(null)
  const [repositioning, setRepositioning] = useState(new Set<number>())

  const mapCardRef      = useRef<RouteMapCardHandle>(null)
  const tableRef        = useRef<RouteTableHandle>(null)
  const fetchSeqRef     = useRef(0)
  const sunFetchSeqRef  = useRef(0)

  const isMounted     = useRef(false)
  const onChangeRef   = useRef(onChange)
  const onProgressRef = useRef(onProgress)
  useEffect(() => { onChangeRef.current   = onChange   }, [onChange])
  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])

  const effectiveChecklist = useMemo(() =>
    checklist.map(c =>
      c.text === 'Exposure & water annotated'
        ? { ...c, done: segments.length > 0 && segments.every(s => !!s.exposure && !!s.water) }
        : c
    ),
    [checklist, segments],
  )

  useEffect(() => {
    onProgressRef.current?.(effectiveChecklist.filter(c => c.done).length, effectiveChecklist.length)
  }, [effectiveChecklist])

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ route: { segments, checklist, sourceFiles: [] } })
  }, [segments, checklist])

  // ── Detected water sources ───────────────────────────────────────────────────

  const gpxCoords = trip?.gpxPlanned?.coordinates
  const coordsKey = gpxCoords && gpxCoords.length >= 2
    ? `${gpxCoords.length}:${gpxCoords[0][0]},${gpxCoords[gpxCoords.length - 1][0]}`
    : null

  const visibleWater   = useMemo(
    () => coordsKey !== null && waterResult.key === coordsKey ? waterResult.sources : [],
    [coordsKey, waterResult],
  )
  const displayLoading = coordsKey !== null && waterResult.key !== coordsKey
  const displayError   = coordsKey !== null && waterResult.key === coordsKey ? waterResult.error : null

  useEffect(() => {
    if (!coordsKey) return
    let cancelled = false
    fetchDetectedWaterSources(gpxCoords!)
      .then(sources => { if (!cancelled) setWaterResult({ sources, error: null, key: coordsKey }) })
      .catch(err   => { if (!cancelled) setWaterResult({ sources: [], error: err instanceof Error ? err.message : 'Detection failed', key: coordsKey }) })
    return () => { cancelled = true }
  }, [coordsKey, gpxCoords])

  // ── Merged route + water rows ────────────────────────────────────────────────

  const mergedRows = useMemo(
    () => buildMergedRows(segments, visibleWater, trip?.waypoints, trip?.gpxPlanned?.coordinates),
    [segments, visibleWater, trip?.waypoints, trip?.gpxPlanned?.coordinates],
  )

  // ── Derived values ───────────────────────────────────────────────────────────

  const totalMiles = segments.reduce((s, x) => s + x.mi, 0)
  const totalGain  = segments.reduce((s, x) => s + x.gain, 0)
  const doneCount  = effectiveChecklist.filter(c => c.done).length

  const plannedLatLngs    = toLatLngs(trip?.gpxPlanned?.coordinates)
  const tracksWithLatLngs = (trip?.gpxTracks ?? []).map((entry, i) => ({
    entry,
    positions: toLatLngs(entry.track.coordinates),
    color: ['#4ade80', '#fb923c', '#a78bfa', '#f472b6', '#34d399'][i % 5],
  }))
  const allPoints: [number, number][] = [
    ...plannedLatLngs,
    ...tracksWithLatLngs.flatMap(t => t.positions),
  ]
  const bounds   = allPoints.length > 1 ? L.latLngBounds(allPoints) : null
  const startEnd = resolveStartEnd(plannedLatLngs, tracksWithLatLngs)

  const sourceFiles = [
    ...(trip?.gpxPlanned
      ? [{ name: 'Planned Route', meta: `${gpxCoordsToMiles(trip.gpxPlanned.coordinates).toFixed(1)} mi · GPX`, coords: trip.gpxPlanned.coordinates }]
      : []),
    ...(trip?.gpxTracks ?? []).map(t => ({
      name: t.label,
      meta: `${gpxCoordsToMiles(t.track.coordinates).toFixed(1)} mi · GPS track`,
      coords: t.track.coordinates,
    })),
  ]

  // ── Cross-link: table row → map fly, map marker → table scroll ───────────────

  function flyToRow(lat: number | null, lon: number | null, rowId: string) {
    setActiveRowId(rowId)
    if (lat != null && lon != null) mapCardRef.current?.flyTo(lat, lon)
  }

  function handleCampClick(rowId: string) {
    setActiveRowId(rowId)
    tableRef.current?.scrollToRow(rowId)
  }

  // ── Checklist ────────────────────────────────────────────────────────────────

  function toggleCheck(i: number) {
    setChecklist(prev => prev.map((c, idx) => idx === i ? { ...c, done: !c.done } : c))
  }

  function confirmNoPartners() {
    setChecklist(prev => prev.map(c => PARTNER_ITEMS.includes(c.text) ? { ...c, done: true } : c))
  }

  function handleInviteSent() {
    setChecklist(prev => prev.map(c => PARTNER_ITEMS.includes(c.text) ? { ...c, done: false } : c))
  }

  // ── Sun times ────────────────────────────────────────────────────────────────

  const triggerSunFetch = useCallback(async (end: [number, number], segN: number) => {
    const seq = ++sunFetchSeqRef.current
    try {
      // slice(0,10) normalises both "2025-05-25" and "2025-05-25T00:00:00.000Z"
      const base = (trip?.startDate ?? new Date().toISOString()).slice(0, 10)
      const d = new Date(base + 'T00:00:00')
      d.setDate(d.getDate() + segN - 1)
      const date = d.toISOString().slice(0, 10)
      const result = await fetchSunTimes(end[0], end[1], date)
      if (sunFetchSeqRef.current !== seq) return
      setDrawState(prev => {
        if (prev.phase !== 'active') return prev
        if (!result) return { ...prev, sunTimesLoading: false }
        return {
          ...prev,
          sunTimesLoading: false,
          ...((): object => {
            const prefs = useAuthStore.getState().user?.preferences ?? DEFAULT_USER_PREFERENCES
            return {
              wakeTime:    prev.wakeTime    ?? resolveTimePreference(prefs.wakeTime,    result.sunrise, result.sunset),
              onTrailTime: prev.onTrailTime ?? resolveTimePreference(prefs.onTrailTime, result.sunrise, result.sunset),
              campByTime:  prev.campByTime  ?? resolveTimePreference(prefs.campByTime,  result.sunrise, result.sunset),
            }
          })(),
        }
      })
    } catch {
      if (sunFetchSeqRef.current !== seq) return
      setDrawState(prev => prev.phase === 'active' ? { ...prev, sunTimesLoading: false } : prev)
    }
  }, [trip])

  // ── Draw mode ────────────────────────────────────────────────────────────────

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
        hard: prev.hard !== undefined ? prev.hard
          : preview ? (suggestHard(preview.mi, preview.gain) || undefined) : undefined,
      }
    })
  }, [])

  function enterDraw(editingSeg?: SegRow) {
    mapCardRef.current?.scrollToTop()
    if (editingSeg?.path && editingSeg.path.length >= 2) {
      const start = editingSeg.path[0]
      const end   = editingSeg.path[editingSeg.path.length - 1]
      const hasTimes = !!(editingSeg.wakeTime || editingSeg.onTrailTime || editingSeg.campByTime)
      setDrawState({
        phase: 'active', start, end,
        loading: false, result: null, error: null,
        name: editingSeg.name, nameAuto: false, segN: editingSeg.n,
        notes: editingSeg.notes,
        showMore: !!(editingSeg.notes || editingSeg.water || editingSeg.exposure) || !hasTimes,
        sunTimesLoading: !hasTimes,
        water:        editingSeg.water,
        exposure:     editingSeg.exposure,
        hard:         editingSeg.hard,
        wakeTime:     editingSeg.wakeTime,
        onTrailTime:  editingSeg.onTrailTime,
        campByTime:   editingSeg.campByTime,
        editingSeg,
      })
      triggerFetch(start, end, editingSeg.name, false, trip?.gpxPlanned?.coordinates)
      if (!hasTimes) triggerSunFetch(end, editingSeg.n)
    } else {
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
    sunFetchSeqRef.current++
  }

  function resetStartPin() {
    fetchSeqRef.current++
    setDrawState(prev =>
      prev.phase === 'placing-end' || prev.phase === 'active'
        ? { phase: 'placing-start', editingSeg: prev.editingSeg }
        : prev
    )
  }

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
        showMore: true,
        sunTimesLoading: true,
        water:        drawState.editingSeg?.water,
        exposure:     drawState.editingSeg?.exposure,
        hard:         drawState.editingSeg?.hard,
        wakeTime:     undefined,
        onTrailTime:  undefined,
        campByTime:   undefined,
        editingSeg: drawState.editingSeg,
      })
      triggerFetch(start, end, defaultName, true, trip?.gpxPlanned?.coordinates, segN)
      triggerSunFetch(end, segN)
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

  async function handleConfirmSegment() {
    if (drawState.phase !== 'active') return
    const { result, name, notes, editingSeg, water, exposure, hard, wakeTime, onTrailTime, campByTime, start: newStart, end: newEnd } = drawState
    const mi   = result ? parseFloat(result.mi.toFixed(1)) : 0
    const gain = result?.gain ?? 0
    const newSeg: Omit<SegRow, 'n'> = {
      name:  name.trim() || 'Unnamed segment',
      mi,
      gain,
      notes: notes.trim(),
      path:  result?.path,
      water,
      exposure,
      hard:  hard ?? (suggestHard(mi, gain) || undefined),
      wakeTime:    wakeTime    || undefined,
      onTrailTime: onTrailTime || undefined,
      campByTime:  campByTime  || undefined,
    }
    if (editingSeg) {
      setSegments(prev => prev.map(s => s.n === editingSeg.n ? { ...newSeg, n: editingSeg.n } : s))
      setDrawState({ phase: 'idle' })

      // Re-fetch adjacent segments if either endpoint moved
      const segIdx = segments.findIndex(s => s.n === editingSeg.n)
      const oldEnd   = editingSeg.path?.[editingSeg.path.length - 1]
      const oldStart = editingSeg.path?.[0]
      const toReconnect: { si: number; start: [number, number]; end: [number, number] }[] = []

      if (oldEnd && (oldEnd[0] !== newEnd[0] || oldEnd[1] !== newEnd[1])) {
        const next = segments[segIdx + 1]
        if (next?.path?.length)
          toReconnect.push({ si: segIdx + 1, start: newEnd, end: next.path[next.path.length - 1] })
      }
      if (oldStart && (oldStart[0] !== newStart[0] || oldStart[1] !== newStart[1])) {
        const prev = segments[segIdx - 1]
        if (prev?.path?.length)
          toReconnect.push({ si: segIdx - 1, start: prev.path[0], end: newStart })
      }

      if (toReconnect.length > 0) {
        setRepositioning(new Set(toReconnect.map(u => u.si)))
        const reconnected = await Promise.all(
          toReconnect.map(async ({ si, start, end }) => ({
            si,
            preview: await fetchRoutePreview(start, end, trip?.gpxPlanned?.coordinates).catch(() => null),
          }))
        )
        setRepositioning(new Set())
        setSegments(prev => {
          let next = [...prev]
          for (const { si, preview } of reconnected) {
            if (!preview) continue
            next = next.map((s, i) =>
              i === si ? { ...s, mi: parseFloat(preview.mi.toFixed(1)), gain: preview.gain, path: preview.path } : s
            )
          }
          return next
        })
      }
    } else {
      const n = (segments[segments.length - 1]?.n ?? 0) + 1
      setSegments(prev => [...prev, { ...newSeg, n }])
      setDrawState({ phase: 'idle' })
    }
  }

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
      const toIdx   = prev.findIndex(s => s.n === toN)
      if (fromIdx === -1 || toIdx === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next.map((s, i) => ({ ...s, n: i + 1 }))
    })
  }

  async function handleEndpointDrag(segIdx: number, which: 'start' | 'end', lat: number, lng: number) {
    const snap = segments
    const seg = snap[segIdx]
    if (!seg?.path?.length) return

    const newPos: [number, number] = [lat, lng]
    const toUpdate: { si: number; start: [number, number]; end: [number, number] }[] = []

    toUpdate.push({
      si: segIdx,
      start: which === 'start' ? newPos : seg.path[0],
      end:   which === 'end'   ? newPos : seg.path[seg.path.length - 1],
    })

    if (which === 'end') {
      const next = snap[segIdx + 1]
      if (next?.path?.length)
        toUpdate.push({ si: segIdx + 1, start: newPos, end: next.path[next.path.length - 1] })
    }
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 grid-cols-[1fr_360px]">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-4.5">
          <RouteMapCard
            ref={mapCardRef}
            mapData={{
              segments, detectedWater: visibleWater, activeRowId, trip,
              plannedLatLngs, tracksWithLatLngs, allPoints, bounds, startEnd,
              totalMiles, totalGain, repositioning,
            }}
            drawProps={{
              drawState, setDrawState,
              onCancelDraw: cancelDraw,
              onConfirmSegment: handleConfirmSegment,
              onMapClick: handleMapClick,
              onPinDrag: handlePinDrag,
              onEndpointDrag: handleEndpointDrag,
              onResetStartPin: resetStartPin,
            }}
            uploadProps={{ canEdit: canEdit ?? false }}
            onCampClick={handleCampClick}
            onSplitSegment={splitSegment}
          />

          <RouteTable
            ref={tableRef}
            mergedRows={mergedRows}
            activeRowId={activeRowId}
            segments={segments}
            repositioning={repositioning}
            waterLoading={displayLoading}
            waterError={displayError}
            canEdit={canEdit ?? false}
            isDrawing={drawState.phase !== 'idle'}
            onJump={onJump}
            onFlyTo={flyToRow}
            onEnterDraw={enterDraw}
            onDeleteSegment={deleteSegment}
            onReorderSegments={reorderSegments}
          />
        </div>

        {/* ── Right rail ── */}
        <RouteRightRail
          trip={trip}
          canEdit={canEdit ?? false}
          checklist={effectiveChecklist}
          doneCount={doneCount}
          onToggleCheck={toggleCheck}
          onInviteSent={handleInviteSent}
          onNoPartners={confirmNoPartners}
          sourceFiles={sourceFiles}
        />
      </div>
    </div>
  )
}