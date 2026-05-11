// app.jsx — RIDGELINE Plan-a-Trip workflow explorations

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "accentHue": "amber",
  "showAppRail": true,
  "labelStyle": "mono"
}/*EDITMODE-END*/;

// Apply tweaks to <html> as data attrs so child CSS can react
function applyTweaks(t) {
  document.documentElement.dataset.density = t.density;
  document.documentElement.dataset.labelStyle = t.labelStyle;
  // Accent: remap --color-amber pair to chosen hue (kept tonal)
  const map = {
    amber: { c: '#f0a030', dim: 'rgba(240,160,48,0.08)', glow: 'rgba(240,160,48,0.13)', border: 'rgba(240,160,48,0.22)' },
    sky:   { c: '#5ab4dc', dim: 'rgba(90,180,220,0.08)',  glow: 'rgba(90,180,220,0.16)',  border: 'rgba(90,180,220,0.28)' },
    pine:  { c: '#5aa478', dim: 'rgba(90,164,120,0.08)',  glow: 'rgba(90,164,120,0.16)',  border: 'rgba(90,164,120,0.30)' },
    ember: { c: '#e76b3a', dim: 'rgba(231,107,58,0.08)',  glow: 'rgba(231,107,58,0.14)',  border: 'rgba(231,107,58,0.26)' },
  };
  const v = map[t.accentHue] || map.amber;
  const r = document.documentElement.style;
  r.setProperty('--color-amber', v.c);
  r.setProperty('--color-amber-dim', v.dim);
  r.setProperty('--color-amber-glow', v.glow);
  r.setProperty('--color-amber-border', v.border);
}

