import { Schema, model } from 'mongoose'

const TripSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, required: true },
    distanceMiles: Number,
    elevationGainFt: Number,
    gpxFileUrl: String,
    gpxPlanned: Schema.Types.Mixed,
    gpxTracks: Schema.Types.Mixed,
    waypoints: Schema.Types.Mixed,
    coverPhotoId: String,
    loadoutId: { type: Schema.Types.ObjectId, ref: 'Loadout' },
    status: { type: String, enum: ['planning', 'ready', 'on-trail', 'wrap-up', 'complete'], default: 'complete' },
    ownerSub: { type: String, required: true, index: true },
    sharedWith: { type: [String], default: [] },
  },
  { timestamps: true }
)

export const Trip = model('Trip', TripSchema)
