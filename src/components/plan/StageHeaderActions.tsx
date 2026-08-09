import { IconArrowLeft, IconArrowRight } from '../icons'
import { STAGES } from './constants'
import { getStatusTransition } from './statusTransition'
import { StatusTransitionButtons } from './StatusTransitionButtons'

export function StageHeaderActions({ stageIdx, tripStatus, isOwner, onStatusChange, onPrev, onNext, onBackClick }: {
  stageIdx: number
  tripStatus?: string
  isOwner?: boolean
  onStatusChange?: (newStatus: string) => void
  onPrev: () => void
  onNext: () => void
  onBackClick: () => void
}) {
  const { forward, canGoBack } = getStatusTransition(tripStatus, isOwner)

  return (
    <div className="flex items-center gap-2 shrink-0">
      <StatusTransitionButtons
        forward={forward}
        canGoBack={canGoBack}
        isOwner={isOwner}
        onStatusChange={onStatusChange}
        onBackClick={onBackClick}
      />
      <button
        onClick={onPrev}
        disabled={stageIdx === 0}
        className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-widest uppercase px-2.5 py-1.5 rounded border border-border text-text cursor-pointer bg-transparent hover:border-border-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <IconArrowLeft size={10} />
      </button>
      <span className="font-mono text-label text-text-dim px-1.5">{stageIdx + 1} / {STAGES.length}</span>
      <button
        onClick={onNext}
        disabled={stageIdx === STAGES.length - 1}
        className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-widest uppercase px-2.5 py-1.5 rounded border border-border text-text cursor-pointer bg-transparent hover:border-border-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <IconArrowRight size={10} />
      </button>
    </div>
  )
}
