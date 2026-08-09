export function TripHeroActions({ isOwner, onEdit, onDelete, onShare, onLeave }: {
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
  onShare: () => void
  onLeave: () => void
}) {
  return (
    <div className="flex gap-1.5 items-center">
      {!isOwner && (
        <>
          <span className="font-mono text-label tracking-[0.12em] uppercase border rounded px-2 py-[3px]" style={{ color: 'var(--amber)', borderColor: 'var(--amber-border)' }}>
            Shared trip
          </span>
          <button onClick={onLeave} className="btn btn-danger btn-sm">
            Leave
          </button>
        </>
      )}
      {isOwner && (
        <button onClick={onShare} className="btn btn-pine btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[13px] h-[13px] shrink-0" style={{ strokeWidth: 2 }}>
            <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      )}
      <button onClick={onEdit} className="btn btn-sky btn-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[13px] h-[13px] shrink-0" style={{ strokeWidth: 2 }}>
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Trip
      </button>
      {isOwner && (
        <button onClick={onDelete} className="btn btn-danger btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[13px] h-[13px] shrink-0" style={{ strokeWidth: 2 }}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
          </svg>
          Delete
        </button>
      )}
    </div>
  )
}
