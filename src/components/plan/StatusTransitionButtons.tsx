import { IconArrowLeft, IconArrowRight } from '../icons'

export function StatusTransitionButtons({ forward, canGoBack, isOwner, onStatusChange, onBackClick }: {
  forward: { label: string; next: string } | undefined
  canGoBack: boolean
  isOwner?: boolean
  onStatusChange?: (newStatus: string) => void
  onBackClick: () => void
}) {
  return (
    <>
      {canGoBack && (
        <button
          onClick={onBackClick}
          className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-widest uppercase px-3 py-1.5 rounded border border-border bg-transparent text-text-dim cursor-pointer hover:border-border-mid hover:text-text transition-colors"
        >
          <IconArrowLeft size={10} />
          Planning
        </button>
      )}
      {isOwner && forward && onStatusChange && (
        <button
          onClick={() => onStatusChange(forward.next)}
          className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-widest uppercase px-3 py-1.5 rounded border cursor-pointer transition-colors"
          style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
        >
          {forward.label}
          <IconArrowRight size={10} />
        </button>
      )}
    </>
  )
}
