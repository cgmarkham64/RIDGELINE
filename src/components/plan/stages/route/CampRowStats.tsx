import { fmtMi } from './routeStage.helpers'
import type { UnitSystem } from '../../../../lib/units'
import type { MergedRow } from './routeStage.types'

type CampRow = Extract<MergedRow, { kind: 'camp' }>

function NextCampCell({ row, sys }: { row: CampRow; sys: UnitSystem }) {
  if (row.isFinish) return <span className="font-mono text-caption text-text-dim">—</span>
  return (
    <span className="font-mono text-caption text-text-mid">
      {row.toNextCampMi !== null ? fmtMi(row.toNextCampMi, sys) : '—'}
    </span>
  )
}

function NextWaterCell({ row, sys }: { row: CampRow; sys: UnitSystem }) {
  if (row.isFinish) return <span className="font-mono text-caption text-text-dim">—</span>
  if (row.toNextWaterMi === null) return <span className="font-mono text-caption text-amber">None</span>
  return (
    <span
      className="font-mono text-caption"
      style={{ color: row.dryLeg ? 'var(--amber)' : '#0ea5e9' }}
      title={row.dryLeg ? 'No water on this leg — nearest is further ahead' : undefined}
    >
      {fmtMi(row.toNextWaterMi, sys)}{row.dryLeg ? ' ↑' : ''}
    </span>
  )
}

export function CampRowStats({ row, sys }: { row: CampRow; sys: UnitSystem }) {
  return (
    <>
      <NextCampCell row={row} sys={sys} />
      <NextWaterCell row={row} sys={sys} />
    </>
  )
}
