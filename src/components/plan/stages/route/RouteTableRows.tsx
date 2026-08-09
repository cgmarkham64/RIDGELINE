import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { RouteTableRow } from './RouteTableRow'
import type { MergedRow, SegRow } from './routeStage.types'

function rowKey(row: MergedRow): string {
  if (row.kind === 'start') return 'trailhead'
  if (row.kind === 'camp') return `camp-${row.seg.n}`
  if (row.kind === 'waypoint') return row.wp.id
  return row.entry.id
}

type RouteTableRowsProps = {
  mergedRows: MergedRow[]
  campIds: string[]
  activeRowId: string | null
  repositioning: Set<number>
  canEdit: boolean
  isDraggable: boolean
  isDrawing: boolean
  gridTemplate: string
  waterLoading: boolean
  waterSegColor: (distFromStartMi: number) => string
  onFlyTo: (lat: number | null, lon: number | null, rowId: string) => void
  onEnterDraw: (seg?: SegRow) => void
  onDeleteSegment: (n: number) => void
  onReorderSegments: (fromN: number, toN: number) => void
  registerRowRef: (id: string, el: HTMLDivElement | null) => void
}

export function RouteTableRows({
  mergedRows, campIds, activeRowId, repositioning, canEdit, isDraggable, isDrawing, gridTemplate,
  waterLoading, waterSegColor, onFlyTo, onEnterDraw, onDeleteSegment, onReorderSegments, registerRowRef,
}: RouteTableRowsProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    onReorderSegments(Number(active.id), Number(over.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={campIds} strategy={verticalListSortingStrategy}>
        {mergedRows.map((row, i) => (
          <RouteTableRow
            key={rowKey(row)}
            row={row}
            isLast={i === mergedRows.length - 1}
            activeRowId={activeRowId}
            repositioning={repositioning}
            canEdit={canEdit}
            isDraggable={isDraggable}
            isDrawing={isDrawing}
            gridTemplate={gridTemplate}
            waterLoading={waterLoading}
            waterSegColor={waterSegColor}
            onFlyTo={onFlyTo}
            onEnterDraw={onEnterDraw}
            onDeleteSegment={onDeleteSegment}
            registerRowRef={registerRowRef}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
