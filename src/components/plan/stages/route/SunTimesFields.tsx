import { setActiveField } from './drawConfirmTray.helpers'
import type { SetActiveDrawState } from './drawConfirmTray.helpers'
import type { DrawState } from './routeStage.types'

const TIME_FIELDS = ['wakeTime', 'onTrailTime', 'campByTime'] as const
const TIME_FIELD_LABELS = ['Wake', 'On trail', 'Camp by']

const TIME_INPUT_CLS = 'w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm font-mono text-fine text-text outline-none focus:border-border-mid transition-[border-color] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:[filter:invert(1)_sepia(1)_saturate(4)_hue-rotate(5deg)_brightness(0.85)] [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-90'

type SunTimesFieldsProps = {
  drawState: Extract<DrawState, { phase: 'active' }>
  setDrawState: SetActiveDrawState
}

export function SunTimesFields({ drawState, setDrawState }: SunTimesFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {drawState.sunTimesLoading && (
        <div className="col-span-3">
          <span className="font-mono text-label text-text-dim tracking-widest">Fetching sun times…</span>
        </div>
      )}
      {TIME_FIELDS.map((field, i) => (
        <div key={field}>
          <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1 block">
            {TIME_FIELD_LABELS[i]}
          </label>
          <input
            type="time"
            className={TIME_INPUT_CLS}
            value={drawState[field] ?? ''}
            onChange={e => setActiveField(setDrawState, field, e.target.value || undefined)}
          />
        </div>
      ))}
    </div>
  )
}
