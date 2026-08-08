import type { Dispatch, SetStateAction } from 'react'
import type L from 'leaflet'
import type { SegRow, DrawState } from './routeStage.types'
import type { DetectedWaterSource } from '../../../../lib/waterSources'
import type { StageBodyProps } from '../../types'
import type { GpxTrackEntry } from '../../../../types'

export type MapData = {
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

export type DrawProps = {
  drawState: DrawState
  setDrawState: Dispatch<SetStateAction<DrawState>>
  onCancelDraw: () => void
  onConfirmSegment: () => void
  onMapClick: (lat: number, lng: number) => void
  onPinDrag: (which: 'start' | 'end', lat: number, lng: number) => void
  onEndpointDrag: (segIdx: number, which: 'start' | 'end', lat: number, lng: number) => void
  onResetStartPin: () => void
}

export type UploadProps = {
  canEdit: boolean
}

export type RouteMapCardProps = {
  mapData: MapData
  drawProps: DrawProps
  uploadProps: UploadProps
  onCampClick: (rowId: string) => void
  onSplitSegment: (segN: number, edgeIdx: number, splitPoint: [number, number]) => void
}

export type RouteMapCardHandle = {
  flyTo(lat: number, lon: number): void
  scrollToTop(): void
}

export type ZoneOverlayFlags = {
  showIpwOverlay: boolean
  showEnchantmentsOverlay: boolean
  showMbswOverlay: boolean
  zoneHighlightIds: string[]
}

export type DrawPhaseFlags = {
  isDrawing: boolean
  isPlacingPin: boolean
  startPlaced: boolean
  endPlaced: boolean
}
