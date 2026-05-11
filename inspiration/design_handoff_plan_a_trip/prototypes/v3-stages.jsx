// v3-stages.jsx — "The Stages Wizard" — non-linear edition
// You can be on any stage at any time. The rail is the map of your plan;
// the footer suggests the next unfinished stage rather than enforcing order.

const STAGES = [
  { id: 'route',   n: '01', label: 'Route',   sub: 'Where',           icon: 'map',      done: 6, total: 6 },
  { id: 'days',    n: '02', label: 'Days',    sub: 'Day-by-day',      icon: 'mountain', done: 8, total: 8 },
  { id: 'permits', n: '03', label: 'Permits', sub: 'Travel & access', icon: 'permit',   done: 4, total: 7 },
  { id: 'food',    n: '04', label: 'Food',    sub: 'Calories & H₂O',  icon: 'food',     done: 2, total: 6 },
  { id: 'gear',    n: '05', label: 'Gear',    sub: 'Loadout',         icon: 'gear',     done: 0, total: 5, blocked: true },
  { id: 'depart',  n: '06', label: 'Depart',  sub: 'Take it with',    icon: 'phone',    done: 0, total: 4 },
];

const stageState = (s) =>
  s.blocked ? 'blocked' :
  s.done === 0 ? 'idle' :
  s.done >= s.total ? 'done' :
  'progress';

// ───────── Completeness ring ─────────
const Ring = ({ done, total, size = 28, blocked, highlight }) => {
  const pct = blocked ? 1 : Math.max(0, Math.min(1, done / total));
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  const tone =
    blocked ? 'var(--color-red, #c44)' :
    done >= total && total > 0 ? 'var(--color-pine)' :
    done > 0 ? 'var(--color-amber)' : 'var(--color-text-dim)';
  return (
    <span style={{
      position: 'relative', width: size, height: size, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="var(--color-border)" strokeWidth={2} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={tone} strokeWidth={2}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 220ms' }} />
      </svg>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
        color: tone,
        letterSpacing: 0,
        background: highlight ? 'var(--color-amber-glow)' : 'transparent',
        borderRadius: 99, padding: '0 2px',
      }}>
        {blocked ? '!' : done >= total && total > 0
          ? <Icon name="check" size={11} stroke={2.6} />
          : `${done}/${total}`}
      </span>
    </span>
  );
};

// ───────── Cross-stage jump chip (used inline in body content) ─────────
const JumpChip = ({ to, onJump, children, icon }) => (
  <button
    onClick={() => onJump(to)}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '1px 7px 1px 6px',
      background: 'var(--color-amber-glow)',
      border: '1px solid var(--color-amber-border)',
      borderRadius: 4,
      color: 'var(--color-amber)',
      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
      cursor: 'pointer', verticalAlign: 'baseline',
      lineHeight: 1.4,
    }}
    title={`Jump to ${to}`}
  >
    {icon && <Icon name={icon} size={9} stroke={2} />}
    {children}
    <Icon name="arrow-r" size={9} stroke={2} />
  </button>
);

// ───────── Stage rail button ─────────
const StageRailItem = ({ stage, idx, active, onClick }) => {
  const state = stageState(stage);
  const isActive = active;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 10px',
        background: isActive ? 'var(--color-amber-glow)' : 'transparent',
        border: 'none',
        borderRadius: 6,
        borderLeft: `2px solid ${isActive ? 'var(--color-amber)' : 'transparent'}`,
        cursor: 'pointer', textAlign: 'left',
        marginBottom: 2,
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <Ring done={stage.done} total={stage.total} blocked={stage.blocked} highlight={isActive} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--color-text-dim)', letterSpacing: '0.08em',
          }}>{stage.n}</span>
          <span style={{
            fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700,
            color: isActive ? 'var(--color-amber)' :
                   state === 'done' ? 'var(--color-text-mid)' : 'var(--color-text)',
          }}>{stage.label}</span>
        </div>
        <div className="meta" style={{ fontSize: 8, textTransform: 'none', letterSpacing: 0, marginTop: 1 }}>
          {state === 'blocked' ? 'waiting on permit' :
           state === 'done' ? 'complete' :
           state === 'idle' ? 'not started' :
           `${stage.done} of ${stage.total} items`}
        </div>
      </div>
      {isActive && <Icon name="chev-r" size={11} stroke={2} style={{ color: 'var(--color-amber)' }} />}
    </button>
  );
};

const V3Stages = () => {
  const [view, setView] = React.useState('stage'); // 'overview' | 'stage'
  const [stage, setStage] = React.useState(2); // 0..5

  const totalDone = STAGES.reduce((a, s) => a + s.done, 0);
  const totalAll  = STAGES.reduce((a, s) => a + s.total, 0);

  // Pick the next unfinished stage (skipping blocked ones first)
  const nextUnfinished = (() => {
    const candidates = STAGES.map((s, i) => ({ s, i })).filter(x => x.i !== stage && stageState(x.s) !== 'done');
    const nonBlocked = candidates.filter(x => !x.s.blocked);
    return (nonBlocked[0] || candidates[0]);
  })();

  const jumpTo = (id) => {
    if (id === '__overview__') { setView('overview'); return; }
    const i = STAGES.findIndex(s => s.id === id);
    if (i >= 0) { setView('stage'); setStage(i); }
  };

  return (
    <div className="app-frame" style={{ flexDirection: 'row' }}>
      <AppRail active="plan" />

      {/* Left rail */}
      <aside style={{
        width: 280, flexShrink: 0,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="kicker kicker-amber" style={{ marginBottom: 6 }}>{MOCK_TRIP.location}</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800 }}>{MOCK_TRIP.title}</div>
          <div className="meta" style={{ fontSize: 9, marginTop: 4, textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>{MOCK_TRIP.dateRange}</div>
        </div>

        {/* Trip-plan overview entry */}
        <button
          onClick={() => setView('overview')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 18px',
            margin: '8px 8px 4px',
            borderRadius: 6,
            background: view === 'overview' ? 'var(--color-amber-glow)' : 'var(--color-surface-2)',
            border: '1px solid ' + (view === 'overview' ? 'var(--color-amber-border)' : 'var(--color-border)'),
            cursor: 'pointer', textAlign: 'left',
            transition: 'background 0.12s',
          }}
        >
          <span style={{
            width: 28, height: 28, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: view === 'overview' ? 'var(--color-amber-dim)' : 'var(--color-bg)',
            border: '1px solid ' + (view === 'overview' ? 'var(--color-amber-border)' : 'var(--color-border)'),
            color: view === 'overview' ? 'var(--color-amber)' : 'var(--color-text-mid)',
          }}>
            <Icon name="map" size={14} stroke={1.6} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: view === 'overview' ? 'var(--color-amber)' : 'var(--color-text)' }}>
              Plan overview
            </div>
            <div className="meta" style={{ fontSize: 8, textTransform: 'none', letterSpacing: 0, marginTop: 1 }}>
              {totalDone}/{totalAll} items · all stages
            </div>
          </div>
          {view === 'overview' && <Icon name="chev-r" size={11} stroke={2} style={{ color: 'var(--color-amber)' }} />}
        </button>

        <div style={{ padding: '8px 18px 4px' }}>
          <div className="kicker" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Stages</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-dim)', textTransform: 'none', letterSpacing: 0 }}>
              jump anywhere
            </span>
          </div>
        </div>

        <div style={{ padding: 8, flex: 1, overflowY: 'auto' }}>
          {STAGES.map((s, i) => (
            <StageRailItem
              key={s.id}
              stage={s}
              idx={i}
              active={view === 'stage' && i === stage}
              onClick={() => { setView('stage'); setStage(i); }}
            />
          ))}
        </div>

        {/* Snapshot */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--color-border)' }}>
          <div className="kicker" style={{ marginBottom: 8 }}>Snapshot</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <Stat value={MOCK_TRIP.miles} label="miles" />
            <Stat value={MOCK_TRIP.elev} label="gain" />
            <Stat value={MOCK_TRIP.days} label="days" />
            <Stat value={MOCK_TRIP.weight} label="base" />
          </div>
        </div>
      </aside>

      {/* Main area */}
      {view === 'overview' ? (
        <PlanOverview onJump={jumpTo} totalDone={totalDone} totalAll={totalAll} />
      ) : (
        <StageView
          stageIdx={stage}
          onJump={jumpTo}
          onSetStage={setStage}
          nextUnfinished={nextUnfinished}
        />
      )}
    </div>
  );
};

