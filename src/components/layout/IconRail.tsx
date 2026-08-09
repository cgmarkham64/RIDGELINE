import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuthStore } from '../../store/auth'
import { AccountDialog } from './AccountDialog'
import { NotificationBell } from './NotificationBell'
import { RailAccountButton } from './RailAccountButton'
import { keycloak, LOCAL_AUTH } from '../../lib/keycloak'

function NavLink({
  to,
  title,
  children,
}: {
  to: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rail-tip-wrap">
      <Link
        to={to}
        className="rail-btn"
        activeProps={{ className: 'rail-btn active' }}
        activeOptions={to === '/' ? { exact: true } : undefined}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {children}
        </svg>
      </Link>
      <span className="rail-tip">{title}</span>
    </div>
  )
}


export function IconRail() {
  const { user, clearAuth } = useAuthStore()
  const [accountOpen, setAccountOpen] = useState(false)

  function handleSignOut() {
    clearAuth()
    if (LOCAL_AUTH) {
      window.location.href = '/login'
    } else {
      keycloak.logout({ redirectUri: window.location.origin })
    }
  }

  return (
    <>
      <nav className="w-16 shrink-0 bg-surface border-r border-border flex flex-col items-center py-4 pb-5 gap-0.5 h-full">
        <div
          className="font-heading text-fine font-extrabold tracking-[0.22em] text-amber mb-5 select-none"
          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
        >
          RDGLN
        </div>

        <NavLink to="/" title="Trips">
          <polyline points="2 21 8 6 13 14 17 9 22 21" />
        </NavLink>

<NavLink to="/map" title="Map">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </NavLink>

        <NavLink to="/photos" title="Photos">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </NavLink>

        <NavLink to="/gear" title="Gear">
          <path d="M9 4a3 3 0 0 1 6 0" />
          <path d="M5 8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8z" />
          <path d="M9 20v-5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </NavLink>

        <div className="flex-1" />

        <NotificationBell />

        {/* Account */}
        {user && <RailAccountButton user={user} onClick={() => setAccountOpen(true)} />}

        {/* Sign out */}
        {user && (
          <div className="rail-tip-wrap shrink-0">
            <button
              onClick={handleSignOut}
              className="rail-logout-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
            <span className="rail-tip">Logout</span>
          </div>
        )}
      </nav>

      {accountOpen && <AccountDialog onClose={() => setAccountOpen(false)} />}
    </>
  )
}