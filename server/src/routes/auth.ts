import { Router } from 'express'
import { UserProfile } from '../models/UserProfile'
import { asyncRoute, HttpError, formatUserResponse } from '../utils/routeHelpers'

const router = Router()

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

// GET /me — syncs name + email from the token into UserProfile on every call,
// then returns the profile (which adds avatarUrl stored app-side).
router.get('/me', asyncRoute(async (req, res) => {
  const { sub, name, email } = req.user
  const profile = await UserProfile.findOneAndUpdate(
    { sub },
    { $set: { name, email } },
    { upsert: true, new: true }
  )
  res.json({ user: formatUserResponse(sub, email, name, profile) })
}))

router.put('/me/avatar', asyncRoute(async (req, res) => {
  const { avatarDataUrl } = req.body
  if (typeof avatarDataUrl !== 'string' || !avatarDataUrl.startsWith('data:image/')) {
    throw new HttpError(400, 'avatarDataUrl must be a valid image data URL')
  }
  // Estimate raw byte size from base64 payload length
  const base64 = avatarDataUrl.split(',')[1] ?? ''
  const rawBytes = Math.ceil(base64.length * 0.75)
  if (rawBytes > MAX_AVATAR_BYTES) throw new HttpError(413, 'Image exceeds 5 MB limit')
  const { sub, name, email } = req.user
  const profile = await UserProfile.findOneAndUpdate(
    { sub },
    { $set: { avatarUrl: avatarDataUrl, name, email } },
    { upsert: true, new: true }
  )
  res.json({ user: formatUserResponse(sub, email, name, profile) })
}))

router.delete('/me/avatar', asyncRoute(async (req, res) => {
  const { sub, name, email } = req.user
  await UserProfile.findOneAndUpdate(
    { sub },
    { $unset: { avatarUrl: '' }, $set: { name, email } },
    { upsert: true }
  )
  res.json({ user: formatUserResponse(sub, email, name) })
}))

export default router