import type { AppNotification } from '../../types'
import { initials } from '../../lib/utils'

function messageFor(n: AppNotification): string {
  switch (n.type) {
    case 'trip_share_invite':
      return `${n.fromName} invited you to collaborate on a trip`
    case 'invite_accepted':
      return `${n.fromName} accepted your invite`
    case 'invite_declined':
      return `${n.fromName} declined your invite`
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function NotificationItem({
  notification: n,
  onAccept,
  onDecline,
  onDismiss,
  accepting,
  declining,
}: {
  notification: AppNotification
  onAccept: () => void
  onDecline: () => void
  onDismiss: () => void
  accepting: boolean
  declining: boolean
}) {
  const isPending = n.type === 'trip_share_invite' && n.status === 'pending'
  const isUnread = !n.read && n.status !== 'pending'

  return (
    <div
      className={`px-4 py-3 border-b border-border last:border-0 transition-colors duration-100 ${
        isUnread ? 'bg-amber-dim' : ''
      }`}
    >
      <div className="flex items-start gap-2.5 mb-1.5">
        <div
          className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-mono text-[9px] font-bold mt-[1px]"
          style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}
        >
          {initials(n.fromName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-sans text-[11px] text-text leading-snug">
            {messageFor(n)}
          </p>
          <p className="font-mono text-[9px] text-text-dim mt-0.5 truncate">
            {n.tripTitle}
          </p>
          <p className="font-mono text-[9px] text-text-dim mt-0.5">
            {relativeTime(n.createdAt)}
          </p>
        </div>
        {!isPending && (
          <button
            onClick={onDismiss}
            className="text-text-dim hover:text-amber shrink-0 leading-none text-[14px] mt-[1px] transition-colors duration-100"
            title="Dismiss"
          >
            ×
          </button>
        )}
      </div>

      {isPending && (
        <div className="flex gap-2 pl-[34px]">
          <button
            onClick={onAccept}
            disabled={accepting || declining}
            className="btn btn-sm btn-primary"
          >
            {accepting ? '…' : 'Accept'}
          </button>
          <button
            onClick={onDecline}
            disabled={accepting || declining}
            className="btn btn-sm btn-ghost"
            style={{ color: 'var(--text-dim)' }}
          >
            {declining ? '…' : 'Decline'}
          </button>
        </div>
      )}

      {n.type === 'trip_share_invite' && n.status !== 'pending' && (
        <p className="pl-[34px] font-mono text-[9px]" style={{
          color: n.status === 'accepted' ? 'var(--pine)' : 'var(--text-dim)'
        }}>
          {n.status === 'accepted' ? '✓ Accepted' : 'Declined'}
        </p>
      )}
    </div>
  )
}