// ───────── Plan overview (god's-eye state) ─────────
const PlanOverview = ({ onJump, totalDone, totalAll }) => {
  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span className="kicker">Plan overview</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-text-dim)' }} />
          <span className="meta" style={{ fontSize: 9 }}>auto-saved 12s ago</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, letterSpacing: '-0.005em', marginBottom: 4 }}>The whole plan, at a glance.</h1>
            <div style={{ fontSize: 13, color: 'var(--color-text-mid)', maxWidth: 620 }}>
              Every stage and where it stands. Jump straight into whichever one needs you — order doesn't matter.
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--color-amber)', fontWeight: 700 }}>
              {totalDone}<span style={{ color: 'var(--color-text-dim)', fontSize: 16 }}>/{totalAll}</span>
            </div>
            <div className="meta" style={{ fontSize: 9 }}>items locked</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px 90px' }}>
        <div className="kicker" style={{ marginBottom: 12 }}>Stages</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {STAGES.map((s) => {
            const state = stageState(s);
            const tone =
              state === 'done' ? 'pine' :
              state === 'blocked' ? 'amber' :
              state === 'progress' ? 'amber' : 'text-dim';
            return (
              <button
                key={s.id}
                onClick={() => onJump(s.id)}
                className="card"
                style={{
                  padding: 16, textAlign: 'left', cursor: 'pointer',
                  background: 'var(--color-surface)',
                  display: 'flex', flexDirection: 'column', gap: 12,
                  borderColor: 'var(--color-border)',
                  transition: 'border-color 0.12s, transform 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-amber-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Ring done={s.done} total={s.total} blocked={s.blocked} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-dim)' }}>{s.n}</span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800 }}>{s.label}</span>
                    </div>
                    <div className="meta" style={{ fontSize: 9, marginTop: 2, textTransform: 'none', letterSpacing: 0 }}>{s.sub}</div>
                  </div>
                  {state === 'done' && <Pill tone="pine">Locked</Pill>}
                  {state === 'blocked' && <Pill tone="amber">Waiting</Pill>}
                  {state === 'progress' && <Pill tone="amber">In progress</Pill>}
                  {state === 'idle' && <Pill>Not started</Pill>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-mid)' }}>
                  {s.id === 'route' && '149 mi · Onion Valley → Whitney Portal · 8 days · approved by partners'}
                  {s.id === 'days' && '8 days laid out · 7 camps · longest day 22 mi · matches route exactly'}
                  {s.id === 'permits' && 'Whitney lottery scheduled. Need: return shuttle, backup route, reminders.'}
                  {s.id === 'food' && '2 of 6 done. Resupply at Kearsarge unconfirmed. No water cache plan yet.'}
                  {s.id === 'gear' && 'Locked until permit results (bear-can size depends on resupply).'}
                  {s.id === 'depart' && 'Pre-flight checklist, offline maps, emergency contacts — closest to start.'}
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 10, borderTop: '1px solid var(--color-border)',
                }}>
                  <span className="meta" style={{ fontSize: 9 }}>
                    {s.blocked ? 'unblock at Mar 24 results' : `${s.done} of ${s.total} items`}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-amber)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    Open <Icon name="arrow-r" size={10} stroke={2} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Critical path strip */}
        <div className="kicker" style={{ marginTop: 28, marginBottom: 12 }}>Critical path</div>
        <div className="card" style={{ padding: 0 }}>
          {[
            { d: 'Feb 1',  label: 'Whitney lottery opens',   stage: 'permits', tone: 'amber' },
            { d: 'Mar 15', label: 'Whitney lottery closes',  stage: 'permits', tone: 'amber' },
            { d: 'Mar 24', label: 'Lottery results — unblocks Gear',  stage: 'gear',    tone: 'sky' },
            { d: 'Jul 1',  label: 'Resupply box ships to Bishop',     stage: 'food',    tone: 'pine' },
            { d: 'Aug 11', label: 'Fly out — pre-flight checklist',   stage: 'depart',  tone: 'sky' },
          ].map((row, i, arr) => (
            <button
              key={i}
              onClick={() => onJump(row.stage)}
              style={{
                width: '100%', display: 'grid',
                gridTemplateColumns: '70px 1fr 110px 18px',
                gap: 14, alignItems: 'center',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--color-border)',
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                color: `var(--color-${row.tone})`,
                padding: '4px 6px', borderRadius: 4,
                background: `var(--color-${row.tone}-dim)`,
                border: `1px solid var(--color-${row.tone}-border)`,
                textAlign: 'center',
              }}>{row.d}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{row.label}</span>
              <span className="meta" style={{ fontSize: 9, textAlign: 'right' }}>
                {STAGES.find(s => s.id === row.stage).label}
              </span>
              <Icon name="chev-r" size={11} stroke={2} style={{ color: 'var(--color-text-dim)' }} />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
};

// ───────── Stage view (the actual editor for a single stage) ─────────
const StageView = ({ stageIdx, onJump, onSetStage, nextUnfinished }) => {
  const s = STAGES[stageIdx];
  const state = stageState(s);

  const titleMap = {
    route:   'Pick your route.',
    days:    'Lay out the days.',
    permits: 'Permits & travel logistics.',
    food:    'Food and water.',
    gear:    'Pack the gear.',
    depart:  'Take the plan with you.',
  };
  const subMap = {
    route:   'Define entry, exit, and the line through. Mileage and gain auto-tally.',
    days:    'Slot camps and daily mileage. Pulls directly from the route you chose.',
    permits: "Lock down access and how everyone gets to the trailhead. We'll surface critical dates.",
    food:    'Calorie targets and water. Resupply pulls dates from your day plan.',
    gear:    'Loadout. Bear-can sizing and weight depend on Permits and Food being settled first.',
    depart:  'Day-of essentials: offline maps, emergency contacts, the printable card.',
  };

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Stage header */}
      <div style={{ padding: '20px 32px 14px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
          flexWrap: 'wrap',
        }}>
          {/* Breadcrumb-y nav */}
          <button
            onClick={() => onJump('__overview__')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--color-text-dim)',
              padding: 0,
            }}
          >Plan</button>
          <Icon name="chev-r" size={9} stroke={2} style={{ color: 'var(--color-text-dim)' }} />
          <span className="kicker" style={{ color: 'var(--color-amber)' }}>Stage {s.n} · {s.label}</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-text-dim)' }} />
          <span className="meta" style={{ fontSize: 9 }}>auto-saved 12s ago</span>

          {/* State chip */}
          <span style={{ marginLeft: 'auto' }}>
            {state === 'done'     && <Pill tone="pine">Locked</Pill>}
            {state === 'blocked'  && <Pill tone="amber">Waiting on permit</Pill>}
            {state === 'progress' && <Pill tone="amber">{s.done}/{s.total} done</Pill>}
            {state === 'idle'     && <Pill>Not started</Pill>}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
          <h1 style={{ fontSize: 26, letterSpacing: '-0.005em' }}>{titleMap[s.id]}</h1>
          {/* Prev / Next stage scrubber */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              className="btn btn-ghost btn-sm"
              disabled={stageIdx === 0}
              onClick={() => onSetStage(stageIdx - 1)}
              title={stageIdx > 0 ? `Previous: ${STAGES[stageIdx - 1].label}` : ''}
              style={{ opacity: stageIdx === 0 ? 0.4 : 1 }}
            ><Icon name="arrow-l" size={10} stroke={2} /></button>
            <span className="meta" style={{ fontSize: 9, padding: '0 6px' }}>{stageIdx + 1} / {STAGES.length}</span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={stageIdx === STAGES.length - 1}
              onClick={() => onSetStage(stageIdx + 1)}
              title={stageIdx < STAGES.length - 1 ? `Next: ${STAGES[stageIdx + 1].label}` : ''}
              style={{ opacity: stageIdx === STAGES.length - 1 ? 0.4 : 1 }}
            ><Icon name="arrow-r" size={10} stroke={2} /></button>
          </div>
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--color-text-mid)', maxWidth: 640 }}>
          {subMap[s.id]}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 32px 90px' }}>
        {s.id === 'permits' && <PermitsStage onJump={onJump} />}
        {s.id === 'route'   && <RouteStage onJump={onJump} />}
        {s.id === 'days'    && <DaysStage onJump={onJump} />}
        {s.id === 'food'    && <FoodStage onJump={onJump} />}
        {s.id === 'gear'    && <GearStage onJump={onJump} />}
        {s.id === 'depart'  && <DepartStage onJump={onJump} />}
      </div>

      {/* Footer — non-linear */}
      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 32px',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onJump('__overview__')}>
            <Icon name="map" size={11} stroke={1.8} /> All stages
          </button>
          <button className="btn btn-ghost btn-sm">Save & exit</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {nextUnfinished && (
            <button
              className="btn btn-primary"
              onClick={() => onSetStage(nextUnfinished.i)}
              title="Auto-picks the next stage that needs work"
            >
              Save & jump to {nextUnfinished.s.label} <Icon name="arrow-r" size={11} stroke={2} />
            </button>
          )}
        </div>
      </footer>
    </main>
  );
};

