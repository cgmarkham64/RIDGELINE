import { useState } from 'react'
import type { Trip } from '../../types'
import { GpxMapSection } from './GpxMapSection'
import { ElevationProfile } from './ElevationProfile'
import { WaypointList } from './WaypointList'

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

function ComingSoon() {
  return (
    <div className="bg-surface-2 border border-dashed border-border rounded-md px-4 py-[22px] text-center">
      <p className="font-mono text-[9px] tracking-widest uppercase text-text-dim">
        Coming soon
      </p>
    </div>
  )
}