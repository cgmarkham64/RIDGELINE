import { Router } from 'express'
import { Trip } from '../models/Trip'

const router = Router()

router.get('/', async (_req, res) => {
  const trips = await Trip.find().populate('loadoutId').lean()
  res.json(trips)
})

router.get('/:id', async (req, res) => {
  const trip = await Trip.findById(req.params.id).populate('loadoutId').lean()
  if (!trip) return res.status(404).json({ error: 'Not found' })
  res.json(trip)
})

router.post('/', async (req, res) => {
  const trip = await Trip.create(req.body)
  res.status(201).json(trip)
})

router.put('/:id', async (req, res) => {
  const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  }).populate('loadoutId').lean()
  if (!trip) return res.status(404).json({ error: 'Not found' })
  res.json(trip)
})

router.delete('/:id', async (req, res) => {
  const trip = await Trip.findByIdAndDelete(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Not found' })
  res.status(204).send()
})

export default router
