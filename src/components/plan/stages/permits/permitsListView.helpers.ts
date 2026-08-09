export function linkDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export function isBookable(url: string): boolean {
  return linkDomain(url) === 'recreation.gov'
}

export function computeBannerHeading(
  scanning: boolean, scanError: string | null, linksCount: number, lastScanned: string | undefined,
): string {
  if (scanning) return 'Searching for permit and booking resources…'
  if (scanError) return `Scan failed — ${scanError}`
  if (linksCount > 0) return `Found ${linksCount} permit resource${linksCount !== 1 ? 's' : ''} for this area`
  if (lastScanned) return 'No permit resources detected — verify with the land manager before assuming permit-free'
  return 'Import a route in Stage 1 to find permit resources for your area'
}
