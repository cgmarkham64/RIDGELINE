import { Router } from 'express'
import { JournalDay } from '../models/JournalDay'

const router = Router()

router.get('/', async (req, res) => {
  const { tripId } = req.query
  if (!tripId) return res.status(400).json({ error: 'tripId required' })
  const days = await JournalDay.find({ tripId }).sort({ dayNumber: 1 }).lean()
  res.json(days)
})

router.post('/', async (req, res) => {
  const day = await JournalDay.create(req.body)
  res.status(201).json(day)
})

router.put('/:id', async (req, res) => {
  const day = await JournalDay.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).lean()
  if (!day) return res.status(404).json({ error: 'Not found' })
  res.json(day)
})

router.delete('/:id', async (req, res) => {
  const day = await JournalDay.findByIdAndDelete(req.params.id)
  if (!day) return res.status(404).json({ error: 'Not found' })
  res.status(204).send()
})

export default router