import { Router } from 'express'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { LocalUser } from '../models/LocalUser'
import { UserProfile } from '../models/UserProfile'
import { asyncRoute, HttpError, formatUserResponse } from '../utils/routeHelpers'

const router = Router()

const MIN_PASSWORD_LENGTH = 8
const MS_PER_MINUTE = 60_000
const BCRYPT_SALT_ROUNDS = 10

const LOGIN_WINDOW_MINUTES = 15
const LOGIN_MAX_ATTEMPTS = 10

const REGISTER_WINDOW_MINUTES = 60
const REGISTER_MAX_ATTEMPTS = 5

const loginLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MINUTES * MS_PER_MINUTE,
  max: LOGIN_MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts — try again in 15 minutes' },
})

const registerLimiter = rateLimit({
  windowMs: REGISTER_WINDOW_MINUTES * MS_PER_MINUTE,
  max: REGISTER_MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this address — try again in an hour' },
})

function signToken(sub: string, email: string, name: string): string {
  return jwt.sign({ sub, email, name }, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

router.post('/register', registerLimiter, asyncRoute(async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) throw new HttpError(400, 'name, email, and password are required')
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }

  const existing = await LocalUser.findOne({ email: email.toLowerCase() })
  if (existing) throw new HttpError(409, 'Email already registered')

  const sub = randomUUID()
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
  await LocalUser.create({ sub, email: email.toLowerCase(), name, passwordHash })
  await UserProfile.findOneAndUpdate(
    { sub },
    { $set: { name, email: email.toLowerCase() } },
    { upsert: true }
  )
  const token = signToken(sub, email.toLowerCase(), name)
  res.status(201).json({ token, user: formatUserResponse(sub, email.toLowerCase(), name) })
}))

router.post('/login', loginLimiter, asyncRoute(async (req, res) => {
  const { email, password } = req.body
  const localUser = await LocalUser.findOne({ email: email?.toLowerCase() })
  if (!localUser || !(await bcrypt.compare(password ?? '', localUser.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password')
  }
  const profile = await UserProfile.findOne({ sub: localUser.sub })
  const token = signToken(localUser.sub, localUser.email, localUser.name)
  res.json({ token, user: formatUserResponse(localUser.sub, localUser.email, localUser.name, profile) })
}))

export default router