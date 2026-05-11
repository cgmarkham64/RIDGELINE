import { Router } from 'express'
import { Trip } from '../models/Trip'
import { UserProfile } from '../models/UserProfile'
import { JournalDay } from '../models/JournalDay'
import { Notification } from '../models/Notification'

const router = Router()

// Returns true if the requesting user can read this trip (owner or shared)
function canRead(trip: { ownerSub: string; sharedWith: string[] }, sub: string) {
  return trip.ownerSub === sub || trip.sharedWith.includes(sub)
}

interface TripLean extends Record<string, unknown> {
  ownerSub: string
  sharedWith: string[]
}

// Populates sharedWith as { sub, name }[] and adds ownerName — single User query covers both
async function populateTripUsers(trip: TripLean) {
  const subs: string[] = trip.sharedWith ?? []
  const toFetch = [...new Set([...subs, trip.ownerSub].filter(Boolean))]
  const users = toFetch.length
    ? await UserProfile.find({ sub: { $in: toFetch } }).select('sub name').lean<{ sub: string; name: string }[]>()
    : []
  const owner = users.find((u) => u.sub === trip.ownerSub)
  return {
    ...trip,
    ownerName: owner?.name ?? 'Unknown',
    sharedWith: subs.map((s) => {
      const u = users.find((u) => u.sub === s)
      return u ? { sub: u.sub, name: u.name } : { sub: s, name: 'Unknown' }
    }),
  }
}

router.get('/', async (req, res) => {
  try {
    const sub = req.user.sub
    const trips = await Trip.find({
      $or: [{ ownerSub: sub }, { sharedWith: sub }],
    })
      .populate('loadoutId')
      .lean()
    const populated = await Promise.all(trips.map(populateTripUsers))
    res.json(populated)
  } catch (err) {
    console.error('GET /trips error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('loadoutId').lean()
    if (!trip) return res.status(404).json({ error: 'Not found' })
    if (!canRead(trip as TripLean, req.user.sub)) return res.status(403).json({ error: 'Forbidden' })
    res.json(await populateTripUsers(trip as TripLean))
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
    if (!canRead(trip as TripLean, req.user.sub)) return res.status(403).json({ error: 'Forbidden' })

    // Separate Mixed array fields — Mongoose's set() recursively casts array
    // elements and mangles nested GeoJSON { type } keys. Write them directly
    // via the MongoDB driver instead.
    const { gpxTracks, waypoints, ...rest } = req.body as Record<string, unknown>

    // Only the owner may change ownership or collaborator list
    delete rest.ownerSub
    if (trip.ownerSub !== req.user.sub) delete rest.sharedWith

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
    res.json(await populateTripUsers(result))
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

    const target = await UserProfile.findOne({ sub }).lean()
    if (!target) return res.status(404).json({ error: 'User not found' })

    // Already has access — no-op
    if (trip.sharedWith.includes(sub)) return res.json({ ok: true, name: target.name })

    // Avoid duplicate pending invites
    const existing = await Notification.findOne({
      toSub: sub, fromSub: req.user.sub, tripId: trip._id.toString(),
      type: 'trip_share_invite', status: 'pending',
    })
    if (!existing) {
      await Notification.create({
        toSub: sub,
        fromSub: req.user.sub,
        fromName: req.user.name,
        type: 'trip_share_invite',
        tripId: trip._id.toString(),
        tripTitle: trip.title,
      })
    }

    res.json({ ok: true, name: target.name })
  } catch (err) {
    console.error('POST /trips/:id/share error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id/leave', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
    if (!trip) return res.status(404).json({ error: 'Not found' })
    if (trip.ownerSub === req.user.sub) return res.status(400).json({ error: 'Owner cannot leave their own trip' })
    if (!trip.sharedWith.includes(req.user.sub)) return res.status(400).json({ error: 'Not a collaborator' })

    trip.sharedWith = (trip.sharedWith as string[]).filter((s) => s !== req.user.sub)
    await trip.save()
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /trips/:id/leave error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id/share/:sub', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
    if (!trip) return res.status(404).json({ error: 'Not found' })
    if (trip.ownerSub !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })

    trip.sharedWith = (trip.sharedWith as string[]).filter((s) => s !== req.params.sub)
    await trip.save()

    // Cancel any pending invite so the removed user can't accept it after revocation
    await Notification.deleteMany({
      toSub: req.params.sub,
      tripId: req.params.id,
      type: 'trip_share_invite',
      status: 'pending',
    })

    res.status(204).send()
  } catch (err) {
    console.error('DELETE /trips/:id/share/:sub error:', err)
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