import Anthropic from '@anthropic-ai/sdk'
import { HttpError } from '../utils/routeHelpers'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1'
const G_PER_OZ = 28.3495

// Standard USDA FDC nutrient IDs
const NID_ENERGY  = 1008  // Energy (kcal)
const NID_PROTEIN = 1003  // Protein (g)
const NID_FAT     = 1004  // Total lipid / fat (g)
const NID_CARBS   = 1005  // Carbohydrate, by difference (g)

export interface MacroResult {
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
  weightOz: number
  note: string
}

interface FdcNutrient { nutrientId: number; value: number }
interface FdcFood {
  description: string
  brandOwner?: string
  servingSize?: number
  servingSizeUnit?: string
  dataType?: string
  foodNutrients: FdcNutrient[]
}
interface FdcSearchResponse { foods?: FdcFood[] }

function nutrientPer100g(nutrients: FdcNutrient[], id: number): number {
  return nutrients.find(n => n.nutrientId === id)?.value ?? 0
}

// Normalize the user's casual description to a canonical product name so
// the FDC string-search returns relevant candidates.
async function normalizeQuery(name: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      system: 'Convert casual food descriptions to canonical product names as they appear on nutrition labels or in grocery databases. Return only the product name, nothing else.',
      messages: [{ role: 'user', content: name }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    return text || name
  } catch {
    return name
  }
}

const DEFAULT_SERVING_G = 100

function foodToResult(food: FdcFood): MacroResult {
  const servingG = food.servingSizeUnit === 'g' && food.servingSize ? food.servingSize : DEFAULT_SERVING_G
  const scale    = servingG / DEFAULT_SERVING_G
  return {
    kcal:     Math.round(nutrientPer100g(food.foodNutrients, NID_ENERGY)  * scale),
    proteinG: Math.round(nutrientPer100g(food.foodNutrients, NID_PROTEIN) * scale),
    fatG:     Math.round(nutrientPer100g(food.foodNutrients, NID_FAT)     * scale),
    carbsG:   Math.round(nutrientPer100g(food.foodNutrients, NID_CARBS)   * scale),
    weightOz: Number((servingG / G_PER_OZ).toFixed(1)),
    note:     [food.description, food.brandOwner, `${Math.round(servingG)}g serving`]
      .filter(Boolean).join(' · '),
  }
}

export async function lookupFoodMacros(name: string): Promise<MacroResult[]> {
  const apiKey = process.env.USDA_FDC_API_KEY
  if (!apiKey) throw new HttpError(503, 'USDA_FDC_API_KEY is not configured')

  const query = await normalizeQuery(name)

  const url = `${FDC_BASE}/foods/search?query=${encodeURIComponent(query)}&api_key=${apiKey}&pageSize=5`
  const res  = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new HttpError(502, `USDA FDC returned ${res.status}`)

  const data = await res.json() as FdcSearchResponse
  if (!data.foods?.length) throw new HttpError(404, `No nutrition data found for "${name}"`)

  return data.foods.map(foodToResult)
}
