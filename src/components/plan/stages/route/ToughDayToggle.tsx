import { EXP_LABEL } from './routeStage.helpers'
import { setActiveField } from './drawConfirmTray.helpers'
import type { SetActiveDrawState } from './drawConfirmTray.helpers'
import type { DrawState } from './routeStage.types'

const EXP_CLS: Record<string, string> = {
  low: 'text-pine border-pine-border bg-pine-dim',
  med: 'text-sky border-sky-border bg-sky-dim',
  high: 'text-amber border-amber-border bg-amber-dim',
  extreme: 'text-red border-red-border bg-red-dim',
}

type ToughDayToggleProps = {
  drawState: Extract<DrawState, { phase: 'active' }>
  setDrawState: SetActiveDrawState
  suggestedHard: boolean
}

export function ToughDayToggle({ drawState, setDrawState, suggestedHard }: ToughDayToggleProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={drawState.hard ?? false}
      onClick={() => setActiveField(setDrawState, 'hard', drawState.hard ? undefined : true)}
      className="flex items-center gap-2 cursor-pointer select-none bg-transparent border-none p-0 w-full text-left"
    >
      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${drawState.hard ? 'bg-amber-dim border-amber-border' : 'bg-surface border-border'}`}>
        {drawState.hard && (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className="font-mono text-caption text-text">Tough day</span>
      {suggestedHard && !drawState.hard && <span className="font-mono text-label text-text-dim">(suggested)</span>}
      {drawState.exposure && (
        <span className={`ml-auto font-mono text-label font-semibold px-1.5 py-0.5 rounded border uppercase tracking-[0.08em] ${EXP_CLS[drawState.exposure]}`}>
          {EXP_LABEL[drawState.exposure]}
        </span>
      )}
    </button>
  )
}
