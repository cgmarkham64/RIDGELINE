import { useEffect, useRef, useState } from 'react'
import { IconBell } from '../icons'
import {
  useNotifications,
  useAcceptInvite,
  useDeclineInvite,
  useMarkAllRead,
  useDismissNotification,
} from '../../hooks/useNotifications'
import { NotificationItem } from './NotificationItem'

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
        <IconBell size={17} />
        {badgeCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-3.5 h-3.5 rounded-full bg-red flex items-center justify-center font-mono text-[9px] font-bold text-white leading-none px-[3px]">
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