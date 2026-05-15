import { Router } from 'express'
import { Trip } from '../models/Trip'
import { UserProfile } from '../models/UserProfile'
import { JournalDay } from '../models/JournalDay'
import { Notification } from '../models/Notification'

const router = Router()

type SharedEntry = { sub: string; role: string }

// Normalise sharedWith — handles both old string entries and new { sub, role } objects
function normalizeShared(sw: Array<SharedEntry | string>): SharedEntry[] {
  return (sw ?? []).map((e) => (typeof e === 'string' ? { sub: e, role: 'edit' } : e))
}

// Returns true if the requesting user can read this trip (owner or shared)
function canRead(trip: { ownerSub: string; sharedWith: Array<SharedEntry | string> }, sub: string) {
  return trip.ownerSub === sub || normalizeShared(trip.sharedWith).some((e) => e.sub === sub)
}

interface TripLean extends Record<string, unknown> {
  ownerSub: string
  sharedWith: Array<SharedEntry | string>
}

// Populates sharedWith as { sub, name, role }[] and adds ownerName
async function populateTripUsers(trip: TripLean) {
  const entries = normalizeShared(trip.sharedWith)
  const toFetch = [...new Set([...entries.map((e) => e.sub), trip.ownerSub].filter(Boolean))]
  const users = toFetch.length
    ? await UserProfile.find({ sub: { $in: toFetch } }).select('sub name').lean<{ sub: string; name: string }[]>()
    : []
  const owner = users.find((u) => u.sub === trip.ownerSub)
  return {
    ...trip,
    ownerName: owner?.name ?? 'Unknown',
    sharedWith: entries.map((entry) => {
      const u = users.find((u) => u.sub === entry.sub)
      return { sub: entry.sub, name: u?.name ?? 'Unknown', role: entry.role }
    }),
  }
}

router.get('/', async (req, res) => {
  try {
    const sub = req.user.sub
    const trips = await Trip.find({
      $or: [{ ownerSub: sub }, { 'sharedWith.sub': sub }],
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
    if ('planStages' in rest) trip.markModified('planStages')
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

    const { sub, role = 'edit' } = req.body
    if (!sub) return res.status(400).json({ error: 'sub required' })
    if (!['read', 'edit'].includes(role)) return res.status(400).json({ error: 'role must be read or edit' })
    if (sub === req.user.sub) return res.status(400).json({ error: 'Cannot share with yourself' })

    const target = await UserProfile.findOne({ sub }).lean()
    if (!target) return res.status(404).json({ error: 'User not found' })

    // Already has access — no-op
    const alreadyShared = normalizeShared(trip.sharedWith as Array<SharedEntry | string>).some((e) => e.sub === sub)
    if (alreadyShared) return res.json({ ok: true, name: target.name })

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
        role,
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
    const shared = normalizeShared(trip.sharedWith as Array<SharedEntry | string>)
    if (!shared.some((e) => e.sub === req.user.sub)) return res.status(400).json({ error: 'Not a collaborator' })

    await Trip.collection.updateOne({ _id: trip._id }, { $pull: { sharedWith: { sub: req.user.sub } } } as never)
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

    await Trip.collection.updateOne({ _id: trip._id }, { $pull: { sharedWith: { sub: req.params.sub } } } as never)

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