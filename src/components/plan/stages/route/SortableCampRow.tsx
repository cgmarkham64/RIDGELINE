import { useSortable } from '@dnd-kit/sortable'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { CSS } from '@dnd-kit/utilities'
import { IconCheck, IconTent, IconGrip } from '../../../icons'
import { ACTIVE_BG, SEG_COLORS, fmtMi } from './routeStage.helpers'
import { CampRowTags } from './CampRowTags'
import { CampRowStats } from './CampRowStats'
import { CampRowActions } from './CampRowActions'
import { useUnitSystem } from '../../../../hooks/useUnitSystem'
import type { MergedRow, SegRow } from './routeStage.types'

const DRAG_Z_INDEX = 10

export type CampRowProps = {
  row: Extract<MergedRow, { kind: 'camp' }>
  isLast: boolean
  activeRowId: string | null
  repositioning: Set<number>
  canEdit: boolean
  isDraggable: boolean
  isDrawing: boolean
  gridTemplate: string
  onFlyTo: (lat: number | null, lon: number | null, rowId: string) => void
  onEnterDraw: (seg?: SegRow) => void
  onDeleteSegment: (n: number) => void
  rowRef: (el: HTMLDivElement | null) => void
}

function DragHandle({ attributes, listeners }: { attributes: DraggableAttributes; listeners: SyntheticListenerMap | undefined }) {
  return (
    <div
      {...attributes}
      {...listeners}
      className="flex items-center justify-center text-text-dim/40 hover:text-text-dim cursor-grab active:cursor-grabbing transition-colors"
      onClick={e => e.stopPropagation()}
      title="Drag to reorder"
    >
      <IconGrip size={12} />
    </div>
  )
}

function CampRowIcon({ isFinish }: { isFinish: boolean }) {
  return (
    <span className={isFinish ? 'text-red' : 'text-amber'}>
      {isFinish ? <IconCheck size={15} /> : <IconTent />}
    </span>
  )
}

type CampRowStyleArgs = {
  gridTemplate: string
  transform: string | undefined
  transition: string | undefined
  isDragging: boolean
  isActive: boolean
  segColor: string
}

function campRowStyle({ gridTemplate, transform, transition, isDragging, isActive, segColor }: CampRowStyleArgs) {
  return {
    gridTemplateColumns: gridTemplate,
    transform,
    transition,
    background: isDragging ? 'var(--surface-2)' : isActive ? ACTIVE_BG : undefined,
    boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.4)' : undefined,
    zIndex: isDragging ? DRAG_Z_INDEX : undefined,
    position: isDragging ? 'relative' as const : undefined,
    borderLeft: `3px solid ${segColor}`,
  }
}

export function SortableCampRow({
  row, isLast, activeRowId, repositioning, canEdit, isDraggable, isDrawing,
  gridTemplate, onFlyTo, onEnterDraw, onDeleteSegment, rowRef,
}: CampRowProps) {
  const sys = useUnitSystem()
  const rowId = `camp-${row.seg.n}`
  const campPos = row.seg.path?.[row.seg.path.length - 1] ?? null
  const border = isLast ? '' : 'border-b border-border'
  const segColor = SEG_COLORS[row.segIdx % SEG_COLORS.length]

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(row.seg.n),
    disabled: !isDraggable,
  })

  const style = campRowStyle({
    gridTemplate,
    transform: CSS.Transform.toString(transform),
    transition,
    isDragging,
    isActive: activeRowId === rowId,
    segColor,
  })

  return (
    <div
      ref={el => { setNodeRef(el); rowRef(el) }}
      className={`grid items-center px-4 py-2.5 gap-3 ${border} cursor-pointer transition-colors ${repositioning.has(row.segIdx) ? 'opacity-50' : ''}`}
      style={style}
      onClick={() => onFlyTo(campPos?.[0] ?? null, campPos?.[1] ?? null, rowId)}
    >
      {isDraggable && <DragHandle attributes={attributes} listeners={listeners} />}
      <CampRowIcon isFinish={row.isFinish} />
      <div className="min-w-0">
        <span className="text-body-sm font-semibold text-text truncate block">{row.seg.name}</span>
        <CampRowTags seg={row.seg} />
      </div>
      <span className="font-mono text-caption text-text">
        {repositioning.has(row.segIdx) ? '…' : fmtMi(row.distFromStartMi, sys)}
      </span>
      <CampRowStats row={row} sys={sys} />
      <CampRowActions seg={row.seg} canEdit={canEdit} isDrawing={isDrawing} onEnterDraw={onEnterDraw} onDeleteSegment={onDeleteSegment} />
    </div>
  )
}
