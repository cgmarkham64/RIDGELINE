import { IconLock } from '../../icons'
import type { StageBodyProps } from '../types'

export function JournalStage({ tripStatus }: StageBodyProps) {
  const isLocked = !tripStatus || tripStatus === 'planning' || tripStatus === 'ready'

  if (isLocked) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-[420px] text-center">
          <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4 text-text-dim">
            <IconLock />
          </div>
          <h2 className="font-heading text-[22px] font-extrabold text-text mb-2">
            Trip hasn't started yet.
          </h2>
          <p className="text-[13px] text-text-mid leading-relaxed">
            The Journal unlocks when your trip moves to{' '}
            <span className="text-pine font-semibold">On Trail</span>.
            Keep planning — it'll be here when you're out there.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-[420px] text-center">
        <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Stage 7 · Journal</div>
        <h2 className="font-heading text-[22px] font-extrabold text-text mb-2">Ready to journal.</h2>
        <p className="text-[13px] text-text-mid leading-relaxed">
          Day-by-day entries, conditions, photos, wildlife, and companions will live here.
        </p>
      </div>
    </div>
  )
}