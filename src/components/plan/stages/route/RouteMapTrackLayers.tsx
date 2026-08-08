import { Polyline } from 'react-leaflet'
import { PLANNED_COLOR } from '../../../map/constants'
import { SEG_COLORS } from './routeStage.helpers'
import type { SegRow } from './routeStage.types'
import type { GpxTrackEntry } from '../../../../types'

const PLANNED_GLOW_WEIGHT = 14
const PLANNED_GLOW_OPACITY = 0.18
const PLANNED_LINE_WEIGHT = 4
const PLANNED_LINE_OPACITY = 0.95
const PLANNED_DASH = '10 6'
const TRACK_WEIGHT = 3
const TRACK_OPACITY = 0.9
const SEGMENT_WEIGHT = 4
const SEGMENT_OPACITY = 1

type RouteMapTrackLayersProps = {
  plannedLatLngs: [number, number][]
  tracksWithLatLngs: { entry: GpxTrackEntry; positions: [number, number][]; color: string }[]
  segments: SegRow[]
}

export function RouteMapTrackLayers({ plannedLatLngs, tracksWithLatLngs, segments }: RouteMapTrackLayersProps) {
  return (
    <>
      {plannedLatLngs.length > 1 && (<>
        <Polyline positions={plannedLatLngs} color={PLANNED_COLOR} weight={PLANNED_GLOW_WEIGHT} opacity={PLANNED_GLOW_OPACITY} />
        <Polyline positions={plannedLatLngs} color={PLANNED_COLOR} weight={PLANNED_LINE_WEIGHT} opacity={PLANNED_LINE_OPACITY} dashArray={PLANNED_DASH} />
      </>)}

      {tracksWithLatLngs.map(({ entry, color, positions }) =>
        positions.length > 1 ? (
          <Polyline key={entry.id} positions={positions} color={color} weight={TRACK_WEIGHT} opacity={TRACK_OPACITY} />
        ) : null
      )}

      {segments.map((s, i) =>
        s.path && s.path.length > 1 ? (
          <Polyline
            key={`seg-${s.n}`}
            positions={s.path}
            color={SEG_COLORS[i % SEG_COLORS.length]}
            weight={SEGMENT_WEIGHT}
            opacity={SEGMENT_OPACITY}
          />
        ) : null
      )}
    </>
  )
}
