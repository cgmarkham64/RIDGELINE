import { milesToKm, ftToM } from '../../../../lib/units'
import type { UnitSystem } from '../../../../lib/units'
import type { DrawState } from './routeStage.types'

type ActiveDrawState = Extract<DrawState, { phase: 'active' }>

type DrawConfirmSummaryProps = {
  drawState: ActiveDrawState
  sys: UnitSystem
  suggestedHard: boolean
}

function ResultSummary({ drawState, sys, suggestedHard }: DrawConfirmSummaryProps & { drawState: ActiveDrawState & { result: NonNullable<ActiveDrawState['result']> } }) {
  const { result } = drawState
  return (
    <>
      <span className="font-mono text-fine font-bold text-amber">
        {sys === 'metric' ? `${milesToKm(result.mi).toFixed(1)} km` : `${result.mi.toFixed(1)} mi`}
      </span>
      <span className="font-mono text-caption text-text-mid">
        +{sys === 'metric' ? Math.round(ftToM(result.gain)).toLocaleString() + ' m' : result.gain.toLocaleString() + ' ft'} gain
      </span>
      {result.sparkElevs.length > 1 && (
        <span className="font-mono text-label text-text-dim">(drag pins to recalculate)</span>
      )}
      {!drawState.showMore && drawState.hard && (
        <span className="ml-auto font-mono text-label font-semibold px-1.5 py-0.5 rounded border uppercase tracking-[0.08em] text-amber border-amber-border bg-amber-dim">
          tough
        </span>
      )}
      {!drawState.showMore && !drawState.hard && suggestedHard && (
        <span className="ml-auto font-mono text-label text-text-dim italic">suggested: tough day</span>
      )}
    </>
  )
}

export function DrawConfirmSummary({ drawState, sys, suggestedHard }: DrawConfirmSummaryProps) {
  if (drawState.loading) {
    return <span className="font-mono text-label text-text-dim tracking-widest">Calculating…</span>
  }
  if (drawState.result) {
    return <ResultSummary drawState={{ ...drawState, result: drawState.result }} sys={sys} suggestedHard={suggestedHard} />
  }
  if (drawState.error) {
    return <span className="font-mono text-label text-text-dim">{drawState.error}</span>
  }
  return null
}
