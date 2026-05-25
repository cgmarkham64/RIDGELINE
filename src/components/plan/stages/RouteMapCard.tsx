import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L, { type LatLngBoundsExpression } from 'leaflet'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { parseGpx, enrichWithElevation } from '../../../lib/gpx'
import { PLANNED_COLOR, TILE_LAYERS, type TileLayerKey } from '../../map/constants'
import { AttributionStrip, MapRefCapture, ZoomControls } from '../../map/MapHelpers'
import { MapTileToggle } from '../../map/MapTileToggle'
import { makeStartIcon, makeEndIcon, makeWaypointIcon, makeDetectedWaterIcon } from '../../map/leafletIcons'
import { IconMap, IconDownload, IconX } from '../../icons'
import { SEG_COLORS, formatCoord } from './routeStage.helpers'
import type { SegRow, DrawState } from './routeStage.types'
import type { DetectedWaterSource } from '../../../lib/waterSources'
import type { StageBodyProps } from '../types'
import type { GpxTrackEntry } from '../../../types'

// ─── Public handle type ───────────────────────────────────────────────────────

export type RouteMapCardHandle = {
  flyTo(lat: number, lon: number): void
  scrollToTop(): void
}

// ─── Prop groups ──────────────────────────────────────────────────────────────

type MapData = {
  segments: SegRow[]
  detectedWater: DetectedWaterSource[]
  activeRowId: string | null
  trip: StageBodyProps['trip']
  plannedLatLngs: [number, number][]
  tracksWithLatLngs: { entry: GpxTrackEntry; positions: [number, number][]; color: string }[]
  allPoints: [number, number][]
  bounds: L.LatLngBounds | null
  startEnd: { start: [number, number]; end: [number, number] } | null
  totalMiles: number
  totalGain: number
  repositioning: Set<number>
}

type DrawProps = {
  drawState: DrawState
  setDrawState: React.Dispatch<React.SetStateAction<DrawState>>
  onCancelDraw: () => void
  onConfirmSegment: () => void
  onMapClick: (lat: number, lng: number) => void
  onPinDrag: (which: 'start' | 'end', lat: number, lng: number) => void
  onEndpointDrag: (segIdx: number, which: 'start' | 'end', lat: number, lng: number) => void
  onResetStartPin: () => void
}

type UploadProps = {
  canEdit: boolean
}

type RouteMapCardProps = {
  mapData: MapData
  drawProps: DrawProps
  uploadProps: UploadProps
  onCampClick: (rowId: string) => void
}

// ─── Inner Leaflet helpers ─────────────────────────────────────────────────────

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

// ─── Draw pin icons ───────────────────────────────────────────────────────────

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

// ─── Elevation sparkline ───────────────────────────────────────────────────────

