import type { MealItem, MealSlot } from '../../types'

export type WeightUnit = 'oz' | 'g'

export const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks']
export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
}

export const G_PER_OZ = 28.3495

export const INPUT_CLS = 'bg-surface border border-border rounded-sm px-1.5 py-1 font-mono text-fine text-text outline-none focus:border-border-mid transition-colors w-full'

export function blankItem(): MealItem {
  return { id: crypto.randomUUID(), name: '', kcal: 0, proteinG: 0, fatG: 0, carbsG: 0, weightOz: 0 }
}

export function ozToDisplay(oz: number, unit: WeightUnit): string {
  if (oz === 0) return ''
  return unit === 'g' ? String(Math.round(oz * G_PER_OZ)) : String(oz)
}

export function displayToOz(value: string, unit: WeightUnit): number {
  const n = Number(value) || 0
  return unit === 'g' ? Number((n / G_PER_OZ).toFixed(2)) : n
}

export function sumDayField(items: MealItem[], field: 'kcal' | 'weightOz' | 'proteinG' | 'fatG' | 'carbsG'): number {
  return items.reduce((sum, i) => sum + i[field] * (i.qty ?? 1), 0)
}
