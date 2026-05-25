import { Router } from 'express'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Model } from 'mongoose'
import { asyncRoute, requireOwner, HttpError } from './routeHelpers'

interface CrudOptions {
  populateField?: string
}

type OwnedDoc = { ownerSub: string }

// Builds a standard owner-scoped GET/POST/PUT/DELETE router for a Mongoose model.
// populateField is applied to GET /, GET /:id, and PUT /:id responses.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeOwnerCrudRouter(model: Model<any>, options: CrudOptions = {}): Router {
  const { populateField } = options
  const router = Router()

  router.get('/', asyncRoute(async (req, res) => {
    const q = model.find({ ownerSub: req.user.sub })
    if (populateField) q.populate(populateField)
    res.json(await q.lean())
  }))

  router.get('/:id', asyncRoute(async (req, res) => {
    const q = model.findById(req.params.id)
    if (populateField) q.populate(populateField)
    const doc = (await q.lean()) as OwnedDoc | null
    if (!doc) throw new HttpError(404, 'Not found')
    requireOwner(doc.ownerSub, req.user.sub)
    res.json(doc)
  }))

  router.post('/', asyncRoute(async (req, res) => {
    const doc = await model.create({ ...req.body, ownerSub: req.user.sub })
    res.status(201).json(doc)
  }))

  router.put('/:id', asyncRoute(async (req, res) => {
    const existing = (await model.findById(req.params.id).lean()) as OwnedDoc | null
    if (!existing) throw new HttpError(404, 'Not found')
    requireOwner(existing.ownerSub, req.user.sub)
    const rest = { ...(req.body as Record<string, unknown>) }
    delete rest.ownerSub
    const q = model.findByIdAndUpdate(req.params.id, rest, { new: true, runValidators: true })
    if (populateField) q.populate(populateField)
    res.json(await q.lean())
  }))

  router.delete('/:id', asyncRoute(async (req, res) => {
    const doc = (await model.findById(req.params.id).lean()) as OwnedDoc | null
    if (!doc) throw new HttpError(404, 'Not found')
    requireOwner(doc.ownerSub, req.user.sub)
    await model.findByIdAndDelete(req.params.id)
    res.status(204).send()
  }))

  return router
}