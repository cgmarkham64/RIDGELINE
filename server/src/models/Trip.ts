import { Schema, model } from 'mongoose'

const TripSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: String,
    distanceMiles: Number,
    elevationGainFt: Number,
    gpxFileUrl: String,
    gpxPlanned: Schema.Types.Mixed,
    gpxTracks: Schema.Types.Mixed,
    waypoints: Schema.Types.Mixed,
    coverPhotoId: String,
    loadoutId: { type: Schema.Types.ObjectId, ref: 'Loadout' },
    planStages: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['planning', 'ready', 'on-trail', 'wrap-up', 'complete'], default: 'complete' },
    ownerSub: { type: String, required: true, index: true },
    // Mixed rather than a typed subdocument — normalizeShared() in trips.ts handles
    // both legacy string entries and the new { sub, role } shape.
    sharedWith: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export const Trip = model('Trip', TripSchema)
