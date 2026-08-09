import type { Dispatch, SetStateAction } from 'react'
import type { DrawState } from './routeStage.types'

type ActiveDrawState = Extract<DrawState, { phase: 'active' }>
export type SetActiveDrawState = Dispatch<SetStateAction<DrawState>>

export function setActiveField<K extends keyof ActiveDrawState>(
  setDrawState: SetActiveDrawState,
  key: K,
  value: ActiveDrawState[K],
) {
  setDrawState(prev => prev.phase === 'active' ? { ...prev, [key]: value } : prev)
}
