import { useRef, forwardRef, useImperativeHandle } from 'react'
import { MoonLoader } from '../../../ui/MoonLoader'
import { GRID, DRAG_GRID, SEG_COLORS } from './routeStage.helpers'
import { RouteTableHeader } from './RouteTableHeader'
import { RouteTableColumnHeader } from './RouteTableColumnHeader'
import { RouteTableEmptyState } from './RouteTableEmptyState'
import { RouteTableRows } from './RouteTableRows'
import type { MergedRow, SegRow } from './routeStage.types'
import type { StageBodyProps } from '../../types'

export type RouteTableHandle = {
  scrollToRow(id: string): void
}

type RouteTableProps = {
  mergedRows: MergedRow[]
  activeRowId: string | null
  segments: SegRow[]
  repositioning: Set<number>
  waterLoading: boolean
  waterError: string | null
  canEdit: boolean
  isDrawing: boolean
  onJump: StageBodyProps['onJump']
  onFlyTo: (lat: number | null, lon: number | null, rowId: string) => void
  onEnterDraw: (seg?: SegRow) => void
  onDeleteSegment: (n: number) => void
  onReorderSegments: (fromN: number, toN: number) => void
}

function buildWaterSegColor(segments: SegRow[]) {
  const campDists = segments.reduce<number[]>((acc, s) => {
    acc.push((acc[acc.length - 1] ?? 0) + s.mi)
    return acc
  }, [])
  return function waterSegColor(distFromStartMi: number): string {
    const idx = campDists.findIndex(d => distFromStartMi < d)
    return SEG_COLORS[(idx === -1 ? campDists.length - 1 : idx) % SEG_COLORS.length]
  }
}

export const RouteTable = forwardRef<RouteTableHandle, RouteTableProps>(function RouteTable(
  {
    mergedRows, activeRowId, segments, repositioning, waterLoading, waterError,
    canEdit, isDrawing, onJump, onFlyTo, onEnterDraw, onDeleteSegment, onReorderSegments,
  },
  ref,
) {
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useImperativeHandle(ref, () => ({
    scrollToRow(id: string) {
      rowRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    },
  }))

  const isDraggable = canEdit && !isDrawing && segments.length > 1
  const gridTemplate = isDraggable ? DRAG_GRID : GRID

  function registerRowRef(id: string, el: HTMLDivElement | null) {
    if (el) rowRefs.current.set(id, el)
    else rowRefs.current.delete(id)
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <RouteTableHeader
        segmentCount={segments.length} waterError={waterError} canEdit={canEdit} isDrawing={isDrawing}
        onJump={onJump} onEnterDraw={() => onEnterDraw()}
      />

      {mergedRows.length > 0 && (
        <RouteTableColumnHeader gridTemplate={gridTemplate} isDraggable={isDraggable} canEdit={canEdit} />
      )}

      {mergedRows.length === 0 && !isDrawing && <RouteTableEmptyState canEdit={canEdit} />}

      {waterLoading ? <MoonLoader label="Detecting water sources…" /> : (
        <RouteTableRows
          mergedRows={mergedRows} campIds={segments.map(s => String(s.n))} activeRowId={activeRowId}
          repositioning={repositioning} canEdit={canEdit} isDraggable={isDraggable} isDrawing={isDrawing}
          gridTemplate={gridTemplate} waterLoading={waterLoading} waterSegColor={buildWaterSegColor(segments)}
          onFlyTo={onFlyTo} onEnterDraw={onEnterDraw} onDeleteSegment={onDeleteSegment}
          onReorderSegments={onReorderSegments} registerRowRef={registerRowRef}
        />
      )}
    </div>
  )
})
