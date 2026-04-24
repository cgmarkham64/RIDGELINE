import type { Trip } from '../../types'
import { GpxMapSection } from './GpxMapSection'

interface Props {
  trip: Trip
  onTripUpdated: (trip: Trip) => void
  activeTab?: string
}

export function TripRightPanel({ trip, onTripUpdated, activeTab }: Props) {
  const isMapTab = activeTab === 'map'

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        background: 'var(--surface)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 14px',
      }}
    >
      {!isMapTab && (
        <RpSection label="Route Map">
          <GpxMapSection trip={trip} onTripUpdated={onTripUpdated} showMap={true} />
        </RpSection>
      )}
      <RpSection label="Elevation Profile">
        <ComingSoon />
      </RpSection>
      <RpSection label="Waypoints">
        <ComingSoon />
      </RpSection>
      <RpSection label="Weight Breakdown">
        <ComingSoon />
      </RpSection>
      {!isMapTab && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 16,
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            letterSpacing: '0.06em',
            color: 'var(--text-dim)',
            lineHeight: 1.8,
          }}
        >
          Map data &copy;{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--text-dim)', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            OpenStreetMap
          </a>{' '}
          contributors, tiles by{' '}
          <a
            href="https://carto.com/attributions"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--text-dim)', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            CARTO
          </a>
        </div>
      )}
    </div>
  )
}

function RpSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          paddingBottom: 8,
          marginBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function ComingSoon() {
  return (
    <div
      style={{
        background: 'var(--surface2)',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '22px 16px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
        }}
      >
        Coming soon
      </p>
    </div>
  )
}
