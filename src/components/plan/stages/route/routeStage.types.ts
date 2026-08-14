import type { DetectedWaterSource } from '../../../../lib/waterSources'
import type { Waypoint } from '../../../../types'

export type SegRow = {
  n: number
  name: string
  mi: number
  gain: number
  notes: string
  path?: [number, number][]
  water?: 'reliable' | 'caches' | 'dry'
  exposure?: 'low' | 'med' | 'high' | 'extreme'
  hard?: boolean
  wakeTime?: string
  onTrailTime?: string
  campByTime?: string
}

export type CheckRow = { text: string; done: boolean; readonly?: boolean }

export type RoutePreview = {
  path: [number, number][]
  mi: number
  gain: number
  sparkElevs: number[]
}

export type DrawState =
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
      water?: 'reliable' | 'caches' | 'dry'
      exposure?: 'low' | 'med' | 'high' | 'extreme'
      hard?: boolean
      wakeTime?: string
      onTrailTime?: string
      campByTime?: string
      sunTimesLoading?: boolean
      editingSeg?: SegRow
    }

export type WaterEntry = {
  id: string
  label: string
  waypointType: DetectedWaterSource['waypointType']
  distFromStartMi: number
  snapDistM?: number
  isDetected: boolean
  lat: number
  lon: number
  passIndex: number  // 1-based — which time the route passes this point
  passCount: number  // total passes; >1 means the route revisits this point (e.g. return leg)
}

export type ReconnectUpdate = { si: number; start: [number, number]; end: [number, number] }

export type MergedRow =
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
  | { kind: 'waypoint'; wp: Waypoint; distFromStartMi: number }