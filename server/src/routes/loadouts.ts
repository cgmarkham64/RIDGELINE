import { Router } from 'express'
import { Loadout } from '../models/Loadout'

const router = Router()

router.get('/', async (req, res) => {
  const loadouts = await Loadout.find({ ownerSub: req.user.sub }).populate('items').lean()
  res.json(loadouts)
})

router.get('/:id', async (req, res) => {
  const loadout = await Loadout.findById(req.params.id).populate('items').lean() as any
  if (!loadout) return res.status(404).json({ error: 'Not found' })
  if (loadout.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
  res.json(loadout)
})

router.post('/', async (req, res) => {
  const loadout = await Loadout.create({ ...req.body, ownerSub: req.user.sub })
  res.status(201).json(loadout)
})

router.put('/:id', async (req, res) => {
  const loadout = await Loadout.findById(req.params.id).lean() as any
  if (!loadout) return res.status(404).json({ error: 'Not found' })
  if (loadout.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
  const { ownerSub: _, ...rest } = req.body
  const updated = await Loadout.findByIdAndUpdate(req.params.id, rest, {
    new: true,
    runValidators: true,
  })
    .populate('items')
    .lean()
  res.json(updated)
})

router.delete('/:id', async (req, res) => {
  const loadout = await Loadout.findById(req.params.id).lean() as any
  if (!loadout) return res.status(404).json({ error: 'Not found' })
  if (loadout.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
  await Loadout.findByIdAndDelete(req.params.id)
  res.status(204).send()
})

export default router