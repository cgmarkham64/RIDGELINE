export function KabobMenu({
  hasTrack,
  importLabel,
  onImport,
  onRemove,
}: {
  hasTrack: boolean
  importLabel: string
  onImport: () => void
  onRemove: () => void
}) {
  return (
    <div
      className="absolute right-0 top-[calc(100%+4px)] bg-surface border border-border rounded-md z-10 min-w-37 overflow-hidden"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="block w-full text-left px-3 py-2 text-fine font-mono tracking-[0.06em] uppercase bg-transparent border-0 cursor-pointer text-text"
        onClick={onImport}
      >
        {importLabel}
      </button>
      {hasTrack && (
        <button
          className="block w-full text-left px-3 py-2 text-fine font-mono tracking-[0.06em] uppercase bg-transparent border-0 cursor-pointer text-red border-t border-border"
          onClick={onRemove}
        >
          Remove
        </button>
      )}
    </div>
  )
}
