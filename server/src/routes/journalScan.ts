import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { asyncRoute, HttpError } from '../utils/routeHelpers'

const router = Router()

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are extracting structured data from a photo of a handwritten or printed hiking journal page.
Return ONLY a valid JSON object with these exact keys (omit any key where the value is not discernible):
- title: string — the day's title or headline
- milesCovered: number — distance hiked in miles
- elevationGainFt: number — elevation gain in feet
- tempLowF: number — low temperature in °F
- tempHighF: number — high temperature in °F
- weatherNotes: string — weather description (e.g. "Clear", "Partly Cloudy", "Rain")
- body: string — the main narrative text, preserving paragraph breaks with \\n\\n

Do not include markdown, explanation, or any text outside the JSON object.`

// Anthropic's per-image limit is 5 MB of raw image data
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

router.post('/', asyncRoute(async (req, res) => {
  const { imageBase64, mediaType } = req.body as {
    imageBase64?: string
    mediaType?: string
  }

  if (!imageBase64) throw new HttpError(400, 'imageBase64 is required')

  // Base64 is ~4/3 the size of the raw bytes
  const estimatedBytes = Math.ceil((imageBase64.length * 3) / 4)
  if (estimatedBytes > MAX_IMAGE_BYTES) {
    const sizeMB = (estimatedBytes / 1024 / 1024).toFixed(1)
    throw new HttpError(
      413,
      `Image is too large (${sizeMB} MB). Please reduce it to under 5 MB before scanning — try lowering the resolution or compressing it first.`,
    )
  }

  const validMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const resolvedMediaType = validMediaTypes.includes(mediaType ?? '')
    ? (mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')
    : 'image/jpeg'

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: resolvedMediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: 'Extract the journal entry data from this image and return it as JSON.',
          },
        ],
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''

  let extracted: Record<string, unknown>
  try {
    // Strip markdown code fences if the model wraps the JSON
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()
    extracted = JSON.parse(cleaned)
  } catch {
    return res.status(422).json({ error: 'Could not parse response from AI', raw })
  }

  res.json(extracted)
}))

export default router