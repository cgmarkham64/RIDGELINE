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

// ─── Permit lookup ────────────────────────────────────────────────────────────

const VALID_PERMIT_TYPES = new Set([
  'lottery', 'reservation', 'walkup', 'selfissue',
  'zonenights', 'hut', 'parking', 'fishing', 'vehicle',
])

export interface LookupCriticalDate {
  label:    string
  dateStr?: string   // YYYY-MM-DD if Claude found it
  timeStr?: string   // HH:MM 24-hour if a specific time of day is known
  tone:     'amber' | 'sky' | 'pine'
}

export interface PermitLookupResult {
  name:             string
  agency:           string
  type:             string
  why:              string
  url?:             string
  criticalDates:    LookupCriticalDate[]
  confidence:       'high' | 'medium' | 'low'
  verificationNote: string
}

// Mirrors PERMIT_DATE_PRESETS on the frontend — must stay in sync with permitsStage.constants.ts
const PRESET_DATE_LABELS: Record<string, { label: string; tone: string }[]> = {
  lottery:     [
    { label: 'Application opens',   tone: 'amber' },
    { label: 'Application closes',  tone: 'amber' },
    { label: 'Draw date',           tone: 'amber' },
    { label: 'Acceptance deadline', tone: 'amber' },
  ],
  reservation: [
    { label: 'Booking opens',         tone: 'sky'   },
    { label: 'Cancellation deadline', tone: 'amber' },
  ],
  walkup:      [
    { label: 'Window opens', tone: 'amber' },
    { label: 'Arrive by',    tone: 'amber' },
  ],
  selfissue:   [],
  zonenights:  [{ label: 'Booking opens', tone: 'sky' }],
  hut:         [
    { label: 'Booking opens',         tone: 'sky'   },
    { label: 'Cancellation deadline', tone: 'amber' },
  ],
  parking:     [{ label: 'Booking opens', tone: 'sky' }],
  fishing:     [],
  vehicle:     [{ label: 'Booking opens', tone: 'sky' }],
}

function presetLabelsBlock(): string {
  return Object.entries(PRESET_DATE_LABELS)
    .filter(([, dates]) => dates.length > 0)
    .map(([type, dates]) => `  ${type}: ${dates.map(d => `"${d.label}"`).join(' | ')}`)
    .join('\n')
}

const LOOKUP_SYSTEM_PROMPT = `You are a wilderness permit research assistant. Given a permit name and trip context, find the authoritative permit details.

You may be given a list of permit resource URLs already found for this route - check those FIRST before web searching.

Return ONLY a JSON object - no markdown, no explanation:
{
  "name": "exact permit name (correct any spelling/case)",
  "agency": "issuing agency (e.g. Inyo National Forest, NPS)",
  "type": "one of: lottery | reservation | walkup | selfissue | zonenights | hut | parking | fishing | vehicle",
  "why": "1-2 sentences describing what this permit covers and when it is required — do NOT include specific times of day here, those go in criticalDates.timeStr",
  "url": "the most authoritative booking or info URL (prefer recreation.gov or official .gov pages)",
  "criticalDates": [
    {
      "label": "see rules below",
      "dateStr": "YYYY-MM-DD - omit this key if the date is unknown",
      "timeStr": "HH:MM in 24-hour format - include only when a specific time of day is stated (e.g. '8 a.m. MT' -> '08:00'); omit timezone",
      "tone": "amber|sky|pine"
    }
  ],
  "confidence": "high if a definitive official source was found, medium if likely correct, low if uncertain",
  "verificationNote": "1 sentence on the single most important thing the user should verify before booking"
}

criticalDates rules:
1. First, include ALL of these standard labels for the identified type — copy them verbatim, do not paraphrase:
${presetLabelsBlock()}
   Include every standard label even when the date is unknown (omit dateStr but keep the entry).

2. Then append any other significant dates you found that are not already covered by the standard labels above, using a short descriptive label of your own.

3. If a specific time of day is mentioned for a date (e.g. "permits released at 8 a.m. MT", "booking opens at noon"), set timeStr (HH:MM, 24-hour, no timezone) on that entry and do NOT repeat the time in the why field.

Tone guide: amber = deadline/cutoff, sky = booking/reservation opens, pine = informational.

Stop web-searching once you reach high confidence. Prefer fewer, authoritative results.`

