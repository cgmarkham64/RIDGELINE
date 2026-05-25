import { Router } from 'express'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { LocalUser } from '../models/LocalUser'
import { UserProfile } from '../models/UserProfile'
import { asyncRoute, HttpError } from '../utils/routeHelpers'

const router = Router()

router.post('/register', asyncRoute(async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) throw new HttpError(400, 'name, email, and password are required')

  const existing = await LocalUser.findOne({ email: email.toLowerCase() })
  if (existing) throw new HttpError(409, 'Email already registered')

  const sub = randomUUID()
  const passwordHash = await bcrypt.hash(password, 10)
  await LocalUser.create({ sub, email: email.toLowerCase(), name, passwordHash })
  await UserProfile.findOneAndUpdate(
    { sub },
    { $set: { name, email: email.toLowerCase() } },
    { upsert: true }
  )
  const secret = process.env.JWT_SECRET!
  const token = jwt.sign({ sub, email: email.toLowerCase(), name }, secret, { expiresIn: '7d' })
  res.status(201).json({ token, user: { id: sub, email: email.toLowerCase(), name, avatarUrl: null } })
}))

router.post('/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body
  const localUser = await LocalUser.findOne({ email: email?.toLowerCase() })
  if (!localUser || !(await bcrypt.compare(password ?? '', localUser.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password')
  }
  const profile = await UserProfile.findOne({ sub: localUser.sub })
  const secret = process.env.JWT_SECRET!
  const token = jwt.sign(
    { sub: localUser.sub, email: localUser.email, name: localUser.name },
    secret,
    { expiresIn: '7d' }
  )
  res.json({
    token,
    user: {
      id: localUser.sub,
      email: localUser.email,
      name: localUser.name,
      avatarUrl: profile?.avatarUrl ?? null,
    },
  })
}))

export default router