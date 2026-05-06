import { Router } from 'express'
import { Trip } from '../models/Trip'
import { User } from '../models/User'
import { JournalDay } from '../models/JournalDay'

const router = Router()

// Returns true if the requesting user can read this trip (owner or shared)
function canRead(trip: { ownerSub: string; sharedWith: string[] }, sub: string) {
  return trip.ownerSub === sub || trip.sharedWith.includes(sub)
}

router.get('/', async (req, res) => {
  try {
    const sub = req.user.sub
    const trips = await Trip.find({
      $or: [{ ownerSub: sub }, { sharedWith: sub }],
    })
      .populate('loadoutId')
      .lean()
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
    if (!canRead(trip as any, req.user.sub)) return res.status(403).json({ error: 'Forbidden' })
    res.json(trip)
  } catch (err) {
    console.error('GET /trips/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const trip = await Trip.create({ ...req.body, ownerSub: req.user.sub, sharedWith: [] })
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
    if (trip.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })

    // Separate Mixed array fields — Mongoose's set() recursively casts array
    // elements and mangles nested GeoJSON { type } keys. Write them directly
    // via the MongoDB driver instead.
    const { gpxTracks, waypoints, ...rest } = req.body as Record<string, unknown>

    // Never allow ownerSub to be overwritten via PUT
    delete (rest as any).ownerSub

    trip.set(rest)
    if ('gpxPlanned' in rest) trip.markModified('gpxPlanned')
    await trip.save()

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

router.post('/:id/share', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
    if (!trip) return res.status(404).json({ error: 'Not found' })
    if (trip.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })

    const { sub } = req.body
    if (!sub) return res.status(400).json({ error: 'sub required' })
    if (sub === req.user.sub) return res.status(400).json({ error: 'Cannot share with yourself' })

    const target = await User.findOne({ sub }).lean()
    if (!target) return res.status(404).json({ error: 'User not found' })

    if (!trip.sharedWith.includes(sub)) {
      trip.sharedWith.push(sub)
      await trip.save()
    }
    res.json({ ok: true, name: target.name })
  } catch (err) {
    console.error('POST /trips/:id/share error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
    if (!trip) return res.status(404).json({ error: 'Not found' })
    if (trip.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
    await trip.deleteOne()
    await JournalDay.deleteMany({ tripId: req.params.id })
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /trips/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router