function ElevSparkline({ elevs }: { elevs: number[] }) {
  if (elevs.length < 2) return null
  const min = Math.min(...elevs)
  const max = Math.max(...elevs)
  const range = max - min || 1
  const W = 1000, H = 60, PAD = 4
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

// ─── Draw confirm tray ────────────────────────────────────────────────────────

type DrawConfirmTrayProps = {
  drawState: Extract<DrawState, { phase: 'active' }>
  setDrawState: React.Dispatch<React.SetStateAction<DrawState>>
  onCancel: () => void
  onConfirm: () => void
}

function DrawConfirmTray({ drawState, setDrawState, onCancel, onConfirm }: DrawConfirmTrayProps) {
  return (
    <div className="mt-3 rounded border border-border bg-surface-2 p-3">
      <div className="flex items-center gap-3 mb-2.5">
        {drawState.loading ? (
          <span className="font-mono text-[9px] text-text-dim tracking-widest">Calculating…</span>
        ) : drawState.result ? (
          <>
            <span className="font-mono text-[11px] font-bold text-amber">
              {drawState.result.mi.toFixed(1)} mi
            </span>
            <span className="font-mono text-[10px] text-text-mid">
              +{drawState.result.gain.toLocaleString()} ft gain
            </span>
            {drawState.result.sparkElevs.length > 1 && (
              <span className="font-mono text-[9px] text-text-dim">(drag pins to recalculate)</span>
            )}
          </>
        ) : drawState.error ? (
          <span className="font-mono text-[9px] text-text-dim">{drawState.error}</span>
        ) : null}
      </div>

      {drawState.result?.sparkElevs && drawState.result.sparkElevs.length > 1 && (
        <div className="mb-2.5 rounded overflow-hidden" style={{ background: 'var(--surface)' }}>
          <ElevSparkline elevs={drawState.result.sparkElevs} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div>
          <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1 block">
            Segment name
          </label>
          <input
            className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]"
            value={drawState.name}
            onChange={e =>
              setDrawState(prev =>
                prev.phase === 'active' ? { ...prev, name: e.target.value, nameAuto: false } : prev
              )
            }
            placeholder="e.g. Onion Valley → Kearsarge Pass"
            autoFocus
          />
        </div>
        <div>
          <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1 block">Notes</label>
          <input
            className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]"
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
            onClick={onCancel}
            className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-widest uppercase rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!drawState.name.trim() || drawState.loading}
            className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-widest uppercase rounded border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
          >
            {drawState.editingSeg ? 'Update segment' : 'Add segment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── RouteMapCard ─────────────────────────────────────────────────────────────

export const RouteMapCard = forwardRef<RouteMapCardHandle, RouteMapCardProps>(
  function RouteMapCard({ mapData, drawProps, uploadProps, onCampClick }, ref) {
    const { segments, detectedWater, activeRowId, trip, plannedLatLngs, tracksWithLatLngs, allPoints, bounds, startEnd, totalMiles, totalGain, repositioning } = mapData
    const { drawState, setDrawState, onCancelDraw, onConfirmSegment, onMapClick, onPinDrag, onEndpointDrag, onResetStartPin } = drawProps
    const { canEdit } = uploadProps

    const qc = useQueryClient()
    const [tileLayer,   setTileLayer]   = useState<TileLayerKey>('topo')
    const [uploadLabel, setUploadLabel] = useState<string | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [isDragging,  setIsDragging]  = useState(false)
    const mapRef      = useRef<L.Map | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dragCounter  = useRef(0)

    useImperativeHandle(ref, () => ({
      flyTo(lat: number, lon: number) {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => {
          mapRef.current?.invalidateSize()
          mapRef.current?.flyTo([lat, lon], 13, { duration: 0.6 })
        }, 350)
      },
      scrollToTop() {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      },
    }))

    // ── GPX upload ──────────────────────────────────────────────────────────────

    async function importGpxFile(file: File) {
      if (!trip?._id) return
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

    async function handleGpxUpload(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (!file) return
      await importGpxFile(file)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
      if (!canEdit) return
      const file = Array.from(e.dataTransfer.files).find(f => f.name.endsWith('.gpx'))
      if (!file) { setUploadError('Drop a .gpx file to import'); return }
      await importGpxFile(file)
    }

    // ── Derived draw state ──────────────────────────────────────────────────────

    const isDrawing   = drawState.phase !== 'idle'
    const startPlaced = drawState.phase === 'placing-end' || drawState.phase === 'active'
    const endPlaced   = drawState.phase === 'active'

    const mapProps = bounds
      ? { bounds: bounds as LatLngBoundsExpression, boundsOptions: { padding: [20, 20] as [number, number] } }
      : { center: [40.0, -105.5] as [number, number], zoom: 5 }

    const showMap = !!bounds || isDrawing || segments.some(s => s.path?.length)

    return (
      <div
        ref={containerRef}
        className={`bg-surface border rounded-lg p-4.5 transition-colors ${isDragging ? 'border-amber-border' : isDrawing ? 'border-amber-border' : 'border-border'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Header */}
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
                className="inline-flex items-center gap-1.5 font-heading text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div className="relative rounded overflow-hidden border border-border" style={{ height: '44vh' }}>
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

              {plannedLatLngs.length > 1 && (<>
                <Polyline positions={plannedLatLngs} color={PLANNED_COLOR} weight={14} opacity={0.18} />
                <Polyline positions={plannedLatLngs} color={PLANNED_COLOR} weight={4} opacity={0.95} dashArray="10 6" />
              </>)}

              {tracksWithLatLngs.map(({ entry, color, positions }) =>
                positions.length > 1 ? (
                  <Polyline key={entry.id} positions={positions} color={color} weight={3} opacity={0.9} />
                ) : null
              )}

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
                        onEndpointDrag(i, 'end', lat, lng)
                      },
                      click: () => onCampClick(`camp-${s.n}`),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{s.name}</span>
                    </Tooltip>
                  </Marker>
                ) : null
              )}

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
                        onEndpointDrag(0, 'start', lat, lng)
                      },
                    }}
                  />
                ) : null}
                {(() => {
                  const lastSeg = segments[segments.length - 1]
                  const lastPos = lastSeg?.path?.length ? lastSeg.path[lastSeg.path.length - 1] : null
                  return lastPos ? (
                    <Marker
                      position={lastPos}
                      icon={makeEndIcon(18)}
                      draggable={!isDrawing && repositioning.size === 0}
                      eventHandlers={{
                        dragend(e) {
                          const { lat, lng } = (e.target as L.Marker).getLatLng()
                          onEndpointDrag(segments.length - 1, 'end', lat, lng)
                        },
                      }}
                    />
                  ) : null
                })()}
              </>)}

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
                      onPinDrag('start', lat, lng)
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
                      onPinDrag('end', lat, lng)
                    },
                  }}
                />
              )}

              <DrawInteractionLayer drawState={drawState} onMapClick={onMapClick} />
              <MapRefCapture mapRef={mapRef} />
              {bounds && <FitBounds positions={allPoints} />}
              <InvalidateSize />
            </MapContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2" style={{ background: 'var(--surface-2)' }}>
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
            <div className="flex items-center justify-between px-3 py-2 rounded border border-amber-border bg-amber-dim">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {startPlaced ? (
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--pine)' }}>
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-amber flex items-center justify-center shrink-0">
                      <span className="font-mono text-[7px] font-bold text-amber">1</span>
                    </span>
                  )}
                  <span className={`font-mono text-[9px] tracking-widest uppercase ${startPlaced ? 'text-pine' : 'text-amber font-bold'}`}>Start</span>
                </div>

                <span className="text-text-dim text-[9px]">→</span>

                <div className="flex items-center gap-1.5">
                  {endPlaced ? (
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--pine)' }}>
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  ) : (
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${startPlaced ? 'border-amber' : 'border-border'}`}>
                      <span className={`font-mono text-[7px] font-bold ${startPlaced ? 'text-amber' : 'text-text-dim'}`}>2</span>
                    </span>
                  )}
                  <span className={`font-mono text-[9px] tracking-widest uppercase ${endPlaced ? 'text-pine' : startPlaced ? 'text-amber font-bold' : 'text-text-dim'}`}>End</span>
                  {!endPlaced && startPlaced && (
                    <span className="font-mono text-[9px] text-text-dim">— click map</span>
                  )}
                  {!startPlaced && (
                    <span className="font-mono text-[9px] text-text-dim">— click map</span>
                  )}
                </div>
              </div>

              <button
                onClick={onCancelDraw}
                className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded border border-border text-text-dim bg-surface hover:text-text hover:border-border-mid transition-colors cursor-pointer ml-4 shrink-0"
              >
                <IconX size={9} />
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={startPlaced ? onResetStartPin : undefined}
                disabled={!startPlaced}
                title={startPlaced ? 'Click to reposition start' : undefined}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-left w-full transition-colors ${
                  startPlaced
                    ? 'border-pine-border bg-pine-dim hover:brightness-110 cursor-pointer'
                    : 'border-border bg-surface-2 opacity-40 cursor-default'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: startPlaced ? 'var(--pine)' : 'var(--border)' }} />
                <span className="font-mono text-[9px] tracking-widest uppercase text-text-dim shrink-0">Start</span>
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
                <span className="font-mono text-[9px] tracking-widest uppercase text-text-dim shrink-0">End</span>
                <span className={`font-mono text-[9px] truncate ${endPlaced ? 'text-amber' : 'text-text-dim italic'}`}>
                  {endPlaced ? formatCoord(drawState.end) : startPlaced ? 'click map to place' : 'waiting…'}
                </span>
              </div>
            </div>
          </div>
        )}

        {drawState.phase === 'active' && (
          <DrawConfirmTray
            drawState={drawState}
            setDrawState={setDrawState}
            onCancel={onCancelDraw}
            onConfirm={onConfirmSegment}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx"
          className="hidden"
          onChange={handleGpxUpload}
        />
      </div>
    )
  }
)