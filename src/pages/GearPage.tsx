export function GearPage() {
  return <ComingSoon label="Gear" />
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: 'var(--bg)',
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
        }}
      >
        Coming soon
      </div>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 28,
          fontWeight: 800,
          color: 'var(--text)',
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </div>
    </div>
  )
}
