import { Router, Response } from 'express'
import { JournalDay } from '../models/JournalDay'
import { Trip } from '../models/Trip'

const router = Router()

type TripLean = { ownerSub: string; sharedWith: string[] } | null

async function getTripForRead(tripId: string, sub: string, res: Response): Promise<TripLean> {
  const trip = await Trip.findById(tripId).lean() as TripLean
  if (!trip) { res.status(404).json({ error: 'Trip not found' }); return null }
  if (trip.ownerSub !== sub && !trip.sharedWith.includes(sub)) {
    res.status(403).json({ error: 'Forbidden' }); return null
  }
  return trip
}

async function getTripForWrite(tripId: string, sub: string, res: Response): Promise<TripLean> {
  const trip = await Trip.findById(tripId).lean() as TripLean
  if (!trip) { res.status(404).json({ error: 'Trip not found' }); return null }
  if (trip.ownerSub !== sub) { res.status(403).json({ error: 'Forbidden' }); return null }
  return trip
}

router.get('/', async (req, res) => {
  const { tripId } = req.query
  if (!tripId) return res.status(400).json({ error: 'tripId required' })
  const trip = await getTripForRead(tripId as string, req.user.sub, res)
  if (!trip) return
  const days = await JournalDay.find({ tripId }).sort({ dayNumber: 1 }).lean()
  res.json(days)
})

router.post('/', async (req, res) => {
  const { tripId } = req.body
  if (!tripId) return res.status(400).json({ error: 'tripId required' })
  const trip = await getTripForWrite(tripId, req.user.sub, res)
  if (!trip) return
  const day = await JournalDay.create(req.body)
  res.status(201).json(day)
})

router.put('/:id', async (req, res) => {
  const day = await JournalDay.findById(req.params.id).lean()
  if (!day) return res.status(404).json({ error: 'Not found' })
  const trip = await getTripForWrite(String(day.tripId), req.user.sub, res)
  if (!trip) return
  const updated = await JournalDay.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).lean()
  res.json(updated)
})

router.delete('/:id', async (req, res) => {
  const day = await JournalDay.findById(req.params.id).lean()
  if (!day) return res.status(404).json({ error: 'Not found' })
  const trip = await getTripForWrite(String(day.tripId), req.user.sub, res)
  if (!trip) return
  await JournalDay.findByIdAndDelete(req.params.id)
  res.status(204).send()
})

export default router