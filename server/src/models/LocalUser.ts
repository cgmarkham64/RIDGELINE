import { Schema, model } from 'mongoose'

// Only used in local dev mode (when KEYCLOAK_JWKS_URI is not set).
interface ILocalUser {
  sub: string
  email: string
  name: string
  passwordHash: string
}

const LocalUserSchema = new Schema<ILocalUser>(
  {
    sub:          { type: String, required: true, unique: true },
    email:        { type: String, required: true, unique: true },
    name:         { type: String, required: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
)

export const LocalUser = model<ILocalUser>('LocalUser', LocalUserSchema)