import { IconCheck } from '../../../icons'
import { WeatherForecastWindowBody } from './WeatherForecastWindowBody'
import type { UnitSystem } from '../../../../lib/units'
import type { PlanWeatherData } from '../../types'
import type { SunTimes } from './weatherStage.types'

type ForecastDay = NonNullable<PlanWeatherData['cachedForecast']>['days'][number]

type WeatherForecastCardProps = {
  inWindow: boolean
  canEdit: boolean
  forecastChecked: boolean
  onToggleChecked: () => void
  midDaySun: SunTimes | undefined
  coordsLng: number | undefined
  startDate: string
  forecastLoading: boolean
  forecastError: boolean
  pagedays: ForecastDay[]
  hasForecast: boolean
  endDate: string
  sys: UnitSystem
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function ForecastHeader({ canEdit, inWindow, checked, onToggle }: { canEdit: boolean; inWindow: boolean; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
      <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Forecast</span>
      {inWindow && canEdit && (
        <button type="button" onClick={onToggle}
          className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-label rounded border cursor-pointer transition-colors ${checked ? 'bg-pine-dim border-pine-border text-pine' : 'bg-surface-2 border-border text-text-dim hover:border-border-mid'}`}>
          {checked && <IconCheck size={9} />} Checked
        </button>
      )}
    </div>
  )
}

export function WeatherForecastCard({
  inWindow, canEdit, forecastChecked, onToggleChecked, midDaySun, coordsLng, startDate,
  forecastLoading, forecastError, pagedays, hasForecast, endDate, sys, currentPage, totalPages, onPageChange,
}: WeatherForecastCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <ForecastHeader canEdit={canEdit} inWindow={inWindow} checked={forecastChecked} onToggle={onToggleChecked} />
      <WeatherForecastWindowBody
        inWindow={inWindow} midDaySun={midDaySun} coordsLng={coordsLng} startDate={startDate} endDate={endDate}
        forecastLoading={forecastLoading} forecastError={forecastError} hasForecast={hasForecast} pagedays={pagedays}
        sys={sys} currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange}
      />
    </div>
  )
}
