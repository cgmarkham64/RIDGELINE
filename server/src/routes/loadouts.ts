import { Router } from 'express'
import { Loadout } from '../models/Loadout'
import { asyncRoute, requireOwner, HttpError } from '../utils/routeHelpers'

const router = Router()

router.get('/', asyncRoute(async (req, res) => {
  const loadouts = await Loadout.find({ ownerSub: req.user.sub }).populate('items').lean()
  res.json(loadouts)
}))

router.get('/:id', asyncRoute(async (req, res) => {
  const loadout = await Loadout.findById(req.params.id).populate('items').lean() as { ownerSub: string } | null
  if (!loadout) throw new HttpError(404, 'Not found')
  requireOwner(loadout.ownerSub, req.user.sub)
  res.json(loadout)
}))

router.post('/', asyncRoute(async (req, res) => {
  const loadout = await Loadout.create({ ...req.body, ownerSub: req.user.sub })
  res.status(201).json(loadout)
}))

router.put('/:id', asyncRoute(async (req, res) => {
  const loadout = await Loadout.findById(req.params.id).lean() as { ownerSub: string } | null
  if (!loadout) throw new HttpError(404, 'Not found')
  requireOwner(loadout.ownerSub, req.user.sub)
  const rest = { ...(req.body as Record<string, unknown>) }
  delete rest.ownerSub
  const updated = await Loadout.findByIdAndUpdate(req.params.id, rest, {
    new: true,
    runValidators: true,
  })
    .populate('items')
    .lean()
  res.json(updated)
}))

router.delete('/:id', asyncRoute(async (req, res) => {
  const loadout = await Loadout.findById(req.params.id).lean() as { ownerSub: string } | null
  if (!loadout) throw new HttpError(404, 'Not found')
  requireOwner(loadout.ownerSub, req.user.sub)
  await Loadout.findByIdAndDelete(req.params.id)
  res.status(204).send()
}))

export default router