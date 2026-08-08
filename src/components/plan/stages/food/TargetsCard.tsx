import { useId } from 'react'
import { TARGET_FIELDS } from './foodStage.helpers'
import type { TargetField } from './foodStage.types'

type TargetsCardProps = {
  targets: Record<TargetField, string>
  suggestedAvgKcal?: number
  onTargetChange: (field: TargetField, value: string) => void
}

export function TargetsCard({ targets, suggestedAvgKcal, onTargetChange }: TargetsCardProps) {
  const uid = useId()
  const showSuggestion = suggestedAvgKcal !== undefined && targets.calories.trim() === ''
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-3">Daily targets</div>
      <div className="grid grid-cols-4 gap-2.5">
        {TARGET_FIELDS.map(f => (
          <div key={f.key}>
            <label
              htmlFor={`${uid}-${f.key}`}
              className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1 block"
            >
              {f.label}
            </label>
            <input
              id={`${uid}-${f.key}`}
              className="w-full px-2.5 py-1.5 border border-border rounded-sm text-body-sm bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors placeholder:text-text-dim"
              placeholder={f.placeholder}
              value={targets[f.key]}
              onChange={e => onTargetChange(f.key, e.target.value)}
            />
            {f.key === 'calories' && showSuggestion && (
              <button
                type="button"
                onClick={() => onTargetChange('calories', String(suggestedAvgKcal))}
                className="font-mono text-label text-amber hover:underline cursor-pointer mt-1 text-left"
              >
                Suggested {suggestedAvgKcal.toLocaleString()} (from route) · use
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
