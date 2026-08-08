import { IconCheck } from '../../../icons'
import { fmtTemp } from '../../../../lib/units'
import type { UnitSystem } from '../../../../lib/units'
import type { ClimateNormals } from './weatherStage.types'

type WeatherHistoricalCardProps = {
  startDate: string
  canEdit: boolean
  historicalReviewed: boolean
  onToggleReviewed: () => void
  climateLoading: boolean
  climateError: boolean
  climate: ClimateNormals | undefined
  sys: UnitSystem
}

function ReviewedButton({ reviewed, onToggle }: { reviewed: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-label rounded border cursor-pointer transition-colors ${reviewed ? 'bg-pine-dim border-pine-border text-pine' : 'bg-surface-2 border-border text-text-dim hover:border-border-mid'}`}>
      {reviewed && <IconCheck size={9} />} Reviewed
    </button>
  )
}

function ClimateStats({ climate, sys }: { climate: ClimateNormals; sys: UnitSystem }) {
  const stats = [
    { v: fmtTemp(climate.avgHighF, sys), l: 'avg high' },
    { v: fmtTemp(climate.avgLowF, sys),  l: 'avg low' },
    { v: `${climate.precipPct}%`,        l: 'precip days' },
    { v: climate.snowLikely ? 'likely' : 'rare', l: 'snow' },
  ]
  return (
    <div className="grid grid-cols-4 gap-px bg-border rounded overflow-hidden">
      {stats.map(s => (
        <div key={s.l} className="bg-surface px-3 py-2">
          <div className="font-heading text-body-lg font-extrabold text-amber leading-none">{s.v}</div>
          <div className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mt-1">{s.l}</div>
        </div>
      ))}
    </div>
  )
}

export function WeatherHistoricalCard({
  startDate, canEdit, historicalReviewed, onToggleReviewed, climateLoading, climateError, climate, sys,
}: WeatherHistoricalCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">
          Typical {new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long' })} · 3-yr avg
        </div>
        {canEdit && <ReviewedButton reviewed={historicalReviewed} onToggle={onToggleReviewed} />}
      </div>
      {climateLoading && <div className="font-mono text-fine text-text-dim py-4 text-center">Fetching climate data…</div>}
      {climateError   && <div className="font-mono text-fine text-red py-4 text-center">Failed to load climate data.</div>}
      {climate && <ClimateStats climate={climate} sys={sys} />}
    </div>
  )
}
