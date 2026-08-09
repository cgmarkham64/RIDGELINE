import { fmtElevGain, fmtDist } from '../../lib/units'
import { useUnitSystem } from '../../hooks/useUnitSystem'

export function StageRailSnapshot({
  trip,
}: {
  trip: { miles: number | null; elevGainFt: number | null; days: number; weight: string }
}) {
  const sys = useUnitSystem()

  return (
    <div className="px-[18px] py-3 border-t border-border shrink-0">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2">Snapshot</div>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { value: trip.miles != null ? fmtDist(trip.miles, sys) : '—', label: 'dist' },
          { value: trip.elevGainFt != null ? fmtElevGain(trip.elevGainFt, sys) : '—', label: 'gain' },
          { value: trip.days || '—',  label: 'days' },
          { value: trip.weight,       label: 'base' },
        ].map(({ value, label }) => (
          <div key={label} className="bg-surface border border-border rounded p-2.5 text-center">
            <div className="font-heading text-[17px] font-extrabold text-amber leading-none mb-1">{value}</div>
            <div className="font-mono text-label tracking-[0.14em] uppercase text-text-dim">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
