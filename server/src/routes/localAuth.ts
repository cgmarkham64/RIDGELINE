import { Router } from 'express'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { LocalUser } from '../models/LocalUser'
import { UserProfile } from '../models/UserProfile'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email, and password are required' }); return
    }
    const existing = await LocalUser.findOne({ email: email.toLowerCase() })
    if (existing) {
      res.status(409).json({ error: 'Email already registered' }); return
    }
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
  } catch (err) {
    console.error('POST /auth/register error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const localUser = await LocalUser.findOne({ email: email?.toLowerCase() })
    if (!localUser || !(await bcrypt.compare(password ?? '', localUser.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password' }); return
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
  } catch (err) {
    console.error('POST /auth/login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router