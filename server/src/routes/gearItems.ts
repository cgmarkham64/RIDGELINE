import { Router } from 'express'
import { GearItem } from '../models/GearItem'
import { asyncRoute, requireOwner, HttpError } from '../utils/routeHelpers'

const router = Router()

router.get('/', asyncRoute(async (req, res) => {
  const items = await GearItem.find({ ownerSub: req.user.sub }).lean()
  res.json(items)
}))

router.get('/:id', asyncRoute(async (req, res) => {
  const item = await GearItem.findById(req.params.id).lean() as { ownerSub: string } | null
  if (!item) throw new HttpError(404, 'Not found')
  requireOwner(item.ownerSub, req.user.sub)
  res.json(item)
}))

router.post('/', asyncRoute(async (req, res) => {
  const item = await GearItem.create({ ...req.body, ownerSub: req.user.sub })
  res.status(201).json(item)
}))

router.put('/:id', asyncRoute(async (req, res) => {
  const item = await GearItem.findById(req.params.id).lean() as { ownerSub: string } | null
  if (!item) throw new HttpError(404, 'Not found')
  requireOwner(item.ownerSub, req.user.sub)
  const rest = { ...(req.body as Record<string, unknown>) }
  delete rest.ownerSub
  const updated = await GearItem.findByIdAndUpdate(req.params.id, rest, {
    new: true,
    runValidators: true,
  }).lean()
  res.json(updated)
}))

router.delete('/:id', asyncRoute(async (req, res) => {
  const item = await GearItem.findById(req.params.id).lean() as { ownerSub: string } | null
  if (!item) throw new HttpError(404, 'Not found')
  requireOwner(item.ownerSub, req.user.sub)
  await GearItem.findByIdAndDelete(req.params.id)
  res.status(204).send()
}))

export default router