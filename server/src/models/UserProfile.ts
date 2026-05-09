import { Schema, model } from 'mongoose'

interface IUserProfile {
  sub: string
  name: string
  email: string
  avatarUrl?: string
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    sub:      { type: String, required: true, unique: true, index: true },
    name:     { type: String, required: true },
    email:    { type: String, required: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
)

export const UserProfile = model<IUserProfile>('UserProfile', UserProfileSchema)