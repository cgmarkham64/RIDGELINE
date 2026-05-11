import { Router } from 'express'
import { GearItem } from '../models/GearItem'

const router = Router()

router.get('/', async (req, res) => {
  const items = await GearItem.find({ ownerSub: req.user.sub }).lean()
  res.json(items)
})

router.get('/:id', async (req, res) => {
  const item = await GearItem.findById(req.params.id).lean() as { ownerSub: string } | null
  if (!item) return res.status(404).json({ error: 'Not found' })
  if (item.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
  res.json(item)
})

router.post('/', async (req, res) => {
  const item = await GearItem.create({ ...req.body, ownerSub: req.user.sub })
  res.status(201).json(item)
})

router.put('/:id', async (req, res) => {
  const item = await GearItem.findById(req.params.id).lean() as { ownerSub: string } | null
  if (!item) return res.status(404).json({ error: 'Not found' })
  if (item.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
  const rest = { ...(req.body as Record<string, unknown>) }
  delete rest.ownerSub
  const updated = await GearItem.findByIdAndUpdate(req.params.id, rest, {
    new: true,
    runValidators: true,
  }).lean()
  res.json(updated)
})

router.delete('/:id', async (req, res) => {
  const item = await GearItem.findById(req.params.id).lean() as { ownerSub: string } | null
  if (!item) return res.status(404).json({ error: 'Not found' })
  if (item.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
  await GearItem.findByIdAndDelete(req.params.id)
  res.status(204).send()
})

export default router