// ───────── PERMITS — list-first primary + map view supplement ─────────
// Delegates to the dedicated components in permits-flow.jsx and adds a
// section-header toggle so users can flip the main column to map view.
const PermitsStage = ({ onJump }) => {
  const [view, setView] = React.useState('list');
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 18, flexWrap: 'wrap',
      }}>
        <span className="kicker">Permits view</span>
        <div style={{
          display: 'inline-flex',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 6, padding: 2,
        }}>
          {[
            { id: 'list', label: 'List + suggest', icon: 'plan' },
            { id: 'map',  label: 'Map view',       icon: 'map'  },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                padding: '6px 12px',
                background: view === v.id ? 'var(--color-amber-glow)' : 'transparent',
                border: 'none', borderRadius: 4,
                color: view === v.id ? 'var(--color-amber)' : 'var(--color-text-mid)',
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <Icon name={v.icon} size={10} stroke={1.8} />
              {v.label}
            </button>
          ))}
        </div>
        <span className="meta" style={{ marginLeft: 'auto', fontSize: 9, textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>
          List-first with auto-suggest is primary · map is a focused supplement
        </span>
      </div>
      {view === 'list'
        ? <PermitsListFirst profile="sierra" onJump={onJump} />
        : <PermitsMapFirst  profile="sierra" onJump={onJump} />}
    </div>
  );
};

// ───────── ROUTE ─────────
const ROUTE_SEGMENTS = [
  { n: 1, name: 'Onion Valley → Kearsarge Pass',  mi: 5.0,  gain: 2700, loss: 600,  class: '1',   notes: 'Standard trail to 11,760 ft' },
  { n: 2, name: 'Kearsarge → Rae Lakes',           mi: 14.0, gain: 1600, loss: 2400, class: '1',   notes: 'JMT, well-watered' },
  { n: 3, name: 'Rae Lakes → Sixty Lake Basin',    mi: 18.0, gain: 4400, loss: 3100, class: '2-3', notes: 'Cross-country, class-3 col' },
  { n: 4, name: 'Sixty Lake → Bench Lake',         mi: 22.0, gain: 5100, loss: 4200, class: '2-3', notes: 'Big day · 2 passes' },
  { n: 5, name: 'Bench Lake → Lake Marjorie',      mi: 16.0, gain: 3800, loss: 2900, class: '2',   notes: 'Off-trail meadow traverse' },
  { n: 6, name: 'Lake Marjorie → Crabtree',        mi: 19.0, gain: 4200, loss: 3400, class: '2',   notes: 'Forester Pass · 13,153 ft' },
  { n: 7, name: 'Crabtree → Guitar Lake',          mi: 14.0, gain: 2800, loss: 1700, class: '1',   notes: 'Sets up Whitney summit' },
  { n: 8, name: 'Guitar Lake → Whitney Portal',    mi: 17.0, gain: 4400, loss: 7400, class: '1',   notes: 'Summit 14,505 ft, then 6k descent' },
];

