import { Schema, model } from 'mongoose'

const LoadoutSchema = new Schema(
  {
    name:        { type: String, required: true },
    description: String,
    items:       [{ type: Schema.Types.ObjectId, ref: 'GearItem' }],
  },
  { timestamps: true }
)

export const Loadout = model('Loadout', LoadoutSchema)
