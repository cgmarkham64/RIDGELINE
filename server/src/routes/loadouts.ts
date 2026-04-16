import { Router } from 'express'
import { Loadout } from '../models/Loadout'

const router = Router()

router.get('/', async (_req, res) => {
  const loadouts = await Loadout.find().populate('items').lean()
  res.json(loadouts)
})

router.get('/:id', async (req, res) => {
  const loadout = await Loadout.findById(req.params.id).populate('items').lean()
  if (!loadout) return res.status(404).json({ error: 'Not found' })
  res.json(loadout)
})

router.post('/', async (req, res) => {
  const loadout = await Loadout.create(req.body)
  res.status(201).json(loadout)
})

router.put('/:id', async (req, res) => {
  const loadout = await Loadout.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  }).populate('items').lean()
  if (!loadout) return res.status(404).json({ error: 'Not found' })
  res.json(loadout)
})

router.delete('/:id', async (req, res) => {
  const loadout = await Loadout.findByIdAndDelete(req.params.id)
  if (!loadout) return res.status(404).json({ error: 'Not found' })
  res.status(204).send()
})

export default router
