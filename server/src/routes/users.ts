import { Router } from 'express'
import { User } from '../models/User'

const router = Router()

// GET /api/users/search?q=<query>
// Returns up to 8 users matching name or email (case-insensitive). Excludes the caller.
router.get('/search', async (req, res) => {
  const { q } = req.query
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.json([])
  }
  const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'i')
  const users = await User.find({
    sub: { $ne: req.user.sub },
    $or: [{ name: regex }, { email: regex }],
  })
    .select('sub name email')
    .limit(8)
    .lean()
  res.json(users)
})

export default router