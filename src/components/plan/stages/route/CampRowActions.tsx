import { IconPencil, IconTrash } from '../../../icons'
import type { SegRow } from './routeStage.types'

type CampRowActionsProps = {
  seg: SegRow
  canEdit: boolean
  isDrawing: boolean
  onEnterDraw: (seg?: SegRow) => void
  onDeleteSegment: (n: number) => void
}

export function CampRowActions({ seg, canEdit, isDrawing, onEnterDraw, onDeleteSegment }: CampRowActionsProps) {
  if (!canEdit) return <span />

  return (
    <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => { if (!isDrawing) onEnterDraw(seg) }}
        disabled={isDrawing}
        title="Edit segment"
        className="p-1 rounded text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <IconPencil size={15} />
      </button>
      <button
        onClick={() => { if (!isDrawing) onDeleteSegment(seg.n) }}
        disabled={isDrawing}
        title="Delete segment"
        className="p-1 rounded text-text-dim hover:text-red hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <IconTrash size={15} />
      </button>
    </div>
  )
}
