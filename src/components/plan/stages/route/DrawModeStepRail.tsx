import { IconX } from '../../../icons'
import { formatCoord } from './routeStage.helpers'
import type { DrawState } from './routeStage.types'
import type { DrawPhaseFlags } from './routeMapCard.types'

function CheckDot() {
  return (
    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--pine)' }}>
      <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </span>
  )
}

function StepDot({ n, active }: { n: number; active: boolean }) {
  return (
    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${active ? 'border-amber' : 'border-border'}`}>
      <span className={`font-mono text-[7px] font-bold ${active ? 'text-amber' : 'text-text-dim'}`}>{n}</span>
    </span>
  )
}

function StepBanner({ startPlaced, endPlaced, onCancel }: { startPlaced: boolean; endPlaced: boolean; onCancel: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded border border-amber-border bg-amber-dim">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {startPlaced ? <CheckDot /> : <StepDot n={1} active />}
          <span className={`font-mono text-label tracking-widest uppercase ${startPlaced ? 'text-pine' : 'text-amber font-bold'}`}>Start</span>
        </div>

        <span className="text-text-dim text-label">→</span>

        <div className="flex items-center gap-1.5">
          {endPlaced ? <CheckDot /> : <StepDot n={2} active={startPlaced} />}
          <span className={`font-mono text-label tracking-widest uppercase ${endPlaced ? 'text-pine' : startPlaced ? 'text-amber font-bold' : 'text-text-dim'}`}>End</span>
          {!endPlaced && <span className="font-mono text-label text-text-dim">— click map</span>}
        </div>
      </div>

      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1 font-heading text-caption font-bold tracking-widest uppercase px-2.5 py-1 rounded border border-border text-text-dim bg-surface hover:text-text hover:border-border-mid transition-colors cursor-pointer ml-4 shrink-0"
      >
        <IconX size={9} />
        Cancel
      </button>
    </div>
  )
}

function StartChip({ start, startPlaced, onResetStartPin }: {
  start: [number, number] | null
  startPlaced: boolean
  onResetStartPin: () => void
}) {
  return (
    <button
      onClick={startPlaced ? onResetStartPin : undefined}
      disabled={!startPlaced}
      title={startPlaced ? 'Click to reposition start' : undefined}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-left w-full transition-colors ${
        startPlaced
          ? 'border-pine-border bg-pine-dim hover:brightness-110 cursor-pointer'
          : 'border-border bg-surface-2 opacity-40 cursor-default'
      }`}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: startPlaced ? 'var(--pine)' : 'var(--border)' }} />
      <span className="font-mono text-label tracking-widest uppercase text-text-dim shrink-0">Start</span>
      <span className={`font-mono text-label truncate ${startPlaced ? 'text-pine' : 'text-text-dim italic'}`}>
        {startPlaced && start ? formatCoord(start) : 'not placed'}
      </span>
    </button>
  )
}

function EndChip({ end, startPlaced, endPlaced }: {
  end: [number, number] | null
  startPlaced: boolean
  endPlaced: boolean
}) {
  const borderClass = endPlaced ? 'border-amber-border bg-amber-dim' : startPlaced ? 'border-amber-border bg-surface-2' : 'border-border bg-surface-2 opacity-40'
  const dotBorder = endPlaced ? 'none' : `1px solid ${startPlaced ? 'var(--amber)' : 'var(--border)'}`
  const label = endPlaced && end ? formatCoord(end) : startPlaced ? 'click map to place' : 'waiting…'

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded border ${borderClass}`}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: endPlaced ? 'var(--amber)' : 'transparent', border: dotBorder }} />
      <span className="font-mono text-label tracking-widest uppercase text-text-dim shrink-0">End</span>
      <span className={`font-mono text-label truncate ${endPlaced ? 'text-amber' : 'text-text-dim italic'}`}>{label}</span>
    </div>
  )
}

function CoordChips({ start, end, startPlaced, endPlaced, onResetStartPin }: {
  start: [number, number] | null
  end: [number, number] | null
  startPlaced: boolean
  endPlaced: boolean
  onResetStartPin: () => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <StartChip start={start} startPlaced={startPlaced} onResetStartPin={onResetStartPin} />
      <EndChip end={end} startPlaced={startPlaced} endPlaced={endPlaced} />
    </div>
  )
}

type DrawModeStepRailProps = {
  drawState: DrawState
  flags: DrawPhaseFlags
  onCancel: () => void
  onResetStartPin: () => void
}

export function DrawModeStepRail({ drawState, flags, onCancel, onResetStartPin }: DrawModeStepRailProps) {
  const { startPlaced, endPlaced } = flags
  const start = 'start' in drawState ? drawState.start : null
  const end = 'end' in drawState ? drawState.end : null

  return (
    <div className="flex flex-col gap-2 mt-3">
      <StepBanner startPlaced={startPlaced} endPlaced={endPlaced} onCancel={onCancel} />
      <CoordChips start={start} end={end} startPlaced={startPlaced} endPlaced={endPlaced} onResetStartPin={onResetStartPin} />
    </div>
  )
}
