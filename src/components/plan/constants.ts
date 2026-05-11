import type { Stage, StageId } from './types'

// Static metadata — use for label/length lookups only, never mutate.
export const STAGES: Stage[] = [
  { id: 'route',   n: '01', label: 'Route',   sub: 'Where',           done: 0, total: 6 },
  { id: 'days',    n: '02', label: 'Days',    sub: 'Day-by-day',      done: 0, total: 8 },
  { id: 'permits', n: '03', label: 'Permits', sub: 'Travel & access', done: 0, total: 7 },
  { id: 'food',    n: '04', label: 'Food',    sub: 'Calories & H₂O',  done: 0, total: 6 },
  { id: 'gear',    n: '05', label: 'Gear',    sub: 'Loadout',         done: 0, total: 5, blocked: true },
  { id: 'depart',  n: '06', label: 'Depart',  sub: 'Take it with',    done: 0, total: 4 },
]

// Use this to initialise per-instance mutable stage state in PlanWizard.
export function createStages(): Stage[] {
  return STAGES.map(s => ({ ...s }))
}

export const STAGE_TITLES: Record<StageId, string> = {
  route:   'Pick your route.',
  days:    'Lay out the days.',
  permits: 'Permits & travel logistics.',
  food:    'Food and water.',
  gear:    'Pack the gear.',
  depart:  'Take the plan with you.',
}

export const STAGE_SUBS: Record<StageId, string> = {
  route:   'Define entry, exit, and the line through. Mileage and gain auto-tally.',
  days:    'Slot camps and daily mileage. Pulls directly from the route you chose.',
  permits: "Lock down access and how everyone gets to the trailhead. We'll surface critical dates.",
  food:    'Calorie targets and water. Resupply pulls dates from your day plan.',
  gear:    'Loadout. Bear-can sizing and weight depend on Permits and Food being settled first.',
  depart:  'Day-of essentials: offline maps, emergency contacts, the printable card.',
}

export const STAGE_DESCRIPTIONS: Record<StageId, string> = {
  route:   '149 mi · Onion Valley → Whitney Portal · 8 days · approved by partners',
  days:    '8 days laid out · 7 camps · longest day 22 mi · matches route exactly',
  permits: 'Whitney lottery scheduled. Need: return shuttle, backup route, reminders.',
  food:    '2 of 6 done. Resupply at Kearsarge unconfirmed. No water cache plan yet.',
  gear:    'Locked until permit results (bear-can size depends on resupply).',
  depart:  'Pre-flight checklist, offline maps, emergency contacts — closest to start.',
}

export function stageState(s: Stage) {
  if (s.blocked) return 'blocked'
  if (s.done >= s.total && s.total > 0) return 'done'
  if (s.done > 0) return 'progress'
  return 'idle'
}