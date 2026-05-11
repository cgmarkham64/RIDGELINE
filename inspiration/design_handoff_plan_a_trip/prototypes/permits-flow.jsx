// permits-flow.jsx — Permits stage, redesigned
// Two contrasting directions for adding permits:
//   PermitsListFirst — auto-suggest stack at top, catalog search, free-form fallback
//   PermitsMapFirst  — small route map with detected zone overlays; tap zones to add permits
// Both share the same adaptive PermitCard renderer keyed off `type`.

// ───────── Permit types & sample suggestions ─────────
//
// Sierra High Route example (default mock): mix of lottery + zone + parking
// Indian Peaks example (alt mock): zone-by-zone overnight permits
//
const PERMIT_TYPES = {
  lottery:     { label: 'Lottery',          tone: 'amber', icon: 'permit',  hint: 'Apply window → results → accept' },
  reservation: { label: 'Advance reservation', tone: 'sky', icon: 'permit', hint: 'Books on open date, fills fast' },
  walkup:      { label: 'Walk-up',          tone: 'amber', icon: 'permit',  hint: 'Day-of, first-come' },
  selfissue:   { label: 'Self-issue',       tone: 'pine',  icon: 'permit',  hint: 'Free trailhead register, no booking' },
  zonenights:  { label: 'Zone-by-zone',     tone: 'amber', icon: 'map',     hint: 'One permit, specifies zones/nights' },
  hut:         { label: 'Hut reservation',  tone: 'sky',   icon: 'tent',    hint: 'Per-night booking (refugio/hut)' },
  parking:     { label: 'Parking pass',     tone: 'pine',  icon: 'bus',     hint: 'Trailhead lot — separate from wilderness' },
  fishing:     { label: 'Fishing license',  tone: 'pine',  icon: 'water',   hint: 'Activity license' },
  vehicle:     { label: 'Vehicle entry',    tone: 'pine',  icon: 'bus',     hint: 'NPS-style park entry' },
};

const SIERRA_SUGGESTIONS = [
  {
    id: 'sgt_whitney', accepted: true,
    type: 'lottery',
    name: 'Mt. Whitney Zone (overnight)',
    agency: 'Inyo NF · recreation.gov',
    why: 'Your route exits via Whitney Portal — overnight permits are required Apr–Nov.',
    fields: { 'Lottery opens': 'Feb 1, 2026', 'Lottery closes': 'Mar 15, 2026', 'Results': 'Mar 24, 2026', 'Walk-up backup': 'Day-of 11 AM' },
    party: 4,
  },
  {
    id: 'sgt_inyo', accepted: true,
    type: 'reservation',
    name: 'Inyo NF wilderness — Onion Valley entry',
    agency: 'Inyo NF · recreation.gov',
    why: 'Entry trailhead Onion Valley enters Inyo wilderness — quota of 60/day applies May–Nov.',
    fields: { 'Booking opens': '6 months out', 'Booked': 'Mar 12, 2026', 'Confirmation': 'INV-7724-K' },
    party: 4,
  },
  {
    id: 'sgt_canister', accepted: false,
    type: 'selfissue',
    name: 'Bear canister registration (SEKI)',
    agency: 'Sequoia & Kings Canyon NPS',
    why: 'Approved canister required when route crosses SEKI lands (Day 3–6).',
    fields: {},
    party: 4,
  },
  {
    id: 'sgt_parking', accepted: false,
    type: 'parking',
    name: 'Onion Valley trailhead parking',
    agency: 'Inyo NF',
    why: 'Lot fills July–Sep weekends; no fee, but space-limited.',
    fields: { 'Reserve at': 'recreation.gov', 'Backup': 'Independence shuttle' },
    party: 4,
  },
];

