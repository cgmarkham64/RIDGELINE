export type StageId = 'route' | 'days' | 'permits' | 'food' | 'gear' | 'depart'

export interface Stage {
  id: StageId
  n: string
  label: string
  sub: string
  done: number
  total: number
  blocked?: boolean
}

export type StageState = 'done' | 'progress' | 'idle' | 'blocked'

export type PlanView = 'overview' | 'stage'

export interface StageBodyProps {
  onJump: (id: string) => void
}