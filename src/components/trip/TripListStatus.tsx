import { MoonLoader } from '../ui/MoonLoader'

interface TripListStatusProps {
  isLoading: boolean
  isError: boolean
  sortedCount: number
  filteredCount: number
  showResultCount: boolean
}

function showNoMatch(hasLoaded: boolean, sortedCount: number, filteredCount: number): boolean {
  return hasLoaded && sortedCount > 0 && filteredCount === 0
}

export function TripListStatus({ isLoading, isError, sortedCount, filteredCount, showResultCount }: TripListStatusProps) {
  const hasLoaded = !isLoading && !isError

  return (
    <>
      {isLoading && <MoonLoader />}

      {isError && (
        <p className="px-3.5 pt-6 pb-6 font-mono text-label text-red tracking-widest uppercase">
          Could not load trips
        </p>
      )}

      {hasLoaded && sortedCount === 0 && (
        <p className="px-3.5 pt-6 pb-6 font-mono text-label text-text-dim tracking-widest uppercase leading-[1.8]">
          No trips yet.
          <br />
          Create one above.
        </p>
      )}

      {showResultCount && (
        <p className="px-3.5 pt-1.5 pb-1 font-mono text-label tracking-widest uppercase text-text-dim">
          {filteredCount} of {sortedCount} trip{sortedCount !== 1 ? 's' : ''}
        </p>
      )}

      {showNoMatch(hasLoaded, sortedCount, filteredCount) && (
        <p className="px-3.5 pt-4 font-mono text-label text-text-dim tracking-widest uppercase">
          No trips match
        </p>
      )}
    </>
  )
}