const INDIAN_PEAKS_SUGGESTIONS = [
  {
    id: 'ip_zoned', accepted: false,
    type: 'zonenights',
    name: 'Indian Peaks Wilderness — overnight permit',
    agency: 'Arapaho-Roosevelt NF · recreation.gov',
    why: 'Your loop crosses 4 zones across 3 nights. One permit covers all, but each night is zone-specific.',
    fields: { 'Booking opens': 'Mar 1, 2026', 'Group max': '12 per zone' },
    party: 4,
    zones: [
      { night: 1, zone: 'Crater Lakes',     status: 'available' },
      { night: 2, zone: 'Diamond Lake',     status: 'limited'   },
      { night: 3, zone: 'Caribou',          status: 'available' },
    ],
  },
  {
    id: 'ip_parking', accepted: false,
    type: 'parking',
    name: 'Brainard Lake recreation pass',
    agency: 'Arapaho-Roosevelt NF',
    why: 'Brainard gateway requires a daily or annual pass; trailhead lots fill by 7 AM.',
    fields: { 'Pass': '$12/day or $40/season', 'Reserve': 'recreation.gov' },
    party: 4,
  },
  {
    id: 'ip_canister', accepted: false,
    type: 'selfissue',
    name: 'Bear canister advisory',
    agency: 'USFS',
    why: 'Recommended (not required) for Caribou zone; black bear activity reported.',
    fields: {},
    party: 4,
  },
];

const TRIP_PROFILES = {
  sierra: {
    title: 'Sierra High Route',
    location: 'Inyo NF, CA · 149 mi',
    suggestions: SIERRA_SUGGESTIONS,
    detected: '4 permit types across 2 agencies',
    zoneCount: null,
  },
  indianpeaks: {
    title: 'Indian Peaks loop',
    location: 'Arapaho-Roosevelt NF, CO · 32 mi',
    suggestions: INDIAN_PEAKS_SUGGESTIONS,
    detected: 'Zone-segmented overnight permit · 3 nights, 3 zones',
    zoneCount: 4,
  },
};

// ───────── Permit type chip ─────────
const TypeChip = ({ type }) => {
  const t = PERMIT_TYPES[type];
  if (!t) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 7px',
      background: `var(--color-${t.tone}-dim)`,
      border: `1px solid var(--color-${t.tone}-border)`,
      borderRadius: 4,
      color: `var(--color-${t.tone})`,
      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      <Icon name={t.icon} size={9} stroke={2} />
      {t.label}
    </span>
  );
};

// ───────── Adaptive permit card ─────────
const PermitCard = ({ permit, onRemove, compact, onJump }) => {
  const t = PERMIT_TYPES[permit.type];
  const fields = Object.entries(permit.fields || {});

  return (
    <div className="card" style={{ padding: compact ? 14 : 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `var(--color-${t.tone}-dim)`,
          border: `1px solid var(--color-${t.tone}-border)`,
          color: `var(--color-${t.tone})`, flexShrink: 0,
        }}>
          <Icon name={t.icon} size={16} stroke={1.6} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
            <TypeChip type={permit.type} />
            <span style={{ fontSize: 9, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
              party {permit.party} <button style={{ background: 'none', border: 'none', color: 'var(--color-amber)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 9, padding: 0, marginLeft: 4 }}>override</button>
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, lineHeight: 1.25 }}>{permit.name}</div>
          <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 2 }}>{permit.agency}</div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer', padding: 4 }}
            title="Remove from trip"
          >
            <Icon name="x" size={14} stroke={1.8} />
          </button>
        )}
      </div>

      {/* Adaptive body */}
      {permit.type === 'lottery' && fields.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {fields.map(([k, v]) => <Field key={k} label={k} defaultValue={v} />)}
        </div>
      )}
      {permit.type === 'reservation' && fields.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {fields.map(([k, v]) => <Field key={k} label={k} defaultValue={v} />)}
        </div>
      )}
      {permit.type === 'walkup' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Window opens" defaultValue="11:00 AM" />
          <Field label="Arrive by"    defaultValue="9:30 AM" />
        </div>
      )}
      {permit.type === 'selfissue' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px',
          background: 'var(--color-pine-dim)',
          border: '1px solid var(--color-pine-border)',
          borderRadius: 6,
          fontSize: 11, color: 'var(--color-text-mid)',
        }}>
          <Icon name="check" size={12} stroke={2.4} style={{ color: 'var(--color-pine)' }} />
          No booking required — self-issue at the trailhead. We'll remind you.
        </div>
      )}
      {permit.type === 'zonenights' && (
        <>
          {fields.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
              {fields.map(([k, v]) => <Field key={k} label={k} defaultValue={v} />)}
            </div>
          )}
          <div className="kicker" style={{ marginBottom: 6 }}>Zones × nights</div>
          <div style={{ display: 'grid', gap: 4 }}>
            {(permit.zones || []).map((z) => (
              <div key={z.night} style={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr 80px',
                gap: 10, alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                  color: 'var(--color-amber)',
                  padding: '3px 6px',
                  background: 'var(--color-amber-dim)',
                  border: '1px solid var(--color-amber-border)',
                  borderRadius: 4,
                  textAlign: 'center',
                }}>N{z.night}</span>
                <span style={{ fontSize: 12 }}>{z.zone}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, textAlign: 'right',
                  color: z.status === 'available' ? 'var(--color-pine)' :
                         z.status === 'limited' ? 'var(--color-amber)' : 'var(--color-red)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{z.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {permit.type === 'parking' && fields.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {fields.map(([k, v]) => <Field key={k} label={k} defaultValue={v} />)}
        </div>
      )}
      {permit.type === 'hut' && (
        <div style={{ fontSize: 11, color: 'var(--color-text-mid)' }}>Per-night roster pulls from Days.</div>
      )}
    </div>
  );
};

