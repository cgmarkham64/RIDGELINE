import { Router } from 'express'
import { Notification } from '../models/Notification'
import { Trip } from '../models/Trip'

const router = Router()

router.get('/', async (req, res) => {
  const notes = await Notification.find({ toSub: req.user.sub })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()
  res.json(notes)
})

router.post('/:id/accept', async (req, res) => {
  try {
    const note = await Notification.findById(req.params.id)
    if (!note || note.toSub !== req.user.sub) return res.status(404).json({ error: 'Not found' })
    if (note.type !== 'trip_share_invite' || note.status !== 'pending')
      return res.status(400).json({ error: 'Nothing to accept' })

    const trip = await Trip.findById(note.tripId)
    if (trip && !trip.sharedWith.includes(req.user.sub)) {
      trip.sharedWith.push(req.user.sub)
      await trip.save()
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
    })

    res.json({ ok: true })
  } catch (err) {
    console.error('POST /notifications/:id/accept error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/decline', async (req, res) => {
  try {
    const note = await Notification.findById(req.params.id)
    if (!note || note.toSub !== req.user.sub) return res.status(404).json({ error: 'Not found' })
    if (note.type !== 'trip_share_invite' || note.status !== 'pending')
      return res.status(400).json({ error: 'Nothing to decline' })

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
    })

    res.json({ ok: true })
  } catch (err) {
    console.error('POST /notifications/:id/decline error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark all non-pending as read (called when the panel opens)
router.patch('/read-all', async (req, res) => {
  await Notification.updateMany(
    { toSub: req.user.sub, read: false, status: { $ne: 'pending' } },
    { $set: { read: true } }
  )
  res.json({ ok: true })
})

export default router