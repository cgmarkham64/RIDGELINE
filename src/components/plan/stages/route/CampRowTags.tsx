import { EXP_LABEL } from './routeStage.helpers'
import type { SegRow } from './routeStage.types'

const EXPOSURE_CLS: Record<NonNullable<SegRow['exposure']>, string> = {
  low: 'text-pine border-pine-border bg-pine-dim',
  med: 'text-sky border-sky-border bg-sky-dim',
  high: 'text-amber border-amber-border bg-amber-dim',
  extreme: 'text-red border-red-border bg-red-dim',
}

export function CampRowTags({ seg }: { seg: SegRow }) {
  if (!seg.water && !seg.exposure && !seg.hard) return null

  return (
    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
      {seg.water && (
        <span className="font-mono text-label text-sky-400/80 uppercase tracking-[0.06em]">{seg.water}</span>
      )}
      {seg.exposure && (
        <span className={`font-mono text-label font-semibold px-1 rounded border uppercase tracking-[0.06em] ${EXPOSURE_CLS[seg.exposure]}`}>
          {EXP_LABEL[seg.exposure]}
        </span>
      )}
      {seg.hard && (
        <span className="font-mono text-label font-semibold px-1 rounded border uppercase tracking-[0.06em] text-amber border-amber-border bg-amber-dim">tough</span>
      )}
    </div>
  )
}
