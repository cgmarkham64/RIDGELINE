import { Router } from 'express'
import { JournalDay } from '../models/JournalDay'
import { asyncRoute, HttpError } from '../utils/routeHelpers'
import { fetchTripForRead, fetchTripForWrite } from '../services/tripService'

const router = Router()

router.get('/', asyncRoute(async (req, res) => {
  const { tripId } = req.query
  if (!tripId) throw new HttpError(400, 'tripId required')
  await fetchTripForRead(tripId as string, req.user.sub)
  const days = await JournalDay.find({ tripId }).sort({ dayNumber: 1 }).lean()
  res.json(days)
}))

router.post('/', asyncRoute(async (req, res) => {
  const { tripId } = req.body
  if (!tripId) throw new HttpError(400, 'tripId required')
  await fetchTripForWrite(tripId, req.user.sub)
  const day = await JournalDay.create(req.body)
  res.status(201).json(day)
}))

router.put('/:id', asyncRoute(async (req, res) => {
  const day = await JournalDay.findById(req.params.id).lean()
  if (!day) throw new HttpError(404, 'Not found')
  await fetchTripForWrite(String(day.tripId), req.user.sub)
  const updated = await JournalDay.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).lean()
  res.json(updated)
}))

router.delete('/:id', asyncRoute(async (req, res) => {
  const day = await JournalDay.findById(req.params.id).lean()
  if (!day) throw new HttpError(404, 'Not found')
  await fetchTripForWrite(String(day.tripId), req.user.sub)
  await JournalDay.findByIdAndDelete(req.params.id)
  res.status(204).send()
}))

export default router