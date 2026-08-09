import type { GpxTrack, GpxTrackEntry, Waypoint } from '../../types'
import { useUnitSystem } from '../../hooks/useUnitSystem'
import { resolveSource, buildElevationChartGeometry } from './elevationProfile.geometry'
import { useResponsiveSvgWidth } from './useResponsiveSvgWidth'
import { ElevationChartSvg } from './ElevationChartSvg'
import { ElevationStatsGrid, monoCls } from './ElevationStatsGrid'

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
  const sys = useUnitSystem()
  const { svgRef, containerW } = useResponsiveSvgWidth()

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

  const geometry = buildElevationChartGeometry(source, containerW, waypoints)

  return (
    <div className="flex flex-col gap-2.5">
      <ElevationChartSvg
        svgRef={svgRef}
        containerW={containerW}
        geometry={geometry}
        sys={sys}
        activeWaypointId={activeWaypointId}
        onWaypointClick={onWaypointClick}
      />
      <ElevationStatsGrid stats={geometry.stats} sys={sys} />
      <p className="font-mono text-label text-text-dim leading-relaxed opacity-60">
        Elevation estimated from 90m terrain data — gain/loss is approximate and intended to give a general sense of the terrain profile.
      </p>
    </div>
  )
}
