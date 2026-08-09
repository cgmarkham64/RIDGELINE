import { getStatusTransition } from './statusTransition'
import { StatusTransitionButtons } from './StatusTransitionButtons'

export function PlanOverviewHeader({ totalDone, totalAll, tripStatus, isOwner, onStatusChange, onBackClick }: {
  totalDone: number
  totalAll: number
  tripStatus?: string
  isOwner?: boolean
  onStatusChange?: (newStatus: string) => void
  onBackClick: () => void
}) {
  const { forward, canGoBack } = getStatusTransition(tripStatus, isOwner)

  return (
    <div className="px-8 py-6 border-b border-border bg-surface shrink-0">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Plan overview</span>
        <span className="w-1 h-1 rounded-full bg-text-dim" />
        <span className="font-mono text-label text-text-dim">auto-saved</span>
      </div>
      <div className="flex justify-between items-end gap-6">
        <div>
          <h1 className="font-heading text-h1 font-extrabold tracking-[-0.005em] text-text mb-1">
            The whole plan, at a glance.
          </h1>
          <p className="text-body text-text-mid max-w-[620px]">
            Every stage and where it stands. Jump straight into whichever one needs you — order doesn't matter.
          </p>
        </div>
        <div className="flex items-end gap-3 shrink-0">
          {isOwner && (forward || canGoBack) && (
            <div className="flex items-center gap-2">
              <StatusTransitionButtons
                forward={forward}
                canGoBack={canGoBack}
                isOwner={isOwner}
                onStatusChange={onStatusChange}
                onBackClick={onBackClick}
              />
            </div>
          )}
          <div className="text-right">
            <div className="font-mono text-h2 font-bold text-amber leading-none">
              {totalDone}<span className="text-text-dim text-body-lg">/{totalAll}</span>
            </div>
            <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mt-0.5">items locked</div>
          </div>
        </div>
      </div>
    </div>
  )
}
