import { Schema, model } from 'mongoose'

const LoadoutSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    items: [{ type: Schema.Types.ObjectId, ref: 'GearItem' }],
    ownerSub: { type: String, required: true, index: true },
  },
  { timestamps: true }
)

export const Loadout = model('Loadout', LoadoutSchema)
