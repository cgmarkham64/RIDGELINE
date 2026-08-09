import { ElevationProfile } from '../../../trip/ElevationProfile'
import { RouteChecklistPanel } from './RouteChecklistPanel'
import { RouteSourceFilesPanel } from './RouteSourceFilesPanel'
import type { CheckRow } from './routeStage.types'
import type { Trip } from '../../../../types'

type SourceFile = { name: string; meta: string; coords: [number, number, number][] }

type RouteRightRailProps = {
  trip: Trip | undefined
  canEdit: boolean
  checklist: CheckRow[]
  doneCount: number
  onToggleCheck: (i: number) => void
  sourceFiles: SourceFile[]
}

export function RouteRightRail({ trip, canEdit, checklist, doneCount, onToggleCheck, sourceFiles }: RouteRightRailProps) {
  const hasGpx = !!trip?.gpxPlanned || (trip?.gpxTracks ?? []).length > 0

  return (
    <aside className="flex flex-col gap-3.5">
      <RouteChecklistPanel checklist={checklist} doneCount={doneCount} canEdit={canEdit} onToggleCheck={onToggleCheck} />

      {hasGpx && (
        <div className="bg-surface border border-border rounded-lg p-4.5">
          <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-3">Elevation Profile</div>
          <ElevationProfile planned={trip?.gpxPlanned} gpxTracks={trip?.gpxTracks} />
        </div>
      )}

      <RouteSourceFilesPanel sourceFiles={sourceFiles} />
    </aside>
  )
}
