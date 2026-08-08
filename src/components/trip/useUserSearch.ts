import { useEffect, useState } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { searchUsers, type UserSearchResult } from '../../lib/users'

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

export function useUserSearch(query: string) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchResult, setSearchResult] = useState<{ query: string; results: UserSearchResult[] } | null>(null)

  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS)
  const trimmedQuery = debouncedQuery.trim()
  const hasQuery = trimmedQuery.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) return
    let cancelled = false
    searchUsers(trimmedQuery)
      .then((users) => {
        if (cancelled) return
        setSearchResult({ query: trimmedQuery, results: users })
        setDropdownOpen(true)
      })
      .catch(() => {
        if (cancelled) return
        setSearchResult({ query: trimmedQuery, results: [] })
      })
    return () => { cancelled = true }
  }, [trimmedQuery])

  const isSearching = hasQuery && searchResult?.query !== trimmedQuery
  const results = hasQuery && searchResult?.query === trimmedQuery ? searchResult.results : []
  const resetSearch = () => setSearchResult(null)

  return { showDropdown: dropdownOpen && hasQuery, isSearching, results, setDropdownOpen, resetSearch }
}
