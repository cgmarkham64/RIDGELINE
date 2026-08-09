import { IconCheck, IconPlus } from '../../../icons'
import type { GearCategory } from './gearStage.types'

export function CategoryCard({ category, onToggleItem }: {
  category: GearCategory
  onToggleItem: (itemIdx: number) => void
}) {
  const checkedOz = category.items.filter(i => i.checked).reduce((s, i) => s + i.weight, 0)
  const totalOz   = category.items.reduce((s, i) => s + i.weight, 0)

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-2 border-b border-border">
        <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">{category.label}</span>
        <span className="font-mono text-label text-text-dim">{category.items.length} items</span>
        <span className="ml-auto font-mono text-caption text-amber">{checkedOz.toFixed(1)} / {totalOz.toFixed(1)} oz</span>
      </div>

      {category.items.map((item, i) => (
        <button
          key={item.name}
          type="button"
          onClick={() => onToggleItem(i)}
          className={`grid w-full text-left px-4 py-2 gap-3 items-center cursor-pointer transition-colors hover:bg-surface-2 ${
            i < category.items.length - 1 ? 'border-b border-border' : ''
          }`}
          style={{ gridTemplateColumns: '20px 1fr 60px' }}
        >
          <span className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${
            item.checked ? 'bg-pine border-pine-border text-bg' : 'border-border-mid bg-transparent text-transparent'
          }`}>
            <IconCheck size={9} strokeWidth={3} />
          </span>
          <span className={`text-[11.5px] leading-snug ${item.checked ? 'text-text' : 'text-text-mid'}`}>
            {item.name}
          </span>
          <span className="font-mono text-caption text-text-dim text-right">{item.weight} oz</span>
        </button>
      ))}

      <div className="px-4 py-2 border-t border-border">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase text-text-dim hover:text-text-mid transition-colors cursor-pointer"
        >
          <IconPlus /> Add item
        </button>
      </div>
    </div>
  )
}