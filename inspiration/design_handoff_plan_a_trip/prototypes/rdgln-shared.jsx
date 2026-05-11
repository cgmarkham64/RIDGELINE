// rdgln-shared.jsx — shared atoms used by all three variations
// Exposes globals: Icon, AppRail, HeroBand, MountainSilhouette, Stat, Pill,
// MapCanvas, Placeholder, SectionLabel, Field, Textarea, DayChip, ProgressBar,
// MOCK_TRIP, MOCK_DAYS

// ───────── Icons (stroke-based, match RIDGELINE icon set) ─────────
const Icon = ({ name, size = 17, stroke = 1.6, ...rest }) => {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round',
    strokeLinejoin: 'round', ...rest,
  };
  switch (name) {
    case 'log':       return <svg {...common}><polyline points="2 21 8 6 13 14 17 9 22 21" /></svg>;
    case 'map':       return <svg {...common}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>;
    case 'photos':    return <svg {...common}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
    case 'gear':      return <svg {...common}><path d="M9 4a3 3 0 0 1 6 0" /><path d="M5 8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8z" /><path d="M9 20v-5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case 'plan':      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>;
    case 'plus':      return <svg {...common}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case 'check':     return <svg {...common}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'circle':    return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
    case 'dot':       return <svg {...common}><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" /></svg>;
    case 'arrow-r':   return <svg {...common}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case 'arrow-l':   return <svg {...common}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
    case 'pin':       return <svg {...common}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case 'tent':      return <svg {...common}><path d="M3 21l9-15 9 15z" /><path d="M12 6v15" /><path d="M9 21l3-4 3 4" /></svg>;
    case 'water':     return <svg {...common}><path d="M12 3s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z" /></svg>;
    case 'sun':       return <svg {...common}><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /><line x1="5" y1="5" x2="7" y2="7" /><line x1="17" y1="17" x2="19" y2="19" /><line x1="5" y1="19" x2="7" y2="17" /><line x1="17" y1="7" x2="19" y2="5" /></svg>;
    case 'cloud':     return <svg {...common}><path d="M17 18a4 4 0 0 0 0-8 6 6 0 0 0-11.7-1.5A4.5 4.5 0 0 0 6 18z" /></svg>;
    case 'mountain':  return <svg {...common}><polyline points="3 20 9 8 13 14 17 6 21 20" /></svg>;
    case 'permit':    return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="7" y1="9" x2="17" y2="9" /><line x1="7" y1="13" x2="17" y2="13" /><line x1="7" y1="17" x2="13" y2="17" /></svg>;
    case 'plane':     return <svg {...common}><path d="M22 16l-10-3V4l-2 0v9L2 16l0 2 8-1v5l-2 1v1l4-1 4 1v-1l-2-1v-5l8 1z" /></svg>;
    case 'pdf':       return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="14" x2="16" y2="14" /><line x1="8" y1="18" x2="14" y2="18" /></svg>;
    case 'phone':     return <svg {...common}><rect x="6" y="2" width="12" height="20" rx="2" /><line x1="11" y1="18" x2="13" y2="18" /></svg>;
    case 'search':    return <svg {...common}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case 'edit':      return <svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    case 'expand':    return <svg {...common}><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>;
    case 'chev-r':    return <svg {...common}><polyline points="9 18 15 12 9 6" /></svg>;
    case 'chev-d':    return <svg {...common}><polyline points="6 9 12 15 18 9" /></svg>;
    case 'food':      return <svg {...common}><path d="M3 12h18" /><path d="M5 12V8a7 7 0 0 1 14 0v4" /><path d="M3 12v3a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-3" /></svg>;
    case 'bus':       return <svg {...common}><rect x="4" y="3" width="16" height="14" rx="2" /><line x1="4" y1="11" x2="20" y2="11" /><circle cx="8" cy="19" r="1.5" /><circle cx="16" cy="19" r="1.5" /></svg>;
    case 'wind':      return <svg {...common}><path d="M3 8h13a3 3 0 1 0-3-3" /><path d="M3 14h17a3 3 0 1 1-3 3" /></svg>;
    default: return null;
  }
};

// ───────── Mountain silhouette (matches TripHero) ─────────
const MountainSilhouette = () => (
  <svg
    viewBox="0 0 1200 200"
    preserveAspectRatio="xMidYMax slice"
    style={{ display: 'block', width: '100%', height: 140 }}
  >
    <polygon
      points="0,200 130,200 230,68 340,140 470,28 590,108 710,44 840,125 970,62 1100,138 1200,90 1200,200"
      fill="#0f0d0b" opacity="0.97"
    />
    <polygon
      points="0,200 80,200 170,105 280,160 400,55 510,122 630,50 760,130 890,68 1020,148 1130,88 1200,120 1200,200"
      fill="#13100a" opacity="0.52"
    />
  </svg>
);

