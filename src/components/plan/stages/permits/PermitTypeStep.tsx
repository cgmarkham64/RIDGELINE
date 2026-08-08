import type { PermitTypeName } from '../../types'
import { PERMIT_TYPES, TONE_CLS } from './permitsStage.constants'

interface PermitTypeStepProps {
  selectedType: PermitTypeName | null
  onSelect: (type: PermitTypeName) => void
}

export function PermitTypeStep({ selectedType, onSelect }: PermitTypeStepProps) {
  return (
    <>
      <p className="text-body-sm text-text-mid mb-4 leading-relaxed">What kind of permit do you need?</p>
      <div className="grid grid-cols-3 gap-2">
        {(Object.entries(PERMIT_TYPES) as [PermitTypeName, typeof PERMIT_TYPES[PermitTypeName]][]).map(([key, t]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex flex-col items-start gap-1.5 p-3 rounded border text-left transition-colors cursor-pointer ${
              selectedType === key ? TONE_CLS[t.tone] : 'bg-transparent border-border text-text-mid hover:border-border-mid'
            }`}
          >
            <span className="font-mono text-label tracking-widest uppercase font-semibold">{t.label}</span>
            <span className="text-caption text-text-dim leading-snug">{t.hint}</span>
          </button>
        ))}
      </div>
    </>
  )
}
