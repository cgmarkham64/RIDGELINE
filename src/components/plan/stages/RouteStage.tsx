import { JumpChip } from '../JumpChip'
import { Pill } from '../Pill'
import { ProgressBar } from '../ProgressBar'
import type { StageBodyProps } from '../types'

// ─── Mock data (replace when backend is wired) ────────────────────────────────

const SEGMENTS = [
  { n: 1, name: 'Onion Valley → Kearsarge Pass',  mi: 5.0,  gain: 2700, cls: '1',   notes: 'Standard trail to 11,760 ft' },
  { n: 2, name: 'Kearsarge → Rae Lakes',           mi: 14.0, gain: 1600, cls: '1',   notes: 'JMT, well-watered' },
  { n: 3, name: 'Rae Lakes → Sixty Lake Basin',    mi: 18.0, gain: 4400, cls: '2-3', notes: 'Cross-country, class-3 col' },
  { n: 4, name: 'Sixty Lake → Bench Lake',         mi: 22.0, gain: 5100, cls: '2-3', notes: 'Big day · 2 passes' },
  { n: 5, name: 'Bench Lake → Lake Marjorie',      mi: 16.0, gain: 3800, cls: '2',   notes: 'Off-trail meadow traverse' },
  { n: 6, name: 'Lake Marjorie → Crabtree',        mi: 19.0, gain: 4200, cls: '2',   notes: 'Forester Pass · 13,153 ft' },
  { n: 7, name: 'Crabtree → Guitar Lake',          mi: 14.0, gain: 2800, cls: '1',   notes: 'Sets up Whitney summit' },
  { n: 8, name: 'Guitar Lake → Whitney Portal',    mi: 17.0, gain: 4400, cls: '1',   notes: 'Summit 14,505 ft, then 6k descent' },
]

const PARTNERS = [
  { initials: 'CM', name: 'Casey M.',  role: 'organizer', ready: true  },
  { initials: 'JT', name: 'Jamie T.',  role: 'gear lead', ready: true  },
  { initials: 'LK', name: 'Lin K.',    role: 'medic',     ready: true  },
  { initials: 'RP', name: 'Rae P.',    role: 'logistics', ready: false },
]

const SOURCE_FILES = [
  { name: 'sierra-high-route.gpx', meta: '142 KB · 1,847 pts' },
  { name: 'sierra-camps.kml',      meta: '8 KB · 8 camps' },
  { name: 'notes.md',             meta: '4 KB · Roper notes' },
]

const CHECKLIST = [
  'Route picked',
  'Entry trailhead',
  'Exit trailhead',
  'Distance & gain confirmed',
  'Segments split',
  'Partners reviewed',
]

// Elevation points (ft) at trailhead + 7 camps + summit
const ELEV_PTS = [9200, 11760, 10900, 11400, 13200, 11800, 13153, 10640, 14505]
const ELEV_LABELS = ['TH', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'END']

// ─── Sub-components ───────────────────────────────────────────────────────────

function MapTopo() {
  const WAYPOINTS = [
    { x: 80,  y: 320, stroke: 'var(--color-pine)',  label: 'TH'  },
    { x: 220, y: 240, stroke: 'var(--color-sky)',   label: 'C1'  },
    { x: 340, y: 180, stroke: 'var(--color-sky)',   label: 'C2'  },
    { x: 460, y: 160, stroke: 'var(--color-sky)',   label: 'C3'  },
    { x: 520, y: 110, stroke: 'var(--color-amber)', label: 'END' },
  ]

  return (
    <div className="relative rounded border border-border overflow-hidden" style={{ height: 220, background: '#0e1810' }}>
      <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full pointer-events-none">
        {/* topo contours */}
        <g fill="none" stroke="rgba(154,136,120,0.18)" strokeWidth="0.7">
          <path d="M 50 80 Q 200 30, 400 90 T 600 120" />
          <path d="M 30 130 Q 200 90, 420 140 T 600 170" />
          <path d="M 0 180 Q 180 150, 380 200 T 600 220" />
          <path d="M 0 230 Q 200 210, 400 250 T 600 280" />
          <path d="M 20 290 Q 220 270, 420 310 T 600 330" />
        </g>
        {/* grid */}
        <g stroke="rgba(154,136,120,0.05)" strokeWidth="0.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v${i}`} x1={50 * i} y1="0" x2={50 * i} y2="400" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={50 * i} x2="600" y2={50 * i} />
          ))}
        </g>
        {/* route */}
        <path
          d="M 80 320 L 120 280 L 165 250 L 220 240 L 280 200 L 340 180 L 400 140 L 460 160 L 520 110"
          fill="none" stroke="var(--color-amber)" strokeWidth="2.5"
          strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"
        />
        {/* waypoints */}
        {WAYPOINTS.map((w) => (
          <g key={w.label} transform={`translate(${w.x} ${w.y})`}>
            <circle r="9" fill="rgba(15,13,11,0.92)" stroke={w.stroke} strokeWidth="1.5" />
            <text textAnchor="middle" y="3" fontSize="8" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fill: w.stroke }}>
              {w.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="absolute top-2.5 left-2.5 font-mono text-[8px] tracking-[0.16em] uppercase text-text-dim bg-bg/60 backdrop-blur px-2 py-1 border border-border rounded">
        PLANNED ROUTE · GPX · 149 MI
      </div>
    </div>
  )
}

