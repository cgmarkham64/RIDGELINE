import { useEffect, useRef, useState } from 'react'
import type { AppNotification } from '../../types'
import {
  useNotifications,
  useAcceptInvite,
  useDeclineInvite,
  useMarkAllRead,
  useDismissNotification,
} from '../../hooks/useNotifications'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { data: notifications = [] } = useNotifications()
  const accept = useAcceptInvite()
  const decline = useDeclineInvite()
  const markRead = useMarkAllRead()
  const dismiss = useDismissNotification()

  const badgeCount = notifications.filter(
    (n) => n.status === 'pending' || !n.read
  ).length

  function handleOpen() {
    setOpen((v) => {
      if (!v) markRead.mutate() // mark non-pending as read when panel opens
      return !v
    })
  }

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div ref={wrapRef} className="rail-tip-wrap shrink-0">
      <button
        onClick={handleOpen}
        className="rail-btn relative"
        style={open ? { background: 'var(--surface-2)', color: 'var(--text-mid)' } : undefined}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full bg-red flex items-center justify-center font-mono text-[8px] font-bold text-white leading-none px-[3px]">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>
      <span className="rail-tip">Notifications</span>

      {open && (
        <div className="absolute left-[calc(100%+8px)] bottom-0 w-80 bg-surface border border-border-mid rounded-lg shadow-xl overflow-hidden z-50 flex flex-col"
          style={{ maxHeight: '480px' }}
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
            <span className="font-heading text-[12px] font-extrabold text-text">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => markRead.mutate()}
                className="font-mono text-[9px] tracking-widest uppercase text-text-dim hover:text-amber transition-colors duration-100"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center font-mono text-[10px] text-text-dim tracking-wider">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n._id}
                  notification={n}
                  onAccept={() => accept.mutate(n._id)}
                  onDecline={() => decline.mutate(n._id)}
                  onDismiss={() => dismiss.mutate(n._id)}
                  accepting={accept.isPending}
                  declining={decline.isPending}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({
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
          className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-mono text-[8px] font-bold mt-[1px]"
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
          <p className="font-mono text-[8px] text-text-dim mt-0.5">
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

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
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