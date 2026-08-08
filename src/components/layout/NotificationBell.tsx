import { useRef, useState } from 'react'
import { IconBell } from '../icons'
import {
  useNotifications,
  useAcceptInvite,
  useDeclineInvite,
  useMarkAllRead,
  useDismissNotification,
} from '../../hooks/useNotifications'
import { useClickOutside } from '../../hooks/useClickOutside'
import { NotificationItem } from './NotificationItem'
import type { AppNotification } from '../../types'

const MAX_DISPLAYED_BADGE_COUNT = 9

interface NotificationPanelProps {
  notifications: AppNotification[]
  onMarkAllRead: () => void
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  onDismiss: (id: string) => void
  accepting: boolean
  declining: boolean
}

function NotificationPanel({
  notifications, onMarkAllRead, onAccept, onDecline, onDismiss, accepting, declining,
}: NotificationPanelProps) {
  return (
    <div
      className="absolute left-[calc(100%+8px)] bottom-0 w-80 bg-surface border border-border-mid rounded-lg shadow-xl overflow-hidden z-50 flex flex-col"
      style={{ maxHeight: '480px' }}
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <span className="font-heading text-body-sm font-extrabold text-text">Notifications</span>
        {notifications.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="font-mono text-label tracking-widest uppercase text-text-dim hover:text-amber transition-colors duration-100"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center font-mono text-caption text-text-dim tracking-wider">
            No notifications
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onAccept={() => onAccept(n._id)}
              onDecline={() => onDecline(n._id)}
              onDismiss={() => onDismiss(n._id)}
              accepting={accepting}
              declining={declining}
            />
          ))
        )}
      </div>
    </div>
  )
}

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
      if (!v) markRead.mutate()
      return !v
    })
  }

  useClickOutside(wrapRef, () => setOpen(false))

  return (
    <div ref={wrapRef} className="rail-tip-wrap shrink-0">
      <button
        onClick={handleOpen}
        className="rail-btn relative"
        style={open ? { background: 'var(--surface-2)', color: 'var(--text-mid)' } : undefined}
      >
        <IconBell size={17} />
        {badgeCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-3.5 h-3.5 rounded-full bg-red flex items-center justify-center font-mono text-label font-bold text-white leading-none px-[3px]">
            {badgeCount > MAX_DISPLAYED_BADGE_COUNT ? `${MAX_DISPLAYED_BADGE_COUNT}+` : badgeCount}
          </span>
        )}
      </button>
      <span className="rail-tip">Notifications</span>

      {open && (
        <NotificationPanel
          notifications={notifications}
          onMarkAllRead={() => markRead.mutate()}
          onAccept={(id) => accept.mutate(id)}
          onDecline={(id) => decline.mutate(id)}
          onDismiss={(id) => dismiss.mutate(id)}
          accepting={accept.isPending}
          declining={decline.isPending}
        />
      )}
    </div>
  )
}