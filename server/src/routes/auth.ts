import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { User } from '../models/User'
import { requireAuth } from '../middleware/auth'

const router = Router()

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB raw

function signToken(sub: string, email: string, name: string) {
  return jwt.sign({ sub, email, name }, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

function userPayload(user: { sub: string; email: string; name: string; avatarUrl?: string }) {
  return { id: user.sub, email: user.email, name: user.name, avatarUrl: user.avatarUrl ?? null }
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email, and password are required' }); return
    }
    if (await User.findOne({ email })) {
      res.status(409).json({ error: 'Email already registered' }); return
    }
    const sub = randomUUID()
    const passwordHash = await bcrypt.hash(password, 12)
    await User.create({ sub, email, name, passwordHash })
    res.status(201).json({ token: signToken(sub, email, name), user: userPayload({ sub, email, name }) })
  } catch (err) {
    console.error('POST /auth/register error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' }); return
    }
    const user = await User.findOne({ email })
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false
    if (!user || !valid) {
      res.status(401).json({ error: 'Invalid credentials' }); return
    }
    res.json({ token: signToken(user.sub, user.email, user.name), user: userPayload(user) })
  } catch (err) {
    console.error('POST /auth/login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Current user info — used to re-hydrate avatar and profile on app load
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ sub: req.user.sub })
    if (!user) { res.status(404).json({ error: 'User not found' }); return }
    res.json({ user: userPayload(user) })
  } catch (err) {
    console.error('GET /auth/me error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update name and/or password — re-signs token when name changes
router.put('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ sub: req.user.sub })
    if (!user) { res.status(404).json({ error: 'User not found' }); return }

    const { name, currentPassword, newPassword } = req.body

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'Name cannot be empty' }); return
      }
      user.name = name.trim()
    }

    if (newPassword !== undefined) {
      if (!currentPassword) {
        res.status(400).json({ error: 'currentPassword is required to set a new password' }); return
      }
      if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
        res.status(401).json({ error: 'Current password is incorrect' }); return
      }
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters' }); return
      }
      user.passwordHash = await bcrypt.hash(newPassword, 12)
    }

    await user.save()
    res.json({ token: signToken(user.sub, user.email, user.name), user: userPayload(user) })
  } catch (err) {
    console.error('PUT /auth/me error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload avatar — accepts a base64 data URL, validates raw size ≤ 5 MB
router.put('/me/avatar', requireAuth, async (req, res) => {
  try {
    const { avatarDataUrl } = req.body
    if (typeof avatarDataUrl !== 'string' || !avatarDataUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'avatarDataUrl must be a valid image data URL' }); return
    }
    // Estimate raw byte size from base64 payload length
    const base64 = avatarDataUrl.split(',')[1] ?? ''
    const rawBytes = Math.ceil(base64.length * 0.75)
    if (rawBytes > MAX_AVATAR_BYTES) {
      res.status(413).json({ error: 'Image exceeds 5 MB limit' }); return
    }
    const user = await User.findOneAndUpdate(
      { sub: req.user.sub },
      { $set: { avatarUrl: avatarDataUrl } },
      { new: true }
    )
    if (!user) { res.status(404).json({ error: 'User not found' }); return }
    res.json({ user: userPayload(user) })
  } catch (err) {
    console.error('PUT /auth/me/avatar error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Remove avatar
router.delete('/me/avatar', requireAuth, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { sub: req.user.sub },
      { $unset: { avatarUrl: '' } },
      { new: true }
    )
    if (!user) { res.status(404).json({ error: 'User not found' }); return }
    res.json({ user: userPayload(user) })
  } catch (err) {
    console.error('DELETE /auth/me/avatar error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router