import { setActiveField } from './drawConfirmTray.helpers'
import type { SetActiveDrawState } from './drawConfirmTray.helpers'
import type { DrawState, SegRow } from './routeStage.types'

const SELECT_CLS = 'w-full px-2 py-1.5 bg-surface border border-border rounded-sm font-mono text-fine text-text outline-none focus:border-border-mid transition-[border-color]'

type WaterExposureSelectsProps = {
  drawState: Extract<DrawState, { phase: 'active' }>
  setDrawState: SetActiveDrawState
}

export function WaterExposureSelects({ drawState, setDrawState }: WaterExposureSelectsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1 block">Water</label>
        <select
          className={SELECT_CLS}
          value={drawState.water ?? ''}
          onChange={e => {
            const v = e.target.value
            setActiveField(setDrawState, 'water', v === '' ? undefined : v as SegRow['water'])
          }}
        >
          <option value="">— not set —</option>
          <option value="reliable">Reliable</option>
          <option value="caches">Caches</option>
          <option value="dry">Dry</option>
        </select>
      </div>
      <div>
        <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1 block">Exposure</label>
        <select
          className={SELECT_CLS}
          value={drawState.exposure ?? ''}
          onChange={e => {
            const v = e.target.value
            setActiveField(setDrawState, 'exposure', v === '' ? undefined : v as SegRow['exposure'])
          }}
        >
          <option value="">— not set —</option>
          <option value="low">Low</option>
          <option value="med">Moderate</option>
          <option value="high">High</option>
          <option value="extreme">Extreme</option>
        </select>
      </div>
    </div>
  )
}
