import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L, { type LatLngBoundsExpression } from 'leaflet'
import { useQueryClient } from '@tanstack/react-query'
import { JumpChip } from '../JumpChip'
import { ProgressBar } from '../ProgressBar'
import { CheckItem } from '../CheckItem'
import { initials } from '../../../lib/utils'
import { searchUsers, shareTrip, type UserSearchResult } from '../../../lib/users'
import { api } from '../../../lib/api'
import { parseGpx } from '../../../lib/gpx'
import { ElevationProfile } from '../../trip/ElevationProfile'
import { PLANNED_COLOR, resolveStartEnd } from '../../map/constants'
import { makeStartIcon, makeEndIcon } from '../../map/leafletIcons'
import { IconPlus, IconMap, IconDownload, IconFile, IconX } from '../../icons'
import type { StageBodyProps } from '../types'

type SegRow   = { n: number; name: string; mi: number; gain: number; cls: string; notes: string }
type CheckRow = { text: string; done: boolean }

const DEFAULT_CHECKLIST: CheckRow[] = [
  { text: 'Route picked',              done: false },
  { text: 'Entry trailhead set',       done: false },
  { text: 'Exit trailhead set',        done: false },
  { text: 'Distance & gain confirmed', done: false },
  { text: 'Segments reviewed',         done: false },
  { text: 'Partners reviewed',         done: false },
]

// ─── Leaflet helpers ──────────────────────────────────────────────────────────

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

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1)
      map.fitBounds(positions as LatLngBoundsExpression, { padding: [20, 20] })
  }, [map, positions])
  return null
}

// ─── Segment dialog ───────────────────────────────────────────────────────────

