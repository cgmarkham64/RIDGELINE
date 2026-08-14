import { IconChevronLeft, IconChevronRight } from '../../../icons'
import { fmtShortDate } from './weatherStage.helpers'
import type { PlanWeatherData } from '../../types'

const NAV_ICON_SIZE = 13
const DOT_SIZE_PX = 6

type ForecastDay = NonNullable<PlanWeatherData['cachedForecast']>['days'][number]

type WeatherForecastPaginationProps = {
  pagedays: ForecastDay[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function WeatherForecastPagination({ pagedays, currentPage, totalPages, onPageChange }: WeatherForecastPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="p-1 rounded text-text-dim hover:text-text disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <IconChevronLeft size={NAV_ICON_SIZE} />
      </button>
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-label text-text-dim">
          {pagedays[0] && fmtShortDate(pagedays[0].date)}
          {' – '}
          {pagedays[pagedays.length - 1] && fmtShortDate(pagedays[pagedays.length - 1].date)}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPageChange(i)}
              className="rounded-full transition-colors cursor-pointer"
              style={{ width: DOT_SIZE_PX, height: DOT_SIZE_PX, background: i === currentPage ? 'var(--pine)' : 'var(--border-mid)' }}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage === totalPages - 1}
        className="p-1 rounded text-text-dim hover:text-text disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <IconChevronRight size={NAV_ICON_SIZE} />
      </button>
    </div>
  )
}
