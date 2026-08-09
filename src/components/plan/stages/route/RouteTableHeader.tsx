import { JumpChip } from '../../JumpChip'
import { IconPlus } from '../../../icons'
import type { StageBodyProps } from '../../types'

type RouteTableHeaderProps = {
  segmentCount: number
  waterError: string | null
  canEdit: boolean
  isDrawing: boolean
  onJump: StageBodyProps['onJump']
  onEnterDraw: () => void
}

export function RouteTableHeader({ segmentCount, waterError, canEdit, isDrawing, onJump, onEnterDraw }: RouteTableHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
      <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Route</span>
      {segmentCount > 0 && (
        <span className="font-mono text-label text-text-dim">
          {segmentCount} seg{segmentCount !== 1 ? 's' : ''} · auto-pulls into{' '}
          <JumpChip to="weather" onJump={onJump}>Weather</JumpChip>
        </span>
      )}
      {waterError && <span className="font-mono text-label text-red" title={waterError}>· water error</span>}
      {canEdit && !isDrawing && (
        <button
          onClick={onEnterDraw}
          className="ml-auto inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-widest uppercase px-2.5 py-1.5 rounded border border-border text-text bg-transparent hover:border-border-mid transition-colors cursor-pointer"
        >
          <IconPlus size={13} />
          Add segment
        </button>
      )}
      {isDrawing && <span className="ml-auto font-mono text-label tracking-widest uppercase text-amber">Drawing…</span>}
    </div>
  )
}
