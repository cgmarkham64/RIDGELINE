// v1-brief.jsx — "The Brief"
// Single-page mission document. No wizard; you scroll through one cohesive
// plan with editable blocks. Left has a ribbon TOC; right has a sticky map
// + permit/readiness card.

const V1Brief = () => {
  const [activeSec, setActiveSec] = React.useState('route');
  const sections = [
    { id: 'overview',   num: '01', title: 'Overview',          icon: 'plan'    },
    { id: 'route',      num: '02', title: 'Route & Map',       icon: 'map'     },
    { id: 'days',       num: '03', title: 'Day-by-day',        icon: 'mountain'},
    { id: 'logistics',  num: '04', title: 'Logistics',         icon: 'plane'   },
    { id: 'permits',    num: '05', title: 'Permits',           icon: 'permit'  },
    { id: 'food',       num: '06', title: 'Food & water',      icon: 'water'   },
    { id: 'gear',       num: '07', title: 'Gear loadout',      icon: 'gear'    },
    { id: 'weather',    num: '08', title: 'Weather window',    icon: 'sun'     },
    { id: 'export',     num: '09', title: 'Export to phone',   icon: 'phone'   },
  ];

  return (
    <div className="app-frame" style={{ flexDirection: 'row' }}>
      <AppRail active="plan" />

      {/* Left TOC */}
      <aside style={{
        width: 200, flexShrink: 0,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        padding: '14px 0',
      }}>
        <div style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="kicker" style={{ marginBottom: 6 }}>Planning</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800 }}>{MOCK_TRIP.title}</div>
          <div className="meta" style={{ marginTop: 4, fontSize: 8, textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>{MOCK_TRIP.dateRange}</div>
        </div>
        <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 1, flex: 1, overflowY: 'auto' }}>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSec(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: activeSec === s.id ? 'var(--color-amber-glow)' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${activeSec === s.id ? 'var(--color-amber)' : 'transparent'}`,
                color: activeSec === s.id ? 'var(--color-amber)' : 'var(--color-text-mid)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.06em',
                transition: 'all 0.12s',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-dim)', minWidth: 14 }}>{s.num}</span>
              <Icon name={s.icon} size={13} stroke={1.6} />
              <span style={{ fontSize: 11, textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{s.title}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
          <div className="kicker" style={{ marginBottom: 6, fontSize: 8 }}>Readiness</div>
          <ProgressBar value={62} tone="amber" />
          <div className="meta" style={{ marginTop: 6, fontSize: 8 }}>14 / 22 items</div>
        </div>
      </aside>

      {/* Center scroll */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <HeroBand
          kicker={MOCK_TRIP.location}
          title={MOCK_TRIP.title}
          subtitle={`${MOCK_TRIP.dateRange} · ${MOCK_TRIP.days} days · planning brief`}
          right={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sky btn-sm"><Icon name="edit" size={11} stroke={2}/>Edit brief</button>
                <button className="btn btn-pine btn-sm"><Icon name="phone" size={11} stroke={2}/>To phone</button>
                <button className="btn btn-primary btn-sm">Lock plan</button>
              </div>
              <StatStrip items={[
                { value: MOCK_TRIP.days, label: 'days' },
                { value: MOCK_TRIP.miles, label: 'miles' },
                { value: MOCK_TRIP.elev, label: 'elev. gain' },
                { value: MOCK_TRIP.weight, label: 'on back' },
              ]} />
            </div>
          }
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 22, padding: '22px 26px 60px' }}>
          {/* Document column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* 01 OVERVIEW */}
            <section id="overview">
              <SectionLabel num="01">Overview</SectionLabel>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1.3,
                color: 'var(--color-text)',
                marginBottom: 14,
                letterSpacing: '-0.005em',
                textWrap: 'pretty',
              }}>
                A high-route traverse of the Sierra crest from Onion Valley to Whitney Portal — eight days, four off-trail passes, and three nights above 12,000 ft. Self-supported, three of us.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12 }}>
                <Stat value={MOCK_TRIP.days}    label="days"     tone="amber" />
                <Stat value={MOCK_TRIP.miles}   label="miles"    tone="amber" />
                <Stat value={MOCK_TRIP.elev}    label="elev"     tone="amber" />
                <Stat value="3"                 label="party"    tone="pine"  />
              </div>
            </section>

            {/* 02 ROUTE */}
            <section id="route">
              <SectionLabel num="02">Route &amp; map</SectionLabel>
              <div style={{ height: 240, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <MapCanvas planned={true} label="PLANNED · GPX IMPORTED" />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                <Pill icon="pin" tone="pine">TH · Onion Valley</Pill>
                <Pill icon="tent" tone="sky">C1 · Kearsarge</Pill>
                <Pill icon="tent" tone="sky">C2 · Center Basin</Pill>
                <Pill icon="mountain" tone="amber">Pass · Forester 13,180</Pill>
                <Pill icon="tent" tone="sky">C7 · Trail Crest</Pill>
                <Pill icon="pin" tone="amber">END · Whitney Portal</Pill>
              </div>
            </section>

            {/* 03 DAYS */}
            <section id="days">
              <SectionLabel num="03" action={<button className="btn btn-ghost btn-sm" style={{marginLeft: 8}}><Icon name="plus" size={11} stroke={2}/>Add day</button>}>
                Day-by-day
              </SectionLabel>
              <div className="card" style={{ overflow: 'hidden' }}>
                {MOCK_DAYS.slice(0, 5).map((d, i) => (
                  <DayRow key={d.n} day={d} last={i === 4} />
                ))}
                <div style={{ padding: '10px 14px', textAlign: 'center', borderTop: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-dim)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  + 3 more days
                </div>
              </div>
            </section>

            {/* 04 LOGISTICS */}
            <section id="logistics">
              <SectionLabel num="04">Logistics</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                <LogCard icon="plane" tone="sky" title="SFO → BIH" body={[
                  ['Aug 11', 'Alaska 1238 · 6:40am'], ['Conf', 'XKZ4N9'],
                ]} />
                <LogCard icon="bus" tone="sky" title="Lone Pine → TH shuttle" body={[
                  ['Aug 12', 'ESTA Eastern Sierra · 7:30am'], ['Confirmation', '#218-44'],
                ]} />
                <LogCard icon="plane" tone="pine" title="Whitney Portal → SFO return" body={[
                  ['Aug 19', 'Alaska 0915 · 10:15pm'], ['Conf', 'PT9V2L'],
                ]} />
                <LogCard icon="bus" tone="pine" title="Portal → Lone Pine pickup" body={[
                  ['Aug 19', 'Lone Pine Hostel shuttle · 4:00pm'], ['Confirmation', 'phone hold'],
                ]} />
              </div>
            </section>

            {/* 05 PERMITS */}
            <section id="permits">
              <SectionLabel num="05">Permits</SectionLabel>
              <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'var(--color-amber-dim)', border: '1px solid var(--color-amber-border)' }}>
                  <Icon name="permit" size={24} stroke={1.6} style={{ color: 'var(--color-amber)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap: 10 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700 }}>Mt. Whitney Zone — overnight</div>
                    <Pill tone="amber">Lottery</Pill>
                  </div>
                  <div className="meta" style={{ marginTop: 6, fontSize: 10, color: 'var(--color-text-mid)', letterSpacing: 0, textTransform: 'none' }}>
                    recreation.gov · Inyo National Forest · entry quota 60/day
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
                    <KeyVal k="Lottery opens"  v="Feb 1" />
                    <KeyVal k="Lottery closes" v="Mar 15" />
                    <KeyVal k="Results"        v="Mar 24" />
                    <KeyVal k="Walk-up backup" v="Day-of, 11AM" />
                  </div>
                </div>
                <button className="btn btn-pine btn-sm">Set reminder</button>
              </div>
            </section>

            {/* 06 FOOD */}
            <section id="food">
              <SectionLabel num="06">Food &amp; water</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>Calorie target</div>
                    <Pill tone="amber">3,400/day</Pill>
                  </div>
                  <ProgressBar value={84} tone="amber" />
                  <div className="meta" style={{ marginTop: 10, fontSize: 9, color: 'var(--color-text-mid)' }}>27,200 kcal · 8 days · ≈ 9.4 lb dry</div>
                </div>
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>Water sources</div>
                    <Pill tone="sky" icon="water">7 reliable</Pill>
                  </div>
                  <div className="meta" style={{ fontSize: 9, color: 'var(--color-text-mid)', lineHeight: 1.7 }}>
                    Day 7 (Whitney summit push) requires 4L cache at Trail Crest. Treat with Sawyer Squeeze; no chemical backup needed below 12,500 ft.
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sticky right column */}
          <aside style={{ position: 'sticky', top: 0, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Permit countdown */}
            <div className="card" style={{ padding: 14, background: 'linear-gradient(180deg, var(--color-surface), var(--color-surface-2))' }}>
              <div className="kicker kicker-amber" style={{ marginBottom: 8 }}>
                <Icon name="permit" size={9} stroke={2} style={{ marginRight: 4 }} /> Critical date
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Whitney lottery opens</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 800, color: 'var(--color-amber)', lineHeight: 1 }}>27</div>
                <div className="meta" style={{ fontSize: 9 }}>days · feb 1 · 7am PT</div>
              </div>
              <div className="hr" style={{ margin: '10px 0' }} />
              <button className="btn btn-primary btn-block btn-sm">Set reminder</button>
            </div>

            {/* Readiness card */}
            <div className="card" style={{ padding: 14 }}>
              <div className="kicker" style={{ marginBottom: 10 }}>Readiness</div>
              <ReadyRow done label="Route imported"      detail="GPX · 78mi · 14 wpts" />
              <ReadyRow done label="Camps assigned"      detail="7 of 7 nights" />
              <ReadyRow done label="Travel booked"      detail="2 flights · shuttle" />
              <ReadyRow      label="Permit applied"     detail="Lottery opens Feb 1" pending />
              <ReadyRow      label="Food plan"          detail="9.4 lb · 3,400 kcal/day" pending />
              <ReadyRow      label="Loadout finalized"  detail="34 lb base · trim 2 lb" />
              <ReadyRow      label="Weather window"     detail="check at T-7 days" />
              <ReadyRow      label="Phone export"       detail="GPX + PDF" />
              <div className="hr" style={{ margin: '10px 0' }} />
              <ProgressBar value={62} tone="amber" />
              <div className="meta" style={{ marginTop: 6, fontSize: 9, textAlign: 'center' }}>14 of 22 items</div>
            </div>

            {/* Party */}
            <div className="card" style={{ padding: 14 }}>
              <div className="kicker" style={{ marginBottom: 10 }}>Party (3)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { i: 'CM', n: 'Cameron M.',   r: 'You · trip lead'   },
                  { i: 'JT', n: 'Jordan T.',    r: 'Has GPS · permit'  },
                  { i: 'LK', n: 'Liv K.',       r: 'Driving Lone Pine' },
                ].map((p) => (
                  <div key={p.i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-3)', border: '1px solid var(--color-border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: 10, fontWeight: 800, color: 'var(--color-amber)' }}>{p.i}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.n}</div>
                      <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>{p.r}</div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }}><Icon name="plus" size={10} stroke={2}/>Invite</button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

const DayRow = ({ day, last }) => {
  const expTone = { low: 'pine', med: 'sky', high: 'amber', extreme: 'red' }[day.exp];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '60px 1fr 80px 90px 90px',
      gap: 14,
      padding: '12px 16px',
      alignItems: 'center',
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: 'var(--color-amber)', lineHeight: 1 }}>D{day.n}</div>
        <div className="meta" style={{ fontSize: 8, marginTop: 4 }}>{day.date}</div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 2 }}>{day.to}</div>
        <div className="meta" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, color: 'var(--color-text-dim)' }}>
          camp · {day.camp}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{day.miles}</div>
        <div className="meta" style={{ fontSize: 8 }}>miles</div>
      </div>
      <Pill icon="water" tone="sky">{day.water}</Pill>
      <Pill icon="sun"   tone={expTone}>exp · {day.exp}</Pill>
    </div>
  );
};

const LogCard = ({ icon, tone, title, body }) => (
  <div className="card" style={{ padding: 14, display: 'flex', gap: 12 }}>
    <div style={{
      width: 36, height: 36, borderRadius: 6, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `var(--color-${tone}-dim)`,
      border: `1px solid var(--color-${tone}-border)`,
      color: `var(--color-${tone})`,
    }}>
      <Icon name={icon} size={16} stroke={1.6} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {body.map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span className="meta" style={{ fontSize: 9 }}>{k}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const KeyVal = ({ k, v }) => (
  <div>
    <div className="meta" style={{ fontSize: 8 }}>{k}</div>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text)', marginTop: 2 }}>{v}</div>
  </div>
);

const ReadyRow = ({ done, pending, label, detail }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
    <div style={{
      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: done ? 'var(--color-pine-dim)' : pending ? 'var(--color-amber-dim)' : 'transparent',
      border: `1px solid ${done ? 'var(--color-pine-border)' : pending ? 'var(--color-amber-border)' : 'var(--color-border)'}`,
      color: done ? 'var(--color-pine)' : pending ? 'var(--color-amber)' : 'var(--color-text-dim)',
    }}>
      {done ? <Icon name="check" size={9} stroke={2.5} /> : pending ? <Icon name="dot" size={9} /> : null}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: done ? 'var(--color-text-mid)' : 'var(--color-text)', fontWeight: 500 }}>{label}</div>
      <div className="meta" style={{ fontSize: 8, textTransform: 'none', letterSpacing: 0 }}>{detail}</div>
    </div>
  </div>
);

window.V1Brief = V1Brief;
