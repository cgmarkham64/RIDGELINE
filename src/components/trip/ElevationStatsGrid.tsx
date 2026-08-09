import { ftToM, milesToKm } from '../../lib/units'
import type { UnitSystem } from '../../lib/units'

export const monoCls = 'font-mono text-label tracking-widest uppercase text-text-dim text-center'

export function ElevationStatsGrid({ stats, sys }: {
  stats: { gain: number; loss: number; maxEle: number; totalDist: number }
  sys: UnitSystem
}) {
  const { gain, loss, maxEle, totalDist } = stats

  return (
    <div className="grid grid-cols-4 gap-1">
      {[
        { key: 'Gain', value: sys === 'metric' ? `+${Math.round(ftToM(gain)).toLocaleString()} m` : `+${gain.toLocaleString()} ft` },
        { key: 'Loss', value: sys === 'metric' ? `-${Math.round(ftToM(loss)).toLocaleString()} m` : `-${loss.toLocaleString()} ft` },
        { key: 'Max',  value: sys === 'metric' ? `${Math.round(ftToM(maxEle)).toLocaleString()} m` : `${Math.round(maxEle).toLocaleString()} ft` },
        { key: 'Dist', value: sys === 'metric' ? `${milesToKm(totalDist).toFixed(1)} km` : `${totalDist.toFixed(1)} mi` },
      ].map(({ key, value }) => (
        <div key={key} className="bg-surface-2 rounded-sm px-1 py-1.25">
          <span className={monoCls}>{key}</span>
          <span className="font-mono text-fine tracking-[0.04em] text-amber block mt-0.5">{value}</span>
        </div>
      ))}
    </div>
  )
}
