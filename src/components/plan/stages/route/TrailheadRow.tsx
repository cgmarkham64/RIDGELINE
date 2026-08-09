import { IconTriangleRight } from '../../../icons'
import { ACTIVE_BG, fmtMi } from './routeStage.helpers'
import { useUnitSystem } from '../../../../hooks/useUnitSystem'
import type { MergedRow } from './routeStage.types'

type TrailheadRowProps = {
  row: Extract<MergedRow, { kind: 'start' }>
  isDraggable: boolean
  isLast: boolean
  isActive: boolean
  gridTemplate: string
  waterLoading: boolean
  onFlyTo: (lat: number | null, lon: number | null, rowId: string) => void
  rowRef: (el: HTMLDivElement | null) => void
}

function NextWaterCell({ toNextWaterMi, waterLoading, sys }: { toNextWaterMi: number | null; waterLoading: boolean; sys: ReturnType<typeof useUnitSystem> }) {
  if (waterLoading && toNextWaterMi === null) return <span className="font-mono text-caption text-text-dim">…</span>
  if (toNextWaterMi === null) return <span className="font-mono text-caption text-amber">None</span>
  return <span className="font-mono text-caption" style={{ color: '#0ea5e9' }}>{fmtMi(toNextWaterMi, sys)}</span>
}

export function TrailheadRow({ row, isDraggable, isLast, isActive, gridTemplate, waterLoading, onFlyTo, rowRef }: TrailheadRowProps) {
  const sys = useUnitSystem()
  const border = isLast ? '' : 'border-b border-border'

  return (
    <div
      ref={rowRef}
      className={`grid items-center px-4 py-2 gap-3 ${border} cursor-pointer transition-colors`}
      style={{ gridTemplateColumns: gridTemplate, borderLeft: '3px solid transparent', background: isActive ? ACTIVE_BG : 'var(--surface-2)' }}
      onClick={() => onFlyTo(row.lat, row.lon, 'trailhead')}
    >
      {isDraggable && <span />}
      <span className="text-pine"><IconTriangleRight size={15} /></span>
      <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Trailhead</span>
      <span className="font-mono text-caption text-text-dim">{fmtMi(0, sys)}</span>
      <span className="font-mono text-caption text-text-mid">
        {row.toNextCampMi !== null ? fmtMi(row.toNextCampMi, sys) : '—'}
      </span>
      <NextWaterCell toNextWaterMi={row.toNextWaterMi} waterLoading={waterLoading} sys={sys} />
      <span />
    </div>
  )
}
