import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Output types ─────────────────────────────────────────────────────────────

export type PermitType =
  | 'lottery' | 'reservation' | 'walkup' | 'selfissue'
  | 'zonenights' | 'hut' | 'parking' | 'fishing' | 'vehicle'

export type ZoneStatus = 'available' | 'limited' | 'sold_out'

export interface PermitSuggestion {
  id:         string
  type:       PermitType
  name:       string
  agency:     string
  why:        string
  url?:       string
  confidence: 'high' | 'medium' | 'low'
  fields:     Record<string, string>
  party:      number
  zones?:     { night: number; zone: string; status: ZoneStatus }[]
  zoneId?:    string
}

export type SourceTier = 'official' | 'partner' | 'community'

export interface PermitSource {
  url:   string
  title: string
  tier:  SourceTier
}

// ─── Source ranking ───────────────────────────────────────────────────────────

// Permit booking platforms — always most actionable
const BOOKING_DOMAINS = new Set(['recreation.gov', 'pay.gov'])

// Trail/wilderness orgs — more specific than generic agency sites
const PARTNER_DOMAINS = new Set([
  'coloradotrail.org', 'pcta.org', 'cdtcoalition.org',
  'bct.org', 'americanhiking.org', 'cmc.org',
])

// Useful but less authoritative community resources
const COMMUNITY_HIGH_DOMAINS = new Set([
  'hikingproject.com', 'alltrails.com',
  'backpacker.com', 'outsideonline.com', 'rei.com',
])

const MAX_SOURCES = 8

function scoreSource(url: string): { tier: SourceTier; score: number } {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    if (BOOKING_DOMAINS.has(hostname))        return { tier: 'official', score: 100 }
    if (PARTNER_DOMAINS.has(hostname))        return { tier: 'partner',  score: 90  }
    if (hostname.endsWith('.gov'))            return { tier: 'official', score: 80  }
    if (COMMUNITY_HIGH_DOMAINS.has(hostname)) return { tier: 'community', score: 25 }
    return { tier: 'community', score: 10 }
  } catch {
    return { tier: 'community', score: 0 }
  }
}

// ─── Input type ───────────────────────────────────────────────────────────────

export interface TripPermitInput {
  title?:     string
  location?:  string
  startDate?: string
  endDate?:   string
  partySize:  number
  gpxCoords?: [number, number, number][]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_TYPES: PermitType[] = [
  'lottery', 'reservation', 'walkup', 'selfissue',
  'zonenights', 'hut', 'parking', 'fishing', 'vehicle',
]
const VALID_STATUSES: ZoneStatus[] = ['available', 'limited', 'sold_out']
const VALID_CONFIDENCES          = ['high', 'medium', 'low'] as const

const SYSTEM_PROMPT = `You are a wilderness permit expert helping backcountry travellers identify every required permit, pass, and access requirement for their route.

Use web search to look up current-year information: lottery windows, reservation open dates, quota sizes, and official booking links. Cross-reference your training data with search results to give the most accurate dates for the current year.

Return ONLY a JSON array — no markdown, no explanation, no preamble. Each element must match this exact shape (omit optional keys when not applicable):

{
  "id": "agency_area_type_in_snake_case",
  "type": "lottery" | "reservation" | "walkup" | "selfissue" | "zonenights" | "hut" | "parking" | "fishing" | "vehicle",
  "name": "Official permit name",
  "agency": "Issuing agency · booking platform (e.g. Inyo NF · recreation.gov)",
  "why": "Specific reason this route needs this permit — mention the zone, trailhead, or land management boundary crossed",
  "url": "https://direct booking or info URL",
  "confidence": "high" | "medium" | "low",
  "fields": { "Label": "Value" },
  "zones": [{ "night": 1, "zone": "Zone Name", "status": "available" | "limited" | "sold_out" }],
  "zoneId": "stable_lowercase_slug"
}

Rules:
- "zonenights" type: populate "zones" with each permit zone the route crosses, ordered sequentially by night number. Use zone names exactly as the issuing agency uses them.
- "zoneId" should be a stable lowercase slug (e.g. "indian_peaks_thunder_lake_zone").
- Set "confidence" to "high" if you found authoritative current-year data via search, "medium" if reasonably certain from training data, "low" if speculative or if the requirement may not apply.
- Include ALL required permit types: overnight wilderness permits, zone quotas, trailhead parking, bear canister requirements (note as "selfissue" type), fishing licenses, and vehicle entry passes.
- Do NOT include wildlife permits (eagle take, incidental take, etc.) — those are for development projects, not recreational hikers.
- Prefer specific over generic names (e.g. "Indian Peaks Wilderness Overnight Permit" not "wilderness permit").
- In the "fields" object, include all key dates found via web search (application opens, application closes, results announced, booking opens, etc.).`

// ─── Trail → authoritative domain hints ───────────────────────────────────────

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
  return `\nIMPORTANT: This route is on a known long-distance trail. You MUST search the following official trail organization sites and include results from them:\n${list}`
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
    lines.push(`Route waypoints (lon, lat, ele — ${simplified.length} of ${all.length} total points): ${JSON.stringify(simplified)}`)
  }

  lines.push('\nSearch for current-year permit dates and identify all required permits. Return the JSON array.')
  return lines.join('\n')
}

