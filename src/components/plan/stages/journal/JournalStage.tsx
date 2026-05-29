import { IconLock } from '../../../icons'
import { JournalSection } from '../../../journal/JournalSection'
import type { StageBodyProps } from '../../types'

export function JournalStage({ tripStatus, trip, canEdit }: StageBodyProps) {
  const isLocked = !tripStatus || tripStatus === 'planning' || tripStatus === 'ready'

  if (isLocked) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-[420px] text-center">
          <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4 text-text-dim">
            <IconLock />
          </div>
          <h2 className="font-heading text-h2 font-extrabold text-text mb-2">
            Trip hasn't started yet.
          </h2>
          <p className="text-body text-text-mid leading-relaxed">
            The Journal unlocks when your trip moves to{' '}
            <span className="text-pine font-semibold">On Trail</span>.
            Keep planning — it'll be here when you're out there.
          </p>
        </div>
      </div>
    )
  }

  if (!trip) return null

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 max-w-3xl">
        <JournalSection trip={trip} readOnly={!canEdit} />
      </div>
    </div>
  )
}