// ───────── Hero band ─────────
const HeroBand = ({ kicker, title, subtitle, right, height = 140 }) => (
  <div className="hero-band" style={{ height }}>
    <div className="hero-band__mountains"><MountainSilhouette /></div>
    <div className="hero-band__vignette" />
    <div className="hero-band__content">
      <div>
        {kicker && (
          <div className="kicker kicker-amber" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ display: 'inline-block', width: 12, height: 1, background: 'var(--color-amber)', opacity: 0.5 }} />
            {kicker}
          </div>
        )}
        <h1 style={{ fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: 4 }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--color-text-mid)' }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  </div>
);

// ───────── App rail ─────────
const AppRail = ({ active = 'plan' }) => (
  <nav className="app-rail">
    <div className="app-rail__brand">RDGLN</div>
    {[
      { id: 'log',    label: 'Trips' },
      { id: 'plan',   label: 'Plan' },
      { id: 'map',    label: 'Map' },
      { id: 'photos', label: 'Photos' },
      { id: 'gear',   label: 'Gear' },
    ].map((it) => (
      <button
        key={it.id}
        className={`app-rail__btn${active === it.id ? ' active' : ''}`}
        title={it.label}
      >
        <Icon name={it.id} size={17} />
      </button>
    ))}
    <div style={{ flex: 1 }} />
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-3)', border: '1.5px solid var(--color-border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 800, color: 'var(--color-amber)' }}>
      CM
    </div>
  </nav>
);

// ───────── Stat ─────────
const Stat = ({ value, label, tone = 'amber' }) => (
  <div className="stat">
    <div className="stat__v" style={{ color: `var(--color-${tone})` }}>{value}</div>
    <div className="stat__l">{label}</div>
  </div>
);
const StatStrip = ({ items }) => (
  <div style={{ display: 'flex', gap: 1, borderRadius: 8, overflow: 'hidden' }}>
    {items.map((it, i) => (
      <div key={i} className="stat" style={{ background: 'rgba(15,13,11,0.82)', backdropFilter: 'blur(10px)' }}>
        <div className="stat__v">{it.value}</div>
        <div className="stat__l">{it.label}</div>
      </div>
    ))}
  </div>
);

// ───────── Pill ─────────
const Pill = ({ tone = '', icon, children }) => (
  <span className={`pill${tone ? ' pill-' + tone : ''}`}>
    {icon && <Icon name={icon} size={10} stroke={2} />}
    {children}
  </span>
);

// ───────── Map placeholder with topographic lines ─────────
const MapCanvas = ({ children, showRoute = true, planned = true, label = 'PLANNED ROUTE · GPX' }) => (
  <div className="map-canvas" style={{ width: '100%', height: '100%' }}>
    <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" className="topo">
      {/* topo contours */}
      <g fill="none" stroke="rgba(154,136,120,0.18)" strokeWidth="0.7">
        <path d="M 50 80 Q 200 30, 400 90 T 600 120" />
        <path d="M 30 130 Q 200 90, 420 140 T 600 170" />
        <path d="M 0 180 Q 180 150, 380 200 T 600 220" />
        <path d="M 0 230 Q 200 210, 400 250 T 600 280" />
        <path d="M 20 290 Q 220 270, 420 310 T 600 330" />
        <path d="M 0 350 Q 180 340, 400 360 T 600 380" />
      </g>
      <g fill="none" stroke="rgba(154,136,120,0.10)" strokeWidth="0.5">
        <path d="M 50 60 Q 200 20, 400 70 T 600 100" />
        <path d="M 30 110 Q 200 70, 420 120 T 600 150" />
        <path d="M 0 160 Q 180 130, 380 180 T 600 200" />
      </g>
      {/* grid */}
      <g stroke="rgba(154,136,120,0.05)" strokeWidth="0.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={'v' + i} x1={50 * i} y1="0" x2={50 * i} y2="400" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={'h' + i} x1="0" y1={50 * i} x2="600" y2={50 * i} />
        ))}
      </g>
      {showRoute && (
        <>
          <path
            d="M 80 320 L 120 280 L 165 250 L 220 240 L 280 200 L 340 180 L 400 140 L 460 160 L 520 110"
            fill="none"
            stroke={planned ? 'var(--color-amber)' : 'var(--color-pine)'}
            strokeWidth="2.5"
            strokeDasharray={planned ? '6 4' : '0'}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
          {/* waypoints */}
          {[
            [80, 320, 'pine', 'TH'], [220, 240, 'sky', 'C1'], [340, 180, 'sky', 'C2'],
            [460, 160, 'sky', 'C3'], [520, 110, 'amber', 'END'],
          ].map(([x, y, tone, lbl], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle r="9" fill="rgba(15,13,11,0.92)" stroke={`var(--color-${tone})`} strokeWidth="1.5" />
              <text textAnchor="middle" y="3" fontSize="8" fontFamily="var(--font-mono)" fill={`var(--color-${tone})`} fontWeight="600">{lbl}</text>
            </g>
          ))}
        </>
      )}
    </svg>
    <div style={{
      position: 'absolute', top: 10, left: 10,
      fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em',
      textTransform: 'uppercase', color: 'var(--color-text-dim)',
      background: 'rgba(15,13,11,0.6)', padding: '4px 8px',
      border: '1px solid var(--color-border)', borderRadius: 4,
    }}>{label}</div>
    {children}
  </div>
);

