import { Schema, model } from 'mongoose'

const TripSchema = new Schema(
  {
    title:          { type: String, required: true },
    description:    String,
    startDate:      { type: Date, required: true },
    endDate:        { type: Date, required: true },
    location:       { type: String, required: true },
    distanceMiles:  Number,
    elevationGainFt: Number,
    gpxFileUrl:     String,
    gpxPlanned:     Schema.Types.Mixed,
    gpxTracks:      Schema.Types.Mixed,
    coverPhotoId:   String,
    loadoutId:      { type: Schema.Types.ObjectId, ref: 'Loadout' },
  },
  { timestamps: true }
)

export const Trip = model('Trip', TripSchema)
