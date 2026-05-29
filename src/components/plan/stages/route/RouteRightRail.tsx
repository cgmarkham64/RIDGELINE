import { ProgressBar } from '../../ProgressBar'
import { CheckItem } from '../../CheckItem'
import { ElevationProfile } from '../../../trip/ElevationProfile'
import { IconFile, IconDownload } from '../../../icons'
import { downloadGpx } from './routeStage.helpers'
import { PartnersCard } from './PartnersCard'
import type { CheckRow } from './routeStage.types'
import type { Trip } from '../../../../types'

type SourceFile = { name: string; meta: string; coords: [number, number, number][] }

export function RouteRightRail({
  trip,
  canEdit,
  checklist,
  doneCount,
  onToggleCheck,
  onInviteSent,
  onNoPartners,
  sourceFiles,
}: {
  trip: Trip | undefined
  canEdit: boolean
  checklist: CheckRow[]
  doneCount: number
  onToggleCheck: (i: number) => void
  onInviteSent: () => void
  onNoPartners: () => void
  sourceFiles: SourceFile[]
}) {
  return (
    <aside className="flex flex-col gap-3.5">

      {/* Stage checklist */}
      <div className="bg-surface border border-border rounded-lg p-3.5">
        <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
        {checklist.map((c, i) => (
          <CheckItem
            key={c.text}
            text={c.text}
            done={c.done}
            onToggle={canEdit && !c.readonly ? () => onToggleCheck(i) : undefined}
          />
        ))}
        <div className="h-px bg-border my-3" />
        <ProgressBar
          value={checklist.length > 0 ? (doneCount / checklist.length) * 100 : 0}
          tone={doneCount === checklist.length && checklist.length > 0 ? 'pine' : 'amber'}
        />
        <div className="font-mono text-label text-text-dim text-center mt-1.5">
          {doneCount} of {checklist.length}
        </div>
      </div>

      {/* Partners */}
      <PartnersCard
        trip={trip}
        canEdit={canEdit}
        onInviteSent={onInviteSent}
        onNoPartners={onNoPartners}
      />

      {/* Elevation profile */}
      {(trip?.gpxPlanned || (trip?.gpxTracks ?? []).length > 0) && (
        <div className="bg-surface border border-border rounded-lg p-4.5">
          <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-3">
            Elevation Profile
          </div>
          <ElevationProfile planned={trip?.gpxPlanned} gpxTracks={trip?.gpxTracks} />
        </div>
      )}

      {/* Source files */}
      <div className="bg-surface border border-border rounded-lg p-3.5">
        <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Source files</div>
        {sourceFiles.length === 0 ? (
          <p className="font-mono text-label text-text-dim leading-relaxed">
            No files yet — import a planned route .gpx above.
          </p>
        ) : sourceFiles.map((f, i) => (
          <div key={f.name} className={`flex items-center gap-2 py-1.5 ${i < sourceFiles.length - 1 ? 'border-b border-border' : ''}`}>
            <span className="text-text-mid shrink-0"><IconFile size={11} /></span>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-body-sm text-text truncate">{f.name}</div>
              <div className="font-mono text-caption text-text-dim mt-0.5">{f.meta}</div>
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
  )
}