// ───────── Placeholder image (striped) ─────────
const Placeholder = ({ label = 'PRODUCT SHOT', height = 120, style }) => (
  <div className="placeholder" style={{ height, ...style }}>{label}</div>
);

// ───────── Section label with optional number ─────────
const SectionLabel = ({ num, children, action }) => (
  <div className="sec-label">
    {num != null && <span className="num">{num}</span>}
    <span>{children}</span>
    {action}
  </div>
);

// ───────── Form bits ─────────
const Field = ({ label, ...rest }) => (
  <div>
    {label && <label className="lbl">{label}</label>}
    <input className="fld" {...rest} />
  </div>
);
const TextArea = ({ label, ...rest }) => (
  <div>
    {label && <label className="lbl">{label}</label>}
    <textarea className="fld" {...rest} />
  </div>
);

// ───────── Day chip ─────────
const DayChip = ({ n, date, active, onClick, hasContent }) => (
  <button onClick={onClick} className={`day-chip${active ? ' active' : ''}`}>
    <div className="day-chip__num">{n}</div>
    <div className="day-chip__date">{date}</div>
    {hasContent && (
      <span style={{
        position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
        width: 4, height: 4, borderRadius: '50%',
        background: active ? 'var(--color-amber)' : 'var(--color-text-dim)',
      }} />
    )}
  </button>
);

// ───────── Progress bar ─────────
const ProgressBar = ({ value = 0, tone = 'amber' }) => (
  <div style={{ width: '100%', height: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
    <div style={{ width: `${value}%`, height: '100%', background: `var(--color-${tone})`, transition: 'width 200ms' }} />
  </div>
);

// ───────── Mock trip ─────────
const MOCK_TRIP = {
  title: 'Sierra High Route',
  location: 'Inyo NF, CA',
  dateRange: 'Aug 12 – Aug 19, 2026',
  days: 8,
  miles: 78,
  elev: '+18,400',
  weight: '34 lb',
  permit: 'Mt. Whitney Zone',
  permitDate: 'Releases Apr 1, 7AM PT',
  party: ['CM', 'JT', 'LK'],
};

const MOCK_DAYS = [
  { n: 1, date: 'AUG 12', miles: 8.2,  to: 'Onion Valley TH → Kearsarge Lakes',  camp: 'Kearsarge Lakes',   water: 'reliable',  exp: 'low'  },
  { n: 2, date: 'AUG 13', miles: 11.4, to: 'Kearsarge → Vidette Meadow',          camp: 'Vidette Meadow',    water: 'reliable',  exp: 'low'  },
  { n: 3, date: 'AUG 14', miles: 9.7,  to: 'Vidette → Center Basin',              camp: 'Center Basin',      water: 'reliable',  exp: 'med'  },
  { n: 4, date: 'AUG 15', miles: 12.8, to: 'Center Basin → Lake South America',   camp: 'Lake S. America',   water: 'reliable',  exp: 'high' },
  { n: 5, date: 'AUG 16', miles: 8.6,  to: 'Lake S.A. → Wallace Lake',            camp: 'Wallace Lake',      water: 'reliable',  exp: 'high' },
  { n: 6, date: 'AUG 17', miles: 10.1, to: 'Wallace → Crabtree Meadow',           camp: 'Crabtree Meadow',   water: 'reliable',  exp: 'med'  },
  { n: 7, date: 'AUG 18', miles: 11.0, to: 'Crabtree → Whitney Summit → Trail Crest', camp: 'Trail Crest',   water: 'caches',    exp: 'extreme' },
  { n: 8, date: 'AUG 19', miles: 6.2,  to: 'Trail Crest → Whitney Portal',        camp: '—',                 water: 'reliable',  exp: 'low'  },
];

// Expose to other Babel scripts
Object.assign(window, {
  Icon, AppRail, HeroBand, MountainSilhouette,
  Stat, StatStrip, Pill, MapCanvas, Placeholder, SectionLabel,
  Field, TextArea, DayChip, ProgressBar,
  MOCK_TRIP, MOCK_DAYS,
});
