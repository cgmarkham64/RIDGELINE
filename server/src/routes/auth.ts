import { Router } from 'express'
import { UserProfile } from '../models/UserProfile'

const router = Router()

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

// GET /me — syncs name + email from the Keycloak token into UserProfile on every call,
// then returns the profile (which adds avatarUrl stored app-side).
router.get('/me', async (req, res) => {
  try {
    const { sub, name, email } = req.user
    const profile = await UserProfile.findOneAndUpdate(
      { sub },
      { $set: { name, email } },
      { upsert: true, new: true }
    )
    res.json({ user: { id: sub, email, name, avatarUrl: profile.avatarUrl ?? null } })
  } catch (err) {
    console.error('GET /auth/me error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/me/avatar', async (req, res) => {
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
    const { sub, name, email } = req.user
    const profile = await UserProfile.findOneAndUpdate(
      { sub },
      { $set: { avatarUrl: avatarDataUrl, name, email } },
      { upsert: true, new: true }
    )
    res.json({ user: { id: sub, email, name, avatarUrl: profile.avatarUrl ?? null } })
  } catch (err) {
    console.error('PUT /auth/me/avatar error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/me/avatar', async (req, res) => {
  try {
    const { sub, name, email } = req.user
    await UserProfile.findOneAndUpdate(
      { sub },
      { $unset: { avatarUrl: '' }, $set: { name, email } },
      { upsert: true }
    )
    res.json({ user: { id: sub, email, name, avatarUrl: null } })
  } catch (err) {
    console.error('DELETE /auth/me/avatar error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router