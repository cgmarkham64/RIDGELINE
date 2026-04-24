import { Router } from 'express'
import { GearItem } from '../models/GearItem'

const router = Router()

router.get('/', async (_req, res) => {
  const items = await GearItem.find().lean()
  res.json(items)
})

router.get('/:id', async (req, res) => {
  const item = await GearItem.findById(req.params.id).lean()
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

router.post('/', async (req, res) => {
  const item = await GearItem.create(req.body)
  res.status(201).json(item)
})

router.put('/:id', async (req, res) => {
  const item = await GearItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).lean()
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

router.delete('/:id', async (req, res) => {
  const item = await GearItem.findByIdAndDelete(req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.status(204).send()
})

export default router
