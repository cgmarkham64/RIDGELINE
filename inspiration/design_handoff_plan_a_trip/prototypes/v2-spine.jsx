// v2-spine.jsx — "The Itinerary Spine"
// Day-by-day timeline as the dominant axis. Build the trip by walking
// left→right across days. Map docked left, day editor right, day spine top.

const V2Spine = () => {
  const [activeDay, setActiveDay] = React.useState(4);
  const day = MOCK_DAYS[activeDay - 1];
  const expTone = { low: 'pine', med: 'sky', high: 'amber', extreme: 'red' }[day.exp];

  return (
    <div className="app-frame" style={{ flexDirection: 'row' }}>
      <AppRail active="plan" />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar: trip identity + actions */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 18,
          padding: '12px 22px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ flex: 1 }}>
            <div className="kicker kicker-amber" style={{ marginBottom: 2 }}>{MOCK_TRIP.location} · planning</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.005em' }}>{MOCK_TRIP.title}</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <MiniStat v={MOCK_TRIP.days} l="days" />
            <MiniStat v={MOCK_TRIP.miles} l="miles" />
            <MiniStat v={MOCK_TRIP.elev} l="elev gain" />
            <MiniStat v={MOCK_TRIP.weight} l="on back" />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sky btn-sm"><Icon name="phone" size={11} stroke={2}/>To phone</button>
            <button className="btn btn-pine btn-sm"><Icon name="pdf" size={11} stroke={2}/>PDF</button>
            <button className="btn btn-primary btn-sm">Lock plan</button>
          </div>
        </header>

        {/* Day spine */}
        <div style={{
          display: 'flex',
          background: 'var(--color-surface-2)',
          borderBottom: '1px solid var(--color-border)',
          overflowX: 'auto', flexShrink: 0,
        }}>
          {MOCK_DAYS.map((d) => (
            <DaySpineCell
              key={d.n}
              d={d}
              active={d.n === activeDay}
              onClick={() => setActiveDay(d.n)}
            />
          ))}
          <button
            style={{
              padding: '12px 16px', minWidth: 70,
              background: 'transparent', border: 'none',
              borderLeft: '1px dashed var(--color-border)',
              cursor: 'pointer', color: 'var(--color-text-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
            }}
          >
            <Icon name="plus" size={11} stroke={2} /> day
          </button>
        </div>

        {/* Body: map | day editor | rail */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr 240px', minHeight: 0 }}>
          {/* Map column */}
          <div style={{ position: 'relative', borderRight: '1px solid var(--color-border)' }}>
            <MapCanvas planned label={`DAY ${activeDay} · ${day.miles} MI`} />
            {/* Map overlays */}
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', background: 'rgba(15,13,11,0.7)' }}><Icon name="plus" size={10} stroke={2}/></button>
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', background: 'rgba(15,13,11,0.7)' }}><Icon name="search" size={10} stroke={2}/></button>
            </div>
            <div style={{
              position: 'absolute', bottom: 10, left: 10, right: 10,
              padding: '8px 12px',
              background: 'rgba(15,13,11,0.85)',
              border: '1px solid var(--color-border)',
              borderRadius: 6, backdropFilter: 'blur(8px)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <Pill icon="pin" tone="pine">Wallace Lake → Crabtree</Pill>
                <Pill icon="mountain" tone="amber">Crabtree Pass · 12,560'</Pill>
              </div>
              <div className="meta" style={{ fontSize: 8 }}>elev gain · +1,840 / loss · -2,210</div>
            </div>
            {/* Elevation profile strip */}
            <div style={{
              position: 'absolute', top: 50, left: 10, right: 10,
              height: 70, padding: 10,
              background: 'rgba(15,13,11,0.85)',
              border: '1px solid var(--color-border)',
              borderRadius: 6, backdropFilter: 'blur(8px)',
            }}>
              <div className="kicker" style={{ fontSize: 8, marginBottom: 4 }}>elevation profile · day {activeDay}</div>
              <svg viewBox="0 0 400 36" preserveAspectRatio="none" style={{ width: '100%', height: 36, display: 'block' }}>
                <defs>
                  <linearGradient id="elev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--color-amber)" stopOpacity="0.5"/>
                    <stop offset="1" stopColor="var(--color-amber)" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M 0 30 L 30 26 L 70 18 L 110 8 L 160 4 L 210 12 L 260 22 L 310 18 L 360 28 L 400 30 L 400 36 L 0 36 Z" fill="url(#elev2)" />
                <path d="M 0 30 L 30 26 L 70 18 L 110 8 L 160 4 L 210 12 L 260 22 L 310 18 L 360 28 L 400 30" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Day editor */}
          <div style={{ overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 22, background: 'var(--color-bg)' }}>
            <div>
              <div className="kicker" style={{ marginBottom: 4 }}>Day {day.n} · {day.date}</div>
              <input className="fld" defaultValue={day.to} style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, padding: '8px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-mid)', borderRadius: 0 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Miles"        defaultValue={day.miles} />
              <Field label="Elev gain"    defaultValue="+1,840 ft" />
              <Field label="Camp"         defaultValue={day.camp} />
              <Field label="Camp coords"  defaultValue="36.7128° N · 118.3411° W" />
            </div>

            <div>
              <SectionLabel>Conditions</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <ConditionTile icon="water" tone="sky"   k="Water"     v="reliable" detail="3 sources" />
                <ConditionTile icon="sun"   tone={expTone} k="Exposure" v={day.exp} detail="above tree" />
                <ConditionTile icon="cloud" tone="amber" k="Forecast"  v="76 / 38" detail="0% precip" />
              </div>
            </div>

            <div>
              <SectionLabel>Route notes</SectionLabel>
              <textarea className="fld" rows={4} defaultValue={`Big day. Crabtree Pass is loose Class 2 — start the climb before the sun hits the south face. Camp options below the lake if afternoon weather rolls in. Last reliable water 0.4mi past the pass on the south side.`} />
            </div>

            <div>
              <SectionLabel action={<button className="btn btn-ghost btn-sm" style={{marginLeft:8}}><Icon name="plus" size={10} stroke={2}/>Waypoint</button>}>Waypoints (this day)</SectionLabel>
              <div className="card" style={{ overflow: 'hidden' }}>
                <WP n="04:1" tone="pine" name="Wallace Lake outlet"  miles="0.0"  note="depart 7:00 a.m." />
                <WP n="04:2" tone="sky"  name="Wales Lake junction"  miles="2.4"  note="filter water" />
                <WP n="04:3" tone="amber" name="Crabtree Pass · 12,560'" miles="5.8" note="be off summit by 1pm" />
                <WP n="04:4" tone="sky"  name="Crabtree Lakes upper" miles="7.2"  note="bail camp option" />
                <WP n="04:5" tone="pine" name="Crabtree Meadow"      miles="10.1" note="camp · ranger station" last />
              </div>
            </div>
          </div>

          {/* Right rail: trip-wide context */}
          <aside style={{
            background: 'var(--color-surface)',
            borderLeft: '1px solid var(--color-border)',
            padding: 16,
            display: 'flex', flexDirection: 'column', gap: 16,
            overflowY: 'auto',
          }}>
            <div>
              <div className="kicker" style={{ marginBottom: 8 }}>Trip totals</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <Stat value={MOCK_TRIP.miles} label="miles" />
                <Stat value={MOCK_TRIP.elev}  label="gain"  />
                <Stat value={MOCK_TRIP.days}  label="days"  />
                <Stat value={MOCK_TRIP.weight} label="base" />
              </div>
            </div>

            <div>
              <div className="kicker" style={{ marginBottom: 8 }}>Permit</div>
              <div style={{
                padding: 10, borderRadius: 6,
                background: 'var(--color-amber-dim)',
                border: '1px solid var(--color-amber-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Icon name="permit" size={12} stroke={1.8} style={{ color: 'var(--color-amber)' }} />
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 700, color: 'var(--color-amber)' }}>Whitney lottery</div>
                </div>
                <div className="meta" style={{ fontSize: 8, textTransform: 'none', letterSpacing: 0 }}>opens Feb 1 · 27 days</div>
                <button className="btn btn-primary btn-sm btn-block" style={{ marginTop: 8 }}>Set reminder</button>
              </div>
            </div>

            <div>
              <div className="kicker" style={{ marginBottom: 8 }}>Issues (3)</div>
              <Issue tone="red"   text="Day 7 water: 0 reliable past Trail Crest" />
              <Issue tone="amber" text="Camp on Day 4 is at 11,800 ft (acclimation)" />
              <Issue tone="amber" text="No bailout for Crabtree Pass section" />
            </div>

            <div>
              <div className="kicker" style={{ marginBottom: 8 }}>Loadout</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                <KV k="Base" v="22.4 lb" />
                <KV k="Worn" v="3.1 lb" />
                <KV k="Food" v="9.4 lb" />
                <KV k="Water (max)" v="6.6 lb" />
                <div className="hr" style={{ margin: '4px 0' }} />
                <KV k="On back" v="34.0 lb" amber />
              </div>
              <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 10 }}><Icon name="gear" size={10} stroke={1.8}/> Open gear</button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

const DaySpineCell = ({ d, active, onClick }) => {
  const expTone = { low: 'pine', med: 'sky', high: 'amber', extreme: 'red' }[d.exp];
  return (
    <button
      onClick={onClick}
      style={{
        flex: '0 0 auto', minWidth: 130,
        padding: '12px 14px',
        background: active ? 'var(--color-amber-glow)' : 'transparent',
        border: 'none',
        borderRight: '1px solid var(--color-border)',
        borderBottom: active ? '2px solid var(--color-amber)' : '2px solid transparent',
        marginBottom: -1,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 800, color: active ? 'var(--color-amber)' : 'var(--color-text)' }}>D{d.n}</span>
        <span className="meta" style={{ fontSize: 8 }}>{d.date}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-mid)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6 }}>
        {d.camp}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text)' }}>{d.miles}<span style={{ fontSize: 8, color: 'var(--color-text-dim)', marginLeft: 2 }}>mi</span></span>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: `var(--color-${expTone})` }} />
      </div>
    </button>
  );
};

