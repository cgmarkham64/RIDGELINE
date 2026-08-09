import { TrailheadRow } from './TrailheadRow'
import { SortableCampRow } from './SortableCampRow'
import { WaypointRow } from './WaypointRow'
import { WaterEntryRow } from './WaterEntryRow'
import type { MergedRow, SegRow } from './routeStage.types'

type RouteTableRowProps = {
  row: MergedRow
  isLast: boolean
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
  registerRowRef: (id: string, el: HTMLDivElement | null) => void
}

export function RouteTableRow({
  row, isLast, activeRowId, repositioning, canEdit, isDraggable, isDrawing, gridTemplate,
  waterLoading, waterSegColor, onFlyTo, onEnterDraw, onDeleteSegment, registerRowRef,
}: RouteTableRowProps) {
  if (row.kind === 'start') {
    return (
      <TrailheadRow
        row={row} isDraggable={isDraggable} isLast={isLast} isActive={activeRowId === 'trailhead'}
        gridTemplate={gridTemplate} waterLoading={waterLoading} onFlyTo={onFlyTo}
        rowRef={el => registerRowRef('trailhead', el)}
      />
    )
  }

  if (row.kind === 'camp') {
    return (
      <SortableCampRow
        row={row} isLast={isLast} activeRowId={activeRowId} repositioning={repositioning}
        canEdit={canEdit} isDraggable={isDraggable} isDrawing={isDrawing} gridTemplate={gridTemplate}
        onFlyTo={onFlyTo} onEnterDraw={onEnterDraw} onDeleteSegment={onDeleteSegment}
        rowRef={el => registerRowRef(`camp-${row.seg.n}`, el)}
      />
    )
  }

  if (row.kind === 'waypoint') {
    return (
      <WaypointRow
        row={row} isDraggable={isDraggable} isLast={isLast} isActive={activeRowId === row.wp.id}
        gridTemplate={gridTemplate} segColor={waterSegColor(row.distFromStartMi)} onFlyTo={onFlyTo}
        rowRef={el => registerRowRef(row.wp.id, el)}
      />
    )
  }

  return (
    <WaterEntryRow
      row={row} isDraggable={isDraggable} isLast={isLast} isActive={activeRowId === row.entry.id}
      gridTemplate={gridTemplate} segColor={waterSegColor(row.entry.distFromStartMi)} onFlyTo={onFlyTo}
      rowRef={el => registerRowRef(row.entry.id, el)}
    />
  )
}

