import { IconSun } from '../../../icons'
import { fmtSolarTime } from './weatherStage.helpers'
import type { SunTimes } from './weatherStage.types'

const SUN_ICON_SIZE = 12
const DAYLIGHT_DECIMALS = 1

export function WeatherForecastSunTimes({ sun, lng }: { sun: SunTimes; lng: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border">
      <IconSun size={SUN_ICON_SIZE} />
      <div className="flex items-center gap-4">
        <span className="font-mono text-label text-text-dim">↑ {fmtSolarTime(sun.sunrise, lng)}</span>
        <span className="font-mono text-label text-text-dim">↓ {fmtSolarTime(sun.sunset, lng)}</span>
        <span className="font-mono text-label text-text-dim">{sun.daylightHours.toFixed(DAYLIGHT_DECIMALS)} hrs daylight</span>
      </div>
    </div>
  )
}
