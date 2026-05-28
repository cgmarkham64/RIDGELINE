import { useAuthStore } from '../store/auth'
import type { UnitSystem } from '../lib/units'

export function useUnitSystem(): UnitSystem {
  return useAuthStore((s) => s.user?.preferences?.unitSystem ?? 'imperial')
}
