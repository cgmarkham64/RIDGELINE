import type { MacroTargets } from '../../../types/auth'
import { InfoTooltip } from './InfoTooltip'

const MACRO_FIELDS = [
  { key: 'calories', label: 'Calories', placeholder: 'e.g. 3,800' },
  { key: 'protein',  label: 'Protein',  placeholder: 'e.g. 120 g'  },
  { key: 'fat',      label: 'Fat',      placeholder: 'e.g. 80 g'   },
  { key: 'carbs',    label: 'Carbs',    placeholder: 'e.g. 400 g'  },
] as const

export function MacroTargetsGrid({ macroTargets, onChange }: {
  macroTargets: MacroTargets | undefined
  onChange: (key: keyof MacroTargets, value: string) => void
}) {
  return (
    <div className="border-t border-border pt-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Daily macro targets</label>
        <InfoTooltip text="Pre-fills the Food stage on new trips. Calories also anchors its route-based per-day suggestion (plus mileage/elevation effort). Override per-trip any time." />
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {MACRO_FIELDS.map(f => (
          <div key={f.key}>
            <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1 block">{f.label}</label>
            <input
              className="w-full px-2.5 py-2 border border-border rounded-sm text-body-sm bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors placeholder:text-text-dim"
              placeholder={f.placeholder}
              value={macroTargets?.[f.key] ?? ''}
              onChange={e => onChange(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
