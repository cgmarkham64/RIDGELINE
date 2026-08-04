import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { UserProfile } from '../models/UserProfile'
import { asyncRoute } from '../utils/routeHelpers'

const router = Router()

const searchLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many searches — try again in a minute' },
})

// GET /api/users/search?q=<query>
// Returns up to 8 users matching name or email (case-insensitive). Excludes the caller.
// Email is intentionally omitted from results to prevent harvesting.
router.get('/search', searchLimiter, asyncRoute(async (req, res) => {
  const { q } = req.query
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.json([])
  }
  const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'i')
  const users = await UserProfile.find({
    sub: { $ne: req.user.sub },
    $or: [{ name: regex }, { email: regex }],
  })
    .select('sub name')
    .limit(8)
    .lean()
  res.json(users)
}))

export default router