// ───────── Suggestion card (auto-suggest with accept/reject) ─────────
const SuggestionRow = ({ suggestion, onAccept, onReject }) => {
  const t = PERMIT_TYPES[suggestion.type];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '32px 1fr auto',
      gap: 14, alignItems: 'flex-start',
      padding: '14px 16px',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
    }}>
      <span style={{
        width: 32, height: 32, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `var(--color-${t.tone}-dim)`,
        border: `1px solid var(--color-${t.tone}-border)`,
        color: `var(--color-${t.tone})`, flexShrink: 0,
      }}>
        <Icon name={t.icon} size={15} stroke={1.6} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <TypeChip type={suggestion.type} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>{suggestion.name}</span>
        </div>
        <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginBottom: 4 }}>
          {suggestion.agency}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-mid)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {suggestion.why}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button className="btn btn-amber btn-sm" onClick={onAccept}>
          <Icon name="plus" size={10} stroke={2} /> Add
        </button>
        <button
          onClick={onReject}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: '4px 6px' }}
        >
          Not needed
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// DIRECTION A — LIST-FIRST
// ═══════════════════════════════════════════════════════════
const PermitsListFirst = ({ profile = 'sierra', onJump }) => {
  const trip = TRIP_PROFILES[profile];
  const [permits, setPermits] = React.useState(trip.suggestions.filter(s => s.accepted));
  const [suggestions, setSuggestions] = React.useState(trip.suggestions.filter(s => !s.accepted));
  const [search, setSearch] = React.useState('');

  const accept = (s) => {
    setPermits(p => [...p, { ...s, accepted: true }]);
    setSuggestions(ss => ss.filter(x => x.id !== s.id));
  };
  const reject = (s) => setSuggestions(ss => ss.filter(x => x.id !== s.id));
  const remove = (id) => setPermits(p => p.filter(x => x.id !== id));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, maxWidth: 1100 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Detection banner */}
        <div style={{
          padding: '12px 14px',
          background: 'var(--color-amber-dim)',
          border: '1px solid var(--color-amber-border)',
          borderRadius: 8,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <Icon name="map" size={16} stroke={1.8} style={{ color: 'var(--color-amber)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: 'var(--color-amber)' }}>
              We checked your route — {trip.detected}
            </div>
            <div className="meta" style={{ fontSize: 9, marginTop: 2, textTransform: 'none', letterSpacing: 0, color: 'var(--color-text-mid)' }}>
              Suggestions below are pulled from <JumpChip to="route" onJump={onJump} icon="map">Route</JumpChip> · party of 4 from <JumpChip to="days" onJump={onJump} icon="mountain">Days</JumpChip>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm">Re-scan</button>
        </div>

        {/* Suggestions stack */}
        {suggestions.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="kicker">Suggested for your route</div>
              <button className="btn btn-ghost btn-sm" onClick={() => suggestions.forEach(accept)}>
                <Icon name="check" size={10} stroke={2} /> Accept all
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.map((s) => (
                <SuggestionRow key={s.id} suggestion={s} onAccept={() => accept(s)} onReject={() => reject(s)} />
              ))}
            </div>
          </section>
        )}

        {/* Added permits */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="kicker">On this trip ({permits.length})</div>
            {permits.length === 0 && <span className="meta" style={{ fontSize: 9 }}>nothing added yet</span>}
          </div>
          {permits.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {permits.map((p) => (
                <PermitCard key={p.id} permit={p} onRemove={() => remove(p.id)} onJump={onJump} />
              ))}
            </div>
          ) : (
            <div style={{
              padding: 24, textAlign: 'center',
              border: '1px dashed var(--color-border)',
              borderRadius: 8,
              color: 'var(--color-text-dim)',
              fontSize: 12,
            }}>
              Accept a suggestion above, or add one manually below.
            </div>
          )}
        </section>

        {/* Catalog search + free-form */}
        <section style={{ paddingTop: 4 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>Add another</div>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'stretch',
            padding: 4,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
          }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
              <Icon name="search" size={14} stroke={1.8} style={{ color: 'var(--color-text-dim)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agencies, units, or trailheads — e.g. Glacier NP, Indian Peaks…"
                style={{
                  flex: 1, background: 'none', border: 'none',
                  color: 'var(--color-text)', fontFamily: 'var(--font-body)',
                  fontSize: 12, outline: 'none', padding: '10px 0',
                }}
              />
            </div>
            <button className="btn btn-ghost btn-sm" style={{ borderLeft: '1px solid var(--color-border)', borderRadius: 0, paddingLeft: 14, paddingRight: 14 }}>
              <Icon name="plus" size={11} stroke={2} /> Free-form
            </button>
          </div>

          {/* Quick-add chips */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {Object.entries(PERMIT_TYPES).map(([k, t]) => (
              <button
                key={k}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 9px',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 99,
                  color: 'var(--color-text-mid)',
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `var(--color-${t.tone}-border)`; e.currentTarget.style.color = `var(--color-${t.tone})`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-mid)'; }}
                title={t.hint}
              >
                <Icon name="plus" size={9} stroke={2} /> {t.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Right summary */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: 14 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>This stage</div>
          <Checkmark done={permits.length > 0} text="At least one permit added" />
          <Checkmark done={suggestions.length === 0} text="All suggestions reviewed" />
          <Checkmark done={permits.every(p => p.party)} text="Party size confirmed" />
          <Checkmark text="Reminders set" pending />
          <Checkmark text="Walk-up backup planned" />
          <div className="hr" style={{ margin: '12px 0' }} />
          <ProgressBar value={(permits.length / (permits.length + suggestions.length || 1)) * 60 + 12} tone="amber" />
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>Critical dates</div>
          <DateRow d="Feb 1"  label="Whitney lottery opens"  tone="amber" />
          <DateRow d="Mar 12" label="Inyo entry — book"      tone="sky"   />
          <DateRow d="Mar 15" label="Whitney lottery closes" tone="amber" />
          <DateRow d="Mar 24" label="Whitney results"        tone="sky"   last />
        </div>

        <div style={{
          padding: 12, borderRadius: 8,
          background: 'var(--color-pine-dim)',
          border: '1px solid var(--color-pine-border)',
          fontSize: 11, color: 'var(--color-text-mid)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <Icon name="check" size={14} stroke={2.2} style={{ color: 'var(--color-pine)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: 'var(--color-text)' }}>No permit needed?</strong> If you've reviewed and your trip is permit-free, mark this stage complete.
            <button style={{ display: 'block', marginTop: 6, background: 'none', border: 'none', color: 'var(--color-pine)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', padding: 0 }}>
              Mark as permit-free →
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// DIRECTION B — MAP-FIRST
// ═══════════════════════════════════════════════════════════
const PermitsMapFirst = ({ profile = 'indianpeaks', onJump }) => {
  const trip = TRIP_PROFILES[profile];
  const [activeZone, setActiveZone] = React.useState(0);
  const [accepted, setAccepted] = React.useState(new Set());

  // Zone polygons for the mock map (Indian Peaks loop)
  const zones = profile === 'indianpeaks' ? [
    { id: 'crater',   name: 'Crater Lakes',  color: '#5ab4dc', poly: '60,80 180,60 220,140 130,180 70,150', night: 1, status: 'available' },
    { id: 'diamond',  name: 'Diamond Lake',  color: '#f0a030', poly: '180,60 320,90 340,170 220,140', night: 2, status: 'limited' },
    { id: 'caribou',  name: 'Caribou',       color: '#5aa478', poly: '220,140 340,170 360,260 250,280 130,180', night: 3, status: 'available' },
    { id: 'jasper',   name: 'Jasper Creek',  color: '#666', poly: '70,150 130,180 90,260 30,200',  night: null, status: 'unused' },
  ] : [
    { id: 'inyo',    name: 'Inyo wilderness', color: '#5aa478', poly: '50,60 200,50 220,180 80,200', night: 1, status: 'available' },
    { id: 'seki',    name: 'SEKI',            color: '#5ab4dc', poly: '200,50 360,80 340,220 220,180', night: 2, status: 'available' },
    { id: 'whitney', name: 'Whitney zone',    color: '#f0a030', poly: '340,220 360,80 410,180 380,290 280,300 220,180', night: 5, status: 'lottery' },
  ];
  const route = profile === 'indianpeaks'
    ? '80,200 100,170 150,130 200,110 260,130 290,170 280,220 230,250 170,240 120,210'
    : '70,180 130,140 190,110 250,90 310,110 350,150 380,200 360,260 310,280';

  const z = zones[activeZone];
  const linkedSuggestion = trip.suggestions.find(s =>
    profile === 'indianpeaks' ? s.type === 'zonenights' :
    activeZone === 2 ? s.id === 'sgt_whitney' :
    activeZone === 1 ? s.id === 'sgt_canister' :
    s.id === 'sgt_inyo'
  );

  const acceptZone = (zid) => setAccepted(prev => new Set(prev).add(zid));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, maxWidth: 1100 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Map panel */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="map" size={14} stroke={1.8} style={{ color: 'var(--color-amber)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>Permit zones along your route</div>
              <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 1 }}>
                {trip.title} · {zones.filter(z => z.night).length} zones crossed · tap a zone to add its permit
              </div>
            </div>
            <button className="btn btn-ghost btn-sm">
              <Icon name="expand" size={11} stroke={1.8} /> Full map
            </button>
          </div>
          <div style={{
            position: 'relative',
            background: 'var(--color-bg)',
            height: 320,
          }}>
            <svg viewBox="0 0 440 320" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              {/* Topo background hint */}
              <defs>
                <pattern id="topo" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                  <circle cx="20" cy="20" r="8"  fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="440" height="320" fill="url(#topo)" />
              {/* Zones */}
              {zones.map((zone, i) => (
                <polygon
                  key={zone.id}
                  points={zone.poly}
                  fill={zone.color}
                  fillOpacity={i === activeZone ? 0.28 : zone.night ? 0.13 : 0.05}
                  stroke={zone.color}
                  strokeOpacity={i === activeZone ? 0.9 : zone.night ? 0.45 : 0.2}
                  strokeWidth={i === activeZone ? 2 : 1}
                  strokeDasharray={zone.night ? '0' : '4 4'}
                  style={{ cursor: zone.night ? 'pointer' : 'default', transition: 'all 0.15s' }}
                  onClick={() => zone.night && setActiveZone(i)}
                />
              ))}
              {/* Route */}
              <polyline points={route} fill="none" stroke="#f0a030" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Route nodes (camps) */}
              {route.split(' ').filter((_, i) => i % 2 === 0).map((p, i) => {
                const [x, y] = p.split(',').map(Number);
                return <circle key={i} cx={x} cy={y} r={3} fill="#0f0d0b" stroke="#f0a030" strokeWidth="1.5" />;
              })}
              {/* Zone labels */}
              {zones.filter(z => z.night).map((zone) => {
                const pts = zone.poly.split(' ').map(p => p.split(',').map(Number));
                const cx = pts.reduce((a, [x]) => a + x, 0) / pts.length;
                const cy = pts.reduce((a, [, y]) => a + y, 0) / pts.length;
                return (
                  <g key={zone.id}>
                    <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fill={zone.color} fontWeight="600">
                      {zone.name}
                    </text>
                    <text x={cx} y={cy + 9} textAnchor="middle" fontSize="8" fontFamily="Karla, sans-serif" fill="rgba(255,255,255,0.5)">
                      Night {zone.night}
                    </text>
                  </g>
                );
              })}
            </svg>
            {/* Legend */}
            <div style={{
              position: 'absolute', bottom: 10, left: 10,
              padding: '6px 10px',
              background: 'rgba(15,13,11,0.7)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              display: 'flex', gap: 12, alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--color-text-mid)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 12, height: 2, background: '#f0a030' }}></span> route
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, background: 'rgba(90,180,220,0.3)', border: '1px solid #5ab4dc' }}></span> permit zone
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, border: '1px dashed #666' }}></span> not on route
              </span>
            </div>
          </div>
        </div>

        {/* Active zone editor */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: 2,
              background: z.color,
            }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Zone {activeZone + 1} of {zones.length}
            </span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>{z.name}</span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveZone((activeZone - 1 + zones.length) % zones.length)}>
                <Icon name="arrow-l" size={10} stroke={2} />
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveZone((activeZone + 1) % zones.length)}>
                <Icon name="arrow-r" size={10} stroke={2} />
              </button>
            </span>
          </div>
          <div style={{ padding: 16 }}>
            {linkedSuggestion ? (
              accepted.has(z.id) ? (
                <PermitCard permit={linkedSuggestion} onRemove={() => {
                  const next = new Set(accepted); next.delete(z.id); setAccepted(next);
                }} onJump={onJump} compact />
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <TypeChip type={linkedSuggestion.type} />
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
                      {linkedSuggestion.name}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-mid)', fontStyle: 'italic', lineHeight: 1.55, marginBottom: 12 }}>
                    {linkedSuggestion.why}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-amber btn-sm" onClick={() => acceptZone(z.id)}>
                      <Icon name="plus" size={10} stroke={2} /> Add to trip
                    </button>
                    <button className="btn btn-ghost btn-sm">Replace with different permit</button>
                    <button className="btn btn-ghost btn-sm">Skip this zone</button>
                  </div>
                </div>
              )
            ) : (
              <div style={{ fontSize: 12, color: 'var(--color-text-mid)' }}>
                No permit detected for this zone.
              </div>
            )}
          </div>
        </div>

        {/* Footer status strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
        }}>
          <Icon name="map" size={14} stroke={1.8} style={{ color: 'var(--color-text-dim)' }} />
          <div style={{ flex: 1, fontSize: 11, color: 'var(--color-text-mid)' }}>
            {accepted.size} of {zones.filter(z => z.night).length} on-route zones added.
            {' '}Re-routing in <JumpChip to="route" onJump={onJump} icon="map">Route</JumpChip> will rescan zones.
          </div>
          <button className="btn btn-ghost btn-sm">List view</button>
        </div>
      </div>

      {/* Right rail */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="kicker" style={{ padding: '12px 14px 8px' }}>Zones on route</div>
          {zones.filter(z => z.night).map((zone) => {
            const isAdded = accepted.has(zone.id);
            const isActive = zones[activeZone]?.id === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => setActiveZone(zones.indexOf(zone))}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  background: isActive ? 'var(--color-amber-glow)' : 'transparent',
                  border: 'none',
                  borderTop: '1px solid var(--color-border)',
                  borderLeft: `2px solid ${isActive ? 'var(--color-amber)' : 'transparent'}`,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: zone.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{zone.name}</div>
                  <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, marginTop: 1 }}>Night {zone.night} · {zone.status}</div>
                </div>
                {isAdded
                  ? <span style={{ color: 'var(--color-pine)' }}><Icon name="check" size={12} stroke={2.5} /></span>
                  : <span style={{ color: 'var(--color-text-dim)' }}><Icon name="plus" size={12} stroke={2} /></span>}
              </button>
            );
          })}
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>Other things detected</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {trip.suggestions.filter(s => ['parking', 'fishing', 'vehicle', 'selfissue'].includes(s.type)).map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 0',
              }}>
                <Icon name={PERMIT_TYPES[s.type].icon} size={11} stroke={1.6} style={{ color: `var(--color-${PERMIT_TYPES[s.type].tone})` }} />
                <span style={{ fontSize: 11, flex: 1 }}>{s.name}</span>
                <button style={{ background: 'none', border: 'none', color: 'var(--color-amber)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0 }}>
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'center' }}>
          <Icon name="plus" size={11} stroke={2} /> Add manual permit
        </button>
      </aside>
    </div>
  );
};

window.PermitsListFirst = PermitsListFirst;
window.PermitsMapFirst = PermitsMapFirst;
window.TRIP_PROFILES = TRIP_PROFILES;
