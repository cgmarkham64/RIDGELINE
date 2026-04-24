import { Link } from '@tanstack/react-router'

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
    <Link
      to={to}
      title={title}
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
  )
}

export function IconRail() {
  return (
    <nav
      style={{
        width: 64,
        flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0 20px',
        gap: 2,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.22em',
          color: 'var(--amber)',
          writingMode: 'vertical-lr',
          transform: 'rotate(180deg)',
          marginBottom: 20,
          userSelect: 'none',
        }}
      >
        RDGLN
      </div>

      <NavLink to="/" title="Trip Log">
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

      <div style={{ flex: 1 }} />
    </nav>
  )
}
