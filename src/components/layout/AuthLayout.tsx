import type { ReactNode } from 'react'

function MountainsSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 220"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <defs>
        <linearGradient id="auth-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0a08" />
          <stop offset="55%" stopColor="#14100a" />
          <stop offset="100%" stopColor="#1e1408" />
        </linearGradient>
        <linearGradient id="auth-alpenglow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="25%" stopColor="#f0a030" stopOpacity="0" />
          <stop offset="68%" stopColor="#e08820" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#c07010" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="1440" height="220" fill="url(#auth-sky)" />
      {/* Alpenglow */}
      <rect width="1440" height="220" fill="url(#auth-alpenglow)" />

      {/* Distant range — dark indigo silhouette */}
      <path
        d="M0,145 C120,100 200,125 320,80 C440,38 520,88 640,55 C760,22 840,78 960,50
           C1080,22 1160,82 1280,60 C1360,44 1420,75 1440,68 L1440,220 L0,220 Z"
        fill="#19172a"
      />

      {/* Far range — dark warm brown */}
      <path
        d="M0,168 C100,132 200,152 320,112 C440,72 540,122 660,98 C780,74 880,118 1000,92
           C1120,66 1220,112 1340,92 C1400,82 1432,102 1440,98 L1440,220 L0,220 Z"
        fill="#1e1a12"
      />

      {/* Mid range */}
      <path
        d="M0,188 C80,162 160,178 260,150 C360,122 440,158 560,138 C680,118 760,150 880,132
           C1000,114 1100,148 1200,130 C1300,112 1380,140 1440,132 L1440,220 L0,220 Z"
        fill="#181410"
      />

      {/* Near foreground ridge */}
      <path
        d="M0,220 L0,200 C80,190 160,200 240,184 C320,168 400,188 480,175 C560,162 640,180
           720,168 C800,156 880,175 960,163 C1040,151 1120,170 1200,160 C1280,150 1360,168
           1440,158 L1440,220 Z"
        fill="#130f09"
      />
    </svg>
  )
}

function RiverSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 110"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      {/* Background */}
      <rect width="1440" height="110" fill="#0f0d0b" />

      {/* Upper bank */}
      <path
        d="M0,0 L1440,0 L1440,38 C1200,28 960,44 720,32 C480,20 240,40 0,28 Z"
        fill="#131008"
      />

      {/* River water body */}
      <path
        d="M0,28 C240,40 480,20 720,32 C960,44 1200,28 1440,38
           L1440,75 C1200,65 960,80 720,68 C480,56 240,72 0,60 Z"
        fill="#1a3040"
      />

      {/* Ripple lines */}
      <path
        d="M0,38 C200,34 400,42 600,36 C800,30 1000,38 1200,34 C1300,32 1380,36 1440,34"
        stroke="#5ab4dc" strokeWidth="0.8" fill="none" opacity="0.40"
      />
      <path
        d="M0,49 C200,45 400,53 600,47 C800,41 1000,49 1200,45 C1300,43 1380,47 1440,45"
        stroke="#5ab4dc" strokeWidth="0.7" fill="none" opacity="0.26"
      />
      <path
        d="M0,60 C200,56 400,64 600,58 C800,52 1000,60 1200,56 C1300,54 1380,58 1440,56"
        stroke="#5ab4dc" strokeWidth="0.6" fill="none" opacity="0.18"
      />

      {/* Water sparkles */}
      <circle cx="180"  cy="51" r="1.2" fill="#5ab4dc" opacity="0.44" />
      <circle cx="420"  cy="44" r="0.8" fill="#5ab4dc" opacity="0.32" />
      <circle cx="660"  cy="53" r="1.0" fill="#5ab4dc" opacity="0.38" />
      <circle cx="900"  cy="46" r="0.8" fill="#5ab4dc" opacity="0.32" />
      <circle cx="1140" cy="51" r="1.2" fill="#5ab4dc" opacity="0.44" />
      <circle cx="1320" cy="45" r="0.8" fill="#5ab4dc" opacity="0.32" />

      {/* Lower bank */}
      <path
        d="M0,60 C240,72 480,56 720,68 C960,80 1200,65 1440,75 L1440,110 L0,110 Z"
        fill="#131008"
      />
    </svg>
  )
}

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <MountainsSvg />
        <div className="auth-brand">
          <span className="auth-brand-text">RIDGELINE</span>
        </div>
      </header>
      <main className="auth-main">{children}</main>
      <footer className="auth-footer">
        <RiverSvg />
      </footer>
    </div>
  )
}