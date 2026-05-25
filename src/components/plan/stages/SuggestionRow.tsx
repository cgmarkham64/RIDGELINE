import { IconPlus, IconMap } from '../../icons'
import { PermitTypeIcon, TypeChip } from './PermitAtoms'
import { PERMIT_TYPES, TONE_CLS } from './permitsStage.constants'
import type { Permit } from './permitsStage.types'

export function SuggestionRow({ permit, onAccept, onReject, onViewMap }: {
  permit: Permit
  onAccept: () => void
  onReject: () => void
  onViewMap: () => void
}) {
  const t = PERMIT_TYPES[permit.type]
  return (
    <div className="grid items-start gap-3.5 px-4 py-3.5 bg-surface border border-border rounded-lg grid-cols-[32px_1fr_auto]">
      <span className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${TONE_CLS[t.tone]}`}>
        <PermitTypeIcon type={permit.type} size={15} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <TypeChip type={permit.type} />
          <span className="font-heading text-[13px] font-bold text-text">{permit.name}</span>
        </div>
        <div className="font-mono text-[9px] text-text-dim mb-1">{permit.agency}</div>
        <div className="text-[11px] text-text-mid italic leading-relaxed">{permit.why}</div>
      </div>
      <div className="flex flex-col gap-1.5 items-end shrink-0">
        <button
          onClick={onAccept}
          className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer"
        >
          <IconPlus size={10} /> Add
        </button>
        <button
          onClick={onViewMap}
          className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.08em] uppercase text-text-dim hover:text-sky transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          <IconMap size={9} /> Map
        </button>
        <button
          onClick={onReject}
          className="font-mono text-[9px] tracking-widest uppercase text-text-dim hover:text-text transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          Not needed
        </button>
      </div>
    </div>
  )
}