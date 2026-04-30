import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { User } from '../models/User'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email, and password are required' })
      return
    }
    const existing = await User.findOne({ email })
    if (existing) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }
    const sub = randomUUID()
    const passwordHash = await bcrypt.hash(password, 12)
    await User.create({ sub, email, name, passwordHash })

    const token = jwt.sign(
      { sub, email, name },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
    res.status(201).json({ token, user: { id: sub, email, name } })
  } catch (err) {
    console.error('POST /auth/register error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' })
      return
    }
    const user = await User.findOne({ email })
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false
    if (!user || !valid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    const token = jwt.sign(
      { sub: user.sub, email: user.email, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.sub, email: user.email, name: user.name } })
  } catch (err) {
    console.error('POST /auth/login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router