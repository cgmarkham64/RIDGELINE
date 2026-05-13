import { Router } from 'express'
import { Types } from 'mongoose'
import { Plan } from '../models/Plan'

const router = Router()

function validId(id: string) {
  return Types.ObjectId.isValid(id)
}

router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find({ ownerSub: req.user.sub }).sort({ updatedAt: -1 }).lean()
    res.json(plans)
  } catch (err) {
    console.error('GET /plans error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const plan = await Plan.create({
      ownerSub: req.user.sub,
      meta:   req.body.meta   ?? {},
      stages: req.body.stages ?? {},
    })
    res.status(201).json(plan)
  } catch (err) {
    console.error('POST /plans error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    const plan = await Plan.findById(req.params.id).lean<{ ownerSub: string }>()
    if (!plan) return res.status(404).json({ error: 'Not found' })
    if (plan.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
    res.json(plan)
  } catch (err) {
    console.error('GET /plans/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    const plan = await Plan.findById(req.params.id)
    if (!plan) return res.status(404).json({ error: 'Not found' })
    if (plan.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
    if (req.body.meta   !== undefined) { plan.meta   = req.body.meta;   plan.markModified('meta') }
    if (req.body.stages !== undefined) { plan.stages = req.body.stages; plan.markModified('stages') }
    await plan.save()
    res.json(plan)
  } catch (err) {
    console.error('PUT /plans/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    const plan = await Plan.findById(req.params.id)
    if (!plan) return res.status(404).json({ error: 'Not found' })
    if (plan.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
    await plan.deleteOne()
    res.status(204).end()
  } catch (err) {
    console.error('DELETE /plans/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router