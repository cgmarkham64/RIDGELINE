import { useEffect, useRef } from 'react'
import type { Waypoint } from '../../types'
import { WaypointListItem } from './WaypointListItem'

export function WaypointList({
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
      <p className="font-mono text-label tracking-widest uppercase text-text-dim leading-[1.7]">
        No waypoints yet — add them from the Map tab
      </p>
    )
  }

  const sorted = waypoints.slice().sort((a, b) => b.lon - a.lon || b.lat - a.lat)

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map((wp) => (
        <WaypointListItem
          key={wp.id}
          wp={wp}
          isActive={wp.id === activeWaypointId}
          activeRef={wp.id === activeWaypointId ? activeRef : null}
          onClick={() => onWaypointClick?.(wp.id)}
        />
      ))}
    </div>
  )
}
