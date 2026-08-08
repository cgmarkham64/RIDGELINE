import { useEffect, useState } from 'react'
import { useDebounce } from '../../../../hooks/useDebounce'
import { searchUsers, type UserSearchResult } from '../../../../lib/users'
import type { PartnersCardTrip } from './partnersCard.types'

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

function excludedSubs(trip: PartnersCardTrip, pendingInvites: { sub: string }[]): Set<string> {
  return new Set([
    ...(trip?.sharedWith?.map((c) => c.sub) ?? []),
    ...(trip?.ownerSub ? [trip.ownerSub] : []),
    ...pendingInvites.map((p) => p.sub),
  ])
}

export function usePartnerSearch(query: string, trip: PartnersCardTrip, pendingInvites: { sub: string }[]) {
  const [searchResult, setSearchResult] = useState<{ query: string; results: UserSearchResult[] } | null>(null)
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS)
  const trimmedQuery = debouncedQuery.trim()
  const hasQuery = trimmedQuery.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) return
    const q = trimmedQuery
    const excluded = excludedSubs(trip, pendingInvites)
    let cancelled = false
    searchUsers(q)
      .then((users) => {
        if (cancelled) return
        setSearchResult({ query: q, results: users.filter((u) => !excluded.has(u.sub)) })
      })
      .catch(() => { /* silently ignore */ })
    return () => { cancelled = true }
  }, [trimmedQuery, trip, pendingInvites])

  const isSearching = hasQuery && searchResult?.query !== trimmedQuery
  const results = hasQuery && searchResult?.query === trimmedQuery ? searchResult.results : []
  const resetSearch = () => setSearchResult(null)

  return { isSearching, results, resetSearch }
}
