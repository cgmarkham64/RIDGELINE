import { useRef, forwardRef, useImperativeHandle } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { JumpChip } from '../JumpChip'
import { MoonLoader } from '../../ui/MoonLoader'
import { WaypointIcon } from '../../map/WaypointIcon'
import { WAYPOINT_COLOR } from '../../map/constants'
import {
  IconPlus, IconCheck, IconTent, IconPencil, IconTrash,
  IconTriangleRight, IconSparkle, IconGrip,
} from '../../icons'
import { GRID, DRAG_GRID, ACTIVE_BG, EXP_LABEL, SEG_COLORS } from './routeStage.helpers'
import type { MergedRow, SegRow } from './routeStage.types'
import type { StageBodyProps } from '../types'

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

type CampRowProps = {
  row: Extract<MergedRow, { kind: 'camp' }>
  isLast: boolean
  activeRowId: string | null
  repositioning: Set<number>
  canEdit: boolean
  isDraggable: boolean
  isDrawing: boolean
  gridTemplate: string
  onFlyTo: RouteTableProps['onFlyTo']
  onEnterDraw: RouteTableProps['onEnterDraw']
  onDeleteSegment: RouteTableProps['onDeleteSegment']
  rowRef: (el: HTMLDivElement | null) => void
}

function SortableCampRow({
  row, isLast, activeRowId, repositioning, canEdit, isDraggable, isDrawing,
  gridTemplate, onFlyTo, onEnterDraw, onDeleteSegment, rowRef,
}: CampRowProps) {
  const rowId = `camp-${row.seg.n}`
  const campPos = row.seg.path?.[row.seg.path.length - 1] ?? null
  const border = isLast ? '' : 'border-b border-border'
  const segColor = SEG_COLORS[row.segIdx % SEG_COLORS.length]

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(row.seg.n),
    disabled: !isDraggable,
  })

  return (
    <div
      ref={el => { setNodeRef(el); rowRef(el) }}
      className={`grid items-center px-4 py-2.5 gap-3 ${border} cursor-pointer transition-colors ${repositioning.has(row.segIdx) ? 'opacity-50' : ''}`}
      style={{
        gridTemplateColumns: gridTemplate,
        transform: CSS.Transform.toString(transform),
        transition,
        background: isDragging ? 'var(--surface-2)' : activeRowId === rowId ? ACTIVE_BG : undefined,
        boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.4)' : undefined,
        zIndex: isDragging ? 10 : undefined,
        position: isDragging ? 'relative' : undefined,
        borderLeft: `3px solid ${segColor}`,
      }}
      onClick={() => onFlyTo(campPos?.[0] ?? null, campPos?.[1] ?? null, rowId)}
    >
      {isDraggable && (
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center text-text-dim/40 hover:text-text-dim cursor-grab active:cursor-grabbing transition-colors"
          onClick={e => e.stopPropagation()}
          title="Drag to reorder"
        >
          <IconGrip size={12} />
        </div>
      )}
      <span className={row.isFinish ? 'text-red' : 'text-amber'}>
        {row.isFinish ? <IconCheck size={15} /> : <IconTent />}
      </span>
      <div className="min-w-0">
        <span className="text-[12px] font-semibold text-text truncate block">{row.seg.name}</span>
        {(row.seg.water || row.seg.exposure || row.seg.hard) && (
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            {row.seg.water && (
              <span className="font-mono text-[9px] text-sky-400/80 uppercase tracking-[0.06em]">{row.seg.water}</span>
            )}
            {row.seg.exposure && (
              <span className={`font-mono text-[9px] font-semibold px-1 rounded border uppercase tracking-[0.06em] ${
                row.seg.exposure === 'low'     ? 'text-pine border-pine-border bg-pine-dim' :
                row.seg.exposure === 'med'     ? 'text-sky border-sky-border bg-sky-dim' :
                row.seg.exposure === 'high'    ? 'text-amber border-amber-border bg-amber-dim' :
                                            'text-red border-red-border bg-red-dim'
              }`}>{EXP_LABEL[row.seg.exposure]}</span>
            )}
            {row.seg.hard && (
              <span className="font-mono text-[9px] font-semibold px-1 rounded border uppercase tracking-[0.06em] text-amber border-amber-border bg-amber-dim">tough</span>
            )}
          </div>
        )}
      </div>
      <span className="font-mono text-[10px] text-text">
        {repositioning.has(row.segIdx) ? '…' : `${row.distFromStartMi.toFixed(1)} mi`}
      </span>
      {row.isFinish
        ? <span className="font-mono text-[10px] text-text-dim">—</span>
        : <span className="font-mono text-[10px] text-text-mid">
            {row.toNextCampMi !== null ? `${row.toNextCampMi.toFixed(1)} mi` : '—'}
          </span>
      }
      {row.isFinish
        ? <span className="font-mono text-[10px] text-text-dim">—</span>
        : row.toNextWaterMi !== null
          ? <span className="font-mono text-[10px]"
              style={{ color: row.dryLeg ? 'var(--amber)' : '#0ea5e9' }}
              title={row.dryLeg ? 'No water on this leg — nearest is further ahead' : undefined}
            >
              {row.toNextWaterMi.toFixed(1)} mi{row.dryLeg ? ' ↑' : ''}
            </span>
          : <span className="font-mono text-[10px] text-amber">None</span>
      }
      {canEdit
        ? <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { if (!isDrawing) onEnterDraw(row.seg) }}
              disabled={isDrawing}
              title="Edit segment"
              className="p-1 rounded text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <IconPencil size={15} />
            </button>
            <button
              onClick={() => { if (!isDrawing) onDeleteSegment(row.seg.n) }}
              disabled={isDrawing}
              title="Delete segment"
              className="p-1 rounded text-text-dim hover:text-red hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <IconTrash size={15} />
            </button>
          </div>
        : <span />
      }
    </div>
  )
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
  const campIds = segments.map(s => String(s.n))

  // Cumulative distances for mapping water entries to their enclosing segment color
  const campDists = segments.reduce<number[]>((acc, s) => {
    acc.push((acc[acc.length - 1] ?? 0) + s.mi)
    return acc
  }, [])
  function waterSegColor(distFromStartMi: number): string {
    const idx = campDists.findIndex(d => distFromStartMi < d)
    return SEG_COLORS[(idx === -1 ? campDists.length - 1 : idx) % SEG_COLORS.length]
  }

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 6 },
  }))

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    onReorderSegments(Number(active.id), Number(over.id))
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Route</span>
        {segments.length > 0 && (
          <span className="font-mono text-[9px] text-text-dim">
            {segments.length} seg{segments.length !== 1 ? 's' : ''} · auto-pulls into{' '}
            <JumpChip to="weather" onJump={onJump}>Weather</JumpChip>
          </span>
        )}
        {waterError && <span className="font-mono text-[9px] text-red" title={waterError}>· water error</span>}
        {canEdit && !isDrawing && (
          <button
            onClick={() => onEnterDraw()}
            className="ml-auto inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-widest uppercase px-2.5 py-1.5 rounded border border-border text-text bg-transparent hover:border-border-mid transition-colors cursor-pointer"
          >
            <IconPlus size={13} />
            Add segment
          </button>
        )}
        {isDrawing && <span className="ml-auto font-mono text-[9px] tracking-widest uppercase text-amber">Drawing…</span>}
      </div>

      {mergedRows.length > 0 && (
        <div
          className="grid items-center px-4 py-1.5 gap-3 border-b border-border"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {isDraggable && <span />}
          <span />
          <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">Name</span>
          <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">From TH</span>
          <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">Next camp</span>
          <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">Next water</span>
          {canEdit && <span />}
        </div>
      )}

      {mergedRows.length === 0 && !isDrawing && (
        <div className="px-4 py-8 text-center">
          <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1.5">No segments yet</p>
          <p className="text-[12px] text-text-mid">
            {canEdit
              ? 'Click "Add segment" above, then click two points on the map to define a leg.'
              : 'No segments have been added to this route.'}
          </p>
        </div>
      )}

      {waterLoading
        ? <MoonLoader label="Detecting water sources…" />
        : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={campIds} strategy={verticalListSortingStrategy}>
          {mergedRows.map((row, i) => {
            const isLast = i === mergedRows.length - 1
            const border = isLast ? '' : 'border-b border-border'

            if (row.kind === 'start') return (
              <div key="trailhead"
                ref={el => { if (el) rowRefs.current.set('trailhead', el); else rowRefs.current.delete('trailhead') }}
                className={`grid items-center px-4 py-2 gap-3 ${border} cursor-pointer transition-colors`}
                style={{ gridTemplateColumns: gridTemplate, borderLeft: '3px solid transparent', background: activeRowId === 'trailhead' ? ACTIVE_BG : 'var(--surface-2)' }}
                onClick={() => onFlyTo(row.lat, row.lon, 'trailhead')}
              >
                {isDraggable && <span />}
                <span className="text-pine"><IconTriangleRight size={15} /></span>
                <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim">Trailhead</span>
                <span className="font-mono text-[10px] text-text-dim">0.0 mi</span>
                <span className="font-mono text-[10px] text-text-mid">
                  {row.toNextCampMi !== null ? `${row.toNextCampMi.toFixed(1)} mi` : '—'}
                </span>
                {waterLoading && row.toNextWaterMi === null
                  ? <span className="font-mono text-[10px] text-text-dim">…</span>
                  : row.toNextWaterMi !== null
                    ? <span className="font-mono text-[10px]" style={{ color: '#0ea5e9' }}>{row.toNextWaterMi.toFixed(1)} mi</span>
                    : <span className="font-mono text-[10px] text-amber">None</span>
                }
                <span />
              </div>
            )

            if (row.kind === 'camp') return (
              <SortableCampRow
                key={`camp-${row.seg.n}`}
                row={row}
                isLast={isLast}
                activeRowId={activeRowId}
                repositioning={repositioning}
                canEdit={canEdit}
                isDraggable={isDraggable}
                isDrawing={isDrawing}
                gridTemplate={gridTemplate}
                onFlyTo={onFlyTo}
                onEnterDraw={onEnterDraw}
                onDeleteSegment={onDeleteSegment}
                rowRef={el => {
                  const id = `camp-${row.seg.n}`
                  if (el) rowRefs.current.set(id, el); else rowRefs.current.delete(id)
                }}
              />
            )

            return (
              <div key={row.entry.id}
                ref={el => { if (el) rowRefs.current.set(row.entry.id, el); else rowRefs.current.delete(row.entry.id) }}
                className={`grid items-center px-4 py-2.5 gap-3 ${border} cursor-pointer transition-colors`}
                style={{ gridTemplateColumns: gridTemplate, borderLeft: `3px solid ${waterSegColor(row.entry.distFromStartMi)}`, background: activeRowId === row.entry.id ? ACTIVE_BG : undefined }}
                onClick={() => onFlyTo(row.entry.lat, row.entry.lon, row.entry.id)}
              >
                {isDraggable && <span />}
                <span style={{ color: WAYPOINT_COLOR[row.entry.waypointType] }}>
                  <WaypointIcon type={row.entry.waypointType} size={15} />
                </span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[12px] font-semibold text-text truncate">{row.entry.label}</span>
                  {row.entry.isDetected && (
                    <span className="shrink-0 inline-flex items-center gap-0.5 font-mono text-[9px] tracking-[0.06em] uppercase px-1 py-0.5 rounded-sm border border-dashed border-border text-text-dim/60">
                      <IconSparkle />auto
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-text">{row.entry.distFromStartMi.toFixed(1)} mi</span>
                <span className="font-mono text-[10px] text-text-dim">—</span>
                {row.toNextWaterMi !== null
                  ? <span className="font-mono text-[10px] text-text-mid">{row.toNextWaterMi.toFixed(1)} mi</span>
                  : <span className="font-mono text-[10px] text-text-dim">—</span>
                }
                <span />
              </div>
            )
          })}
        </SortableContext>
      </DndContext>
      }
    </div>
  )
})