import type { PlanMealEntry } from '../../types'

export type MealRow = PlanMealEntry

export type LegacyMealEntry = {
  n: number; breakfast: string; lunch: string; dinner: string; snacks: string
  kcal: number; weightOz?: number
}

export type TargetField = 'calories' | 'protein' | 'fat' | 'carbs'

export type BearCanNeed = '' | 'required' | 'recommended' | 'not_needed'

export type RowTargets = { calories: string; protein: string; fat: string; carbs: string }

export interface RowWarning { field: string; pct: number; actual: number; target: number }