const App = () => {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { applyTweaks(t); }, [t]);

  return (
    <>
      <DesignCanvas>
        <DCSection
          id="planning-flows"
          title="Plan-a-Trip · 3 directions"
          subtitle="Three different mental models for the planning workflow. Each is a fullscreen prototype — drag to compare, click to focus."
        >
          <DCArtboard id="v1-brief"   label="V1 · The Brief — single-page mission doc"   width={1280} height={820}>
            <V1Brief />
          </DCArtboard>

          <DCArtboard id="v2-spine"   label="V2 · The Itinerary Spine — day timeline"     width={1280} height={820}>
            <V2Spine />
          </DCArtboard>

          <DCArtboard id="v3-stages"  label="V3 · The Stages Wizard — guided checkout"    width={1280} height={820}>
            <V3Stages />
          </DCArtboard>
        </DCSection>

        <DCSection
          id="permits"
          title="Permits — adding them to a trip"
          subtitle="Two contrasting approaches for the Permits stage. Both handle adaptive permit types; both fall back to catalog search and free-form. Pick one — or steal pieces."
        >
          <DCArtboard id="permits-list" label="A · List-first — auto-suggest stack (Sierra High Route)" width={1280} height={1280}>
            <PermitsHostFrame>
              <PermitsListFirst profile="sierra" onJump={() => {}} />
            </PermitsHostFrame>
          </DCArtboard>

          <DCArtboard id="permits-map" label="B · Map-first — zone-driven (Indian Peaks loop)" width={1280} height={1280}>
            <PermitsHostFrame>
              <PermitsMapFirst profile="indianpeaks" onJump={() => {}} />
            </PermitsHostFrame>
          </DCArtboard>

          <DCArtboard id="permits-list-ip" label="A · List-first applied to Indian Peaks" width={1280} height={1280}>
            <PermitsHostFrame>
              <PermitsListFirst profile="indianpeaks" onJump={() => {}} />
            </PermitsHostFrame>
          </DCArtboard>

          <DCArtboard id="permits-map-sierra" label="B · Map-first applied to Sierra" width={1280} height={1280}>
            <PermitsHostFrame>
              <PermitsMapFirst profile="sierra" onJump={() => {}} />
            </PermitsHostFrame>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="notes"
          title="How they differ"
          subtitle="Pick what fits the user's mental model — or mix elements across them."
        >
          <DCArtboard id="comparison" label="Comparison" width={1280} height={420}>
            <ComparisonCard />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Density">
          <TweakRadio
            value={t.density}
            onChange={(v) => setTweak('density', v)}
            options={[
              { label: 'Compact',     value: 'compact' },
              { label: 'Comfortable', value: 'comfortable' },
              { label: 'Spacious',    value: 'spacious' },
            ]}
          />
        </TweakSection>

        <TweakSection title="Accent">
          <TweakColor
            value={t.accentHue}
            onChange={(v) => setTweak('accentHue', v)}
            options={[
              { label: 'Amber', value: 'amber', color: '#f0a030' },
              { label: 'Sky',   value: 'sky',   color: '#5ab4dc' },
              { label: 'Pine',  value: 'pine',  color: '#5aa478' },
              { label: 'Ember', value: 'ember', color: '#e76b3a' },
            ]}
          />
        </TweakSection>

        <TweakSection title="Chrome">
          <TweakToggle
            label="Show app rail in mockups"
            value={t.showAppRail}
            onChange={(v) => setTweak('showAppRail', v)}
          />
          <TweakRadio
            label="Section labels"
            value={t.labelStyle}
            onChange={(v) => setTweak('labelStyle', v)}
            options={[
              { label: 'Mono',    value: 'mono' },
              { label: 'Display', value: 'display' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
};

// Lightweight host frame so the Permits stage views display with the
// surrounding wizard chrome (rail + header + footer) without re-rendering V3.
const PermitsHostFrame = ({ children }) => (
  <div className="app-frame" style={{ flexDirection: 'row' }}>
    <AppRail active="plan" />
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="kicker kicker-amber" style={{ marginBottom: 6 }}>{MOCK_TRIP.location}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800 }}>{MOCK_TRIP.title}</div>
      </div>
      <div style={{ padding: 6 }}>
        {[
          { n: '01', label: 'Route',   state: 'done' },
          { n: '02', label: 'Days',    state: 'done' },
          { n: '03', label: 'Permits', state: 'active' },
          { n: '04', label: 'Food',    state: 'progress' },
          { n: '05', label: 'Gear',    state: 'idle' },
          { n: '06', label: 'Depart',  state: 'idle' },
        ].map(s => (
          <div key={s.n} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px',
            background: s.state === 'active' ? 'var(--color-amber-glow)' : 'transparent',
            borderLeft: `2px solid ${s.state === 'active' ? 'var(--color-amber)' : 'transparent'}`,
            borderRadius: 6, marginBottom: 2,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background:
                s.state === 'done' ? 'var(--color-pine-dim)' :
                s.state === 'active' ? 'var(--color-amber-dim)' :
                s.state === 'progress' ? 'var(--color-amber-dim)' :
                'var(--color-surface-2)',
              border: '1px solid ' + (
                s.state === 'done' ? 'var(--color-pine-border)' :
                s.state === 'active' ? 'var(--color-amber-border)' :
                s.state === 'progress' ? 'var(--color-amber-border)' :
                'var(--color-border)'),
              color:
                s.state === 'done' ? 'var(--color-pine)' :
                s.state === 'active' ? 'var(--color-amber)' :
                s.state === 'progress' ? 'var(--color-amber)' :
                'var(--color-text-dim)',
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
            }}>{s.state === 'done' ? '✓' : s.n}</span>
            <span style={{
              fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700,
              color: s.state === 'active' ? 'var(--color-amber)' : 'var(--color-text)',
            }}>{s.label}</span>
          </div>
        ))}
      </div>
    </aside>
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ padding: '20px 32px 14px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span className="kicker" style={{ color: 'var(--color-text-dim)' }}>Plan</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-dim)' }}>›</span>
          <span className="kicker" style={{ color: 'var(--color-amber)' }}>Stage 03 · Permits</span>
        </div>
        <h1 style={{ fontSize: 24, letterSpacing: '-0.005em' }}>Permits & travel logistics.</h1>
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-text-mid)' }}>
          Lock down access. We'll surface critical dates as reminders on the trip card.
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 32px 60px' }}>
        {children}
      </div>
    </main>
  </div>
);

