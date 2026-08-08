import type { CSSProperties } from 'react'

export function isOwnedBy(ownerSub: string | undefined, userId: string | undefined): boolean {
  return !!userId && ownerSub === userId
}

// Shared amber-highlight styling for toggle/chip-style buttons (filter chips,
// role selectors) — active state gets the amber treatment, inactive stays neutral.
export function toggleChipStyle(active: boolean): CSSProperties {
  return {
    background:  active ? 'var(--amber-dim)' : 'var(--surface-2)',
    borderColor: active ? 'var(--amber-border)' : 'var(--border)',
    color:       active ? 'var(--amber)' : 'var(--text-dim)',
  }
}

export function initials(name: string | undefined): string {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export function extractApiError(err: unknown): string | undefined {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error
}

// Guards against javascript:/data: URIs sneaking into href attributes from
// user-entered or AI-suggested links (e.g. permit resource URLs).
export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}