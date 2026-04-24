export function MapEmptyState() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        background: 'var(--bg)',
      }}
    >
      <div style={{ fontSize: 32, opacity: 0.15 }}>🗺</div>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          textAlign: 'center',
          maxWidth: 220,
          lineHeight: 1.8,
        }}
      >
        Import a planned route or GPS track in the right panel, or add a waypoint below to render
        the map
      </p>
    </div>
  )
}