import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Types ────────────────────────────────────────────────────────────────────

export type SourceTier = 'official' | 'partner' | 'community'

export interface PermitLink {
  url:         string
  title:       string
  description: string
  tier:        SourceTier
}

export interface TripPermitInput {
  title?:     string
  location?:  string
  startDate?: string
  endDate?:   string
  partySize:  number
  gpxCoords?: [number, number, number][]
}

// ─── Domain → tier ────────────────────────────────────────────────────────────

const BOOKING_DOMAINS   = new Set(['recreation.gov', 'pay.gov'])
const PARTNER_DOMAINS   = new Set(['coloradotrail.org', 'pcta.org', 'cdtcoalition.org', 'bct.org', 'americanhiking.org', 'cmc.org'])
const COMMUNITY_DOMAINS = new Set(['hikingproject.com', 'alltrails.com', 'backpacker.com', 'outsideonline.com', 'rei.com'])

function scoreTier(url: string): SourceTier {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    if (BOOKING_DOMAINS.has(hostname))   return 'official'
    if (PARTNER_DOMAINS.has(hostname))   return 'partner'
    if (hostname.endsWith('.gov'))       return 'official'
    if (COMMUNITY_DOMAINS.has(hostname)) return 'community'
    return 'community'
  } catch {
    return 'community'
  }
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a wilderness permit expert helping backcountry travellers find the official permit booking pages and information resources for their route.

Search the web for current permit requirements and booking pages for this trip's location and land management units.

Return ONLY a JSON array — no markdown, no explanation, no preamble. Each element must match this exact shape:

{
  "url": "https://the booking or info page URL",
  "title": "Page title or resource name",
  "description": "1–2 sentences: what this page is for and why it's relevant to this route"
}

Rules:
- Prioritize direct booking pages: recreation.gov and pay.gov first, then official .gov agency pages, then trail organization pages.
- If recreation.gov is the clear booking platform for this area, return that link and keep the overall list tight (3–5 links max). Do not pad with generic info pages when a direct booking link exists.
- Cover overnight wilderness permits, day-use quotas, trailhead parking reservations, vehicle entry passes, and any other access requirements for this land.
- Include a link even if you are not certain the permit applies — let the user verify. A link that turns out unnecessary is less harmful than a missing required permit page.
- Only return an empty array if you are highly confident that NO permits, passes, or access requirements of any kind apply to this route.`

// ─── Long-distance trail domain hints ────────────────────────────────────────

const TRAIL_HINTS: { pattern: RegExp; domain: string; name: string }[] = [
  { pattern: /colorado\s*trail|\bct\b|ct\s*segment/i, domain: 'coloradotrail.org',    name: 'Colorado Trail Foundation' },
  { pattern: /pct|pacific\s*crest/i,                  domain: 'pcta.org',             name: 'Pacific Crest Trail Association' },
  { pattern: /cdt|continental\s*divide/i,              domain: 'cdtcoalition.org',     name: 'Continental Divide Trail Coalition' },
  { pattern: /appalachian\s*trail|\bat\b/i,            domain: 'appalachiantrail.org', name: 'Appalachian Trail Conservancy' },
  { pattern: /john\s*muir\s*trail|\bjmt\b/i,           domain: 'pcta.org',             name: 'Pacific Crest Trail Association' },
]

function trailDomainHints(title?: string, location?: string): string {
  const haystack = `${title ?? ''} ${location ?? ''}`
  const matches  = TRAIL_HINTS.filter(h => h.pattern.test(haystack))
  if (matches.length === 0) return ''
  const list = matches.map(m => `- ${m.domain} (${m.name})`).join('\n')
  return `\nIMPORTANT: This route is on a known long-distance trail. Search these official trail organization sites:\n${list}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function simplifyCoords(
  coords: [number, number, number][],
  target: number,
): [number, number, number][] {
  if (coords.length <= target) return coords
  const step = Math.floor(coords.length / target)
  return coords.filter((_, i) => i % step === 0).slice(0, target)
}

function buildUserMessage(trip: TripPermitInput): string {
  const hint  = trailDomainHints(trip.title, trip.location)
  const lines: string[] = []
  if (hint) lines.push(hint)
  lines.push(
    `Trip name: ${trip.title ?? 'Unnamed trip'}`,
    `Location / area: ${trip.location ?? 'Not specified'}`,
    `Dates: ${trip.startDate ?? 'unknown start'} to ${trip.endDate ?? 'unknown end'}`,
    `Party size: ${trip.partySize}`,
  )
  if (trip.gpxCoords && trip.gpxCoords.length >= 2) {
    const all        = trip.gpxCoords
    const simplified = simplifyCoords(all, 30)
    lines.push(`Route start: lon=${all[0][0]}, lat=${all[0][1]}, ele=${all[0][2]}m`)
    lines.push(`Route end:   lon=${all[all.length - 1][0]}, lat=${all[all.length - 1][1]}, ele=${all[all.length - 1][2]}m`)
    lines.push(`Route waypoints (lon, lat, ele — ${simplified.length} of ${all.length} total): ${JSON.stringify(simplified)}`)
  }
  lines.push('\nFind permit booking pages and access resources for this area. Return the JSON array.')
  return lines.join('\n')
}

function coerce(raw: unknown): PermitLink[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(item => item && typeof item === 'object' && typeof item.url === 'string' && item.url)
    .map(item => ({
      url:         String(item.url),
      title:       typeof item.title === 'string' && item.title ? item.title : String(item.url),
      description: typeof item.description === 'string' ? item.description : '',
      tier:        scoreTier(String(item.url)),
    }))
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function suggestPermits(
  trip: TripPermitInput,
): Promise<{ links: PermitLink[] }> {
  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2048,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools:      [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 } as any],
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: buildUserMessage(trip) }],
  })

  const textBlocks = response.content.filter(b => b.type === 'text')
  const raw        = textBlocks.length > 0
    ? (textBlocks[textBlocks.length - 1] as { type: 'text'; text: string }).text
    : ''

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/,           '')
    .trim()

  try {
    return { links: coerce(JSON.parse(cleaned)) }
  } catch {
    return { links: [] }
  }
}
