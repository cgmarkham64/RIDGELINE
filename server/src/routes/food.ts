import { Router } from 'express'
import { asyncRoute, HttpError } from '../utils/routeHelpers'
import { lookupFoodMacros } from '../services/foodMacrosService'

const router = Router()

router.post('/macros', asyncRoute(async (req, res) => {
  const { name } = req.body as { name?: string }
  if (!name?.trim()) throw new HttpError(400, 'name is required')
  res.json(await lookupFoodMacros(name.trim()))
}))

export default router
