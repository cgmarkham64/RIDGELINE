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
    <div className="w-[300px] shrink-0 border-l border-border bg-surface overflow-y-auto flex flex-col px-3.5 py-[18px]">
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
        <div className="mt-auto pt-4 font-mono text-[9px] tracking-[0.06em] text-text-dim leading-[1.8]">
          Map data &copy;{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="text-text-dim underline underline-offset-[2px]"
          >
            OpenStreetMap
          </a>{' '}
          contributors, tiles by{' '}
          <a
            href="https://carto.com/attributions"
            target="_blank"
            rel="noreferrer"
            className="text-text-dim underline underline-offset-[2px]"
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
    <div className="mb-6">
      <div className="font-heading text-[9px] font-bold tracking-[0.2em] uppercase text-text-dim pb-2 mb-3 border-b border-border">
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
      <p className="font-mono text-[9px] tracking-widest uppercase text-text-dim leading-[1.7]">
        No waypoints yet — add them from the Map tab
      </p>
    )
  }

  const sorted = waypoints.slice().sort((a, b) => b.lon - a.lon || b.lat - a.lat)

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map((wp) => {
        const isActive = wp.id === activeWaypointId
        const color = WAYPOINT_COLOR[wp.type]
        return (
          <div
            key={wp.id}
            ref={isActive ? activeRef : null}
            onClick={() => onWaypointClick?.(wp.id)}
            className="flex flex-col gap-0 px-2.5 py-[7px] rounded-md cursor-pointer transition-[background,border-color] duration-150"
            style={{
              background: isActive ? `${color}12` : 'var(--surface2)',
              border: `1px solid ${isActive ? color + '66' : color + '33'}`,
            }}
          >
            <div className="flex items-center gap-2">
              <WaypointIcon type={wp.type} size={16} />
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[12px] text-text overflow-hidden text-ellipsis whitespace-nowrap">
                  {wp.label}
                </div>
                <div className="flex items-center gap-1.5 mt-[2px]">
                  <span
                    className="font-mono text-[8px] tracking-[0.08em] uppercase"
                    style={{ color }}
                  >
                    {WAYPOINT_LABEL[wp.type]}
                  </span>
                  <span className="font-mono text-[8px] tracking-[0.04em] text-text-dim">
                    {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
            {isActive && wp.notes && (
              <div
                className="mt-[7px] pt-[7px] font-sans text-[11px] text-text-dim leading-normal"
                style={{ borderTop: `1px solid ${color}33` }}
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
    <div className="bg-surface-2 border border-dashed border-border rounded-md px-4 py-[22px] text-center">
      <p className="font-mono text-[9px] tracking-widest uppercase text-text-dim">
        Coming soon
      </p>
    </div>
  )
}