// Coerce and validate the raw parsed JSON into typed suggestions
function coerce(raw: unknown, partySize: number): PermitSuggestion[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter(item =>
      item &&
      typeof item === 'object' &&
      typeof item.name === 'string' &&
      VALID_TYPES.includes(item.type),
    )
    .map(item => ({
      id:         typeof item.id === 'string' && item.id
        ? item.id
        : `permit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type:       item.type as PermitType,
      name:       String(item.name),
      agency:     typeof item.agency === 'string' ? item.agency : '',
      why:        typeof item.why === 'string' ? item.why : '',
      url:        typeof item.url === 'string' && item.url ? item.url : undefined,
      confidence: VALID_CONFIDENCES.includes(item.confidence) ? item.confidence : 'medium',
      fields:     item.fields && typeof item.fields === 'object' && !Array.isArray(item.fields)
        ? (item.fields as Record<string, string>)
        : {},
      party:      partySize,
      zones:      Array.isArray(item.zones)
        ? item.zones
            .filter((z: unknown) => z && typeof z === 'object')
            .map((z: Record<string, unknown>) => ({
              night:  typeof z.night === 'number' ? z.night : 1,
              zone:   typeof z.zone === 'string' ? z.zone : '',
              status: VALID_STATUSES.includes(z.status as ZoneStatus)
                ? (z.status as ZoneStatus)
                : 'available',
            }))
        : undefined,
      zoneId: typeof item.zoneId === 'string' && item.zoneId ? item.zoneId : undefined,
    }))
}

// ─── Main export ──────────────────────────────────────────────────────────────

type WebSearchResult     = { type: 'web_search_result'; url: string; title: string }
type WebSearchToolResult = { type: 'web_search_tool_result'; content: WebSearchResult[] }

export async function suggestPermits(
  trip: TripPermitInput,
): Promise<{ permits: PermitSuggestion[]; sources: PermitSource[] }> {
  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 4096,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools:      [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 } as any],
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: buildUserMessage(trip) }],
  })

  // Extract URLs from web_search_tool_result blocks (deduplicated)
  const seen    = new Set<string>()
  const rawSources: (PermitSource & { score: number })[] = []
  for (const block of response.content) {
    const b = block as unknown as WebSearchToolResult
    if (b.type === 'web_search_tool_result') {
      for (const r of b.content ?? []) {
        if (r.type === 'web_search_result' && r.url && !seen.has(r.url)) {
          seen.add(r.url)
          const { tier, score } = scoreSource(r.url)
          rawSources.push({ url: r.url, title: r.title ?? r.url, tier, score })
        }
      }
    }
  }

  const sources: PermitSource[] = rawSources
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SOURCES)
    .map(({ url, title, tier }) => ({ url, title, tier }))

  // Find the last text block — it follows any web_search tool use blocks
  const textBlocks = response.content.filter(b => b.type === 'text')
  const raw        = textBlocks.length > 0
    ? (textBlocks[textBlocks.length - 1] as { type: 'text'; text: string }).text
    : ''

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/,           '')
    .trim()

  try {
    return { permits: coerce(JSON.parse(cleaned), trip.partySize), sources }
  } catch {
    return { permits: [], sources }
  }
}