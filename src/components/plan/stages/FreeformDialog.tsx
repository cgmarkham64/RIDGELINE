import { useState } from 'react'
import { IconX, IconSparkle, IconPlus, IconChevronLeft, IconChevronRight } from '../../icons'
import { TypeChip } from './PermitAtoms'
import { PERMIT_TYPES, TONE_CLS } from './permitsStage.constants'
import type { Permit } from './permitsStage.types'
import type { PermitTypeName } from '../types'

export function FreeformDialog({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (permit: Permit) => void
}) {
  const [step, setStep] = useState<'type' | 'details'>('type')
  const [selectedType, setSelectedType] = useState<PermitTypeName | null>(null)
  const [name, setName] = useState('')
  const [agency, setAgency] = useState('')
  const [notes, setNotes] = useState('')

  function handleAdd() {
    if (!selectedType || !name.trim()) return
    onAdd({
      id: `custom_${Date.now()}`,
      type: selectedType,
      name: name.trim(),
      agency: agency.trim(),
      why: notes.trim(),
      fields: {},
      party: 4,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(10,9,8,0.78)]">
      <div className="bg-surface border border-border rounded-xl w-full max-w-[520px] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
          <span className="font-heading text-[14px] font-extrabold text-text flex-1">Add permit</span>
          <div className="flex items-center gap-1.5 mr-2">
            {(['type', 'details'] as const).map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`font-mono text-[9px] tracking-widest uppercase ${
                  step === s ? 'text-amber' : (step === 'details' && s === 'type') ? 'text-pine' : 'text-text-dim'
                }`}>
                  {s === 'type' ? 'Type' : 'Details'}
                </span>
                {i < 1 && <span className="text-border text-[10px]">·</span>}
              </span>
            ))}
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text p-1 transition-colors">
            <IconX size={16} />
          </button>
        </div>

        <div className="p-5">
          {step === 'type' && (
            <>
              <p className="text-[12px] text-text-mid mb-4 leading-relaxed">What kind of permit do you need?</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(PERMIT_TYPES) as [PermitTypeName, typeof PERMIT_TYPES[PermitTypeName]][]).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`flex flex-col items-start gap-1.5 p-3 rounded border text-left transition-colors cursor-pointer ${
                      selectedType === key ? TONE_CLS[t.tone] : 'bg-transparent border-border text-text-mid hover:border-border-mid'
                    }`}
                  >
                    <span className="font-mono text-[9px] tracking-widest uppercase font-semibold">{t.label}</span>
                    <span className="text-[10px] text-text-dim leading-snug">{t.hint}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-start gap-2.5 px-3 py-2.5 bg-amber-dim border border-amber-border rounded text-[11px] text-text-mid">
                <span className="text-amber shrink-0 mt-0.5"><IconSparkle /></span>
                <div>
                  <span className="font-semibold text-text">AI-assisted fill coming soon.</span>{' '}
                  Enter a permit name and Claude will look up key dates, agency info, and booking links for you.
                </div>
              </div>
            </>
          )}

          {step === 'details' && selectedType && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <TypeChip type={selectedType} />
                <button
                  onClick={() => setStep('type')}
                  className="font-mono text-[9px] text-text-dim hover:text-text transition-colors uppercase tracking-widest bg-transparent border-none cursor-pointer p-0"
                >
                  Change
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1.5 block">Permit name *</label>
                  <input
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-surface-2 text-text outline-none focus:border-border-mid transition-colors"
                    placeholder="e.g. Mt. Whitney overnight permit"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1.5 block">Agency / issuer</label>
                  <input
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-surface-2 text-text outline-none focus:border-border-mid transition-colors"
                    placeholder="e.g. Inyo NF · recreation.gov"
                    value={agency}
                    onChange={e => setAgency(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1.5 block">Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-surface-2 text-text outline-none focus:border-border-mid transition-colors resize-none"
                    placeholder="Why this permit is needed, key dates, links…"
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-widest uppercase text-text-dim hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            Cancel
          </button>
          {step === 'type' ? (
            <button
              onClick={() => selectedType && setStep('details')}
              disabled={!selectedType}
              className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <IconChevronRight />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('type')}
                className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
              >
                <IconChevronLeft /> Back
              </button>
              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <IconPlus size={10} /> Add to trip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}