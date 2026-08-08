import { INPUT_CLS, ozToDisplay, displayToOz } from './dayMealDialog.helpers'
import type { WeightUnit } from './dayMealDialog.helpers'
import type { MealItem } from '../../types'

type ItemMacroFieldsProps = {
  item: MealItem
  weightUnit: WeightUnit
  onUpdate: (patch: Partial<MealItem>) => void
}

export function ItemMacroFields({ item, weightUnit, onUpdate }: ItemMacroFieldsProps) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      <div>
        <label className="font-mono text-label text-text-dim block mb-0.5">qty</label>
        <input
          type="number"
          min={1}
          step={1}
          className={`${INPUT_CLS} text-center`}
          value={item.qty ?? 1}
          onChange={e => onUpdate({ qty: Math.max(1, parseInt(e.target.value) || 1) })}
        />
      </div>
      <div>
        <label className="font-mono text-label text-text-dim block mb-0.5">kcal</label>
        <input type="number" min={0} className={INPUT_CLS} placeholder="0" value={item.kcal || ''} onChange={e => onUpdate({ kcal: Number(e.target.value) || 0 })} />
      </div>
      <div>
        <label className="font-mono text-label text-text-dim block mb-0.5">P (g)</label>
        <input type="number" min={0} className={INPUT_CLS} placeholder="0" value={item.proteinG || ''} onChange={e => onUpdate({ proteinG: Number(e.target.value) || 0 })} />
      </div>
      <div>
        <label className="font-mono text-label text-text-dim block mb-0.5">F (g)</label>
        <input type="number" min={0} className={INPUT_CLS} placeholder="0" value={item.fatG || ''} onChange={e => onUpdate({ fatG: Number(e.target.value) || 0 })} />
      </div>
      <div>
        <label className="font-mono text-label text-text-dim block mb-0.5">C (g)</label>
        <input type="number" min={0} className={INPUT_CLS} placeholder="0" value={item.carbsG || ''} onChange={e => onUpdate({ carbsG: Number(e.target.value) || 0 })} />
      </div>
      <div>
        <label className="font-mono text-label text-text-dim block mb-0.5">weight ({weightUnit})</label>
        <input
          type="number"
          min={0}
          className={INPUT_CLS}
          placeholder="0"
          value={ozToDisplay(item.weightOz, weightUnit)}
          onChange={e => onUpdate({ weightOz: displayToOz(e.target.value, weightUnit) })}
        />
      </div>
    </div>
  )
}
