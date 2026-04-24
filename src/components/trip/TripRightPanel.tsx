import { useState, useRef, useEffect } from 'react'
import type { Trip, Waypoint } from '../../types'
import { GpxMapSection } from './GpxMapSection'
import { ElevationProfile } from './ElevationProfile'
import { WaypointIcon } from '../map/WaypointIcon'
import { WAYPOINT_COLOR, WAYPOINT_LABEL } from '../map/constants'

interface Props {
  trip: Trip
  onTripUpdated: (trip: Trip) => void
  activeTab?: string
}

export function TripRightPanel({ trip, onTripUpdated, activeTab }: Props) {
  const isMapTab = activeTab === 'map'
  const [activeWaypointId, setActiveWaypointId] = useState<string | null>(null)

  function handleWaypointClick(id: string) {
    setActiveWaypointId((prev) => (prev === id ? null : id))
  }

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
          <GpxMapSection
            trip={trip}
            onTripUpdated={onTripUpdated}
            showMap={true}
            activeWaypointId={activeWaypointId}
            onWaypointClick={handleWaypointClick}
          />
        </RpSection>
      )}
      <RpSection label="Elevation Profile">
        <ElevationProfile
          planned={trip.gpxPlanned}
          gpxTracks={trip.gpxTracks}
          waypoints={trip.waypoints}
          activeWaypointId={activeWaypointId}
          onWaypointClick={handleWaypointClick}
        />
      </RpSection>
      {!isMapTab && (
        <RpSection label="Waypoints">
          <WaypointList
            waypoints={trip.waypoints ?? []}
            activeWaypointId={activeWaypointId}
            onWaypointClick={handleWaypointClick}
          />
        </RpSection>
      )}
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

function WaypointList({
  waypoints,
  activeWaypointId,
  onWaypointClick,
}: {
  waypoints: Waypoint[]
  activeWaypointId?: string | null
  onWaypointClick?: (id: string) => void
}) {
  const activeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (activeWaypointId && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeWaypointId])

  if (waypoints.length === 0) {
    return (
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          lineHeight: 1.7,
        }}
      >
        No waypoints yet — add them from the Map tab
      </p>
    )
  }

  const sorted = waypoints.slice().sort((a, b) => b.lon - a.lon || b.lat - a.lat)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sorted.map((wp) => {
        const isActive = wp.id === activeWaypointId
        const color = WAYPOINT_COLOR[wp.type]
        return (
          <div
            key={wp.id}
            ref={isActive ? activeRef : null}
            onClick={() => onWaypointClick?.(wp.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              padding: '7px 10px',
              background: isActive ? `${color}12` : 'var(--surface2)',
              border: `1px solid ${isActive ? color + '66' : color + '33'}`,
              borderRadius: 'var(--r-md)',
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <WaypointIcon type={wp.type} size={16} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {wp.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 7,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color,
                    }}
                  >
                    {WAYPOINT_LABEL[wp.type]}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 7,
                      letterSpacing: '0.04em',
                      color: 'var(--text-dim)',
                    }}
                  >
                    {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
            {isActive && wp.notes && (
              <div
                style={{
                  marginTop: 7,
                  paddingTop: 7,
                  borderTop: `1px solid ${color}33`,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  color: 'var(--text-dim)',
                  lineHeight: 1.5,
                }}
              >
                {wp.notes}
              </div>
            )}
          </div>
        )
      })}
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
