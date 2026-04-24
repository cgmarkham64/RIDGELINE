import { Router } from 'express'
import { Trip } from '../models/Trip'
import { JournalDay } from '../models/JournalDay'

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

    // Separate Mixed array fields — Mongoose's set() recursively casts array
    // elements and mangles nested GeoJSON { type } keys. Write them directly
    // via the MongoDB driver instead.
    const { gpxTracks, waypoints, ...rest } = req.body as Record<string, unknown>

    // Use doc.set() for all scalar / non-array-Mixed fields.
    trip.set(rest)
    if ('gpxPlanned' in rest) trip.markModified('gpxPlanned')
    await trip.save()

    // Write Mixed arrays directly, bypassing Mongoose casting.
    const directUpdate: Record<string, unknown> = {}
    if ('gpxTracks' in req.body) directUpdate.gpxTracks = gpxTracks
    if ('waypoints' in req.body) directUpdate.waypoints = waypoints
    if (Object.keys(directUpdate).length > 0) {
      await Trip.collection.updateOne({ _id: trip._id }, { $set: directUpdate })
    }

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
    await JournalDay.deleteMany({ tripId: req.params.id })
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /trips/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
