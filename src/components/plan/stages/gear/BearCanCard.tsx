import { useState, useRef } from 'react'
import { IconCheck, IconPlus } from '../../../icons'
import { BEAR_CANS, CAN_TYPE_CLS } from './gearStage.constants'
import type { BearCanOption } from './gearStage.types'

function BearCanOptionRow({ can, isSelected, onSelect }: {
  can: BearCanOption
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-2.5 px-3 py-2 rounded border text-left transition-colors cursor-pointer w-full ${
        isSelected ? 'bg-amber-glow border-amber-border' : 'bg-transparent border-border hover:border-border-mid'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-mono text-caption font-bold ${isSelected ? 'text-amber' : 'text-text-mid'}`}>
            {can.name}
          </span>
          {can.recommended && (
            <span className="font-mono text-label tracking-widest uppercase text-pine bg-pine-dim border border-pine-border px-1.5 py-0.5 rounded">
              recommended
            </span>
          )}
        </div>
        <div className="font-mono text-label text-text-dim mt-0.5">
          {can.capacity} · {can.weight}
          {can.note && <span className="text-amber"> · {can.note}</span>}
        </div>
      </div>
      <span className={`font-mono text-label tracking-widest uppercase px-1.5 py-0.5 rounded border shrink-0 ${CAN_TYPE_CLS[can.type]}`}>
        {can.type}
      </span>
      {isSelected && <span className="text-amber shrink-0"><IconCheck size={12} /></span>}
    </button>
  )
}

function BearCanCustomOption({
  enteringCustom, customName, selectedId, onChangeCustomName, onBlur, onKeyDown, onCommittedNameClick, onStartCustom,
}: {
  enteringCustom: boolean
  customName: string
  selectedId: string
  onChangeCustomName: (v: string) => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onCommittedNameClick: () => void
  onStartCustom: () => void
}) {
  if (enteringCustom) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded border border-amber-border bg-amber-glow">
        <input
          className="flex-1 bg-transparent border-none text-body-sm text-text outline-none placeholder:text-text-dim font-mono"
          placeholder="Container name or model…"
          autoFocus
          value={customName}
          onChange={e => onChangeCustomName(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        {customName && <span className="text-amber shrink-0"><IconCheck size={12} /></span>}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={selectedId === 'custom' ? onCommittedNameClick : onStartCustom}
      className={`flex items-center gap-2.5 px-3 py-2 rounded border text-left transition-colors cursor-pointer w-full ${
        selectedId === 'custom' ? 'bg-amber-glow border-amber-border' : 'bg-transparent border-border hover:border-border-mid'
      }`}
    >
      <span className={`font-mono text-caption ${selectedId === 'custom' ? 'text-amber font-bold' : 'text-text-dim'}`}>
        {selectedId === 'custom' && customName ? customName : 'Custom / other…'}
      </span>
      {selectedId !== 'custom' && <span className="ml-auto text-text-dim"><IconPlus size={10} /></span>}
      {selectedId === 'custom' && <span className="ml-auto text-amber"><IconCheck size={12} /></span>}
    </button>
  )
}

export function BearCanCard({ selectedId, onSelect, customName, onCustomName }: {
  selectedId: string
  onSelect: (id: string) => void
  customName: string
  onCustomName: (v: string) => void
}) {
  const [prevName, setPrevName] = useState('')
  const customNameRef = useRef(customName)

  const enteringCustom = selectedId === 'custom' && customName === ''

  function handleCommittedNameClick() {
    setPrevName(customName)
    customNameRef.current = ''
    onCustomName('')
    onSelect('custom')
  }

  function handleCustomBlur() {
    if (!customNameRef.current.trim()) onSelect('')
    setPrevName('')
  }

  function handleCustomKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (prevName) {
        customNameRef.current = prevName
        onCustomName(prevName)
      } else {
        customNameRef.current = ''
        onSelect('')
        onCustomName('')
      }
      setPrevName('')
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-2 border-b border-border">
        <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Bear canister</span>
      </div>
      <div className="p-[18px] flex flex-col gap-1.5">
        {BEAR_CANS.map(can => (
          <BearCanOptionRow
            key={can.id}
            can={can}
            isSelected={selectedId === can.id}
            onSelect={() => { onSelect(can.id); setPrevName('') }}
          />
        ))}

        <BearCanCustomOption
          enteringCustom={enteringCustom}
          customName={customName}
          selectedId={selectedId}
          onChangeCustomName={v => { customNameRef.current = v; onCustomName(v) }}
          onBlur={handleCustomBlur}
          onKeyDown={handleCustomKeyDown}
          onCommittedNameClick={handleCommittedNameClick}
          onStartCustom={() => onSelect('custom')}
        />
      </div>
    </div>
  )
}
