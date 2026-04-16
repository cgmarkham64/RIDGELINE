import { Schema, model, Types } from 'mongoose'

const JournalDaySchema = new Schema(
  {
    tripId:         { type: Types.ObjectId, ref: 'Trip', required: true },
    date:           { type: Date, required: true },
    dayNumber:      { type: Number, required: true },
    title:          String,
    body:           { type: String, default: '' },
    milesCovered:   Number,
    elevationGainFt: Number,
    weatherNotes:   String,
    temperatureF:   Number,
  },
  { timestamps: true }
)

// One entry per trip per day
JournalDaySchema.index({ tripId: 1, date: 1 }, { unique: true })

export const JournalDay = model('JournalDay', JournalDaySchema)