const ElevationProfile = () => {
  // 9 points (8 segments) — y is feet, scaled into 0..1 for visual
  const camps = [9200, 11760, 10900, 11400, 13200, 11800, 13153, 10640, 14505];
  const maxE = 15000, minE = 9000;
  const W = 720, H = 120;
  const pts = camps.map((e, i) => {
    const x = (i / (camps.length - 1)) * W;
    const y = H - ((e - minE) / (maxE - minE)) * (H - 14) - 4;
    return [x, y];
  });
  const linePts = pts.map(p => p.join(',')).join(' ');
  const areaPts = `0,${H} ${linePts} ${W},${H}`;
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((p, i) => (
          <line key={i} x1="0" y1={H * p} x2={W} y2={H * p} stroke="rgba(154,136,120,0.08)" strokeWidth="0.6" strokeDasharray="3 3" />
        ))}
        <polygon points={areaPts} fill="var(--color-amber-dim)" />
        <polyline points={linePts} fill="none" stroke="var(--color-amber)" strokeWidth="1.6" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="3.5" fill="var(--color-bg)" stroke="var(--color-amber)" strokeWidth="1.4" />
            <text x={x} y={y - 8} textAnchor="middle" fontSize="8" fontFamily="JetBrains Mono, monospace" fill="var(--color-text-mid)">{camps[i].toLocaleString()}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {['TH', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'END'].map((l, i) => (
          <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-dim)', letterSpacing: '0.08em' }}>{l}</span>
        ))}
      </div>
    </div>
  );
};

