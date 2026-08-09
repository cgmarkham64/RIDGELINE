import { useState } from 'react'
import { useAuthStore } from '../../../store/auth'
import { updatePreferences } from '../../../lib/auth'
import type { TimePreference, UserPreferences, WeatherTolerances, MacroTargets } from '../../../types/auth'
import { DEFAULT_USER_PREFERENCES } from '../../../types/auth'
import type { UnitSystem } from '../../../lib/units'
import { apiError } from './accountDialog.helpers'

const PREFS_SAVED_MESSAGE_TIMEOUT_MS = 2500

function initialPreferences(saved: UserPreferences | undefined): UserPreferences {
  return {
    ...DEFAULT_USER_PREFERENCES,
    ...saved,
    weatherTolerances: saved?.weatherTolerances ?? DEFAULT_USER_PREFERENCES.weatherTolerances,
    unitSystem: saved?.unitSystem ?? 'imperial',
  }
}

interface SaveDeps {
  prefs: UserPreferences
  updateUser: (patch: { preferences?: UserPreferences }) => void
  setPrefsSaving: (v: boolean) => void
  setPrefsError: (v: string | null) => void
  setPrefsSaved: (v: boolean) => void
}

async function submitPreferences(deps: SaveDeps) {
  const { prefs, updateUser, setPrefsSaving, setPrefsError, setPrefsSaved } = deps
  setPrefsSaving(true)
  setPrefsError(null)
  try {
    const updated = await updatePreferences(prefs)
    updateUser({ preferences: updated.preferences })
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), PREFS_SAVED_MESSAGE_TIMEOUT_MS)
  } catch (err: unknown) {
    setPrefsError(apiError(err, 'Save failed. Please try again.'))
  } finally {
    setPrefsSaving(false)
  }
}

export function useAccountPreferences() {
  const { user, updateUser } = useAuthStore()
  const [prefs, setPrefs] = useState<UserPreferences>(() => initialPreferences(user?.preferences))
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsError, setPrefsError] = useState<string | null>(null)
  const [prefsSaved, setPrefsSaved] = useState(false)

  function patch(updater: (prev: UserPreferences) => UserPreferences) {
    setPrefs(updater)
    setPrefsSaved(false)
  }

  function patchTimePref(key: 'wakeTime' | 'onTrailTime' | 'campByTime', value: Partial<TimePreference>) {
    patch(prev => ({ ...prev, [key]: { ...prev[key], ...value } }))
  }
  function patchWeatherTolerance(value: Partial<WeatherTolerances>) {
    patch(prev => ({ ...prev, weatherTolerances: { ...prev.weatherTolerances, ...value } }))
  }
  function patchMacroTarget(key: keyof MacroTargets, value: string) {
    patch(prev => ({ ...prev, macroTargets: { ...prev.macroTargets, [key]: value } }))
  }
  function setUnitSystem(sys: UnitSystem) {
    patch(prev => ({ ...prev, unitSystem: sys }))
  }

  return {
    prefs, prefsSaving, prefsError, prefsSaved,
    setUnitSystem, patchTimePref, patchWeatherTolerance, patchMacroTarget,
    handleSavePreferences: () => void submitPreferences({ prefs, updateUser, setPrefsSaving, setPrefsError, setPrefsSaved }),
  }
}
