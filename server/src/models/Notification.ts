import { Schema, model } from 'mongoose'

const NotificationSchema = new Schema(
  {
    toSub:     { type: String, required: true, index: true },
    fromSub:   { type: String, required: true },
    fromName:  { type: String, required: true },
    type:      { type: String, enum: ['trip_share_invite', 'invite_accepted', 'invite_declined'], required: true },
    tripId:    { type: String, required: true },
    tripTitle: { type: String, required: true },
    read:      { type: Boolean, default: false },
    status:    { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  },
  { timestamps: true }
)

export const Notification = model('Notification', NotificationSchema)