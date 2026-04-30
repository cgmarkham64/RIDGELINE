import { Schema, model } from 'mongoose'

interface IUser {
  sub: string        // UUID — stable identifier used in all documents; survives Keycloak migration
  email: string
  name: string
  passwordHash: string
  avatarUrl?: string // base64 data URL, max ~5MB raw (~6.7MB as base64)
}

const userSchema = new Schema<IUser>(
  {
    sub: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
)

export const User = model<IUser>('User', userSchema)