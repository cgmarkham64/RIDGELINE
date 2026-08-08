import { IconCalendar } from '../../../icons'
import { DAY_MS } from './weatherStage.helpers'

const CALENDAR_ICON_SIZE = 15
const COORD_DECIMALS = 2

function fmtDateLong(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type WeatherLocationBannerProps = {
  location: string
  startDate: string
  endDate: string
  coordsLat: number | undefined
  coordsLng: number | undefined
  geoLoading: boolean
  geoError: boolean
}

export function WeatherLocationBanner({ location, startDate, endDate, coordsLat, coordsLng, geoLoading, geoError }: WeatherLocationBannerProps) {
  const tripDays = Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / DAY_MS) + 1

  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3">
      <IconCalendar size={CALENDAR_ICON_SIZE} />
      <div className="flex-1 min-w-0">
        <div className="text-body font-semibold text-text truncate">{location || '—'}</div>
        <div className="font-mono text-label text-text-dim mt-0.5">
          {fmtDateLong(startDate)}
          {' – '}
          {fmtDateLong(endDate)}
          {` · ${tripDays} days`}
          {coordsLat != null ? ` · ${coordsLat.toFixed(COORD_DECIMALS)}°, ${coordsLng!.toFixed(COORD_DECIMALS)}°` : ''}
        </div>
      </div>
      {geoLoading && <span className="font-mono text-label text-text-dim shrink-0">geocoding…</span>}
      {geoError   && <span className="font-mono text-label text-red shrink-0">location not found</span>}
    </div>
  )
}
