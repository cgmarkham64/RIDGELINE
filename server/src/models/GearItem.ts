import { Schema, model } from 'mongoose'

const CATEGORIES = [
  'shelter',
  'sleep',
  'clothing',
  'footwear',
  'navigation',
  'nutrition',
  'hydration',
  'first-aid',
  'tools',
  'electronics',
  'other',
] as const

const GearItemSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, enum: CATEGORIES },
    brand: String,
    weightGrams: Number,
    isWorn: Boolean,
    notes: String,
    link: String,
  },
  { timestamps: true }
)

export const GearItem = model('GearItem', GearItemSchema)
