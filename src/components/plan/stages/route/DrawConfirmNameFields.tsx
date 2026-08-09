import { setActiveField } from './drawConfirmTray.helpers'
import type { SetActiveDrawState } from './drawConfirmTray.helpers'
import type { DrawState } from './routeStage.types'

const INPUT_CLS = 'w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm font-mono text-fine text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]'

type DrawConfirmNameFieldsProps = {
  drawState: Extract<DrawState, { phase: 'active' }>
  setDrawState: SetActiveDrawState
}

export function DrawConfirmNameFields({ drawState, setDrawState }: DrawConfirmNameFieldsProps) {
  return (
    <>
      <div>
        <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1 block">Segment name</label>
        <input
          className={INPUT_CLS}
          value={drawState.name}
          onChange={e => setDrawState(prev => prev.phase === 'active' ? { ...prev, name: e.target.value, nameAuto: false } : prev)}
          placeholder="e.g. Onion Valley → Kearsarge Pass"
          autoFocus
        />
      </div>
      <div>
        <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1 block">Notes</label>
        <input
          className={INPUT_CLS}
          value={drawState.notes}
          onChange={e => setActiveField(setDrawState, 'notes', e.target.value)}
          placeholder="Trail conditions, hazards…"
        />
      </div>
    </>
  )
}
