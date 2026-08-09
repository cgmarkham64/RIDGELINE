import type { MacroTargets, TimePreference, UserPreferences, WeatherTolerances } from '../../../types/auth'
import type { UnitSystem } from '../../../lib/units'
import { InfoTooltip } from './InfoTooltip'
import { TimePrefRow } from './TimePrefRow'
import { WeatherToleranceGrid } from './WeatherToleranceGrid'
import { MacroTargetsGrid } from './MacroTargetsGrid'

interface PreferencesTabProps {
  prefs: UserPreferences
  prefsSaving: boolean
  prefsError: string | null
  prefsSaved: boolean
  onUnitSystemChange: (sys: UnitSystem) => void
  onTimePrefChange: (key: 'wakeTime' | 'onTrailTime' | 'campByTime', patch: Partial<TimePreference>) => void
  onWeatherToleranceChange: (patch: Partial<WeatherTolerances>) => void
  onMacroTargetChange: (key: keyof MacroTargets, value: string) => void
  onSave: () => void
}

export function PreferencesTab(props: PreferencesTabProps) {
  const {
    prefs, prefsSaving, prefsError, prefsSaved,
    onUnitSystemChange, onTimePrefChange, onWeatherToleranceChange, onMacroTargetChange, onSave,
  } = props

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Units</label>
        <div className="flex gap-1">
          {(['imperial', 'metric'] as const).map(sys => (
            <button
              key={sys}
              type="button"
              onClick={() => onUnitSystemChange(sys)}
              className="flex-1 py-[5px] font-mono text-caption rounded-sm border transition-colors duration-100 cursor-pointer"
              style={{
                background:   prefs.unitSystem === sys ? 'var(--color-amber-dim)'    : 'var(--color-surface-2)',
                borderColor:  prefs.unitSystem === sys ? 'var(--color-amber-border)' : 'var(--color-border)',
                color:        prefs.unitSystem === sys ? 'var(--color-amber)'        : 'var(--color-text-dim)',
              }}
            >
              {sys === 'imperial' ? 'Imperial (mi, °F)' : 'Metric (km, °C)'}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Default times</label>
          <InfoTooltip text="Auto-fills new route segments. Relative anchors to local sunrise or sunset on each hiking day." />
        </div>
        <div className="flex flex-col gap-2.5">
          <TimePrefRow label="Wake"     pref={prefs.wakeTime}    onChange={patch => onTimePrefChange('wakeTime', patch)} />
          <TimePrefRow label="On trail" pref={prefs.onTrailTime} onChange={patch => onTimePrefChange('onTrailTime', patch)} />
          <TimePrefRow label="Camp by"  pref={prefs.campByTime}  onChange={patch => onTimePrefChange('campByTime', patch)} />
        </div>
      </div>
      <WeatherToleranceGrid tolerances={prefs.weatherTolerances} unitSystem={prefs.unitSystem} onChange={onWeatherToleranceChange} />
      <MacroTargetsGrid macroTargets={prefs.macroTargets} onChange={onMacroTargetChange} />
      {prefsError && <p className="font-mono text-caption text-red m-0">{prefsError}</p>}
      <button
        onClick={onSave}
        disabled={prefsSaving}
        className="self-start font-mono text-fine px-3 py-1.5 rounded-sm border transition-colors duration-80 cursor-pointer disabled:opacity-50 disabled:cursor-default"
        style={{
          background:   prefsSaved ? 'var(--color-amber)'    : 'var(--color-surface-2)',
          borderColor:  prefsSaved ? 'var(--color-amber)'    : 'var(--color-border)',
          color:        prefsSaved ? 'var(--color-surface)'  : 'var(--color-text-mid)',
        }}
      >
        {prefsSaving ? 'Saving…' : prefsSaved ? 'Saved' : 'Save preferences'}
      </button>
    </>
  )
}
