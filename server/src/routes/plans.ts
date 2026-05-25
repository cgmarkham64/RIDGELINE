import { Router } from 'express'
import { Types } from 'mongoose'
import { Plan } from '../models/Plan'
import { asyncRoute, requireOwner, HttpError } from '../utils/routeHelpers'

const router = Router()

function validId(id: string) {
  return Types.ObjectId.isValid(id)
}

router.get('/', asyncRoute(async (req, res) => {
  const plans = await Plan.find({ ownerSub: req.user.sub }).sort({ updatedAt: -1 }).lean()
  res.json(plans)
}))

router.post('/', asyncRoute(async (req, res) => {
  const plan = await Plan.create({
    ownerSub: req.user.sub,
    meta:   req.body.meta   ?? {},
    stages: req.body.stages ?? {},
  })
  res.status(201).json(plan)
}))

router.get('/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) throw new HttpError(400, 'Invalid id')
  const plan = await Plan.findById(req.params.id).lean<{ ownerSub: string }>()
  if (!plan) throw new HttpError(404, 'Not found')
  requireOwner(plan.ownerSub, req.user.sub)
  res.json(plan)
}))

router.put('/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) throw new HttpError(400, 'Invalid id')
  const plan = await Plan.findById(req.params.id)
  if (!plan) throw new HttpError(404, 'Not found')
  requireOwner(plan.ownerSub, req.user.sub)
  if (req.body.meta   !== undefined) { plan.meta   = req.body.meta;   plan.markModified('meta') }
  if (req.body.stages !== undefined) { plan.stages = req.body.stages; plan.markModified('stages') }
  await plan.save()
  res.json(plan)
}))

router.delete('/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) throw new HttpError(400, 'Invalid id')
  const plan = await Plan.findById(req.params.id)
  if (!plan) throw new HttpError(404, 'Not found')
  requireOwner(plan.ownerSub, req.user.sub)
  await plan.deleteOne()
  res.status(204).end()
}))

export default router