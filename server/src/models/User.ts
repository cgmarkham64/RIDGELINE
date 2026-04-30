import { Schema, model } from 'mongoose'

interface IUser {
  sub: string        // UUID — stable identifier used in all documents; survives Keycloak migration
  email: string
  name: string
  passwordHash: string
}

const userSchema = new Schema<IUser>(
  {
    sub: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
)

export const User = model<IUser>('User', userSchema)