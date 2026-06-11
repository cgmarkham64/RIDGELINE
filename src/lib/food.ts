import { api } from './api'

export interface MacroResult {
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
  weightOz: number
  note: string
}

export async function lookupMacros(name: string): Promise<MacroResult[]> {
  const { data } = await api.post<MacroResult[]>('/api/food/macros', { name })
  return data
}
