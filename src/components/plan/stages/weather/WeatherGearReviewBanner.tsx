import { IconAlertTriangle } from '../../../icons'
import type { RiskStyle } from './weatherStage.types'

const ICON_SIZE = 12

type WeatherGearReviewBannerProps = {
  riskStyle: RiskStyle
  onJump?: (stage: string) => void
}

export function WeatherGearReviewBanner({ riskStyle, onJump }: WeatherGearReviewBannerProps) {
  return (
    <div className={`border rounded-lg p-3.5 ${riskStyle.border} ${riskStyle.bg}`}>
      <div className={`flex items-center gap-2 mb-2 ${riskStyle.text}`}>
        <IconAlertTriangle size={ICON_SIZE} className={riskStyle.text} />
        <span className="font-mono text-label tracking-[0.16em] uppercase">Loadout review needed</span>
      </div>
      <p className="text-fine text-text-mid leading-relaxed mb-2.5">
        Conditions flagged for your trip window. Check your gear is ready for these conditions.
      </p>
      {onJump && (
        <button type="button" onClick={() => onJump('gear')}
          className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 font-mono text-label rounded border cursor-pointer transition-colors ${riskStyle.border} ${riskStyle.text} bg-transparent hover:opacity-80`}>
          Review gear →
        </button>
      )}
    </div>
  )
}
