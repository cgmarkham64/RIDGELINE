import type { PlanPermitEntry } from '../../types'

export type PermitTone = 'amber' | 'sky' | 'pine'
export type Permit = PlanPermitEntry
export type ZoneNight = NonNullable<PlanPermitEntry['zones']>[number]
