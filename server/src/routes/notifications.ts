import { Router } from 'express'
import { Notification } from '../models/Notification'
import { Trip } from '../models/Trip'
import { asyncRoute, HttpError } from '../utils/routeHelpers'

const router = Router()

router.get('/', asyncRoute(async (req, res) => {
  const notes = await Notification.find({ toSub: req.user.sub })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()
  res.json(notes)
}))

router.post('/:id/accept', asyncRoute(async (req, res) => {
  const note = await Notification.findById(req.params.id)
  if (!note || note.toSub !== req.user.sub) throw new HttpError(404, 'Not found')
  if (note.type !== 'trip_share_invite' || note.status !== 'pending')
    throw new HttpError(400, 'Nothing to accept')

  const trip = await Trip.findById(note.tripId)
  if (trip) {
    const alreadyIn = (trip.sharedWith as Array<{ sub: string } | string>)
      .some((e) => (typeof e === 'string' ? e : e.sub) === req.user.sub)
    if (!alreadyIn) {
      await Trip.collection.updateOne(
        { _id: trip._id },
        { $push: { sharedWith: { sub: req.user.sub, role: (note as { role?: string }).role ?? 'edit' } } }
      )
    }
  }

  note.status = 'accepted'
  note.read = true
  await note.save()

  await Notification.create({
    toSub: note.fromSub,
    fromSub: req.user.sub,
    fromName: req.user.name,
    type: 'invite_accepted',
    tripId: note.tripId,
    tripTitle: note.tripTitle,
    status: 'accepted',
  })

  res.json({ ok: true })
}))

router.post('/:id/decline', asyncRoute(async (req, res) => {
  const note = await Notification.findById(req.params.id)
  if (!note || note.toSub !== req.user.sub) throw new HttpError(404, 'Not found')
  if (note.type !== 'trip_share_invite' || note.status !== 'pending')
    throw new HttpError(400, 'Nothing to decline')

  note.status = 'declined'
  note.read = true
  await note.save()

  await Notification.create({
    toSub: note.fromSub,
    fromSub: req.user.sub,
    fromName: req.user.name,
    type: 'invite_declined',
    tripId: note.tripId,
    tripTitle: note.tripTitle,
    status: 'declined',
  })

  res.json({ ok: true })
}))

router.delete('/:id', asyncRoute(async (req, res) => {
  const note = await Notification.findById(req.params.id)
  if (!note || note.toSub !== req.user.sub) throw new HttpError(404, 'Not found')
  await note.deleteOne()
  res.status(204).send()
}))

// Mark all non-pending-invite as read (called when panel opens or user clicks "Mark all read")
router.patch('/read-all', asyncRoute(async (req, res) => {
  await Notification.updateMany(
    { toSub: req.user.sub, read: false, status: { $ne: 'pending' } },
    { $set: { read: true } }
  )
  res.json({ ok: true })
}))

export default router