import { BearJailIllustration } from './BearJailIllustration'

export function PlanAccessError({ is403 }: { is403: boolean }) {
  return (
    <div className="flex h-full items-center justify-center w-full">
      <div className="text-center max-w-xs px-6">
        <BearJailIllustration />
        <div className="font-heading text-[17px] font-extrabold text-text mb-2">
          {is403 ? 'Looks like you got uninvited' : 'Something scared us off the trail'}
        </div>
        <p className="text-body text-text-mid leading-relaxed">
          {is403
            ? "You no longer have access to this trip. If you think this is a mistake, contact the trip owner — they'll know what to do."
            : "We hit an unexpected snag loading this trip. Try refreshing the page to get back on track."}
        </p>
      </div>
    </div>
  )
}