const RouteStage = ({ onJump }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, maxWidth: 1100 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Hero / map */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-pine-dim)', border: '1px solid var(--color-pine-border)', color: 'var(--color-pine)' }}>
            <Icon name="map" size={16} stroke={1.6} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800 }}>Sierra High Route — Onion Valley → Whitney Portal</div>
            <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 2 }}>149 mi · 38,200 ft gain · class 2-3 cross-country</div>
          </div>
          <Pill tone="pine">Locked</Pill>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 4 }}><Icon name="edit" size={10} stroke={1.8}/> Edit</button>
        </div>
        <div style={{ height: 220, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <MapCanvas label="PLANNED ROUTE · GPX · 149 MI" planned />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 14 }}>
          <Field label="Distance" defaultValue="149 mi" />
          <Field label="Gain"     defaultValue="38,200 ft" />
          <Field label="Loss"     defaultValue="36,400 ft" />
          <Field label="Segments" defaultValue="8" />
        </div>
      </div>

      {/* Elevation profile */}
      <div className="card" style={{ padding: 18 }}>
        <div className="kicker" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span>Elevation profile</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-mid)', letterSpacing: 0, textTransform: 'none' }}>
            min 9,000 · max 14,505 ft
          </span>
        </div>
        <ElevationProfile />
      </div>

      {/* Segments table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="kicker">Segments</span>
          <span className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>8 · auto-pulls into <JumpChip to="days" onJump={onJump} icon="mountain">Days</JumpChip></span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}><Icon name="plus" size={10} stroke={2}/> Split segment</button>
        </div>
        {ROUTE_SEGMENTS.map((s, i) => (
          <div key={s.n} style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 60px 70px 60px 1.4fr',
            gap: 12, alignItems: 'center',
            padding: '10px 16px',
            borderBottom: i === ROUTE_SEGMENTS.length - 1 ? 'none' : '1px solid var(--color-border)',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
              color: 'var(--color-pine)', padding: '3px 0', borderRadius: 4,
              background: 'var(--color-pine-dim)', border: '1px solid var(--color-pine-border)',
              textAlign: 'center',
            }}>S{s.n}</span>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{s.mi} mi</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-mid)' }}>+{s.gain.toLocaleString()}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-amber)' }}>cl {s.class}</span>
            <span style={{ fontSize: 10, color: 'var(--color-text-mid)', fontStyle: 'italic' }}>{s.notes}</span>
          </div>
        ))}
      </div>

      {/* Locked banner */}
      <div style={{ padding: 12, background: 'var(--color-pine-dim)', border: '1px solid var(--color-pine-border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon name="check" size={14} stroke={2.2} style={{ color: 'var(--color-pine)' }} />
        <div style={{ flex: 1, fontSize: 11, color: 'var(--color-text-mid)' }}>
          Route is locked. Editing here will recompute <JumpChip to="days" onJump={onJump} icon="mountain">Days</JumpChip> and trailheads in <JumpChip to="permits" onJump={onJump} icon="permit">Permits</JumpChip>.
        </div>
      </div>
    </div>

    <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>This stage</div>
        <Checkmark done text="Route picked" />
        <Checkmark done text="Entry trailhead" />
        <Checkmark done text="Exit trailhead" />
        <Checkmark done text="Distance & gain confirmed" />
        <Checkmark done text="Segments split" />
        <Checkmark done text="Partners reviewed" />
        <div className="hr" style={{ margin: '12px 0' }} />
        <ProgressBar value={100} tone="pine" />
        <div className="meta" style={{ marginTop: 6, fontSize: 9, textAlign: 'center' }}>6 of 6</div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>Partners (4)</div>
        {[
          { i: 'CM', n: 'Casey M.', r: 'organizer', ok: true },
          { i: 'JT', n: 'Jamie T.', r: 'gear lead', ok: true },
          { i: 'LK', n: 'Lin K.',   r: 'medic',     ok: true },
          { i: 'RP', n: 'Rae P.',   r: 'logistics', ok: false },
        ].map((p, i, arr) => (
          <div key={p.i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0',
            borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--color-border)',
          }}>
            <span style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--color-surface-3)', border: '1px solid var(--color-border-mid)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-heading)', fontSize: 10, fontWeight: 800,
              color: 'var(--color-amber)',
            }}>{p.i}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{p.n}</div>
              <div className="meta" style={{ fontSize: 8, textTransform: 'none', letterSpacing: 0, marginTop: 1 }}>{p.r}</div>
            </div>
            {p.ok
              ? <span style={{ color: 'var(--color-pine)' }}><Icon name="check" size={12} stroke={2.4} /></span>
              : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-amber)', letterSpacing: '0.12em' }}>PENDING</span>}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>Source files</div>
        {[
          { n: 'sierra-high-route.gpx',  s: '142 KB · 1,847 pts' },
          { n: 'sierra-camps.kml',       s: '8 KB · 8 camps' },
          { n: 'notes.md',               s: '4 KB · Roper notes' },
        ].map((f, i, arr) => (
          <div key={f.n} style={{
            display: 'grid', gridTemplateColumns: '14px 1fr',
            gap: 10, alignItems: 'center',
            padding: '6px 0',
            borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--color-border)',
          }}>
            <Icon name="pdf" size={11} stroke={1.6} style={{ color: 'var(--color-text-mid)' }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.n}</div>
              <div className="meta" style={{ fontSize: 8, textTransform: 'none', letterSpacing: 0, marginTop: 1 }}>{f.s}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  </div>
);

// ───────── DAYS ─────────
const DaysStage = ({ onJump }) => {
  const days = [
    { n: 1, from: 'Onion Valley',  to: 'Charlotte Lake', mi: 12, gain: 3200, water: 'reliable', exp: 'low'    },
    { n: 2, from: 'Charlotte Lake', to: 'Rae Lakes',     mi: 14, gain: 2100, water: 'reliable', exp: 'low'    },
    { n: 3, from: 'Rae Lakes',     to: 'Sixty Lake',     mi: 18, gain: 4400, water: 'reliable', exp: 'med'    },
    { n: 4, from: 'Sixty Lake',    to: 'Bench Lake',     mi: 22, gain: 5100, water: 'reliable', exp: 'high', hard: true },
    { n: 5, from: 'Bench Lake',    to: 'Lake Marjorie',  mi: 16, gain: 3800, water: 'reliable', exp: 'med'    },
    { n: 6, from: 'Lake Marjorie', to: 'Crabtree',       mi: 19, gain: 4200, water: 'caches',   exp: 'high'   },
    { n: 7, from: 'Crabtree',      to: 'Guitar Lake',    mi: 14, gain: 2800, water: 'reliable', exp: 'med'    },
    { n: 8, from: 'Guitar Lake',   to: 'Whitney Portal', mi: 17, gain: 4400, water: 'reliable', exp: 'extreme', hard: true },
  ];
  const [sel, setSel] = React.useState(3);
  const d = days[sel];
  const totalMi   = days.reduce((a, x) => a + x.mi, 0);
  const totalGain = days.reduce((a, x) => a + x.gain, 0);
  const longest   = Math.max(...days.map(x => x.mi));
  const expTone   = { low: 'pine', med: 'sky', high: 'amber', extreme: 'red' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, maxWidth: 1100 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Header strip */}
        <div className="card" style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--color-border)' }}>
          {[
            { v: `${totalMi}`, l: 'total miles' },
            { v: `${totalGain.toLocaleString()}`, l: 'gain (ft)' },
            { v: `${longest}`, l: 'longest day' },
            { v: '7', l: 'camps' },
          ].map(s => (
            <div key={s.l} style={{ background: 'var(--color-surface)', padding: '8px 12px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: 'var(--color-amber)' }}>{s.v}</div>
              <div className="meta" style={{ fontSize: 8, marginTop: 1 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Day rows — clickable */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {days.map((dd, i) => (
            <button
              key={dd.n}
              onClick={() => setSel(i)}
              style={{
                width: '100%', textAlign: 'left',
                display: 'grid', gridTemplateColumns: '52px 1fr 70px 90px 70px 60px',
                gap: 14, alignItems: 'center',
                padding: '12px 16px',
                background: sel === i ? 'var(--color-amber-glow)' : 'transparent',
                borderBottom: i === days.length - 1 ? 'none' : '1px solid var(--color-border)',
                borderLeft: `2px solid ${sel === i ? 'var(--color-amber)' : 'transparent'}`,
                cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-text)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-amber)', fontWeight: 700, padding: '4px 8px', background: 'var(--color-amber-dim)', border: '1px solid var(--color-amber-border)', borderRadius: 4, textAlign: 'center' }}>
                D{dd.n}
              </span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{dd.from} → {dd.to}</div>
                <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 2 }}>
                  Aug {11 + dd.n} · water {dd.water}
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{dd.mi} mi</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-mid)' }}>{dd.gain.toLocaleString()} ft</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                color: `var(--color-${expTone[dd.exp]})`,
                padding: '3px 6px', borderRadius: 4,
                background: `var(--color-${expTone[dd.exp]}-dim)`,
                border: `1px solid var(--color-${expTone[dd.exp]}-border)`,
                textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>{dd.exp}</span>
              {dd.hard
                ? <Pill tone="amber">tough</Pill>
                : <span style={{ color: 'var(--color-pine)' }}><Icon name="check" size={12} stroke={2.5} /></span>}
            </button>
          ))}
        </div>

        {/* Selected day detail */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <span className="kicker kicker-amber">Day {d.n}</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800 }}>{d.from} → {d.to}</span>
            <span className="meta" style={{ fontSize: 9, marginLeft: 'auto' }}>{d.mi} mi · {d.gain.toLocaleString()} ft</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            <Field label="Wake" defaultValue="5:30 AM" />
            <Field label="On-trail" defaultValue="6:15 AM" />
            <Field label="Camp by" defaultValue="6:00 PM" />
          </div>
          <div className="kicker" style={{ marginBottom: 8 }}>Waypoints</div>
          {[
            { t: '6:30 AM', n: 'Leave camp', loc: d.from, icon: 'tent' },
            { t: '10:30 AM', n: 'Pass / col', loc: d.n === 4 ? 'Cartridge Pass · 12,650 ft' : 'Mid-day pass', icon: 'mountain' },
            { t: '1:00 PM',  n: 'Lunch + water', loc: 'Lake outflow', icon: 'water' },
            { t: '5:30 PM',  n: 'Make camp', loc: d.to, icon: 'tent' },
          ].map((w, i, arr) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '70px 22px 1fr',
              gap: 12, alignItems: 'center',
              padding: '8px 0',
              borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--color-border)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-mid)' }}>{w.t}</span>
              <Icon name={w.icon} size={12} stroke={1.8} style={{ color: 'var(--color-amber)' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{w.n}</div>
                <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 1 }}>{w.loc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Helper */}
        <div style={{ padding: 12, background: 'var(--color-amber-dim)', border: '1px solid var(--color-amber-border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--color-text-mid)' }}>
          <Icon name="cloud" size={14} stroke={1.8} style={{ color: 'var(--color-amber)' }} />
          <span>Day 4 and Day 8 push past 20 mi — confirm caloric load in <JumpChip to="food" onJump={onJump} icon="food">Food</JumpChip></span>
        </div>
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: 14 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>This stage</div>
          <Checkmark done text="8 days mapped" />
          <Checkmark done text="Camps assigned" />
          <Checkmark done text="Daily mileage" />
          <Checkmark done text="Water sources" />
          <Checkmark done text="Exposure flagged" />
          <Checkmark done text="Tough days reviewed" />
          <Checkmark done text="Bail-out points" />
          <Checkmark done text="Synced with Route" />
          <div className="hr" style={{ margin: '12px 0' }} />
          <ProgressBar value={100} tone="pine" />
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>Forecast — Aug 15</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="sun" size={24} stroke={1.4} style={{ color: 'var(--color-amber)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800 }}>72° / 38°</div>
              <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 2 }}>Clear · light NW wind</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-mid)', marginTop: 8, fontStyle: 'italic' }}>
            10-day window before trip. Re-check 72 hrs out.
          </div>
        </div>
      </aside>
    </div>
  );
};

// ───────── FOOD ─────────
const MEAL_PLAN = [
  { n: 1, b: 'Granola + powder',     l: 'Tuna wrap',          d: 'Mtn House Beef Stew',   s: '2 bars · gummies',  cal: 3500 },
  { n: 2, b: 'Oats + nut butter',    l: 'Salami + cheese',    d: 'Pad thai (Backpack)',   s: '2 bars · jerky',    cal: 3700 },
  { n: 3, b: 'Granola + powder',     l: 'Tortilla pizza',     d: 'Mtn House Lasagna',     s: '3 bars · gummies',  cal: 3900 },
  { n: 4, b: 'Pop-tarts ×2',         l: 'Tuna wrap',          d: 'Beans & rice',          s: '3 bars · chocolate',cal: 4400 },
  { n: 5, b: 'Oats + nut butter',    l: 'Salami + cheese',    d: 'Mtn House Chicken',     s: '2 bars · gummies',  cal: 3700 },
  { n: 6, b: 'Granola + powder',     l: 'PB tortilla',        d: 'Backpack curry',        s: '3 bars · jerky',    cal: 3900 },
  { n: 7, b: 'Pop-tarts ×2',         l: 'Tuna wrap',          d: 'Mtn House Lasagna',     s: '3 bars · gummies',  cal: 3800 },
  { n: 8, b: 'Bar + coffee',         l: 'Burger @ Portal',    d: '—',                     s: '—',                  cal: 1800 },
];

const FoodStage = ({ onJump }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, maxWidth: 1100 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <div className="kicker" style={{ marginBottom: 12 }}>Daily targets</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          <Field label="Calories / day" defaultValue="3,800" />
          <Field label="Protein / day"  defaultValue="120 g" />
          <Field label="Water / day"    defaultValue="4 L" />
          <Field label="Pack out"       defaultValue="1.6 lb/day" />
        </div>
        <div className="meta" style={{ fontSize: 10, marginTop: 10, textTransform: 'none', letterSpacing: 0 }}>
          Pulled from <JumpChip to="days" onJump={onJump} icon="mountain">8 days</JumpChip> · adjusted for tough days (D4, D8)
        </div>
      </div>

      {/* Meal plan grid */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="kicker">Meal plan</span>
          <span className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>8 days · breakfast / lunch / dinner / snacks</span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}><Icon name="edit" size={10} stroke={1.8}/> Bulk edit</button>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '44px 1fr 1fr 1fr 1fr 64px',
          fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-dim)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '8px 16px', background: 'var(--color-surface-2)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <span>Day</span><span>Breakfast</span><span>Lunch</span><span>Dinner</span><span>Snacks</span><span style={{ textAlign: 'right' }}>kcal</span>
        </div>
        {MEAL_PLAN.map((m, i) => (
          <div key={m.n} style={{
            display: 'grid', gridTemplateColumns: '44px 1fr 1fr 1fr 1fr 64px',
            gap: 8, alignItems: 'center',
            padding: '10px 16px',
            borderBottom: i === MEAL_PLAN.length - 1 ? 'none' : '1px solid var(--color-border)',
            fontSize: 11,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
              color: 'var(--color-amber)', padding: '3px 0', borderRadius: 4,
              background: 'var(--color-amber-dim)', border: '1px solid var(--color-amber-border)',
              textAlign: 'center',
            }}>D{m.n}</span>
            <span>{m.b}</span>
            <span>{m.l}</span>
            <span style={{ color: m.d === '—' ? 'var(--color-text-dim)' : 'var(--color-text)' }}>{m.d}</span>
            <span style={{ color: 'var(--color-text-mid)' }}>{m.s}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', textAlign: 'right',
              color: m.cal >= 3800 ? 'var(--color-pine)' : m.cal >= 3000 ? 'var(--color-text-mid)' : 'var(--color-amber)',
            }}>{m.cal.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Resupply */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-amber-dim)', border: '1px solid var(--color-amber-border)', color: 'var(--color-amber)' }}>
            <Icon name="food" size={16} stroke={1.6} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800 }}>Resupply · Kearsarge Pass (Day 5)</div>
            <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 2 }}>Bishop Post Office · 4 day box · ship by Aug 1</div>
          </div>
          <Pill tone="amber">Unconfirmed</Pill>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
          <Field label="Ship by"  defaultValue="Aug 1, 2026" />
          <Field label="Days in box" defaultValue="4" />
          <Field label="Hold address" defaultValue="—" />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-amber btn-sm"><Icon name="plus" size={10} stroke={2}/> Generate label</button>
          <button className="btn btn-ghost btn-sm">Mark shipped</button>
          <button className="btn btn-ghost btn-sm">Swap location</button>
        </div>
      </div>

      {/* Water + bear can */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>Water plan</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-mid)', marginBottom: 10 }}>
            No cache plan yet for the dry stretch on D6 (Forester → Tyndall).
          </div>
          <Checkmark text="Sources scouted (D1–D5, D7–D8)" done />
          <Checkmark text="Cache plan D6"     pending />
          <Checkmark text="Filter + backup"   pending />
          <button className="btn btn-amber btn-sm" style={{ marginTop: 10 }}><Icon name="plus" size={10} stroke={2}/> Add cache</button>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>Bear canister</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-mid)', marginBottom: 10 }}>
            Capacity depends on resupply confirmation.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { n: 'BV450',   v: '270 cu in · 5 days', s: 'small' },
              { n: 'BV500',   v: '700 cu in · 7 days', s: 'recommended', selected: true },
              { n: 'BV475',   v: '440 cu in · 6 days', s: 'middle' },
            ].map(c => (
              <div key={c.n} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: c.selected ? 'var(--color-amber-glow)' : 'transparent',
                border: '1px solid ' + (c.selected ? 'var(--color-amber-border)' : 'var(--color-border)'),
                borderRadius: 4,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: c.selected ? 'var(--color-amber)' : 'var(--color-text-mid)' }}>{c.n}</span>
                <span style={{ fontSize: 10, flex: 1, color: 'var(--color-text-mid)' }}>{c.v}</span>
                {c.selected && <Icon name="check" size={11} stroke={2.4} style={{ color: 'var(--color-amber)' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>This stage</div>
        <Checkmark done text="Daily calories set" />
        <Checkmark done text="Protein target" />
        <Checkmark text="Resupply confirmed" pending />
        <Checkmark text="Water cache (D6)" />
        <Checkmark text="Bear-can sized" />
        <Checkmark text="Trail meals locked" />
        <div className="hr" style={{ margin: '12px 0' }} />
        <ProgressBar value={33} tone="amber" />
        <div className="meta" style={{ marginTop: 6, fontSize: 9, textAlign: 'center' }}>2 of 6</div>
      </div>
      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>Totals</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <Stat value="29,700" label="kcal total" />
          <Stat value="14.2 lb" label="food weight" />
          <Stat value="864 g"  label="protein" />
          <Stat value="32 L"   label="water" />
        </div>
      </div>
      <div style={{
        padding: 12, borderRadius: 8,
        background: 'var(--color-amber-dim)',
        border: '1px solid var(--color-amber-border)',
        fontSize: 11, color: 'var(--color-text-mid)',
      }}>
        <strong style={{ color: 'var(--color-amber)' }}>Heads up.</strong> Big-day calories (D4, D8) should clear 4,200. D8 is light because you exit to Whitney Portal — burger after.
      </div>
    </aside>
  </div>
);

// ───────── GEAR (blocked) ─────────
const GEAR_PREVIEW = {
  shelter: [
    { n: 'Tent · Zpacks Duplex',   w: 21,  c: true },
    { n: 'Sleeping bag · WM 20°',  w: 28,  c: true },
    { n: 'Pad · NeoAir XLite NXT', w: 13,  c: true },
    { n: 'Tent stakes ×8',         w: 1.6, c: false },
  ],
  kitchen: [
    { n: 'Stove · PocketRocket 2', w: 2.6, c: true },
    { n: 'Pot · Toaks 750ml',      w: 3.6, c: true },
    { n: 'Fuel · MSR 110g',        w: 7.0, c: false },
    { n: 'Spoon · titanium',       w: 0.5, c: true },
  ],
  worn: [
    { n: 'Shoes · Lone Peak 8', w: 22, c: true },
    { n: 'Sun hoody',           w: 6,  c: true },
    { n: 'Shorts',              w: 5,  c: true },
    { n: 'Sun hat',             w: 2,  c: true },
  ],
};

const GearStage = ({ onJump }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, maxWidth: 1100 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Hold banner — keeps the existing "blocked" intent but compact */}
      <div className="card" style={{ padding: 18, borderStyle: 'dashed' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: 'var(--color-amber-dim)', border: '1px solid var(--color-amber-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-amber)', flexShrink: 0,
          }}><Icon name="gear" size={20} stroke={1.6} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Gear opens Mar 24, when permits resolve.</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-mid)' }}>
              We've pre-filled last year's Sierra loadout from your <JumpChip to="days" onJump={onJump} icon="mountain">8-day plan</JumpChip>. Tweak now; we'll re-balance after dates lock.
            </div>
          </div>
          <Pill tone="amber">Preview</Pill>
        </div>
      </div>

      {/* Loadout preview by category */}
      {Object.entries(GEAR_PREVIEW).map(([cat, items]) => {
        const total = items.reduce((a, x) => a + x.w, 0);
        return (
          <div key={cat} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--color-surface-2)',
            }}>
              <span className="kicker" style={{ textTransform: 'uppercase' }}>{cat}</span>
              <span className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>{items.length} items</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-amber)' }}>{total.toFixed(1)} oz</span>
            </div>
            {items.map((it, i) => (
              <div key={it.n} style={{
                display: 'grid', gridTemplateColumns: '20px 1fr 60px',
                gap: 12, alignItems: 'center',
                padding: '8px 16px',
                borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--color-border)',
              }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 3,
                  border: '1.5px solid ' + (it.c ? 'var(--color-pine)' : 'var(--color-border-mid)'),
                  background: it.c ? 'var(--color-pine)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-bg)',
                }}>{it.c && <Icon name="check" size={9} stroke={3} />}</span>
                <span style={{ fontSize: 11.5, color: it.c ? 'var(--color-text)' : 'var(--color-text-mid)' }}>{it.n}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-mid)', textAlign: 'right' }}>{it.w} oz</span>
              </div>
            ))}
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-amber btn-sm" onClick={() => onJump('permits')}><Icon name="permit" size={11} stroke={1.8}/> Check Permits</button>
        <button className="btn btn-ghost btn-sm" onClick={() => onJump('food')}><Icon name="food" size={11} stroke={1.8}/> Confirm Food first</button>
        <button className="btn btn-ghost btn-sm">Skip ahead anyway</button>
      </div>
    </div>

    <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>Loadout preview</div>
        <Stat value="28 of 47" label="items owned" />
        <div className="hr" style={{ margin: '10px 0' }} />
        <Stat value="14.2 lb" label="base weight" />
        <Stat value="16.4 lb" label="food (start)" />
        <Stat value="4.4 lb"  label="water (start)" />
        <div className="hr" style={{ margin: '10px 0' }} />
        <Stat value="35.0 lb" label="total D1 pack" />
      </div>
      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>Unlocks Mar 24</div>
        <Checkmark text="Confirm dates" />
        <Checkmark text="Pre-fill loadout" done />
        <Checkmark text="Borrow vs buy decisions" />
        <Checkmark text="Final pack weigh-in" />
        <Checkmark text="Shakedown overnight" />
      </div>
      <div style={{
        padding: 12, borderRadius: 8,
        background: 'var(--color-sky-dim)',
        border: '1px solid var(--color-sky-border)',
        fontSize: 11, color: 'var(--color-text-mid)',
      }}>
        <strong style={{ color: 'var(--color-sky)' }}>Why locked?</strong> Loadout depends on confirmed dates + conditions. Auto-recomputes when <JumpChip to="permits" onJump={onJump} icon="permit">Permits</JumpChip> resolves.
      </div>
    </aside>
  </div>
);

