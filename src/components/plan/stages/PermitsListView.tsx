import { useState } from 'react'
import { IconMap, IconCheck, IconSearch, IconPlus } from '../../icons'
import { PermitCard } from './PermitCard'
import { SuggestionRow } from './SuggestionRow'
import { PERMIT_TYPES } from './permitsStage.constants'
import type { Permit } from './permitsStage.types'
import type { PermitTypeName } from '../types'
import { JumpChip } from '../JumpChip'

export function PermitsListView({ permits, suggestions, onAcceptAll, onAccept, onReject, onRemove, onViewMap, onAddFreeform, onOverrideParty, partyConfirmed, onConfirmParty, onJump }: {
  permits: Permit[]
  suggestions: Permit[]
  onAcceptAll: () => void
  onAccept: (p: Permit) => void
  onReject: (p: Permit) => void
  onRemove: (id: string) => void
  onViewMap: (p: Permit) => void
  onAddFreeform: () => void
  onOverrideParty: () => void
  partyConfirmed: boolean
  onConfirmParty: () => void
  onJump: (id: string) => void
}) {
  const [search, setSearch] = useState('')

  return (
    <div className="flex flex-col gap-[22px]">

      {/* Detection banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-dim border border-amber-border rounded-lg">
        <span className="text-amber shrink-0"><IconMap size={16} /></span>
        <div className="flex-1 min-w-0">
          <div className="font-heading text-[12px] font-bold text-amber">
            We checked your route — 4 permit types across 2 agencies
          </div>
          <div className="font-mono text-[9px] text-text-mid mt-0.5">
            Suggestions pulled from{' '}
            <JumpChip to="route" onJump={onJump}>Route</JumpChip>
            {' · '}party of 4 from{' '}
            <JumpChip to="days" onJump={onJump}>Days</JumpChip>
            {' · '}
            {partyConfirmed ? (
              <span className="text-pine">confirmed <span className="inline-block">✓</span></span>
            ) : (
              <button
                onClick={onConfirmParty}
                className="text-amber hover:underline bg-transparent border-none cursor-pointer font-mono text-[9px] p-0"
              >
                confirm party →
              </button>
            )}
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer shrink-0">
          Re-scan
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Suggested for your route</div>
            <button
              onClick={onAcceptAll}
              className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
            >
              <IconCheck size={10} /> Accept all
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {suggestions.map(s => (
              <SuggestionRow
                key={s.id}
                permit={s}
                onAccept={() => onAccept(s)}
                onReject={() => onReject(s)}
                onViewMap={() => onViewMap(s)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Added permits */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">
            On this trip{permits.length > 0 ? ` (${permits.length})` : ''}
          </div>
          {permits.length === 0 && (
            <span className="font-mono text-[9px] text-text-dim">nothing added yet</span>
          )}
        </div>
        {permits.length > 0 ? (
          <div className="flex flex-col gap-3">
            {permits.map(p => (
              <PermitCard
                key={p.id}
                permit={p}
                onRemove={() => onRemove(p.id)}
                onViewMap={() => onViewMap(p)}
                onOverrideParty={onOverrideParty}
              />
            ))}
          </div>
        ) : (
          <div className="px-6 py-6 text-center border border-dashed border-border rounded-lg text-[12px] text-text-dim">
            Accept a suggestion above, or add one manually below.
          </div>
        )}
      </section>

      {/* Add another */}
      <section className="pt-1">
        <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">Add another</div>
        <div className="flex gap-2.5 p-1 bg-surface border border-border rounded-lg">
          <div className="flex-1 flex items-center gap-2 px-3 text-text-dim">
            <IconSearch />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agencies, units, or trailheads…"
              className="flex-1 bg-transparent border-none text-[12px] text-text outline-none py-2.5 placeholder:text-text-dim"
            />
          </div>
          <button
            onClick={onAddFreeform}
            className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-3.5 py-2 border-l border-border text-text-mid bg-transparent hover:text-text hover:bg-surface-2 transition-colors cursor-pointer rounded-r"
          >
            <IconPlus size={10} /> Free-form
          </button>
        </div>
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {(Object.entries(PERMIT_TYPES) as [PermitTypeName, typeof PERMIT_TYPES[PermitTypeName]][]).map(([key, t]) => (
            <button
              key={key}
              onClick={onAddFreeform}
              title={t.hint}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border text-text-mid text-[10px] font-medium bg-transparent hover:border-border-mid hover:text-text transition-colors cursor-pointer"
            >
              <IconPlus size={9} /> {t.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}