const ComparisonCard = () => (
  <div style={{ width: '100%', height: '100%', padding: 28, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
      {[
        {
          n: 'V1', name: 'The Brief',
          tag: 'Document',
          when: 'You think planning ≈ writing a trip report in advance.',
          pros: ['Everything visible at once', 'Easy to share / print', 'No "where am I?" friction'],
          cons: ['No structure for new planners', 'Empty states feel daunting'],
        },
        {
          n: 'V2', name: 'The Itinerary Spine',
          tag: 'Timeline',
          when: 'You think planning ≈ filling in a day-by-day schedule.',
          pros: ['Map + day editor always visible', 'Strongest match for your existing day-selector pattern', 'Spatial scrubbing across days'],
          cons: ['Trip-wide concerns (permits, food) feel side-tracked', 'Less suited for first-time planners'],
        },
        {
          n: 'V3', name: 'The Stages Wizard',
          tag: 'Checkout',
          when: 'You think planning ≈ a sequence of decisions to commit to.',
          pros: ['Closest to "checkout" mental model', 'Hand-holding for low-tech-skill users', 'Built-in completeness check'],
          cons: ['Can feel slow for power users', 'Bouncing between stages is awkward'],
        },
      ].map((c) => (
        <div key={c.n} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              padding: '3px 7px', borderRadius: 4,
              background: 'var(--color-amber-dim)', color: 'var(--color-amber)',
              border: '1px solid var(--color-amber-border)',
            }}>{c.n}</span>
            <Pill>{c.tag}</Pill>
          </div>
          <h2 style={{ fontSize: 22, letterSpacing: '-0.005em' }}>{c.name}</h2>
          <div style={{ fontSize: 12, color: 'var(--color-text-mid)', fontStyle: 'italic', lineHeight: 1.5 }}>{c.when}</div>
          <div className="hr" />
          <div>
            <div className="kicker tone-pine" style={{ marginBottom: 6 }}>Strengths</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {c.pros.map((p, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--color-text-mid)' }}>
                  <Icon name="check" size={11} stroke={2.5} style={{ color: 'var(--color-pine)', flexShrink: 0, marginTop: 4 }} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 6, color: 'var(--color-red)' }}>Watch out for</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {c.cons.map((p, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--color-text-dim)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-red)', flexShrink: 0, marginTop: 6, opacity: 0.6 }} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
    <div style={{
      marginTop: 'auto', padding: '12px 16px',
      borderRadius: 8, border: '1px dashed var(--color-border-mid)',
      background: 'var(--color-surface)',
      display: 'flex', gap: 14, alignItems: 'center',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: 'var(--color-amber)',
        padding: '3px 8px', border: '1px solid var(--color-amber-border)',
        background: 'var(--color-amber-dim)', borderRadius: 99,
      }}>Recommendation</span>
      <span style={{ fontSize: 13, color: 'var(--color-text-mid)', lineHeight: 1.55, flex: 1 }}>
        Given your stated user (low-tech-skill backpacker, mental model = "checkout"), <strong style={{ color: 'var(--color-text)' }}>V3</strong> is the safest first-run experience. But the <strong style={{ color: 'var(--color-text)' }}>itinerary spine</strong> from V2 should reappear inside V3 stage 02 — the day-by-day view is where your existing day-selector pattern shines. <strong style={{ color: 'var(--color-text)' }}>V1's right-rail readiness card</strong> is portable; consider promoting it into the trip detail view as a permanent fixture once a plan is locked.
      </span>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