function ElevationProfile() {
  const W = 720, H = 120, MIN_E = 9000, MAX_E = 15000

  const pts = ELEV_PTS.map((e, i) => ({
    x: (i / (ELEV_PTS.length - 1)) * W,
    y: H - ((e - MIN_E) / (MAX_E - MIN_E)) * (H - 14) - 4,
    e,
  }))

  const linePts = pts.map(p => `${p.x},${p.y}`).join(' ')
  const areaPts = `0,${H} ${linePts} ${W},${H}`

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((p, i) => (
          <line key={i} x1="0" y1={H * p} x2={W} y2={H * p} stroke="rgba(154,136,120,0.08)" strokeWidth="0.6" strokeDasharray="3 3" />
        ))}
        <polygon points={areaPts} fill="var(--color-amber-dim)" />
        <polyline points={linePts} fill="none" stroke="var(--color-amber)" strokeWidth="1.6" strokeLinejoin="round" />
        {pts.map((pt) => (
          <g key={pt.e + pt.x}>
            <circle cx={pt.x} cy={pt.y} r="3.5" fill="var(--color-bg)" stroke="var(--color-amber)" strokeWidth="1.4" />
            <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize="8" style={{ fontFamily: 'var(--font-mono)', fill: 'var(--color-text-mid)' }}>
              {pt.e.toLocaleString()}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-1.5">
        {ELEV_LABELS.map(l => (
          <span key={l} className="font-mono text-[8px] text-text-dim tracking-[0.08em]">{l}</span>
        ))}
      </div>
    </div>
  )
}

function CheckItem({ text, done }: { text: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${done ? 'bg-pine-dim border-pine-border text-pine' : 'border-border text-text-dim'}`}>
        {done && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className={`text-[12px] ${done ? 'text-text' : 'text-text-dim'}`}>{text}</span>
    </div>
  )
}

function StatField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1 block">{label}</label>
      <input
        className="w-full px-3 py-2 border border-border rounded-sm text-[13px] bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors"
        defaultValue={value}
        readOnly
      />
    </div>
  )
}

// ─── Route Stage ─────────────────────────────────────────────────────────────

export function RouteStage({ onJump }: StageBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 max-w-[1100px]" style={{ gridTemplateColumns: '1fr 320px' }}>

        {/* ── Left column ── */}
        <div className="flex flex-col gap-[18px]">

          {/* Map card */}
          <div className="bg-surface border border-border rounded-lg p-[18px]">
            <div className="flex items-center gap-3 mb-3.5">
              <span className="w-8 h-8 rounded-md flex items-center justify-center bg-pine-dim border border-pine-border text-pine shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-heading text-[14px] font-extrabold text-text">Sierra High Route — Onion Valley → Whitney Portal</div>
                <div className="font-mono text-[9px] text-text-dim mt-0.5">149 mi · 38,200 ft gain · class 2-3 cross-country</div>
              </div>
              <Pill tone="pine">Locked</Pill>
              <button className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1.5 rounded border border-border text-text bg-transparent hover:border-border-mid transition-colors cursor-pointer ml-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            </div>

            <MapTopo />

            <div className="grid grid-cols-4 gap-2.5 mt-3.5">
              <StatField label="Distance" value="149 mi" />
              <StatField label="Gain"     value="38,200 ft" />
              <StatField label="Loss"     value="36,400 ft" />
              <StatField label="Segments" value="8" />
            </div>
          </div>

          {/* Elevation profile */}
          <div className="bg-surface border border-border rounded-lg p-[18px]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Elevation profile</span>
              <span className="font-mono text-[9px] text-text-mid">min 9,000 · max 14,505 ft</span>
            </div>
            <ElevationProfile />
          </div>

          {/* Segments table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim">Segments</span>
              <span className="font-mono text-[9px] text-text-dim">
                {SEGMENTS.length} · auto-pulls into{' '}
                <JumpChip to="days" onJump={onJump}>Days</JumpChip>
              </span>
              <button className="ml-auto inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1.5 rounded border border-border text-text bg-transparent hover:border-border-mid transition-colors cursor-pointer">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Split segment
              </button>
            </div>
            {SEGMENTS.map((s, i) => (
              <div
                key={s.n}
                className={`grid items-center px-4 py-2.5 gap-3 ${i < SEGMENTS.length - 1 ? 'border-b border-border' : ''} hover:bg-surface-2 transition-colors`}
                style={{ gridTemplateColumns: '36px 1fr 56px 68px 52px 1.4fr' }}
              >
                <span className="font-mono text-[9px] font-bold text-pine text-center py-0.5 rounded border border-pine-border bg-pine-dim">
                  S{s.n}
                </span>
                <span className="text-[12px] font-semibold text-text truncate">{s.name}</span>
                <span className="font-mono text-[10px] text-text">{s.mi} mi</span>
                <span className="font-mono text-[10px] text-text-mid">+{s.gain.toLocaleString()}</span>
                <span className="font-mono text-[10px] text-amber">cl {s.cls}</span>
                <span className="text-[10px] text-text-mid italic truncate">{s.notes}</span>
              </div>
            ))}
          </div>

          {/* Locked banner */}
          <div className="flex items-center gap-3 px-4 py-3 bg-pine-dim border border-pine-border rounded-lg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-pine shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-[11px] text-text-mid leading-relaxed">
              Route is locked. Editing here will recompute{' '}
              <JumpChip to="days" onJump={onJump}>Days</JumpChip>
              {' '}and trailheads in{' '}
              <JumpChip to="permits" onJump={onJump}>Permits</JumpChip>.
            </p>
          </div>
        </div>

        {/* ── Right rail ── */}
        <aside className="flex flex-col gap-3.5">

          {/* Stage checklist */}
          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
            {CHECKLIST.map(text => (
              <CheckItem key={text} text={text} done />
            ))}
            <div className="h-px bg-border my-3" />
            <ProgressBar value={100} tone="pine" />
            <div className="font-mono text-[9px] text-text-dim text-center mt-1.5">6 of 6</div>
          </div>

          {/* Partners */}
          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">Partners ({PARTNERS.length})</div>
            {PARTNERS.map((p, i) => (
              <div key={p.initials} className={`flex items-center gap-2.5 py-2 ${i < PARTNERS.length - 1 ? 'border-b border-border' : ''}`}>
                <span className="w-[26px] h-[26px] rounded-full bg-surface-3 border border-border-mid flex items-center justify-center font-heading text-[10px] font-extrabold text-amber shrink-0">
                  {p.initials}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-text">{p.name}</div>
                  <div className="font-mono text-[8px] text-text-dim mt-0.5">{p.role}</div>
                </div>
                {p.ready ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-pine shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="font-mono text-[8px] tracking-[0.12em] text-amber">PENDING</span>
                )}
              </div>
            ))}
          </div>

          {/* Source files */}
          <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-2.5">Source files</div>
            {SOURCE_FILES.map((f, i) => (
              <div key={f.name} className={`grid items-center gap-2.5 py-1.5 ${i < SOURCE_FILES.length - 1 ? 'border-b border-border' : ''}`} style={{ gridTemplateColumns: '14px 1fr' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-text-mid">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="14" x2="16" y2="14" />
                  <line x1="8" y1="18" x2="14" y2="18" />
                </svg>
                <div className="min-w-0">
                  <div className="font-mono text-[11px] text-text truncate">{f.name}</div>
                  <div className="font-mono text-[8px] text-text-dim mt-0.5">{f.meta}</div>
                </div>
              </div>
            ))}
          </div>

        </aside>
      </div>
    </div>
  )
}