function buildLookupMessage(permitName: string, trip: TripPermitInput, links: PermitLink[]): string {
  const lines: string[] = []
  if (links.length > 0) {
    lines.push('Permit resources already found for this route area (check these first):')
    for (const l of links) {
      const tier = l.tier ? `[${l.tier}] ` : ''
      lines.push(`  ${tier}${l.title}: ${l.url}`)
    }
    lines.push('')
  }
  lines.push(`Permit to look up: "${permitName}"`)
  lines.push(`Trip location: ${trip.location ?? 'Not specified'}`)
  lines.push(`Trip dates: ${trip.startDate ?? 'unknown'} to ${trip.endDate ?? 'unknown'}`)
  lines.push(`Party size: ${trip.partySize}`)
  lines.push('\nReturn the JSON object.')
  return lines.join('\n')
}

function normalizeTimeStr(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw) return undefined
  const s = raw.trim()
  // Already HH:MM
  const colonMatch = s.match(/^(\d{1,2}):(\d{2})/)
  if (colonMatch) return `${colonMatch[1].padStart(2, '0')}:${colonMatch[2]}`
  // "8 a.m.", "8am", "8:30 p.m." style — strip timezone suffix first
  const ampm = s.replace(/\s+[A-Z]{2,4}$/, '').match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)/i)
  if (ampm) {
    let hour = Number(ampm[1])
    const min  = ampm[2] ?? '00'
    const isPm = ampm[3].toLowerCase().replace(/\./g, '').startsWith('p')
    if (isPm && hour < 12) hour += 12
    if (!isPm && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${min}`
  }
  return undefined
}

function coerceLookupDates(raw: unknown): LookupCriticalDate[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(d => d && typeof d === 'object' && typeof (d as Record<string, unknown>).label === 'string')
    .map(d => {
      const item    = d as Record<string, unknown>
      const dateStr = typeof item.dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.dateStr)
        ? item.dateStr : undefined
      const timeStr = normalizeTimeStr(item.timeStr)
      const tone    = (['amber', 'sky', 'pine'] as const).includes(item.tone as 'amber' | 'sky' | 'pine')
        ? item.tone as 'amber' | 'sky' | 'pine' : 'amber' as const
      return {
        label: String(item.label),
        ...(dateStr ? { dateStr } : {}),
        ...(timeStr ? { timeStr } : {}),
        tone,
      }
    })
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  // Strip any markdown fences that wrap the whole response
  const stripped = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
  // Try the full stripped string first, then scan for the first {...} block
  const candidates = [stripped, (stripped.match(/\{[\s\S]*\}/) ?? [])[0] ?? '']
  for (const candidate of candidates) {
    try { return JSON.parse(candidate) } catch { /* try next */ }
  }
  return null
}

const LOOKUP_FALLBACK_NOTE = 'AI could not confirm details — verify permit requirements directly with the land manager.'

export async function lookupPermit(
  permitName: string,
  trip: TripPermitInput,
  links: PermitLink[],
): Promise<PermitLookupResult> {
  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1024,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools:      [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 } as any],
    system:     LOOKUP_SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: buildLookupMessage(permitName, trip, links) }],
  })

  const textBlocks = response.content.filter(b => b.type === 'text')
  const raw        = textBlocks.length > 0
    ? (textBlocks[textBlocks.length - 1] as { type: 'text'; text: string }).text
    : ''

  const parsed = extractJsonObject(raw)
  if (!parsed) {
    return {
      name: permitName, agency: '', type: 'reservation', why: '',
      criticalDates: [], confidence: 'low',
      verificationNote: LOOKUP_FALLBACK_NOTE,
    }
  }

  return {
    name:             typeof parsed.name === 'string'   ? parsed.name   : permitName,
    agency:           typeof parsed.agency === 'string' ? parsed.agency : '',
    type:             VALID_PERMIT_TYPES.has(parsed.type as string) ? parsed.type as string : 'reservation',
    why:              typeof parsed.why === 'string'    ? parsed.why    : '',
    url:              typeof parsed.url === 'string' && parsed.url ? parsed.url : undefined,
    criticalDates:    coerceLookupDates(parsed.criticalDates),
    confidence:       (['high', 'medium', 'low'] as const).includes(parsed.confidence as 'high' | 'medium' | 'low')
                        ? parsed.confidence as 'high' | 'medium' | 'low'
                        : 'low',
    verificationNote: typeof parsed.verificationNote === 'string'
                        ? parsed.verificationNote
                        : 'Verify all details with the issuing agency before booking.',
  }
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