const MiniStat = ({ v, l }) => (
  <div style={{ textAlign: 'right' }}>
    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, color: 'var(--color-amber)', lineHeight: 1 }}>{v}</div>
    <div className="meta" style={{ fontSize: 8 }}>{l}</div>
  </div>
);

const ConditionTile = ({ icon, tone, k, v, detail }) => (
  <div style={{
    padding: 10, borderRadius: 6,
    background: `var(--color-${tone}-dim)`,
    border: `1px solid var(--color-${tone}-border)`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <Icon name={icon} size={12} stroke={1.8} style={{ color: `var(--color-${tone})` }} />
      <span className="meta" style={{ fontSize: 8 }}>{k}</span>
    </div>
    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, color: `var(--color-${tone})`, textTransform: 'uppercase' }}>{v}</div>
    <div className="meta" style={{ fontSize: 8, marginTop: 2, textTransform: 'none', letterSpacing: 0 }}>{detail}</div>
  </div>
);

const WP = ({ n, tone, name, miles, note, last }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '40px 1fr auto',
    alignItems: 'center', gap: 10,
    padding: '8px 12px',
    borderBottom: last ? 'none' : '1px solid var(--color-border)',
  }}>
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
      color: `var(--color-${tone})`,
      padding: '2px 4px', borderRadius: 3,
      background: `var(--color-${tone}-dim)`,
      border: `1px solid var(--color-${tone}-border)`,
      textAlign: 'center',
    }}>{n}</span>
    <div>
      <div style={{ fontSize: 11, color: 'var(--color-text)', fontWeight: 500 }}>{name}</div>
      <div className="meta" style={{ fontSize: 8, textTransform: 'none', letterSpacing: 0 }}>{note}</div>
    </div>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-mid)' }}>{miles}<span style={{ fontSize: 8, color: 'var(--color-text-dim)', marginLeft: 2 }}>mi</span></span>
  </div>
);

const Issue = ({ tone, text }) => (
  <div style={{
    display: 'flex', gap: 8, alignItems: 'flex-start',
    padding: '6px 8px', borderRadius: 4,
    borderLeft: `2px solid var(--color-${tone})`,
    background: `var(--color-${tone}-dim)`,
    marginBottom: 4,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: `var(--color-${tone})`, marginTop: 5, flexShrink: 0 }} />
    <span style={{ fontSize: 10, color: 'var(--color-text-mid)', lineHeight: 1.5 }}>{text}</span>
  </div>
);

const KV = ({ k, v, amber }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: 'var(--color-text-dim)' }}>{k}</span>
    <span style={{ color: amber ? 'var(--color-amber)' : 'var(--color-text)', fontWeight: 600 }}>{v}</span>
  </div>
);

window.V2Spine = V2Spine;