// ───────── DEPART ─────────
const OnePagerPreview = () => (
  <div style={{
    aspectRatio: '8.5 / 11',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 4,
    padding: '14px 16px',
    fontFamily: 'var(--font-mono)',
    fontSize: 7, lineHeight: 1.5,
    color: 'var(--color-text-mid)',
    overflow: 'hidden',
  }}>
    <div style={{
      fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 800,
      color: 'var(--color-text)', marginBottom: 2,
    }}>SIERRA HIGH ROUTE · AUG 11–19</div>
    <div style={{ fontSize: 7, color: 'var(--color-amber)', letterSpacing: '0.16em', marginBottom: 8 }}>RIDGELINE TRIP CARD</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8, fontSize: 6 }}>
      <div><strong style={{ color: 'var(--color-text)' }}>Party</strong><br />Casey M., Jamie T., Lin K., Rae P.</div>
      <div><strong style={{ color: 'var(--color-text)' }}>InReach</strong><br />MAPSHARE/casey · check 8PM</div>
      <div><strong style={{ color: 'var(--color-text)' }}>Entry</strong><br />Onion Valley · 8/12 7:30AM</div>
      <div><strong style={{ color: 'var(--color-text)' }}>Exit</strong><br />Whitney Portal · 8/19 ~3PM</div>
    </div>
    <div style={{ borderTop: '1px dashed var(--color-border-mid)', margin: '6px 0' }}></div>
    <div style={{ fontSize: 6, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>DAILY PLAN</div>
    {['D1 Onion Valley → Charlotte · 12mi','D2 Charlotte → Rae · 14mi','D3 Rae → Sixty Lake · 18mi','D4 Sixty → Bench · 22mi ⚠','D5 Bench → Marjorie · 16mi · RESUPPLY','D6 Marjorie → Crabtree · 19mi','D7 Crabtree → Guitar · 14mi','D8 Guitar → Portal · 17mi · SUMMIT'].map((r,i) => (
      <div key={i} style={{ fontSize: 6 }}>{r}</div>
    ))}
    <div style={{ borderTop: '1px dashed var(--color-border-mid)', margin: '6px 0' }}></div>
    <div style={{ fontSize: 6, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>EMERGENCY</div>
    <div style={{ fontSize: 6 }}>SAR · Inyo Co. 760-878-0383</div>
    <div style={{ fontSize: 6 }}>Home · Sam 415-555-0142</div>
  </div>
);

const DepartStage = ({ onJump }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, maxWidth: 1100 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <div className="kicker" style={{ marginBottom: 12 }}>Reminders</div>
        {[
          { t: 'Jan 25', n: 'Whitney lottery opens reminder',                tone: 'amber', set: true },
          { t: 'Mar 24', n: 'Lottery results · expect email by 5PM',         tone: 'amber', set: true },
          { t: 'Aug 1',  n: 'Mail resupply to Bishop PO',                    tone: 'sky',   set: true },
          { t: 'Aug 8',  n: '72-hr forecast check',                          tone: 'sky',   set: true },
          { t: 'Aug 10', n: 'Pack shakedown · weigh-in',                     tone: 'sky',   set: false },
          { t: 'Aug 11', n: '5AM · airport · do not check trekking poles',   tone: 'pine',  set: true },
        ].map((r, i, arr) => (
          <div key={r.t} style={{
            display: 'grid', gridTemplateColumns: '60px 1fr 60px',
            gap: 12, alignItems: 'center',
            padding: '10px 0',
            borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--color-border)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: `var(--color-${r.tone})` }}>{r.t}</span>
            <span style={{ fontSize: 12 }}>{r.n}</span>
            {r.set
              ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-pine)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>SET</span>
              : <button className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', fontSize: 9 }}>Set</button>}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span className="kicker">Emergency contacts</span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}><Icon name="plus" size={10} stroke={2}/> Contact</button>
        </div>
        {[
          { name: 'Sam (home base)',      role: 'check-in · 8PM PT daily', ph: '415-555-0142',      tone: 'amber' },
          { name: 'Inyo Co. Sheriff SAR', role: 'east-side primary',       ph: '760-878-0383',      tone: 'red'   },
          { name: 'Tulare Co. SAR',       role: 'west-side primary',       ph: '559-733-6218',      tone: 'red'   },
          { name: 'Garmin IERCC',         role: 'inReach SOS routing',     ph: 'auto · SOS button', tone: 'sky'   },
        ].map((c, i, arr) => (
          <div key={c.name} style={{
            display: 'grid', gridTemplateColumns: '28px 1fr auto',
            gap: 12, alignItems: 'center',
            padding: '8px 0',
            borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--color-border)',
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              background: `var(--color-${c.tone}-dim)`,
              border: `1px solid var(--color-${c.tone}-border)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: `var(--color-${c.tone})`,
            }}><Icon name="bell" size={11} stroke={1.8} /></span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
              <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 1 }}>{c.role}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-mid)' }}>{c.ph}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span className="kicker">Offline maps</span>
          <span className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>cached to all phones</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-pine)' }}>3 of 4 ready</span>
        </div>
        {[
          { n: 'CalTopo — Sierra High Route corridor', s: '142 MB · 4 layers', ok: true  },
          { n: 'Gaia GPS — backup',                    s: '88 MB · contours',  ok: true  },
          { n: 'NOAA — wx overlays',                   s: '12 MB',             ok: true  },
          { n: 'OnX — bail-out roads',                 s: '— · pending',       ok: false },
        ].map((m, i, arr) => (
          <div key={m.n} style={{
            display: 'grid', gridTemplateColumns: '18px 1fr 90px',
            gap: 10, alignItems: 'center',
            padding: '7px 0',
            borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--color-border)',
          }}>
            <span style={{ color: m.ok ? 'var(--color-pine)' : 'var(--color-amber)' }}>
              <Icon name={m.ok ? 'check' : 'permit'} size={12} stroke={2.2} />
            </span>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600 }}>{m.n}</div>
              <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 1 }}>{m.s}</div>
            </div>
            {!m.ok && <button className="btn btn-amber btn-sm" style={{ padding: '3px 8px', fontSize: 9 }}>Download</button>}
          </div>
        ))}
      </div>
    </div>

    <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>One-pager</span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', padding: '3px 8px', fontSize: 9 }}><Icon name="pdf" size={10} stroke={1.8}/> PDF</button>
        </div>
        <OnePagerPreview />
        <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 8, fontStyle: 'italic' }}>
          Auto-generated from Route, Days, Permits, Food. Print &amp; leave with Sam.
        </div>
      </div>
      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>Take it with you</div>
        <Checkmark text="Trip one-pager (PDF)" done />
        <Checkmark text="Offline maps · CalTopo" done />
        <Checkmark text="Emergency contacts shared" done />
        <Checkmark text="Garmin inReach plan paid" done />
        <Checkmark text="Car parked at Whitney Portal" pending />
        <Checkmark text="Keys handed off" />
        <div className="hr" style={{ margin: '12px 0' }} />
        <ProgressBar value={67} tone="pine" />
        <div className="meta" style={{ marginTop: 6, fontSize: 9, textAlign: 'center' }}>4 of 6</div>
      </div>
    </aside>
  </div>
);

// ───────── shared atoms (unchanged from before) ─────────
const TravelLeg = ({ icon, tone, date, title, sub, id, attached, placeholder, last }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '32px 60px 1fr 90px 28px',
    alignItems: 'center', gap: 12,
    padding: '10px 0',
    borderBottom: last ? 'none' : '1px solid var(--color-border)',
  }}>
    <span style={{
      width: 28, height: 28, borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `var(--color-${tone}-dim)`, border: `1px solid var(--color-${tone}-border)`,
      color: `var(--color-${tone})`,
    }}><Icon name={icon} size={12} stroke={1.8} /></span>
    <div className="meta" style={{ fontSize: 9 }}>{date}</div>
    <div>
      <div style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>{title}</div>
      <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 2 }}>{sub}</div>
    </div>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: placeholder ? 'var(--color-text-dim)' : 'var(--color-text-mid)', textAlign: 'right' }}>
      {id}
    </span>
    {attached
      ? <span style={{ color: 'var(--color-pine)' }}><Icon name="check" size={12} stroke={2.5} /></span>
      : <span style={{ color: 'var(--color-text-dim)' }}><Icon name="circle" size={12} stroke={1.6} /></span>}
  </div>
);

const Checkmark = ({ done, pending, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
    <span style={{
      width: 14, height: 14, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: done ? 'var(--color-pine-dim)' : pending ? 'var(--color-amber-dim)' : 'transparent',
      border: '1px solid ' + (done ? 'var(--color-pine-border)' : pending ? 'var(--color-amber-border)' : 'var(--color-border)'),
      color: done ? 'var(--color-pine)' : pending ? 'var(--color-amber)' : 'transparent',
      flexShrink: 0,
    }}>
      {done && <Icon name="check" size={9} stroke={2.5} />}
    </span>
    <span style={{ fontSize: 11, color: done ? 'var(--color-text-mid)' : 'var(--color-text)' }}>{text}</span>
  </div>
);

const DateRow = ({ d, label, tone, last }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '54px 1fr',
    gap: 12, alignItems: 'center',
    padding: '8px 0',
    borderBottom: last ? 'none' : '1px solid var(--color-border)',
  }}>
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
      color: `var(--color-${tone})`,
      padding: '4px 6px', borderRadius: 4,
      background: `var(--color-${tone}-dim)`,
      border: `1px solid var(--color-${tone}-border)`,
      textAlign: 'center',
    }}>{d}</span>
    <span style={{ fontSize: 11, color: 'var(--color-text-mid)' }}>{label}</span>
  </div>
);

window.V3Stages = V3Stages;
window.JumpChip = JumpChip;
window.Checkmark = Checkmark;
window.DateRow = DateRow;
window.TravelLeg = TravelLeg;
