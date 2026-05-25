import Anthropic from '@anthropic-ai/sdk'
import { HttpError } from '../utils/routeHelpers'

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

const VALID_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type ImageMediaType = (typeof VALID_MEDIA_TYPES)[number]

export class ScanParseError extends Error {
  constructor(public raw: string) {
    super('Could not parse response from AI')
    this.name = 'ScanParseError'
  }
}

export async function scanJournalImage(
  imageBase64: string,
  mediaType?: string,
): Promise<Record<string, unknown>> {
  // Base64 is ~4/3 the size of the raw bytes
  const estimatedBytes = Math.ceil((imageBase64.length * 3) / 4)
  if (estimatedBytes > MAX_IMAGE_BYTES) {
    const sizeMB = (estimatedBytes / 1024 / 1024).toFixed(1)
    throw new HttpError(
      413,
      `Image is too large (${sizeMB} MB). Please reduce it to under 5 MB before scanning — try lowering the resolution or compressing it first.`,
    )
  }

  const resolvedMediaType: ImageMediaType = VALID_MEDIA_TYPES.includes(mediaType as ImageMediaType)
    ? (mediaType as ImageMediaType)
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
            source: { type: 'base64', media_type: resolvedMediaType, data: imageBase64 },
          },
          { type: 'text', text: 'Extract the journal entry data from this image and return it as JSON.' },
        ],
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''

  // Strip markdown code fences if the model wraps the JSON
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    throw new ScanParseError(raw)
  }
}