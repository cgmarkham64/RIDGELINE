import { Router } from 'express'
import { Trip } from '../models/Trip'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const trips = await Trip.find().populate('loadoutId').lean()
    res.json(trips)
  } catch (err) {
    console.error('GET /trips error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('loadoutId').lean()
    if (!trip) return res.status(404).json({ error: 'Not found' })
    res.json(trip)
  } catch (err) {
    console.error('GET /trips/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const trip = await Trip.create(req.body)
    res.status(201).json(trip)
  } catch (err) {
    console.error('POST /trips error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
    if (!trip) return res.status(404).json({ error: 'Not found' })

    // Use doc.set() instead of Object.assign — Object.assign creates own
    // properties that shadow Mongoose's prototype setters, so changes never
    // register and save() silently skips them.
    trip.set(req.body)

    // Mixed fields (GeoJSON) still need explicit markModified because Mongoose
    // can't diff arbitrary objects to detect changes.
    if ('gpxPlanned' in req.body) trip.markModified('gpxPlanned')
    if ('gpxTrack' in req.body) trip.markModified('gpxTrack')

    await trip.save()
    const result = await Trip.findById(trip._id).populate('loadoutId').lean()
    res.json(result)
  } catch (err) {
    console.error('PUT /trips/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id)
    if (!trip) return res.status(404).json({ error: 'Not found' })
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /trips/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
