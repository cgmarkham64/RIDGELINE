import { Router } from 'express'
import { asyncRoute, HttpError } from '../utils/routeHelpers'
import { scanJournalImage, ScanParseError } from '../services/scanService'

const router = Router()

router.post('/', asyncRoute(async (req, res) => {
  const { imageBase64, mediaType } = req.body as { imageBase64?: string; mediaType?: string }
  if (!imageBase64) throw new HttpError(400, 'imageBase64 is required')

  try {
    res.json(await scanJournalImage(imageBase64, mediaType))
  } catch (err) {
    if (err instanceof ScanParseError) {
      return res.status(422).json({ error: err.message, raw: err.raw })
    }
    throw err
  }
}))

export default router
