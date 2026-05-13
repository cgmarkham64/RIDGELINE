import { Schema, model } from 'mongoose'

const PlanSchema = new Schema(
  {
    ownerSub: { type: String, required: true, index: true },
    meta: {
      title:     { type: String, default: '' },
      location:  { type: String, default: '' },
      dateRange: { type: String, default: '' },
      miles:     { type: Number, default: null },
      elev:      { type: String, default: '' },
      days:      { type: Number, default: 0 },
      weight:    { type: String, default: '' },
    },
    // All six stage payloads stored as a single flexible document
    stages: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

export const Plan = model('Plan', PlanSchema)