function SegmentDialog({
  initial,
  onSave,
  onClose,
}: {
  initial?: SegRow
  onSave: (s: Omit<SegRow, 'n'>) => void
  onClose: () => void
}) {
  const [name,  setName]  = useState(initial?.name  ?? '')
  const [mi,    setMi]    = useState(String(initial?.mi   ?? ''))
  const [gain,  setGain]  = useState(String(initial?.gain ?? ''))
  const [cls,   setCls]   = useState(initial?.cls   ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  function submit() {
    if (!name.trim()) return
    onSave({
      name:  name.trim(),
      mi:    parseFloat(mi)  || 0,
      gain:  parseInt(gain)  || 0,
      cls:   cls.trim(),
      notes: notes.trim(),
    })
  }

  const inputCls = 'w-full px-2.5 py-[6px] bg-surface-2 border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]'
  const labelCls = 'font-mono text-[8px] tracking-[0.12em] uppercase text-text-dim mb-1 block'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-surface border border-border-mid rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="font-heading text-[16px] font-extrabold text-text mb-5">
          {initial ? 'Edit segment' : 'Add segment'}
        </h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>Segment name</label>
            <input
              className={inputCls}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Onion Valley → Kearsarge Pass"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className={labelCls}>Miles</label>
              <input type="number" step="0.1" min="0" className={inputCls} value={mi} onChange={e => setMi(e.target.value)} placeholder="0.0" />
            </div>
            <div>
              <label className={labelCls}>Elev gain (ft)</label>
              <input type="number" step="100" min="0" className={inputCls} value={gain} onChange={e => setGain(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Class</label>
              <input className={inputCls} value={cls} onChange={e => setCls(e.target.value)} placeholder="1, 2, 2-3…" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Trail conditions, hazards, waypoints…" />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase rounded border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Route Stage ─────────────────────────────────────────────────────────────

export function RouteStage({ onJump, plan, onChange, onProgress, trip, canEdit }: StageBodyProps) {
  const [segments,    setSegments]    = useState<SegRow[]>(plan?.route?.segments ?? [])
  const [checklist,   setChecklist]   = useState<CheckRow[]>(plan?.route?.checklist ?? DEFAULT_CHECKLIST)
  const [segDialog, setSegDialog]     = useState<{ mode: 'add' } | { mode: 'edit'; seg: SegRow } | null>(null)
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging,  setIsDragging]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter  = useRef(0)
  const qc = useQueryClient()

  const isMounted     = useRef(false)
  const onChangeRef   = useRef(onChange)
  const onProgressRef = useRef(onProgress)
  useEffect(() => { onChangeRef.current   = onChange   }, [onChange])
  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])

  // Keep stage rail in sync whenever checklist changes (fires on mount too).
  useEffect(() => {
    onProgressRef.current?.(checklist.filter(c => c.done).length, checklist.length)
  }, [checklist])

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ route: { segments, checklist, sourceFiles: [] } })
  }, [segments, checklist])

  const totalMiles = segments.reduce((s, x) => s + x.mi, 0)
  const totalGain  = segments.reduce((s, x) => s + x.gain, 0)
  const doneCount  = checklist.filter(c => c.done).length

  const partners: { name: string; sub: string }[] = [
    ...(trip?.ownerSub ? [{ sub: trip.ownerSub, name: trip.ownerName ?? 'Owner' }] : []),
    ...(trip?.sharedWith?.map(c => ({ sub: c.sub, name: c.name })) ?? []),
  ]

  // ── GPX upload ──────────────────────────────────────────────────────────────

  async function handleGpxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !trip?._id) return
    setUploading(true)
    setUploadError(null)
    try {
      const text = await file.text()
      const { track } = parseGpx(text)
      await api.put(`/api/trips/${trip._id}`, { gpxPlanned: track })
      qc.invalidateQueries({ queryKey: ['plan', trip._id] })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to import GPX')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleGpxRemove() {
    if (!trip?._id) return
    setUploading(true)
    setUploadError(null)
    try {
      await api.put(`/api/trips/${trip._id}`, { gpxPlanned: null })
      qc.invalidateQueries({ queryKey: ['plan', trip._id] })
    } catch {
      setUploadError('Failed to remove route')
    } finally {
      setUploading(false)
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

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    if (!canEdit || !trip?._id) return
    const file = Array.from(e.dataTransfer.files).find(f => f.name.endsWith('.gpx'))
    if (!file) { setUploadError('Drop a .gpx file to import'); return }
    setUploading(true)
    setUploadError(null)
    try {
      const text = await file.text()
      const { track } = parseGpx(text)
      await api.put(`/api/trips/${trip._id}`, { gpxPlanned: track })
      qc.invalidateQueries({ queryKey: ['plan', trip._id] })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to import GPX')
    } finally {
      setUploading(false)
    }
  }

  // ── Partner invite ──────────────────────────────────────────────────────────
  const [inviteOpen,      setInviteOpen]      = useState(false)
  const [inviteQuery,     setInviteQuery]     = useState('')
  const [inviteResults,   setInviteResults]   = useState<UserSearchResult[]>([])
  const [inviteSearching, setInviteSearching] = useState(false)
  const [inviteMsg,       setInviteMsg]       = useState<{ text: string; tone: 'pine' | 'red' } | null>(null)
  const [pendingInvites,  setPendingInvites]  = useState<{ sub: string; name: string }[]>([])
  const inviteTimer   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inviteSearchId = useRef(0)

  function handleInviteQueryChange(q: string) {
    setInviteQuery(q)
    clearTimeout(inviteTimer.current)
    if (q.trim().length < 2) {
      setInviteResults([])
      setInviteSearching(false)
      return
    }
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
  // ───────────────────────────────────────────────────────────────────────────

  function toggleCheck(i: number) {
    setChecklist(prev => prev.map((c, idx) => idx === i ? { ...c, done: !c.done } : c))
  }

  function handleSaveSegment(data: Omit<SegRow, 'n'>) {
    if (segDialog?.mode === 'edit') {
      setSegments(prev => prev.map(s => s.n === segDialog.seg.n ? { ...data, n: segDialog.seg.n } : s))
    } else {
      const n = (segments[segments.length - 1]?.n ?? 0) + 1
      setSegments(prev => [...prev, { ...data, n }])
    }
    setSegDialog(null)
  }

  function deleteSegment(n: number) {
    setSegments(prev =>
      prev.filter(s => s.n !== n).map((s, i) => ({ ...s, n: i + 1 }))
    )
  }

  // ── Map data ─────────────────────────────────────────────────────────────────

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

  // Derived source files — auto-populates once GPX is uploaded to the trip
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

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 pb-20">
        <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_320px]">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-[18px]">

            {/* Route summary + map */}
            <div
              className={`bg-surface border rounded-lg p-[18px] transition-colors ${isDragging ? 'border-amber-border' : 'border-border'}`}
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
                {canEdit && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {trip?.gpxPlanned && !uploading && (
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
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 font-heading text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-1 rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <IconDownload size={9} />
                      {uploading ? 'Importing…' : trip?.gpxPlanned ? 'Replace' : 'Import .gpx'}
                    </button>
                  </div>
                )}
              </div>

              {uploadError && (
                <p className="font-mono text-[9px] text-red mb-2">{uploadError}</p>
              )}

              {/* Map */}
              <div className="relative rounded overflow-hidden border border-border" style={{ height: 220 }}>
                {isDragging && canEdit && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-none"
                    style={{ background: 'rgba(15,13,11,0.75)', borderRadius: 'inherit' }}>
                    <IconDownload size={22} />
                    <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-amber">Drop .gpx to import</p>
                  </div>
                )}
                {bounds ? (
                  <MapContainer
                    bounds={bounds as LatLngBoundsExpression}
                    boundsOptions={{ padding: [20, 20] }}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      subdomains="abcd"
                      maxZoom={19}
                      detectRetina
                    />
                    {plannedLatLngs.length > 1 && (
                      <Polyline positions={plannedLatLngs} color={PLANNED_COLOR} weight={4} opacity={0.9} dashArray="10 6" />
                    )}
                    {tracksWithLatLngs.map(({ entry, color, positions }) =>
                      positions.length > 1 ? (
                        <Polyline key={entry.id} positions={positions} color={color} weight={3} opacity={0.9} />
                      ) : null
                    )}
                    {startEnd && (
                      <>
                        <Marker position={startEnd.start} icon={makeStartIcon(16)} interactive={false} />
                        <Marker position={startEnd.end} icon={makeEndIcon(16)} interactive={false} />
                      </>
                    )}
                    <FitBounds positions={allPoints} />
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
              </div>
            </div>

            {/* Elevation profile — shown once GPX data is available */}
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

            {/* Segments table */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Segments</span>
                {segments.length > 0 && (
                  <span className="font-mono text-[9px] text-text-dim">
                    {segments.length} · auto-pulls into{' '}
                    <JumpChip to="days" onJump={onJump}>Days</JumpChip>
                  </span>
                )}
                {canEdit && (
                  <button
                    onClick={() => setSegDialog({ mode: 'add' })}
                    className="ml-auto inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1.5 rounded border border-border text-text bg-transparent hover:border-border-mid transition-colors cursor-pointer"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add segment
                  </button>
                )}
              </div>

              {segments.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1.5">No segments yet</p>
                  <p className="text-[12px] text-text-mid">
                    {canEdit
                      ? 'Add segments to define each leg of your route.'
                      : 'No segments have been added to this route.'}
                  </p>
                </div>
              ) : segments.map((s, i) => (
                <div
                  key={s.n}
                  className={`grid items-center px-4 py-2.5 gap-3 ${i < segments.length - 1 ? 'border-b border-border' : ''} hover:bg-surface-2 transition-colors`}
                  style={{ gridTemplateColumns: '36px 1fr 60px 76px 52px 1fr auto' }}
                >
                  <span className="font-mono text-[9px] font-bold text-pine text-center py-0.5 rounded border border-pine-border bg-pine-dim">
                    S{s.n}
                  </span>
                  <span className="text-[12px] font-semibold text-text truncate">{s.name}</span>
                  <span className="font-mono text-[10px] text-text">{s.mi.toFixed(1)} mi</span>
                  <span className="font-mono text-[10px] text-text-mid">+{s.gain.toLocaleString()} ft</span>
                  <span className="font-mono text-[10px] text-amber">{s.cls ? `cl ${s.cls}` : '—'}</span>
                  <span className="text-[10px] text-text-mid italic truncate">{s.notes || '—'}</span>
                  {canEdit && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => setSegDialog({ mode: 'edit', seg: s })}
                        title="Edit segment"
                        className="p-1 rounded text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteSegment(s.n)}
                        title="Delete segment"
                        className="p-1 rounded text-text-dim hover:text-red hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
                  <button
                    onClick={() => setInviteOpen(true)}
                    title="Add partner"
                    className="inline-flex items-center gap-1 font-heading text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-1 rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
                  >
                    <IconPlus size={9} />
                    Add
                  </button>
                )}
              </div>

              {partners.length === 0 && pendingInvites.length === 0 && !inviteOpen && (
                <p className="font-mono text-[9px] text-text-dim italic">No partners yet.</p>
              )}

              {[...partners.map(p => ({ ...p, pending: false })), ...pendingInvites.map(p => ({ ...p, pending: true }))].map((p, i, arr) => (
                <div key={p.sub} className={`flex items-center gap-2.5 py-2 ${i < arr.length - 1 || inviteOpen ? 'border-b border-border' : ''}`}>
                  <span className="w-[26px] h-[26px] rounded-full bg-surface-2 border border-border-mid flex items-center justify-center font-heading text-[10px] font-extrabold text-amber shrink-0">
                    {initials(p.name)}
                  </span>
                  <span className="text-[11px] font-semibold text-text truncate flex-1 min-w-0">{p.name}</span>
                  {p.pending && (
                    <span className="font-mono text-[8px] tracking-[0.12em] text-amber shrink-0">PENDING</span>
                  )}
                </div>
              ))}

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

      {segDialog && (
        <SegmentDialog
          initial={segDialog.mode === 'edit' ? segDialog.seg : undefined}
          onSave={handleSaveSegment}
          onClose={() => setSegDialog(null)}
        />
      )}

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