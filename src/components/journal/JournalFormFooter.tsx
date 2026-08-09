type JournalFormFooterProps = {
  isError: boolean
  savedFeedback: boolean
  isNewEntry: boolean
  isPending: boolean
}

export function JournalFormFooter({ isError, savedFeedback, isNewEntry, isPending }: JournalFormFooterProps) {
  return (
    <div className="flex items-center gap-3 justify-end">
      {isError && <span className="text-fine text-red">Save failed</span>}
      {savedFeedback && (
        <span className="font-mono text-label tracking-widest uppercase text-pine">
          Saved ✓
        </span>
      )}
      {isNewEntry && (
        <button type="submit" disabled={isPending} className="btn btn-primary btn-sm">
          {isPending ? 'Saving…' : 'Save entry'}
        </button>
      )}
    </div>
  )
}
